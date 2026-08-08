import {
  createOffreFinale,
  listOffresFinalesEnAttente,
  listToutesOffresFinales,
  validerOffreFinale,
  listMesOffresFinales,
  repondreOffreFinale,
  listHistoriqueRejets,
} from "./offresFinales.service.js";

export async function creer(req, res, next) {
  try {
    const offreFinale = await createOffreFinale(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ offreFinale });
  } catch (err) {
    next(err);
  }
}

export async function listToutes(req, res, next) {
  try {
    res.json(await listToutesOffresFinales(req.query.statut));
  } catch (err) {
    next(err);
  }
}

export async function listEnAttente(req, res, next) {
  try {
    res.json(await listOffresFinalesEnAttente());
  } catch (err) {
    next(err);
  }
}

export async function valider(req, res, next) {
  try {
    const offreFinale = await validerOffreFinale(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutValidationPlateforme,
    );
    res.json({ offreFinale });
  } catch (err) {
    next(err);
  }
}

export async function listMiennes(req, res, next) {
  try {
    res.json(await listMesOffresFinales(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function historique(req, res, next) {
  try {
    res.json(
      await listHistoriqueRejets(
        req.user.idUtilisateur,
        req.params.idEntretien,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function repondre(req, res, next) {
  try {
    const result = await repondreOffreFinale(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutReponseStagiaire,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
