"use client";

import { useRealtime } from "@/hooks/useRealtime";

/**
 * Monte la connexion SSE une seule fois pour toute l'app authentifiée.
 * No-op si non connecté. Ne bloque jamais l'UI en cas d'échec.
 */
export default function RealtimeProvider({ children }) {
  useRealtime();
  return children;
}
