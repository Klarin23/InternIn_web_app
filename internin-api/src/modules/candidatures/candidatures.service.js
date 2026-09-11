// La contrainte UNIQUE(id_stagiaire, id_offre) en base empêche déjà les
// doublons au niveau SQL — on l'anticipe ici pour renvoyer un message
// clair plutôt qu'une erreur PostgreSQL brute au frontend.

import { eq, and, inArray, ne, desc, sql, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  candidatures,
  offresStage,
  stagiaires,
  entreprises,
  universites,
  formations,
  entretiens,
  offresFinales,
  conventionsStage,
  stages,
  stagiaireCompetences,
  competences,
  utilisateurs,
  activitesEquipe,
  membresEquipe,
  evaluationsCandidature,
  notesCandidature,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";
import {
  resolveEntrepriseContextOrThrow,
  getUtilisateursAvecPermission,
} from "../../utils/entrepriseContext.js";
import { publishRealtime } from "../../utils/realtime.js";

export async function createCandidature(
  idUtilisateur,
  { idOffre, lettreMotivation },
) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));
  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  const existing = await db
    .select()
    .from(candidatures)
    .where(
      and(
        eq(candidatures.idStagiaire, stagiaire.idStagiaire),
        eq(candidatures.idOffre, idOffre),
      ),
    );

  if (existing.length > 0) {
    const err = new Error("Vous avez déjà postulé à cette offre");
    err.status = 409;
    throw err;
  }

  const [offre] = await db
    .select({
      idOffre: offresStage.idOffre,
      statut: offresStage.statut,
      dateLimiteCandidature: offresStage.dateLimiteCandidature,
    })
    .from(offresStage)
    .where(eq(offresStage.idOffre, idOffre));

  if (!offre || offre.statut !== "publie") {
    const err = new Error("Cette offre n'est plus disponible");
    err.status = 400;
    throw err;
  }

  if (offre.dateLimiteCandidature) {
    if (new Date(offre.dateLimiteCandidature) < new Date()) {
      const err = new Error(
        "Cette offre a expiré : les candidatures sont fermées",
      );
      err.status = 400;
      throw err;
    }
  }

  // Le quota est consommé dès qu'une candidature active est soumise.
  // Verrouiller l'offre pendant le contrôle empêche deux candidatures
  // simultanées de dépasser le nombre de postes disponibles.
  const candidature = await db.transaction(async (tx) => {
    const offreResult = await tx.execute(
      sql`SELECT nombre_postes FROM offres_stage WHERE id_offre = ${idOffre} FOR UPDATE`,
    );
    const offreVerrouillee = offreResult.rows?.[0];
    if (!offreVerrouillee) {
      const err = new Error("Cette offre n'est plus disponible");
      err.status = 404;
      throw err;
    }
    const nombrePostes = Number(offreVerrouillee.nombre_postes ?? 1);
    const countResult = await tx.execute(
      sql`SELECT COUNT(*)::int AS nombre_actives FROM candidatures WHERE id_offre = ${idOffre} AND statut NOT IN ('rejetee', 'retiree')`,
    );
    if (Number(countResult.rows?.[0]?.nombre_actives ?? 0) >= nombrePostes) {
      const err = new Error(
        "Cette offre a atteint son nombre maximal de postes disponibles.",
      );
      err.status = 409;
      err.code = "OFFRE_POSTES_COMPLETS";
      throw err;
    }

    const [created] = await tx
      .insert(candidatures)
      .values({
        idStagiaire: stagiaire.idStagiaire,
        idOffre,
        origine: "candidature_spontanee",
        statut: "soumise",
        lettreMotivation: lettreMotivation || null,
      })
      .returning();
    return created;
  });

  const [offreInfo] = await db
    .select({
      idEntreprise: entreprises.idEntreprise,
      idUtilisateurEntreprise: entreprises.idUtilisateur,
      titreOffre: offresStage.titre,
    })
    .from(offresStage)
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(offresStage.idOffre, idOffre));

  if (offreInfo) {
    await enregistrerActiviteCandidature(
      offreInfo.idEntreprise,
      null, // action initiée par le stagiaire, pas un membre de l'équipe
      candidature.idCandidature,
      "candidature_envoyee",
    );

    // Notifier uniquement les membres autorisés (candidats.gerer) — source unique
    const destinataires = await getUtilisateursAvecPermission(
      offreInfo.idEntreprise,
      "candidats.gerer",
    );
    const messageCandidature = `${stagiaire.prenom} ${stagiaire.nom} a postulé pour l'offre « ${offreInfo.titreOffre} ».`;
    await Promise.all(
      destinataires.map((idDest) =>
        creerNotification({
          idUtilisateur: idDest,
          type: "candidature_recue",
          titre: "Nouvelle candidature reçue",
          message: messageCandidature,
          lien: "/candidats",
          idEntreprise: offreInfo.idEntreprise,
          categoriePreference: "candidatures",
        }),
      ),
    );

    // Événement temps réel candidature reçue
    for (const idDest of destinataires) {
      publishRealtime(idDest, {
        type: "candidature.recue",
        payload: {
          idCandidature: candidature.idCandidature,
          idEntreprise: offreInfo.idEntreprise,
          idOffre,
          titreOffre: offreInfo.titreOffre,
        },
      });
    }
  }

  return candidature;
}

