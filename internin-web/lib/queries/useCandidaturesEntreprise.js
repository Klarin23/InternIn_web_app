import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCandidaturesEntrepriseRequest,
  updateCandidatureStatutRequest,
  rejeterCandidatureRequest,
  listCandidatsRecommandesRequest,
  getHistoriqueCandidatureRequest,
  signalerConsultationCvRequest,
  getEvaluationRequest,
  updateEvaluationRequest,
  getNotesRequest,
  ajouterNoteRequest,
} from "@/lib/api/candidatures";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useCandidaturesEntreprise(idOffre) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["candidaturesEntreprise", idOffre],
    queryFn: () => listCandidaturesEntrepriseRequest(token, idOffre),
    enabled: !!token,
  });
}

export function useUpdateCandidatureStatut() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idCandidature, statut }) =>
      updateCandidatureStatutRequest(idCandidature, statut, token),
    onSuccess: () => {
      // Rafraîchit la liste des candidats et les stats du dashboard entreprise
      queryClient.invalidateQueries({ queryKey: ["candidaturesEntreprise"] });
      queryClient.invalidateQueries({ queryKey: ["mesOffres"] });
    },
  });
}

export function useRejeterCandidature() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idEntretien) => rejeterCandidatureRequest(idEntretien, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidaturesEntreprise"] });
      queryClient.invalidateQueries({ queryKey: ["entretiensEntreprise"] });
      queryClient.invalidateQueries({ queryKey: ["mesOffres"] });
    },
  });
}

export function useCandidatsRecommandes() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["candidatsRecommandes"],
    queryFn: () => listCandidatsRecommandesRequest(token),
    enabled: !!token,
  });
}

export function useHistoriqueCandidature(idCandidature) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["historiqueCandidature", idCandidature],
    queryFn: () => getHistoriqueCandidatureRequest(idCandidature, token),
    enabled: !!token && !!idCandidature,
  });
}

export function useSignalerConsultationCv() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idCandidature) =>
      signalerConsultationCvRequest(idCandidature, token),
    onSuccess: (_data, idCandidature) => {
      queryClient.invalidateQueries({
        queryKey: ["historiqueCandidature", idCandidature],
      });
    },
  });
}

export function useEvaluationCandidature(idCandidature) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["evaluationCandidature", idCandidature],
    queryFn: () => getEvaluationRequest(idCandidature, token),
    enabled: !!token && !!idCandidature,
  });
}

export function useUpdateEvaluation(idCandidature) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      updateEvaluationRequest(idCandidature, payload, token),
    onSuccess: (data) => {
      queryClient.setQueryData(["evaluationCandidature", idCandidature], data);
      queryClient.invalidateQueries({
        queryKey: ["historiqueCandidature", idCandidature],
      });
    },
  });
}

export function useNotesCandidature(idCandidature) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["notesCandidature", idCandidature],
    queryFn: () => getNotesRequest(idCandidature, token),
    enabled: !!token && !!idCandidature,
  });
}

export function useAjouterNote(idCandidature) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contenu) => ajouterNoteRequest(idCandidature, contenu, token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notesCandidature", idCandidature],
      });
      queryClient.invalidateQueries({
        queryKey: ["historiqueCandidature", idCandidature],
      });
    },
  });
}