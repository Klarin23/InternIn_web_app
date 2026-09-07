"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FiHeart } from "react-icons/fi";
import { useToggleFavori } from "@/lib/queries/useFavoris";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Bouton cœur avec toggle visuel immédiat (état optimiste) + sync backend.
 * L'icône passe rose + remplie quand actif, grise + contour quand inactif.
 *
 * Pas de setState dans un effect : affichage = optimistic ?? prop serveur.
 * L'override optimiste est effacé dès que la prop rattrape (setState pendant
 * le render, pattern React "adjusting state when props change").
 */
export default function FavoriteButton({
  idOffre,
  isFavorite = false,
  className,
  size = "md",
}) {
  const { t } = useTranslation();
  const toggle = useToggleFavori();
  const reduceMotion = useReducedMotion();

  const serverActive = Boolean(isFavorite);
  const [optimistic, setOptimistic] = useState(null);
  const [pending, setPending] = useState(false);

  if (optimistic !== null && optimistic === serverActive) {
    setOptimistic(null);
  }

  const active = optimistic !== null ? optimistic : serverActive;

  const sizeCls =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";
  const iconCls = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!idOffre || pending || toggle.isPending) return;

    const previous = active;
    const next = !previous;

    setOptimistic(next);
    setPending(true);

    try {
      await toggle.mutateAsync({ idOffre, isFavorite: previous });
    } catch {
      setOptimistic(previous);
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={
        active
          ? t("stagiaireSpace.favorites.remove")
          : t("stagiaireSpace.favorites.add")
      }
      aria-pressed={active}
      whileTap={reduceMotion ? undefined : { scale: 0.88 }}
      className={cn(
        "relative z-10 flex items-center justify-center rounded-full transition-colors duration-150",
        sizeCls,
        active
          ? "text-pink-500 hover:text-pink-600"
          : "text-muted-foreground hover:text-pink-400",
        pending && "opacity-70",
        className,
      )}
    >
      <motion.span
        key={active ? "on" : "off"}
        initial={reduceMotion ? false : { scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex items-center justify-center"
      >
        <FiHeart
          className={cn(
            iconCls,
            "transition-[fill,color] duration-150",
            active && "fill-pink-500 text-pink-500",
          )}
        />
      </motion.span>
    </motion.button>
  );
}
