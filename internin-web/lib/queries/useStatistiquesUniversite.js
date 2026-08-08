import { useQuery } from "@tanstack/react-query";
import { getStatistiquesUniversiteRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useStatistiquesUniversite() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["statistiquesUniversite"],
    queryFn: () => getStatistiquesUniversiteRequest(token),
    enabled: !!token,
  });
}
