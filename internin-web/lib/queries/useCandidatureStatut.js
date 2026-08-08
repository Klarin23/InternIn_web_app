import { useQuery } from "@tanstack/react-query";
import { getCandidatureStatutRequest } from "@/lib/api/candidatures";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useCandidatureStatut(idOffre) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["candidatureStatut", idOffre],
    queryFn: () => getCandidatureStatutRequest(idOffre, token),
    enabled: !!token && !!idOffre,
  });
}
