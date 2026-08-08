import { useQuery } from "@tanstack/react-query";
import { listToutesUniversitesRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useToutesUniversites(recherche) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["toutesUniversites", recherche || ""],
    queryFn: () => listToutesUniversitesRequest(recherche, token),
    enabled: !!token,
  });
}
