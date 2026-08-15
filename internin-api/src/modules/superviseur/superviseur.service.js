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
  entreprises,
} from "../../db/schema.js";
import {
  listNotifications,
  compterNonLues,
} from "../notifications/notifications.service.js";
import { PERMISSIONS_PAR_DEFAUT_ROLE } from "../equipe/equipe.constants.js";

const JOURS_ALERTE_FIN_STAGE = 30;
const JOURS_RETARD_EVALUATION = 7;

// -----------------------------------------------------------------------
// Helpers internes — accès unifié Superviseur + Entreprise
// -----------------------------------------------------------------------

/**
 * Résout le contexte de supervision pour l'utilisateur connecté.
 * Modes supportés :
 *  - "superviseur"      : membre d'équipe roleEquipe=superviseur → stages affectés
 *  - "entreprise"       : compte propriétaire de l'entreprise → tous les stages de l'entreprise
 *  - "admin_entreprise" : admin principal (ou permission stagiaires.suivre) → tous les stages de l'entreprise
 *
 * Sécurité : chaque mode est strictement limité à son périmètre (affectation ou idEntreprise).
 */
export async function resolveSupervisionAccess(idUtilisateur) {
  // 1. Compte propriétaire de l'entreprise
  const [entreprise] = await db
    .select({
      idEntreprise: entreprises.idEntreprise,
    })
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateur));

  if (entreprise) {
    return {
      mode: "entreprise",
      idEntreprise: entreprise.idEntreprise,
      idMembre: null,
    };
  }

  // 2. Membre d'équipe actif
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idUtilisateur, idUtilisateur),
        eq(membresEquipe.statutMembre, "actif"),
      ),
    );

  if (!membre) {
    const err = new Error(
      "Accès réservé aux superviseurs et aux comptes entreprise autorisés.",
    );
    err.status = 403;
    throw err;
  }

  if (membre.roleEquipe === "superviseur") {
    return {
      mode: "superviseur",
      idEntreprise: membre.idEntreprise,
      idMembre: membre.idMembre,
    };
  }

  // Admin principal ou permission explicite "stagiaires.suivre"
  const permissions =
    membre.permissionsPersonnalisees ??
    PERMISSIONS_PAR_DEFAUT_ROLE[membre.roleEquipe] ??
    [];
  if (membre.estAdminPrincipal || permissions.includes("stagiaires.suivre")) {
    return {
      mode: "admin_entreprise",
      idEntreprise: membre.idEntreprise,
      idMembre: membre.idMembre,
    };
  }

  const err = new Error(
    "Vous n'avez pas la permission de superviser des stagiaires.",
  );
  err.status = 403;
  throw err;
}

/**
 * Rétrocompatibilité : conserve l'API historique pour les appels qui
 * attendent encore un membre superviseur strict.
 * Préférer resolveSupervisionAccess pour les nouveaux appels.
 */
export async function getSuperviseurOrThrow(idUtilisateur) {
  const access = await resolveSupervisionAccess(idUtilisateur);
  if (access.mode !== "superviseur") {
    // Pour les services qui appellent encore getSuperviseurOrThrow + getAffectationOrThrow
    // on retourne un objet "membre-like" compatible quand mode entreprise/admin
    // en s'appuyant sur assertStageAccess ailleurs.
    if (access.mode === "entreprise" || access.mode === "admin_entreprise") {
      return {
        idMembre: access.idMembre,
        idEntreprise: access.idEntreprise,
        roleEquipe: access.mode === "entreprise" ? "entreprise" : "administrateur_principal",
        statutMembre: "actif",
        _accessMode: access.mode,
      };
    }
    const err = new Error(
      "Cet espace est réservé aux membres avec le rôle Superviseur.",
    );
    err.status = 403;
    throw err;
  }
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(eq(membresEquipe.idMembre, access.idMembre));
  return { ...membre, _accessMode: "superviseur" };
}

