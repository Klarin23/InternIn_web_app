// Middleware générique de validation Zod, réutilisable sur toutes les routes.
// Usage : router.post("/register", validate(registerSchema), register)

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation échouée",
        details: result.error.flatten().fieldErrors,
      });
    }
    // On remplace req.body par la version validée/typée par Zod
    req.body = result.data;
    next();
  };
}
