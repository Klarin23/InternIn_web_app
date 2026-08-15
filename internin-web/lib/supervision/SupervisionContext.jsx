"use client";

import { createContext, useContext, useMemo } from "react";

/**
 * Contexte de supervision partagé Entreprise / Superviseur.
 * basePath : préfixe des routes (ex: "/mes-stagiaires" ou "/supervision/mes-stagiaires")
 *
 * IMPORTANT : ne pas imbriquer un Provider "vide" (valeurs par défaut) à l'intérieur
 * d'un Provider Entreprise — cela écraserait le basePath et renverrait l'utilisateur
 * vers l'espace Superviseur (déconnexion du compte entreprise).
 */
const DEFAULTS = {
  basePath: "/mes-stagiaires",
  evaluationsPath: "/mes-stagiaires/evaluations",
  calendrierPath: "/calendrier-supervision",
  roleLabel: "Superviseur",
  isEntreprise: false,
};

const SupervisionContext = createContext(DEFAULTS);

export function SupervisionProvider({
  children,
  basePath,
  evaluationsPath,
  calendrierPath,
  roleLabel,
  isEntreprise,
}) {
  // Fusionne avec le parent : si une prop n'est pas fournie, on conserve
  // la valeur du contexte parent (évite d'écraser un Provider Entreprise).
  const parent = useContext(SupervisionContext);

  const value = useMemo(
    () => ({
      basePath: basePath ?? parent.basePath ?? DEFAULTS.basePath,
      evaluationsPath:
        evaluationsPath ?? parent.evaluationsPath ?? DEFAULTS.evaluationsPath,
      calendrierPath:
        calendrierPath ?? parent.calendrierPath ?? DEFAULTS.calendrierPath,
      roleLabel: roleLabel ?? parent.roleLabel ?? DEFAULTS.roleLabel,
      isEntreprise:
        isEntreprise ?? parent.isEntreprise ?? DEFAULTS.isEntreprise,
    }),
    [
      basePath,
      evaluationsPath,
      calendrierPath,
      roleLabel,
      isEntreprise,
      parent.basePath,
      parent.evaluationsPath,
      parent.calendrierPath,
      parent.roleLabel,
      parent.isEntreprise,
    ],
  );

  return (
    <SupervisionContext.Provider value={value}>
      {children}
    </SupervisionContext.Provider>
  );
}

export function useSupervisionContext() {
  return useContext(SupervisionContext);
}
