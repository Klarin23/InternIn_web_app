import { useMonProfilEquipe } from "@/lib/queries/useEquipe";

// Dernier snapshot des droits (écrit par useMonProfilEquipe). Utilisé
// uniquement si /equipe/moi est injoignable (maintenance, réseau) — jamais un
// jeu de droits élargi.
function lireSnapshotPermissions() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("internin_membre_perms");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.permissions) ? parsed.permissions : null;
  } catch {
    return null;
  }
}

/**
 * Permissions effectives du membre d'équipe connecté.
 *
 * - isPending    : permissions pas encore connues (profil en cours de chargement)
 * - isUnresolved : impossible de les connaître (profil en erreur, pas de snapshot)
 *
 * Tant que le profil n'est pas chargé, on n'utilise PAS le snapshot de session
 * (il pourrait appartenir à un autre compte utilisé plus tôt dans l'onglet) :
 * on attend la réponse de l'API.
 */
export function useMembrePermissions() {
  const { data: profil, isError, refetch } = useMonProfilEquipe();

  let permissions = null;
  if (Array.isArray(profil?.permissions)) {
    permissions = profil.permissions;
  } else if (isError) {
    permissions = lireSnapshotPermissions();
  }

  const resolved = Array.isArray(permissions);
  const liste = resolved ? permissions : [];

  return {
    permissions: liste,
    has: (cle) => liste.includes(cle),
    isPending: !resolved && !isError,
    isUnresolved: !resolved && isError,
    refetch,
  };
}
