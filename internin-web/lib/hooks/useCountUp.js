"use client";
// Hook de comptage animé : anime une valeur numérique de 0 (ou de la valeur
// précédente) jusqu'à `value`, avec un easing doux. `start` permet de retarder
// le déclenchement (ex: attendre que la carte entre dans le viewport) plutôt
// que de compter dès le montage — sinon, si `value` est déjà disponible au
// premier rendu (cache React Query), il n'y a rien à animer : le total
// s'affiche directement.

import { useEffect, useRef, useState } from "react";

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(value, { duration = 1200, start = true } = {}) {
  const [displayValue, setDisplayValue] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!start) return; // attend le signal de départ (ex: onViewportEnter)

    const target = Number(value) || 0;
    const from = fromRef.current;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(from + (target - from) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, start]);

  return displayValue;
}
