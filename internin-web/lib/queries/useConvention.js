import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMaConventionRequest,
  signerMaConventionRequest,
} from "@/lib/api/conventions";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMaConvention() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["maConvention"],
    queryFn: () => getMaConventionRequest(token),
    enabled: !!token,
  });
}

export function useSignerConvention() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => signerMaConventionRequest(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maConvention"] });
      qc.invalidateQueries({ queryKey: ["monStage"] });
      qc.invalidateQueries({ queryKey: ["mesOffresFinales"] });
    },
  });
}