export async function listMesCandidatures(idUtilisateur) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));
  if (!stagiaire) return [];

  return db
    .select({
      idCandidature: candidatures.idCandidature,
      statut: candidatures.statut,
      messageRejet: candidatures.messageRejet,
      dateCandidature: candidatures.dateCandidature,
      dateMajStatut: candidatures.dateMajStatut,
      motifRetraitCode: candidatures.motifRetraitCode,
      motifRetraitCommentaire: candidatures.motifRetraitCommentaire,
      dateRetrait: candidatures.dateRetrait,
      idOffre: offresStage.idOffre,
      titre: offresStage.titre,
      modeTravail: offresStage.modeTravail,
      nomEntreprise: entreprises.nomEntreprise,
      villeEntreprise: entreprises.ville,
      logoUrl: entreprises.logoUrl,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(candidatures.idStagiaire, stagiaire.idStagiaire));
}

// Utilisé côté frontend pour savoir si le bouton "Postuler" doit être désactivé
export async function getCandidatureForOffre(idUtilisateur, idOffre) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));
  if (!stagiaire) return null;

  const [candidature] = await db
    .select()
    .from(candidatures)
    .where(
      and(
        eq(candidatures.idStagiaire, stagiaire.idStagiaire),
        eq(candidatures.idOffre, idOffre),
      ),
    );

  return candidature || null;
}

