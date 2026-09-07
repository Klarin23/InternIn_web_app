/**
 * Supervision globale des stages — console Admin.
 * Réutilise tables existantes (stages, conventions, objectifs, journal…).
 * Pas de second modèle Stage.
 */
import { eq, and, desc, sql, gte, lte, ilike, or, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  stages,
  stagiaires,
  entreprises,
  universites,
  conventionsStage,
  offresFinales,
  contactsEntreprise,
  utilisateurs,
  objectifsStage,
  tachesStage,
  journalStage,
  evaluationsHebdomadaires,
  journalActionsAdmin,
  affectationsSuperviseurStage,
  membresEquipe,
} from "../../db/schema.js";
import {
  getStageLifecycleStatus,
  toYmd,
  todayYmdInAppTz,
} from "../../utils/stageLifecycle.js";
import { computeStageProgression } from "../../utils/stageProgression.js";

const MS_DAY = 86_400_000;

function codeStage(idStage, dateCreation) {
  const y = dateCreation
    ? new Date(dateCreation).getFullYear()
    : new Date().getFullYear();
  const short = String(idStage || "").replace(/-/g, "").slice(0, 6).toUpperCase();
  return `STG-${y}-${short}`;
}

function daysSince(date) {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / MS_DAY);
}

function daysUntil(dateYmd) {
  if (!dateYmd) return null;
  const today = todayYmdInAppTz();
  const a = new Date(today + "T12:00:00Z").getTime();
  const b = new Date(dateYmd + "T12:00:00Z").getTime();
  return Math.round((b - a) / MS_DAY);
}

/**
 * Progression réelle à partir des objectifs (et tâches en secours).
 * null si aucune donnée mesurable.
 */
/**
 * Progression affichée côté admin — alignée sur l'espace superviseur :
 * 1) progressionPourcentage saisie manuellement (source de vérité métier)
 * 2) sinon ratio objectifs réalisés
 * 3) sinon ratio tâches terminées
 * 4) sinon estimation temporelle (dateDebut → dateFinPrevue), 100% si terminé
 */
function deriveConventionStatut(conv) {
  if (!conv) return "non_generee";
  const e = !!conv.accepteeParEntreprise;
  const s = !!conv.accepteeParStagiaire;
  const p = !!conv.approuveeParPlateforme;
  if (e && s && p) return "validee";
  if (e || s || p) return "partiellement_validee";
  return "en_attente";
}

/**
 * Alertes calculées uniquement à partir des données réelles.
 */
function buildAlertes(ctx) {
  const alertes = [];
  const {
    lifecycle,
    stage,
    derniereActivite,
    progression,
    conventionStatut,
    entrepriseStatutCompte,
    stagiaireStatutCompte,
    hasObjectifs,
  } = ctx;

  if (
    lifecycle === "actif" &&
    entrepriseStatutCompte &&
    ["suspendu", "desactive", "inactif"].includes(entrepriseStatutCompte)
  ) {
    alertes.push({
      niveau: "critique",
      code: "entreprise_suspendue",
      message: "Entreprise non active alors qu'un stage est actif.",
    });
  }

  if (
    lifecycle === "actif" &&
    stagiaireStatutCompte &&
    ["suspendu", "desactive"].includes(stagiaireStatutCompte)
  ) {
    alertes.push({
      niveau: "critique",
      code: "stagiaire_suspendu",
      message: "Compte stagiaire suspendu alors qu'un stage est actif.",
    });
  }

  if (lifecycle === "actif") {
    const d = daysSince(derniereActivite);
    if (d != null && d >= 7) {
      alertes.push({
        niveau: d >= 14 ? "important" : "attention",
        code: "inactivite",
        message: `Aucune activité enregistrée depuis ${d} jour${d > 1 ? "s" : ""}.`,
      });
    }
  }

  const fin = toYmd(stage.dateFinPrevue);
  if (lifecycle === "actif" && fin) {
    const left = daysUntil(fin);
    if (left != null && left < 0) {
      alertes.push({
        niveau: "important",
        code: "depasse_fin",
        message: "Date de fin dépassée alors que le stage est encore actif.",
      });
    } else if (left != null && left <= 7 && left >= 0) {
      alertes.push({
        niveau: "information",
        code: "fin_proche",
        message: `Stage arrivant à son terme dans ${left} jour${left > 1 ? "s" : ""}.`,
      });
    }
  }

  if (lifecycle === "actif" && conventionStatut !== "validee") {
    alertes.push({
      niveau: "attention",
      code: "convention_incomplete",
      message: "Convention non complètement validée pour un stage en cours.",
    });
  }

  if (
    (lifecycle === "actif" || lifecycle === "a_venir") &&
    !hasObjectifs
  ) {
    alertes.push({
      niveau: "attention",
      code: "sans_objectifs",
      message: "Aucun objectif pédagogique défini pour ce stage.",
    });
  }

  if (
    lifecycle === "actif" &&
    hasObjectifs &&
    progression?.percent === 0 &&
    daysSince(stage.dateDebut) != null &&
    daysSince(stage.dateDebut) >= 14
  ) {
    alertes.push({
      niveau: "information",
      code: "progression_nulle",
      message: "Objectifs définis mais aucune progression enregistrée.",
    });
  }

  return alertes;
}

