"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { corrigerDatesStageRequest } from "@/lib/api/stages";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useCorrigerDatesStage(idStage) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dateDebut) =>
      corrigerDatesStageRequest(idStage, dateDebut, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["detailStagiaire", idStage] });
      qc.invalidateQueries({ queryKey: ["mesStagiaires"] });
      qc.invalidateQueries({ queryKey: ["adminControleCentre"] });
    },
  });
}
