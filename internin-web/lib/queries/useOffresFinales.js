import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createOffreFinaleRequest,
  listOffresFinalesEnAttenteRequest,
  listToutesOffresFinalesRequest,
  validerOffreFinaleRequest,
  listMesOffresFinalesRequest,
  repondreOffreFinaleRequest,
  getHistoriqueOffresFinalesRequest,
} from "@/lib/api/offresFinales";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useCreateOffreFinale() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createOffreFinaleRequest(payload, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entretiensEntreprise"] });
      queryClient.invalidateQueries({
        queryKey: ["historiqueOffresFinales", variables.idEntretien],
      });
    },
  });
}

export function useHistoriqueOffresFinales(idEntretien) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["historiqueOffresFinales", idEntretien],
    queryFn: () => getHistoriqueOffresFinalesRequest(idEntretien, token),
    enabled: !!idEntretien && !!token,
  });
}

export function useOffresFinalesEnAttente() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["offresFinalesEnAttente"],
    queryFn: () => listOffresFinalesEnAttenteRequest(token),
    enabled: !!token,
  });
}

// Réservé à l'espace Administrateur — page de modération (toutes les offres,
// filtrables par statut : "en_attente" | "approuve" | "rejete").
export function useOffresFinalesAdmin(statut) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["offresFinalesAdmin", statut || "toutes"],
    queryFn: () => listToutesOffresFinalesRequest(token, statut),
    enabled: !!token,
  });
}

export function useValiderOffreFinale() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutValidationPlateforme }) =>
      validerOffreFinaleRequest(id, statutValidationPlateforme, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offresFinalesEnAttente"] });
      queryClient.invalidateQueries({ queryKey: ["offresFinalesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useMesOffresFinales() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesOffresFinales"],
    queryFn: () => listMesOffresFinalesRequest(token),
    enabled: !!token,
  });
}

export function useRepondreOffreFinale() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statutReponseStagiaire }) =>
      repondreOffreFinaleRequest(id, statutReponseStagiaire, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesOffresFinales"] });
      queryClient.invalidateQueries({ queryKey: ["mesCandidatures"] });
      queryClient.invalidateQueries({ queryKey: ["stagiaireProfile"] });
    },
  });
}
