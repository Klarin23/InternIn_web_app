import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifierUniversiteRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useVerifierUniversite() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutVerification }) =>
      verifierUniversiteRequest(id, statutVerification, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universitesEnAttente"] });
      queryClient.invalidateQueries({ queryKey: ["toutesUniversites"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