// Liste toutes les candidatures reçues sur les offres de l'entreprise connectée,
// avec les infos essentielles du candidat pour l'affichage en liste.
export async function listCandidaturesForEntreprise(
  idUtilisateurEntreprise,
  { idOffre } = {},
) {
  // Propriétaire OU membre d'équipe actif (anti-IDOR via contexte entreprise)
  const ctx = await resolveEntrepriseContextOrThrow(idUtilisateurEntreprise);
  const entreprise = ctx.entreprise;

  const conditions = [eq(offresStage.idEntreprise, entreprise.idEntreprise)];
  if (idOffre) conditions.push(eq(candidatures.idOffre, idOffre));

  const rows = await db
    .select({
      idCandidature: candidatures.idCandidature,
      statut: candidatures.statut,
      dateCandidature: candidatures.dateCandidature,
      lettreMotivation: candidatures.lettreMotivation,
      motifRetraitCode: candidatures.motifRetraitCode,
      motifRetraitCommentaire: candidatures.motifRetraitCommentaire,
      dateRetrait: candidatures.dateRetrait,
      idOffre: offresStage.idOffre,
      titreOffre: offresStage.titre,
      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      dateNaissance: stagiaires.dateNaissance,
      ville: stagiaires.ville,
      pays: stagiaires.pays,
      telephone: stagiaires.telephone,
      email: utilisateurs.email,
      linkedinUrl: stagiaires.linkedinUrl,
      portfolioUrl: stagiaires.portfolioUrl,
      scoreCompletudeProfil: stagiaires.scoreCompletudeProfil,
      titreProfessionnel: stagiaires.titreProfessionnel,
      presentation: stagiaires.presentation,
      objectifProfessionnel: stagiaires.objectifProfessionnel,
      experiencesProfessionnelles: stagiaires.experiencesProfessionnelles,
      qualites: stagiaires.qualites,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(
      utilisateurs,
      eq(stagiaires.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .where(and(...conditions));

  if (rows.length === 0) return [];

  // Récupère la formation la plus pertinente de chaque candidat (celle "en
  // cours" en priorité, sinon la première renseignée) — c'est cette donnée
  // (saisie librement à l'étape "Formation" de l'onboarding) qui représente
  // l'université "mentionnée", et non stagiaires.id_universite (réservé aux
  // établissements partenaires vérifiés — quasiment jamais renseigné pour
  // l'instant, cf. explication donnée à l'utilisateur).
  const idsStagiaires = [...new Set(rows.map((r) => r.idStagiaire))];

  const formationsRows = await db
    .select({
      idStagiaire: formations.idStagiaire,
      nomUniversite: formations.nomUniversite,
      faculte: formations.faculte,
      diplome: formations.diplome,
      departement: formations.departement,
      anneeEtude: formations.anneeEtude,
      anneeObtention: formations.anneeObtention,
      typeFormation: formations.typeFormation,
    })
    .from(formations)
    .where(inArray(formations.idStagiaire, idsStagiaires));

  const formationParStagiaire = {};
  for (const f of formationsRows) {
    const dejaTrouve = formationParStagiaire[f.idStagiaire];
    if (!dejaTrouve || f.typeFormation === "en_cours") {
      formationParStagiaire[f.idStagiaire] = f;
    }
  }

  const competencesRows = await db
    .select({
      idStagiaire: stagiaireCompetences.idStagiaire,
      nom: competences.nom,
      typeCompetence: competences.typeCompetence,
      niveau: stagiaireCompetences.niveau,
    })
    .from(stagiaireCompetences)
    .innerJoin(
      competences,
      eq(stagiaireCompetences.idCompetence, competences.idCompetence),
    )
    .where(inArray(stagiaireCompetences.idStagiaire, idsStagiaires));

  const competencesParStagiaire = {};
  const languesParStagiaire = {};
  competencesRows.forEach((c) => {
    (competencesParStagiaire[c.idStagiaire] ??= []).push(c.nom);
    if (c.typeCompetence === "langue") {
      (languesParStagiaire[c.idStagiaire] ??= []).push({ nom: c.nom, niveau: c.niveau || null });
    }
  });

  // Les coordonnées personnelles restent confidentielles pendant tout le
  // processus de recrutement. Elles ne deviennent disponibles qu'une fois
  // le stage effectivement commencé (date_debut atteinte).
  //
  // Le lien candidature -> stage passe par l'offre finale puis la convention.
  // On vérifie donc directement l'existence d'un stage correspondant et sa
  // date civile de début côté PostgreSQL, afin de ne jamais faire confiance
  // à un statut frontend ou à une valeur fournie par le client.
  const idsCandidatures = rows.map((r) => r.idCandidature);
  const stagesCandidaturesRows =
    idsCandidatures.length > 0
      ? await db
          .select({
            idCandidature: entretiens.idCandidature,
            dateDebut: stages.dateDebut,
          })
          .from(offresFinales)
          .innerJoin(
            entretiens,
            eq(offresFinales.idEntretien, entretiens.idEntretien),
          )
          .innerJoin(
            conventionsStage,
            eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
          )
          .innerJoin(
            stages,
            eq(stages.idConvention, conventionsStage.idConvention),
          )
          .where(
            and(
              inArray(entretiens.idCandidature, idsCandidatures),
              ne(offresFinales.statutValidationPlateforme, "rejete"),
              lte(stages.dateDebut, sql`CURRENT_DATE`),
            ),
          )
      : [];

  const candidaturesAvecStageCommence = new Set(
    stagesCandidaturesRows.map((o) => o.idCandidature),
  );

  return rows.map((r) => {
    const formation = formationParStagiaire[r.idStagiaire];
    const stageCommence = candidaturesAvecStageCommence.has(r.idCandidature);

    return {
      ...r,
      // Coordonnées masquées jusqu'au jour civil de début du stage.
      email: stageCommence ? r.email : null,
      telephone: stageCommence ? r.telephone : null,
      nomUniversite: formation?.nomUniversite || null,
      // Le diplôme n’est exposé que lorsqu’il est déjà obtenu.
      diplome:
        formation?.typeFormation === "obtenue" ? formation.diplome : null,
      faculte: formation?.faculte || null,
      departement: formation?.departement || null,
      anneeEtude: formation?.anneeEtude || null,
      anneeObtention:
        formation?.typeFormation === "obtenue"
          ? formation.anneeObtention
          : null,
      typeFormation: formation?.typeFormation || null,
      competences: competencesParStagiaire[r.idStagiaire] || [],
      langues: languesParStagiaire[r.idStagiaire] || [],
      formations: formationsRows.filter((f) => f.idStagiaire === r.idStagiaire),
      experiencesProfessionnelles: Array.isArray(r.experiencesProfessionnelles) ? r.experiencesProfessionnelles : [],
      qualites: Array.isArray(r.qualites) ? r.qualites : [],
      coordonneesDisponibles: stageCommence,
    };
  });
}

// Machine d'état métier des candidatures.
// Les transitions sont volontairement monotones : une candidature ne peut
// pas revenir en arrière et l'état "acceptee" est réservé au flux d'offre
// finale (il ne peut donc pas être forcé via PATCH /statut).
const TRANSITIONS_CANDIDATURE = {
  soumise: new Set(["consultee", "preselectionnee", "rejetee"]),
  consultee: new Set(["preselectionnee", "rejetee"]),
  preselectionnee: new Set(["rejetee"]),
  rejetee: new Set(),
  acceptee: new Set(),
  retiree: new Set(),
};

// Change le statut d'une candidature en appliquant la machine d'état métier.
// L'UPDATE reprend aussi l'ancien statut dans son WHERE : en cas de deux
// requêtes concurrentes, une seule peut consommer l'ancien état.
export async function updateCandidatureStatut(
  idUtilisateurEntreprise,
  idCandidature,
  nouveauStatut,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const [row] = await db
    .select({
      idOffreEntreprise: offresStage.idEntreprise,
      titreOffre: offresStage.titre,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
      statutActuel: candidatures.statut,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .where(eq(candidatures.idCandidature, idCandidature));

  if (!row || row.idOffreEntreprise !== entreprise.idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à modifier cette candidature",
    );
    err.status = 403;
    throw err;
  }

  const transitionsAutorisees = TRANSITIONS_CANDIDATURE[row.statutActuel];
  if (!transitionsAutorisees || !transitionsAutorisees.has(nouveauStatut)) {
    const err = new Error(
      `Transition de candidature interdite : ${row.statutActuel} → ${nouveauStatut}`,
    );
    err.status = 409;
    throw err;
  }

  // Le statut "acceptee" est produit par le flux d'offre finale, jamais par
  // cette route générique. La condition sur l'ancien statut rend également
  // la transition atomique face aux requêtes concurrentes.
  const [updated] = await db
    .update(candidatures)
    .set({ statut: nouveauStatut, dateMajStatut: new Date() })
    .where(
      and(
        eq(candidatures.idCandidature, idCandidature),
        eq(candidatures.statut, row.statutActuel),
      ),
    )
    .returning();

  if (!updated) {
    const err = new Error(
      "La candidature a été modifiée entre-temps. Veuillez actualiser puis réessayer.",
    );
    err.status = 409;
    throw err;
  }

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);
  const ACTION_STATUT = {
    consultee: "profil_consulte",
    preselectionnee: "candidat_preselectionne",
    rejetee: "candidature_refusee",
    acceptee: "candidature_acceptee",
    soumise: "candidature_remise_attente",
  };
  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    ACTION_STATUT[nouveauStatut] || `statut_change:${nouveauStatut}`,
  );

  // On ne notifie l'étudiant que sur les changements de statut réellement
  // significatifs pour lui — pas sur "consultee" (simple accusé de lecture
  // silencieux) ni "retiree"/"acceptee" (gérés ailleurs dans leur propre flux).
  if (nouveauStatut === "preselectionnee") {
    await creerNotification({
      idUtilisateur: row.idUtilisateurStagiaire,
      type: "candidature_preselectionnee",
      titre: "Candidature présélectionnée",
      message: `${entreprise.nomEntreprise} a présélectionné votre candidature pour « ${row.titreOffre} ».`,
      lien: "/candidatures",
    });
  } else if (nouveauStatut === "rejetee") {
    await creerNotification({
      idUtilisateur: row.idUtilisateurStagiaire,
      type: "candidature_rejetee",
      titre: "Candidature non retenue",
      message: `${entreprise.nomEntreprise} n'a pas donné suite à votre candidature pour « ${row.titreOffre} ».`,
      lien: "/candidatures",
    });
  }

  return updated;
}

// Message professionnel envoyé au candidat lorsqu'une entreprise rejette sa
// candidature après un entretien. Ton respectueux et encourageant : on ne
// remet pas en cause ses compétences, on le redirige vers d'autres offres.
function genererMessageRejet({ prenom, titreOffre, nomEntreprise }) {
  return `Bonjour ${prenom},

Nous vous remercions d'avoir pris le temps de participer au processus de recrutement pour le poste de « ${titreOffre} » au sein de ${nomEntreprise}, ainsi que pour l'intérêt que vous avez porté à notre entreprise.

Après un examen attentif de votre candidature et de notre échange lors de l'entretien, nous sommes au regret de vous informer que nous ne donnerons pas suite à votre candidature pour ce stage. Cette décision, difficile à prendre, résulte d'un choix entre plusieurs profils sérieux et ne remet aucunement en cause vos compétences ni votre motivation.

Nous vous encourageons vivement à consulter nos autres offres de stage disponibles sur la plateforme, ainsi qu'à continuer vos démarches ailleurs. Nous vous souhaitons beaucoup de succès dans la suite de votre parcours.

Cordialement,
L'équipe ${nomEntreprise}`;
}

// Rejette une candidature après un entretien terminé, tant qu'aucune offre
// finale active n'existe déjà pour cet entretien. Génère et enregistre un
// message professionnel, lisible par l'étudiant depuis "Mes candidatures".
export async function rejeterCandidatureApresEntretien(
  idUtilisateurEntreprise,
  idEntretien,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const [row] = await db
    .select({
      idOffreEntreprise: offresStage.idEntreprise,
      idCandidature: candidatures.idCandidature,
      statutEntretien: entretiens.statut,
      titreOffre: offresStage.titre,
      prenom: stagiaires.prenom,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
    })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .where(eq(entretiens.idEntretien, idEntretien));

  if (!row || row.idOffreEntreprise !== entreprise.idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à rejeter cette candidature",
    );
    err.status = 403;
    throw err;
  }
  if (row.statutEntretien !== "termine") {
    const err = new Error(
      "Seul un entretien terminé peut être rejeté à ce stade",
    );
    err.status = 400;
    throw err;
  }

  const [offreActive] = await db
    .select({ idOffreFinale: offresFinales.idOffreFinale })
    .from(offresFinales)
    .where(
      and(
        eq(offresFinales.idEntretien, idEntretien),
        ne(offresFinales.statutValidationPlateforme, "rejete"),
      ),
    );
  if (offreActive) {
    const err = new Error(
      "Une offre finale est déjà en cours pour cet entretien — impossible de rejeter",
    );
    err.status = 409;
    throw err;
  }

  const message = genererMessageRejet({
    prenom: row.prenom,
    titreOffre: row.titreOffre,
    nomEntreprise: entreprise.nomEntreprise,
  });

  const [updated] = await db
    .update(candidatures)
    .set({
      statut: "rejetee",
      messageRejet: message,
      dateMajStatut: new Date(),
    })
    .where(eq(candidatures.idCandidature, row.idCandidature))
    .returning();

  await creerNotification({
    idUtilisateur: row.idUtilisateurStagiaire,
    type: "candidature_rejetee",
    titre: "Candidature non retenue",
    message: `${entreprise.nomEntreprise} n'a pas donné suite à votre candidature pour « ${row.titreOffre} » suite à l'entretien.`,
    lien: "/candidatures",
  });

  return updated;
}

// Recommandation de candidats pour le dashboard Entreprise. Calcule un
// score de correspondance en comparant le texte libre "compétences
// requises" de l'offre avec les compétences déclarées du profil du
// stagiaire (correspondance par mot-clé, pas de sémantique avancée —
// competencesRequises n'est pas structuré en base). Ne considère que les
// candidatures encore "actives" (pas rejetées/retirées/déjà acceptées).
export async function getCandidatsRecommandes(
  idUtilisateurEntreprise,
  limit = 5,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const rows = await db
    .select({
      idCandidature: candidatures.idCandidature,
      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      titreProfessionnel: stagiaires.titreProfessionnel,
      idOffre: offresStage.idOffre,
      titreOffre: offresStage.titre,
      competencesRequises: offresStage.competencesRequises,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .where(
      and(
        eq(offresStage.idEntreprise, entreprise.idEntreprise),
        // Le widget ne doit recommander que des profils correspondant à une
        // offre actuellement publiée, jamais à un brouillon ou une offre
        // archivée/fermée.
        eq(offresStage.statut, "publie"),
        inArray(candidatures.statut, [
          "soumise",
          "consultee",
          "preselectionnee",
        ]),
      ),
    );

  if (rows.length === 0) return [];

  // Compétences déclarées de chaque stagiaire concerné, regroupées.
  const idsStagiaires = [...new Set(rows.map((r) => r.idStagiaire))];
  const competencesRows = await db
    .select({
      idStagiaire: stagiaireCompetences.idStagiaire,
      nom: competences.nom,
    })
    .from(stagiaireCompetences)
    .innerJoin(
      competences,
      eq(stagiaireCompetences.idCompetence, competences.idCompetence),
    )
    .where(inArray(stagiaireCompetences.idStagiaire, idsStagiaires));

  const competencesParStagiaire = {};
  competencesRows.forEach((c) => {
    (competencesParStagiaire[c.idStagiaire] ??= []).push(c.nom.toLowerCase());
  });

  const scored = rows
    .map((r) => {
      // "React, Node.js, Communication" -> ["react", "node.js", "communication"]
      const requises = (r.competencesRequises || "")
        .split(/[,;\n]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (requises.length === 0) return { ...r, scoreCorrespondance: null };

      const stagiaireComp = competencesParStagiaire[r.idStagiaire] || [];
      const matched = requises.filter((req) =>
        stagiaireComp.some((c) => c.includes(req) || req.includes(c)),
      ).length;

      return {
        ...r,
        scoreCorrespondance: Math.round((matched / requises.length) * 100),
      };
    })
    // On ne recommande que les candidatures avec au moins une correspondance
    .filter((r) => r.scoreCorrespondance !== null && r.scoreCorrespondance > 0)
    .sort((a, b) => b.scoreCorrespondance - a.scoreCorrespondance)
    .slice(0, limit);

  return scored;
}

// Résout le membre d'équipe correspondant à l'utilisateur connecté (le
// propriétaire du compte entreprise a lui aussi une ligne membresEquipe,
// créée automatiquement à l'inscription). Retourne null si introuvable —
// ça ne doit jamais bloquer une action métier, juste priver le journal
// d'un nom d'auteur.
// Vérifie que la candidature ciblée appartient bien à une offre de CETTE
// entreprise. Sans ce contrôle, une entreprise authentifiée pourrait lire
// ou modifier les notes/évaluations internes d'une entreprise concurrente
// en changeant simplement l'id dans l'URL (IDOR) — voir le même schéma déjà
// appliqué correctement dans updateCandidatureStatut() ci-dessus.
async function verifierAppartenanceCandidature(idEntreprise, idCandidature) {
  const [row] = await db
    .select({ idOffreEntreprise: offresStage.idEntreprise })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(candidatures.idCandidature, idCandidature));

  if (!row || row.idOffreEntreprise !== idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à accéder à cette candidature",
    );
    err.status = 403;
    throw err;
  }
}

export async function getMembreOptionnel(idUtilisateur) {
  const [membre] = await db
    .select({ idMembre: membresEquipe.idMembre, nom: membresEquipe.nom })
    .from(membresEquipe)
    .where(eq(membresEquipe.idUtilisateur, idUtilisateur));
  return membre || null;
}

export async function enregistrerActiviteCandidature(
  idEntreprise,
  idMembre,
  idCandidature,
  action,
  details,
) {
  await db.insert(activitesEquipe).values({
    idEntreprise,
    idMembre: idMembre || null,
    idCandidature,
    action,
    details: details || null,
  });
}
// Historique complet d'une candidature (utilisé par la Timeline ET la
// section "Historique" du panneau — même source de vérité).
export async function getHistoriqueCandidature(
  idUtilisateurEntreprise,
  idCandidature,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  return db
    .select({
      idActivite: activitesEquipe.idActivite,
      action: activitesEquipe.action,
      details: activitesEquipe.details,
      dateAction: activitesEquipe.dateAction,
      nomMembre: membresEquipe.nom,
    })
    .from(activitesEquipe)
    .leftJoin(
      membresEquipe,
      eq(membresEquipe.idMembre, activitesEquipe.idMembre),
    )
    .where(
      and(
        eq(activitesEquipe.idCandidature, idCandidature),
        eq(activitesEquipe.idEntreprise, entreprise.idEntreprise),
      ),
    )
    .orderBy(activitesEquipe.dateAction);
}

// Enregistre qu'un CV a été téléchargé/consulté — appelé par le frontend
// au clic sur "Voir le CV", pour alimenter la Timeline et l'Historique.
export async function enregistrerConsultationCv(
  idUtilisateurEntreprise,
  idCandidature,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  await verifierAppartenanceCandidature(entreprise.idEntreprise, idCandidature);

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);
  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    "cv_telecharge",
  );
}

export async function getEvaluationCandidature(
  idUtilisateurEntreprise,
  idCandidature,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  await verifierAppartenanceCandidature(entreprise.idEntreprise, idCandidature);

  const [evaluation] = await db
    .select()
    .from(evaluationsCandidature)
    .where(eq(evaluationsCandidature.idCandidature, idCandidature));

  return evaluation || null;
}

// "Upsert" : crée l'évaluation si elle n'existe pas encore, la met à jour
// sinon. Une seule évaluation "vivante" par candidature, modifiable par
// n'importe quel membre de l'équipe.
export async function upsertEvaluationCandidature(
  idUtilisateurEntreprise,
  idCandidature,
  payload,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  await verifierAppartenanceCandidature(entreprise.idEntreprise, idCandidature);

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);

  const [evaluation] = await db
    .insert(evaluationsCandidature)
    .values({
      idCandidature,
      noteGlobale: payload.noteGlobale,
      motivation: payload.motivation,
      communication: payload.communication,
      technique: payload.technique,
      presentation: payload.presentation,
      idMembreMaj: membre?.idMembre,
      dateMaj: new Date(),
    })
    .onConflictDoUpdate({
      target: evaluationsCandidature.idCandidature,
      set: {
        noteGlobale: payload.noteGlobale,
        motivation: payload.motivation,
        communication: payload.communication,
        technique: payload.technique,
        presentation: payload.presentation,
        idMembreMaj: membre?.idMembre,
        dateMaj: new Date(),
      },
    })
    .returning();

  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    "evaluation_maj",
  );

  return evaluation;
}

