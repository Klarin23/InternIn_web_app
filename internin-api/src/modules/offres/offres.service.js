// Lecture des offres publiées uniquement (statut='publie') — les brouillons
// et offres fermées/archivées ne sont jamais visibles aux stagiaires.
// Filtres optionnels : recherche texte (titre), mode de travail.

import { db } from "../../db/index.js";
import { sql, eq, and, or, ilike } from "drizzle-orm";
import { offresStage, entreprises, candidatures } from "../../db/schema.js";

export async function listOffresPubliees({
  recherche,
  modeTravail,
  secteurActivite,
} = {}) {
  const conditions = [eq(offresStage.statut, "publie")];

  if (recherche) {
    // Recherche élargie : titre de l'offre, nom de l'entreprise ou ville —
    // couvre le placeholder "Stage, entreprise, ville..." affiché côté UI.
    conditions.push(
      or(
        ilike(offresStage.titre, `%${recherche}%`),
        ilike(entreprises.nomEntreprise, `%${recherche}%`),
        ilike(entreprises.ville, `%${recherche}%`),
      ),
    );
  }
  if (modeTravail) {
    conditions.push(eq(offresStage.modeTravail, modeTravail));
  }
  if (secteurActivite) {
    conditions.push(eq(offresStage.secteurActivite, secteurActivite));
  }

  return db
    .select({
      idOffre: offresStage.idOffre,
      titre: offresStage.titre,
      departement: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      description: offresStage.description,
      // Ajoutés pour la carte : compétences (texte libre côté formulaire
      // entreprise, reformatées en tags à l'affichage) et rémunération.
      competencesRequises: offresStage.competencesRequises,
      modeTravail: offresStage.modeTravail,
      remunerationType: offresStage.remunerationType,
      montantRemuneration: offresStage.montantRemuneration,
      nombrePostes: offresStage.nombrePostes,
      datePublication: offresStage.datePublication,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      villeEntreprise: entreprises.ville,
      dateLimiteCandidature: offresStage.dateLimiteCandidature,
      statut: offresStage.statut,
    })
    .from(offresStage)
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(and(...conditions));
}

export async function getOffreById(idOffre) {
  const [offre] = await db
    .select({
      idOffre: offresStage.idOffre,
      titre: offresStage.titre,
      departement: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      description: offresStage.description,
      responsabilites: offresStage.responsabilites,
      competencesRequises: offresStage.competencesRequises,
      opportunitesApprentissage: offresStage.opportunitesApprentissage,
      modeTravail: offresStage.modeTravail,
      remunerationType: offresStage.remunerationType,
      montantRemuneration: offresStage.montantRemuneration,
      nombrePostes: offresStage.nombrePostes,
      statut: offresStage.statut,
      datePublication: offresStage.datePublication,
      dureeStage: offresStage.dureeStage,
      dateLimiteCandidature: offresStage.dateLimiteCandidature,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      aPropos: entreprises.aPropos,
      villeEntreprise: entreprises.ville,
    })
    .from(offresStage)
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(offresStage.idOffre, idOffre));

  if (!offre || offre.statut !== "publie") {
    const err = new Error("Offre introuvable");
    err.status = 404;
    throw err;
  }

  return offre;
}

// Liste les offres d'une entreprise avec le nombre de candidatures reçues
// par offre (LEFT JOIN + count groupé, pour inclure aussi les offres à 0 candidature).
export async function listOffresByEntreprise(idUtilisateurEntreprise) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  return db
    .select({
      idOffre: offresStage.idOffre,
      titre: offresStage.titre,
      departement: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      statut: offresStage.statut,
      modeTravail: offresStage.modeTravail,
      remunerationType: offresStage.remunerationType,
      montantRemuneration: offresStage.montantRemuneration,
      nombrePostes: offresStage.nombrePostes,
      dureeStage: offresStage.dureeStage,
      dateLimiteCandidature: offresStage.dateLimiteCandidature,
      datePublication: offresStage.datePublication,
      dateCreation: offresStage.dateCreation,
      ville: entreprises.ville,
      logoUrl: entreprises.logoUrl,
      nombreCandidatures: sql`count(${candidatures.idCandidature})`.mapWith(
        Number,
      ),
      // "Profils consultés" = candidatures dont le statut a dépassé "soumise"
      // (l'entreprise les a donc au moins ouvertes). "Présélectionnés" =
      // statut exact "preselectionnee" — donnée réelle, pas estimée.
      nombreConsultes:
        sql`count(${candidatures.idCandidature}) filter (where ${candidatures.statut} != 'soumise')`.mapWith(
          Number,
        ),
      nombrePreselectionnes:
        sql`count(${candidatures.idCandidature}) filter (where ${candidatures.statut} = 'preselectionnee')`.mapWith(
          Number,
        ),
      nombreAcceptes:
        sql`count(${candidatures.idCandidature}) filter (where ${candidatures.statut} = 'acceptee')`.mapWith(
          Number,
        ),
    })
    .from(offresStage)
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .leftJoin(candidatures, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(offresStage.idEntreprise, entreprise.idEntreprise))
    .groupBy(
      offresStage.idOffre,
      offresStage.titre,
      offresStage.departement,
      offresStage.secteurActivite,
      offresStage.statut,
      offresStage.modeTravail,
      offresStage.remunerationType,
      offresStage.montantRemuneration,
      offresStage.nombrePostes,
      offresStage.dureeStage,
      offresStage.dateLimiteCandidature,
      offresStage.datePublication,
      offresStage.dateCreation,
      entreprises.ville,
      entreprises.logoUrl,
    );
}

