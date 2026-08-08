import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changerStatutCompteUtilisateurRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useChangerStatutCompteUtilisateur() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutCompte }) =>
      changerStatutCompteUtilisateurRequest(id, statutCompte, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tousUtilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
