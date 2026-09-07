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
import { checkMaintenance } from "./middlewares/maintenance.middleware.js";
import { getParametres } from "./modules/administrateurs/administrateurs.service.js";
import partenariatsRoutes from "./modules/partenariats/partenariats.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import realtimeRoutes from "./modules/realtime/realtime.routes.js";
import equipeRoutes from "./modules/equipe/equipe.routes.js";
import superviseurRoutes from "./modules/superviseur/superviseur.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";
import propositionsRoutes from "./modules/propositions/propositions.routes.js";
import favorisRoutes from "./modules/favoris/favoris.routes.js";
import conventionsRoutes from "./modules/conventions/conventions.routes.js";
import etatsVueRoutes from "./modules/etats-vue/etatsVue.routes.js";
import path from "node:path";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import cookieParser from "cookie-parser";
import { resolveTrustProxySetting } from "./config/trustProxy.js";


const app = express();

// La valeur doit correspondre exactement à la topologie de déploiement.
// En production, TRUST_PROXY est obligatoire afin d'éviter de faire confiance
// implicitement à un X-Forwarded-For fourni par un client.
app.set("trust proxy", resolveTrustProxySetting());

app.use(
  helmet({
    // Logos / photos servis par l'API et chargés depuis le frontend
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    // API JSON : CSP minimale (le navigateur charge surtout le frontend Next)
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"].concat(
          process.env.API_PUBLIC_URL ? [process.env.API_PUBLIC_URL] : [],
        ),
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || "http://localhost:3000",
        ],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
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
app.use(
  compression({
    // SSE (text/event-stream) ne doit pas être compressé
    filter: (req, res) => {
      if (req.path?.startsWith("/realtime")) return false;
      return compression.filter(req, res);
    },
  }),
);
// Logs : on évite de journaliser les query strings des routes SSE
// (le ticket temporaire ne doit pas apparaître dans les logs).
const skipRealtimeLogs = (req) =>
  typeof req.path === "string" && req.path.startsWith("/realtime");

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev", { skip: skipRealtimeLogs }));
} else {
  app.use(morgan("combined", { skip: skipRealtimeLogs }));
}
// Les fichiers ne sont plus publics.
// On servira les fichiers via une route protégée (voir documents.routes.js)
// app.use("/uploads", express.static("uploads")); // ← SUPPRIMÉ

app.use(cookieParser());
app.use(express.json());


// Route de vérification rapide que le serveur tourne
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/public/maintenance", async (req, res) => {
  try {
    const p = await getParametres();
    const active = !!p.modeMaintenance;
    res.json({
      active,
      message: active
        ? p.messageMaintenance ||
          "InternIn est actuellement en maintenance. Nous serons de retour très bientôt."
        : null,
      debut: p.maintenanceDebut || null,
      fin: p.maintenanceFin || null,
    });
  } catch {
    res.json({ active: false, message: null });
  }
});

app.use(checkMaintenance);

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
app.use("/realtime", realtimeRoutes);
app.use("/partenariats", partenariatsRoutes);

app.use("/equipe", equipeRoutes);
app.use("/superviseur", superviseurRoutes);
app.use("/messages", messagesRoutes);
app.use("/propositions", propositionsRoutes);
app.use("/favoris", favorisRoutes);
app.use("/conventions", conventionsRoutes);
app.use("/etats-vue", etatsVueRoutes);

app.use("/uploads/logo", express.static(path.resolve("uploads", "logo")));
app.use(
  "/uploads/photo_profil",
  express.static(path.resolve("uploads", "photo_profil")),
);

// DOIT rester le dernier middleware enregistré
app.use(errorHandler);



export default app;
