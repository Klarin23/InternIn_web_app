// Middleware RBAC générique — à utiliser après requireAuth, pour restreindre
// une route à un ou plusieurs rôles précis. Usage :
// router.get("/verifications", requireAuth, requireRole("administrateur"), handler)

export function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user || !rolesAutorises.includes(req.user.typeUtilisateur)) {
      return res.status(403).json({ error: "Accès non autorisé pour ce rôle" });
    }
    next();
  };
}
