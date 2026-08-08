"use client";
// Confettis discrets : ~18 petites particules qui partent du centre-haut,
// retombent en tournant légèrement, puis disparaissent. Se déclenche via la
// prop `trigger` (incrémenter un compteur/booléen depuis le parent à chaque succès).

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#14B8A6", "#5B3DF5", "#F7B500", "#3B82F6", "#22C55E"];
const PARTICLE_COUNT = 18;

function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    x: (Math.random() - 0.5) * 220, // dispersion horizontale
    rotate: (Math.random() - 0.5) * 260,
    delay: Math.random() * 0.15,
  }));
}

export default function Confetti({ trigger }) {
  const particles = useMemo(() => (trigger ? makeParticles() : []), [trigger]);

  // Pattern "ajuster le state pendant le rendu" (recommandé par React plutôt
  // qu'un effet) : on compare trigger à sa valeur précédente directement ici.
  // Comme c'est fait pendant le rendu (et non dans un effect), React ne
  // committe pas de rendu intermédiaire — pas de cascade, pas de warning.
  const [prevTrigger, setPrevTrigger] = useState(trigger);
  const [visible, setVisible] = useState(false);
  if (trigger !== prevTrigger) {
    setPrevTrigger(trigger);
    setVisible(!!trigger);
  }

  // Ici, en revanche, c'est un vrai effet de bord : programmer la disparition
  // après l'animation. Le setState est dans le callback du timer, donc
  // asynchrone — pas concerné par le warning.
  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timeout);
  }, [visible]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-visible">
      <AnimatePresence>
        {visible &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: 90, opacity: 0, rotate: p.rotate }}
              transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
              exit={{ opacity: 0 }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
