"use client";
// Anime chaque changement de page à l'intérieur de l'espace Entreprise :
// fondu + léger glissement vers le haut, 300ms. Utilisé via un template.jsx
// (pas layout.jsx) car Next.js remonte un template à chaque navigation —
// c'est ce remount qui déclenche l'animation "initial".

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
