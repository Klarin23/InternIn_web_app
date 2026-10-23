import { useQuery } from "@tanstack/react-query";
import { getRecrutementDashboardSectionRequest } from "@/lib/api/equipe";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useRecruitmentDashboardSection(section, enabled = true) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["recrutementDashboard", section],
    queryFn: () => getRecrutementDashboardSectionRequest(section, token),
    enabled: !!token && enabled,
    retry: false,
  });
}
