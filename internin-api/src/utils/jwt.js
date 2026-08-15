// Génère et vérifie les jetons de session (utilisateurs authentifiés).
import jwt from "jsonwebtoken";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET;

// Access token court (15 minutes) — le refresh token maintient la session.
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

// Refresh token long (7 jours) — stocké en base (hashé)
const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(payload) {
  if (!SECRET) {
    throw new Error("JWT_SECRET manquant dans la configuration serveur.");
  }
  return jwt.sign(payload, SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    algorithm: "HS256",
  });
}

export function verifyToken(token) {
  if (!SECRET) {
    throw new Error("JWT_SECRET manquant dans la configuration serveur.");
  }
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

/** Génère un refresh token brut (cookie) + son hash (base) */
export function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

export function hashRefreshToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getRefreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_DURATION_MS);
}
