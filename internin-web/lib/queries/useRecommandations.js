import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRecommandationRequest,
  getRecommandationRequest,
  toggleVisibiliteRequest,
} from "@/lib/api/recommandations";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useRecommandation(idStage) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["recommandation", idStage],
    queryFn: () => getRecommandationRequest(idStage, token),
    enabled: !!token && !!idStage,
  });
}

export function useCreateRecommandation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idStage, contenu }) =>
      createRecommandationRequest(idStage, contenu, token),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["recommandation", variables.idStage],
      }),
  });
}

export function useToggleVisibilite() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idStage, visibleLinkedin }) =>
      toggleVisibiliteRequest(idStage, visibleLinkedin, token),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["recommandation", variables.idStage],
      }),
  });
}
