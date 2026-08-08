import {
  listEvaluationsSuperviseur,
  getEvaluationDetail,
  creerEvaluation,
  modifierEvaluation,
} from "./superviseur.evaluations.service.js";

export async function getEvaluationsHandler(req, res, next) {
  try {
    res.json(await listEvaluationsSuperviseur(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function getEvaluationDetailHandler(req, res, next) {
  try {
    res.json(
      await getEvaluationDetail(
        req.user.idUtilisateur,
        req.params.idStage,
        req.params.idEvaluation,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function postEvaluationHandler(req, res, next) {
  try {
    const evaluation = await creerEvaluation(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body,
    );
    res.status(201).json({ evaluation });
  } catch (err) {
    next(err);
  }
}

export async function patchEvaluationHandler(req, res, next) {
  try {
    const evaluation = await modifierEvaluation(
      req.user.idUtilisateur,
      req.params.idStage,
      req.params.idEvaluation,
      req.body,
    );
    res.json({ evaluation });
  } catch (err) {
    next(err);
  }
}
