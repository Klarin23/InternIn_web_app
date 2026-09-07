/**
 * Gestion centralisée des conventions — espace administrateur.
 * Réutilise conventions_stage + deriveConventionStatus (pas de système parallèle).
 * Pas de table de versions : 1 convention / offre finale (contrainte unique).
 */
import path from "node:path";
import {
  eq,
  and,
  desc,
  gte,
  lte,
  ilike,
  or,
  sql,
  count,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  conventionsStage,
  stages,
  stagiaires,
  entreprises,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  contactsEntreprise,
  utilisateurs,
} from "../../db/schema.js";
import {
  deriveConventionStatus,
  CONVENTION_STATUS_META,
  buildConventionPdfData,
} from "../conventions/conventions.service.js";
import { genererConventionPdf } from "../../utils/conventionPdf.js";
import { getStageLifecycleStatus } from "../../utils/stageLifecycle.js";
import { logAdminAction } from "./auditAdmin.service.js";

function nomStagiaire(s) {
  if (!s) return "—";
  return `${s.prenom || ""} ${s.nom || ""}`.trim() || "—";
}

function shortCode(id, prefix = "CNV") {
  if (!id) return "—";
  return `${prefix}-${String(id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function validationsCount(c, of) {
  const ent = !!c?.accepteeParEntreprise;
  const stag = !!c?.accepteeParStagiaire;
  const plat =
    !!c?.approuveeParPlateforme ||
    of?.statutValidationPlateforme === "approuve";
  const done = [ent, stag, plat].filter(Boolean).length;
  return { ent, stag, plat, done, total: 3 };
}

/**
 * Charge les conventions avec jointures (vue admin globale).
 */
async function loadAllConventionRows() {
  // Via stage (cas le plus complet)
  const viaStage = await db
    .select({
      convention: conventionsStage,
      offreFinale: offresFinales,
      stage: stages,
      stagiaire: stagiaires,
      entreprise: entreprises,
      superviseur: contactsEntreprise,
    })
    .from(conventionsStage)
    .innerJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .innerJoin(stages, eq(stages.idConvention, conventionsStage.idConvention))
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .leftJoin(
      contactsEntreprise,
      eq(stages.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .orderBy(desc(conventionsStage.dateCreation));

  // Conventions sans stage encore
  const viaOf = await db
    .select({
      convention: conventionsStage,
      offreFinale: offresFinales,
      stagiaire: stagiaires,
      entreprise: entreprises,
      superviseur: contactsEntreprise,
      idEntrepriseOf: offresStage.idEntreprise,
    })
    .from(conventionsStage)
    .innerJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .innerJoin(entretiens, eq(offresFinales.idEntretien, entretiens.idEntretien))
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .leftJoin(
      contactsEntreprise,
      eq(offresFinales.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .orderBy(desc(conventionsStage.dateCreation));

  const seen = new Set();
  const items = [];

  function mapRow(row, stage) {
    const id = row.convention.idConvention;
    if (seen.has(id)) return;
    seen.add(id);

    const statut = deriveConventionStatus(row.convention, row.offreFinale);
    const val = validationsCount(row.convention, row.offreFinale);
    const dateDebut = stage?.dateDebut || row.offreFinale?.dateDebut || null;
    const dateFin = stage?.dateFinPrevue || null;
    const derniereModif =
      row.convention.dateAcceptationStagiaire ||
      row.convention.dateAcceptationEntreprise ||
      row.convention.dateValidationUniversite ||
      row.convention.dateCreation;

    const coherence = checkCoherence(row, stage);

    items.push({
      idConvention: id,
      code: shortCode(id),
      numeroOffre: row.offreFinale?.numero ?? null,
      statut,
      statutMeta: CONVENTION_STATUS_META[statut] || {
        label: statut,
        description: "",
      },
      stagiaire: {
        idStagiaire: row.stagiaire.idStagiaire,
        nomComplet: nomStagiaire(row.stagiaire),
        prenom: row.stagiaire.prenom,
        nom: row.stagiaire.nom,
      },
      entreprise: {
        idEntreprise: row.entreprise.idEntreprise,
        nom: row.entreprise.nomEntreprise,
      },
      stage: stage
        ? {
            idStage: stage.idStage,
            code: shortCode(stage.idStage, "STG"),
            dateDebut: stage.dateDebut,
            dateFinPrevue: stage.dateFinPrevue,
            statut: getStageLifecycleStatus({
              statut: stage.statut,
              dateDebut: stage.dateDebut,
              dateFinPrevue: stage.dateFinPrevue,
            }),
            intitulePoste:
              row.offreFinale?.intitulePoste || "Stage",
          }
        : {
            idStage: null,
            code: null,
            dateDebut,
            dateFinPrevue: dateFin,
            statut: null,
            intitulePoste: row.offreFinale?.intitulePoste || "Stage",
          },
      validations: val,
      dateCreation: row.convention.dateCreation,
      derniereModification: derniereModif,
      alertes: coherence.alertes,
      coherenceOk: coherence.ok,
      version: 1,
    });
  }

  for (const row of viaStage) mapRow(row, row.stage);
  for (const row of viaOf) mapRow(row, null);

  return items;
}

function checkCoherence(row, stage) {
  const alertes = [];
  if (!row.stagiaire) alertes.push("Stagiaire manquant");
  if (!row.entreprise?.nomEntreprise) alertes.push("Entreprise manquante");
  if (stage) {
    if (
      row.offreFinale?.dateDebut &&
      stage.dateDebut &&
      String(row.offreFinale.dateDebut) !== String(stage.dateDebut)
    ) {
      alertes.push("Dates offre / stage divergentes");
    }
    if (stage.idEntreprise && row.entreprise?.idEntreprise) {
      // already joined same
    }
  } else {
    alertes.push("Stage non créé");
  }
  if (
    !row.convention.accepteeParEntreprise &&
    !row.convention.accepteeParStagiaire
  ) {
    // not anomaly, just early state
  }
  return { ok: alertes.length === 0, alertes };
}

export async function listAdminConventions(filters = {}) {
  const {
    recherche,
    statut,
    coherence,
    page = 1,
    limit = 25,
  } = filters;

  let items = await loadAllConventionRows();

  if (statut && statut !== "tous" && statut !== "toutes") {
    items = items.filter((i) => i.statut === statut);
  }

  if (coherence === "ok") items = items.filter((i) => i.coherenceOk);
  if (coherence === "anomalie") items = items.filter((i) => !i.coherenceOk);

  if (recherche && String(recherche).trim()) {
    const q = String(recherche).trim().toLowerCase();
    items = items.filter((i) => {
      const blob = [
        i.code,
        i.stagiaire?.nomComplet,
        i.entreprise?.nom,
        i.stage?.code,
        i.stage?.intitulePoste,
        String(i.numeroOffre || ""),
        i.idConvention,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const total = items.length;
  const offset = (pageNum - 1) * limitNum;
  const slice = items.slice(offset, offset + limitNum);

  return {
    conventions: slice,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

export async function getAdminConventionsStats() {
  const items = await loadAllConventionRows();
  const by = {};
  for (const i of items) {
    by[i.statut] = (by[i.statut] || 0) + 1;
  }
  const anomalies = items.filter((i) => !i.coherenceOk).length;
  const enAttente = items.filter((i) =>
    [
      "BROUILLON",
      "EN_ATTENTE_VALIDATION",
      "EN_ATTENTE_SIGNATURE_STAGIAIRE",
      "EN_ATTENTE_SIGNATURE_ENTREPRISE",
    ].includes(i.statut),
  ).length;
  const partielles = items.filter((i) => {
    const d = i.validations?.done || 0;
    return d > 0 && d < 3 && i.statut !== "VALIDEE" && i.statut !== "REFUSEE";
  }).length;

  return {
    total: items.length,
    enAttente,
    partielles,
    validees: by.VALIDEE || 0,
    refusees: by.REFUSEE || 0,
    brouillons: by.BROUILLON || 0,
    anomalies,
    parStatut: by,
  };
}

export async function getAdminConventionDetail(idConvention) {
  const [conv] = await db
    .select()
    .from(conventionsStage)
    .where(eq(conventionsStage.idConvention, idConvention))
    .limit(1);

  if (!conv) {
    const err = new Error("Convention introuvable");
    err.status = 404;
    throw err;
  }

  const [offreFinale] = await db
    .select()
    .from(offresFinales)
    .where(eq(offresFinales.idOffreFinale, conv.idOffreFinale))
    .limit(1);

  const [stageRow] = await db
    .select()
    .from(stages)
    .where(eq(stages.idConvention, idConvention))
    .limit(1);

  let stagiaireId = stageRow?.idStagiaire;
  let idEntreprise = stageRow?.idEntreprise;

  if (!stagiaireId || !idEntreprise) {
    const [chain] = await db
      .select({
        idStagiaire: candidatures.idStagiaire,
        idEntreprise: offresStage.idEntreprise,
      })
      .from(offresFinales)
      .innerJoin(entretiens, eq(offresFinales.idEntretien, entretiens.idEntretien))
      .innerJoin(
        candidatures,
        eq(entretiens.idCandidature, candidatures.idCandidature),
      )
      .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
      .where(eq(offresFinales.idOffreFinale, conv.idOffreFinale))
      .limit(1);
    stagiaireId = stagiaireId || chain?.idStagiaire;
    idEntreprise = idEntreprise || chain?.idEntreprise;
  }

  const [stagiaire] = stagiaireId
    ? await db
        .select()
        .from(stagiaires)
        .where(eq(stagiaires.idStagiaire, stagiaireId))
        .limit(1)
    : [null];

  const [entreprise] = idEntreprise
    ? await db
        .select()
        .from(entreprises)
        .where(eq(entreprises.idEntreprise, idEntreprise))
        .limit(1)
    : [null];

  let superviseur = null;
  const contactId =
    stageRow?.idContactSuperviseur || offreFinale?.idContactSuperviseur;
  if (contactId) {
    const [c] = await db
      .select()
      .from(contactsEntreprise)
      .where(eq(contactsEntreprise.idContact, contactId))
      .limit(1);
    superviseur = c || null;
  }

  const statut = deriveConventionStatus(conv, offreFinale);
  const val = validationsCount(conv, offreFinale);
  const coherence = checkCoherence(
    { convention: conv, offreFinale, stagiaire, entreprise },
    stageRow,
  );

  // Historique simple depuis flags
  const historique = [];
  if (conv.dateCreation) {
    historique.push({
      label: "Convention créée",
      date: conv.dateCreation,
    });
  }
  if (conv.dateAcceptationEntreprise) {
    historique.push({
      label: "Acceptée par l'entreprise",
      date: conv.dateAcceptationEntreprise,
    });
  }
  if (conv.dateAcceptationStagiaire) {
    historique.push({
      label: "Acceptée par le stagiaire",
      date: conv.dateAcceptationStagiaire,
    });
  }
  if (conv.approuveeParPlateforme || offreFinale?.statutValidationPlateforme === "approuve") {
    historique.push({
      label: "Approuvée par la plateforme",
      date: offreFinale?.dateValidation || conv.dateCreation,
    });
  }
  historique.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    convention: {
      idConvention: conv.idConvention,
      code: shortCode(conv.idConvention),
      idOffreFinale: conv.idOffreFinale,
      numeroOffre: offreFinale?.numero ?? null,
      statut,
      statutMeta: CONVENTION_STATUS_META[statut] || {
        label: statut,
        description: "",
      },
      accepteeParEntreprise: !!conv.accepteeParEntreprise,
      accepteeParStagiaire: !!conv.accepteeParStagiaire,
      approuveeParPlateforme:
        !!conv.approuveeParPlateforme ||
        offreFinale?.statutValidationPlateforme === "approuve",
      dateCreation: conv.dateCreation,
      dateAcceptationEntreprise: conv.dateAcceptationEntreprise,
      dateAcceptationStagiaire: conv.dateAcceptationStagiaire,
      version: 1,
    },
    validations: val,
    stagiaire: stagiaire
      ? {
          idStagiaire: stagiaire.idStagiaire,
          nomComplet: nomStagiaire(stagiaire),
          prenom: stagiaire.prenom,
          nom: stagiaire.nom,
        }
      : null,
    entreprise: entreprise
      ? {
          idEntreprise: entreprise.idEntreprise,
          nom: entreprise.nomEntreprise,
          adresse: entreprise.adresse,
        }
      : null,
    stage: stageRow
      ? {
          idStage: stageRow.idStage,
          code: shortCode(stageRow.idStage, "STG"),
          dateDebut: stageRow.dateDebut,
          dateFinPrevue: stageRow.dateFinPrevue,
          statut: getStageLifecycleStatus({
            statut: stageRow.statut,
            dateDebut: stageRow.dateDebut,
            dateFinPrevue: stageRow.dateFinPrevue,
          }),
          intitulePoste: offreFinale?.intitulePoste,
        }
      : null,
    offreFinale: offreFinale
      ? {
          idOffreFinale: offreFinale.idOffreFinale,
          intitulePoste: offreFinale.intitulePoste,
          dateDebut: offreFinale.dateDebut,
          statutValidationPlateforme: offreFinale.statutValidationPlateforme,
        }
      : null,
    superviseur: superviseur
      ? { nom: superviseur.nom, fonction: superviseur.fonction }
      : null,
    coherence,
    historique,
  };
}

/**
 * Construit un payload compatible buildConventionPdfData (vue admin).
 */
async function buildAdminPdfPayload(idConvention) {
  const detail = await getAdminConventionDetail(idConvention);
  // Réutiliser getConventionEntrepriseById si possible via idEntreprise
  if (!detail.entreprise?.idEntreprise) {
    const err = new Error("Données insuffisantes pour générer le PDF");
    err.status = 400;
    throw err;
  }

  // Import dynamique du détail entreprise pour payload PDF complet
  const { getConventionEntrepriseById } = await import(
    "../conventions/conventions.service.js"
  );
  return getConventionEntrepriseById(
    detail.entreprise.idEntreprise,
    idConvention,
  );
}

function waitForPdfFile(filepath, attempts = 40) {
  return new Promise((resolve, reject) => {
    const fs = require("node:fs");
    let n = 0;
    const tick = () => {
      if (fs.existsSync(filepath)) return resolve();
      if (++n >= attempts) return reject(new Error("PDF non généré à temps"));
      setTimeout(tick, 50);
    };
    tick();
  });
}

async function waitUntilPdfReady(filepath, maxMs = 15000) {
  const fsSync = await import("node:fs");
  const started = Date.now();
  let lastSize = -1;
  let stable = 0;
  while (Date.now() - started < maxMs) {
    if (fsSync.existsSync(filepath)) {
      try {
        const size = fsSync.statSync(filepath).size;
        if (size > 0 && size === lastSize) {
          stable += 1;
          if (stable >= 2) return; // taille stable 2 ticks
        } else {
          stable = 0;
          lastSize = size;
        }
      } catch {
        /* fichier en cours d'écriture */
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const err = new Error("Génération PDF échouée ou trop lente");
  err.status = 500;
  throw err;
}

export async function getAdminConventionPdfPath(
  idConvention,
  lang = "fr",
  idAdministrateur = null,
) {
  const data = await buildAdminPdfPayload(idConvention);
  const pdfData = buildConventionPdfData(data);
  const relative = genererConventionPdf(pdfData, lang === "en" ? "en" : "fr");
  // relative = "conventions/<id>-fr.pdf" → uploads/conventions/...
  const filepath = path.resolve(process.cwd(), "uploads", relative);

  await waitUntilPdfReady(filepath);

  // Audit best-effort (ne doit jamais bloquer le téléchargement)
  if (idAdministrateur) {
    try {
      // idAdministrateur reçu peut être idUtilisateur : résoudre idAdmin
      let adminId = idAdministrateur;
      try {
        const { administrateurs } = await import("../../db/schema.js");
        const { eq } = await import("drizzle-orm");
        const [row] = await db
          .select({ idAdmin: administrateurs.idAdmin })
          .from(administrateurs)
          .where(eq(administrateurs.idUtilisateur, idAdministrateur))
          .limit(1);
        if (row?.idAdmin) adminId = row.idAdmin;
      } catch {
        /* garder l'id fourni */
      }
      await logAdminAction({
        idAdministrateur: adminId,
        typeEntite: "convention",
        idEntite: idConvention,
        action: "CONVENTION_DOWNLOAD",
        motif: `Téléchargement PDF ${lang === "en" ? "EN" : "FR"}`,
      });
    } catch {
      /* ignore audit errors */
    }
  }

  const base =
    pdfData.numeroAffiche || shortCode(idConvention).replace("CNV-", "");
  return {
    filepath,
    filename: `Convention_${base}_V1_${lang === "en" ? "EN" : "FR"}.pdf`,
  };
}

/**
 * Approbation plateforme de la convention (flag réel).
 */
export async function approuverConventionPlateforme(
  idConvention,
  idAdministrateur,
  motif = null,
) {
  const [conv] = await db
    .select()
    .from(conventionsStage)
    .where(eq(conventionsStage.idConvention, idConvention))
    .limit(1);

  if (!conv) {
    const err = new Error("Convention introuvable");
    err.status = 404;
    throw err;
  }

  if (conv.approuveeParPlateforme) {
    return getAdminConventionDetail(idConvention);
  }

  await db
    .update(conventionsStage)
    .set({ approuveeParPlateforme: true })
    .where(eq(conventionsStage.idConvention, idConvention));

  await logAdminAction({
    idAdministrateur,
    typeEntite: "convention",
    idEntite: idConvention,
    action: "CONVENTION_VALIDATE",
    ancienStatut: "non_approuvee",
    nouveauStatut: "approuvee_plateforme",
    motif: motif || "Approbation plateforme",
  });

  return getAdminConventionDetail(idConvention);
}

export async function exportAdminConventions(
  filters,
  idAdministrateur,
) {
  const data = await listAdminConventions({
    ...filters,
    page: 1,
    limit: 500,
  });
  await logAdminAction({
    idAdministrateur,
    typeEntite: "convention",
    action: "CONVENTION_EXPORT",
    motif: `Export ${data.conventions.length} conventions`,
  });
  return data.conventions;
}
