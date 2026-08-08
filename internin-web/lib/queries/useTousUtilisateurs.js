import { useQuery } from "@tanstack/react-query";
import { listTousUtilisateursRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useTousUtilisateurs({ recherche, role } = {}) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["tousUtilisateurs", recherche || "", role || ""],
    queryFn: () => listTousUtilisateursRequest({ recherche, role }, token),
    enabled: !!token,
  });
}