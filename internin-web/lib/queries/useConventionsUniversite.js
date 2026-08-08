import { useQuery } from "@tanstack/react-query";
import { getConventionsUniversiteRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useConventionsUniversite(params = {}) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: [
      "conventionsUniversite",
      params.recherche || "",
      params.statut || "",
    ],
    queryFn: () => getConventionsUniversiteRequest(token, params),
    enabled: !!token,
  });
}
