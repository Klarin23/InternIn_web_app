import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  membresEquipe,
  affectationsSuperviseurStage,
  stages,
  stagiaires,
  utilisateurs,
  formations,
  universites,
  conventionsStage,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  evaluationsHebdomadaires,
  journalStage,
  observationsSuperviseurStage,
  objectifsStage,
  tachesStage,
} from "../../db/schema.js";
import {
  listNotifications,
  compterNonLues,
} from "../notifications/notifications.service.js";

const JOURS_ALERTE_FIN_STAGE = 30;
const JOURS_RETARD_EVALUATION = 7;

// -----------------------------------------------------------------------
// Helpers internes
// -----------------------------------------------------------------------

export async function getSuperviseurOrThrow(idUtilisateur) {
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(eq(membresEquipe.idUtilisateur, idUtilisateur));

  if (!membre || membre.roleEquipe !== "superviseur") {
    const err = new Error(
      "Cet espace est réservé aux membres avec le rôle Superviseur.",
    );
    err.status = 403;
    throw err;
  }
  if (membre.statutMembre !== "actif") {
    const err = new Error("Votre compte a été désactivé par votre entreprise.");
    err.status = 403;
    throw err;
  }
  return membre;
}

// Vérifie que le stage demandé est bien affecté à CE superviseur avant de
// lui en donner le détail — sans ça, n'importe quel superviseur connecté
// pourrait consulter le dossier de n'importe quel stagiaire en devinant un
// idStage.
export async function getAffectationOrThrow(idMembre, idStage) {
  const [affectation] = await db
    .select()
    .from(affectationsSuperviseurStage)
    .where(
      and(
        eq(affectationsSuperviseurStage.idStage, idStage),
        eq(affectationsSuperviseurStage.idMembre, idMembre),
      ),
    );
  if (!affectation) {
    const err = new Error("Ce stagiaire ne vous est pas affecté.");
    err.status = 403;
    throw err;
  }
  return affectation;
}

// Chaîne de jointure commune stages -> offre d'origine, identique à celle
// utilisée dans equipe.service.js pour retrouver le titre du poste et les
// infos du stagiaire à partir d'un stage.
export function baseQueryStagesSuperviseur(idMembre) {
  return db
    .select({
      idStage: stages.idStage,
      idStagiaire: stagiaires.idStagiaire,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      titrePoste: offresStage.titre,
      secteurActivite: offresStage.secteurActivite,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      progressionPourcentage: stages.progressionPourcentage,
    })
    .from(affectationsSuperviseurStage)
    .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
    .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
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
    .where(eq(affectationsSuperviseurStage.idMembre, idMembre));
}

// -----------------------------------------------------------------------
// Tableau de bord
// -----------------------------------------------------------------------

