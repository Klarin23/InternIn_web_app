import { useQuery } from "@tanstack/react-query";
import { getEtudiantsUniversiteRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useEtudiantsUniversite({
  recherche,
  statut,
  page,
  parPage,
} = {}) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["etudiantsUniversite", { recherche, statut, page, parPage }],
    queryFn: () =>
      getEtudiantsUniversiteRequest(token, {
        recherche,
        statut,
        page,
        parPage,
      }),
    enabled: !!token,
    placeholderData: (data) => data, // évite le flash de chargement au changement de page/onglet
  });
}
