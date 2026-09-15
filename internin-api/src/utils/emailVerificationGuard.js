// Garde-fou de sécurité centralisé pour la règle métier :
//
//   Aucun compte ne doit pouvoir passer à statutCompte = "actif"
//   si emailVerifie !== true (null / undefined / false sont TOUS refusés).
//
// Utilisé par tous les parcours qui peuvent faire passer un compte à "actif" :
// onboarding stagiaire, onboarding entreprise, onboarding université, et les
// endpoints admin de changement de statut. Centraliser cette condition ici
// évite qu'un futur parcours d'activation oublie la vérification.

/**
 * @param {boolean|null|undefined} emailVerifie - valeur lue en base (jamais
 *   celle envoyée par le client : le champ ne doit être déterminé que par le
 *   mécanisme réel de vérification email, cf. auth.service.js#verifyEmail).
 * @returns {boolean} true seulement si l'email est explicitement vérifié.
 */
export function peutActiverCompte(emailVerifie) {
  return emailVerifie === true;
}

/**
 * À utiliser lorsqu'une action EXPLICITE tente de forcer statutCompte="actif"
 * (ex: endpoint admin) sur un compte dont l'email n'est pas vérifié : on
 * refuse l'opération avec une erreur claire plutôt que de l'ignorer en
 * silence. Le status/code suit le format d'erreur déjà utilisé par InternIn
 * (cf. middlewares/activeAccount.middleware.js).
 *
 * @param {boolean|null|undefined} emailVerifie
 */
export function assertEmailVerifiePourActivation(emailVerifie) {
  if (!peutActiverCompte(emailVerifie)) {
    const err = new Error(
      "Impossible d'activer ce compte : l'adresse email n'est pas vérifiée.",
    );
    err.status = 403;
    err.code = "EMAIL_NON_VERIFIE";
    throw err;
  }
}
