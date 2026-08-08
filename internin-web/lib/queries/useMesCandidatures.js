import { useQuery } from "@tanstack/react-query";
import { getMesCandidaturesRequest } from "@/lib/api/candidatures";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMesCandidatures() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesCandidatures"],
    queryFn: () => getMesCandidaturesRequest(token),
    enabled: !!token,
  });
}