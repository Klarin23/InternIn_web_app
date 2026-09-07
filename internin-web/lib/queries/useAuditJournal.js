"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listAuditJournalRequest,
  getAuditStatsRequest,
  getAuditEventRequest,
  exportAuditJournalRequest,
} from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useAuditJournal(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminAuditJournal", params],
    queryFn: () => listAuditJournalRequest(token, params),
    enabled: !!token,
    keepPreviousData: true,
  });
}

export function useAuditStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminAuditStats"],
    queryFn: () => getAuditStatsRequest(token),
    enabled: !!token,
  });
}

export function useAuditEvent(id) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminAuditEvent", id],
    queryFn: () => getAuditEventRequest(token, id),
    enabled: !!token && !!id,
  });
}

export function useExportAudit() {
  const token = useAuthStore((s) => s.token);
  return {
    exportEvents: (params) => exportAuditJournalRequest(token, params),
  };
}
