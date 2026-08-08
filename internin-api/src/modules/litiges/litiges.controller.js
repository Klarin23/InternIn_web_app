import { createLitige, listLitiges, changerStatutLitige } from "./litiges.service.js";

export async function creer(req, res, next) {
  try {
    const litige = await createLitige(req.user.idUtilisateur, req.body);
    res.status(201).json({ litige });
  } catch (err) {
    next(err);
  }
}

export async function lister(req, res, next) {
  try {
    res.json(await listLitiges(req.query.statut));
  } catch (err) {
    next(err);
  }
}

export async function changerStatut(req, res, next) {
  try {
    const litige = await changerStatutLitige(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statut,
    );
    res.json({ litige });
  } catch (err) {
    next(err);
  }
}