export async function listNotesCandidature(
  idUtilisateurEntreprise,
  idCandidature,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  await verifierAppartenanceCandidature(entreprise.idEntreprise, idCandidature);

  return db
    .select({
      idNote: notesCandidature.idNote,
      contenu: notesCandidature.contenu,
      dateCreation: notesCandidature.dateCreation,
      nomMembre: membresEquipe.nom,
    })
    .from(notesCandidature)
    .leftJoin(
      membresEquipe,
      eq(membresEquipe.idMembre, notesCandidature.idMembre),
    )
    .where(eq(notesCandidature.idCandidature, idCandidature))
    .orderBy(desc(notesCandidature.dateCreation));
}

export async function ajouterNoteCandidature(
  idUtilisateurEntreprise,
  idCandidature,
  contenu,
) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  await verifierAppartenanceCandidature(entreprise.idEntreprise, idCandidature);

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);

  const [note] = await db
    .insert(notesCandidature)
    .values({ idCandidature, idMembre: membre?.idMembre, contenu })
    .returning();

  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    "note_ajoutee",
  );

  return { ...note, nomMembre: membre?.nom };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Destinataires entreprise pour une notif candidature.
 * Délègue à la source de vérité unique (getUtilisateursAvecPermission).
 */
async function getDestinatairesNotifCandidats(idEntreprise) {
  return getUtilisateursAvecPermission(idEntreprise, "candidats.gerer");
}

