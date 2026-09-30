import {
  accepterInvitationEtudiant,
  refuserInvitationEtudiant,
  getInvitationPublique,
  creerInvitationEtudiant,
  listerDemandesUniversite,
  confirmerDemandeUniversite,
  refuserDemandeUniversite,
  demanderRattachementParCode,
  demanderRattachementParLien,
  creerCodeUniversite,
  getCodeUniversite,
  creerLienUniversite,
  getRattachementEtudiant,
  annulerInvitationEtudiant,
  revoquerCodeUniversite,
  revoquerLienUniversite,
} from "./rattachementsUniversite.service.js";

export async function creerInvitation(req, res, next) {
  try {
    res.status(201).json(
      await creerInvitationEtudiant(req.user.idUtilisateur, req.body.email),
    );
  } catch (err) {
    next(err);
  }
}

export async function previewInvitation(req, res, next) {
  try {
    res.json(await getInvitationPublique(req.params.token));
  } catch (err) {
    next(err);
  }
}

export async function accepterInvitation(req, res, next) {
  try {
    res.json(
      await accepterInvitationEtudiant(
        req.user.idUtilisateur,
        req.params.token,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function refuserInvitation(req, res, next) {
  try {
    res.json(
      await refuserInvitationEtudiant(
        req.user.idUtilisateur,
        req.params.token,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function demandesUniversite(req, res, next) {
  try {
    res.json(await listerDemandesUniversite(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function confirmerDemande(req, res, next) {
  try {
    res.json(
      await confirmerDemandeUniversite(
        req.user.idUtilisateur,
        req.params.id,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function refuserDemande(req, res, next) {
  try {
    res.json(
      await refuserDemandeUniversite(
        req.user.idUtilisateur,
        req.params.id,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function rejoindreParCode(req, res, next) {
  try {
    res.json(
      await demanderRattachementParCode(
        req.user.idUtilisateur,
        req.body.code,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function rejoindreParLien(req, res, next) {
  try {
    res.json(
      await demanderRattachementParLien(
        req.user.idUtilisateur,
        req.params.token,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function creerCode(req, res, next) {
  try {
    res.status(201).json(
      await creerCodeUniversite(req.user.idUtilisateur),
    );
  } catch (err) {
    next(err);
  }
}

export async function getCode(req, res, next) {
  try {
    res.json(await getCodeUniversite(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function creerLien(req, res, next) {
  try {
    res.status(201).json(
      await creerLienUniversite(req.user.idUtilisateur),
    );
  } catch (err) {
    next(err);
  }
}

export async function getRattachement(req, res, next) {
  try {
    res.json(await getRattachementEtudiant(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}


export async function annulerInvitation(req, res, next) {
  try {
    res.json(
      await annulerInvitationEtudiant(
        req.user.idUtilisateur,
        req.params.id,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function revoquerCode(req, res, next) {
  try {
    res.json(await revoquerCodeUniversite(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function revoquerLien(req, res, next) {
  try {
    res.json(await revoquerLienUniversite(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}
