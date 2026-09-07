import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getEntrepriseAdminStatsRequest,
  listEntrepriseEquipeRequest,
  listEntrepriseOffresRequest,
  listEntrepriseStagesRequest,
  listEntreprisePartenariatsRequest,
  listEntrepriseSignalementsRequest,
  listEntrepriseJournalRequest,
  getEntrepriseRiskScoreRequest,
} from "@/lib/api/admin";

/** Stats agrégées — chargé avec l'onglet Vue générale / au montage détail. */
export function useEntrepriseAdminStats(idEntreprise, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminStats", idEntreprise],
    queryFn: () => getEntrepriseAdminStatsRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntrepriseEquipe(idEntreprise, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminEquipe", idEntreprise],
    queryFn: () => listEntrepriseEquipeRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntrepriseOffres(idEntreprise, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminOffres", idEntreprise],
    queryFn: () => listEntrepriseOffresRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntrepriseStages(idEntreprise, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminStages", idEntreprise],
    queryFn: () => listEntrepriseStagesRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntreprisePartenariats(idEntreprise, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminPartenariats", idEntreprise],
    queryFn: () => listEntreprisePartenariatsRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntrepriseSignalements(idEntreprise, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminSignalements", idEntreprise],
    queryFn: () => listEntrepriseSignalementsRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntrepriseJournal(idEntreprise, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminJournal", idEntreprise],
    queryFn: () => listEntrepriseJournalRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}

export function useEntrepriseRiskScore(idEntreprise, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["entrepriseAdminRiskScore", idEntreprise],
    queryFn: () => getEntrepriseRiskScoreRequest(idEntreprise, token),
    enabled: !!token && !!idEntreprise && enabled,
  });
}
