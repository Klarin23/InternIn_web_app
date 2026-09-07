"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSecurityOverviewRequest,
  listSecuritySessionsRequest,
  revokeSecuritySessionRequest,
  revokeUserSessionsRequest,
  listSecurityAdminsRequest,
  listComptesARisqueRequest,
} from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useSecurityOverview(options = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSecurityOverview"],
    queryFn: () => getSecurityOverviewRequest(token),
    enabled: !!token,
    // Rafraîchir régulièrement pour détecter un nouvel état sans ouvrir le menu
    refetchInterval: options.refetchInterval ?? 60_000,
    staleTime: options.staleTime ?? 30_000,
  });
}

export function useSecuritySessions(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSecuritySessions", params],
    queryFn: () => listSecuritySessionsRequest(token, params),
    enabled: !!token,
  });
}

export function useSecurityAdmins() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSecurityAdmins"],
    queryFn: () => listSecurityAdminsRequest(token),
    enabled: !!token,
  });
}

export function useComptesARisque() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminComptesARisque"],
    queryFn: () => listComptesARisqueRequest(token),
    enabled: !!token,
  });
}

export function useRevokeSession() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => revokeSecuritySessionRequest(token, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSecuritySessions"] });
      qc.invalidateQueries({ queryKey: ["adminSecurityOverview"] });
      qc.invalidateQueries({ queryKey: ["adminComptesARisque"] });
    },
  });
}

export function useRevokeUserSessions() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => revokeUserSessionsRequest(token, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSecuritySessions"] });
      qc.invalidateQueries({ queryKey: ["adminSecurityOverview"] });
      qc.invalidateQueries({ queryKey: ["adminComptesARisque"] });
    },
  });
}
