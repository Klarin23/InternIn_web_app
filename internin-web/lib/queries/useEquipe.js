import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCatalogueEquipeRequest,
  listMembresEquipeRequest,
  inviterMembreRequest,
  renvoyerInvitationRequest,
  annulerInvitationRequest,
  updateMembreRequest,
  updateStatutMembreRequest,
  listAffectationsRequest,
  affecterSuperviseurRequest,
  retirerAffectationRequest,
  listActivitesEquipeRequest,
  getParametresEquipeRequest,
  updateParametresEquipeRequest,
  getInvitationRequest,
  accepterInvitationRequest,
  getMonProfilRequest,
} from "@/lib/api/equipe";
import { useAuthStore } from "@/lib/store/useAuthStore";

function invalidateEquipe(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["membresEquipe"] });
  queryClient.invalidateQueries({ queryKey: ["activitesEquipe"] });
}

export function useCatalogueEquipe() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["catalogueEquipe"],
    queryFn: () => getCatalogueEquipeRequest(token),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useMembresEquipe({ recherche, role, statut } = {}) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["membresEquipe", recherche, role, statut],
    queryFn: () => listMembresEquipeRequest(token, { recherche, role, statut }),
    enabled: !!token,
  });
}

export function useInviterMembre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => inviterMembreRequest(payload, token),
    onSuccess: () => invalidateEquipe(queryClient),
  });
}

export function useRenvoyerInvitation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idMembre) => renvoyerInvitationRequest(idMembre, token),
    onSuccess: () => invalidateEquipe(queryClient),
  });
}

export function useAnnulerInvitation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idMembre) => annulerInvitationRequest(idMembre, token),
    onSuccess: () => invalidateEquipe(queryClient),
  });
}

export function useUpdateMembre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idMembre, payload }) =>
      updateMembreRequest(idMembre, payload, token),
    onSuccess: () => invalidateEquipe(queryClient),
  });
}

export function useUpdateStatutMembre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idMembre, statutMembre }) =>
      updateStatutMembreRequest(idMembre, statutMembre, token),
    onSuccess: () => invalidateEquipe(queryClient),
  });
}

export function useAffectations() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["affectationsEquipe"],
    queryFn: () => listAffectationsRequest(token),
    enabled: !!token,
  });
}

export function useAffecterSuperviseur() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => affecterSuperviseurRequest(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectationsEquipe"] });
      queryClient.invalidateQueries({ queryKey: ["activitesEquipe"] });
    },
  });
}

export function useRetirerAffectation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idStage) => retirerAffectationRequest(idStage, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectationsEquipe"] });
      queryClient.invalidateQueries({ queryKey: ["activitesEquipe"] });
    },
  });
}

export function useActivitesEquipe() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["activitesEquipe"],
    queryFn: () => listActivitesEquipeRequest(token),
    enabled: !!token,
  });
}

export function useParametresEquipe() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["parametresEquipe"],
    queryFn: () => getParametresEquipeRequest(token),
    enabled: !!token,
  });
}

export function useUpdateParametresEquipe() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateParametresEquipeRequest(payload, token),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["parametresEquipe"] }),
  });
}

// -----------------------------------------------------------------------
// Acceptation d'invitation — routes publiques, pas de token requis.
// -----------------------------------------------------------------------

export function useInvitation(token) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitationRequest(token),
    enabled: !!token,
    retry: false,
  });
}

export function useAccepterInvitation(token) {
  return useMutation({
    mutationFn: (motDePasse) => accepterInvitationRequest(token, motDePasse),
  });
}

// Profil du membre d'équipe actuellement connecté (nom, rôle, entreprise) —
// utilisé par la barre latérale de l'espace superviseur.
export function useMonProfilEquipe() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["monProfilEquipe"],
    queryFn: async () => {
      const data = await getMonProfilRequest(token);
      // Snapshot des droits assignés — permet de conserver le menu filtré
      // pendant une maintenance (sans élargir les permissions).
      if (typeof window !== "undefined" && data) {
        try {
          sessionStorage.setItem(
            "internin_membre_perms",
            JSON.stringify({
              permissions: Array.isArray(data.permissions)
                ? data.permissions
                : [],
              roleEquipe: data.roleEquipe ?? null,
              nom: data.nom ?? null,
              nomEntreprise: data.nomEntreprise ?? null,
              at: Date.now(),
            }),
          );
        } catch {
          /* ignore quota / private mode */
        }
      }
      return data;
    },
    enabled: !!token,
    // Les permissions peuvent être modifiées à tout moment par l'entreprise :
    // on revalide au focus pour que le menu se mette à jour sans re-login.
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error) => {
      if (error?.code === "MAINTENANCE" || error?.status === 503) return false;
      return failureCount < 2;
    },
  });
}