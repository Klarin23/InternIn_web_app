import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import authRoutes from "./modules/auth/auth.routes.js";
import documentsRoutes from "./modules/documents/documents.routes.js";
import referentielsRoutes from "./modules/referentiels/referentiels.routes.js";
import stagiairesRoutes from "./modules/stagiaires/stagiaires.routes.js";
import entreprisesRoutes from "./modules/entreprises/entreprises.routes.js";
import universitesRoutes from "./modules/universites/universites.routes.js";
import offresRoutes from "./modules/offres/offres.routes.js";
import candidaturesRoutes from "./modules/candidatures/candidatures.routes.js";
import administrateursRoutes from "./modules/administrateurs/administrateurs.routes.js";

import entretiensRoutes from "./modules/entretiens/entretiens.routes.js";
import offresFinalesRoutes from "./modules/offres-finales/offresFinales.routes.js";
import stagesRoutes from "./modules/stages/stages.routes.js";
import evaluationsRoutes from "./modules/evaluations/evaluations.routes.js";
import recommandationsRoutes from "./modules/recommandations/recommandations.routes.js";
import litigesRoutes from "./modules/litiges/litiges.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";
import partenariatsRoutes from "./modules/partenariats/partenariats.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import equipeRoutes from "./modules/equipe/equipe.routes.js";
import superviseurRoutes from "./modules/superviseur/superviseur.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";
import path from "node:path";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import cookieParser from "cookie-parser";


const app = express();

// Obligatoire derrière Railway / un reverse proxy
// sinon express-rate-limit lève ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set("trust proxy", 1);

app.use(
  helmet({
    // Nécessaire pour que le frontend puisse charger les logos / photos
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Active HSTS uniquement en production (HTTPS)
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    // Content Security Policy basique (renforçable plus tard)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", process.env.API_PUBLIC_URL || ""],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || "http://localhost:3000",
        ],
      },
    },
  }),
);
app.use(globalLimiter);
// CORS strict : uniquement le frontend autorisé
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, scripts serveur…) en dev uniquement
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (origin === allowedOrigin) {
        return callback(null, true);
      }
      // Refus propre (pas d'Error → évite une 500)
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(compression());
// Logs détaillés uniquement en développement
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  // En production : format plus compact et sans données sensibles
  app.use(morgan("combined"));
}
// Les fichiers ne sont plus publics.
// On servira les fichiers via une route protégée (voir documents.routes.js)
// app.use("/uploads", express.static("uploads")); // ← SUPPRIMÉ

app.use(cookieParser());
app.use(express.json());


// Route de vérification rapide que le serveur tourne
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/documents", documentsRoutes);



app.use("/referentiels", referentielsRoutes);

app.use("/stagiaires", stagiairesRoutes);

app.use("/entreprises", entreprisesRoutes);
app.use("/universites", universitesRoutes);

app.use("/offres", offresRoutes);
app.use("/candidatures", candidaturesRoutes);

app.use("/admin", administrateursRoutes);
app.use("/entretiens", entretiensRoutes);

app.use("/offres-finales", offresFinalesRoutes);
app.use("/stages", stagesRoutes);
app.use("/evaluations", evaluationsRoutes);
app.use("/recommandations", recommandationsRoutes);
app.use("/litiges", litigesRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/partenariats", partenariatsRoutes);

app.use("/equipe", equipeRoutes);
app.use("/superviseur", superviseurRoutes);
app.use("/messages", messagesRoutes);

app.use("/uploads/logo", express.static(path.resolve("uploads", "logo")));
app.use(
  "/uploads/photo_profil",
  express.static(path.resolve("uploads", "photo_profil")),
);

// DOIT rester le dernier middleware enregistré
app.use(errorHandler);



export default app;