export async function getTableauDeBord(idUtilisateur) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);

  const mesStages = await baseQueryStagesSuperviseur(membre.idMembre);

  const dansTrenteJours = new Date();
  dansTrenteJours.setDate(dansTrenteJours.getDate() + JOURS_ALERTE_FIN_STAGE);

  const stagesEnCours = mesStages.filter((s) => s.statutStage === "actif");
  const stagesBientotTermines = stagesEnCours.filter(
    (s) => new Date(s.dateFinPrevue) <= dansTrenteJours,
  );
  const stagesTermines = mesStages.filter((s) => s.statutStage === "termine");

  // Évaluations à effectuer : un stage en cours est "à jour" s'il a reçu une
  // évaluation hebdomadaire soumise au cours des 7 derniers jours.
  const idsStagesEnCours = stagesEnCours.map((s) => s.idStage);
  let evaluationsAEffectuer = 0;
  if (idsStagesEnCours.length > 0) {
    const dernieresEvaluations = await db
      .select({
        idStage: evaluationsHebdomadaires.idStage,
        dateSoumission: evaluationsHebdomadaires.dateSoumission,
      })
      .from(evaluationsHebdomadaires)
      .where(
        and(
          inArray(evaluationsHebdomadaires.idStage, idsStagesEnCours),
          eq(evaluationsHebdomadaires.statut, "soumise"),
        ),
      );

    const seuilRetard = new Date();
    seuilRetard.setDate(seuilRetard.getDate() - JOURS_RETARD_EVALUATION);

    const dernieresParStage = new Map();
    for (const evalu of dernieresEvaluations) {
      const actuelle = dernieresParStage.get(evalu.idStage);
      if (!actuelle || new Date(evalu.dateSoumission) > new Date(actuelle)) {
        dernieresParStage.set(evalu.idStage, evalu.dateSoumission);
      }
    }

    evaluationsAEffectuer = idsStagesEnCours.filter((idStage) => {
      const derniere = dernieresParStage.get(idStage);
      return !derniere || new Date(derniere) < seuilRetard;
    }).length;
  }

  // Activités récentes : dernières évaluations soumises pour les stagiaires
  // supervisés.
  let activitesRecentes = [];
  if (mesStages.length > 0) {
    const evaluationsRecentes = await db
      .select({
        idEvaluation: evaluationsHebdomadaires.idEvaluation,
        idStage: evaluationsHebdomadaires.idStage,
        numeroSemaine: evaluationsHebdomadaires.numeroSemaine,
        dateSoumission: evaluationsHebdomadaires.dateSoumission,
      })
      .from(evaluationsHebdomadaires)
      .where(
        and(
          inArray(
            evaluationsHebdomadaires.idStage,
            mesStages.map((s) => s.idStage),
          ),
          eq(evaluationsHebdomadaires.statut, "soumise"),
        ),
      )
      .orderBy(desc(evaluationsHebdomadaires.dateSoumission))
      .limit(5);

    const stageParId = new Map(mesStages.map((s) => [s.idStage, s]));
    activitesRecentes = evaluationsRecentes.map((e) => {
      const stage = stageParId.get(e.idStage);
      return {
        idEvaluation: e.idEvaluation,
        numeroSemaine: e.numeroSemaine,
        dateSoumission: e.dateSoumission,
        prenomStagiaire: stage?.prenomStagiaire,
        nomStagiaire: stage?.nomStagiaire,
      };
    });
  }

  const notifications = await listNotifications(idUtilisateur, { limite: 5 });
  const notificationsNonLues = await compterNonLues(idUtilisateur);

  // ---------------------------------------------------------------------
  // « À traiter aujourd'hui » : agrégation des actions nécessitant
  // l'attention immédiate du superviseur, chacune pointant directement vers
  // l'écran concerné côté frontend.
  // ---------------------------------------------------------------------
  const aTraiter = [];
  const stageParId = new Map(mesStages.map((s) => [s.idStage, s]));

  if (idsStagesEnCours.length > 0) {
    // Évaluations en retard / à effectuer (réutilise le calcul ci-dessus).
    const dernieresEvaluations = await db
      .select({
        idStage: evaluationsHebdomadaires.idStage,
        dateSoumission: evaluationsHebdomadaires.dateSoumission,
      })
      .from(evaluationsHebdomadaires)
      .where(
        and(
          inArray(evaluationsHebdomadaires.idStage, idsStagesEnCours),
          eq(evaluationsHebdomadaires.statut, "soumise"),
        ),
      );
    const seuilRetard = new Date();
    seuilRetard.setDate(seuilRetard.getDate() - JOURS_RETARD_EVALUATION);
    const dernieresParStage = new Map();
    for (const e of dernieresEvaluations) {
      const actuelle = dernieresParStage.get(e.idStage);
      if (!actuelle || new Date(e.dateSoumission) > new Date(actuelle)) {
        dernieresParStage.set(e.idStage, e.dateSoumission);
      }
    }
    for (const idStage of idsStagesEnCours) {
      const derniere = dernieresParStage.get(idStage);
      const stage = stageParId.get(idStage);
      if (!stage) continue;
      if (!derniere) {
        aTraiter.push({
          type: "evaluation",
          gravite: "attention",
          titre: "Évaluation à effectuer",
          description: `${stage.prenomStagiaire} ${stage.nomStagiaire}`,
          idStage,
          lien: `/mes-stagiaires/${idStage}`,
        });
      } else if (new Date(derniere) < seuilRetard) {
        aTraiter.push({
          type: "evaluation",
          gravite: "urgent",
          titre: "Évaluation en retard",
          description: `${stage.prenomStagiaire} ${stage.nomStagiaire}`,
          idStage,
          lien: `/mes-stagiaires/${idStage}`,
        });
      }
    }
  }

  // Stages arrivant bientôt à leur terme.
  for (const s of stagesBientotTermines) {
    const joursRestants = Math.max(
      0,
      Math.ceil((new Date(s.dateFinPrevue) - new Date()) / 86400000),
    );
    aTraiter.push({
      type: "fin_stage",
      gravite: "attente",
      titre: "Stage bientôt terminé",
      description: `${s.prenomStagiaire} ${s.nomStagiaire} — J-${joursRestants}`,
      idStage: s.idStage,
      lien: `/mes-stagiaires/${s.idStage}`,
    });
  }

  // Journaux de stage en attente de modération.
  if (mesStages.length > 0) {
    const journauxEnAttente = await db
      .select({
        idEntree: journalStage.idEntree,
        idStage: journalStage.idStage,
      })
      .from(journalStage)
      .where(
        and(
          inArray(
            journalStage.idStage,
            mesStages.map((s) => s.idStage),
          ),
          eq(journalStage.statutValidation, "en_attente"),
        ),
      );
    const compteParStage = new Map();
    for (const j of journauxEnAttente) {
      compteParStage.set(j.idStage, (compteParStage.get(j.idStage) || 0) + 1);
    }
    for (const [idStage, nb] of compteParStage) {
      const stage = stageParId.get(idStage);
      if (!stage) continue;
      aTraiter.push({
        type: "journal",
        gravite: "attente",
        titre: "Journal à modérer",
        description: `${stage.prenomStagiaire} ${stage.nomStagiaire} — ${nb} nouvelle${nb > 1 ? "s" : ""} entrée${nb > 1 ? "s" : ""}`,
        idStage,
        lien: `/mes-stagiaires/${idStage}/journal`,
      });
    }
  }

  // Tri : urgent d'abord, puis attention, puis attente.
  const ordreGravite = { urgent: 0, attention: 1, attente: 2 };
  aTraiter.sort(
    (a, b) => (ordreGravite[a.gravite] ?? 3) - (ordreGravite[b.gravite] ?? 3),
  );

  return {
    compteurs: {
      stagiaires: mesStages.length,
      stagesEnCours: stagesEnCours.length,
      stagesBientotTermines: stagesBientotTermines.length,
      stagesTermines: stagesTermines.length,
      evaluationsAEffectuer,
      // Le schéma actuel ne modélise pas de "rapport de stage" (la table
      // `documents` sert aux justificatifs d'inscription) — à câbler une
      // fois cette notion ajoutée au projet.
      rapportsEnAttente: 0,
    },
    aTraiterAujourdhui: aTraiter,
    activitesRecentes,
    notifications,
    notificationsNonLues,
  };
}