// Retrait de candidature par le stagiaire (soft — statut "retiree", pas de DELETE)
// ─────────────────────────────────────────────────────────────────────────────

export const MOTIFS_RETRAIT = [
  {
    code: "ACCEPTED_OTHER_OPPORTUNITY",
    label: "J'ai accepté une autre opportunité.",
  },
  {
    code: "NO_LONGER_AVAILABLE",
    label: "Je ne suis plus disponible.",
  },
  {
    code: "OFFER_NO_LONGER_FITS",
    label: "L'offre ne correspond plus à mon projet.",
  },
  {
    code: "FOUND_INTERNSHIP_ELSEWHERE",
    label: "J'ai trouvé un stage ailleurs.",
  },
  {
    code: "AVAILABILITY_CHANGED",
    label: "Mes disponibilités ont changé.",
  },
  {
    code: "PERSONAL_REASONS",
    label: "Raisons personnelles.",
  },
  {
    code: "OTHER",
    label: "Autre.",
  },
];

const STATUTS_RETRAIT_AUTORISES = new Set([
  "soumise",
  "consultee",
  "preselectionnee",
]);

/**
 * Retire une candidature appartenant au stagiaire authentifié.
 * Anti-IDOR : résolution via idUtilisateur → stagiaire → candidature.
 * Idempotent si déjà retiree.
 */
