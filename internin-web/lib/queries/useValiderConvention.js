import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validerConventionRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useValiderConvention() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idConvention, valider }) =>
      validerConventionRequest(idConvention, valider, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventionsUniversite"] });
    },
  });
}