/**
 * Vérifie l'accès à un stage selon le contexte de supervision.
 * - superviseur : doit avoir une affectation
 * - entreprise / admin_entreprise : le stage doit appartenir à leur entreprise
 */
export async function assertStageAccess(accessOrMembre, idStage) {
  const mode = accessOrMembre._accessMode || accessOrMembre.mode;
  const idMembre = accessOrMembre.idMembre;
  const idEntreprise = accessOrMembre.idEntreprise;

  if (mode === "superviseur" && idMembre) {
    return getAffectationOrThrow(idMembre, idStage);
  }

  // Entreprise ou admin : le stage doit appartenir à l'entreprise
  if (idEntreprise) {
    const [stage] = await db
      .select({ idStage: stages.idStage, idEntreprise: stages.idEntreprise })
      .from(stages)
      .where(
        and(eq(stages.idStage, idStage), eq(stages.idEntreprise, idEntreprise)),
      );
    if (!stage) {
      const err = new Error(
        "Ce stage n'appartient pas à votre entreprise ou n'existe pas.",
      );
      err.status = 403;
      throw err;
    }
    return stage;
  }

  const err = new Error("Ce stagiaire ne vous est pas accessible.");
  err.status = 403;
  throw err;
}

// Vérifie que le stage demandé est bien affecté à CE superviseur avant de
// lui en donner le détail — sans ça, n'importe quel superviseur connecté
// pourrait consulter le dossier de n'importe quel stagiaire en devinant un
// idStage.
export async function getAffectationOrThrow(idMembre, idStage) {
  // Si idMembre est null (compte entreprise pur), on ne peut pas vérifier
  // l'affectation — l'appelant doit utiliser assertStageAccess.
  if (!idMembre) {
    const err = new Error("Ce stagiaire ne vous est pas affecté.");
    err.status = 403;
    throw err;
  }
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

const STAGE_SELECT_FIELDS = {
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
};

// Chaîne de jointure commune stages -> offre d'origine (via affectation).
export function baseQueryStagesSuperviseur(idMembre) {
  return db
    .select(STAGE_SELECT_FIELDS)
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

// Tous les stages d'une entreprise (pour le compte propriétaire / admin).
export function baseQueryStagesEntreprise(idEntreprise) {
  return db
    .select(STAGE_SELECT_FIELDS)
    .from(stages)
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
    .where(eq(stages.idEntreprise, idEntreprise));
}

/** Retourne les stages accessibles selon le contexte d'accès. */
export async function listStagesForAccess(access) {
  if (access.mode === "superviseur" && access.idMembre) {
    return baseQueryStagesSuperviseur(access.idMembre);
  }
  if (access.idEntreprise) {
    return baseQueryStagesEntreprise(access.idEntreprise);
  }
  return [];
}

// -----------------------------------------------------------------------
// Tableau de bord
// -----------------------------------------------------------------------

export async function getTableauDeBord(idUtilisateur) {
  const access = await resolveSupervisionAccess(idUtilisateur);
  const mesStages = await listStagesForAccess(access);

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
          description: `${stage.prenomStagiaire} ${stage.nomStagiaire} — aucune évaluation soumise récemment`,
          idStage,
          prenomStagiaire: stage.prenomStagiaire,
          nomStagiaire: stage.nomStagiaire,
          lien: `/mes-stagiaires/evaluations`,
          actionLabel: "Évaluer maintenant",
        });
      } else if (new Date(derniere) < seuilRetard) {
        aTraiter.push({
          type: "evaluation",
          gravite: "urgent",
          titre: "Évaluation en retard",
          description: `${stage.prenomStagiaire} ${stage.nomStagiaire} — plus de ${JOURS_RETARD_EVALUATION} jours sans évaluation soumise`,
          idStage,
          prenomStagiaire: stage.prenomStagiaire,
          nomStagiaire: stage.nomStagiaire,
          lien: `/mes-stagiaires/evaluations`,
          actionLabel: "Évaluer maintenant",
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
      gravite: joursRestants <= 7 ? "attention" : "info",
      titre: "Stage bientôt terminé",
      description: `${s.prenomStagiaire} ${s.nomStagiaire} — fin dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}`,
      idStage: s.idStage,
      prenomStagiaire: s.prenomStagiaire,
      nomStagiaire: s.nomStagiaire,
      lien: `/mes-stagiaires/${s.idStage}`,
      actionLabel: "Voir le stage",
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
        gravite: "attention",
        titre: "Journal à vérifier",
        description: `${stage.prenomStagiaire} ${stage.nomStagiaire} — ${nb} entrée${nb > 1 ? "s" : ""} en attente`,
        idStage,
        prenomStagiaire: stage.prenomStagiaire,
        nomStagiaire: stage.nomStagiaire,
        lien: `/mes-stagiaires/${idStage}/journal`,
        actionLabel: "Vérifier",
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
// Calendrier de supervision — événements dérivés des données réelles
// (évaluations, fins de stage, journaux). Pas de rendez-vous fictifs.
// -----------------------------------------------------------------------
export async function getCalendrierSupervision(idUtilisateur, { annee, mois } = {}) {
  const access = await resolveSupervisionAccess(idUtilisateur);
  const mesStages = await listStagesForAccess(access);

  const now = new Date();
  const y = annee != null ? Number(annee) : now.getFullYear();
  const m = mois != null ? Number(mois) : now.getMonth() + 1; // 1-12

  const debutMois = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const finMois = new Date(y, m, 0, 23, 59, 59, 999);

  /** Normalise une date pour le calendrier (midi local → évite les décalages UTC). */
  function jourCalendrier(valeur) {
    if (!valeur) return null;
    if (typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
      const [yy, mm, dd] = valeur.split("-").map(Number);
      return new Date(yy, mm - 1, dd, 12, 0, 0, 0);
    }
    const d = new Date(valeur);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  }

  function dansLeMois(d) {
    return d && d >= debutMois && d <= finMois;
  }

  const evenements = [];
  const stageParId = new Map(mesStages.map((s) => [s.idStage, s]));

  // 1. Début / fin de stage
  for (const s of mesStages) {
    const fin = jourCalendrier(s.dateFinPrevue);
    if (dansLeMois(fin)) {
      evenements.push({
        id: `fin-${s.idStage}`,
        type: "fin_stage",
        date: fin.toISOString(),
        titre: "Fin de stage prévue",
        description: `${s.prenomStagiaire} ${s.nomStagiaire}`,
        idStage: s.idStage,
        prenomStagiaire: s.prenomStagiaire,
        nomStagiaire: s.nomStagiaire,
        lien: `/mes-stagiaires/${s.idStage}`,
        gravite: "info",
      });
    }
    const deb = jourCalendrier(s.dateDebut);
    if (dansLeMois(deb)) {
      evenements.push({
        id: `debut-${s.idStage}`,
        type: "debut_stage",
        date: deb.toISOString(),
        titre: "Début de stage",
        description: `${s.prenomStagiaire} ${s.nomStagiaire}`,
        idStage: s.idStage,
        prenomStagiaire: s.prenomStagiaire,
        nomStagiaire: s.nomStagiaire,
        lien: `/mes-stagiaires/${s.idStage}`,
        gravite: "info",
      });
    }
  }

  if (mesStages.length > 0) {
    const ids = mesStages.map((s) => s.idStage);

    // 2. Évaluations soumises + dernière par stage
    const evals = await db
      .select({
        idEvaluation: evaluationsHebdomadaires.idEvaluation,
        idStage: evaluationsHebdomadaires.idStage,
        numeroSemaine: evaluationsHebdomadaires.numeroSemaine,
        dateSoumission: evaluationsHebdomadaires.dateSoumission,
        statut: evaluationsHebdomadaires.statut,
      })
      .from(evaluationsHebdomadaires)
      .where(inArray(evaluationsHebdomadaires.idStage, ids));

    const derniereSoumiseParStage = new Map();

    for (const e of evals) {
      const stage = stageParId.get(e.idStage);
      if (!stage) continue;
      if (e.statut !== "soumise" || !e.dateSoumission) continue;

      const d = jourCalendrier(e.dateSoumission);
      if (!d) continue;

      const prev = derniereSoumiseParStage.get(e.idStage);
      if (!prev || d > prev) {
        derniereSoumiseParStage.set(e.idStage, d);
      }

      if (dansLeMois(d)) {
        evenements.push({
          id: `eval-${e.idEvaluation}`,
          type: "evaluation",
          date: d.toISOString(),
          titre: `Évaluation semaine ${e.numeroSemaine}`,
          description: `${stage.prenomStagiaire} ${stage.nomStagiaire}`,
          idStage: e.idStage,
          idEvaluation: e.idEvaluation,
          numeroSemaine: e.numeroSemaine,
          prenomStagiaire: stage.prenomStagiaire,
          nomStagiaire: stage.nomStagiaire,
          lien: `/mes-stagiaires/evaluations/${e.idStage}?idEvaluation=${e.idEvaluation}`,
          gravite: "info",
        });
      }
    }

    // 3. Échéance d'évaluation (dernière soumise + 7 j, ou date début + 7 j)
    for (const s of mesStages.filter((x) => x.statutStage === "actif")) {
      const derniere = derniereSoumiseParStage.get(s.idStage);
      const base =
        derniere ||
        jourCalendrier(s.dateDebut) ||
        jourCalendrier(now);
      const due = new Date(base);
      due.setDate(due.getDate() + JOURS_RETARD_EVALUATION);
      due.setHours(12, 0, 0, 0);

      if (dansLeMois(due)) {
        const enRetard = due < now;
        evenements.push({
          id: `due-eval-${s.idStage}`,
          type: "evaluation",
          date: due.toISOString(),
          titre: enRetard ? "Évaluation en retard" : "Évaluation à effectuer",
          description: `${s.prenomStagiaire} ${s.nomStagiaire}`,
          idStage: s.idStage,
          prenomStagiaire: s.prenomStagiaire,
          nomStagiaire: s.nomStagiaire,
          lien: `/mes-stagiaires/evaluations`,
          gravite: enRetard ? "urgent" : "attention",
        });
      }
    }

    // 4. Journal — date d'activité (prioritaire), sinon date de création
    const journaux = await db
      .select({
        idEntree: journalStage.idEntree,
        idStage: journalStage.idStage,
        titre: journalStage.titre,
        statutValidation: journalStage.statutValidation,
        dateActivite: journalStage.dateActivite,
        dateCreation: journalStage.dateCreation,
      })
      .from(journalStage)
      .where(inArray(journalStage.idStage, ids));

    for (const j of journaux) {
      const stage = stageParId.get(j.idStage);
      if (!stage) continue;

      const d =
        jourCalendrier(j.dateActivite) || jourCalendrier(j.dateCreation);
      if (!dansLeMois(d)) continue;

      evenements.push({
        id: `journal-${j.idEntree}`,
        type: "journal",
        date: d.toISOString(),
        titre:
          j.statutValidation === "en_attente"
            ? "Journal à vérifier"
            : j.titre || "Entrée de journal",
        description: `${stage.prenomStagiaire} ${stage.nomStagiaire}`,
        idStage: j.idStage,
        prenomStagiaire: stage.prenomStagiaire,
        nomStagiaire: stage.nomStagiaire,
        lien: `/mes-stagiaires/${j.idStage}/journal`,
        gravite: j.statutValidation === "en_attente" ? "attention" : "info",
      });
    }
  }

  evenements.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    annee: y,
    mois: m,
    evenements,
  };
}


// -----------------------------------------------------------------------
// Mes stagiaires
// -----------------------------------------------------------------------

export async function listMesStagiaires(idUtilisateur) {
  const access = await resolveSupervisionAccess(idUtilisateur);
  const mesStages = await listStagesForAccess(access);

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

  // Notes moyennes des évaluations soumises (pour vue comparative)
  const notesEvaluations = await db
    .select({
      idStage: evaluationsHebdomadaires.idStage,
      noteAssiduite: evaluationsHebdomadaires.noteAssiduite,
      noteCommunication: evaluationsHebdomadaires.noteCommunication,
      noteInitiative: evaluationsHebdomadaires.noteInitiative,
      noteProfessionnalisme: evaluationsHebdomadaires.noteProfessionnalisme,
      noteTravailEquipe: evaluationsHebdomadaires.noteTravailEquipe,
      notePerformanceTechnique: evaluationsHebdomadaires.notePerformanceTechnique,
    })
    .from(evaluationsHebdomadaires)
    .where(
      and(
        inArray(evaluationsHebdomadaires.idStage, idsStages),
        eq(evaluationsHebdomadaires.statut, "soumise"),
      ),
    );

  const noteMoyenneParStage = new Map();
  const notesParStage = new Map();
  for (const e of notesEvaluations) {
    const notes = [
      e.noteAssiduite,
      e.noteCommunication,
      e.noteInitiative,
      e.noteProfessionnalisme,
      e.noteTravailEquipe,
      e.notePerformanceTechnique,
    ].filter((n) => n != null && n >= 1 && n <= 5);
    if (notes.length === 0) continue;
    const avg = notes.reduce((a, b) => a + b, 0) / notes.length;
    if (!notesParStage.has(e.idStage)) notesParStage.set(e.idStage, []);
    notesParStage.get(e.idStage).push(avg);
  }
  for (const [idStage, avgs] of notesParStage) {
    const moyenne =
      Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
    noteMoyenneParStage.set(idStage, moyenne);
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

    const noteMoyenne = noteMoyenneParStage.get(s.idStage) ?? null;

    // Situation pour vue comparative — règles basées sur données réelles
    // (progression, note moyenne, alerte évaluation, statut stage).
    // Cohérent avec le centre d'alertes (alerte = évaluation en retard).
    let situation = "bon";
    let situationLabel = "Bon";
    if (s.statutStage === "interrompu") {
      situation = "critique";
      situationLabel = "Critique";
    } else if (s.statutStage === "termine") {
      situation = "termine";
      situationLabel = "Terminé";
    } else if (alerte && (progression < 40 || (noteMoyenne != null && noteMoyenne < 2.5))) {
      situation = "critique";
      situationLabel = "Critique";
    } else if (alerte || progression < 50 || (noteMoyenne != null && noteMoyenne < 3.0)) {
      situation = "attention";
      situationLabel = "Attention";
    } else if (progression < 70 || (noteMoyenne != null && noteMoyenne < 3.5)) {
      situation = "surveiller";
      situationLabel = "À surveiller";
    } else if (progression >= 85 && (noteMoyenne == null || noteMoyenne >= 4.2)) {
      situation = "excellent";
      situationLabel = "Excellent";
    }

    // Jours restants avant fin de stage
    let joursRestants = null;
    if (s.statutStage === "actif" && s.dateFinPrevue) {
      joursRestants = Math.max(
        0,
        Math.ceil((new Date(s.dateFinPrevue) - aujourdHui) / 86400000),
      );
    }

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
      noteMoyenne,
      situation,
      situationLabel,
      joursRestants,
    };
  });
}

// -----------------------------------------------------------------------
// Détail d'un stagiaire (espace Superviseur, section "Détails du
// stagiaire")
// -----------------------------------------------------------------------

export async function getDetailStagiaire(idUtilisateur, idStage) {
  const access = await resolveSupervisionAccess(idUtilisateur);
  await assertStageAccess(access, idStage);

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
