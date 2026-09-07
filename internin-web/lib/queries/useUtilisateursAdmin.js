import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getUtilisateursAdminStatsRequest,
  getUtilisateurAdminDetailRequest,
  listUtilisateurDocumentsRequest,
  listUtilisateurCandidaturesRequest,
  listUtilisateurStagesRequest,
  listUtilisateurSignalementsRequest,
  listUtilisateurSessionsRequest,
} from "@/lib/api/admin";

export function useUtilisateursAdminStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateursAdminStats"],
    queryFn: () => getUtilisateursAdminStatsRequest(token),
    enabled: !!token,
  });
}

export function useUtilisateurAdminDetail(id, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateurAdminDetail", id],
    queryFn: () => getUtilisateurAdminDetailRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useUtilisateurDocuments(id, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateurAdminDocs", id],
    queryFn: () => listUtilisateurDocumentsRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useUtilisateurCandidatures(id, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateurAdminCandidatures", id],
    queryFn: () => listUtilisateurCandidaturesRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useUtilisateurStages(id, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateurAdminStages", id],
    queryFn: () => listUtilisateurStagesRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useUtilisateurSignalements(id, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateurAdminSignalements", id],
    queryFn: () => listUtilisateurSignalementsRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useUtilisateurSessions(id, enabled = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["utilisateurAdminSessions", id],
    queryFn: () => listUtilisateurSessionsRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}
