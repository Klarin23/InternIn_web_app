"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
} from "@/lib/queries/useMessages";
import { toast } from "@/lib/store/useToastStore";
import { Button } from "@/components/ui/button";
import ChatHeader from "./messages/ChatHeader";
import ChatContext from "./messages/ChatContext";
import MessageBubble from "./messages/MessageBubble";
import ChatComposer from "./messages/ChatComposer";
import ChatSkeleton from "./messages/ChatSkeleton";
import ChatEmpty from "./messages/ChatEmpty";
import {
  groupMessagesByDay,
  formatDayLabel,
} from "./messages/messageUtils";

export default function MessagesTab({ stage }) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const myId = user?.idUtilisateur;
  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);

  const {
    data: conversations,
    isLoading: loadingConvos,
    isError: errorConvos,
    refetch: refetchConvos,
  } = useConversations();

  const conversation = useMemo(() => {
    if (!conversations || !stage?.idStage) return null;
    const matches = conversations.filter((c) => c.idStage === stage.idStage);
    if (!matches.length) return null;
    // Sécurité UX : si plusieurs (ne devrait pas arriver côté entreprise/superviseur),
    // préférer le type attendu selon le rôle.
    const role = user?.typeUtilisateur;
    if (role === "membre_entreprise") {
      return (
        matches.find((c) => c.typeConversation === "superviseur") ||
        matches[0]
      );
    }
    if (role === "entreprise") {
      return (
        matches.find((c) => c.typeConversation === "entreprise") ||
        matches[0]
      );
    }
    return matches[0];
  }, [conversations, stage, user?.typeUtilisateur]);

  const idConversation = conversation?.idConversation;

  const {
    data: messages,
    isLoading: loadingMessages,
    isError: errorMessages,
    refetch: refetchMessages,
  } = useMessages(idConversation);

  const sendMutation = useSendMessage(idConversation);
  const markRead = useMarkConversationRead();

  const groups = useMemo(
    () => groupMessagesByDay(Array.isArray(messages) ? messages : []),
    [messages],
  );

  const canSend =
    conversation?.messagerieActive === true || stage?.statut === "actif";
  const isReadOnly =
    conversation?.lectureSeule === true ||
    (!canSend &&
      (stage?.statut === "termine" || stage?.statut === "interrompu"));

  useEffect(() => {
    if (idConversation && conversation?.nonLus > 0) {
      markRead.mutate(idConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages?.length, reduceMotion]);

  const handleSend = useCallback(
    async (contenu) => {
      if (!idConversation) {
        toast.error(t("suivi.msg.notFound"));
        throw new Error("No conversation");
      }
      if (!canSend) {
        toast.error(t("suivi.msg.unavailable"));
        throw new Error("Stage non actif");
      }
      try {
        await sendMutation.mutateAsync(contenu);
      } catch (err) {
        toast.error(t("suivi.msg.sendError"));
        throw err;
      }
    },
    [idConversation, canSend, sendMutation, t],
  );

  if (loadingConvos) {
    return <ChatSkeleton />;
  }

  if (errorConvos) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          {t("suivi.msg.loadError")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("suivi.msg.checkConnection")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-lg"
          onClick={() => refetchConvos()}
        >
          {t("suivi.msg.retry")}
        </Button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
      >
        <ChatHeader stage={stage} />
        <ChatContext stage={stage} />
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("suivi.msg.notAvailable")}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
            {stage?.statut === "actif"
              ? `${t("suivi.msg.notInitialized")} ${t("suivi.msg.retrySoon")}`
              : `${t("suivi.msg.onlyWhenActive")} ${t("suivi.msg.historyHint")}`}
          </p>
          {stage?.statut === "actif" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => refetchConvos()}
            >
              {t("suivi.msg.refresh")}
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      className="flex max-h-[min(70vh,640px)] min-h-[360px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <ChatHeader stage={stage} />
      <ChatContext stage={stage} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loadingMessages ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex justify-start">
              <div className="h-12 w-48 animate-pulse rounded-2xl bg-muted/70" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-36 animate-pulse rounded-2xl bg-muted/70" />
            </div>
          </div>
        ) : errorMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              {t("suivi.msg.loadError")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-lg"
              onClick={() => refetchMessages()}
            >
              {t("suivi.msg.retry")}
            </Button>
          </div>
        ) : !messages?.length ? (
          <ChatEmpty
            canSend={canSend}
            onStart={() => composerRef.current?.focus()}
          />
        ) : (
          <div
            className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4"
            role="log"
            aria-live="polite"
            aria-label={t("suivi.msg.ariaList")}
          >
            {groups.map((group) => (
              <div key={group.key} className="space-y-2.5">
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatDayLabel(group.labelMeta, locale, t)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {group.items.map((msg) => (
                  <MessageBubble
                    key={msg.idMessage}
                    message={msg}
                    isMine={msg.idExpediteur === myId}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatComposer
        ref={composerRef}
        onSend={handleSend}
        disabled={sendMutation.isPending}
        blocked={!canSend}
        blockedReason={
          isReadOnly
            ? `${t("suivi.msg.stageEnded")} ${t("suivi.msg.readOnly")}`
            : t("suivi.msg.sendOnlyActive")
        }
      />
    </motion.div>
  );
}
