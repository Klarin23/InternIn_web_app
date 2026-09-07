"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listStagesSupervisionRequest,
  getStageSupervisionDetailRequest,
} from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useSupervisionStages(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminSupervisionStages", params],
    queryFn: () => listStagesSupervisionRequest(token, params),
    enabled: !!token,
    keepPreviousData: true,
  });
}

export function useStageSupervisionDetail(id) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["adminStageSupervision", id],
    queryFn: () => getStageSupervisionDetailRequest(token, id),
    enabled: !!token && !!id,
  });
}
