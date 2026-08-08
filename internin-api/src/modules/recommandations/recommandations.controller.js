import {
  createRecommandation,
  getRecommandationForStage,
  toggleVisibilite,
} from "./recommandations.service.js";

export async function creer(req, res, next) {
  try {
    const recommandation = await createRecommandation(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.contenu,
    );
    res.status(201).json({ recommandation });
  } catch (err) {
    next(err);
  }
}

export async function getPourStage(req, res, next) {
  try {
    res.json(await getRecommandationForStage(req.user.idUtilisateur, req.params.idStage));
  } catch (err) {
    next(err);
  }
}

export async function toggle(req, res, next) {
  try {
    const recommandation = await toggleVisibilite(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.visibleLinkedin,
    );
    res.json({ recommandation });
  } catch (err) {
    next(err);
  }
}
