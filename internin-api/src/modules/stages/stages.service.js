import path from "node:path";
import fs from "node:fs";
import { eq, and, desc, gte } from "drizzle-orm";
import { resolveEntrepriseContextOrThrow, hasEntreprisePermission } from "../../utils/entrepriseContext.js";
import { db } from "../../db/index.js";
import { reconcileControleCentre } from "../administrateurs/controleCentre.service.js";
import {
  stages,
  stagiaires,
  entreprises,
  certificats,
  badges,
  utilisateurs,
  universites,
  contactsEntreprise,
  conventionsStage,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  journalStage,
  objectifsStage,
  tachesStage,
  competencesAcquisesStage,
  competences,
  journalActionsAdmin,
  affectationsSuperviseurStage,
  membresEquipe,
} from "../../db/schema.js";
import { genererCertificatPdf } from "../../utils/certificatPdf.js";
import { randomBytes } from "node:crypto";
import { creerNotification, emitNotificationCreated } from "../notifications/notifications.service.js";
import {
  getStageLifecycleStatus,
  isStageActivelyRunning,
  assertStageIsActive,
  daysUntilStart,
  stageStatusLabel,
  toYmd,
  calculerDateFinPrevueYmd,
  assertValidStageDates,
  computeInitialStageStatus,
} from "../../utils/stageLifecycle.js";
import { computeStageProgression } from "../../utils/stageProgression.js";
import {
  resolveSupervisionAccess,
  assertStageAccess,
} from "../superviseur/superviseur.service.js";

