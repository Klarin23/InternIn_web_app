import fs from "node:fs";
import {
  listEntreprisesEnAttente,
  listUniversitesEnAttente,
  listToutesEntreprises,
  changerStatutCompteEntreprise,
  listToutesUniversites,
  changerStatutCompteUniversite,
  verifierEntreprise,
  verifierUniversite,
  listTousUtilisateurs,
  changerStatutCompteUtilisateur,
  getStatsGlobales,
  getAdminProfile,
  getParametres,
  updateParametres,
  listDocumentsEntreprise,
  actionsMasseEntreprises,
  listEntrepriseSignalementsAdmin,
  listEntreprisePartenariatsAdmin,
  listEntrepriseEquipeAdmin,
  listEntrepriseStagesAdmin,
  listEntrepriseOffresAdmin,
  getEntrepriseAdminStats,
  getUtilisateursAdminStats,
  getUtilisateurAdminDetail,
  listUtilisateurDocumentsAdmin,
  listUtilisateurCandidaturesAdmin,
  listUtilisateurStagesAdmin,
  listUtilisateurSignalementsAdmin,
  listUtilisateurSessionsAdmin,
} from "./administrateurs.service.js";
import {
  listStagesSupervisionAdmin,
  getStageSupervisionDetail,
} from "./supervisionStages.service.js";
import {
  getControleCentre,
  resoudreAnomalieControle,
  getDetectionSettings,
  reconcileControleCentre } from "./controleCentre.service.js";
import {
  listAuditJournal,
  getAuditStats,
  getAuditEventById,
  exportAuditJournal,
} from "./auditAdmin.service.js";
import {
  listAdminConventions,
  getAdminConventionsStats,
  getAdminConventionDetail,
  getAdminConventionPdfPath,
  approuverConventionPlateforme,
  exportAdminConventions,
} from "./adminConventions.service.js";
import {
  getSecurityOverview,
  listActiveSessions,
  revokeSessionById,
  revokeAllSessionsForUser,
  listSecurityAdmins,
  listComptesARisque,
} from "./securityCentre.service.js";
import {
  listSecurityAlerts,
  getSecurityAlertById,
  getSecurityAlertsStats,
  updateSecurityAlertStatus,
} from "./securityAlerts.service.js";

