import {
  createEvaluation,
  listEvaluationsForStage,
  listCoachingForStage,
} from "./evaluations.service.js";

export async function creer(req, res, next) {
  try {
    const evaluation = await createEvaluation(req.user.idUtilisateur, req.body);
    res.status(201).json({ evaluation });
  } catch (err) {
    next(err);
  }
}

export async function listPourStage(req, res, next) {
  try {
    res.json(await listEvaluationsForStage(req.user.idUtilisateur, req.params.idStage));
  } catch (err) {
    next(err);
  }
}

export async function listCoachingPourStage(req, res, next) {
  try {
    res.json(
      await listCoachingForStage(req.user.idUtilisateur, req.params.idStage),
    );
  } catch (err) {
    next(err);
  }
}
