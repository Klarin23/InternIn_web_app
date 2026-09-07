import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { evaluationsHebdomadaires, coachingIaSessions, stages, stagiaires } from "../../db/schema.js";
import { genererAnalyseCoachIA } from "./coachIA.js";
import { creerNotification, emitNotificationCreated } from "../notifications/notifications.service.js";
import { resolveEntrepriseContext, hasEntreprisePermission } from "../../utils/entrepriseContext.js";
import { resolveSupervisionAccess, assertStageAccess } from "../superviseur/superviseur.service.js";


async function verifierAccesStage(idUtilisateur, idStage) {
  const [stage] = await db
    .select({ idStagiaire: stages.idStagiaire, idEntreprise: stages.idEntreprise })
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stage) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  // 1) Le stagiaire peut consulter les évaluations de son propre stage.
  const [stagiaire] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  if (stagiaire?.idUtilisateur === idUtilisateur) {
    return stage;
  }

  // 2) Côté entreprise, on utilise le contexte centralisé :
  //    propriétaire + membres actifs + permissions effectives.
  const entrepriseCtx = await resolveEntrepriseContext(idUtilisateur);

  if (entrepriseCtx?.entreprise?.idEntreprise === stage.idEntreprise) {
    // Un superviseur doit en plus être affecté à CE stage.
    // Cela évite qu'un superviseur puisse utiliser cet endpoint générique
    // pour consulter/évaluer n'importe quel stage de son entreprise.
    if (entrepriseCtx.membre?.roleEquipe === "superviseur") {
      const access = await resolveSupervisionAccess(idUtilisateur);
      await assertStageAccess(access, idStage);
      return stage;
    }

    // Les autres membres doivent posséder explicitement la permission
    // dédiée aux évaluations. L'administrateur principal/propriétaire est
    // couvert par hasEntreprisePermission (accès complet implicite).
    if (hasEntreprisePermission(entrepriseCtx, "stagiaires.evaluer")) {
      return stage;
    }
  }

  const err = new Error("Vous n'êtes pas autorisé à consulter ce stage");
  err.status = 403;
  throw err;
}
export async function createEvaluation(idUtilisateur, payload) {
  // Autorisation centralisée : propriétaire, membre autorisé ou superviseur
  // affecté au stage. La même règle protège également l'endpoint générique
  // POST /evaluations.
  await verifierAccesStage(idUtilisateur, payload.idStage);

  const [stage] = await db
    .select()
    .from(stages)
    .where(eq(stages.idStage, payload.idStage));

  const [stagiaireDuStage] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  const evaluation = await db.transaction(async (tx) => {
    // Verrouille la ligne du stage pendant toute la création de l'évaluation.
    // Sans ce verrou, deux requêtes concurrentes peuvent toutes les deux lire
    // COUNT(*) = N puis tenter d'insérer la même semaine N + 1.
    // La contrainte UNIQUE(id_stage, numero_semaine) protège déjà la cohérence,
    // mais elle transforme alors la course en erreur 500/contrainte pour l'une
    // des requêtes. Le verrou sérialise proprement les créations pour ce stage.
    const stageVerrouille = await tx.execute(
      sql`SELECT id_stage FROM stages WHERE id_stage = ${payload.idStage} FOR UPDATE`,
    );

    if (stageVerrouille.rows.length === 0) {
      const err = new Error("Stage introuvable");
      err.status = 404;
      throw err;
    }

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

    let notif = null;
    if (stagiaireDuStage) {
      notif = await creerNotification(
        {
          idUtilisateur: stagiaireDuStage.idUtilisateur,
          type: "evaluation_soumise",
          titre: `Évaluation semaine ${evaluationCreee.numeroSemaine} disponible`,
          message:
            "Votre évaluation hebdomadaire a été soumise, avec une analyse de votre Coach IA.",
          lien: "/stage",
        },
        tx,
      );
    }

    return { evaluation: evaluationCreee, notif };
  });

  if (evaluation?.notif) {
    emitNotificationCreated(evaluation.notif);
  }

  return evaluation.evaluation;
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