export async function moi(req, res, next) {
  try {
    res.json(await getAdminProfile(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listEntreprises(req, res, next) {
  try {
    res.json(await listEntreprisesEnAttente());
  } catch (err) {
    next(err);
  }
}

export async function listUniversites(req, res, next) {
  try {
    res.json(await listUniversitesEnAttente());
  } catch (err) {
    next(err);
  }
}

export async function listToutesEntreprisesHandler(req, res, next) {
  try {
    res.json(await listToutesEntreprises(req.query.recherche));
  } catch (err) {
    next(err);
  }
}

export async function changerStatutCompteHandler(req, res, next) {
  try {
    const utilisateur = await changerStatutCompteEntreprise(
      req.params.id,
      req.body.statutCompte,
    );
    res.json({ utilisateur });
  } catch (err) {
    next(err);
  }
}

export async function listToutesUniversitesHandler(req, res, next) {
  try {
    res.json(await listToutesUniversites(req.query.recherche));
  } catch (err) {
    next(err);
  }
}

export async function changerStatutCompteUniversiteHandler(req, res, next) {
  try {
    const utilisateur = await changerStatutCompteUniversite(
      req.params.id,
      req.body.statutCompte,
    );
    res.json({ utilisateur });
  } catch (err) {
    next(err);
  }
}

export async function listTousUtilisateursHandler(req, res, next) {
  try {
    res.json(
      await listTousUtilisateurs({
        recherche: req.query.recherche,
        role: req.query.role,
        statut: req.query.statut,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function changerStatutCompteUtilisateurHandler(req, res, next) {
  try {
    const utilisateur = await changerStatutCompteUtilisateur(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutCompte,
    );
    res.json({ utilisateur });
  } catch (err) {
    next(err);
  }
}

export async function verifierEntrepriseHandler(req, res, next) {
  try {
    const entreprise = await verifierEntreprise(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutVerification,
      {
        motif: req.body.motif,
        commentaire: req.body.commentaire,
      },
    );
    res.json({ entreprise });
  } catch (err) {
    next(err);
  }
}

export async function actionsMasseEntreprisesHandler(req, res, next) {
  try {
    const data = await actionsMasseEntreprises(req.user.idUtilisateur, {
      action: req.body.action,
      ids: req.body.ids,
      motif: req.body.motif,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function verifierUniversiteHandler(req, res, next) {
  try {
    const universite = await verifierUniversite(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutVerification,
    );
    res.json({ universite });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    res.json(await getStatsGlobales());
  } catch (err) {
    next(err);
  }
}

export async function getParametresHandler(req, res, next) {
  try {
    res.json(await getParametres());
  } catch (err) {
    next(err);
  }
}

export async function updateParametresHandler(req, res, next) {
  try {
    res.json(await updateParametres(req.body, req.user?.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listDocumentsEntrepriseHandler(req, res, next) {
  try {
    res.json(await listDocumentsEntreprise(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getUtilisateursStatsHandler(req, res, next) {
  try {
    res.json(await getUtilisateursAdminStats());
  } catch (err) {
    next(err);
  }
}
export async function getUtilisateurDetailHandler(req, res, next) {
  try {
    res.json(await getUtilisateurAdminDetail(req.params.id));
  } catch (err) {
    next(err);
  }
}
export async function listUtilisateurDocumentsHandler(req, res, next) {
  try {
    res.json(await listUtilisateurDocumentsAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}
export async function listUtilisateurCandidaturesHandler(req, res, next) {
  try {
    res.json(await listUtilisateurCandidaturesAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}
export async function listUtilisateurStagesHandler(req, res, next) {
  try {
    res.json(await listUtilisateurStagesAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}
export async function listUtilisateurSignalementsHandler(req, res, next) {
  try {
    res.json(await listUtilisateurSignalementsAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}
export async function listUtilisateurSessionsHandler(req, res, next) {
  try {
    res.json(await listUtilisateurSessionsAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}


export async function listStagesSupervisionHandler(req, res, next) {
  try {
    const data = await listStagesSupervisionAdmin({
      recherche: req.query.recherche,
      statut: req.query.statut,
      idEntreprise: req.query.idEntreprise,
      idUniversite: req.query.idUniversite,
      dateDebutFrom: req.query.dateDebutFrom,
      dateDebutTo: req.query.dateDebutTo,
      progressionMin: req.query.progressionMin,
      progressionMax: req.query.progressionMax,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getStageSupervisionDetailHandler(req, res, next) {
  try {
    const data = await getStageSupervisionDetail(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}


export async function getControleCentreHandler(req, res, next) {
  try {
    res.json(
      await getControleCentre({
        recherche: req.query.recherche,
        categorie: req.query.categorie,
        priorite: req.query.priorite,
        statut: req.query.statut,
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (err) {
    next(err);
  }
}


export async function reconcileControleCentreHandler(req, res, next) {
  try {
    res.json(await reconcileControleCentre());
  } catch (err) {
    next(err);
  }
}

export async function resoudreAnomalieControleHandler(req, res, next) {
  try {
    const data = await resoudreAnomalieControle(req.user.idUtilisateur, {
      fingerprint: req.body.fingerprint || req.params.id,
      action: req.body.action,
      note: req.body.note,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getDetectionSettingsHandler(req, res, next) {
  try {
    res.json(getDetectionSettings());
  } catch (err) {
    next(err);
  }
}


export async function listAuditJournalHandler(req, res, next) {
  try {
    res.json(
      await listAuditJournal({
        recherche: req.query.recherche,
        typeEntite: req.query.typeEntite,
        action: req.query.action,
        idAdministrateur: req.query.idAdministrateur,
        periode: req.query.periode,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getAuditStatsHandler(req, res, next) {
  try {
    res.json(await getAuditStats());
  } catch (err) {
    next(err);
  }
}

export async function getAuditEventHandler(req, res, next) {
  try {
    res.json(await getAuditEventById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function exportAuditJournalHandler(req, res, next) {
  try {
    const events = await exportAuditJournal(
      {
        recherche: req.query.recherche,
        typeEntite: req.query.typeEntite,
        action: req.query.action,
        idAdministrateur: req.query.idAdministrateur,
        periode: req.query.periode || "30d",
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      },
      req.user.idUtilisateur,
    );
    res.json({ events });
  } catch (err) {
    next(err);
  }
}


export async function listAdminConventionsHandler(req, res, next) {
  try {
    res.json(
      await listAdminConventions({
        recherche: req.query.recherche,
        statut: req.query.statut,
        coherence: req.query.coherence,
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getAdminConventionsStatsHandler(req, res, next) {
  try {
    res.json(await getAdminConventionsStats());
  } catch (err) {
    next(err);
  }
}

export async function getAdminConventionDetailHandler(req, res, next) {
  try {
    res.json(await getAdminConventionDetail(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function downloadAdminConventionPdfHandler(req, res, next) {
  try {
    const lang = req.query.lang === "en" ? "en" : "fr";
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";
    const { filepath, filename } = await getAdminConventionPdfPath(
      req.params.id,
      lang,
      req.user?.idUtilisateur || req.user?.id || null,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename.replace(/"/g, "")}"`,
    );

    const stream = fs.createReadStream(filepath);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ error: "Document introuvable" });
      }
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function approuverConventionAdminHandler(req, res, next) {
  try {
    res.json(
      await approuverConventionPlateforme(
        req.params.id,
        req.user.idUtilisateur,
        req.body?.motif,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function exportAdminConventionsHandler(req, res, next) {
  try {
    const rows = await exportAdminConventions(
      {
        recherche: req.query.recherche,
        statut: req.query.statut,
        coherence: req.query.coherence,
      },
      req.user.idUtilisateur,
    );
    res.json({ conventions: rows });
  } catch (err) {
    next(err);
  }
}


export async function getSecurityOverviewHandler(req, res, next) {
  try {
    res.json(await getSecurityOverview());
  } catch (err) {
    next(err);
  }
}

export async function listSecuritySessionsHandler(req, res, next) {
  try {
    res.json(
      await listActiveSessions({
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function revokeSecuritySessionHandler(req, res, next) {
  try {
    res.json(
      await revokeSessionById(req.params.id, req.user.idUtilisateur),
    );
  } catch (err) {
    next(err);
  }
}

export async function revokeUserSessionsHandler(req, res, next) {
  try {
    res.json(
      await revokeAllSessionsForUser(
        req.params.userId,
        req.user.idUtilisateur,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function listSecurityAdminsHandler(req, res, next) {
  try {
    res.json(await listSecurityAdmins());
  } catch (err) {
    next(err);
  }
}

export async function listComptesARisqueHandler(req, res, next) {
  try {
    res.json(await listComptesARisque({ limit: req.query.limit }));
  } catch (err) {
    next(err);
  }
}

export async function getEntrepriseAdminStatsHandler(req, res, next) {
  try {
    res.json(await getEntrepriseAdminStats(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listEntrepriseOffresHandler(req, res, next) {
  try {
    res.json(await listEntrepriseOffresAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listEntrepriseStagesHandler(req, res, next) {
  try {
    res.json(await listEntrepriseStagesAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listEntrepriseEquipeHandler(req, res, next) {
  try {
    res.json(await listEntrepriseEquipeAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listEntreprisePartenariatsHandler(req, res, next) {
  try {
    res.json(await listEntreprisePartenariatsAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listEntrepriseSignalementsHandler(req, res, next) {
  try {
    res.json(await listEntrepriseSignalementsAdmin(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listSecurityAlertsHandler(req, res, next) {
  try {
    const data = await listSecurityAlerts({
      gravite: req.query.gravite,
      statut: req.query.statut,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getSecurityAlertHandler(req, res, next) {
  try {
    res.json(await getSecurityAlertById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getSecurityAlertsStatsHandler(req, res, next) {
  try {
    res.json(await getSecurityAlertsStats());
  } catch (err) {
    next(err);
  }
}

export async function updateSecurityAlertStatusHandler(req, res, next) {
  try {
    const alerte = await updateSecurityAlertStatus(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statut,
    );
    res.json({ alerte });
  } catch (err) {
    next(err);
  }
}