export async function getMonStage(idUtilisateurStagiaire) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) return null;

  const [stageRow] = await db
    .select({
      idStage: stages.idStage,
      idEntreprise: stages.idEntreprise,
      idContactSuperviseur: stages.idContactSuperviseur,
      idConvention: stages.idConvention,
      objectifsApprentissage: stages.objectifsApprentissage,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      statut: stages.statut,
      progressionPourcentage: stages.progressionPourcentage,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      secteurActivite: entreprises.secteurActivite,
      ville: entreprises.ville,
      pays: entreprises.pays,
      adresse: entreprises.adresse,
    })
    .from(stages)
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire));

  if (!stageRow) return null;

  // Superviseur : 1) contact entreprise (offre/convention)
  // 2) sinon affectation équipe (affectations_superviseur_stage) — source
  //    utilisée quand l'entreprise assigne un superviseur dans Mes stagiaires.
  let superviseur = null;
  if (stageRow.idContactSuperviseur) {
    const [contact] = await db
      .select({
        nom: contactsEntreprise.nom,
        fonction: contactsEntreprise.fonction,
        email: contactsEntreprise.email,
      })
      .from(contactsEntreprise)
      .where(eq(contactsEntreprise.idContact, stageRow.idContactSuperviseur));
    if (contact) {
      superviseur = { ...contact, source: "contact" };
    }
  }
  if (!superviseur) {
    const [aff] = await db
      .select({
        nom: membresEquipe.nom,
        email: membresEquipe.email,
        roleEquipe: membresEquipe.roleEquipe,
        idMembre: membresEquipe.idMembre,
      })
      .from(affectationsSuperviseurStage)
      .innerJoin(
        membresEquipe,
        eq(membresEquipe.idMembre, affectationsSuperviseurStage.idMembre),
      )
      .where(eq(affectationsSuperviseurStage.idStage, stageRow.idStage))
      .limit(1);
    if (aff) {
      superviseur = {
        nom: aff.nom,
        fonction: aff.roleEquipe || "Superviseur",
        email: aff.email,
        idMembre: aff.idMembre,
        source: "affectation",
      };
    }
  }

  let titrePoste = null;
  let modeTravail = null;
  if (stageRow.idConvention) {
    const [offreInfo] = await db
      .select({
        intitulePoste: offresFinales.intitulePoste,
        modeTravail: offresFinales.modeTravail,
      })
      .from(conventionsStage)
      .innerJoin(
        offresFinales,
        eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
      )
      .where(eq(conventionsStage.idConvention, stageRow.idConvention));
    if (offreInfo) {
      titrePoste = offreInfo.intitulePoste;
      modeTravail = offreInfo.modeTravail;
    }
  }

  const [objectifs, taches, competencesAcquises] = await Promise.all([
    db
      .select()
      .from(objectifsStage)
      .where(eq(objectifsStage.idStage, stageRow.idStage))
      .orderBy(desc(objectifsStage.dateCreation)),
    db
      .select()
      .from(tachesStage)
      .where(eq(tachesStage.idStage, stageRow.idStage))
      .orderBy(desc(tachesStage.dateCreation)),
    db
      .select({
        idAcquisition: competencesAcquisesStage.idAcquisition,
        idCompetence: competencesAcquisesStage.idCompetence,
        dateAcquisition: competencesAcquisesStage.dateAcquisition,
        nomCompetence: competences.nom,
        typeCompetence: competences.typeCompetence,
      })
      .from(competencesAcquisesStage)
      .innerJoin(
        competences,
        eq(competences.idCompetence, competencesAcquisesStage.idCompetence),
      )
      .where(eq(competencesAcquisesStage.idStage, stageRow.idStage))
      .orderBy(desc(competencesAcquisesStage.dateAcquisition)),
  ]);

  // Statut temporel = source de vérité (dates + interrompu)
  const statutEffectif = getStageLifecycleStatus(stageRow);
  // Persistance éventuelle si le stocké est obsolète (idempotent)
  if (
    stageRow.statut !== statutEffectif &&
    stageRow.statut !== "interrompu"
  ) {
    await db
      .update(stages)
      .set({
        statut: statutEffectif,
        ...(statutEffectif === "termine" && !stageRow.dateFinReelle
          ? { dateFinReelle: stageRow.dateFinPrevue }
          : {}),
      })
      .where(eq(stages.idStage, stageRow.idStage));
    stageRow.statut = statutEffectif;
  }

  const debutYmd = toYmd(stageRow.dateDebut);
  const finYmd = toYmd(stageRow.dateFinPrevue);
  const debut = debutYmd ? new Date(`${debutYmd}T12:00:00Z`) : new Date();
  const fin = finYmd ? new Date(`${finYmd}T12:00:00Z`) : debut;
  const now = new Date();

  // Progression unifiée (manuel → objectifs → tâches → temps)
  const progressionInfo = computeStageProgression(objectifs, taches, {
    progressionPourcentage: stageRow.progressionPourcentage,
    statutStocke: stageRow.statut,
    statutLifecycle: statutEffectif,
    dateDebut: stageRow.dateDebut,
    dateFinPrevue: stageRow.dateFinPrevue,
    dateFinReelle: stageRow.dateFinReelle,
  });
  const progressionCalculee =
    progressionInfo.percent != null ? progressionInfo.percent : 0;

  const joursAvantDebut = daysUntilStart(stageRow);
  const joursEcoules =
    statutEffectif === "a_venir"
      ? 0
      : Math.max(
          0,
          Math.floor((Math.min(now, fin) - debut) / (1000 * 60 * 60 * 24)),
        );
  const joursRestants =
    statutEffectif === "termine" || statutEffectif === "interrompu"
      ? 0
      : statutEffectif === "a_venir"
        ? joursAvantDebut
        : Math.max(0, Math.ceil((fin - now) / (1000 * 60 * 60 * 24)));
  const dureeTotaleJours = Math.max(
    1,
    Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)),
  );

  return {
    idStage: stageRow.idStage,
    objectifsApprentissage: stageRow.objectifsApprentissage,
    dateDebut: stageRow.dateDebut,
    dateFinPrevue: stageRow.dateFinPrevue,
    dateFinReelle: stageRow.dateFinReelle,
    // statut stocké synchronisé + alias explicites pour le frontend
    statut: statutEffectif,
    statutLabel: stageStatusLabel(statutEffectif),
    estAVenir: statutEffectif === "a_venir",
    estActif: statutEffectif === "actif",
    joursAvantDebut,
    // brut (saisie superviseur, peut être null)
    progressionPourcentage: stageRow.progressionPourcentage,
    // valeur d'affichage unifiée (manuel → objectifs → tâches → temps)
    progressionCalculee,
    progressionAffichee: progressionCalculee,
    progressionSource: progressionInfo?.source ?? null,
    progression: {
      percent: progressionInfo?.percent ?? progressionCalculee,
      source: progressionInfo?.source ?? null,
      done: progressionInfo?.done ?? null,
      total: progressionInfo?.total ?? null,
    },
    joursEcoules,
    joursRestants,
    dureeTotaleJours,
    titrePoste: titrePoste || "Stage",
    modeTravail: modeTravail || null,
    // Fonctionnalités de suivi réservées au stage actif
    suiviDisponible: statutEffectif === "actif",
    messagerieDisponible: statutEffectif === "actif",
    journalDisponible: statutEffectif === "actif",
    entreprise: {
      nomEntreprise: stageRow.nomEntreprise,
      logoUrl: stageRow.logoUrl,
      secteurActivite: stageRow.secteurActivite,
      ville: stageRow.ville,
      pays: stageRow.pays,
      adresse: stageRow.adresse,
    },
    nomEntreprise: stageRow.nomEntreprise,
    superviseur,
    objectifs,
    taches,
    competencesAcquises,
  };
}

