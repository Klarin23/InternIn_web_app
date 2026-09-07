import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";

const RESSOURCES_AUTORISEES = new Set([
  "offres",
  "stages",
  "conventions",
  "entreprises",
  "universites",
  "controle",
  "securite",
  "signalements",
]);

function assertResource(resource) {
  if (!RESSOURCES_AUTORISEES.has(resource)) {
    const error = new Error("Ressource d'état de vue inconnue.");
    error.status = 400;
    error.code = "RESSOURCE_VUE_INVALIDE";
    throw error;
  }
}

function normalizeIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map(String).filter(Boolean))].slice(-500);
}

export async function getEtatVue(idUtilisateur, resource) {
  assertResource(resource);

  const result = await db.execute(sql`
    SELECT
      date_derniere_vue AS "dateDerniereVue",
      ids_vus AS "idsVus"
    FROM etats_vue_utilisateur
    WHERE id_utilisateur = ${idUtilisateur}
      AND ressource = ${resource}
    LIMIT 1
  `);

  const row = result.rows?.[0];
  return {
    ressource: resource,
    dateDerniereVue: row?.dateDerniereVue
      ? new Date(row.dateDerniereVue).toISOString()
      : null,
    idsVus: Array.isArray(row?.idsVus) ? row.idsVus.map(String) : [],
  };
}

export async function markSectionSeen(idUtilisateur, resource) {
  assertResource(resource);

  const result = await db.execute(sql`
    INSERT INTO etats_vue_utilisateur (
      id_utilisateur,
      ressource,
      date_derniere_vue,
      ids_vus
    )
    VALUES (${idUtilisateur}, ${resource}, NOW(), '[]'::jsonb)
    ON CONFLICT (id_utilisateur, ressource)
    DO UPDATE SET date_derniere_vue = NOW()
    RETURNING
      date_derniere_vue AS "dateDerniereVue",
      ids_vus AS "idsVus"
  `);

  const row = result.rows[0];
  return {
    ressource: resource,
    dateDerniereVue: new Date(row.dateDerniereVue).toISOString(),
    idsVus: Array.isArray(row.idsVus) ? row.idsVus.map(String) : [],
  };
}

export async function markItemSeen(idUtilisateur, resource, id) {
  assertResource(resource);
  if (!id) {
    const error = new Error("Identifiant de l'élément requis.");
    error.status = 400;
    error.code = "ID_VUE_REQUIS";
    throw error;
  }

  const itemId = String(id);
  const current = await getEtatVue(idUtilisateur, resource);
  const ids = normalizeIds([...current.idsVus, itemId]);

  const result = await db.execute(sql`
    INSERT INTO etats_vue_utilisateur (
      id_utilisateur,
      ressource,
      date_derniere_vue,
      ids_vus
    )
    VALUES (${idUtilisateur}, ${resource}, NULL, ${JSON.stringify(ids)}::jsonb)
    ON CONFLICT (id_utilisateur, ressource)
    DO UPDATE SET ids_vus = ${JSON.stringify(ids)}::jsonb
    RETURNING
      date_derniere_vue AS "dateDerniereVue",
      ids_vus AS "idsVus"
  `);

  const row = result.rows[0];
  return {
    ressource: resource,
    dateDerniereVue: row.dateDerniereVue
      ? new Date(row.dateDerniereVue).toISOString()
      : null,
    idsVus: Array.isArray(row.idsVus) ? row.idsVus.map(String) : [],
  };
}
