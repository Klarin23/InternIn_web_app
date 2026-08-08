import {
  completeStagiaireOnboarding,
  getStagiaireProfile,
  updateStagiaireProfile,
  updateStagiairePhoto,
} from "./stagiaires.service.js";

export async function completeOnboarding(req, res, next) {
  try {
    const stagiaire = await completeStagiaireOnboarding(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ stagiaire });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const profile = await getStagiaireProfile(req.user.idUtilisateur);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    await updateStagiaireProfile(req.user.idUtilisateur, req.body);
    // On renvoie le profil complet à jour (avec relations) pour que le
    // frontend n'ait qu'à invalider/rafraîchir une seule query.
    const profile = await getStagiaireProfile(req.user.idUtilisateur);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMyPhoto(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error("Aucun fichier reçu");
      err.status = 400;
      throw err;
    }
    const urlFichier = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/uploads/photo_profil/${req.file.filename}`;
    const stagiaire = await updateStagiairePhoto(
      req.user.idUtilisateur,
      urlFichier,
    );
    res.json({ stagiaire, url: urlFichier });
  } catch (err) {
    next(err);
  }
}
