import { useQuery } from "@tanstack/react-query";
import { getCentresInteretRequest } from "@/lib/api/referentiels";

export function useCentresInteret() {
  return useQuery({
    queryKey: ["centresInteret"],
    queryFn: async () => {
      const result = await getCentresInteretRequest();

      // Le endpoint renvoie normalement directement un tableau.
      // On normalise toutefois la réponse pour éviter qu'une réponse
      // inattendue (undefined/null/objet) ne fasse planter l'onboarding
      // avec un `.map()` sur une valeur non itérable.
      if (Array.isArray(result)) return result;
      if (Array.isArray(result?.data)) return result.data;
      return [];
    },
  });
}
