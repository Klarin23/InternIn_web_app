"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getControleCentreRequest,
  resolveAnomalieControleRequest,
  getDetectionSettingsRequest,
} from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useControleCentre(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminControleCentre", params],
    queryFn: () => getControleCentreRequest(token, params),
    enabled: !!token,
    keepPreviousData: true,
  });
}

export function useResolveAnomalieControle() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => resolveAnomalieControleRequest(token, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminControleCentre"] });
    },
  });
}

export function useDetectionSettings() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminDetectionSettings"],
    queryFn: () => getDetectionSettingsRequest(token),
    enabled: !!token,
  });
}
