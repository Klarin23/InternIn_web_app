"use client";
// Salutation adaptée à l'heure : 00h–12h -> "Bonjour" + soleil (couleur
// ambrée/jaune, cohérente avec --accent de la charte) ; 13h et après ->
// "Bonsoir" + lune (couleur indigo, teinte "nuit"). Dégradé de fond très
// discret (opacité <10%) pour ne pas alourdir la carte.

import { motion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";

export default function WelcomeBanner({ nomEntreprise }) {
  const heure = new Date().getHours();
  const estJour = heure < 13; // 00h–12h59 -> jour, 13h+ -> soir/nuit

  const config = estJour
    ? {
        salutation: "Bonjour",
        Icon: FiSun,
        iconBg: "bg-accent/40",
        iconColor: "text-amber-600",
        gradient: "from-accent/[0.10] via-transparent to-primary/[0.05]",
      }
    : {
        salutation: "Bonsoir",
        Icon: FiMoon,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-500",
        gradient:
          "from-indigo-500/[0.08] via-transparent to-secondary-foreground/[0.06]",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative flex items-center gap-4 overflow-hidden rounded-md border border-border bg-card bg-linear-to-br p-6 ${config.gradient}`}
    >
      <div
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}
      >
        <config.Icon className="h-5 w-5" />
      </div>
      <div className="relative min-w-0">
        <h2 className="text-lg font-semibold text-foreground">
          {config.salutation}, {nomEntreprise} 👋
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Voici un aperçu de votre activité de recrutement.
        </p>
      </div>
    </motion.div>
  );
}
