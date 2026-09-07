/**
 * Centre de contrôle & détection d'anomalies (Admin).
 * Détection serveur uniquement, basée sur les données réelles.
 * Résolutions persistées via journal_actions_admin (pas de table parallèle).
 *
 * ⚠️ Séparation stricte : ce module ne consomme PAS le moteur de sécurité
 * (comptes / alertes / scoring). KPI = anomalies de stage (detectAll) uniquement.
 */
import { eq, and, desc, inArray, gte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  stages,
  stagiaires,
  entreprises,
  universites,
  conventionsStage,
  offresFinales,
  utilisateurs,
  objectifsStage,
  tachesStage,
  journalStage,
  journalActionsAdmin,
} from "../../db/schema.js";
import {
  getStageLifecycleStatus,
  toYmd,
  todayYmdInAppTz,
} from "../../utils/stageLifecycle.js";
import {
  DETECTION_DEFAULTS,
  PRIORITE_ORDER,
} from "./controleCentre.defaults.js";
import { creerNotification } from "../notifications/notifications.service.js";

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

function daysUntil(ymd) {
  if (!ymd) return null;
  const today = todayYmdInAppTz();
  const a = new Date(`${today}T12:00:00Z`).getTime();
  const b = new Date(`${ymd}T12:00:00Z`).getTime();
  return Math.round((b - a) / MS_DAY);
}

function fingerprint(code, idStage) {
  return `${code}::${idStage}`;
}

/**
 * Règle métier unique : fin prévisionnelle strictement antérieure au début.
 * Source de vérité serveur — jamais le fingerprint client.
 */
