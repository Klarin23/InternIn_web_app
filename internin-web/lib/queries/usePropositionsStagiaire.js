"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPropositionsStagiaireRequest,
  updatePropositionStatutRequest,
} from "@/lib/api/propositions";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

export function usePropositionsStagiaire() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["propositions-stagiaire"],
    queryFn: () => listPropositionsStagiaireRequest(token),
    enabled: !!token,
  });
}

export function useUpdatePropositionStatut() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idProposition, statut, commentaireReponse }) =>
      updatePropositionStatutRequest(
        idProposition,
        { statut, commentaireReponse },
        token,
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["propositions-stagiaire"] });
      qc.invalidateQueries({ queryKey: ["propositions-entreprise"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["candidatures"] });
      qc.invalidateQueries({ queryKey: ["mes-candidatures"] });
      if (vars?.statut === "acceptee") {
        if (!vars?.silentToast) toast.success("Proposition acceptée");
      } else if (vars?.statut === "refusee") {
        toast.success(
          vars?.commentaireReponse
            ? "Proposition refusée — votre réponse a été transmise"
            : "Proposition refusée",
        );
      }
    },
    onError: (err, vars) => {
      if (!vars?.silentToast) {
        toast.error(err?.message || "Impossible de traiter votre demande.");
      }
    },
  });
}

/** Propositions nécessitant une réponse (envoyee | vue). */
export function countPropositionsEnAttente(list) {
  if (!Array.isArray(list)) return 0;
  return list.filter((p) => p.statut === "envoyee" || p.statut === "vue")
    .length;
}
