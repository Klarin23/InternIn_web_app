"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAdminConventionsRequest,
  getAdminConventionsStatsRequest,
  getAdminConventionDetailRequest,
  exportAdminConventionsRequest,
  approuverConventionAdminRequest,
} from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useAdminConventions(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminConventions", params],
    queryFn: () => listAdminConventionsRequest(token, params),
    enabled: !!token,
    keepPreviousData: true,
  });
}

export function useAdminConventionsStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminConventionsStats"],
    queryFn: () => getAdminConventionsStatsRequest(token),
    enabled: !!token,
  });
}

export function useAdminConventionDetail(id) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminConventionDetail", id],
    queryFn: () => getAdminConventionDetailRequest(token, id),
    enabled: !!token && !!id,
  });
}

export function useApprouverConventionAdmin() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }) =>
      approuverConventionAdminRequest(token, id, motif),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminConventions"] });
      qc.invalidateQueries({ queryKey: ["adminConventionsStats"] });
      qc.invalidateQueries({ queryKey: ["adminConventionDetail"] });
    },
  });
}

export function useExportAdminConventions() {
  const token = useAuthStore((s) => s.token);
  return {
    exportRows: (params) => exportAdminConventionsRequest(token, params),
  };
}

/** Alias typo fréquent */
export const useAdminCinventionsStats = useAdminConventionsStats;
