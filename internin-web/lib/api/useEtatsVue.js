import { useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEtatVueRequest,
  markEtatVueRequest,
} from "@/lib/api/etatsVue";

export function useEtatVue(ressource, enabled = true) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["etats-vue", ressource],
    queryFn: () => getEtatVueRequest(ressource, token),
    enabled: Boolean(ressource) && enabled && Boolean(token),
    staleTime: 30_000,
  });
}

export function useMarkEtatVue() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useCallback(
    async (ressource, payload = { action: "section" }) => {
      if (!token) return null;
      const state = await markEtatVueRequest(ressource, payload, token);
      queryClient.setQueryData(["etats-vue", ressource], state);
      return state;
    },
    [queryClient, token],
  );
}
