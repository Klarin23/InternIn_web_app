import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConversationsRequest,
  listMessagesRequest,
  sendMessageRequest,
  markConversationReadRequest,
  unreadMessagesCountRequest,
} from "@/lib/api/messages";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useConversations() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversationsRequest(token),
    enabled: !!token,
  });
}

export function useMessages(idConversation) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["messages", idConversation],
    queryFn: () => listMessagesRequest(idConversation, token),
    enabled: !!token && !!idConversation,
  });
}

export function useSendMessage(idConversation) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contenu) =>
      sendMessageRequest(idConversation, contenu, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", idConversation] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messagesUnread"] });
    },
  });
}

export function useMarkConversationRead() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idConversation) =>
      markConversationReadRequest(idConversation, token),
    onSuccess: (_, idConversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", idConversation] });
      queryClient.invalidateQueries({ queryKey: ["messagesUnread"] });
    },
  });
}

export function useMessagesUnreadCount() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["messagesUnread"],
    queryFn: () => unreadMessagesCountRequest(token),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}
