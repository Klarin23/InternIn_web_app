"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/useAuthStore";

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 30_000;

/**
 * Demande un ticket SSE temporaire via l'auth Bearer normale.
 * Le ticket n'est jamais stocké (localStorage / sessionStorage / cookie).
 * @param {string} accessToken
 * @returns {Promise<string>}
 */
async function fetchSseTicket(accessToken) {
  const res = await fetch("/api/realtime/ticket", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error || "Impossible d'obtenir un ticket SSE");
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (!data?.ticket || typeof data.ticket !== "string") {
    throw new Error("Réponse ticket SSE invalide");
  }
  return data.ticket;
}

/**
 * Connexion SSE authentifiée par ticket à usage unique.
 * À chaque (re)connexion : nouveau ticket — jamais de JWT dans l'URL.
 */
export function useRealtime() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const esRef = useRef(null);
  const timerRef = useRef(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!token || !user?.idUtilisateur) return;

    let cancelled = false;

    function cleanup() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          /* ignore */
        }
        esRef.current = null;
      }
    }

    function handleEvent(ev) {
      let type = ev.type;
      let payload = {};
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed?.type) type = parsed.type;
        if (parsed?.payload) payload = parsed.payload;
      } catch {
        /* ping / non-JSON */
        return;
      }

      if (type === "connected") return;

      if (type === "notification.created") {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notificationsNonLuesCount"],
        });
        return;
      }

      if (type === "candidature.recue" || type === "candidature.retiree") {
        queryClient.invalidateQueries({ queryKey: ["candidaturesEntreprise"] });
        queryClient.invalidateQueries({ queryKey: ["mesCandidatures"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notificationsNonLuesCount"],
        });
        return;
      }

      if (type.startsWith("entretien.")) {
        queryClient.invalidateQueries({ queryKey: ["entretiensEntreprise"] });
        queryClient.invalidateQueries({ queryKey: ["mesEntretiens"] });
        queryClient.invalidateQueries({ queryKey: ["entretiensEnAttente"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notificationsNonLuesCount"],
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsNonLuesCount"],
      });
    }

    async function connect() {
      if (cancelled) return;
      cleanup();

      // Toujours un NOUVEAU ticket (usage unique + TTL court)
      let ticket;
      try {
        // Lire le token courant (peut avoir été refresh entre-temps)
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) return;
        ticket = await fetchSseTicket(currentToken);
      } catch {
        if (cancelled) return;
        const delay = Math.min(
          RECONNECT_BASE_MS * Math.pow(1.5, retryRef.current),
          RECONNECT_MAX_MS,
        );
        retryRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
        return;
      }

      if (cancelled) return;

      // Ticket uniquement en mémoire pour l'URL — jamais persisté
      const url = `/api/realtime/events?ticket=${encodeURIComponent(ticket)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryRef.current = 0;
        // PostgreSQL LISTEN/NOTIFY est un mécanisme de fan-out, pas une file
        // durable : un événement peut être produit pendant une coupure SSE.
        // Au (re)branchement, on resynchronise donc l'état canonique depuis
        // l'API plutôt que de compter sur un replay du bus.
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notificationsNonLuesCount"],
        });
        queryClient.invalidateQueries({ queryKey: ["candidaturesEntreprise"] });
        queryClient.invalidateQueries({ queryKey: ["mesCandidatures"] });
        queryClient.invalidateQueries({ queryKey: ["entretiensEntreprise"] });
        queryClient.invalidateQueries({ queryKey: ["mesEntretiens"] });
        queryClient.invalidateQueries({ queryKey: ["entretiensEnAttente"] });
      };

      const types = [
        "notification.created",
        "candidature.recue",
        "candidature.retiree",
        "entretien.cree",
        "entretien.valide",
        "entretien.reprogramme",
        "entretien.reprogrammation_demandee",
        "entretien.annule",
        "entretien.maj",
        "connected",
      ];
      for (const t of types) {
        es.addEventListener(t, handleEvent);
      }
      es.onmessage = handleEvent;

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (cancelled) return;
        const delay = Math.min(
          RECONNECT_BASE_MS * Math.pow(1.5, retryRef.current),
          RECONNECT_MAX_MS,
        );
        retryRef.current += 1;
        // Nouveau ticket à la reconnexion (pas de réutilisation)
        timerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [token, user?.idUtilisateur, queryClient]);
}
