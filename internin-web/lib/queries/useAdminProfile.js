import { useQuery } from "@tanstack/react-query";
import { getAdminProfileRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useAdminProfile() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["adminProfile"],
    queryFn: () => getAdminProfileRequest(token),
    enabled: !!token,
  });
}
