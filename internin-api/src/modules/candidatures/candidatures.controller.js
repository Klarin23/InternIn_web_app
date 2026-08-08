import {
  createCandidature,
  listMesCandidatures,
  getCandidatureForOffre,
  listCandidaturesForEntreprise,
  updateCandidatureStatut,
  rejeterCandidatureApresEntretien,
  getCandidatsRecommandes,
  getHistoriqueCandidature,
  enregistrerConsultationCv,
  getEvaluationCandidature,
  upsertEvaluationCandidature,
  listNotesCandidature,
  ajouterNoteCandidature,
} from "./candidatures.service.js";

export async function postuler(req, res, next) {
  try {
    const candidature = await createCandidature(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ candidature });
  } catch (err) {
    next(err);
  }
}

export async function listMiennes(req, res, next) {
  try {
    const result = await listMesCandidatures(req.user.idUtilisateur);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStatutPourOffre(req, res, next) {
  try {
    const candidature = await getCandidatureForOffre(
      req.user.idUtilisateur,
      req.params.idOffre,
    );
    res.json({ candidature });
  } catch (err) {
    next(err);
  }
}

export async function listPourEntreprise(req, res, next) {
  try {
    const { idOffre } = req.query;
    const result = await listCandidaturesForEntreprise(req.user.idUtilisateur, {
      idOffre,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function changerStatut(req, res, next) {
  try {
    const candidature = await updateCandidatureStatut(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statut,
    );
    res.json({ candidature });
  } catch (err) {
    next(err);
  }
}

export async function rejeterApresEntretien(req, res, next) {
  try {
    const candidature = await rejeterCandidatureApresEntretien(
      req.user.idUtilisateur,
      req.params.idEntretien,
    );
    res.json({ candidature });
  } catch (err) {
    next(err);
  }
}

export async function listRecommandes(req, res, next) {
  try {
    const result = await getCandidatsRecommandes(req.user.idUtilisateur);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHistorique(req, res, next) {
  try {
    const result = await getHistoriqueCandidature(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function consulterCv(req, res, next) {
  try {
    await enregistrerConsultationCv(req.user.idUtilisateur, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function getEvaluation(req, res, next) {
  try {
    const evaluation = await getEvaluationCandidature(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json(evaluation);
  } catch (err) {
    next(err);
  }
}

export async function updateEvaluation(req, res, next) {
  try {
    const evaluation = await upsertEvaluationCandidature(
      req.user.idUtilisateur,
      req.params.id,
      req.body,
    );
    res.json(evaluation);
  } catch (err) {
    next(err);
  }
}

export async function getNotes(req, res, next) {
  try {
    const result = await listNotesCandidature(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function postNote(req, res, next) {
  try {
    const note = await ajouterNoteCandidature(
      req.user.idUtilisateur,
      req.params.id,
      req.body.contenu,
    );
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}