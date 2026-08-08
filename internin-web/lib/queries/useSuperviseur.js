import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTableauDeBordSuperviseurRequest,
  listMesStagiairesRequest,
  getDetailStagiaireRequest,
  getProgressionRequest,
  updateProgressionManuelleRequest,
  ajouterObjectifRequest,
  updateObjectifRequest,
  supprimerObjectifRequest,
  ajouterTacheRequest,
  updateTacheRequest,
  supprimerTacheRequest,
  ajouterCompetenceAcquiseRequest,
  supprimerCompetenceAcquiseRequest,
  ajouterObservationRequest,
  supprimerObservationRequest,
  getJournalSuperviseurRequest,
  modererEntreeJournalRequest,
  listEvaluationsSuperviseurRequest,
  getEvaluationDetailRequest,
  creerEvaluationRequest,
  modifierEvaluationRequest,
} from "@/lib/api/superviseur";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useTableauDeBordSuperviseur() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["tableauDeBordSuperviseur"],
    queryFn: () => getTableauDeBordSuperviseurRequest(token),
    enabled: !!token,
  });
}

export function useMesStagiaires() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesStagiaires"],
    queryFn: () => listMesStagiairesRequest(token),
    enabled: !!token,
  });
}

export function useDetailStagiaire(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["detailStagiaire", idStage],
    queryFn: () => getDetailStagiaireRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

// -----------------------------------------------------------------------
// Suivi de progression
// -----------------------------------------------------------------------

export function useProgression(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["progressionStage", idStage],
    queryFn: () => getProgressionRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

function useInvalidateProgression(idStage) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["progressionStage", idStage] });
}

export function useUpdateProgressionManuelle(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (progressionPourcentage) =>
      updateProgressionManuelleRequest(idStage, progressionPourcentage, token),
    onSuccess: invalidate,
  });
}

export function useAjouterObjectif(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (description) =>
      ajouterObjectifRequest(idStage, description, token),
    onSuccess: invalidate,
  });
}

export function useUpdateObjectif(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: ({ idObjectif, payload }) =>
      updateObjectifRequest(idStage, idObjectif, payload, token),
    onSuccess: invalidate,
  });
}

export function useSupprimerObjectif(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (idObjectif) =>
      supprimerObjectifRequest(idStage, idObjectif, token),
    onSuccess: invalidate,
  });
}

export function useAjouterTache(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (description) =>
      ajouterTacheRequest(idStage, description, token),
    onSuccess: invalidate,
  });
}

export function useUpdateTache(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: ({ idTache, payload }) =>
      updateTacheRequest(idStage, idTache, payload, token),
    onSuccess: invalidate,
  });
}

export function useSupprimerTache(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (idTache) => supprimerTacheRequest(idStage, idTache, token),
    onSuccess: invalidate,
  });
}

export function useAjouterCompetenceAcquise(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (idCompetence) =>
      ajouterCompetenceAcquiseRequest(idStage, idCompetence, token),
    onSuccess: invalidate,
  });
}

export function useSupprimerCompetenceAcquise(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (idAcquisition) =>
      supprimerCompetenceAcquiseRequest(idStage, idAcquisition, token),
    onSuccess: invalidate,
  });
}

export function useAjouterObservation(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (contenu) => ajouterObservationRequest(idStage, contenu, token),
    onSuccess: invalidate,
  });
}

export function useSupprimerObservation(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateProgression(idStage);
  return useMutation({
    mutationFn: (idObservation) =>
      supprimerObservationRequest(idStage, idObservation, token),
    onSuccess: invalidate,
  });
}

// -----------------------------------------------------------------------
// Journal de stage (consultation + modération)
// -----------------------------------------------------------------------

export function useJournalSuperviseur(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["journalSuperviseur", idStage],
    queryFn: () => getJournalSuperviseurRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

export function useModererEntreeJournal(idStage) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEntree, payload }) =>
      modererEntreeJournalRequest(idStage, idEntree, payload, token),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["journalSuperviseur", idStage],
      }),
  });
}

// ... (tout le reste du fichier est inchangé jusqu'à la fin) ...

// -----------------------------------------------------------------------
// Évaluations hebdomadaires
// -----------------------------------------------------------------------

export function useEvaluationsSuperviseur() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["evaluationsSuperviseur"],
    queryFn: () => listEvaluationsSuperviseurRequest(token),
    enabled: !!token,
  });
}

export function useEvaluationDetail(idStage, idEvaluation) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["evaluationDetail", idStage, idEvaluation],
    queryFn: () => getEvaluationDetailRequest(idStage, idEvaluation, token),
    enabled: !!token && !!idStage && !!idEvaluation,
  });
}

function useInvalidateEvaluations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["evaluationsSuperviseur"] });
    queryClient.invalidateQueries({ queryKey: ["tableauDeBordSuperviseur"] });
    queryClient.invalidateQueries({ queryKey: ["mesStagiaires"] });
  };
}

export function useCreerEvaluation(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateEvaluations();
  return useMutation({
    mutationFn: (payload) => creerEvaluationRequest(idStage, payload, token),
    onSuccess: invalidate,
  });
}

export function useModifierEvaluation(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateEvaluations();
  return useMutation({
    mutationFn: ({ idEvaluation, payload }) =>
      modifierEvaluationRequest(idStage, idEvaluation, payload, token),
    onSuccess: invalidate,
  });
}