import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changerStatutCompteUniversiteRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useChangerStatutCompteUniversite() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutCompte }) =>
      changerStatutCompteUniversiteRequest(id, statutCompte, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["toutesUniversites"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
