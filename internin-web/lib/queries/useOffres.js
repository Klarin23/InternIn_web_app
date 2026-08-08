import { useQuery } from "@tanstack/react-query";
import { listOffresRequest } from "@/lib/api/offres";

export function useOffres(filters = {}) {
  return useQuery({
    // La clé inclut les filtres : TanStack Query recharge automatiquement
    // dès que recherche/modeTravail changent, sans code supplémentaire
    queryKey: ["offres", filters],
    queryFn: () => listOffresRequest(filters),
  });
}
