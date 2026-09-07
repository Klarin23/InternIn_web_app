import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSecurityAlertsRequest,
  getSecurityAlertsStatsRequest,
  getSecurityAlertRequest,
  updateSecurityAlertStatusRequest,
} from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useSecurityAlerts(filters = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSecurityAlerts", filters],
    queryFn: () => listSecurityAlertsRequest(filters, token),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}

export function useSecurityAlertsStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSecurityAlertsStats"],
    queryFn: () => getSecurityAlertsStatsRequest(token),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}

export function useSecurityAlert(id) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSecurityAlert", id],
    queryFn: () => getSecurityAlertRequest(id, token),
    enabled: !!token && !!id,
  });
}

export function useUpdateSecurityAlertStatus() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) =>
      updateSecurityAlertStatusRequest(id, statut, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSecurityAlerts"] });
      qc.invalidateQueries({ queryKey: ["adminSecurityAlertsStats"] });
      qc.invalidateQueries({ queryKey: ["adminSecurityOverview"] });
    },
  });
}
