import {
  listNotifications,
  compterNonLues,
  marquerCommeLue,
  marquerToutesCommeLues,
  supprimerNotification,
  supprimerToutesNotifications,
} from "./notifications.service.js";

export async function lister(req, res, next) {
  try {
    res.json(await listNotifications(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function compter(req, res, next) {
  try {
    res.json({ nonLues: await compterNonLues(req.user.idUtilisateur) });
  } catch (err) {
    next(err);
  }
}

export async function marquerLue(req, res, next) {
  try {
    res.json(await marquerCommeLue(req.user.idUtilisateur, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function marquerTouteslues(req, res, next) {
  try {
    await marquerToutesCommeLues(req.user.idUtilisateur);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function supprimer(req, res, next) {
  try {
    await supprimerNotification(req.user.idUtilisateur, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function supprimerToutes(req, res, next) {
  try {
    await supprimerToutesNotifications(req.user.idUtilisateur);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
