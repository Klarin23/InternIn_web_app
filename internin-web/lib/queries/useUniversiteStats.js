import { useQuery } from "@tanstack/react-query";
import { getUniversiteStatsRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useUniversiteStats() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["universiteStats"],
    queryFn: () => getUniversiteStatsRequest(token),
    enabled: !!token,
    // Un partenariat peut être accepté depuis la session de l'entreprise,
    // donc le cache local du tableau de bord ne peut pas le savoir tout
    // seul : on force un refetch à chaque affichage/retour sur focus.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
}
