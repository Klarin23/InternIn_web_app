import {
  getTableauDeBord,
  listMesStagiaires,
  getDetailStagiaire,
  getCalendrierSupervision,
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

export async function getCalendrier(req, res, next) {
  try {
    const annee = req.query.annee ? Number(req.query.annee) : undefined;
    const mois = req.query.mois ? Number(req.query.mois) : undefined;
    res.json(
      await getCalendrierSupervision(req.user.idUtilisateur, { annee, mois }),
    );
  } catch (err) {
    next(err);
  }
}
