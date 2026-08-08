"use client";

// Widget "tirer pour actualiser" : à utiliser comme CONTENEUR SCROLLABLE
// UNIQUE autour du contenu d'une page (il remplace le
// <div className="... overflow-y-auto">{children}</div> existant dans
// chaque layout de rôle).
//
// Comportement :
// - Le geste n'est capté que si le conteneur est déjà tout en haut
//   (scrollTop === 0), pour ne jamais interférer avec un scroll normal.
// - Fonctionne au doigt (mobile) ET à la souris (desktop), grâce aux
//   Pointer Events qui unifient les deux — utile pour tester en local.
// - La flèche circulaire (icône RefreshCw de lucide-react) tourne
//   proportionnellement à la distance tirée, avec un effet de résistance
//   élastique (RESISTANCE < 1).
// - Au relâché, si la distance tirée dépasse REFRESH_THRESHOLD,
//   l'actualisation se déclenche : par défaut, on invalide TOUTES les
//   requêtes TanStack Query en cours, ce qui force un refetch des données
//   affichées — quelle que soit la page (stagiaire, entreprise, admin,
//   université une fois codée). On peut aussi passer un onRefresh
//   personnalisé si une page veut ne rafraîchir qu'une requête précise.

import { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const REFRESH_THRESHOLD = 70; // px à tirer avant que le relâché déclenche l'actualisation
const MAX_PULL = 110; // px — distance maximale de l'indicateur (effet de résistance)
const RESISTANCE = 0.5; // 1px de doigt/souris déplacé = 0.5px d'indicateur
const LOADING_HEIGHT = 56; // px — hauteur de l'indicateur pendant le chargement
const DRAG_ACTIVATION_THRESHOLD = 8; // px de mouvement avant de considérer que c'est un vrai "tirer" et non un simple clic/tap

export default function PullToRefresh({ children, onRefresh, className = "" }) {
  const queryClient = useQueryClient();
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const armedRef = useRef(false); // un appui a démarré en haut du scroll, mais on ne sait pas encore si c'est un tirer ou un clic
  const draggingRef = useRef(false); // le tirer est confirmé (seuil de mouvement dépassé)
  const pullDistanceRef = useRef(0);

  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const defaultRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const handleRefresh = onRefresh || defaultRefresh;

  const updatePull = (value) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  };

  const onPointerDown = (e) => {
    if (refreshing) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Ne jamais armer le geste si l'appui démarre sur un élément interactif
    // (bouton, lien, champ...) : on laisse le clic natif se produire normalement.
    if (
      e.target.closest("button, a, input, textarea, select, [role='button']")
    ) {
      return;
    }

    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;

    // "Armé" seulement : on ne capture PAS encore le pointeur ici, pour ne
    // jamais interférer avec un simple clic. La capture n'aura lieu que si
    // onPointerMove confirme un vrai geste de tirage (cf. plus bas).
    armedRef.current = true;
    startYRef.current = e.clientY;
  };

  const onPointerMove = (e) => {
    if (refreshing) return;
    const el = containerRef.current;

    // Geste déjà confirmé : on poursuit le tirage normalement
    if (draggingRef.current) {
      if (!el || el.scrollTop > 0) {
        draggingRef.current = false;
        setIsDragging(false);
        updatePull(0);
        return;
      }
      const delta = e.clientY - startYRef.current;
      // Empêche le scroll/actualisation natifs du navigateur de concurrencer
      // notre propre geste (surtout nécessaire sur mobile).
      if (delta > 0 && e.cancelable) e.preventDefault();
      updatePull(delta > 0 ? Math.min(delta * RESISTANCE, MAX_PULL) : 0);
      return;
    }

    // Geste pas encore confirmé : on attend un mouvement suffisant avant de
    // décider qu'il s'agit bien d'un tirage (et non d'un clic/tap immobile).
    if (!armedRef.current) return;
    if (!el || el.scrollTop > 0) {
      armedRef.current = false;
      return;
    }

    const delta = e.clientY - startYRef.current;
    if (delta > DRAG_ACTIVATION_THRESHOLD) {
      draggingRef.current = true;
      setIsDragging(true);
      el.setPointerCapture?.(e.pointerId);
      if (e.cancelable) e.preventDefault();
      updatePull(Math.min(delta * RESISTANCE, MAX_PULL));
    }
  };

  const endDrag = useCallback(async () => {
    armedRef.current = false;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    if (pullDistanceRef.current >= REFRESH_THRESHOLD) {
      setRefreshing(true);
      updatePull(LOADING_HEIGHT);
      try {
        await handleRefresh();
      } finally {
        setRefreshing(false);
        updatePull(0);
      }
    } else {
      updatePull(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRefresh]);

  const progress = Math.min(pullDistance / REFRESH_THRESHOLD, 1);
  const rotation = progress * 360;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`overscroll-y-contain ${className}`}
    >
      <div
        className={`flex items-center justify-center overflow-hidden ${
          isDragging ? "" : "transition-[height] duration-300 ease-out"
        }`}
        style={{ height: pullDistance }}
      >
        <RefreshCw
          size={20}
          className={
            refreshing ? "animate-spin text-primary" : "text-muted-foreground"
          }
          style={
            !refreshing ? { transform: `rotate(${rotation}deg)` } : undefined
          }
        />
      </div>
      {children}
    </div>
  );
}
