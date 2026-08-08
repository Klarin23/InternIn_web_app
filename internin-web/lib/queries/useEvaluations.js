import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvaluationRequest,
  listEvaluationsRequest,
  listCoachingRequest,
} from "@/lib/api/evaluations";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useEvaluations(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["evaluations", idStage],
    queryFn: () => listEvaluationsRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

export function useCoaching(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["coaching", idStage],
    queryFn: () => listCoachingRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

export function useCreateEvaluation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createEvaluationRequest(payload, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluations", variables.idStage],
      });
      queryClient.invalidateQueries({ queryKey: ["mesStages"] });
    },
  });
}
