import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changerStatutCompteEntrepriseRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

export function useChangerStatutCompteEntreprise() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutCompte, motif, commentaire }) =>
      changerStatutCompteEntrepriseRequest(id, statutCompte, token, {
        motif,
        commentaire,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["toutesEntreprises"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["entrepriseAdminJournal"] });
      toast.success(
        variables?.statutCompte === "suspendu"
          ? "Entreprise suspendue"
          : "Entreprise réactivée",
      );
    },
    onError: (err) => {
      toast.error(err?.message || "Action impossible");
    },
  });
}
