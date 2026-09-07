// Canal SSE authentifié — un utilisateur ne reçoit que ses propres événements.
// Auth d'établissement via ticket temporaire (POST /ticket + GET /events?ticket=...).
// Le JWT d'accès n'est JAMAIS accepté dans l'URL.

import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  sseTicketLimiter,
  sseConnectLimiter,
} from "../../middlewares/rateLimit.middleware.js";
import { subscribeRealtime } from "../../utils/realtime.js";
import {
  createSseTicket,
  consumeSseTicket,
} from "./sseTickets.service.js";

const router = Router();

/**
 * POST /realtime/ticket
 * Auth normale (Bearer JWT via requireAuth).
 * Retourne un ticket opaque, à usage unique, TTL ~30s.
 */
router.post("/ticket", sseTicketLimiter, requireAuth, async (req, res, next) => {
  try {
    const idUtilisateur = req.user?.idUtilisateur;
    const result = await createSseTicket(idUtilisateur);
    // Ne jamais logger le ticket
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /realtime/events?ticket=...
 * Refuse explicitement ?token= (ancien mécanisme JWT dans l'URL).
 */
router.get("/events", sseConnectLimiter, async (req, res, next) => {
  try {
    // Refus explicite de l'ancien mécanisme JWT-in-URL
    if (req.query.token !== undefined) {
      return res.status(401).json({
        error:
          "Le JWT ne peut pas être transmis dans l'URL. Utilisez POST /realtime/ticket puis ?ticket=.",
        code: "SSE_JWT_IN_URL_FORBIDDEN",
      });
    }

    const rawTicket = req.query.ticket;
    if (!rawTicket || typeof rawTicket !== "string") {
      return res.status(401).json({
        error: "Ticket SSE requis",
        code: "SSE_TICKET_REQUIRED",
      });
    }

    let idUtilisateur;
    try {
      idUtilisateur = await consumeSseTicket(rawTicket);
    } catch (err) {
      const status = err.status || 401;
      return res.status(status).json({
        error: err.message || "Ticket SSE invalide",
        code: "SSE_TICKET_INVALID",
      });
    }

    // Headers SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // nginx
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    // Heartbeat pour garder la connexion (proxies / navigateurs)
    const heartbeat = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 25_000);

    const clearHb = () => clearInterval(heartbeat);
    res.on("close", clearHb);
    res.on("error", clearHb);

    // Confirmation de connexion (canal privé user:{id})
    // Pas de données sensibles dans le payload
    res.write(`event: connected\n`);
    res.write(
      `data: ${JSON.stringify({ type: "connected", userId: idUtilisateur })}\n\n`,
    );

    subscribeRealtime(idUtilisateur, res);
  } catch (err) {
    next(err);
  }
});

export default router;