async function loadProgressionMaps(idsStage) {
  if (!idsStage.length) {
    return { objectifsByStage: {}, tachesByStage: {}, lastJournalByStage: {} };
  }

  const [objectifs, taches, journals] = await Promise.all([
    db
      .select({
        idStage: objectifsStage.idStage,
        idObjectif: objectifsStage.idObjectif,
        description: objectifsStage.description,
        statut: objectifsStage.statut,
      })
      .from(objectifsStage)
      .where(inArray(objectifsStage.idStage, idsStage)),
    db
      .select({
        idStage: tachesStage.idStage,
        idTache: tachesStage.idTache,
        description: tachesStage.description,
        statut: tachesStage.statut,
      })
      .from(tachesStage)
      .where(inArray(tachesStage.idStage, idsStage)),
    db
      .select({
        idStage: journalStage.idStage,
        dateCreation: journalStage.dateCreation,
      })
      .from(journalStage)
      .where(inArray(journalStage.idStage, idsStage))
      .orderBy(desc(journalStage.dateCreation)),
  ]);

  const objectifsByStage = {};
  for (const o of objectifs) {
    (objectifsByStage[o.idStage] ??= []).push(o);
  }
  const tachesByStage = {};
  for (const t of taches) {
    (tachesByStage[t.idStage] ??= []).push(t);
  }
  const lastJournalByStage = {};
  for (const j of journals) {
    if (!lastJournalByStage[j.idStage]) {
      lastJournalByStage[j.idStage] = j.dateCreation;
    }
  }

  return { objectifsByStage, tachesByStage, lastJournalByStage };
}

/**
 * Liste paginée + stats pour la supervision admin.
 */
