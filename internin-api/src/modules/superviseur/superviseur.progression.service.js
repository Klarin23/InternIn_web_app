import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  stages,
  objectifsStage,
  tachesStage,
  competencesAcquisesStage,
  observationsSuperviseurStage,
  competences,
  journalStage,
} from "../../db/schema.js";
import {
  getSuperviseurOrThrow,
  getAffectationOrThrow,
} from "./superviseur.service.js";

// Vérifie l'accès (rôle + affectation) et renvoie le membre — appelé au
// début de chaque fonction de ce fichier pour garder la même garantie de
// sécurité que le reste du module superviseur.
async function verifierAcces(idUtilisateur, idStage) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  await getAffectationOrThrow(membre.idMembre, idStage);
  return membre;
}

// -----------------------------------------------------------------------
// Vue d'ensemble de la progression
// -----------------------------------------------------------------------

export async function getProgression(idUtilisateur, idStage) {
  await verifierAcces(idUtilisateur, idStage);

  const [stage] = await db
    .select({
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      statut: stages.statut,
      progressionPourcentage: stages.progressionPourcentage,
    })
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stage) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  let progressionCalculee;
  const debut = new Date(stage.dateDebut);
  const fin = new Date(stage.dateFinPrevue);
  const dureeMs = fin - debut;
  if (stage.statut === "termine") {
    progressionCalculee = 100;
  } else if (dureeMs > 0) {
    progressionCalculee = Math.min(
      100,
      Math.max(0, Math.round(((new Date() - debut) / dureeMs) * 100)),
    );
  } else {
    progressionCalculee = 0;
  }

  const [objectifs, taches, competencesAcquises, observations] =
    await Promise.all([
      db
        .select()
        .from(objectifsStage)
        .where(eq(objectifsStage.idStage, idStage))
        .orderBy(desc(objectifsStage.dateCreation)),
      db
        .select()
        .from(tachesStage)
        .where(eq(tachesStage.idStage, idStage))
        .orderBy(desc(tachesStage.dateCreation)),
      db
        .select({
          idAcquisition: competencesAcquisesStage.idAcquisition,
          idCompetence: competencesAcquisesStage.idCompetence,
          dateAcquisition: competencesAcquisesStage.dateAcquisition,
          nomCompetence: competences.nom,
          typeCompetence: competences.typeCompetence,
        })
        .from(competencesAcquisesStage)
        .innerJoin(
          competences,
          eq(competences.idCompetence, competencesAcquisesStage.idCompetence),
        )
        .where(eq(competencesAcquisesStage.idStage, idStage))
        .orderBy(desc(competencesAcquisesStage.dateAcquisition)),
      db
        .select()
        .from(observationsSuperviseurStage)
        .where(eq(observationsSuperviseurStage.idStage, idStage))
        .orderBy(desc(observationsSuperviseurStage.dateCreation)),
    ]);

  return {
    progressionManuelle: stage.progressionPourcentage,
    progressionCalculee,
    objectifs,
    taches,
    competencesAcquises,
    observations,
  };
}

export async function updateProgressionManuelle(
  idUtilisateur,
  idStage,
  progressionPourcentage,
) {
  await verifierAcces(idUtilisateur, idStage);

  const [stage] = await db
    .update(stages)
    .set({ progressionPourcentage })
    .where(eq(stages.idStage, idStage))
    .returning();

  return stage;
}

// -----------------------------------------------------------------------
// Objectifs
// -----------------------------------------------------------------------

export async function ajouterObjectif(idUtilisateur, idStage, description) {
  await verifierAcces(idUtilisateur, idStage);
  const [objectif] = await db
    .insert(objectifsStage)
    .values({ idStage, description })
    .returning();
  return objectif;
}

export async function updateObjectif(
  idUtilisateur,
  idStage,
  idObjectif,
  payload,
) {
  await verifierAcces(idUtilisateur, idStage);

  const [existant] = await db
    .select()
    .from(objectifsStage)
    .where(
      and(
        eq(objectifsStage.idObjectif, idObjectif),
        eq(objectifsStage.idStage, idStage),
      ),
    );
  if (!existant) {
    const err = new Error("Objectif introuvable");
    err.status = 404;
    throw err;
  }

  const [objectif] = await db
    .update(objectifsStage)
    .set({
      ...payload,
      dateRealisation:
        payload.statut === "realise"
          ? new Date()
          : payload.statut === "defini"
            ? null
            : existant.dateRealisation,
    })
    .where(eq(objectifsStage.idObjectif, idObjectif))
    .returning();

  return objectif;
}

export async function supprimerObjectif(idUtilisateur, idStage, idObjectif) {
  await verifierAcces(idUtilisateur, idStage);
  await db
    .delete(objectifsStage)
    .where(
      and(
        eq(objectifsStage.idObjectif, idObjectif),
        eq(objectifsStage.idStage, idStage),
      ),
    );
  return { deleted: true };
}

