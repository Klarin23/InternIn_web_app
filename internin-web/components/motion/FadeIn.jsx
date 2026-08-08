"use client";
// Composant d'animation générique : fait apparaître son contenu
// en fondu + légère translation vers le haut, une seule fois, au scroll.
// Réutilisé sur chaque section de la page pour un effet "vivant" mais sobre.
import { motion } from "framer-motion";

export default function FadeIn({
  children,
  delay = 0,
  y = 24,
  className = "",
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }} // état de départ : invisible, légèrement plus bas
      whileInView={{ opacity: 1, y: 0 }} // état final quand l'élément entre dans l'écran
      viewport={{ once: true, margin: "-80px" }} // ne joue qu'une fois, un peu avant d'être visible
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
