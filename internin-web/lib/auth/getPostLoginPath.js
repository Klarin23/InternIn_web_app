import { getStagiaireProfileRequest } from "@/lib/api/stagiaires";

/**
 * Où envoyer l'utilisateur après login / Google / vérif e-mail.
 * - Onboarding UNIQUEMENT si aucun profil stagiaire n'existe encore
 * - Sinon tableau de bord (gate "compte incomplet" + /activation si besoin)
 */
export async function getPostLoginPath(user, token) {
  if (!user?.emailVerifie) {
    return "/verification-email";
  }

  if (user.statutCompte === "actif") {
    return "/tableau-de-bord";
  }

  // Compte inactif
  if (user.typeUtilisateur === "stagiaire") {
    try {
      const profile = await getStagiaireProfileRequest(token);
      const p = profile?.stagiaire || profile;
      // Onboarding déjà fait si CV ou formation présents
      const onboardingDone =
        Boolean(p?.cvUrl) ||
        (Array.isArray(p?.formations) && p.formations.length > 0) ||
        Boolean(p?.idStagiaire);

      if (onboardingDone) {
        return "/tableau-de-bord"; // InactiveAccountGate s'affiche
      }
    } catch {
      // Pas de profil → premier onboarding
    }
    return "/onboarding/1";
  }

  // entreprise / université : garde ton comportement actuel si besoin
  if (user.statutCompte === "inactif") {
    return "/onboarding/1";
  }

  return "/tableau-de-bord";
}
