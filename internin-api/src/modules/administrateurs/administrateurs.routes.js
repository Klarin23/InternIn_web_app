// Routes admin : requireAuth + type administrateur + roleAdmin (scopes).

import { Router } from "express";
import {
  listEntreprises,
  listUniversites,
  listToutesEntreprisesHandler,
  changerStatutCompteHandler,
  listToutesUniversitesHandler,
  changerStatutCompteUniversiteHandler,
  verifierEntrepriseHandler,
  verifierUniversiteHandler,
  listTousUtilisateursHandler,
  getUtilisateursStatsHandler,
  getUtilisateurDetailHandler,
  listUtilisateurDocumentsHandler,
  listUtilisateurCandidaturesHandler,
  listUtilisateurStagesHandler,
  listUtilisateurSignalementsHandler,
  listUtilisateurSessionsHandler,
  changerStatutCompteUtilisateurHandler,
  getStats,
  moi,
  getParametresHandler,
  updateParametresHandler,
  listDocumentsEntrepriseHandler,
  actionsMasseEntreprisesHandler,
  listEntrepriseSignalementsHandler,
  listEntreprisePartenariatsHandler,
  listEntrepriseEquipeHandler,
  listEntrepriseStagesHandler,
  listEntrepriseOffresHandler,
  getEntrepriseAdminStatsHandler,
  listStagesSupervisionHandler,
  getStageSupervisionDetailHandler,
  getControleCentreHandler,
  reconcileControleCentreHandler,
  resoudreAnomalieControleHandler,
  getDetectionSettingsHandler,
  listAuditJournalHandler,
  getAuditStatsHandler,
  getAuditEventHandler,
  exportAuditJournalHandler,
  listAdminConventionsHandler,
  getAdminConventionsStatsHandler,
  getAdminConventionDetailHandler,
  downloadAdminConventionPdfHandler,
  approuverConventionAdminHandler,
  exportAdminConventionsHandler,
  getSecurityOverviewHandler,
  listSecuritySessionsHandler,
  revokeSecuritySessionHandler,
  revokeUserSessionsHandler,
  listSecurityAdminsHandler,
  listComptesARisqueHandler,
  listSecurityAlertsHandler,
  getSecurityAlertHandler,
  getSecurityAlertsStatsHandler,
  updateSecurityAlertStatusHandler,
} from "./administrateurs.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  loadAdminProfile,
  requireAdminScope,
} from "../../middlewares/adminScope.middleware.js";
import { ADMIN_SCOPES } from "./adminRbac.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  verifierSchema,
  statutCompteSchema,
  updateParametresSchema,
  actionsMasseEntreprisesSchema,
} from "./administrateurs.schema.js";

const router = Router();
const S = ADMIN_SCOPES;

router.use(requireAuth, requireRole("administrateur"), loadAdminProfile);

// Profil — tout admin
router.get("/moi", moi);

// Dashboard
router.get("/stats", requireAdminScope(S.DASHBOARD), getStats);

// Paramètres plateforme
router.get("/parametres", requireAdminScope(S.PARAMETRES), getParametresHandler);
router.patch(
  "/parametres",
  requireAdminScope(S.PARAMETRES),
  validate(updateParametresSchema),
  updateParametresHandler,
);

// Entreprises
router.get("/entreprises/en-attente", requireAdminScope(S.ENTREPRISES), listEntreprises);
router.post(
  "/entreprises/actions-masse",
  requireAdminScope(S.ENTREPRISES),
  validate(actionsMasseEntreprisesSchema),
  actionsMasseEntreprisesHandler,
);
router.get("/entreprises", requireAdminScope(S.ENTREPRISES), listToutesEntreprisesHandler);
router.patch(
  "/entreprises/:id/verification",
  requireAdminScope(S.ENTREPRISES),
  validate(verifierSchema),
  verifierEntrepriseHandler,
);
router.patch(
  "/entreprises/:id/statut-compte",
  requireAdminScope(S.ENTREPRISES),
  validate(statutCompteSchema),
  changerStatutCompteHandler,
);
router.get("/entreprises/:id/documents", requireAdminScope(S.ENTREPRISES), listDocumentsEntrepriseHandler);
router.get("/entreprises/:id/stats", requireAdminScope(S.ENTREPRISES), getEntrepriseAdminStatsHandler);
router.get("/entreprises/:id/offres", requireAdminScope(S.ENTREPRISES), listEntrepriseOffresHandler);
router.get("/entreprises/:id/stages", requireAdminScope(S.ENTREPRISES), listEntrepriseStagesHandler);
router.get("/entreprises/:id/equipe", requireAdminScope(S.ENTREPRISES), listEntrepriseEquipeHandler);
router.get("/entreprises/:id/partenariats", requireAdminScope(S.ENTREPRISES), listEntreprisePartenariatsHandler);
router.get("/entreprises/:id/signalements", requireAdminScope(S.ENTREPRISES), listEntrepriseSignalementsHandler);

