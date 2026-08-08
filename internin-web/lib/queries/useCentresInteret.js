import { useQuery } from "@tanstack/react-query";
import { getCentresInteretRequest } from "@/lib/api/referentiels";

export function useCentresInteret() {
  return useQuery({
    queryKey: ["centresInteret"],
    queryFn: getCentresInteretRequest,
  });
}
