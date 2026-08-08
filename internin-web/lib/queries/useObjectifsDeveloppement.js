import { useQuery } from "@tanstack/react-query";
import { getObjectifsRequest } from "@/lib/api/referentiels";

export function useObjectifsDeveloppement() {
  return useQuery({
    queryKey: ["objectifsDeveloppement"],
    queryFn: getObjectifsRequest,
  });
}
