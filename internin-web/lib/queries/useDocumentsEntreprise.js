import { useQuery } from "@tanstack/react-query";
import { listDocumentsEntrepriseRequest } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useDocumentsEntreprise(idEntreprise) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["documentsEntreprise", idEntreprise],
    queryFn: () => listDocumentsEntrepriseRequest(idEntreprise, token),
    enabled: !!idEntreprise && !!token,
  });
}
