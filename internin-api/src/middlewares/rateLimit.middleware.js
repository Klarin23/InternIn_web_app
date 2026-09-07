import rateLimit from "express-rate-limit";


// Login strict (IP) — complémenté par le rate-limit compte dans auth.service
export const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_IP_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.LOGIN_RATE_LIMIT_IP_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  // express-rate-limit v8 utilise req.ip (respecte trust proxy)
  message: {
    error:
      "Trop de tentatives de connexion. Veuillez patienter quelques instants avant de réessayer.",
  },
  statusCode: 429,
});

// Auth générique (register / forgot / reset / google)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans quelques minutes." },
});

// Refresh un peu plus permissif (l'utilisateur peut refresh plusieurs fois)
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de rafraîchissements. Réessayez plus tard." },
});

// Upload de fichiers
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop d'uploads. Réessayez dans quelques minutes." },
});

// Limite globale
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessayez plus tard." },
});


// Téléchargement / consultation de documents sensibles (CV, etc.)
// Empêche l'exfiltration massive en cas de compte compromis.
export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de téléchargements. Réessayez dans quelques minutes." },
});


// Émission de tickets SSE (court-lived secrets)
export const sseTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de demandes de tickets temps réel. Réessayez plus tard." },
});

// Ouverture de connexions SSE
export const sseConnectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de connexions temps réel. Réessayez plus tard." },
});
