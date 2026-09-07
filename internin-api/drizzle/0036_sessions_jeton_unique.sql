-- Unicité du hash de refresh token (sessions_utilisateur.jeton)
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_utilisateur_jeton_uidx"
  ON "sessions_utilisateur" ("jeton");
