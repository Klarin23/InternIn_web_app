"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listFavorisRequest,
  countFavorisRequest,
  addFavoriRequest,
  removeFavoriRequest,
} from "@/lib/api/favoris";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

export function useFavoris() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["favoris"],
    queryFn: () => listFavorisRequest(token),
    enabled: !!token,
  });
}

export function useFavorisCount() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["favoris-count"],
    queryFn: () => countFavorisRequest(token),
    enabled: !!token,
    select: (d) => d?.count ?? 0,
  });
}

function patchOffreIsFavorite(old, idOffre, next) {
  if (!old) return old;
  const mapOne = (o) =>
    o && o.idOffre === idOffre ? { ...o, isFavorite: next } : o;

  if (Array.isArray(old)) return old.map(mapOne);
  if (Array.isArray(old?.offres)) {
    return { ...old, offres: old.offres.map(mapOne) };
  }
  if (Array.isArray(old?.data)) {
    return { ...old, data: old.data.map(mapOne) };
  }
  // détail unique
  if (old.idOffre === idOffre) {
    return { ...old, isFavorite: next };
  }
  return old;
}

export function useToggleFavori() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ idOffre, isFavorite }) => {
      if (!token) {
        const err = new Error("Authentification requise");
        throw err;
      }
      if (isFavorite) {
        await removeFavoriRequest(idOffre, token);
        return { idOffre, isFavorite: false };
      }
      await addFavoriRequest(idOffre, token);
      return { idOffre, isFavorite: true };
    },
    onMutate: async ({ idOffre, isFavorite }) => {
      const next = !isFavorite;

      await qc.cancelQueries({ queryKey: ["offres"] });
      await qc.cancelQueries({ queryKey: ["offre"] });
      await qc.cancelQueries({ queryKey: ["favoris"] });

      const previousAll = qc.getQueriesData({ predicate: () => true });

      // Met à jour toutes les queries qui contiennent des offres
      qc.setQueriesData({ queryKey: ["offres"] }, (old) =>
        patchOffreIsFavorite(old, idOffre, next),
      );
      qc.setQueriesData({ queryKey: ["offre"] }, (old) =>
        patchOffreIsFavorite(old, idOffre, next),
      );
      qc.setQueriesData({ queryKey: ["offre", idOffre] }, (old) =>
        patchOffreIsFavorite(old, idOffre, next),
      );

      if (isFavorite) {
        qc.setQueryData(["favoris"], (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((f) => f.idOffre !== idOffre);
        });
      }

      return { previousAll, next };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousAll) {
        for (const [key, data] of ctx.previousAll) {
          qc.setQueryData(key, data);
        }
      }
      toast.error(
        err?.message || "Impossible de mettre à jour vos favoris.",
      );
    },
    onSuccess: (data) => {
      if (data.isFavorite) {
        toast.success("Offre ajoutée aux favoris");
      } else {
        toast.success("Offre retirée des favoris");
      }
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: ["favoris"] });
      qc.invalidateQueries({ queryKey: ["favoris-count"] });
      qc.invalidateQueries({ queryKey: ["offres"] });
      if (vars?.idOffre) {
        qc.invalidateQueries({ queryKey: ["offre", vars.idOffre] });
        qc.invalidateQueries({ queryKey: ["offre"] });
      }
    },
  });
}
