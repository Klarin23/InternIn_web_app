"use client";
// Enveloppe le Button existant (components/ui/button.jsx) sans le modifier —
// évite tout effet de bord sur les autres espaces (stagiaire, université...).
// Au clic : cercle de ripple qui part du point de clic + réduction à 95%.
// `whileHover` est destructuré explicitement pour ne PAS finir dans ...props
// (sinon il seraient transmis jusqu'au <button> du DOM, qui ne le reconnaît pas).

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RippleButton({
  children,
  className = "",
  onClick,
  whileHover,
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = Date.now();

      setRipples((prev) => [...prev, { id, x, y, size }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      onClick?.(e);
    },
    [onClick],
  );

  return (
    <motion.div
      className="relative inline-block"
      whileHover={whileHover}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
    >
      <Button
        onClick={handleClick}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {children}
      </Button>
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
