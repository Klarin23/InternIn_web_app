import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  planifierEntretienRequest,
  getMesEntretiensRequest,
  getEntretiensEntrepriseRequest,
  getEntretiensEnAttenteRequest,
  updateEntretienEntrepriseRequest,
  validerEntretienRequest,
  demanderReprogrammationRequest,
  annulerEntretienRequest,
  getDisponibilitesCandidatRequest,
  enregistrerNotesPreparationRequest,
} from "@/lib/api/entretiens";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMesEntretiens() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesEntretiens"],
    queryFn: () => getMesEntretiensRequest(token),
    enabled: !!token,
  });
}

export function useEntretiensEntreprise() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["entretiensEntreprise"],
    queryFn: () => getEntretiensEntrepriseRequest(token),
    enabled: !!token,
  });
}

// Alimente le point d'alerte de la sidebar entreprise
export function useEntretiensEnAttente() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["entretiensEnAttente"],
    queryFn: () => getEntretiensEnAttenteRequest(token),
    enabled: !!token,
    refetchInterval: 15000, // vérifie régulièrement, en l'absence d'un vrai système de notifications
  });
}

function invalidateEntretiens(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["mesEntretiens"] });
  queryClient.invalidateQueries({ queryKey: ["entretiensEntreprise"] });
  queryClient.invalidateQueries({ queryKey: ["entretiensEnAttente"] });
}

export function usePlanifierEntretien() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => planifierEntretienRequest(payload, token),
    onSuccess: () => invalidateEntretiens(queryClient),
  });
}

export function useUpdateEntretienEntreprise() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      updateEntretienEntrepriseRequest(id, payload, token),
    onSuccess: () => invalidateEntretiens(queryClient),
  });
}

export function useValiderEntretien() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => validerEntretienRequest(id, token),
    onSuccess: () => invalidateEntretiens(queryClient),
  });
}

export function useDemanderReprogrammation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dateHeureProposee, retourEntretien }) =>
      demanderReprogrammationRequest(
        id,
        dateHeureProposee,
        retourEntretien,
        token,
      ),
    onSuccess: () => invalidateEntretiens(queryClient),
  });
}



// Annulation par le candidat d'un entretien confirmé (statut "confirme")
// (statut "valide"), avec raison obligatoire.
export function useAnnulerEntretien() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, raisonAnnulation }) =>
      annulerEntretienRequest(id, raisonAnnulation, token),
    onSuccess: () => invalidateEntretiens(queryClient),
  });
}

// Jours/heures de disponibilité du candidat, consultables par l'entreprise
// avant de définir le volume horaire et la durée de l'offre finale.
export function useDisponibilitesCandidat(idEntretien) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["disponibilites-candidat", idEntretien],
    queryFn: () => getDisponibilitesCandidatRequest(idEntretien, token),
    enabled: !!idEntretien && !!token,
  });
}

// Sauvegarde des notes de préparation personnelles du candidat.
export function useEnregistrerNotesPreparation() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notesPreparation }) =>
      enregistrerNotesPreparationRequest(id, notesPreparation, token),
    onSuccess: () => invalidateEntretiens(queryClient),
  });
}