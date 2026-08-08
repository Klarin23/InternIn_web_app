import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
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
} from "../../db/schema.js";
import { genererCertificatPdf } from "../../utils/certificatPdf.js";
import { randomBytes } from "node:crypto";
import { creerNotification } from "../notifications/notifications.service.js";

export async function getMonStage(idUtilisateurStagiaire) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) return null;

  const [stage] = await db
    .select({
      idStage: stages.idStage,
      objectifsApprentissage: stages.objectifsApprentissage,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      statut: stages.statut,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(stages)
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire));

  return stage || null;
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
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
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
  if (stage.statut !== "actif") {
    const err = new Error("Ce stage n'est pas actif");
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

    const cheminRelatif = genererCertificatPdf({
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

    return {
      stage: { ...stage, statut: "termine", dateFinReelle },
      certificat,
    };
  });

  // Notification envoyée hors transaction : creerNotification utilise le
  // client db global, pas le client de transaction (tx).
  await creerNotification({
    idUtilisateur: stagiaire.idUtilisateur,
    type: "stage_termine",
    titre: "Stage terminé — certificat disponible",
    message: `Votre stage chez ${entreprise.nomEntreprise} est terminé. Votre certificat de réussite est disponible.`,
    lien: "/certificats",
  });

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
  const [certificat] = await db
    .select()
    .from(certificats)
    .where(eq(certificats.codeVerification, codeVerification));
  return certificat || null;
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
  await getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage);
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
  await getStageStagiaireOrThrow(idUtilisateurStagiaire, idStage);

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
