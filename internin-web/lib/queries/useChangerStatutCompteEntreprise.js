import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changerStatutCompteEntrepriseRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useChangerStatutCompteEntreprise() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutCompte }) =>
      changerStatutCompteEntrepriseRequest(id, statutCompte, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toutesEntreprises"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
