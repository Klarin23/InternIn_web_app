import {
  listEntreprisesEnAttente,
  listUniversitesEnAttente,
  listToutesEntreprises,
  changerStatutCompteEntreprise,
  listToutesUniversites,
  changerStatutCompteUniversite,
  verifierEntreprise,
  verifierUniversite,
  listTousUtilisateurs,
  changerStatutCompteUtilisateur,
  getStatsGlobales,
  getAdminProfile,
  getParametres,
  updateParametres,
  listDocumentsEntreprise,
} from "./administrateurs.service.js";

export async function moi(req, res, next) {
  try {
    res.json(await getAdminProfile(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listEntreprises(req, res, next) {
  try {
    res.json(await listEntreprisesEnAttente());
  } catch (err) {
    next(err);
  }
}

export async function listUniversites(req, res, next) {
  try {
    res.json(await listUniversitesEnAttente());
  } catch (err) {
    next(err);
  }
}

export async function listToutesEntreprisesHandler(req, res, next) {
  try {
    res.json(await listToutesEntreprises(req.query.recherche));
  } catch (err) {
    next(err);
  }
}

export async function changerStatutCompteHandler(req, res, next) {
  try {
    const utilisateur = await changerStatutCompteEntreprise(
      req.params.id,
      req.body.statutCompte,
    );
    res.json({ utilisateur });
  } catch (err) {
    next(err);
  }
}

export async function listToutesUniversitesHandler(req, res, next) {
  try {
    res.json(await listToutesUniversites(req.query.recherche));
  } catch (err) {
    next(err);
  }
}

export async function changerStatutCompteUniversiteHandler(req, res, next) {
  try {
    const utilisateur = await changerStatutCompteUniversite(
      req.params.id,
      req.body.statutCompte,
    );
    res.json({ utilisateur });
  } catch (err) {
    next(err);
  }
}

export async function listTousUtilisateursHandler(req, res, next) {
  try {
    res.json(
      await listTousUtilisateurs({
        recherche: req.query.recherche,
        role: req.query.role,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function changerStatutCompteUtilisateurHandler(req, res, next) {
  try {
    const utilisateur = await changerStatutCompteUtilisateur(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutCompte,
    );
    res.json({ utilisateur });
  } catch (err) {
    next(err);
  }
}

export async function verifierEntrepriseHandler(req, res, next) {
  try {
    const entreprise = await verifierEntreprise(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutVerification,
    );
    res.json({ entreprise });
  } catch (err) {
    next(err);
  }
}

export async function verifierUniversiteHandler(req, res, next) {
  try {
    const universite = await verifierUniversite(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutVerification,
    );
    res.json({ universite });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    res.json(await getStatsGlobales());
  } catch (err) {
    next(err);
  }
}

export async function getParametresHandler(req, res, next) {
  try {
    res.json(await getParametres());
  } catch (err) {
    next(err);
  }
}

export async function updateParametresHandler(req, res, next) {
  try {
    res.json(await updateParametres(req.body));
  } catch (err) {
    next(err);
  }
}

export async function listDocumentsEntrepriseHandler(req, res, next) {
  try {
    res.json(await listDocumentsEntreprise(req.params.id));
  } catch (err) {
    next(err);
  }
}