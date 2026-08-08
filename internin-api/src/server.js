import "dotenv/config";
import app from "./app.js";

// Vérification stricte des variables critiques au démarrage
const requiredEnv = ["JWT_SECRET", "DATABASE_URL"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `❌ Variables d'environnement manquantes : ${missing.join(", ")}`,
  );
  console.error(
    "L'API ne peut pas démarrer sans ces secrets. Vérifie ton fichier .env",
  );
  process.exit(1);
}

// Bonus : forcer une longueur minimale du secret JWT
if (process.env.JWT_SECRET.length < 32) {
  console.error(
    "❌ JWT_SECRET trop court (minimum 32 caractères recommandés).",
  );
  process.exit(1);
}

const PORT = process.env.PORT || 4000;


app.listen(PORT, "0.0.0.0", () => {
  console.log(`InternIn API démarrée sur le port ${PORT}`);
});