// Bloque la création si l'entreprise n'est pas vérifiée — règle métier
// du PRD (une entreprise en attente ne peut pas encore publier).
export async function createOffre(idUtilisateurEntreprise, payload) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  // Aucune création d'offre (même brouillon) tant que non vérifiée
  if (entreprise.statutVerification !== "verifiee") {
    const err = new Error(
      "Votre entreprise doit être vérifiée par l'administration avant de pouvoir créer ou publier des offres de stage.",
    );
    err.status = 403;
    throw err;
  }

  const [offre] = await db
    .insert(offresStage)
    .values({
      idEntreprise: entreprise.idEntreprise,
      titre: payload.titre,
      departement: payload.departement || null,
      secteurActivite: payload.secteurActivite,
      description: payload.description,
      responsabilites: payload.responsabilites || null,
      competencesRequises: payload.competencesRequises || null,
      opportunitesApprentissage: payload.opportunitesApprentissage || null,
      modeTravail: payload.modeTravail,
      remunerationType: payload.remunerationType,
      montantRemuneration: payload.montantRemuneration || null,
      nombrePostes: payload.nombrePostes,
      dureeStage: payload.dureeStage || null,
      dateLimiteCandidature: payload.dateLimiteCandidature || null,
      statut: payload.statut,
      datePublication: payload.statut === "publie" ? new Date() : null,
    })
    .returning();

  return offre;
}

// Récupère une offre pour son propriétaire, sans restriction de statut
// (contrairement à getOffreById qui n'expose que les offres publiées).
export async function getOffreForEntreprise(idUtilisateurEntreprise, idOffre) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const [offre] = await db
    .select()
    .from(offresStage)
    .where(eq(offresStage.idOffre, idOffre));
  if (!offre || offre.idEntreprise !== entreprise.idEntreprise) {
    const err = new Error("Offre introuvable");
    err.status = 404;
    throw err;
  }

  return offre;
}

export async function updateOffre(idUtilisateurEntreprise, idOffre, payload) {
  const offreExistante = await getOffreForEntreprise(
    idUtilisateurEntreprise,
    idOffre,
  );
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));

  // Même règle qu'à la création : impossible de publier sans être vérifié
  if (entreprise.statutVerification !== "verifiee") {
    const err = new Error(
      "Votre entreprise doit être vérifiée par l'administration avant de modifier des offres de stage.",
    );
    err.status = 403;
    throw err;
  }

  const updateValues = { ...payload };
  if (updateValues.montantRemuneration === "") {
    updateValues.montantRemuneration = null;
  }
  if (updateValues.dateLimiteCandidature === "") {
    updateValues.dateLimiteCandidature = null;
  }
  if (payload.statut === "publie" && offreExistante.statut !== "publie") {
    updateValues.datePublication = new Date();
  }

  const [offre] = await db
    .update(offresStage)
    .set(updateValues)
    .where(eq(offresStage.idOffre, idOffre))
    .returning();

  return offre;
}

// Ne supprime que si aucune candidature n'existe — règle demandée pour
// éviter de perdre des candidatures déjà reçues par erreur.
export async function deleteOffre(idUtilisateurEntreprise, idOffre) {
  await getOffreForEntreprise(idUtilisateurEntreprise, idOffre);

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(candidatures)
    .where(eq(candidatures.idOffre, idOffre));

  if (count > 0) {
    const err = new Error(
      "Impossible de supprimer une offre ayant déjà reçu des candidatures.",
    );
    err.status = 409;
    throw err;
  }

  await db.delete(offresStage).where(eq(offresStage.idOffre, idOffre));
  return { deleted: true };
}

// Duplique une offre existante en brouillon — pratique pour republier un
// poste similaire sans tout ressaisir. Ne copie ni les candidatures ni les
// dates de publication (la copie démarre "propre").
export async function dupliquerOffre(idUtilisateurEntreprise, idOffre) {
  const offreExistante = await getOffreForEntreprise(
    idUtilisateurEntreprise,
    idOffre,
  );
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));

  if (entreprise.statutVerification !== "verifiee") {
    const err = new Error(
      "Votre entreprise doit être vérifiée par l'administration avant de modifier des offres de stage.",
    );
    err.status = 403;
    throw err;
  }

  const [copie] = await db
    .insert(offresStage)
    .values({
      idEntreprise: offreExistante.idEntreprise,
      titre: `${offreExistante.titre} (copie)`,
      departement: offreExistante.departement,
      secteurActivite: offreExistante.secteurActivite,
      description: offreExistante.description,
      responsabilites: offreExistante.responsabilites,
      competencesRequises: offreExistante.competencesRequises,
      opportunitesApprentissage: offreExistante.opportunitesApprentissage,
      modeTravail: offreExistante.modeTravail,
      remunerationType: offreExistante.remunerationType,
      montantRemuneration: offreExistante.montantRemuneration,
      nombrePostes: offreExistante.nombrePostes,
      dureeStage: offreExistante.dureeStage,
      dateLimiteCandidature: offreExistante.dateLimiteCandidature,
      statut: "brouillon",
      datePublication: null,
    })
    .returning();

  return copie;
}