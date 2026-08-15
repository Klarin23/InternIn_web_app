import { Router } from "express";
import {
  listConversationsCtrl,
  getMessages,
  postMessage,
  markRead,
  unreadCount,
} from "./messages.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";

const router = Router();

router.get(
  "/conversations",
  requireAuth,
  requireActiveAccount,
  listConversationsCtrl,
);
router.get("/non-lus/compte", requireAuth, requireActiveAccount, unreadCount);
router.get(
  "/conversations/:idConversation/messages",
  requireAuth,
  requireActiveAccount,
  getMessages,
);
router.post(
  "/conversations/:idConversation/messages",
  requireAuth,
  requireActiveAccount,
  postMessage,
);
router.patch(
  "/conversations/:idConversation/lues",
  requireAuth,
  requireActiveAccount,
  markRead,
);

export default router;
