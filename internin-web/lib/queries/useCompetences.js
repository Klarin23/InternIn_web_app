import { useQuery } from "@tanstack/react-query";
import { getCompetencesRequest } from "@/lib/api/referentiels";

export function useCompetences() {
  return useQuery({
    queryKey: ["competences"],
    queryFn: async () => {
      const response = await getCompetencesRequest();

      if (Array.isArray(response)) {
        return response;
      }

      if (Array.isArray(response?.competences)) {
        return response.competences;
      }

      if (Array.isArray(response?.data)) {
        return response.data;
      }

      return [];
    },
  });
}
