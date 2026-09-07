import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  favorisOffres,
  stagiaires,
  offresStage,
  entreprises,
} from "../../db/schema.js";

export async function resolveIdStagiaire(idUtilisateur) {
  const [s] = await db
    .select({ idStagiaire: stagiaires.idStagiaire })
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);
  return s?.idStagiaire ?? null;
}

export async function listFavorisIds(idStagiaire) {
  const rows = await db
    .select({ idOffre: favorisOffres.idOffre })
    .from(favorisOffres)
    .where(eq(favorisOffres.idStagiaire, idStagiaire));
  return new Set(rows.map((r) => r.idOffre));
}

export async function listFavorisWithOffres(idStagiaire) {
  return db
    .select({
      idFavori: favorisOffres.idFavori,
      dateAjout: favorisOffres.dateAjout,
      idOffre: offresStage.idOffre,
      titre: offresStage.titre,
      departement: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      description: offresStage.description,
      competencesRequises: offresStage.competencesRequises,
      modeTravail: offresStage.modeTravail,
      remunerationType: offresStage.remunerationType,
      montantRemuneration: offresStage.montantRemuneration,
      datePublication: offresStage.datePublication,
      dateLimiteCandidature: offresStage.dateLimiteCandidature,
      statut: offresStage.statut,
      dureeStage: offresStage.dureeStage,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      villeEntreprise: entreprises.ville,
      paysEntreprise: entreprises.pays,
      isFavorite: sql`true`.as("is_favorite"),
    })
    .from(favorisOffres)
    .innerJoin(offresStage, eq(favorisOffres.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(favorisOffres.idStagiaire, idStagiaire))
    .orderBy(desc(favorisOffres.dateAjout));
}

export async function countFavoris(idStagiaire) {
  const [row] = await db
    .select({ n: sql`count(*)::int` })
    .from(favorisOffres)
    .where(eq(favorisOffres.idStagiaire, idStagiaire));
  return row?.n ?? 0;
}

export async function isFavori(idStagiaire, idOffre) {
  const [row] = await db
    .select({ idFavori: favorisOffres.idFavori })
    .from(favorisOffres)
    .where(
      and(
        eq(favorisOffres.idStagiaire, idStagiaire),
        eq(favorisOffres.idOffre, idOffre),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function ajouterFavori(idStagiaire, idOffre) {
  const [offre] = await db
    .select({ idOffre: offresStage.idOffre })
    .from(offresStage)
    .where(eq(offresStage.idOffre, idOffre))
    .limit(1);

  if (!offre) {
    const err = new Error("Offre introuvable");
    err.status = 404;
    throw err;
  }

  try {
    const [row] = await db
      .insert(favorisOffres)
      .values({ idStagiaire, idOffre })
      .returning();
    return row;
  } catch (e) {
    // Doublon unique → déjà favori
    if (e.code === "23505") {
      const [existing] = await db
        .select()
        .from(favorisOffres)
        .where(
          and(
            eq(favorisOffres.idStagiaire, idStagiaire),
            eq(favorisOffres.idOffre, idOffre),
          ),
        )
        .limit(1);
      return existing;
    }
    throw e;
  }
}

export async function retirerFavori(idStagiaire, idOffre) {
  const result = await db
    .delete(favorisOffres)
    .where(
      and(
        eq(favorisOffres.idStagiaire, idStagiaire),
        eq(favorisOffres.idOffre, idOffre),
      ),
    )
    .returning({ idFavori: favorisOffres.idFavori });

  if (result.length === 0) {
    // Idempotent : déjà absent
    return { removed: false };
  }
  return { removed: true, idFavori: result[0].idFavori };
}
