// Lecture simple des 3 tables de référence — aucune écriture ici,
// ces tables sont gérées uniquement côté plateforme (pas d'API de création).

import { db } from "../../db/index.js";
import {
  competences,
  centresInteret,
  objectifsDeveloppement,
} from "../../db/schema.js";

export async function getCompetences() {
  return db.select().from(competences);
}

export async function getCentresInteret() {
  return db.select().from(centresInteret);
}

export async function getObjectifsDeveloppement() {
  return db.select().from(objectifsDeveloppement);
}
