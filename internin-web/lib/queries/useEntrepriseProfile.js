import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEntrepriseProfileRequest,
  updateEntrepriseProfileRequest,
  uploadLogoEntrepriseRequest,
} from "@/lib/api/entreprises";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useEntrepriseProfile(enabled = true) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["entrepriseProfile"],
    queryFn: () => getEntrepriseProfileRequest(token),
    enabled: !!token && enabled,
  });
}

export function useUpdateEntrepriseProfile() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateEntrepriseProfileRequest(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrepriseProfile"] });
    },
  });
}

export function useUploadLogoEntreprise() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => uploadLogoEntrepriseRequest(file, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrepriseProfile"] });
    },
  });
}
