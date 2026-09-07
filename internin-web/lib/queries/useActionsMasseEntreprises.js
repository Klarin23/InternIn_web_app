import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionsMasseEntreprisesRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

export function useActionsMasseEntreprises() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => actionsMasseEntreprisesRequest(payload, token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["toutesEntreprises"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["entrepriseAdminJournal"] });
      const ok = data?.traitees ?? 0;
      const ko = data?.echecs ?? 0;
      if (ok > 0) toast.success(`${ok} entreprise(s) traitée(s)`);
      if (ko > 0) toast.error(`${ko} échec(s)`);
    },
    onError: (err) => {
      toast.error(err?.message || "Action groupée impossible");
    },
  });
}
