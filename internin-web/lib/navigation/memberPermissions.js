// Règles d'accès de l'espace "membre d'équipe" (typeUtilisateur =
// "membre_entreprise"), alignées sur l'API.
//
// Source de vérité côté API : middlewares/supervisionAccess.middleware.js
// → toutes les routes /superviseur/* (tableau de bord, calendrier, stagiaires,
// évaluations…) exigent la permission "stagiaires.suivre". Un membre sans
// cette permission (ex. gestionnaire de recrutement par défaut) reçoit un
// 403 : l'interface ne doit donc ni afficher ces écrans, ni appeler ces routes.
//
// La décision se base sur les PERMISSIONS effectives (/equipe/moi), jamais sur
// le nom du rôle : l'entreprise peut personnaliser les permissions de chaque
// membre.

export const PERMISSION_SUPERVISION = "stagiaires.suivre";

/** Le membre peut-il utiliser l'espace Supervision (API /superviseur/*) ? */
export function canAccessSupervision(permissions) {
  return Array.isArray(permissions) && permissions.includes(PERMISSION_SUPERVISION);
}

/**
 * Quel tableau de bord afficher à un membre d'équipe ?
 * - "supervision" : suivi des stagiaires (stagiaires.suivre)
 * - "recrutement" : offres / candidatures / entretiens (tous les autres cas)
 */
export function getMemberDashboardKind(permissions) {
  return canAccessSupervision(permissions) ? "supervision" : "recrutement";
}
