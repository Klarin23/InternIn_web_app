import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMonStageRequest,
  listMesStagesRequest,
  terminerStageRequest,
  getCertificatRequest,
  listMonJournalRequest,
  ajouterEntreeJournalRequest,
  updateEntreeJournalRequest,
  supprimerEntreeJournalRequest,
} from "@/lib/api/stages";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMonStage() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["monStage"],
    queryFn: () => getMonStageRequest(token),
    enabled: !!token,
  });
}

export function useMesStages() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesStages"],
    queryFn: () => listMesStagesRequest(token),
    enabled: !!token,
  });
}

export function useTerminerStage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idStage) => terminerStageRequest(idStage, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesStages"] });
      queryClient.invalidateQueries({ queryKey: ["monStage"] });
    },
  });
}

export function useCertificat(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["certificat", idStage],
    queryFn: () => getCertificatRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

// -----------------------------------------------------------------------
// Journal de stage / activités
// -----------------------------------------------------------------------

export function useMonJournal(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["monJournal", idStage],
    queryFn: () => listMonJournalRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

function useInvalidateJournal(idStage) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["monJournal", idStage] });
}

export function useAjouterEntreeJournal(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateJournal(idStage);
  return useMutation({
    mutationFn: (payload) =>
      ajouterEntreeJournalRequest(idStage, payload, token),
    onSuccess: invalidate,
  });
}

export function useUpdateEntreeJournal(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateJournal(idStage);
  return useMutation({
    mutationFn: ({ idEntree, payload }) =>
      updateEntreeJournalRequest(idStage, idEntree, payload, token),
    onSuccess: invalidate,
  });
}

export function useSupprimerEntreeJournal(idStage) {
  const token = useAuthStore((state) => state.token);
  const invalidate = useInvalidateJournal(idStage);
  return useMutation({
    mutationFn: (idEntree) =>
      supprimerEntreeJournalRequest(idStage, idEntree, token),
    onSuccess: invalidate,
  });
}
