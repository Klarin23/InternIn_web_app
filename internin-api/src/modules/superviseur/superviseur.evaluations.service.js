import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  evaluationsHebdomadaires,
  coachingIaSessions,
  stages,
  stagiaires,
} from "../../db/schema.js";
import {
  getSuperviseurOrThrow,
  getAffectationOrThrow,
  baseQueryStagesSuperviseur,
} from "./superviseur.service.js";
import { genererAnalyseCoachIA } from "../evaluations/coachIA.js";
import { creerNotification } from "../notifications/notifications.service.js";

const JOURS_RETARD_EVALUATION = 7;

// -----------------------------------------------------------------------
// Liste des évaluations (page "Évaluations") : fusionne les évaluations
// réellement soumises/brouillons (lignes DB) avec une entrée virtuelle
// "à effectuer" pour chaque stage actif qui n'a pas d'évaluation récente —
// exactement le même calcul que le tableau de bord, pour rester cohérent.
// -----------------------------------------------------------------------
export async function listEvaluationsSuperviseur(idUtilisateur) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  const mesStages = await baseQueryStagesSuperviseur(membre.idMembre);

  if (mesStages.length === 0) return [];

  const idsStages = mesStages.map((s) => s.idStage);
  const stageParId = new Map(mesStages.map((s) => [s.idStage, s]));

  const lignes = await db
    .select()
    .from(evaluationsHebdomadaires)
    .where(inArray(evaluationsHebdomadaires.idStage, idsStages))
    .orderBy(desc(evaluationsHebdomadaires.numeroSemaine));

  const resultat = [];
  const dernierNumeroParStage = new Map();
  const dernierSoumisParStage = new Map();

  for (const l of lignes) {
    const stage = stageParId.get(l.idStage);
    if (!stage) continue;

    const actuel = dernierNumeroParStage.get(l.idStage) || 0;
    if (l.numeroSemaine > actuel)
      dernierNumeroParStage.set(l.idStage, l.numeroSemaine);

    if (l.statut === "soumise") {
      const actuelSoumis = dernierSoumisParStage.get(l.idStage);
      if (
        !actuelSoumis ||
        new Date(l.dateSoumission) > new Date(actuelSoumis)
      ) {
        dernierSoumisParStage.set(l.idStage, l.dateSoumission);
      }
    }

    resultat.push({
      idEvaluation: l.idEvaluation,
      idStage: l.idStage,
      numeroSemaine: l.numeroSemaine,
      statutAffichage: l.statut === "soumise" ? "terminee" : "brouillon",
      dateSoumission: l.dateSoumission,
      prenomStagiaire: stage.prenomStagiaire,
      nomStagiaire: stage.nomStagiaire,
    });
  }

  // Entrée virtuelle "à effectuer" / "en retard" pour chaque stage actif
  // sans évaluation soumise récente.
  const seuilRetard = new Date();
  seuilRetard.setDate(seuilRetard.getDate() - JOURS_RETARD_EVALUATION);

  for (const stage of mesStages) {
    if (stage.statutStage !== "actif") continue;
    const derniereSoumission = dernierSoumisParStage.get(stage.idStage);
    if (derniereSoumission && new Date(derniereSoumission) >= seuilRetard) {
      continue; // à jour, rien à afficher
    }
    resultat.push({
      idEvaluation: null,
      idStage: stage.idStage,
      numeroSemaine: (dernierNumeroParStage.get(stage.idStage) || 0) + 1,
      statutAffichage: derniereSoumission ? "en_retard" : "a_effectuer",
      dateSoumission: null,
      prenomStagiaire: stage.prenomStagiaire,
      nomStagiaire: stage.nomStagiaire,
    });
  }

  // Tri : à traiter en premier (en retard, puis à effectuer), puis les plus
  // récentes.
  const ordre = { en_retard: 0, a_effectuer: 1, brouillon: 2, terminee: 3 };
  resultat.sort((a, b) => {
    const diffOrdre =
      (ordre[a.statutAffichage] ?? 9) - (ordre[b.statutAffichage] ?? 9);
    if (diffOrdre !== 0) return diffOrdre;
    return b.numeroSemaine - a.numeroSemaine;
  });

  return resultat;
}

// -----------------------------------------------------------------------
// Détail d'une évaluation (formulaire d'évaluation hebdomadaire)
// -----------------------------------------------------------------------
export async function getEvaluationDetail(
  idUtilisateur,
  idStage,
  idEvaluation,
) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  await getAffectationOrThrow(membre.idMembre, idStage);

  const [evaluation] = await db
    .select()
    .from(evaluationsHebdomadaires)
    .where(
      and(
        eq(evaluationsHebdomadaires.idEvaluation, idEvaluation),
        eq(evaluationsHebdomadaires.idStage, idStage),
      ),
    );

  if (!evaluation) {
    const err = new Error("Évaluation introuvable");
    err.status = 404;
    throw err;
  }

  const [coaching] = await db
    .select()
    .from(coachingIaSessions)
    .where(eq(coachingIaSessions.idEvaluation, idEvaluation));

  return { evaluation, coaching: coaching || null };
}