export async function retirerMaCandidature(
  idUtilisateur,
  idCandidature,
  { motifCode, commentaire } = {},
) {
  const motif = MOTIFS_RETRAIT.find((m) => m.code === motifCode);
  if (!motif) {
    const err = new Error("Motif de retrait invalide");
    err.status = 400;
    throw err;
  }
  if (motif.code === "OTHER") {
    const c = (commentaire || "").trim();
    if (!c) {
      const err = new Error(
        "Veuillez préciser le motif lorsque vous sélectionnez « Autre ».",
      );
      err.status = 400;
      throw err;
    }
    if (c.length > 500) {
      const err = new Error(
        "Le commentaire ne peut pas dépasser 500 caractères",
      );
      err.status = 400;
      throw err;
    }
  } else if (commentaire && String(commentaire).length > 500) {
    const err = new Error("Le commentaire ne peut pas dépasser 500 caractères");
    err.status = 400;
    throw err;
  }

  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));
  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  const [row] = await db
    .select({
      candidature: candidatures,
      titreOffre: offresStage.titre,
      idEntreprise: offresStage.idEntreprise,
      idUtilisateurEntreprise: entreprises.idUtilisateur,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(candidatures.idCandidature, idCandidature))
    .limit(1);

  if (!row) {
    const err = new Error("Candidature introuvable");
    err.status = 404;
    throw err;
  }

  // Propriété réelle — jamais se fier uniquement à l'id fourni
  if (row.candidature.idStagiaire !== stagiaire.idStagiaire) {
    const err = new Error(
      "Vous n'êtes pas autorisé à modifier cette candidature",
    );
    err.status = 403;
    throw err;
  }

  // Idempotence
  if (row.candidature.statut === "retiree") {
    return {
      candidature: row.candidature,
      dejaRetiree: true,
    };
  }

  if (!STATUTS_RETRAIT_AUTORISES.has(row.candidature.statut)) {
    const err = new Error(
      row.candidature.statut === "acceptee"
        ? "Cette candidature a déjà été acceptée et ne peut plus être retirée."
        : row.candidature.statut === "rejetee"
          ? "Cette candidature a déjà été clôturée."
          : "Le retrait n'est plus possible pour cette candidature.",
    );
    err.status = 403;
    throw err;
  }

  // Bloquer si un stage existe déjà pour ce stagiaire lié à une convention
  // issue d'une offre finale de cette candidature (processus trop avancé)
  const entretiensRows = await db
    .select({ idEntretien: entretiens.idEntretien, statut: entretiens.statut })
    .from(entretiens)
    .where(eq(entretiens.idCandidature, idCandidature));

  for (const ent of entretiensRows) {
    const [of] = await db
      .select({
        idOffreFinale: offresFinales.idOffreFinale,
        statutReponse: offresFinales.statutReponseStagiaire,
      })
      .from(offresFinales)
      .where(eq(offresFinales.idEntretien, ent.idEntretien))
      .limit(1);
    if (of && of.statutReponse === "acceptee") {
      const err = new Error(
        "Un stage a déjà été engagé pour cette candidature. Le retrait n'est plus possible.",
      );
      err.status = 403;
      throw err;
    }
  }

  const now = new Date();
  const commentaireFinal =
    motif.code === "OTHER"
      ? String(commentaire).trim()
      : commentaire
        ? String(commentaire).trim().slice(0, 500)
        : null;

  const [updated] = await db
    .update(candidatures)
    .set({
      statut: "retiree",
      dateMajStatut: now,
      motifRetraitCode: motif.code,
      motifRetraitCommentaire: commentaireFinal,
      dateRetrait: now,
    })
    .where(
      and(
        eq(candidatures.idCandidature, idCandidature),
        eq(candidatures.idStagiaire, stagiaire.idStagiaire),
        inArray(candidatures.statut, [...STATUTS_RETRAIT_AUTORISES]),
      ),
    )
    .returning();

  // Re-check if concurrent update won
  if (!updated || updated.statut !== "retiree") {
    const [fresh] = await db
      .select()
      .from(candidatures)
      .where(eq(candidatures.idCandidature, idCandidature))
      .limit(1);
    if (fresh?.statut === "retiree") {
      return { candidature: fresh, dejaRetiree: true };
    }
    const err = new Error("Impossible de retirer la candidature");
    err.status = 409;
    throw err;
  }

  // Annuler les entretiens encore actifs (planifiés / confirmés…)
  const STATUTS_ENT_ACTIFS = ["planifie", "valide", "confirme", "reprogramme"];
  for (const ent of entretiensRows) {
    if (STATUTS_ENT_ACTIFS.includes(ent.statut)) {
      await db
        .update(entretiens)
        .set({ statut: "annule" })
        .where(eq(entretiens.idEntretien, ent.idEntretien));
    }
  }

  const detailsMotif = commentaireFinal
    ? `${motif.label} — ${commentaireFinal}`
    : motif.label;

  await enregistrerActiviteCandidature(
    row.idEntreprise,
    null,
    idCandidature,
    "candidature_retiree",
    detailsMotif,
  );

  // Notifications entreprise : source de vérité unique (candidats.gerer)
  const destinataires = await getDestinatairesNotifCandidats(row.idEntreprise);
  const messageEntreprise = `${stagiaire.prenom} ${stagiaire.nom} a retiré sa candidature pour l'offre « ${row.titreOffre} ». Motif : ${motif.label}`;
  await Promise.all(
    destinataires.map((idDest) =>
      creerNotification({
        idUtilisateur: idDest,
        type: "candidature_retiree",
        titre: "Candidature retirée",
        message: messageEntreprise,
        lien: `/candidats?id=${idCandidature}`,
        idEntreprise: row.idEntreprise,
        categoriePreference: "candidatures",
      }),
    ),
  );

  // Événement temps réel (candidature retirée) — destinataires autorisés uniquement
  for (const idDest of destinataires) {
    publishRealtime(idDest, {
      type: "candidature.retiree",
      payload: {
        idCandidature,
        idEntreprise: row.idEntreprise,
        statut: "retiree",
        titreOffre: row.titreOffre,
      },
    });
  }

  // Confirmation stagiaire (uniquement en cas de succès)
  await creerNotification({
    idUtilisateur,
    type: "candidature_retiree_confirmation",
    titre: "Candidature retirée",
    message: `Votre candidature pour « ${row.titreOffre} » (${row.nomEntreprise}) a bien été retirée.`,
    lien: "/candidatures",
  });

  return {
    candidature: updated,
    motif: { code: motif.code, label: motif.label },
    dejaRetiree: false,
  };
}
