import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifierEntrepriseRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function useVerifierEntreprise() {
  const { t } = useTranslation();
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
        toast.success(t("actionFeedback.companyVerified"));
      } else {
        toast.success(t("actionFeedback.verificationRejected"));
      }
    },
    onError: (err) => {
      toast.error(err?.message || t("actionFeedback.actionImpossible"));
    },
  });
}
