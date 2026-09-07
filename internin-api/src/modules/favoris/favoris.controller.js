import {
  resolveIdStagiaire,
  listFavorisWithOffres,
  countFavoris,
  ajouterFavori,
  retirerFavori,
  isFavori,
} from "./favoris.service.js";

async function requireStagiaire(req) {
  if (req.user?.typeUtilisateur !== "stagiaire") {
    const err = new Error("Accès réservé aux stagiaires");
    err.status = 403;
    throw err;
  }
  const idStagiaire = await resolveIdStagiaire(req.user.idUtilisateur);
  if (!idStagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 403;
    throw err;
  }
  return idStagiaire;
}

export async function getFavoris(req, res, next) {
  try {
    const idStagiaire = await requireStagiaire(req);
    const list = await listFavorisWithOffres(idStagiaire);
    res.json(list);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

export async function getFavorisCount(req, res, next) {
  try {
    const idStagiaire = await requireStagiaire(req);
    const n = await countFavoris(idStagiaire);
    res.json({ count: n });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

export async function postFavori(req, res, next) {
  try {
    const idStagiaire = await requireStagiaire(req);
    const idOffre = req.params.idOffre;
    const row = await ajouterFavori(idStagiaire, idOffre);
    res.status(201).json({ ...row, isFavorite: true });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

export async function deleteFavori(req, res, next) {
  try {
    const idStagiaire = await requireStagiaire(req);
    const idOffre = req.params.idOffre;
    const result = await retirerFavori(idStagiaire, idOffre);
    res.json({ ...result, isFavorite: false });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}

export async function getIsFavori(req, res, next) {
  try {
    const idStagiaire = await requireStagiaire(req);
    const fav = await isFavori(idStagiaire, req.params.idOffre);
    res.json({ isFavorite: fav });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
}
