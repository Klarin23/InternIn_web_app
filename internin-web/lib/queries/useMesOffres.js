import { useQuery } from "@tanstack/react-query";
import { listMesOffresRequest } from "@/lib/api/offres";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useMesOffres() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mesOffres"],
    queryFn: () => listMesOffresRequest(token),
    enabled: !!token,
  });
}
