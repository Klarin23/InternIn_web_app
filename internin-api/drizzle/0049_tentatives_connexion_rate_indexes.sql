-- Index pour rate-limit / audit des tentatives de connexion (fenêtre glissante)
CREATE INDEX IF NOT EXISTS "tentatives_connexion_email_date_idx"
  ON "tentatives_connexion" ("email", "date_creation");

CREATE INDEX IF NOT EXISTS "tentatives_connexion_ip_date_idx"
  ON "tentatives_connexion" ("adresse_ip", "date_creation");
