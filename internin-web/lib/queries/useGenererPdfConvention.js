import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Télécharge le PDF d'une convention via la route protégée
 * GET /api/universites/conventions/:id/pdf (Bearer auth).
 * Ne s'appuie plus sur une URL publique /uploads/...
 */
export function useGenererPdfConvention() {
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async (idConvention) => {
      if (!idConvention) {
        throw new Error("Identifiant de convention manquant");
      }
      const res = await fetch(
        `/api/universites/conventions/${encodeURIComponent(idConvention)}/pdf?disposition=attachment&lang=fr`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        },
      );
      if (!res.ok) {
        let msg = "Impossible de télécharger la convention";
        try {
          const j = await res.json();
          if (j?.error || j?.message) msg = j.error || j.message;
        } catch {
          /* body non JSON */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      if (!blob || blob.size < 100) {
        throw new Error("Document PDF invalide ou vide");
      }
      return blob;
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = "convention-stage.pdf";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    },
  });
}
