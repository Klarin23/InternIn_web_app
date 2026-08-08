import { useQuery } from "@tanstack/react-query";
import { listUniversitesEnAttenteRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useUniversitesEnAttente() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["universitesEnAttente"],
    queryFn: () => listUniversitesEnAttenteRequest(token),
    enabled: !!token,
  });
}
