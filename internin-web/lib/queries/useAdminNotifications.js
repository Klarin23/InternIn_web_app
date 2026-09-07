"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNotificationsAdminRequest,
  getNotificationsAdminStatsRequest,
  marquerNotificationLueRequest,
  marquerToutesNotificationsLuesRequest,
} from "@/lib/api/notifications";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useAdminNotifications(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminNotifications", params],
    queryFn: () => listNotificationsAdminRequest(token, params),
    enabled: !!token,
    keepPreviousData: true,
  });
}

export function useAdminNotificationsStats() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminNotificationsStats"],
    queryFn: () => getNotificationsAdminStatsRequest(token),
    enabled: !!token,
  });
}

export function useMarquerNotifLueAdmin() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => marquerNotificationLueRequest(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotifications"] });
      qc.invalidateQueries({ queryKey: ["adminNotificationsStats"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notificationsNonLuesCount"] });
    },
  });
}

export function useMarquerToutesLuesAdmin() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => marquerToutesNotificationsLuesRequest(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotifications"] });
      qc.invalidateQueries({ queryKey: ["adminNotificationsStats"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notificationsNonLuesCount"] });
    },
  });
}
