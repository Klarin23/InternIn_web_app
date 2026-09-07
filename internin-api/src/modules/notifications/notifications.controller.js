import {
  listNotifications,
  compterNonLues,
  marquerCommeLue,
  marquerToutesCommeLues,
  supprimerNotification,
  supprimerToutesNotifications,
  listNotificationsAdmin,
  getNotificationsAdminStats,
  getEntrepriseNotifPrefs,
  updateEntrepriseNotifPrefs,
} from "./notifications.service.js";
import { resolveEntrepriseContext } from "../../utils/entrepriseContext.js";


export async function lister(req, res, next) {
  try {
    res.json(await listNotifications(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function compter(req, res, next) {
  try {
    res.json({ nonLues: await compterNonLues(req.user.idUtilisateur) });
  } catch (err) {
    next(err);
  }
}

export async function marquerLue(req, res, next) {
  try {
    res.json(await marquerCommeLue(req.user.idUtilisateur, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function marquerTouteslues(req, res, next) {
  try {
    await marquerToutesCommeLues(req.user.idUtilisateur);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function supprimer(req, res, next) {
  try {
    await supprimerNotification(req.user.idUtilisateur, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function supprimerToutes(req, res, next) {
  try {
    await supprimerToutesNotifications(req.user.idUtilisateur);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}


export async function listNotificationsAdminHandler(req, res, next) {
  try {
    res.json(
      await listNotificationsAdmin(req.user.idUtilisateur, {
        recherche: req.query.recherche,
        statut: req.query.statut,
        priorite: req.query.priorite,
        categorie: req.query.categorie,
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getNotificationsAdminStatsHandler(req, res, next) {
  try {
    res.json(await getNotificationsAdminStats(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}


/**
 * GET /notifications/preferences
 * Préférences de l'entreprise authentifiée (propriétaire ou membre).
 * idEntreprise dérivé de la session — jamais du client.
 */
export async function getPreferencesEntreprise(req, res, next) {
  try {
    const ctx = await resolveEntrepriseContext(req.user.idUtilisateur);
    if (!ctx?.entreprise?.idEntreprise) {
      return res.status(403).json({
        error: "Accès réservé aux comptes entreprise",
      });
    }
    const prefs = await getEntrepriseNotifPrefs(ctx.entreprise.idEntreprise);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/preferences
 */
export async function patchPreferencesEntreprise(req, res, next) {
  try {
    const ctx = await resolveEntrepriseContext(req.user.idUtilisateur);
    if (!ctx?.entreprise?.idEntreprise) {
      return res.status(403).json({
        error: "Accès réservé aux comptes entreprise",
      });
    }
    const prefs = await updateEntrepriseNotifPrefs(
      ctx.entreprise.idEntreprise,
      req.body,
    );
    res.json(prefs);
  } catch (err) {
    next(err);
  }
}
