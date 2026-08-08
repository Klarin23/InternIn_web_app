import {
  listEntreprisesDecouvrir,
  envoyerInvitation,
  listInvitationsRecues,
  repondreInvitation,
  listUniversitesPartenaires,
  listInvitationsEnvoyees,
} from "./partenariats.service.js";

export async function decouvrirEntreprises(req, res, next) {
  try {
    res.json(
      await listEntreprisesDecouvrir(
        req.user.idUtilisateur,
        req.query.recherche,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function inviter(req, res, next) {
  try {
    const partenariat = await envoyerInvitation(
      req.user.idUtilisateur,
      req.body.idEntreprise,
      req.body.message,
    );
    res.status(201).json({ partenariat });
  } catch (err) {
    next(err);
  }
}

export async function invitationsEnvoyees(req, res, next) {
  try {
    res.json(await listInvitationsEnvoyees(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function invitationsRecues(req, res, next) {
  try {
    res.json(await listInvitationsRecues(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function repondre(req, res, next) {
  try {
    const partenariat = await repondreInvitation(
      req.user.idUtilisateur,
      req.params.id,
      req.body.accepter,
    );
    res.json({ partenariat });
  } catch (err) {
    next(err);
  }
}

export async function universitesPartenaires(req, res, next) {
  try {
    res.json(await listUniversitesPartenaires(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}
