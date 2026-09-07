-- Garantit l'unicité du hash de token (code_jeton) pour éviter collisions / doublons.
-- IF NOT EXISTS pour rester rétrocompatible.
CREATE UNIQUE INDEX IF NOT EXISTS "verifications_email_code_jeton_uidx"
  ON "verifications_email" ("code_jeton");
