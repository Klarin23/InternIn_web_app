import {
  listConversations,
  listMessages,
  envoyerMessage,
  marquerCommeLus,
  compterNonLus,
} from "./messages.service.js";

export async function listConversationsCtrl(req, res, next) {
  try {
    res.json(
      await listConversations(req.user.idUtilisateur, req.user.typeUtilisateur),
    );
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req, res, next) {
  try {
    res.json(
      await listMessages(
        req.user.idUtilisateur,
        req.user.typeUtilisateur,
        req.params.idConversation,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const msg = await envoyerMessage(
      req.user.idUtilisateur,
      req.user.typeUtilisateur,
      req.params.idConversation,
      req.body?.contenu,
    );
    res.status(201).json({ message: msg });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    res.json(
      await marquerCommeLus(
        req.user.idUtilisateur,
        req.user.typeUtilisateur,
        req.params.idConversation,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function unreadCount(req, res, next) {
  try {
    res.json(
      await compterNonLus(req.user.idUtilisateur, req.user.typeUtilisateur),
    );
  } catch (err) {
    next(err);
  }
}
