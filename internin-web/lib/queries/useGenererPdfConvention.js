import { useMutation } from "@tanstack/react-query";
import { genererPdfConventionRequest } from "@/lib/api/universites";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useGenererPdfConvention() {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: (idConvention) =>
      genererPdfConventionRequest(idConvention, token),
    onSuccess: (data) => {
      if (data?.url) window.open(data.url, "_blank", "noopener,noreferrer");
    },
  });
}
