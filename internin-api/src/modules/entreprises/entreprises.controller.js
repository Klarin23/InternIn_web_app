// import { completeEntrepriseOnboarding } from "./entreprises.service.js";
import {
  completeEntrepriseOnboarding,
  getEntrepriseProfile,
  updateEntrepriseProfile,
  updateEntrepriseLogo,
} from "./entreprises.service.js";

export async function completeOnboarding(req, res, next) {
  try {
    const entreprise = await completeEntrepriseOnboarding(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ entreprise });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const profile = await getEntrepriseProfile(req.user.idUtilisateur);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    await updateEntrepriseProfile(req.user.idUtilisateur, req.body);
    const profile = await getEntrepriseProfile(req.user.idUtilisateur);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMyLogo(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error("Aucun fichier reçu");
      err.status = 400;
      throw err;
    }
    const urlFichier = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/uploads/logo/${req.file.filename}`;
    const entreprise = await updateEntrepriseLogo(
      req.user.idUtilisateur,
      urlFichier,
    );
    res.json({ entreprise, url: urlFichier });
  } catch (err) {
    next(err);
  }
}