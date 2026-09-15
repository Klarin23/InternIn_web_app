import { redactSensitiveUrl } from "../utils/redactUrl.js";
// Gestionnaire d'erreurs centralisé — doit être le DERNIER middleware
// enregistré dans app.js pour capturer toutes les erreurs des routes.

export function errorHandler(err, req, res, next) {
  // Toujours logger côté serveur
  console.error("[ERROR]", {
    message: err.message,
    status: err.status,
    path: req.path,
    method: req.method,
    // Stack uniquement en développement
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });

  const status = err.status || 500;

  if (err.retryAfter) {
    res.set("Retry-After", String(err.retryAfter));
  }

  // Ne jamais exposer les détails internes en production
  const message =
    err.status && err.status < 500 ? err.message : "Erreur interne du serveur";

  const body = { error: message };
  // Certaines erreurs métier portent un code machine-lisible (ex: middleware
  // requireActiveAccount avec ACCOUNT_INACTIVE) : on le transmet s'il existe,
  // sans changer le format existant pour les erreurs qui n'en ont pas.
  if (err.status && err.status < 500 && err.code) {
    body.code = err.code;
  }

  res.status(status).json(body);
}
