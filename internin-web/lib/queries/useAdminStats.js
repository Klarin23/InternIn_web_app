import { useQuery } from "@tanstack/react-query";
import { getAdminStatsRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useAdminStats() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStatsRequest(token),
    enabled: !!token,
  });
}
