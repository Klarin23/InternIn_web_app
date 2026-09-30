import { useQuery } from "@tanstack/react-query";
import {
  getMaitresDeStageUniversiteRequest,
  getMaitreDeStageUniversiteDetailRequest,
} from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMaitresDeStageUniversite(params = {}) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["maitresDeStageUniversite", params],
    queryFn: () => getMaitresDeStageUniversiteRequest(token, params),
    enabled: !!token,
    placeholderData: (data) => data,
    staleTime: 30_000,
  });
}

export function useMaitreDeStageUniversiteDetail(idMembre) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["maitreDeStageUniversiteDetail", idMembre],
    queryFn: () => getMaitreDeStageUniversiteDetailRequest(idMembre, token),
    enabled: !!token && !!idMembre,
    staleTime: 30_000,
  });
}
