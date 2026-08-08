// Génère et vérifie les jetons de session (utilisateurs authentifiés).
import jwt from "jsonwebtoken";
import crypto from "crypto";

const SECRET = process.env.JWT_SECRET;

// Access token court (2 heures)
const ACCESS_TOKEN_EXPIRES_IN = "2h";

// Refresh token long (7 jours) — stocké en base (hashé)
const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/** Génère un refresh token brut (à envoyer au client) + son hash (à stocker en base) */
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
