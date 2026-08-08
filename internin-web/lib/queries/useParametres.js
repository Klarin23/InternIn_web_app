import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getParametresRequest, updateParametresRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useParametres() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["parametresPlateforme"],
    queryFn: () => getParametresRequest(token),
    enabled: !!token,
  });
}

export function useUpdateParametres() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (champs) => updateParametresRequest(champs, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametresPlateforme"] });
    },
  });
}
