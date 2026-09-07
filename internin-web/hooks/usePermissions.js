"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMonProfilRequest } from "@/lib/api/equipe";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Hook central des permissions espace Entreprise.
 *
 * Source de vérité : GET /equipe/moi (permissions effectives recalculées
 * côté backend à chaque appel — jamais un JWT figé).
 *
 * Usage :
 *   const { hasPermission, isAdminPrincipal, isLoading } = usePermissions();
 *   if (hasPermission("offres.gerer")) { ... }
 *
 * Ce hook ne remplace PAS les contrôles backend. Il sert uniquement à
 * masquer/afficher des actions dans l'UI.
 */
export function usePermissions() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const isEntrepriseContext =
    user?.typeUtilisateur === "entreprise" ||
    user?.typeUtilisateur === "membre_entreprise";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["equipe", "moi", token],
    queryFn: () => getMonProfilRequest(token),
    enabled: Boolean(token && isEntrepriseContext),
    staleTime: 60_000,
    retry: 1,
  });

  const permissions = useMemo(() => {
    if (!data) return [];
    if (data.estAdminPrincipal || data.isProprietaire) {
      return data.permissions ?? [];
    }
    return Array.isArray(data.permissions) ? data.permissions : [];
  }, [data]);

  const hasPermission = useCallback(
    (cle) => {
      if (!cle) return false;
      if (data?.estAdminPrincipal || data?.isProprietaire) return true;
      if (data?.statutMembre && data.statutMembre !== "actif") return false;
      return permissions.includes(cle);
    },
    [data, permissions],
  );

  const hasAnyPermission = useCallback(
    (...cles) => cles.some((c) => hasPermission(c)),
    [hasPermission],
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    isAdminPrincipal: Boolean(data?.estAdminPrincipal || data?.isProprietaire),
    isProprietaire: Boolean(data?.isProprietaire),
    roleEquipe: data?.roleEquipe ?? null,
    statutMembre: data?.statutMembre ?? null,
    isLoading,
    isError,
    refetch,
    profil: data ?? null,
  };
}
