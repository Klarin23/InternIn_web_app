import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changerStatutCompteUtilisateurRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function useChangerStatutCompteUtilisateur() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutCompte }) =>
      changerStatutCompteUtilisateurRequest(id, statutCompte, token),
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tousUtilisateurs"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateursAdminStats"] });
      queryClient.invalidateQueries({ queryKey: ["utilisateurAdminDetail"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success(
        variables?.statutCompte === "suspendu"
          ? t("actionFeedback.userSuspended")
          : t("actionFeedback.userReactivated"),
      );
    },
    onError: (err) => {
      toast.error(err?.message || t("actionFeedback.actionImpossible"));
    },
  });
}
