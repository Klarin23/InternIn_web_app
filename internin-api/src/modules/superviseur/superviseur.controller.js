import {
  getTableauDeBord,
  listMesStagiaires,
  getDetailStagiaire,
} from "./superviseur.service.js";

export async function getDashboard(req, res, next) {
  try {
    res.json(await getTableauDeBord(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function getStagiaires(req, res, next) {
  try {
    res.json(await listMesStagiaires(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function getStagiaireDetail(req, res, next) {
  try {
    res.json(
      await getDetailStagiaire(req.user.idUtilisateur, req.params.idStage),
    );
  } catch (err) {
    next(err);
  }
}
