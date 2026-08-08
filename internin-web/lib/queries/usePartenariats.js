import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEntreprisesDecouvrirRequest,
  getInvitationsEnvoyeesRequest,
  envoyerInvitationRequest,
  getInvitationsRecuesRequest,
  getUniversitesPartenairesRequest,
  repondreInvitationRequest,
} from "@/lib/api/partenariats";
import { useAuthStore } from "@/lib/store/useAuthStore";

// --- Côté université ---

export function useEntreprisesDecouvrir(recherche) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["entreprises-decouvrir", recherche],
    queryFn: () => getEntreprisesDecouvrirRequest(recherche, token),
    enabled: !!token,
  });
}

export function useInvitationsEnvoyees() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["invitations-envoyees"],
    queryFn: () => getInvitationsEnvoyeesRequest(token),
    enabled: !!token,
  });
}

export function useEnvoyerInvitation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEntreprise, message }) =>
      envoyerInvitationRequest(idEntreprise, message, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entreprises-decouvrir"] });
      queryClient.invalidateQueries({ queryKey: ["invitations-envoyees"] });
      queryClient.invalidateQueries({ queryKey: ["entreprisesUniversite"] });
    },
  });
}

// --- Côté entreprise ---

export function useInvitationsRecues() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["invitations-recues"],
    queryFn: () => getInvitationsRecuesRequest(token),
    enabled: !!token,
  });
}

export function useUniversitesPartenaires() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["universites-partenaires"],
    queryFn: () => getUniversitesPartenairesRequest(token),
    enabled: !!token,
  });
}

export function useRepondreInvitation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idPartenariat, accepter }) =>
      repondreInvitationRequest(idPartenariat, accepter, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations-recues"] });
      queryClient.invalidateQueries({ queryKey: ["universites-partenaires"] });
    },
  });
}
