import { apiFetch } from "./client";

export function listConversationsRequest(token) {
  return apiFetch("/messages/conversations", { token });
}

export function listMessagesRequest(idConversation, token) {
  return apiFetch(`/messages/conversations/${idConversation}/messages`, {
    token,
  });
}

export function sendMessageRequest(idConversation, contenu, token) {
  return apiFetch(`/messages/conversations/${idConversation}/messages`, {
    method: "POST",
    body: { contenu },
    token,
  });
}

export function markConversationReadRequest(idConversation, token) {
  return apiFetch(`/messages/conversations/${idConversation}/lues`, {
    method: "PATCH",
    token,
  });
}

export function unreadMessagesCountRequest(token) {
  return apiFetch("/messages/non-lus/compte", { token });
}
