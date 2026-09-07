"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConventionsEntrepriseRequest,
  getStatsConventionsEntrepriseRequest,
  getActionsRequisesConventionsRequest,
  getConventionEntrepriseRequest,
  signerConventionEntrepriseRequest,
} from "@/lib/api/conventions";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useConventionsEntreprise(params = {}) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["conventionsEntreprise", params],
    queryFn: () => listConventionsEntrepriseRequest(token, params),
    enabled: !!token,
  });
}

export function useStatsConventionsEntreprise() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["conventionsEntrepriseStats"],
    queryFn: () => getStatsConventionsEntrepriseRequest(token),
    enabled: !!token,
  });
}

export function useActionsRequisesConventions() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["conventionsEntrepriseActions"],
    queryFn: () => getActionsRequisesConventionsRequest(token),
    enabled: !!token,
  });
}

export function useConventionEntreprise(id) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["conventionEntreprise", id],
    queryFn: () => getConventionEntrepriseRequest(token, id),
    enabled: !!token && !!id,
  });
}

export function useSignerConventionEntreprise() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => signerConventionEntrepriseRequest(token, id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["conventionEntreprise", id] });
      qc.invalidateQueries({ queryKey: ["conventionsEntreprise"] });
      qc.invalidateQueries({ queryKey: ["conventionsEntrepriseStats"] });
      qc.invalidateQueries({ queryKey: ["conventionsEntrepriseActions"] });
    },
  });
}