export async function listMesStages(idUtilisateurEntreprise) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) return [];

  return db
    .select({
      idStage: stages.idStage,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      statut: stages.statut,
      objectifsApprentissage: stages.objectifsApprentissage,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      // Coordonnées visibles ici uniquement car le stage est actif — conforme
      // à la règle de confidentialité du Schéma BDD (§12).
      telephone: stagiaires.telephone,
      email: utilisateurs.email,
      nomUniversite: universites.nomUniversite,
      nomTuteur: contactsEntreprise.nom,
      titrePoste: offresStage.titre,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(
      utilisateurs,
      eq(stagiaires.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .leftJoin(
      universites,
      eq(stagiaires.idUniversite, universites.idUniversite),
    )
    .leftJoin(
      contactsEntreprise,
      eq(stages.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .innerJoin(
      conventionsStage,
      eq(stages.idConvention, conventionsStage.idConvention),
    )
    .innerJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(stages.idEntreprise, entreprise.idEntreprise));
}

// Clôture le stage, et génère automatiquement certificat + badge dans la
// même transaction — un stage terminé sans certificat n'a pas de sens.
export async function terminerStage(idUtilisateurEntreprise, idStage) {
  const ctx = await resolveEntrepriseContextOrThrow(idUtilisateurEntreprise);
  const entreprise = ctx.entreprise;

  // Permission métier : clôture réservée aux profils autorisés
  if (
    !ctx.isProprietaire &&
    !ctx.isAdminPrincipal &&
    !hasEntreprisePermission(ctx, "stagiaires.terminer")
  ) {
    const err = new Error(
      "Vous n'avez pas la permission de clôturer un stage.",
    );
    err.status = 403;
    throw err;
  }

  const [stage] = await db
    .select({
      idStage: stages.idStage,
      idStagiaire: stages.idStagiaire,
      idEntreprise: stages.idEntreprise,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      statut: stages.statut,
    })
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stage || stage.idEntreprise !== entreprise.idEntreprise) {
    const err = new Error("Vous n'êtes pas autorisé à clôturer ce stage");
    err.status = 403;
    throw err;
  }
  const statutEffectif = getStageLifecycleStatus(stage);
  if (statutEffectif !== "actif") {
    const err = new Error(
      statutEffectif === "a_venir"
        ? "Ce stage n'a pas encore commencé et ne peut pas être clôturé."
        : "Ce stage n'est pas actif",
    );
    err.status = 400;
    throw err;
  }

  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  const resultat = await db.transaction(async (tx) => {
    const dateFinReelle = new Date();

    await tx
      .update(stages)
      .set({ statut: "termine", dateFinReelle })
      .where(eq(stages.idStage, idStage));

    await tx
      .update(stagiaires)
      .set({ statutStage: "termine" })
      .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

    const codeVerification = randomBytes(6).toString("hex").toUpperCase();

    const cheminRelatif = await genererCertificatPdf({
      idStage,
      prenom: stagiaire.prenom,
      nom: stagiaire.nom,
      nomEntreprise: entreprise.nomEntreprise,
      intitulePoste: "Stage", // simplifié : le titre précis vient de offres_finales, non rejoint ici pour rester concis
      dateDebut: stage.dateDebut,
      dateFin: dateFinReelle.toLocaleDateString("fr-FR"),
      codeVerification,
    });

    const urlFichier = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/uploads/${cheminRelatif}`;

    const [certificat] = await tx
      .insert(certificats)
      .values({ idStage, urlFichier, codeVerification })
      .returning();

    await tx.insert(badges).values({
      idStagiaire: stage.idStagiaire,
      idStage,
      typeBadge: "stage_verifie",
    });

    const notif = await creerNotification(
      {
        idUtilisateur: stagiaire.idUtilisateur,
        type: "stage_termine",
        titre: "Stage terminé — certificat disponible",
        message: `Votre stage chez ${entreprise.nomEntreprise} est terminé. Votre certificat de réussite est disponible.`,
        lien: "/certificats",
      },
      tx,
    );

    return {
      stage: { ...stage, statut: "termine", dateFinReelle },
      certificat,
      _notif: notif,
    };
  });

  // Realtime après COMMIT uniquement
  if (resultat?._notif) {
    emitNotificationCreated(resultat._notif);
    delete resultat._notif;
  }

  return resultat;
}

export async function getCertificatForStage(idUtilisateur, idStage) {
  const [stage] = await db
    .select({
      idStage: stages.idStage,
      idStagiaire: stages.idStagiaire,
      idEntreprise: stages.idEntreprise,
    })
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stage) return null;

  //Autorisé uniquement pour le stagiaire concerné ou l'entreprise associée
  //(la vérification publique d'un certificat par un tier passe par la
  //route /stages/verifier/:code, qui ne renvoie aucune donnée peronnelle)
  const [stagiaire] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, stage.idEntreprise));

  const estAutorise =
    (stagiaire && stagiaire.idUtilisateur === idUtilisateur) ||
    (entreprise && entreprise.idUtilisateur === idUtilisateur);

  if (!estAutorise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à consulter ce certificat ",
    );
    err.status = 403;
    throw err;
  }

  const [certificat] = await db
    .select()
    .from(certificats)
    .where(eq(certificats.idStage, idStage));
  return certificat || null;
}

export async function verifierCertificat(codeVerification) {
  if (!codeVerification || String(codeVerification).trim().length < 4) {
    return null;
  }
  const code = String(codeVerification).trim().toUpperCase();

  const [row] = await db
    .select({
      codeVerification: certificats.codeVerification,
      dateEmission: certificats.dateEmission,
      idStage: certificats.idStage,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      nomEntreprise: entreprises.nomEntreprise,
      dateDebut: stages.dateDebut,
      dateFinReelle: stages.dateFinReelle,
      statutStage: stages.statut,
    })
    .from(certificats)
    .innerJoin(stages, eq(certificats.idStage, stages.idStage))
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(certificats.codeVerification, code))
    .limit(1);

  if (!row) return null;

  // Données publiques minimales (pas d'email, téléphone, url fichier)
  return {
    authentique: true,
    codeVerification: row.codeVerification,
    dateEmission: row.dateEmission,
    stagiaire: `${row.prenom || ""} ${row.nom || ""}`.trim(),
    entreprise: row.nomEntreprise,
    periode: {
      debut: row.dateDebut,
      fin: row.dateFinReelle,
    },
    statutStage: row.statutStage,
  };
}

/** Liste des certificats du stagiaire connecté (données enrichies). */
export async function listMesCertificats(idUtilisateur) {
  const [stagiaire] = await db
    .select({ idStagiaire: stagiaires.idStagiaire })
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);

  if (!stagiaire) return [];

  const rows = await db
    .select({
      idCertificat: certificats.idCertificat,
      idStage: certificats.idStage,
      urlFichier: certificats.urlFichier,
      codeVerification: certificats.codeVerification,
      dateEmission: certificats.dateEmission,
      dateDebut: stages.dateDebut,
      dateFinReelle: stages.dateFinReelle,
      dateFinPrevue: stages.dateFinPrevue,
      statutStage: stages.statut,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      villeEntreprise: entreprises.ville,
      paysEntreprise: entreprises.pays,
    })
    .from(certificats)
    .innerJoin(stages, eq(certificats.idStage, stages.idStage))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire))
    .orderBy(desc(certificats.dateEmission));

  // Enrichir titre poste si convention présente
  const result = [];
  for (const r of rows) {
    let titrePoste = null;
    const [stageFull] = await db
      .select({ idConvention: stages.idConvention })
      .from(stages)
      .where(eq(stages.idStage, r.idStage))
      .limit(1);
    if (stageFull?.idConvention) {
      const [offreInfo] = await db
        .select({ intitulePoste: offresFinales.intitulePoste })
        .from(conventionsStage)
        .innerJoin(
          offresFinales,
          eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
        )
        .where(eq(conventionsStage.idConvention, stageFull.idConvention))
        .limit(1);
      titrePoste = offreInfo?.intitulePoste || null;
    }
    result.push({
      ...r,
      titrePoste,
      type: "certificat_stage",
      statut: "verifie",
    });
  }
  return result;
}

/** Chemin disque absolu du PDF certificat, après contrôle d'accès. */
export async function getCertificatFilePath(idUtilisateur, idStage) {
  const cert = await getCertificatForStage(idUtilisateur, idStage);
  if (!cert) {
    const err = new Error("Certificat introuvable");
    err.status = 404;
    throw err;
  }

  // urlFichier peut être absolue (http://.../uploads/certificats/x.pdf) ou relative
  let filename = null;
  if (cert.urlFichier) {
    const m = String(cert.urlFichier).match(/certificats\/([^/?#]+)/i);
    if (m) filename = m[1];
    else {
      const base = path.basename(String(cert.urlFichier).split("?")[0]);
      if (base && base.includes(".")) filename = base;
    }
  }

  if (!filename) {
    const err = new Error("Fichier certificat indisponible");
    err.status = 404;
    throw err;
  }

  const safe = path.basename(filename);
  const filePath = path.resolve("uploads", "certificats", safe);
  const root = path.resolve("uploads", "certificats");
  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
    const err = new Error("Fichier certificat introuvable sur le serveur");
    err.status = 404;
    throw err;
  }

  return { filePath, filename: safe, certificat: cert };
}


// -----------------------------------------------------------------------
// Journal de stage / activités — le stagiaire enregistre ses propres
// entrées ; leur modération (validation, commentaire) se fait côté
// superviseur (cf. superviseur.progression.service.js).
// -----------------------------------------------------------------------

async function getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  const [stage] = await db
    .select()
    .from(stages)
    .where(
      and(
        eq(stages.idStage, idStage),
        eq(stages.idStagiaire, stagiaire.idStagiaire),
      ),
    );
  if (!stage) {
    const err = new Error("Ce stage ne vous appartient pas.");
    err.status = 403;
    throw err;
  }
  return stage;
}

export async function listMonJournal(idUtilisateurStagiaire, idStage) {
  await getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage);
  return db
    .select()
    .from(journalStage)
    .where(eq(journalStage.idStage, idStage))
    .orderBy(desc(journalStage.dateActivite));
}

export async function ajouterEntreeJournal(
  idUtilisateurStagiaire,
  idStage,
  payload,
) {
  const stage = await getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage);
  assertStageIsActive(stage);
  const [entree] = await db
    .insert(journalStage)
    .values({
      idStage,
      titre: payload.titre,
      description: payload.description,
      dateActivite: payload.dateActivite,
    })
    .returning();
  return entree;
}

export async function updateEntreeJournal(
  idUtilisateurStagiaire,
  idStage,
  idEntree,
  payload,
) {
  const stage = await getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage);
  assertStageIsActive(stage);

  const [existante] = await db
    .select()
    .from(journalStage)
    .where(
      and(
        eq(journalStage.idEntree, idEntree),
        eq(journalStage.idStage, idStage),
      ),
    );
  if (!existante) {
    const err = new Error("Entrée de journal introuvable");
    err.status = 404;
    throw err;
  }
  // Une entrée déjà validée ou en cours de traitement par le superviseur ne
  // doit plus pouvoir être modifiée silencieusement par le stagiaire — seule
  // une entrée "en_attente" ou "correction_demandee" reste éditable, et dans
  // ce dernier cas la modification la repasse automatiquement en attente.
  if (
    existante.statutValidation === "validee" ||
    existante.statutValidation === "terminee"
  ) {
    const err = new Error(
      "Cette entrée a déjà été traitée par votre superviseur et ne peut plus être modifiée.",
    );
    err.status = 409;
    throw err;
  }

  const [entree] = await db
    .update(journalStage)
    .set({
      ...payload,
      statutValidation: "en_attente",
      commentaireSuperviseur: null,
    })
    .where(eq(journalStage.idEntree, idEntree))
    .returning();
  return entree;
}

export async function supprimerEntreeJournal(
  idUtilisateurStagiaire,
  idStage,
  idEntree,
) {
  await getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage);
  await db
    .delete(journalStage)
    .where(
      and(
        eq(journalStage.idEntree, idEntree),
        eq(journalStage.idStage, idStage),
      ),
    );
  return { deleted: true };
}


/**
 * Correction des dates d'un stage par l'entreprise suite à une anomalie critique.
 * - Authentifié + compte actif (middlewares)
 * - Stage appartient à l'entreprise connectée
 * - Demande de correction active (alerter_entreprise_correction / en_cours)
 * - Stage non terminé / non interrompu
 * - dateFin recalculée serveur depuis dureeStage contractuelle
 */
export async function corrigerDatesStageEntreprise(idUtilisateur, idStage, dateDebutInput) {
  const access = await resolveSupervisionAccess(idUtilisateur);
  if (access.mode !== "entreprise" && access.mode !== "admin_entreprise") {
    const err = new Error(
      "Seuls les comptes entreprise autorisés peuvent corriger les dates d'un stage",
    );
    err.status = 403;
    throw err;
  }
  await assertStageAccess(access, idStage);

  const debutYmd = toYmd(dateDebutInput);
  if (!debutYmd || !/^\d{4}-\d{2}-\d{2}$/.test(debutYmd)) {
    const err = new Error("Date de début invalide (format attendu : AAAA-MM-JJ)");
    err.status = 400;
    throw err;
  }

  // Charger stage + offre finale (durée contractuelle)
  const [row] = await db
    .select({
      idStage: stages.idStage,
      idEntreprise: stages.idEntreprise,
      statut: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      idConvention: stages.idConvention,
      idOffreFinale: conventionsStage.idOffreFinale,
      dureeStage: offresFinales.dureeStage,
      offreDateDebut: offresFinales.dateDebut,
    })
    .from(stages)
    .innerJoin(
      conventionsStage,
      eq(stages.idConvention, conventionsStage.idConvention),
    )
    .innerJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .where(eq(stages.idStage, idStage));

  if (!row) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  if (row.idEntreprise !== access.idEntreprise) {
    const err = new Error("Ce stage n'appartient pas à votre entreprise");
    err.status = 403;
    throw err;
  }

  const lifecycle = getStageLifecycleStatus({
    statut: row.statut,
    dateDebut: row.dateDebut,
    dateFinPrevue: row.dateFinPrevue,
    dateFinReelle: row.dateFinReelle,
  });
  if (lifecycle === "termine" || lifecycle === "interrompu" || row.statut === "termine" || row.statut === "interrompu") {
    const err = new Error(
      "Impossible de modifier les dates d'un stage terminé ou interrompu",
    );
    err.status = 400;
    err.code = "STAGE_CLOTURE";
    throw err;
  }

  // Vérifier qu'une demande de correction est active (dernière action journal)
  const fp = `dates_incoherentes::${idStage}`;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const journalRows = await db
    .select({
      action: journalActionsAdmin.action,
      nouveauStatut: journalActionsAdmin.nouveauStatut,
      motif: journalActionsAdmin.motif,
      dateCreation: journalActionsAdmin.dateCreation,
    })
    .from(journalActionsAdmin)
    .where(
      and(
        eq(journalActionsAdmin.typeEntite, "anomalie_controle"),
        gte(journalActionsAdmin.dateCreation, since),
      ),
    )
    .orderBy(desc(journalActionsAdmin.dateCreation));

  let demandeActive = null;
  for (const r of journalRows) {
    const motifFp = (r.motif || "").split("\n")[0]?.trim();
    if (motifFp !== fp) continue;
    const statut =
      r.nouveauStatut ||
      (r.action === "alerter_entreprise_correction"
        ? "en_cours"
        : r.action === "ignorer_anomalie"
          ? "ignoree"
          : "resolue");
    if (statut === "en_cours" && r.action === "alerter_entreprise_correction") {
      demandeActive = r;
    }
    // Première (plus récente) entrée pour ce fingerprint décide
    break;
  }

  if (!demandeActive) {
    const err = new Error(
      "Aucune demande de correction active pour ce stage. Contactez le support si le problème persiste.",
    );
    err.status = 403;
    err.code = "PAS_DE_DEMANDE_CORRECTION";
    throw err;
  }

  if (!row.dureeStage) {
    const err = new Error(
      "Durée contractuelle introuvable : impossible de recalculer la date de fin",
    );
    err.status = 400;
    throw err;
  }

  const finYmd = calculerDateFinPrevueYmd(debutYmd, row.dureeStage);
  assertValidStageDates(debutYmd, finYmd);

  const nouveauStatut = computeInitialStageStatus(debutYmd, finYmd);

  await db.transaction(async (tx) => {
    await tx
      .update(offresFinales)
      .set({ dateDebut: debutYmd })
      .where(eq(offresFinales.idOffreFinale, row.idOffreFinale));

    await tx
      .update(stages)
      .set({
        dateDebut: debutYmd,
        dateFinPrevue: finYmd,
        // Ne pas écraser interrompu ; sinon aligner le statut temporel
        ...(row.statut !== "interrompu" ? { statut: nouveauStatut } : {}),
      })
      .where(eq(stages.idStage, idStage));
  });

  // Réconciliation explicite (pas via GET) : clôture l'anomalie si les dates sont cohérentes
  try {
    await reconcileControleCentre();
  } catch (e) {
    console.warn("reconcileControleCentre après correction dates:", e?.message || e);
  }

  return {
    ok: true,
    idStage,
    dateDebut: debutYmd,
    dateFinPrevue: finYmd,
    dureeStage: row.dureeStage,
    statut: row.statut === "interrompu" ? "interrompu" : nouveauStatut,
  };
}
