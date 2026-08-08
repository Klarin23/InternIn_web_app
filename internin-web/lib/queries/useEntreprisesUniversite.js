import { useQuery } from "@tanstack/react-query";
import { getEntreprisesUniversiteRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useEntreprisesUniversite(recherche) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["entreprisesUniversite", recherche || ""],
    queryFn: () => getEntreprisesUniversiteRequest(token, recherche),
    enabled: !!token,
    placeholderData: (data) => data,
    // L'acceptation d'un partenariat se produit dans la session de
    // l'entreprise, une session totalement différente de celle de
    // l'université : le cache local ne peut pas le savoir tout seul.
    // On force donc un refetch à chaque fois que la page redevient visible
    // ou reprend le focus, plutôt que de se fier au staleTime global (1 min).
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
}
