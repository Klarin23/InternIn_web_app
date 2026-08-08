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

  // Ne jamais exposer les détails internes en production
  const message =
    err.status && err.status < 500 ? err.message : "Erreur interne du serveur";

  res.status(status).json({ error: message });
}
