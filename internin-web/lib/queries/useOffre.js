import { useQuery } from "@tanstack/react-query";
import { getOffreRequest } from "@/lib/api/offres";

export function useOffre(id) {
  return useQuery({
    queryKey: ["offre", id],
    queryFn: () => getOffreRequest(id),
    enabled: !!id,
  });
}
