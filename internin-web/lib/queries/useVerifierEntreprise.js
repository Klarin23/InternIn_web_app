import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifierEntrepriseRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

export function useVerifierEntreprise() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutVerification, motif, commentaire }) =>
      verifierEntrepriseRequest(id, statutVerification, token, {
        motif,
        commentaire,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entreprisesEnAttente"] });
      queryClient.invalidateQueries({ queryKey: ["toutesEntreprises"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["entrepriseAdminJournal"] });
      if (variables?.statutVerification === "verifiee") {
        toast.success("Entreprise vérifiée");
      } else {
        toast.success("Vérification rejetée");
      }
    },
    onError: (err) => {
      toast.error(err?.message || "Action impossible");
    },
  });
}
