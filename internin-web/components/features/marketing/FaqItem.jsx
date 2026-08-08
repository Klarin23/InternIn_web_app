"use client";
// Une question/réponse de la FAQ, avec ouverture/fermeture animée.
// Chaque instance gère son propre état d'ouverture (indépendant des autres).

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border py-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-3 text-left font-semibold text-foreground"
        aria-expanded={isOpen}
      >
        {question}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="ml-4 shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      {/* overflow-hidden est indispensable : sans lui, le texte déborderait
          visuellement pendant que la hauteur s'anime de 0 à sa valeur finale */}
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "collapsed"}
        variants={{
          open: { height: "auto", opacity: 1 },
          collapsed: { height: 0, opacity: 0 },
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="pb-4 pr-8 text-sm text-muted-foreground">{answer}</p>
      </motion.div>
    </div>
  );
}