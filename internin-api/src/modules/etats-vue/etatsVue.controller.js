import {
  getEtatVue,
  markSectionSeen,
  markItemSeen,
} from "./etatsVue.service.js";

export async function getEtatVueHandler(req, res, next) {
  try {
    res.json(
      await getEtatVue(req.user.idUtilisateur, req.params.ressource),
    );
  } catch (err) {
    next(err);
  }
}

export async function markEtatVueHandler(req, res, next) {
  try {
    const { action = "section", id } = req.body || {};

    if (action === "section") {
      return res.json(
        await markSectionSeen(
          req.user.idUtilisateur,
          req.params.ressource,
        ),
      );
    }

    if (action === "item") {
      return res.json(
        await markItemSeen(
          req.user.idUtilisateur,
          req.params.ressource,
          id,
        ),
      );
    }

    return res.status(400).json({
      error: "Action d'état de vue invalide.",
      code: "ACTION_VUE_INVALIDE",
    });
  } catch (err) {
    next(err);
  }
}
