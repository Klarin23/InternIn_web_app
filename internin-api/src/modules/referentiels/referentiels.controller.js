import {
  getCompetences,
  getCentresInteret,
  getObjectifsDeveloppement,
} from "./referentiels.service.js";

export async function listCompetences(req, res, next) {
  try {
    res.json(await getCompetences());
  } catch (err) {
    next(err);
  }
}

export async function listCentresInteret(req, res, next) {
  try {
    res.json(await getCentresInteret());
  } catch (err) {
    next(err);
  }
}

export async function listObjectifs(req, res, next) {
  try {
    res.json(await getObjectifsDeveloppement());
  } catch (err) {
    next(err);
  }
}
