"use client";

//Stagger+staggerItem: anime une liste/grille d'element en cascade
// Chaque enfant apparait un peu apres le précédent, au lieu d'un fondu simultané
//usage:
//<Stagger className = "grid grid-cols-3 gap-6">
//<StaggerItem>...</StaggerItem>
//</Stagger>

import { motion } from "framer-motion";

export function Stagger({ children, className = "", staggerDelay = 0.12 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

//Element individuel à l'intérieur d'un Stagger

export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: "easeOut" },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
