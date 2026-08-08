// La contrainte UNIQUE(id_stagiaire, id_offre) en base empêche déjà les
// doublons au niveau SQL — on l'anticipe ici pour renvoyer un message
// clair plutôt qu'une erreur PostgreSQL brute au frontend.

import { eq, and, inArray, ne, desc } from "drizzle-orm";
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
  stagiaireCompetences,
  competences,
  utilisateurs,
  activitesEquipe,
  membresEquipe,
  evaluationsCandidature,
  notesCandidature,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";

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

  const [candidature] = await db
    .insert(candidatures)
    .values({
      idStagiaire: stagiaire.idStagiaire,
      idOffre,
      origine: "candidature_spontanee",
      statut: "soumise",
      lettreMotivation: lettreMotivation || null,
    })
    .returning();

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
      "Candidature envoyée",
    );

    await creerNotification({
      idUtilisateur: offreInfo.idUtilisateurEntreprise,
      type: "candidature_recue",
      titre: "Nouvelle candidature reçue",
      message: `${stagiaire.prenom} ${stagiaire.nom} a postulé pour l'offre « ${offreInfo.titreOffre} ».`,
      lien: "/candidats",
    });
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
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const conditions = [eq(offresStage.idEntreprise, entreprise.idEntreprise)];
  if (idOffre) conditions.push(eq(candidatures.idOffre, idOffre));

  const rows = await db
    .select({
      idCandidature: candidatures.idCandidature,
      statut: candidatures.statut,
      dateCandidature: candidatures.dateCandidature,
      lettreMotivation: candidatures.lettreMotivation,
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
      cvUrl: stagiaires.cvUrl,
      linkedinUrl: stagiaires.linkedinUrl,
      portfolioUrl: stagiaires.portfolioUrl,
      scoreCompletudeProfil: stagiaires.scoreCompletudeProfil,
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
      diplome: formations.diplome,
      departement: formations.departement,
      anneeEtude: formations.anneeEtude,
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
    })
    .from(stagiaireCompetences)
    .innerJoin(
      competences,
      eq(stagiaireCompetences.idCompetence, competences.idCompetence),
    )
    .where(inArray(stagiaireCompetences.idStagiaire, idsStagiaires));

  const competencesParStagiaire = {};
  competencesRows.forEach((c) => {
    (competencesParStagiaire[c.idStagiaire] ??= []).push(c.nom);
  });

  // Récupère les candidatures pour lesquelles l'entreprise a déjà validé
  // une offre finale (création de l'offre = accepteeParEntreprise).
  // Les coordonnées du stagiaire ne sont exposées qu'à partir de ce moment.
  const idsCandidatures = rows.map((r) => r.idCandidature);
  const offresFinalesRows =
    idsCandidatures.length > 0
      ? await db
          .select({
            idCandidature: entretiens.idCandidature,
          })
          .from(offresFinales)
          .innerJoin(
            entretiens,
            eq(offresFinales.idEntretien, entretiens.idEntretien),
          )
          .where(
            and(
              inArray(entretiens.idCandidature, idsCandidatures),
              ne(offresFinales.statutValidationPlateforme, "rejete"),
            ),
          )
      : [];

  const candidaturesAvecOffreValidee = new Set(
    offresFinalesRows.map((o) => o.idCandidature),
  );

  return rows.map((r) => {
    const formation = formationParStagiaire[r.idStagiaire];
    const offreValideeParEntreprise =
      candidaturesAvecOffreValidee.has(r.idCandidature) ||
      r.statut === "acceptee";

    return {
      ...r,
      // Coordonnées masquées tant que l'entreprise n'a pas validé l'offre finale
      email: offreValideeParEntreprise ? r.email : null,
      telephone: offreValideeParEntreprise ? r.telephone : null,
      nomUniversite: formation?.nomUniversite || null,
      diplome: formation?.diplome || null,
      departement: formation?.departement || null,
      anneeEtude: formation?.anneeEtude || null,
      competences: competencesParStagiaire[r.idStagiaire] || [],
      coordonneesDisponibles: offreValideeParEntreprise,
    };
  });
}

// Change le statut d'une candidature, en vérifiant d'abord que l'offre
// concernée appartient bien à l'entreprise qui fait la demande — sans ça,
// une entreprise pourrait modifier les candidatures d'une autre.
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

  const [updated] = await db
    .update(candidatures)
    .set({ statut: nouveauStatut, dateMajStatut: new Date() })
    .where(eq(candidatures.idCandidature, idCandidature))
    .returning();

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);
  const LABELS_STATUT = {
    consultee: "Profil consulté",
    preselectionnee: "Candidat présélectionné",
    rejetee: "Candidature refusée",
    acceptee: "Candidature acceptée",
    soumise: "Candidature remise en attente",
  };
  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    LABELS_STATUT[nouveauStatut] || `Statut changé : ${nouveauStatut}`,
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
  const membre = await getMembreOptionnel(idUtilisateurEntreprise);
  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    "CV téléchargé",
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
    "Évaluation mise à jour",
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

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);

  const [note] = await db
    .insert(notesCandidature)
    .values({ idCandidature, idMembre: membre?.idMembre, contenu })
    .returning();

  await enregistrerActiviteCandidature(
    entreprise.idEntreprise,
    membre?.idMembre,
    idCandidature,
    "A laissé une note",
  );

  return { ...note, nomMembre: membre?.nom };
}