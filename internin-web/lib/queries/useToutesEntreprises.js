import { useQuery } from "@tanstack/react-query";
import { listToutesEntreprisesRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useToutesEntreprises(recherche) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["toutesEntreprises", recherche || ""],
    queryFn: () => listToutesEntreprisesRequest(recherche, token),
    enabled: !!token,
  });
}
