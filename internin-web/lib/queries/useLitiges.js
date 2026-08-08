import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLitigeRequest,
  listLitigesRequest,
  changerStatutLitigeRequest,
} from "@/lib/api/litiges";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useCreateLitige() {
  const token = useAuthStore((state) => state.token);
  return useMutation({
    mutationFn: (payload) => createLitigeRequest(payload, token),
  });
}

// Réservé à l'espace Administrateur — liste des signalements.
export function useLitigesAdmin(statut) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["litigesAdmin", statut || "tous"],
    queryFn: () => listLitigesRequest(token, statut),
    enabled: !!token,
  });
}

export function useChangerStatutLitige() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) =>
      changerStatutLitigeRequest(id, statut, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["litigesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
