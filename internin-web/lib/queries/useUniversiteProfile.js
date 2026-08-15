import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUniversiteProfileRequest,
  updateUniversiteProfileRequest,
} from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useUniversiteProfile(enabled = true) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["universiteProfile"],
    queryFn: () => getUniversiteProfileRequest(token),
    enabled: !!token && enabled,
  });
}

export function useUpdateUniversiteProfile() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateUniversiteProfileRequest(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universiteProfile"] });
    },
  });
}