export function detectDateIncoherence(dateDebut, dateFinPrevue) {
  const debut = toYmd(dateDebut);
  const fin = toYmd(dateFinPrevue);
  if (!debut || !fin) {
    return { present: false, debut, fin };
  }
  if (fin < debut) {
    return { present: true, debut, fin, code: "dates_incoherentes" };
  }
  return { present: false, debut, fin };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDatesIncoherentesFingerprint(fp) {
  if (!fp || typeof fp !== "string") return null;
  const parts = fp.split("::");
  if (parts.length < 2 || parts[0] !== "dates_incoherentes") return null;
  const idStage = parts[1];
  if (!idStage || !UUID_RE.test(idStage)) return null;
  return { code: "dates_incoherentes", idStage };
}


function anomaly({
  code,
  categorie,
  priorite,
  titre,
  description,
  raison,
  impact,
  actions,
  stage,
  stagiaire,
  entreprise,
}) {
  return {
    id: fingerprint(code, stage.idStage),
    code,
    categorie,
    priorite,
    titre,
    description,
    raison,
    impact: impact || null,
    actions: actions || [{ label: "Voir le stage", href: `/gestion-stages/${stage.idStage}` }],
    stage: {
      idStage: stage.idStage,
      code: codeStage(stage.idStage, stage.dateCreation),
      dateDebut: stage.dateDebut,
      dateFinPrevue: stage.dateFinPrevue,
      statut: stage.lifecycle,
    },
    stagiaire: stagiaire
      ? {
          idStagiaire: stagiaire.idStagiaire,
          nomComplet: `${stagiaire.prenom || ""} ${stagiaire.nom || ""}`.trim(),
        }
      : null,
    entreprise: entreprise
      ? { idEntreprise: entreprise.idEntreprise, nom: entreprise.nomEntreprise }
      : null,
    detecteeLe: new Date().toISOString(),
  };
}

/**
 * Charge résolutions / ignorées depuis le journal admin (30 derniers jours).
 * action: resoudre_anomalie | ignorer_anomalie
 * motif commence par le fingerprint.
 */
async function loadResolutionMap() {
  const since = new Date(Date.now() - 30 * MS_DAY);
  const rows = await db
    .select({
      action: journalActionsAdmin.action,
      motif: journalActionsAdmin.motif,
      dateCreation: journalActionsAdmin.dateCreation,
      idAdministrateur: journalActionsAdmin.idAdministrateur,
      nouveauStatut: journalActionsAdmin.nouveauStatut,
    })
    .from(journalActionsAdmin)
    .where(
      and(
        eq(journalActionsAdmin.typeEntite, "anomalie_controle"),
        gte(journalActionsAdmin.dateCreation, since),
      ),
    )
    .orderBy(desc(journalActionsAdmin.dateCreation));

  const map = {};
  for (const r of rows) {
    const fp = (r.motif || "").split("\n")[0]?.trim();
    if (!fp || map[fp]) continue;
    let statut = r.nouveauStatut;
    if (!statut) {
      if (r.action === "ignorer_anomalie") statut = "ignoree";
      else if (r.action === "alerter_entreprise_correction") statut = "en_cours";
      else if (r.action === "auto_resoudre_anomalie") statut = "resolue";
      else statut = "resolue";
    }
    map[fp] = {
      statut,
      date: r.dateCreation,
      idAdministrateur: r.idAdministrateur,
      note: (r.motif || "").split("\n").slice(1).join("\n").trim() || null,
      action: r.action,
    };
  }
  return map;
}

const CONTROL_DETECTION_BATCH_SIZE = Math.max(50, Math.min(500, Number(process.env.CONTROL_DETECTION_BATCH_SIZE || 250)));

/**
 * Détecte les anomalies par lots afin de borner la mémoire du processus.
 * Le résultat métier reste identique, mais les stages/objectifs/tâches/journaux
 * d'un seul lot sont libérés avant de charger le suivant.
 */
async function detectAll(seuils = DETECTION_DEFAULTS) {
  const out = [];
  let offset = 0;

  while (true) {
    const rows = await db
      .select({
        idStage: stages.idStage,
        dateDebut: stages.dateDebut,
        dateFinPrevue: stages.dateFinPrevue,
        dateFinReelle: stages.dateFinReelle,
        statutStocke: stages.statut,
        objectifsApprentissage: stages.objectifsApprentissage,
        dateCreation: stages.dateCreation,
        idStagiaire: stages.idStagiaire,
        idEntreprise: stages.idEntreprise,
        stagiairePrenom: stagiaires.prenom,
        stagiaireNom: stagiaires.nom,
        stagiaireUserId: stagiaires.idUtilisateur,
        entrepriseNom: entreprises.nomEntreprise,
        entrepriseUserId: entreprises.idUtilisateur,
        accepteeParEntreprise: conventionsStage.accepteeParEntreprise,
        accepteeParStagiaire: conventionsStage.accepteeParStagiaire,
        approuveeParPlateforme: conventionsStage.approuveeParPlateforme,
      })
      .from(stages)
      .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
      .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
      .innerJoin(
        conventionsStage,
        eq(stages.idConvention, conventionsStage.idConvention),
      )
      .orderBy(stages.idStage)
      .limit(CONTROL_DETECTION_BATCH_SIZE)
      .offset(offset);

    if (!rows.length) break;

    const batch = await detectAllBatch(rows, seuils);
    out.push(...batch);

    if (rows.length < CONTROL_DETECTION_BATCH_SIZE) break;
    offset += rows.length;
  }

  return out;
}

async function detectAllBatch(rows, seuils) {
  const userIds = [
    ...new Set(
      rows.flatMap((r) => [r.stagiaireUserId, r.entrepriseUserId]).filter(Boolean),
    ),
  ];
  const comptes = {};
  if (userIds.length) {
    const list = await db
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        statutCompte: utilisateurs.statutCompte,
      })
      .from(utilisateurs)
      .where(inArray(utilisateurs.idUtilisateur, userIds));
    for (const u of list) comptes[u.idUtilisateur] = u.statutCompte;
  }

  const ids = rows.map((r) => r.idStage);
  const objBy = {};
  const taskBy = {};
  const lastJournal = {};
  if (ids.length) {
    // Agrégations SQL : ne ramène pas toutes les lignes enfants en mémoire.
    const [objectifs, taches, journals] = await Promise.all([
      db
        .select({
          idStage: objectifsStage.idStage,
          total: sql`count(*)::int`,
          realises: sql`count(*) FILTER (WHERE ${objectifsStage.statut} = 'realise')::int`,
        })
        .from(objectifsStage)
        .where(inArray(objectifsStage.idStage, ids))
        .groupBy(objectifsStage.idStage),
      db
        .select({
          idStage: tachesStage.idStage,
          total: sql`count(*)::int`,
          ouvertes: sql`count(*) FILTER (WHERE ${tachesStage.statut} = 'a_faire')::int`,
        })
        .from(tachesStage)
        .where(inArray(tachesStage.idStage, ids))
        .groupBy(tachesStage.idStage),
      db
        .select({
          idStage: journalStage.idStage,
          dateCreation: sql`max(${journalStage.dateCreation})`,
        })
        .from(journalStage)
        .where(inArray(journalStage.idStage, ids))
        .groupBy(journalStage.idStage),
    ]);

    for (const o of objectifs) objBy[o.idStage] = o;
    for (const t of taches) taskBy[t.idStage] = t;
    for (const j of journals) lastJournal[j.idStage] = j.dateCreation;
  }

  const out = [];

  for (const r of rows) {
    const lifecycle = getStageLifecycleStatus({
      statut: r.statutStocke,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateFinReelle: r.dateFinReelle,
    });
    const stage = {
      idStage: r.idStage,
      dateDebut: r.dateDebut,
      dateFinPrevue: r.dateFinPrevue,
      dateCreation: r.dateCreation,
      lifecycle,
    };
    const stagiaire = {
      idStagiaire: r.idStagiaire,
      prenom: r.stagiairePrenom,
      nom: r.stagiaireNom,
    };
    const entreprise = {
      idEntreprise: r.idEntreprise,
      nomEntreprise: r.entrepriseNom,
    };
    const base = { stage, stagiaire, entreprise };
    const debut = toYmd(r.dateDebut);
    const fin = toYmd(r.dateFinPrevue);
    const objStats = objBy[r.idStage] || { total: 0, realises: 0 };
    const taskStats = taskBy[r.idStage] || { total: 0, ouvertes: 0 };
    const lastAct = lastJournal[r.idStage] || null;
    const entCompte = comptes[r.entrepriseUserId];
    const stagCompte = comptes[r.stagiaireUserId];

    // Dates incohérentes
    if (debut && fin && fin < debut) {
      out.push(
        anomaly({
          ...base,
          code: "dates_incoherentes",
          categorie: "coherence",
          priorite: "critique",
          titre: "Dates de stage incohérentes",
          description: "La date de fin est antérieure à la date de début.",
          raison: `Début ${debut} · Fin ${fin}`,
          impact: "Planification et convention potentiellement invalides.",
          actions: [
            { label: "Voir le stage", href: `/gestion-stages/${r.idStage}` },
            {
              label: "Fiche supervision entreprise",
              href: `/supervision/mes-stagiaires/${r.idStage}?anomalie=dates`,
            },
          ],
        }),
      );
    }

    // Fin dépassée mais encore actif (lifecycle devrait être termine si dates OK —
    // si statut stocké interrompu on ignore)
    if (r.statutStocke === "actif" && fin && daysUntil(fin) < 0) {
      out.push(
        anomaly({
          ...base,
          code: "actif_apres_fin",
          categorie: "stages",
          priorite: "important",
          titre: "Stage encore actif après la date de fin",
          description:
            "La date de fin prévisionnelle est dépassée alors que le statut stocké est actif.",
          raison: `Fin prévue : ${fin}`,
        }),
      );
    }

    // a_venir en base alors que début passé
    if (r.statutStocke === "a_venir" && debut && daysUntil(debut) < 0) {
      out.push(
        anomaly({
          ...base,
          code: "a_venir_depasse",
          categorie: "stages",
          priorite: "attention",
          titre: "Statut « à venir » alors que le début est passé",
          description:
            "Le statut stocké n'a pas été aligné avec le cycle de vie temporel.",
          raison: `Début : ${debut}`,
        }),
      );
    }

    // Comptes suspendus + stage actif
    if (lifecycle === "actif") {
      if (entCompte && ["suspendu", "desactive"].includes(entCompte)) {
        out.push(
          anomaly({
            ...base,
            code: "entreprise_suspendue_actif",
            categorie: "entreprises",
            priorite: "critique",
            titre: "Entreprise non active avec stage en cours",
            description:
              "L'entreprise liée a un compte suspendu ou désactivé alors qu'un stage est actif.",
            raison: `Statut compte entreprise : ${entCompte}`,
            impact: "Encadrement et conformité en risque.",
            actions: [
              { label: "Voir le stage", href: `/gestion-stages/${r.idStage}` },
              { label: "Gestion entreprises", href: "/gestion-entreprises" },
            ],
          }),
        );
      }
      if (stagCompte && ["suspendu", "desactive"].includes(stagCompte)) {
        out.push(
          anomaly({
            ...base,
            code: "stagiaire_suspendu_actif",
            categorie: "utilisateurs",
            priorite: "critique",
            titre: "Stagiaire suspendu avec stage actif",
            description:
              "Le compte du stagiaire est suspendu ou désactivé alors que le stage est actif.",
            raison: `Statut compte stagiaire : ${stagCompte}`,
          }),
        );
      }
    }

    // Convention incomplète sur stage actif / à venir
    if (lifecycle === "actif" || lifecycle === "a_venir") {
      const e = !!r.accepteeParEntreprise;
      const s = !!r.accepteeParStagiaire;
      const p = !!r.approuveeParPlateforme;
      if (!(e && s && p)) {
        const manquants = [
          !e && "entreprise",
          !s && "stagiaire",
          !p && "plateforme",
        ].filter(Boolean);
        out.push(
          anomaly({
            ...base,
            code: "convention_incomplete",
            categorie: "conventions",
            priorite: lifecycle === "actif" ? "important" : "attention",
            titre: "Convention non complètement validée",
            description: `Validations manquantes : ${manquants.join(", ")}.`,
            raison: "Au moins une des trois validations officielles est absente.",
          }),
        );
      }
    }

    // Inactivité journal
    if (lifecycle === "actif") {
      const ref = lastAct || r.dateCreation;
      const d = daysSince(ref);
      if (d != null && d >= seuils.inactiviteJours) {
        out.push(
          anomaly({
            ...base,
            code: "inactivite_journal",
            categorie: "activite",
            priorite: d >= seuils.inactiviteJours * 2 ? "important" : "attention",
            titre: "Aucune activité récente dans le journal",
            description: `Pas d'entrée de journal depuis ${d} jour${d > 1 ? "s" : ""}.`,
            raison: `Seuil configuré : ${seuils.inactiviteJours} jours.`,
          }),
        );
      }
    }

    // Objectifs absents
    if (
      (lifecycle === "actif" || lifecycle === "a_venir") &&
      objStats.total === 0 &&
      !r.objectifsApprentissage
    ) {
      out.push(
        anomaly({
          ...base,
          code: "sans_objectifs",
          categorie: "objectifs",
          priorite: "attention",
          titre: "Aucun objectif pédagogique défini",
          description:
            "Ni objectifs_stage ni texte d'objectifs d'apprentissage n'est présent.",
          raison: "Les objectifs sont attendus dès la préparation de l'offre finale.",
        }),
      );
    }

    // Objectifs définis mais aucun réalisé après X jours d'activité
    if (
      lifecycle === "actif" &&
      objStats.total > 0 &&
      objStats.realises === 0
    ) {
      const d = daysSince(r.dateDebut);
      if (d != null && d >= seuils.objectifsSansProgressionJours) {
        out.push(
          anomaly({
            ...base,
            code: "objectifs_sans_progression",
            categorie: "objectifs",
            priorite: "information",
            titre: "Objectifs sans progression",
            description: `Aucun objectif marqué réalisé après ${d} jours de stage.`,
            raison: `Seuil : ${seuils.objectifsSansProgressionJours} jours.`,
          }),
        );
      }
    }

    // Fin proche
    if (lifecycle === "actif" && fin) {
      const left = daysUntil(fin);
      if (left != null && left >= 0 && left <= seuils.finProcheJours) {
        out.push(
          anomaly({
            ...base,
            code: "fin_proche",
            categorie: "stages",
            priorite: "information",
            titre: "Stage arrivant à son terme",
            description: `Fin prévue dans ${left} jour${left > 1 ? "s" : ""}.`,
            raison: `Seuil d'alerte : ${seuils.finProcheJours} jours.`,
          }),
        );
      }
    }

    // Trop de tâches ouvertes (signal discret, seulement si volume significatif)
    if (lifecycle === "actif" && taskStats.total >= 8) {
      const ouvertes = taskStats.ouvertes;
      if (ouvertes >= 8 && ouvertes / taskStats.total >= 0.85) {
        out.push(
          anomaly({
            ...base,
            code: "taches_accumulees",
            categorie: "taches",
            priorite: "information",
            titre: "Beaucoup de tâches encore ouvertes",
            description: `${ouvertes} tâches ouvertes sur ${taskStats.total}.`,
            raison: "Indicateur de charge ; à vérifier avec le superviseur.",
          }),
        );
      }
    }
  }

  return out;
}