// -----------------------------------------------------------------------
// Mes stagiaires
// -----------------------------------------------------------------------

export async function listMesStagiaires(idUtilisateur) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  const mesStages = await baseQueryStagesSuperviseur(membre.idMembre);

  if (mesStages.length === 0) return [];

  const idsStagiaires = mesStages.map((s) => s.idStagiaire);
  const idsStages = mesStages.map((s) => s.idStage);

  const toutesFormations = await db
    .select({
      idStagiaire: formations.idStagiaire,
      nomUniversite: formations.nomUniversite,
      diplome: formations.diplome,
      anneeObtention: formations.anneeObtention,
    })
    .from(formations)
    .where(inArray(formations.idStagiaire, idsStagiaires));

  // Un stagiaire peut avoir plusieurs formations renseignées : on retient la
  // plus récente (année d'obtention la plus haute, ou la première trouvée).
  const formationParStagiaire = new Map();
  for (const f of toutesFormations) {
    const actuelle = formationParStagiaire.get(f.idStagiaire);
    if (!actuelle || (f.anneeObtention || 0) > (actuelle.anneeObtention || 0)) {
      formationParStagiaire.set(f.idStagiaire, f);
    }
  }

  const dernieresEvaluations = await db
    .select({
      idStage: evaluationsHebdomadaires.idStage,
      dateSoumission: evaluationsHebdomadaires.dateSoumission,
    })
    .from(evaluationsHebdomadaires)
    .where(
      and(
        inArray(evaluationsHebdomadaires.idStage, idsStages),
        eq(evaluationsHebdomadaires.statut, "soumise"),
      ),
    );
  const derniereActiviteParStage = new Map();
  for (const e of dernieresEvaluations) {
    const actuelle = derniereActiviteParStage.get(e.idStage);
    if (!actuelle || new Date(e.dateSoumission) > new Date(actuelle)) {
      derniereActiviteParStage.set(e.idStage, e.dateSoumission);
    }
  }

  // Objectifs et tâches — un seul aller-retour DB pour tous les stages
  // supervisés plutôt qu'un appel par carte (cf. contrainte performance).
  const [tousObjectifs, toutesTaches] = await Promise.all([
    db
      .select({
        idStage: objectifsStage.idStage,
        statut: objectifsStage.statut,
      })
      .from(objectifsStage)
      .where(inArray(objectifsStage.idStage, idsStages)),
    db
      .select({ idStage: tachesStage.idStage, statut: tachesStage.statut })
      .from(tachesStage)
      .where(inArray(tachesStage.idStage, idsStages)),
  ]);

  const objectifsParStage = new Map();
  for (const o of tousObjectifs) {
    const compte = objectifsParStage.get(o.idStage) || {
      total: 0,
      atteints: 0,
    };
    compte.total += 1;
    if (o.statut === "realise") compte.atteints += 1;
    objectifsParStage.set(o.idStage, compte);
  }

  const tachesParStage = new Map();
  for (const t of toutesTaches) {
    const compte = tachesParStage.get(t.idStage) || { total: 0, terminees: 0 };
    compte.total += 1;
    if (t.statut === "terminee") compte.terminees += 1;
    tachesParStage.set(t.idStage, compte);
  }

  const aujourdHui = new Date();

  return mesStages.map((s) => {
    const debut = new Date(s.dateDebut);
    const fin = new Date(s.dateFinPrevue);
    const dureeMs = fin - debut;
    let progression;
    if (
      s.progressionPourcentage !== null &&
      s.progressionPourcentage !== undefined
    ) {
      // Le superviseur a saisi une progression manuelle (section "Suivi de
      // progression") — elle prime toujours sur le calcul automatique.
      progression = s.progressionPourcentage;
    } else if (s.statutStage === "termine") {
      progression = 100;
    } else if (dureeMs > 0) {
      progression = Math.min(
        100,
        Math.max(0, Math.round(((aujourdHui - debut) / dureeMs) * 100)),
      );
    } else {
      progression = 0;
    }

    const formation = formationParStagiaire.get(s.idStagiaire);
    const objectifs = objectifsParStage.get(s.idStage) || {
      total: 0,
      atteints: 0,
    };
    const taches = tachesParStage.get(s.idStage) || { total: 0, terminees: 0 };

    // Alerte simple : stage en cours sans évaluation depuis 7+ jours, ou
    // bientôt terminé (réutilisé aussi dans "À traiter aujourd'hui").
    const derniereActivite = derniereActiviteParStage.get(s.idStage) || null;
    const seuilRetard = new Date();
    seuilRetard.setDate(seuilRetard.getDate() - JOURS_RETARD_EVALUATION);
    const alerte =
      s.statutStage === "actif" &&
      (!derniereActivite || new Date(derniereActivite) < seuilRetard);

    return {
      idStage: s.idStage,
      idStagiaire: s.idStagiaire,
      prenom: s.prenomStagiaire,
      nom: s.nomStagiaire,
      photoProfilUrl: s.photoProfilUrl,
      formation: formation?.diplome || null,
      universite: formation?.nomUniversite || null,
      poste: s.titrePoste,
      secteurActivite: s.secteurActivite,
      dateDebut: s.dateDebut,
      dateFinPrevue: s.dateFinPrevue,
      statutStage: s.statutStage,
      progression,
      objectifsAtteints: objectifs.atteints,
      objectifsTotal: objectifs.total,
      tachesTerminees: taches.terminees,
      tachesTotal: taches.total,
      derniereActivite,
      alerte,
    };
  });
}

