import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMesCandidaturesRequest,
  retirerCandidatureRequest,
} from "@/lib/api/candidatures";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMesCandidatures() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesCandidatures"],
    queryFn: () => getMesCandidaturesRequest(token),
    enabled: !!token,
  });
}

export function useRetirerCandidature() {
  const token = useAuthStore((state) => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCandidature, motifCode, commentaire }) =>
      retirerCandidatureRequest(
        idCandidature,
        { motifCode, commentaire },
        token,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesCandidatures"] });
      qc.invalidateQueries({ queryKey: ["mesEntretiens"] });
      qc.invalidateQueries({ queryKey: ["candidaturesEntreprise"] });
    },
  });
}
