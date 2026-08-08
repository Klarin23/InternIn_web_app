import {
  getProgression,
  updateProgressionManuelle,
  ajouterObjectif,
  updateObjectif,
  supprimerObjectif,
  ajouterTache,
  updateTache,
  supprimerTache,
  ajouterCompetenceAcquise,
  supprimerCompetenceAcquise,
  ajouterObservation,
  supprimerObservation,
  listJournalSuperviseur,
  modererEntreeJournal,
} from "./superviseur.progression.service.js";

export async function getProgressionHandler(req, res, next) {
  try {
    res.json(await getProgression(req.user.idUtilisateur, req.params.idStage));
  } catch (err) {
    next(err);
  }
}

export async function patchProgressionHandler(req, res, next) {
  try {
    const stage = await updateProgressionManuelle(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.progressionPourcentage,
    );
    res.json({ stage });
  } catch (err) {
    next(err);
  }
}

export async function postObjectifHandler(req, res, next) {
  try {
    const objectif = await ajouterObjectif(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.description,
    );
    res.status(201).json({ objectif });
  } catch (err) {
    next(err);
  }
}

export async function patchObjectifHandler(req, res, next) {
  try {
    const objectif = await updateObjectif(
      req.user.idUtilisateur,
      req.params.idStage,
      req.params.idObjectif,
      req.body,
    );
    res.json({ objectif });
  } catch (err) {
    next(err);
  }
}

export async function deleteObjectifHandler(req, res, next) {
  try {
    res.json(
      await supprimerObjectif(
        req.user.idUtilisateur,
        req.params.idStage,
        req.params.idObjectif,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function postTacheHandler(req, res, next) {
  try {
    const tache = await ajouterTache(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.description,
    );
    res.status(201).json({ tache });
  } catch (err) {
    next(err);
  }
}

export async function patchTacheHandler(req, res, next) {
  try {
    const tache = await updateTache(
      req.user.idUtilisateur,
      req.params.idStage,
      req.params.idTache,
      req.body,
    );
    res.json({ tache });
  } catch (err) {
    next(err);
  }
}

export async function deleteTacheHandler(req, res, next) {
  try {
    res.json(
      await supprimerTache(
        req.user.idUtilisateur,
        req.params.idStage,
        req.params.idTache,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function postCompetenceHandler(req, res, next) {
  try {
    const acquisition = await ajouterCompetenceAcquise(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.idCompetence,
    );
    res.status(201).json({ acquisition });
  } catch (err) {
    next(err);
  }
}

export async function deleteCompetenceHandler(req, res, next) {
  try {
    res.json(
      await supprimerCompetenceAcquise(
        req.user.idUtilisateur,
        req.params.idStage,
        req.params.idAcquisition,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function postObservationHandler(req, res, next) {
  try {
    const observation = await ajouterObservation(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.contenu,
    );
    res.status(201).json({ observation });
  } catch (err) {
    next(err);
  }
}

export async function deleteObservationHandler(req, res, next) {
  try {
    res.json(
      await supprimerObservation(
        req.user.idUtilisateur,
        req.params.idStage,
        req.params.idObservation,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function getJournalHandler(req, res, next) {
  try {
    res.json(
      await listJournalSuperviseur(req.user.idUtilisateur, req.params.idStage),
    );
  } catch (err) {
    next(err);
  }
}

export async function patchJournalHandler(req, res, next) {
  try {
    const entree = await modererEntreeJournal(
      req.user.idUtilisateur,
      req.params.idStage,
      req.params.idEntree,
      req.body,
    );
    res.json({ entree });
  } catch (err) {
    next(err);
  }
}
