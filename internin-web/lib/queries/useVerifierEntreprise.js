import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifierEntrepriseRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useVerifierEntreprise() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutVerification }) =>
      verifierEntrepriseRequest(id, statutVerification, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entreprisesEnAttente"] });
      queryClient.invalidateQueries({ queryKey: ["toutesEntreprises"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}