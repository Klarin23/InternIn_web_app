import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOffreRequest } from "@/lib/api/offres";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getOffreEntrepriseRequest, updateOffreRequest, deleteOffreRequest } from "@/lib/api/offres";
import { useQuery } from "@tanstack/react-query";
import { dupliquerOffreRequest } from "@/lib/api/offres";

export function useCreateOffre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createOffreRequest(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesOffres"] });
    },
  });
}

export function useOffreEntreprise(id) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["offreEntreprise", id],
    queryFn: () => getOffreEntrepriseRequest(id, token),
    enabled: !!token && !!id,
  });
}

export function useUpdateOffre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateOffreRequest(id, payload, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mesOffres"] });
      queryClient.invalidateQueries({ queryKey: ["offreEntreprise", variables.id] });
    },
  });
}

export function useDeleteOffre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteOffreRequest(id, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mesOffres"] }),
  });
}

export function useDupliquerOffre() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => dupliquerOffreRequest(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesOffres"] });
    },
  });
}