// -----------------------------------------------------------------------
// Détail d'un stagiaire (espace Superviseur, section "Détails du
// stagiaire")
// -----------------------------------------------------------------------

export async function getDetailStagiaire(idUtilisateur, idStage) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  await getAffectationOrThrow(membre.idMembre, idStage);

  const [ligne] = await db
    .select({
      idStage: stages.idStage,
      objectifsApprentissage: stages.objectifsApprentissage,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      statutStage: stages.statut,
      progressionPourcentage: stages.progressionPourcentage,

      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      telephone: stagiaires.telephone,
      pays: stagiaires.pays,
      ville: stagiaires.ville,
      dateNaissance: stagiaires.dateNaissance,
      cvUrl: stagiaires.cvUrl,
      email: utilisateurs.email,

      idOffre: offresStage.idOffre,
      titreOffre: offresStage.titre,
      departementOffre: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      descriptionOffre: offresStage.description,
      responsabilites: offresStage.responsabilites,
      competencesRequises: offresStage.competencesRequises,
      modeTravail: offresStage.modeTravail,

      idConvention: conventionsStage.idConvention,
      accepteeParEntreprise: conventionsStage.accepteeParEntreprise,
      accepteeParStagiaire: conventionsStage.accepteeParStagiaire,
      valideeParUniversite: conventionsStage.valideeParUniversite,
      dateValidationUniversite: conventionsStage.dateValidationUniversite,

      nomUniversite: universites.nomUniversite,
      logoUniversiteUrl: universites.logoUrl,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
    .innerJoin(
      utilisateurs,
      eq(utilisateurs.idUtilisateur, stagiaires.idUtilisateur),
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
    .leftJoin(universites, eq(universites.idUniversite, stages.idUniversite))
    .where(eq(stages.idStage, idStage));

  if (!ligne) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  const [formation] = await db
    .select({
      typeFormation: formations.typeFormation,
      nomUniversite: formations.nomUniversite,
      faculte: formations.faculte,
      departement: formations.departement,
      diplome: formations.diplome,
      anneeEtude: formations.anneeEtude,
      anneeObtention: formations.anneeObtention,
    })
    .from(formations)
    .where(eq(formations.idStagiaire, ligne.idStagiaire))
    .orderBy(desc(formations.anneeObtention))
    .limit(1);

  // Historique du stage : fusion chronologique des évaluations soumises,
  // des entrées de journal et des observations du superviseur.
  const [evaluations, journal, observations] = await Promise.all([
    db
      .select({
        type: evaluationsHebdomadaires.idEvaluation,
        numeroSemaine: evaluationsHebdomadaires.numeroSemaine,
        date: evaluationsHebdomadaires.dateSoumission,
      })
      .from(evaluationsHebdomadaires)
      .where(
        and(
          eq(evaluationsHebdomadaires.idStage, idStage),
          eq(evaluationsHebdomadaires.statut, "soumise"),
        ),
      ),
    db
      .select({
        idEntree: journalStage.idEntree,
        titre: journalStage.titre,
        statutValidation: journalStage.statutValidation,
        date: journalStage.dateCreation,
      })
      .from(journalStage)
      .where(eq(journalStage.idStage, idStage)),
    db
      .select({
        idObservation: observationsSuperviseurStage.idObservation,
        contenu: observationsSuperviseurStage.contenu,
        date: observationsSuperviseurStage.dateCreation,
      })
      .from(observationsSuperviseurStage)
      .where(eq(observationsSuperviseurStage.idStage, idStage)),
  ]);

  const historique = [
    ...evaluations.map((e) => ({
      type: "evaluation",
      libelle: `Évaluation hebdomadaire — semaine ${e.numeroSemaine}`,
      date: e.date,
    })),
    ...journal.map((j) => ({
      type: "journal",
      libelle: `Entrée de journal : ${j.titre}`,
      statutValidation: j.statutValidation,
      date: j.date,
    })),
    ...observations.map((o) => ({
      type: "observation",
      libelle: o.contenu,
      date: o.date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    stagiaire: {
      idStagiaire: ligne.idStagiaire,
      prenom: ligne.prenom,
      nom: ligne.nom,
      photoProfilUrl: ligne.photoProfilUrl,
      email: ligne.email,
      telephone: ligne.telephone,
      pays: ligne.pays,
      ville: ligne.ville,
      dateNaissance: ligne.dateNaissance,
      cvUrl: ligne.cvUrl,
    },
    formation: formation || null,
    universite: ligne.nomUniversite
      ? { nom: ligne.nomUniversite, logoUrl: ligne.logoUniversiteUrl }
      : null,
    offre: {
      idOffre: ligne.idOffre,
      titre: ligne.titreOffre,
      departement: ligne.departementOffre,
      secteurActivite: ligne.secteurActivite,
      description: ligne.descriptionOffre,
      responsabilites: ligne.responsabilites,
      competencesRequises: ligne.competencesRequises,
      modeTravail: ligne.modeTravail,
    },
    convention: {
      idConvention: ligne.idConvention,
      accepteeParEntreprise: ligne.accepteeParEntreprise,
      accepteeParStagiaire: ligne.accepteeParStagiaire,
      valideeParUniversite: ligne.valideeParUniversite,
      dateValidationUniversite: ligne.dateValidationUniversite,
    },
    stage: {
      idStage: ligne.idStage,
      objectifsApprentissage: ligne.objectifsApprentissage,
      dateDebut: ligne.dateDebut,
      dateFinPrevue: ligne.dateFinPrevue,
      dateFinReelle: ligne.dateFinReelle,
      statut: ligne.statutStage,
      progressionPourcentage: ligne.progressionPourcentage,
    },
    historique,
  };
}
