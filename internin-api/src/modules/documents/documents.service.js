import { db } from "../../db/index.js";
import { documents } from "../../db/schema.js";

export async function saveDocumentRecord({ idUtilisateur, typeDocument, urlFichier, nomFichier }) {
  const [document] = await db
    .insert(documents)
    .values({ idUtilisateur, typeDocument, urlFichier, nomFichier })
    .returning();
  return document;
}