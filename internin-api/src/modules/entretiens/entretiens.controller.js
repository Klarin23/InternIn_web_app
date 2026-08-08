import {
  createEntretien,
  listEntretiensForStagiaire,
  listEntretiensForEntreprise,
  updateEntretienByEntreprise,
  validerEntretien,
  demanderReprogrammation,
  annulerEntretien,
  enregistrerNotesPreparation,
  countEntretiensEnAttenteEntreprise,
  getDisponibilitesCandidat,
} from "./entretiens.service.js";

export async function planifier(req, res, next) {
  try {
    const entretien = await createEntretien(req.user.idUtilisateur, req.body);
    res.status(201).json({ entretien });
  } catch (err) {
    next(err);
  }
}

export async function listMiens(req, res, next) {
  try {
    res.json(await listEntretiensForStagiaire(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listEntreprise(req, res, next) {
  try {
    res.json(await listEntretiensForEntreprise(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function updateEntreprise(req, res, next) {
  try {
    const entretien = await updateEntretienByEntreprise(
      req.user.idUtilisateur,
      req.params.id,
      req.body,
    );
    res.json({ entretien });
  } catch (err) {
    next(err);
  }
}

export async function validerHandler(req, res, next) {
  try {
    const entretien = await validerEntretien(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json({ entretien });
  } catch (err) {
    next(err);
  }
}

export async function reprogrammerHandler(req, res, next) {
  try {
    const entretien = await demanderReprogrammation(
      req.user.idUtilisateur,
      req.params.id,
      req.body,
    );
    res.json({ entretien });
  } catch (err) {
    next(err);
  }
}



export async function annulerHandler(req, res, next) {
  try {
    const entretien = await annulerEntretien(
      req.user.idUtilisateur,
      req.params.id,
      req.body,
    );
    res.json({ entretien });
  } catch (err) {
    next(err);
  }
}

export async function notesPreparationHandler(req, res, next) {
  try {
    const entretien = await enregistrerNotesPreparation(
      req.user.idUtilisateur,
      req.params.id,
      req.body.notesPreparation,
    );
    res.json({ entretien });
  } catch (err) {
    next(err);
  }
}

export async function disponibilitesCandidat(req, res, next) {
  try {
    const disponibilites = await getDisponibilitesCandidat(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json(disponibilites);
  } catch (err) {
    next(err);
  }
}

export async function attenteEntreprise(req, res, next) {
  try {
    const counts = await countEntretiensEnAttenteEntreprise(
      req.user.idUtilisateur,
    );
    res.json(counts);
  } catch (err) {
    next(err);
  }
}