export async function getControleCentre(filters = {}) {
  const {
    recherche,
    categorie,
    priorite,
    statut = "ouvertes", // ouvertes | resolue | ignoree | toutes
    page = 1,
    limit = 20,
  } = filters;

  const seuils = { ...DETECTION_DEFAULTS };
  const detectedAt = new Date().toISOString();
  const [raw, resolutions] = await Promise.all([
    detectAll(seuils),
    loadResolutionMap(),
  ]);

  // READ-ONLY : aucune mutation (auto-résolution via POST /admin/controle/reconcile
  // ou après correction des dates côté entreprise).

  let items = raw.map((a) => {
    const res = resolutions[a.id];
    let statut = res?.statut || "nouvelle";
    // Régression dates : si l'incohérence est à nouveau détectée, une ancienne
    // résolution (auto ou manuelle) ne doit pas masquer l'anomalie.
    // Une demande en_cours reste en_cours tant que non corrigée.
    if (
      a.code === "dates_incoherentes" &&
      (statut === "resolue" || statut === "ignoree")
    ) {
      statut = "nouvelle";
    }
    return {
      ...a,
      statut,
      resolution: res || null,
      detecteeLe: detectedAt,
    };
  });

  // Stats avant filtres UI (ouvertes = non résolues/ignorées)
  const ouvertes = items.filter(
    (a) => a.statut !== "resolue" && a.statut !== "ignoree",
  );
  const parPriorite = {
    critique: ouvertes.filter((a) => a.priorite === "critique").length,
    important: ouvertes.filter((a) => a.priorite === "important").length,
    attention: ouvertes.filter((a) => a.priorite === "attention").length,
    information: ouvertes.filter((a) => a.priorite === "information").length,
  };
  const parCategorie = {};
  for (const a of ouvertes) {
    parCategorie[a.categorie] = (parCategorie[a.categorie] || 0) + 1;
  }
  const stagesConcernes = new Set(ouvertes.map((a) => a.stage.idStage)).size;

  // Santé OPÉRATIONNELLE uniquement (anomalies de stage — jamais la sécurité comptes)
  let sante = "bon";
  if (parPriorite.critique > 0) sante = "critique";
  else if (parPriorite.important > 0 || parPriorite.attention >= 5) sante = "attention";

  // Filtres liste
  if (statut === "ouvertes") {
    items = items.filter((a) => a.statut === "nouvelle" || a.statut === "en_cours");
  } else if (statut === "resolue" || statut === "ignoree") {
    items = items.filter((a) => a.statut === statut);
  }

  if (categorie && categorie !== "toutes") {
    items = items.filter((a) => a.categorie === categorie);
  }
  if (priorite && priorite !== "toutes") {
    items = items.filter((a) => a.priorite === priorite);
  }
  if (recherche && String(recherche).trim()) {
    const q = String(recherche).trim().toLowerCase();
    items = items.filter((a) => {
      const hay = [
        a.titre,
        a.description,
        a.stage?.code,
        a.stagiaire?.nomComplet,
        a.entreprise?.nom,
        a.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  items.sort(
    (a, b) =>
      (PRIORITE_ORDER[a.priorite] ?? 9) - (PRIORITE_ORDER[b.priorite] ?? 9),
  );

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const total = items.length;
  const slice = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  const prioriteItems = ouvertes
    .slice()
    .sort(
      (a, b) =>
        (PRIORITE_ORDER[a.priorite] ?? 9) - (PRIORITE_ORDER[b.priorite] ?? 9),
    )
    .slice(0, 5);

  return {
    analyseLe: detectedAt,
    seuils,
    sante: {
      statut: sante,
      stagesSurveilles: (await db.select({ c: sql`count(*)::int` }).from(stages))[0]?.c ?? 0,
      situations: ouvertes.length,
    },
    stats: {
      // KPI anomalies de STAGE uniquement (detectAll) — indépendants de la pagination
      critique: parPriorite.critique,
      important: parPriorite.important,
      attention: parPriorite.attention,
      information: parPriorite.information,
      ouvertes: ouvertes.length,
      // Stages DISTINCTS concernés par ≥1 anomalie ouverte
      stagesConcernes,
      resolues: Object.values(resolutions).filter((r) => r.statut === "resolue")
        .length,
      ignorees: Object.values(resolutions).filter((r) => r.statut === "ignoree")
        .length,
    },
    parCategorie,
    priorite: prioriteItems,
    anomalies: slice,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

export async function resoudreAnomalieControle(
  idAdministrateur,
  { fingerprint: fp, action, note },
) {
  if (!fp || typeof fp !== "string") {
    const err = new Error("Identifiant d'anomalie requis");
    err.status = 400;
    throw err;
  }

  // Demande de correction entreprise (anomalie dates uniquement)
  if (action === "demander_correction") {
    return demanderCorrectionDatesEntreprise(idAdministrateur, { fingerprint: fp, note });
  }

  if (!["resolue", "ignoree"].includes(action)) {
    const err = new Error(
      "Action invalide (resolue | ignoree | demander_correction)",
    );
    err.status = 400;
    throw err;
  }

  // Les anomalies critiques de dates ne peuvent pas être résolues manuellement :
  // la résolution passe par la correction entreprise + re-analyse serveur.
  if (fp.startsWith("dates_incoherentes::")) {
    const err = new Error(
      "Cette anomalie critique ne peut pas être marquée résolue manuellement. Demandez la correction à l'entreprise.",
    );
    err.status = 400;
    err.code = "DATES_REQUIRE_CORRECTION";
    throw err;
  }

  const motif = note ? `${fp}\n${note}` : fp;
  await db.insert(journalActionsAdmin).values({
    idAdministrateur,
    typeEntite: "anomalie_controle",
    idEntite: null,
    action: action === "ignoree" ? "ignorer_anomalie" : "resoudre_anomalie",
    ancienStatut: "nouvelle",
    nouveauStatut: action,
    motif,
  });

  return { ok: true, fingerprint: fp, statut: action };
}

/**
 * Admin demande à l'entreprise de corriger les dates incohérentes d'un stage.
 * Une seule demande active à la fois par fingerprint.
 */
export async function demanderCorrectionDatesEntreprise(
  idAdministrateur,
  { fingerprint: fpClient, note },
) {
  // 1) Parser le fingerprint client uniquement comme *indice* de stage
  const parsed = parseDatesIncoherentesFingerprint(fpClient);
  if (!parsed) {
    const err = new Error(
      "Cette action n'est disponible que pour les anomalies de dates incohérentes",
    );
    err.status = 400;
    throw err;
  }

  const { idStage } = parsed;

  // 2) Charger le stage réel + entreprise propriétaire (source de vérité)
  const [row] = await db
    .select({
      idStage: stages.idStage,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      statut: stages.statut,
      idEntreprise: stages.idEntreprise,
      idUtilisateurEntreprise: entreprises.idUtilisateur,
      nomEntreprise: entreprises.nomEntreprise,
      dateCreation: stages.dateCreation,
    })
    .from(stages)
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(stages.idStage, idStage))
    .limit(1);

  if (!row) {
    const err = new Error("Stage introuvable pour cette anomalie");
    err.status = 404;
    throw err;
  }

  // 3) Recalcul serveur obligatoire — le client ne prouve rien
  const detection = detectDateIncoherence(row.dateDebut, row.dateFinPrevue);
  if (!detection.present) {
    const err = new Error(
      "Cette anomalie n'est plus présente ou ne peut plus faire l'objet d'une demande de correction.",
    );
    err.status = 409;
    err.code = "ANOMALIE_ABSENTE";
    throw err;
  }

  // 4) Fingerprint canonique calculé serveur (ignore toute manipulation client)
  const fp = fingerprint("dates_incoherentes", row.idStage);

  // 5) Empêcher les demandes multiples (idempotence)
  const resolutions = await loadResolutionMap();
  const existing = resolutions[fp];
  if (existing?.statut === "en_cours") {
    const err = new Error(
      "Une demande de correction est déjà en cours pour cette anomalie",
    );
    err.status = 409;
    err.code = "CORRECTION_DEJA_EN_COURS";
    throw err;
  }

  const motif = note
    ? `${fp}\n${note}`
    : `${fp}\nDemande de correction des dates incohérentes (${detection.debut} → ${detection.fin})`;

  await db.insert(journalActionsAdmin).values({
    idAdministrateur,
    typeEntite: "anomalie_controle",
    idEntite: row.idStage,
    action: "alerter_entreprise_correction",
    ancienStatut: existing?.statut || "nouvelle",
    nouveauStatut: "en_cours",
    motif,
  });

  // 6) Notification : destinataire = entreprise réellement liée au stage
  await creerNotification({
    idUtilisateur: row.idUtilisateurEntreprise,
    type: "anomalie_dates_critique",
    titre: "Incohérence critique des dates de stage",
    message:
      `Une incohérence critique a été détectée sur les dates d'un stage (${detection.debut} → ${detection.fin}). ` +
      `Une action est requise : vérifiez et corrigez la date de début. ` +
      `La date de fin sera recalculée automatiquement selon la durée contractuelle.`,
    lien: `/supervision/mes-stagiaires/${row.idStage}?anomalie=dates`,
  });

  return {
    ok: true,
    fingerprint: fp,
    statut: "en_cours",
    idStage: row.idStage,
  };
}

/**
 * Après re-analyse : si une demande de correction était en_cours et que
 * l'anomalie dates_incoherentes a disparu → résolution automatique + notif.
 * Appelé depuis getControleCentre (pas d'action frontend).
 */
async function autoResoudreDatesCorrigees(rawAnomalies, resolutions) {
  const stillPresent = new Set(
    rawAnomalies
      .filter((a) => a.code === "dates_incoherentes")
      .map((a) => a.id),
  );

  const toClose = Object.entries(resolutions).filter(
    ([fp, res]) =>
      fp.startsWith("dates_incoherentes::") &&
      res.statut === "en_cours" &&
      !stillPresent.has(fp),
  );

  for (const [fp, res] of toClose) {
    const parsed = parseDatesIncoherentesFingerprint(fp);
    const idStage = parsed?.idStage;
    if (!idStage) continue;
    await db.insert(journalActionsAdmin).values({
      idAdministrateur: res.idAdministrateur || null,
      typeEntite: "anomalie_controle",
      idEntite: idStage || null,
      action: "auto_resoudre_anomalie",
      ancienStatut: "en_cours",
      nouveauStatut: "resolue",
      motif: `${fp}\nCorrection des dates détectée — résolution automatique`,
    });

    // Notification de confirmation à l'entreprise
    if (idStage) {
      const [row] = await db
        .select({ idUtilisateur: entreprises.idUtilisateur })
        .from(stages)
        .innerJoin(
          entreprises,
          eq(stages.idEntreprise, entreprises.idEntreprise),
        )
        .where(eq(stages.idStage, idStage));
      if (row?.idUtilisateur) {
        await creerNotification({
          idUtilisateur: row.idUtilisateur,
          type: "anomalie_dates_corrigee",
          titre: "Correction des dates validée",
          message:
            "La correction des dates a été détectée. Les données sont maintenant cohérentes et l'anomalie critique est résolue.",
          lien: `/supervision/mes-stagiaires/${idStage}`,
        });
      }
    }

    // Mettre à jour la map en mémoire pour le reste de la requête
    resolutions[fp] = {
      statut: "resolue",
      date: new Date(),
      idAdministrateur: res.idAdministrateur,
      note: "Correction des dates détectée — résolution automatique",
    };
  }
}


/**
 * Réconciliation explicite (POST) : détection + auto-résolution des dates corrigées.
 * Idempotente — peut être appelée manuellement ou après une correction entreprise.
 * Ne doit JAMAIS être invoquée depuis un GET.
 */
export async function reconcileControleCentre() {
  const seuils = { ...DETECTION_DEFAULTS };
  const [raw, resolutions] = await Promise.all([
    detectAll(seuils),
    loadResolutionMap(),
  ]);
  await autoResoudreDatesCorrigees(raw, resolutions);
  const stillOpenDates = raw.filter((a) => a.code === "dates_incoherentes").length;
  const closed = Object.values(resolutions).filter((r) => r.statut === "resolue").length;
  return {
    ok: true,
    anomaliesDetectees: raw.length,
    datesIncoherentesOuvertes: stillOpenDates,
    // Note: closed count is cumulative in map after autoResoudre updates memory
  };
}

export function getDetectionSettings() {
  return { ...DETECTION_DEFAULTS };
}
