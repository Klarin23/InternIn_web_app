import {
  completeUniversiteOnboarding,
  getUniversiteProfile,
  updateUniversiteProfile,
  getUniversiteStats,
  listEtudiants,
  listEntreprisesPartenaires,
  listConventions,
  validerConvention,
  genererPdfConvention,
  getStatistiquesUniversite,
} from "./universites.service.js";

export async function completeOnboarding(req, res, next) {
  try {
    const universite = await completeUniversiteOnboarding(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ universite });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    res.json(await getUniversiteProfile(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    res.json(await updateUniversiteProfile(req.user.idUtilisateur, req.body));
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    res.json(await getUniversiteStats(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listEtudiantsHandler(req, res, next) {
  try {
    const { recherche, statut, page, parPage } = req.query;
    const resultat = await listEtudiants(req.user.idUtilisateur, {
      recherche,
      statut,
      page: page ? Number(page) : 1,
      parPage: parPage ? Number(parPage) : 20,
    });
    res.json(resultat);
  } catch (err) {
    next(err);
  }
}

export async function listEntreprisesHandler(req, res, next) {
  try {
    const { recherche } = req.query;
    res.json(
      await listEntreprisesPartenaires(req.user.idUtilisateur, { recherche }),
    );
  } catch (err) {
    next(err);
  }
}

export async function listConventionsHandler(req, res, next) {
  try {
    const { recherche, statut } = req.query;
    res.json(
      await listConventions(req.user.idUtilisateur, { recherche, statut }),
    );
  } catch (err) {
    next(err);
  }
}

export async function validerConventionHandler(req, res, next) {
  try {
    const convention = await validerConvention(
      req.user.idUtilisateur,
      req.params.id,
      req.body.valider,
    );
    res.json({ convention });
  } catch (err) {
    next(err);
  }
}

export async function genererPdfConventionHandler(req, res, next) {
  try {
    res.json(await genererPdfConvention(req.user.idUtilisateur, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getStatistiquesHandler(req, res, next) {
  try {
    res.json(await getStatistiquesUniversite(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}