// Universités
router.get("/universites/en-attente", requireAdminScope(S.UNIVERSITES), listUniversites);
router.get("/universites", requireAdminScope(S.UNIVERSITES), listToutesUniversitesHandler);
router.patch(
  "/universites/:id/verification",
  requireAdminScope(S.UNIVERSITES),
  validate(verifierSchema),
  verifierUniversiteHandler,
);
router.patch(
  "/universites/:id/statut-compte",
  requireAdminScope(S.UNIVERSITES),
  validate(statutCompteSchema),
  changerStatutCompteUniversiteHandler,
);

// Utilisateurs
router.get("/utilisateurs", requireAdminScope(S.UTILISATEURS), listTousUtilisateursHandler);
router.get("/utilisateurs/stats", requireAdminScope(S.UTILISATEURS), getUtilisateursStatsHandler);
router.get("/utilisateurs/:id", requireAdminScope(S.UTILISATEURS), getUtilisateurDetailHandler);
router.get("/utilisateurs/:id/documents", requireAdminScope(S.UTILISATEURS), listUtilisateurDocumentsHandler);
router.get("/utilisateurs/:id/candidatures", requireAdminScope(S.UTILISATEURS), listUtilisateurCandidaturesHandler);
router.get("/utilisateurs/:id/stages", requireAdminScope(S.UTILISATEURS), listUtilisateurStagesHandler);
router.get("/utilisateurs/:id/signalements", requireAdminScope(S.UTILISATEURS), listUtilisateurSignalementsHandler);
router.get("/utilisateurs/:id/sessions", requireAdminScope(S.UTILISATEURS), listUtilisateurSessionsHandler);
router.patch(
  "/utilisateurs/:id/statut-compte",
  requireAdminScope(S.UTILISATEURS),
  validate(statutCompteSchema),
  changerStatutCompteUtilisateurHandler,
);

// Supervision stages
router.get("/supervision/stages", requireAdminScope(S.STAGES), listStagesSupervisionHandler);
router.get("/supervision/stages/:id", requireAdminScope(S.STAGES), getStageSupervisionDetailHandler);

// Centre de contrôle
router.get("/controle", requireAdminScope(S.CONTROLE), getControleCentreHandler);
router.get("/controle/settings", requireAdminScope(S.CONTROLE), getDetectionSettingsHandler);
router.post("/controle/reconcile", requireAdminScope(S.CONTROLE), reconcileControleCentreHandler);
router.post("/controle/anomalies/resolve", requireAdminScope(S.CONTROLE), resoudreAnomalieControleHandler);

// Audit
router.get("/audit/stats", requireAdminScope(S.AUDIT), getAuditStatsHandler);
router.get("/audit/export", requireAdminScope(S.AUDIT), exportAuditJournalHandler);
router.get("/audit/:id", requireAdminScope(S.AUDIT), getAuditEventHandler);
router.get("/audit", requireAdminScope(S.AUDIT), listAuditJournalHandler);

// Conventions
router.get("/conventions/stats", requireAdminScope(S.CONVENTIONS), getAdminConventionsStatsHandler);
router.get("/conventions/export", requireAdminScope(S.CONVENTIONS), exportAdminConventionsHandler);
router.get("/conventions/:id/pdf", requireAdminScope(S.CONVENTIONS), downloadAdminConventionPdfHandler);
router.post("/conventions/:id/approuver", requireAdminScope(S.CONVENTIONS), approuverConventionAdminHandler);
router.get("/conventions/:id", requireAdminScope(S.CONVENTIONS), getAdminConventionDetailHandler);
router.get("/conventions", requireAdminScope(S.CONVENTIONS), listAdminConventionsHandler);

// Sécurité
router.get("/securite/overview", requireAdminScope(S.SECURITE), getSecurityOverviewHandler);
router.get("/securite/sessions", requireAdminScope(S.SECURITE), listSecuritySessionsHandler);
router.delete("/securite/sessions/:id", requireAdminScope(S.SECURITE), revokeSecuritySessionHandler);
router.delete("/securite/utilisateurs/:userId/sessions", requireAdminScope(S.SECURITE), revokeUserSessionsHandler);
router.get("/securite/admins", requireAdminScope(S.SECURITE), listSecurityAdminsHandler);
router.get("/securite/comptes-risque", requireAdminScope(S.SECURITE), listComptesARisqueHandler,
  listSecurityAlertsHandler,
  getSecurityAlertHandler,
  getSecurityAlertsStatsHandler,
  updateSecurityAlertStatusHandler);

export default router;