// -----------------------------------------------------------------------
// Tâches
// -----------------------------------------------------------------------

export async function ajouterTache(idUtilisateur, idStage, description) {
  await verifierAcces(idUtilisateur, idStage);
  const [tache] = await db
    .insert(tachesStage)
    .values({ idStage, description })
    .returning();
  return tache;
}

export async function updateTache(idUtilisateur, idStage, idTache, payload) {
  await verifierAcces(idUtilisateur, idStage);

  const [existante] = await db
    .select()
    .from(tachesStage)
    .where(
      and(eq(tachesStage.idTache, idTache), eq(tachesStage.idStage, idStage)),
    );
  if (!existante) {
    const err = new Error("Tâche introuvable");
    err.status = 404;
    throw err;
  }

  const [tache] = await db
    .update(tachesStage)
    .set({
      ...payload,
      dateCompletion:
        payload.statut === "terminee"
          ? new Date()
          : payload.statut === "a_faire"
            ? null
            : existante.dateCompletion,
    })
    .where(eq(tachesStage.idTache, idTache))
    .returning();

  return tache;
}

export async function supprimerTache(idUtilisateur, idStage, idTache) {
  await verifierAcces(idUtilisateur, idStage);
  await db
    .delete(tachesStage)
    .where(
      and(eq(tachesStage.idTache, idTache), eq(tachesStage.idStage, idStage)),
    );
  return { deleted: true };
}

// -----------------------------------------------------------------------
// Compétences acquises
// -----------------------------------------------------------------------

export async function ajouterCompetenceAcquise(
  idUtilisateur,
  idStage,
  idCompetence,
) {
  await verifierAcces(idUtilisateur, idStage);

  const [existante] = await db
    .select()
    .from(competencesAcquisesStage)
    .where(
      and(
        eq(competencesAcquisesStage.idStage, idStage),
        eq(competencesAcquisesStage.idCompetence, idCompetence),
      ),
    );
  if (existante) {
    const err = new Error("Cette compétence a déjà été marquée comme acquise.");
    err.status = 409;
    throw err;
  }

  const [acquisition] = await db
    .insert(competencesAcquisesStage)
    .values({ idStage, idCompetence })
    .returning();
  return acquisition;
}

export async function supprimerCompetenceAcquise(
  idUtilisateur,
  idStage,
  idAcquisition,
) {
  await verifierAcces(idUtilisateur, idStage);
  await db
    .delete(competencesAcquisesStage)
    .where(
      and(
        eq(competencesAcquisesStage.idAcquisition, idAcquisition),
        eq(competencesAcquisesStage.idStage, idStage),
      ),
    );
  return { deleted: true };
}

// -----------------------------------------------------------------------
// Observations du superviseur
// -----------------------------------------------------------------------

export async function ajouterObservation(idUtilisateur, idStage, contenu) {
  const membre = await verifierAcces(idUtilisateur, idStage);
  const [observation] = await db
    .insert(observationsSuperviseurStage)
    .values({ idStage, idMembre: membre.idMembre, contenu })
    .returning();
  return observation;
}

export async function supprimerObservation(
  idUtilisateur,
  idStage,
  idObservation,
) {
  await verifierAcces(idUtilisateur, idStage);
  await db
    .delete(observationsSuperviseurStage)
    .where(
      and(
        eq(observationsSuperviseurStage.idObservation, idObservation),
        eq(observationsSuperviseurStage.idStage, idStage),
      ),
    );
  return { deleted: true };
}

// -----------------------------------------------------------------------
// Journal de stage — consultation et modération côté superviseur. La
// création des entrées reste réservée au stagiaire (cf. stages.service.js).
// -----------------------------------------------------------------------

export async function listJournalSuperviseur(idUtilisateur, idStage) {
  await verifierAcces(idUtilisateur, idStage);
  return db
    .select()
    .from(journalStage)
    .where(eq(journalStage.idStage, idStage))
    .orderBy(desc(journalStage.dateActivite));
}

export async function modererEntreeJournal(
  idUtilisateur,
  idStage,
  idEntree,
  payload,
) {
  const membre = await verifierAcces(idUtilisateur, idStage);

  const [existante] = await db
    .select()
    .from(journalStage)
    .where(
      and(
        eq(journalStage.idEntree, idEntree),
        eq(journalStage.idStage, idStage),
      ),
    );
  if (!existante) {
    const err = new Error("Entrée de journal introuvable");
    err.status = 404;
    throw err;
  }

  const [entree] = await db
    .update(journalStage)
    .set({
      ...payload,
      idMembreValidateur: membre.idMembre,
      dateValidation: new Date(),
    })
    .where(eq(journalStage.idEntree, idEntree))
    .returning();

  return entree;
}
