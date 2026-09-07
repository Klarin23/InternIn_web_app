import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEtatVueRequest,
  markEtatVueRequest,
} from "@/lib/api/etatsVue";

export function useEtatVue(ressource, enabled = true) {
  return useQuery({
    queryKey: ["etats-vue", ressource],
    queryFn: () => getEtatVueRequest(ressource),
    enabled: Boolean(ressource) && enabled,
    staleTime: 30_000,
  });
}

export function useMarkEtatVue() {
  const queryClient = useQueryClient();

  return useCallback(
    async (ressource, payload = { action: "section" }) => {
      const state = await markEtatVueRequest(ressource, payload);
      queryClient.setQueryData(["etats-vue", ressource], state);
      return state;
    },
    [queryClient],
  );
}