// -----------------------------------------------------------------------
// Création d'une nouvelle évaluation (brouillon ou soumission directe)
// -----------------------------------------------------------------------
export async function creerEvaluation(idUtilisateur, idStage, payload) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  await getAffectationOrThrow(membre.idMembre, idStage);

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(evaluationsHebdomadaires)
    .where(eq(evaluationsHebdomadaires.idStage, idStage));

  const numeroSemaine = payload.numeroSemaine || count + 1;
  const soumise = payload.statutCible === "soumise";

  const [evaluationCreee] = await db
    .insert(evaluationsHebdomadaires)
    .values({
      idStage,
      numeroSemaine,
      noteAssiduite: payload.noteAssiduite,
      noteCommunication: payload.noteCommunication,
      noteInitiative: payload.noteInitiative,
      noteProfessionnalisme: payload.noteProfessionnalisme,
      noteTravailEquipe: payload.noteTravailEquipe,
      notePerformanceTechnique: payload.notePerformanceTechnique,
      commentaires: payload.commentaires || null,
      statut: soumise ? "soumise" : "en_attente",
      dateSoumission: soumise ? new Date() : null,
    })
    .returning();

  if (soumise) {
    await finaliserSoumission(idStage, evaluationCreee, payload);
  }

  return evaluationCreee;
}

// -----------------------------------------------------------------------
// Mise à jour d'un brouillon existant (édition, ou passage brouillon ->
// soumise). Le WHERE inclut idEvaluation ET idStage pour éviter tout IDOR
// (cf. consigne sécurité du projet).
// -----------------------------------------------------------------------
export async function modifierEvaluation(
  idUtilisateur,
  idStage,
  idEvaluation,
  payload,
) {
  const membre = await getSuperviseurOrThrow(idUtilisateur);
  await getAffectationOrThrow(membre.idMembre, idStage);

  const [existante] = await db
    .select()
    .from(evaluationsHebdomadaires)
    .where(
      and(
        eq(evaluationsHebdomadaires.idEvaluation, idEvaluation),
        eq(evaluationsHebdomadaires.idStage, idStage),
      ),
    );
  if (!existante) {
    const err = new Error("Évaluation introuvable");
    err.status = 404;
    throw err;
  }
  if (existante.statut === "soumise") {
    const err = new Error(
      "Cette évaluation a déjà été soumise et ne peut plus être modifiée.",
    );
    err.status = 409;
    throw err;
  }

  const soumise = payload.statutCible === "soumise";

  const [evaluationMaj] = await db
    .update(evaluationsHebdomadaires)
    .set({
      noteAssiduite: payload.noteAssiduite,
      noteCommunication: payload.noteCommunication,
      noteInitiative: payload.noteInitiative,
      noteProfessionnalisme: payload.noteProfessionnalisme,
      noteTravailEquipe: payload.noteTravailEquipe,
      notePerformanceTechnique: payload.notePerformanceTechnique,
      commentaires: payload.commentaires || null,
      statut: soumise ? "soumise" : "en_attente",
      dateSoumission: soumise ? new Date() : null,
    })
    .where(
      and(
        eq(evaluationsHebdomadaires.idEvaluation, idEvaluation),
        eq(evaluationsHebdomadaires.idStage, idStage),
      ),
    )
    .returning();

  if (soumise) {
    await finaliserSoumission(idStage, evaluationMaj, payload);
  }

  return evaluationMaj;
}

// Génère l'analyse Coach IA (fonction déjà existante, réutilisée telle
// quelle) et notifie le stagiaire — factorisé pour la création ET la mise à
// jour d'une évaluation soumise.
async function finaliserSoumission(idStage, evaluation, payload) {
  const analyse = genererAnalyseCoachIA(payload);

  await db.insert(coachingIaSessions).values({
    idStage,
    idEvaluation: evaluation.idEvaluation,
    forces: analyse.forces,
    axesAmelioration: analyse.axesAmelioration,
    actionsRecommandees: analyse.actionsRecommandees,
    resumeProgression: analyse.resumeProgression,
  });

  const [stageAvecStagiaire] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stages)
    .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
    .where(eq(stages.idStage, idStage));

  if (stageAvecStagiaire?.idUtilisateur) {
    await creerNotification({
      idUtilisateur: stageAvecStagiaire.idUtilisateur,
      type: "evaluation_soumise",
      titre: `Évaluation semaine ${evaluation.numeroSemaine} disponible`,
      message:
        "Votre évaluation hebdomadaire a été soumise, avec une analyse de votre Coach IA.",
      lien: "/stage",
    });
  }
}
