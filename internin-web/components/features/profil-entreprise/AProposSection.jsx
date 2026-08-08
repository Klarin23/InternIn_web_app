"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";

const SEUIL_TRONCATURE = 260;

export default function AProposSection({ profil, onModifier }) {
  const [ouvert, setOuvert] = useState(false);
  const texte = profil.aPropos;
  const estLong = texte && texte.length > SEUIL_TRONCATURE;

  return (
    <ProfilSectionCard title="À propos de l'entreprise" onEdit={onModifier}>
      {!texte ? (
        <p className="text-sm text-muted-foreground">
          Aucune description pour le moment.{" "}
          <button
            type="button"
            onClick={onModifier}
            className="text-primary hover:underline"
          >
            Ajouter une description
          </button>
        </p>
      ) : (
        <motion.div layout className="overflow-hidden">
          <p
            className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground ${!ouvert && estLong ? "line-clamp-4" : ""}`}
          >
            {texte}
          </p>
          {estLong && (
            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {ouvert ? "Voir moins" : "Voir plus"}
              <FiChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </motion.div>
      )}
    </ProfilSectionCard>
  );
}
