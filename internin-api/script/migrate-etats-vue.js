#!/usr/bin/env node
/**
 * Crée la table serveur des états "vu/non vu".
 *
 * Cette migration est volontairement idempotente et indépendante du journal
 * Drizzle, afin de ne pas modifier/rejouer les migrations historiques.
 */
import "dotenv/config";
import { pool } from "../src/db/index.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS etats_vue_utilisateur (
    id_etat_vue UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    ressource VARCHAR(64) NOT NULL,
    date_derniere_vue TIMESTAMPTZ NULL,
    ids_vus JSONB NOT NULL DEFAULT '[]'::jsonb,
    CONSTRAINT etats_vue_utilisateur_utilisateur_ressource_unique
      UNIQUE (id_utilisateur, ressource)
  );

  CREATE INDEX IF NOT EXISTS etats_vue_utilisateur_utilisateur_ressource_idx
    ON etats_vue_utilisateur (id_utilisateur, ressource);
`);

await pool.end();
console.log("Migration des états de vue terminée.");
