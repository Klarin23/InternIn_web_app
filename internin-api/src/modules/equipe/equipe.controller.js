import {
  listMembres,
  inviterMembre,
  renvoyerInvitation,
  annulerInvitation,
  updateMembre,
  updateStatutMembre,
  listAffectations,
  affecterSuperviseur,
  retirerAffectation,
  listActivites,
  getParametresEquipe,
  updateParametresEquipe,
  getInvitationParToken,
  accepterInvitation,
  getMonProfil,
} from "./equipe.service.js";
import {
  PERMISSIONS_DISPONIBLES,
  ROLES_EQUIPE,
  PERMISSIONS_PAR_DEFAUT_ROLE,
} from "./equipe.constants.js";

export async function getMembres(req, res, next) {
  try {
    const { recherche, role, statut } = req.query;
    const membres = await listMembres(req.user.idUtilisateur, {
      recherche,
      role,
      statut,
    });
    res.json(membres);
  } catch (err) {
    next(err);
  }
}

export async function getCatalogue(req, res, next) {
  try {
    res.json({
      permissions: PERMISSIONS_DISPONIBLES,
      roles: ROLES_EQUIPE,
      permissionsParDefautRole: PERMISSIONS_PAR_DEFAUT_ROLE,
    });
  } catch (err) {
    next(err);
  }
}

export async function postInviterMembre(req, res, next) {
  try {
    const membre = await inviterMembre(req.user.idUtilisateur, req.body);
    res.status(201).json({ membre });
  } catch (err) {
    next(err);
  }
}

export async function postRenvoyerInvitation(req, res, next) {
  try {
    const membre = await renvoyerInvitation(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json({ membre });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvitation(req, res, next) {
  try {
    res.json(await annulerInvitation(req.user.idUtilisateur, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function patchMembre(req, res, next) {
  try {
    const membre = await updateMembre(
      req.user.idUtilisateur,
      req.params.id,
      req.body,
    );
    res.json({ membre });
  } catch (err) {
    next(err);
  }
}

export async function patchStatutMembre(req, res, next) {
  try {
    const membre = await updateStatutMembre(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statutMembre,
    );
    res.json({ membre });
  } catch (err) {
    next(err);
  }
}

export async function getAffectations(req, res, next) {
  try {
    res.json(await listAffectations(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function postAffectation(req, res, next) {
  try {
    const affectation = await affecterSuperviseur(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ affectation });
  } catch (err) {
    next(err);
  }
}

export async function deleteAffectation(req, res, next) {
  try {
    res.json(
      await retirerAffectation(req.user.idUtilisateur, req.params.idStage),
    );
  } catch (err) {
    next(err);
  }
}

export async function getActivites(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    res.json(await listActivites(req.user.idUtilisateur, { limit }));
  } catch (err) {
    next(err);
  }
}

export async function getParametres(req, res, next) {
  try {
    res.json(await getParametresEquipe(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function patchParametres(req, res, next) {
  try {
    const parametres = await updateParametresEquipe(
      req.user.idUtilisateur,
      req.body,
    );
    res.json({ parametres });
  } catch (err) {
    next(err);
  }
}

export async function getInvitation(req, res, next) {
  try {
    res.json(await getInvitationParToken(req.params.token));
  } catch (err) {
    next(err);
  }
}

export async function postAccepterInvitation(req, res, next) {
  try {
    const result = await accepterInvitation(
      req.params.token,
      req.body.motDePasse,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMoi(req, res, next) {
  try {
    res.json(await getMonProfil(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}
