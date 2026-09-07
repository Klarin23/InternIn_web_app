import {
  resolveIdStagiaire,
  listFavorisIds,
  isFavori,
} from "../favoris/favoris.service.js";
import {
  listOffresPubliees,
  getOffreById,
  listOffresByEntreprise,
  createOffre,
  getOffreForEntreprise,
  updateOffre,
  deleteOffre,
  dupliquerOffre,
} from "./offres.service.js";

export async function listOffres(req, res, next) {
  try {
    const { recherche, modeTravail, secteurActivite } = req.query;
    const offres = await listOffresPubliees({
      recherche,
      modeTravail,
      secteurActivite,
    });

    if (req.user?.typeUtilisateur === "stagiaire") {
      try {
        const idStagiaire = await resolveIdStagiaire(req.user.idUtilisateur);
        if (idStagiaire) {
          const ids = await listFavorisIds(idStagiaire);
          return res.json(
            offres.map((o) => ({
              ...o,
              isFavorite: ids.has(o.idOffre),
            })),
          );
        }
      } catch {
        /* ignore */
      }
    }

    res.json(offres.map((o) => ({ ...o, isFavorite: false })));
  } catch (err) {
    next(err);
  }
}

export async function getOffre(req, res, next) {
  try {
    const offre = await getOffreById(req.params.id);
    let isFavorite = false;
    if (req.user?.typeUtilisateur === "stagiaire") {
      try {
        const idStagiaire = await resolveIdStagiaire(req.user.idUtilisateur);
        if (idStagiaire) {
          isFavorite = await isFavori(idStagiaire, req.params.id);
        }
      } catch {
        /* ignore */
      }
    }
    res.json({ ...offre, isFavorite });
  } catch (err) {
    next(err);
  }
}

export async function listMesOffres(req, res, next) {
  try {
    const offres = await listOffresByEntreprise(req.user.idUtilisateur);
    res.json(offres);
  } catch (err) {
    next(err);
  }
}

export async function creerOffre(req, res, next) {
  try {
    const offre = await createOffre(req.user.idUtilisateur, req.body);
    res.status(201).json({ offre });
  } catch (err) {
    next(err);
  }
}

export async function getOffreEntreprise(req, res, next) {
  try {
    res.json(
      await getOffreForEntreprise(req.user.idUtilisateur, req.params.id),
    );
  } catch (err) {
    next(err);
  }
}

export async function updateOffreHandler(req, res, next) {
  try {
    const offre = await updateOffre(
      req.user.idUtilisateur,
      req.params.id,
      req.body,
    );
    res.json({ offre });
  } catch (err) {
    next(err);
  }
}

export async function deleteOffreHandler(req, res, next) {
  try {
    res.json(await deleteOffre(req.user.idUtilisateur, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function dupliquerOffreHandler(req, res, next) {
  try {
    const offre = await dupliquerOffre(req.user.idUtilisateur, req.params.id);
    res.status(201).json({ offre });
  } catch (err) {
    next(err);
  }
}