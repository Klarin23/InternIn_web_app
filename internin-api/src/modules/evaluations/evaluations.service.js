import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { evaluationsHebdomadaires, coachingIaSessions, stages, entreprises, stagiaires } from "../../db/schema.js";
import { genererAnalyseCoachIA } from "./coachIA.js";
import { creerNotification } from "../notifications/notifications.service.js";


async function verifierAccesStage(idUtilisateur, idStage) {
  const [stage] = await db
    .select({ idStagiaire: stages.idStagiaire, idEntreprise: stages.idEntreprise })
    .from(stages)
    .where(eq(stages.idStage, idStage));
  
  if (!stage) {
    const err = new Error("Stage introuvable")
    err.status = 404;
    throw err;
  }

  const [stagiaire] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));
  
  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, stage.idEntreprise));
  
  const estAutorise =
    (stagiaire && stagiaire.idUtilisateur === idUtilisateur) ||
    (entreprise && entreprise.idUtilisateur === idUtilisateur);
  
  if (!estAutorise) {
    const err = new Error("Vous n'êtes pas autorisé à consulter ce stage")
    err.status = 403;
    throw err;
  }
}
export async function createEvaluation(idUtilisateurEntreprise, payload) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const [stage] = await db
    .select()
    .from(stages)
    .where(eq(stages.idStage, payload.idStage));
  if (!stage || stage.idEntreprise !== entreprise.idEntreprise) {
    const err = new Error("Vous n'êtes pas autorisé à évaluer ce stage");
    err.status = 403;
    throw err;
  }

  const [stagiaireDuStage] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  const evaluation = await db.transaction(async (tx) => {
    const [{ count }] = await tx
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(evaluationsHebdomadaires)
      .where(eq(evaluationsHebdomadaires.idStage, payload.idStage));

    const [evaluationCreee] = await tx
      .insert(evaluationsHebdomadaires)
      .values({
        idStage: payload.idStage,
        numeroSemaine: count + 1,
        noteAssiduite: payload.noteAssiduite,
        noteCommunication: payload.noteCommunication,
        noteInitiative: payload.noteInitiative,
        noteProfessionnalisme: payload.noteProfessionnalisme,
        noteTravailEquipe: payload.noteTravailEquipe,
        notePerformanceTechnique: payload.notePerformanceTechnique,
        commentaires: payload.commentaires || null,
        statut: "soumise",
        dateSoumission: new Date(),
      })
      .returning();

    const analyse = genererAnalyseCoachIA(payload);

    await tx.insert(coachingIaSessions).values({
      idStage: payload.idStage,
      idEvaluation: evaluationCreee.idEvaluation,
      forces: analyse.forces,
      axesAmelioration: analyse.axesAmelioration,
      actionsRecommandees: analyse.actionsRecommandees,
      resumeProgression: analyse.resumeProgression,
    });

    return evaluationCreee;
  });

  if (stagiaireDuStage) {
    await creerNotification({
      idUtilisateur: stagiaireDuStage.idUtilisateur,
      type: "evaluation_soumise",
      titre: `Évaluation semaine ${evaluation.numeroSemaine} disponible`,
      message:
        "Votre évaluation hebdomadaire a été soumise, avec une analyse de votre Coach IA.",
      lien: "/stage",
    });
  }

  return evaluation;
}

export async function listEvaluationsForStage(idUtilisateur, idStage) {
  await verifierAccesStage(idUtilisateur, idStage);

  return db
    .select()
    .from(evaluationsHebdomadaires)
    .where(eq(evaluationsHebdomadaires.idStage, idStage))
    .orderBy(evaluationsHebdomadaires.numeroSemaine);
}

export async function listCoachingForStage(idUtilisateur, idStage) {
  await verifierAccesStage(idUtilisateur, idStage);

  return db
    .select({
      idSessionCoaching: coachingIaSessions.idSessionCoaching,
      forces: coachingIaSessions.forces,
      axesAmelioration: coachingIaSessions.axesAmelioration,
      actionsRecommandees: coachingIaSessions.actionsRecommandees,
      resumeProgression: coachingIaSessions.resumeProgression,
      dateGeneration: coachingIaSessions.dateGeneration,
      numeroSemaine: evaluationsHebdomadaires.numeroSemaine,
    })
    .from(coachingIaSessions)
    .innerJoin(evaluationsHebdomadaires, eq(coachingIaSessions.idEvaluation, evaluationsHebdomadaires.idEvaluation))
    .where(eq(coachingIaSessions.idStage, idStage))
    .orderBy(evaluationsHebdomadaires.numeroSemaine);
}