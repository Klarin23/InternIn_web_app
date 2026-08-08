"use client";

import { useState } from "react";

// Renvoie l'ensemble des idCandidature apparues dans la liste depuis le
// dernier rendu — mais jamais au tout premier chargement de la page
// (sinon toutes les candidatures existantes seraient marquées "Nouveau").
export function useCandidaturesFraiches(candidatures) {
  const [historique, setHistorique] = useState(null); // null = pas encore de référence

  if (!candidatures) {
    return new Set();
  }

  const idsActuels = candidatures.map((c) => c.idCandidature);
  const idsSet = new Set(idsActuels);

  // historique === null signifie "premier chargement réel" : on ne marque
  // rien comme nouveau, on se contente d'enregistrer la base de référence.
  const fraiches =
    historique === null
      ? new Set()
      : new Set(idsActuels.filter((id) => !historique.has(id)));

  const memeContenu =
    historique !== null &&
    historique.size === idsSet.size &&
    idsActuels.every((id) => historique.has(id));

  // Mise à jour du state pendant le rendu (pas dans un effet) : c'est le
  // pattern officiellement recommandé par React pour "ajuster un state
  // dérivé d'une prop qui change" — React relance immédiatement le rendu
  // avec la nouvelle valeur avant de commit, sans passage par un effet.
  if (!memeContenu) {
    setHistorique(idsSet);
  }

  return fraiches;
}