export async function listStagesSupervisionAdmin(filters = {}) {
  const {
    recherche,
    statut, // lifecycle: a_venir|actif|termine|interrompu|anomalie|tous
    idEntreprise,
    idUniversite,
    dateDebutFrom,
    dateDebutTo,
    progressionMin,
    progressionMax,
    page = 1,
    limit = 20,
  } = filters;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  // Charge un lot raisonnable puis filtre lifecycle en mémoire
  // (lifecycle dépend de dates + statut stocké). Pour volumes très élevés,
  // une matérialisation du statut serait préférable — hors scope.
  const rows = await db
    .select({
      idStage: stages.idStage,
      idConvention: stages.idConvention,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      statutStocke: stages.statut,
      progressionPourcentage: stages.progressionPourcentage,
      objectifsApprentissage: stages.objectifsApprentissage,
      dateCreation: stages.dateCreation,
      stagiairePrenom: stagiaires.prenom,
      stagiaireNom: stagiaires.nom,
      stagiaireId: stagiaires.idStagiaire,
      stagiaireUserId: stagiaires.idUtilisateur,
      entrepriseId: entreprises.idEntreprise,
      entrepriseNom: entreprises.nomEntreprise,
      entrepriseUserId: entreprises.idUtilisateur,
      universiteId: universites.idUniversite,
      universiteNom: universites.nomUniversite,
      conventionId: conventionsStage.idConvention,
      accepteeParEntreprise: conventionsStage.accepteeParEntreprise,
      accepteeParStagiaire: conventionsStage.accepteeParStagiaire,
      approuveeParPlateforme: conventionsStage.approuveeParPlateforme,
      offreNumero: offresFinales.numero,
      intitulePoste: offresFinales.intitulePoste,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .leftJoin(universites, eq(stages.idUniversite, universites.idUniversite))
    .innerJoin(
      conventionsStage,
      eq(stages.idConvention, conventionsStage.idConvention),
    )
    .leftJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .orderBy(desc(stages.dateCreation));

  // Statuts comptes (batch)
  const userIds = [
    ...new Set(
      rows
        .flatMap((r) => [r.stagiaireUserId, r.entrepriseUserId])
        .filter(Boolean),
    ),
  ];
  const comptesMap = {};
  if (userIds.length) {
    const comptes = await db
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        statutCompte: utilisateurs.statutCompte,
      })
      .from(utilisateurs)
      .where(inArray(utilisateurs.idUtilisateur, userIds));
    for (const c of comptes) comptesMap[c.idUtilisateur] = c.statutCompte;
  }

  const ids = rows.map((r) => r.idStage);
  const { objectifsByStage, tachesByStage, lastJournalByStage } =
    await loadProgressionMaps(ids);

  let items = rows.map((r) => {
    const lifecycle = getStageLifecycleStatus({
      statut: r.statutStocke,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateFinReelle: r.dateFinReelle,
    });
    const objs = objectifsByStage[r.idStage] || [];
    const tasks = tachesByStage[r.idStage] || [];
    const progression = computeStageProgression(objs, tasks, {
      progressionPourcentage: r.progressionPourcentage,
      statutStocke: r.statutStocke,
      statutLifecycle: lifecycle,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateFinReelle: r.dateFinReelle,
    });
    const derniereActivite =
      lastJournalByStage[r.idStage] || r.dateCreation || null;
    const conventionStatut = deriveConventionStatut({
      accepteeParEntreprise: r.accepteeParEntreprise,
      accepteeParStagiaire: r.accepteeParStagiaire,
      approuveeParPlateforme: r.approuveeParPlateforme,
    });
    const alertes = buildAlertes({
      lifecycle,
      stage: r,
      derniereActivite,
      progression,
      conventionStatut,
      entrepriseStatutCompte: comptesMap[r.entrepriseUserId],
      stagiaireStatutCompte: comptesMap[r.stagiaireUserId],
      hasObjectifs: objs.length > 0 || !!r.objectifsApprentissage,
    });

    return {
      idStage: r.idStage,
      code: codeStage(r.idStage, r.dateCreation),
      intitulePoste: r.intitulePoste || null,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      statut: lifecycle,
      statutStocke: r.statutStocke,
      progression,
      derniereActivite,
      alertes,
      nbAlertes: alertes.length,
      aAnomalie: alertes.some((a) =>
        ["critique", "important", "attention"].includes(a.niveau),
      ),
      conventionStatut,
      numeroOffre: r.offreNumero ?? null,
      stagiaire: {
        idStagiaire: r.stagiaireId,
        prenom: r.stagiairePrenom,
        nom: r.stagiaireNom,
        nomComplet: `${r.stagiairePrenom || ""} ${r.stagiaireNom || ""}`.trim(),
      },
      entreprise: {
        idEntreprise: r.entrepriseId,
        nom: r.entrepriseNom,
      },
      universite: r.universiteId
        ? { idUniversite: r.universiteId, nom: r.universiteNom }
        : null,
    };
  });

  // Filtres
  if (recherche && String(recherche).trim()) {
    const q = String(recherche).trim().toLowerCase();
    items = items.filter((i) => {
      const hay = [
        i.code,
        i.stagiaire.nomComplet,
        i.entreprise.nom,
        i.universite?.nom,
        i.intitulePoste,
        i.numeroOffre != null ? String(i.numeroOffre) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (statut && statut !== "tous") {
    if (statut === "anomalie") {
      items = items.filter((i) => i.aAnomalie);
    } else {
      items = items.filter((i) => i.statut === statut);
    }
  }

  if (idEntreprise) {
    items = items.filter((i) => i.entreprise.idEntreprise === idEntreprise);
  }
  if (idUniversite) {
    items = items.filter((i) => i.universite?.idUniversite === idUniversite);
  }
  if (dateDebutFrom) {
    items = items.filter(
      (i) => i.dateDebut && toYmd(i.dateDebut) >= toYmd(dateDebutFrom),
    );
  }
  if (dateDebutTo) {
    items = items.filter(
      (i) => i.dateDebut && toYmd(i.dateDebut) <= toYmd(dateDebutTo),
    );
  }
  if (progressionMin != null && progressionMin !== "") {
    const min = Number(progressionMin);
    items = items.filter(
      (i) => i.progression.percent != null && i.progression.percent >= min,
    );
  }
  if (progressionMax != null && progressionMax !== "") {
    const max = Number(progressionMax);
    items = items.filter(
      (i) => i.progression.percent != null && i.progression.percent <= max,
    );
  }

  // Stats globales (sur ensemble filtré hors pagination, mais avant page)
  // Pour les KPI globaux non filtrés, recalculer sur tous les stages transformés
  // avant filtres utilisateur — on recalcule depuis rows mappés avant filtres.
  // Simplification : stats sur le jeu après filtres "structurels" uniquement.
  // Spec wants global KPIs — compute from unfiltered mapped set.
  const allMapped = rows.map((r) => {
    const lifecycle = getStageLifecycleStatus({
      statut: r.statutStocke,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateFinReelle: r.dateFinReelle,
    });
    return { lifecycle };
  });

  // Re-build alertes count from filtered items for anomalies card
  const stats = {
    total: allMapped.length,
    aVenir: allMapped.filter((x) => x.lifecycle === "a_venir").length,
    actifs: allMapped.filter((x) => x.lifecycle === "actif").length,
    termines: allMapped.filter((x) => x.lifecycle === "termine").length,
    interrompus: allMapped.filter((x) => x.lifecycle === "interrompu").length,
    anomalies: items.filter((i) => i.aAnomalie).length,
  };

  // If filters applied, anomalies in stats should reflect global anomalies
  // Compute global anomalies from full items before search filter
  // For simplicity: anomalies KPI = count of items with aAnomalie in full unfiltered list
  const fullItemsForAnomalies = rows.map((r) => {
    const lifecycle = getStageLifecycleStatus({
      statut: r.statutStocke,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateFinReelle: r.dateFinReelle,
    });
    const objs = objectifsByStage[r.idStage] || [];
    const tasks = tachesByStage[r.idStage] || [];
    const progression = computeStageProgression(objs, tasks, {
      progressionPourcentage: r.progressionPourcentage,
      statutStocke: r.statutStocke,
      statutLifecycle: lifecycle,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateFinReelle: r.dateFinReelle,
    });
    const derniereActivite =
      lastJournalByStage[r.idStage] || r.dateCreation || null;
    const alertes = buildAlertes({
      lifecycle,
      stage: r,
      derniereActivite,
      progression,
      conventionStatut: deriveConventionStatut({
        accepteeParEntreprise: r.accepteeParEntreprise,
        accepteeParStagiaire: r.accepteeParStagiaire,
        approuveeParPlateforme: r.approuveeParPlateforme,
      }),
      entrepriseStatutCompte: comptesMap[r.entrepriseUserId],
      stagiaireStatutCompte: comptesMap[r.stagiaireUserId],
      hasObjectifs: objs.length > 0 || !!r.objectifsApprentissage,
    });
    return alertes.some((a) =>
      ["critique", "important", "attention"].includes(a.niveau),
    );
  });
  stats.anomalies = fullItemsForAnomalies.filter(Boolean).length;

  const totalFiltered = items.length;
  const pageItems = items.slice(offset, offset + limitNum);

  return {
    stats,
    stages: pageItems,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalFiltered,
      totalPages: Math.max(1, Math.ceil(totalFiltered / limitNum)),
    },
  };
}

/**
 * Dossier Stage 360° pour un idStage (admin).
 */
export async function getStageSupervisionDetail(idStage) {
  const [row] = await db
    .select({
      stage: stages,
      stagiaire: stagiaires,
      entreprise: entreprises,
      universite: universites,
      convention: conventionsStage,
      offreFinale: offresFinales,
      superviseur: contactsEntreprise,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .leftJoin(universites, eq(stages.idUniversite, universites.idUniversite))
    .innerJoin(
      conventionsStage,
      eq(stages.idConvention, conventionsStage.idConvention),
    )
    .leftJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .leftJoin(
      contactsEntreprise,
      eq(stages.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .where(eq(stages.idStage, idStage))
    .limit(1);

  if (!row) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  const s = row.stage;
  const lifecycle = getStageLifecycleStatus(s);

  const [objectifs, taches, journal, evaluations] = await Promise.all([
    db
      .select()
      .from(objectifsStage)
      .where(eq(objectifsStage.idStage, idStage))
      .orderBy(objectifsStage.dateCreation),
    db
      .select()
      .from(tachesStage)
      .where(eq(tachesStage.idStage, idStage))
      .orderBy(tachesStage.dateCreation),
    db
      .select({
        idEntree: journalStage.idEntree,
        titre: journalStage.titre,
        description: journalStage.description,
        statut: journalStage.statutValidation,
        dateActivite: journalStage.dateActivite,
        dateCreation: journalStage.dateCreation,
      })
      .from(journalStage)
      .where(eq(journalStage.idStage, idStage))
      .orderBy(desc(journalStage.dateCreation))
      .limit(20),
    db
      .select({
        idEvaluation: evaluationsHebdomadaires.idEvaluation,
        numeroSemaine: evaluationsHebdomadaires.numeroSemaine,
        statut: evaluationsHebdomadaires.statut,
        dateSoumission: evaluationsHebdomadaires.dateSoumission,
      })
      .from(evaluationsHebdomadaires)
      .where(eq(evaluationsHebdomadaires.idStage, idStage))
      .orderBy(evaluationsHebdomadaires.numeroSemaine),
  ]);

  const progression = computeStageProgression(objectifs, taches, {
    progressionPourcentage: s.progressionPourcentage,
    statutStocke: s.statut,
    statutLifecycle: lifecycle,
    dateDebut: s.dateDebut,
    dateFinPrevue: s.dateFinPrevue,
    dateFinReelle: s.dateFinReelle,
  });
  const conventionStatut = deriveConventionStatut(row.convention);
  const derniereActivite =
    journal[0]?.dateCreation || s.dateCreation || null;

  // comptes
  const [stagUser] = await db
    .select({ statutCompte: utilisateurs.statutCompte, email: utilisateurs.email })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, row.stagiaire.idUtilisateur))
    .limit(1);
  const [entUser] = await db
    .select({ statutCompte: utilisateurs.statutCompte })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, row.entreprise.idUtilisateur))
    .limit(1);

  const alertes = buildAlertes({
    lifecycle,
    stage: s,
    derniereActivite,
    progression,
    conventionStatut,
    entrepriseStatutCompte: entUser?.statutCompte,
    stagiaireStatutCompte: stagUser?.statutCompte,
    hasObjectifs: objectifs.length > 0 || !!s.objectifsApprentissage,
  });

  // Timeline
  const timeline = [];
  if (row.convention?.dateCreation) {
    timeline.push({
      id: "conv_created",
      label: "Convention créée",
      date: row.convention.dateCreation,
      done: true,
    });
  }
  if (row.convention?.accepteeParEntreprise) {
    timeline.push({
      id: "conv_ent",
      label: "Accord entreprise",
      date: row.convention.dateAcceptationEntreprise,
      done: true,
    });
  }
  if (row.convention?.approuveeParPlateforme) {
    timeline.push({
      id: "conv_plat",
      label: "Validation plateforme",
      date: null,
      done: true,
    });
  }
  if (row.convention?.accepteeParStagiaire) {
    timeline.push({
      id: "conv_stag",
      label: "Signature stagiaire",
      date: row.convention.dateAcceptationStagiaire,
      done: true,
    });
  }
  timeline.push({
    id: "stage_created",
    label: "Stage créé",
    date: s.dateCreation,
    done: true,
  });
  timeline.push({
    id: "stage_start",
    label: "Début du stage",
    date: s.dateDebut,
    done: lifecycle !== "a_venir",
  });
  if (objectifs.length) {
    timeline.push({
      id: "objectifs",
      label: "Objectifs définis",
      date: objectifs[0].dateCreation,
      done: true,
    });
  }
  if (journal[0]) {
    timeline.push({
      id: "first_activity",
      label: "Activités journal",
      date: journal[journal.length - 1]?.dateCreation || journal[0].dateCreation,
      done: true,
    });
  }
  timeline.push({
    id: "stage_end",
    label: "Fin du stage",
    date: s.dateFinPrevue,
    done: lifecycle === "termine" || lifecycle === "interrompu",
  });

  const tachesStats = {
    total: taches.length,
    terminees: taches.filter((t) => t.statut === "terminee").length,
    enCours: taches.filter((t) => t.statut === "a_faire").length,
  };



  // Superviseur réel = affectation équipe (source de vérité)
  // Fallback = contact superviseur de l'offre (stages.idContactSuperviseur)
  let superviseur = null;
  try {
    const [aff] = await db
      .select({
        idMembre: membresEquipe.idMembre,
        nom: membresEquipe.nom,
        email: membresEquipe.email,
        roleEquipe: membresEquipe.roleEquipe,
        dateAffectation: affectationsSuperviseurStage.dateAffectation,
      })
      .from(affectationsSuperviseurStage)
      .innerJoin(
        membresEquipe,
        eq(affectationsSuperviseurStage.idMembre, membresEquipe.idMembre),
      )
      .where(eq(affectationsSuperviseurStage.idStage, idStage))
      .limit(1);

    if (aff) {
      superviseur = {
        idMembre: aff.idMembre,
        nom: aff.nom,
        fonction: aff.roleEquipe === "superviseur" ? "Superviseur" : aff.roleEquipe,
        email: aff.email,
        telephone: null,
        source: "affectation",
        dateAffectation: aff.dateAffectation,
      };
    }
  } catch (_) {
    /* table absente en environnement partiel — fallback contact */
  }

  if (!superviseur && row.superviseur) {
    superviseur = {
      idContact: row.superviseur.idContact,
      nom: row.superviseur.nom,
      fonction: row.superviseur.fonction || "Contact superviseur",
      email: row.superviseur.email,
      telephone: row.superviseur.telephone,
      source: "contact",
    };
  }

  // Audit lié (stage + convention) — journal_actions_admin existant
  let audit = [];
  try {
    const ids = [s.idStage, row.convention?.idConvention].filter(Boolean);
    if (ids.length) {
      audit = await db
        .select({
          idJournal: journalActionsAdmin.idJournal,
          action: journalActionsAdmin.action,
          typeEntite: journalActionsAdmin.typeEntite,
          motif: journalActionsAdmin.motif,
          ancienStatut: journalActionsAdmin.ancienStatut,
          nouveauStatut: journalActionsAdmin.nouveauStatut,
          dateCreation: journalActionsAdmin.dateCreation,
        })
        .from(journalActionsAdmin)
        .where(
          or(
            eq(journalActionsAdmin.idEntite, s.idStage),
            eq(journalActionsAdmin.idEntite, row.convention.idConvention),
          ),
        )
        .orderBy(desc(journalActionsAdmin.dateCreation))
        .limit(30);
    }
  } catch (_) {
    audit = [];
  }

  return {
    stage: {
      idStage: s.idStage,
      code: codeStage(s.idStage, s.dateCreation),
      intitulePoste: row.offreFinale?.intitulePoste || null,
      dateDebut: s.dateDebut,
      dateFinPrevue: s.dateFinPrevue,
      dateFinReelle: s.dateFinReelle,
      statut: lifecycle,
      statutStocke: s.statut,
      progressionPourcentage: s.progressionPourcentage ?? null,
      objectifsApprentissage: s.objectifsApprentissage,
      dateCreation: s.dateCreation,
    },
    progression,
    alertes,
    stagiaire: {
      idStagiaire: row.stagiaire.idStagiaire,
      prenom: row.stagiaire.prenom,
      nom: row.stagiaire.nom,
      email: stagUser?.email || null,
      telephone: row.stagiaire.telephone,
    },
    entreprise: {
      idEntreprise: row.entreprise.idEntreprise,
      nom: row.entreprise.nomEntreprise,
      ville: row.entreprise.ville,
    },
    universite: row.universite
      ? {
          idUniversite: row.universite.idUniversite,
          nom: row.universite.nomUniversite,
        }
      : null,
    superviseur,
    convention: {
      idConvention: row.convention.idConvention,
      numero: row.offreFinale?.numero ?? null,
      statut: conventionStatut,
      accepteeParEntreprise: row.convention.accepteeParEntreprise,
      accepteeParStagiaire: row.convention.accepteeParStagiaire,
      approuveeParPlateforme: row.convention.approuveeParPlateforme,
      dateCreation: row.convention.dateCreation,
    },
    objectifs: objectifs.map((o) => ({
      idObjectif: o.idObjectif,
      description: o.description,
      statut: o.statut,
      percent: o.statut === "realise" ? 100 : 0,
    })),
    taches: tachesStats,
    tachesListe: taches.slice(0, 30),
    journal,
    evaluations,
    timeline,
    audit,
  };
}
