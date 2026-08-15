"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Send,
  MessageSquare,
  Building2,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useMessagesUnreadCount,
} from "@/lib/queries/useMessages";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Hier";
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function dayLabel(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) return "Aujourd'hui";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Hier";
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function groupMessagesByDay(messages) {
  if (!messages?.length) return [];
  const groups = [];
  let currentLabel = null;
  let currentItems = [];
  for (const msg of messages) {
    const label = dayLabel(msg.dateEnvoi);
    if (label !== currentLabel) {
      if (currentItems.length) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [msg];
    } else {
      currentItems.push(msg);
    }
  }
  if (currentItems.length) {
    groups.push({ label: currentLabel, items: currentItems });
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-md p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex justify-start">
        <Skeleton className="h-12 w-48 rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-56 rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-2xl rounded-br-md" />
      </div>
    </div>
  );
}

function ConversationItem({ conversation, active, onSelect }) {
  const hasUnread = (conversation.nonLus || 0) > 0;
  const preview =
    conversation.dernierMessage?.contenu?.slice(0, 60) ||
    "Aucun message pour le moment";
  const time = formatTime(
    conversation.dernierMessage?.dateEnvoi || conversation.dateCreation,
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors",
        active
          ? "bg-primary/10"
          : hasUnread
            ? "bg-muted/50 hover:bg-muted"
            : "hover:bg-muted/60",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
        {conversation.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conversation.logoUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <Building2 className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              hasUnread
                ? "font-semibold text-foreground"
                : "font-medium text-foreground",
            )}
          >
            {conversation.nomEntreprise}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              hasUnread
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {preview}
            {conversation.dernierMessage?.contenu?.length > 60 ? "…" : ""}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {conversation.nonLus > 9 ? "9+" : conversation.nonLus}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, isMine, reduceMotion }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex", isMine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[65%]",
          isMine
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-card text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          <span>{formatMessageTime(message.dateEnvoi)}</span>
          {isMine &&
            (message.statutLecture === "lu" ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </motion.div>
  );
}

function Composer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || sending || disabled) return;
    setSending(true);
    try {
      await onSend(value);
      setText("");
      textareaRef.current?.focus();
    } catch {
      // parent shows toast
    } finally {
      setSending(false);
    }
  }, [text, sending, disabled, onSend]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      <div className="flex items-end gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
        <label htmlFor="message-input" className="sr-only">
          Écrire un message
        </label>
        <textarea
          id="message-input"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          disabled={disabled || sending}
          className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          style={{ fieldSizing: "content" }}
        />
        <Button
          type="button"
          size="icon"
          disabled={!text.trim() || sending || disabled}
          onClick={handleSend}
          aria-label="Envoyer le message"
          className="h-8 w-8 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: conversations, isLoading: loadingConvos } = useConversations();
  const { data: unreadData } = useMessagesUnreadCount();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedId);
  const sendMutation = useSendMessage(selectedId);
  const markRead = useMarkConversationRead();

  const selected = useMemo(
    () => conversations?.find((c) => c.idConversation === selectedId) || null,
    [conversations, selectedId],
  );

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.nomEntreprise?.toLowerCase().includes(q) ||
        c.dernierMessage?.contenu?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);

  // Mark as read when opening
  useEffect(() => {
    if (selectedId && selected?.nonLus > 0) {
      markRead.mutate(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  function handleSelect(convo) {
    setSelectedId(convo.idConversation);
    setMobileShowChat(true);
  }

  function handleBack() {
    setMobileShowChat(false);
  }

  async function handleSend(contenu) {
    try {
      await sendMutation.mutateAsync(contenu);
    } catch (err) {
      toast.error(err?.message || "Impossible d'envoyer le message.");
      throw err;
    }
  }

  const unreadTotal = unreadData?.count ?? 0;

  return (
    <>
      <AppHeader
        title="Messages"
        subtitle="Échangez avec les entreprises et les personnes qui vous accompagnent dans votre stage."
        refreshKeys={["conversations", "messages", "messagesUnread"]}
      />

      {unreadTotal > 0 && (
        <div className="border-b border-border bg-primary/5 px-4 py-2 sm:px-6">
          <p className="text-xs font-medium text-primary">
            {unreadTotal} message{unreadTotal > 1 ? "s" : ""} non lu
            {unreadTotal > 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden sm:h-[calc(100vh-9rem)]">
        {/* Sidebar conversations */}
        <aside
          className={cn(
            "flex w-full flex-col border-r border-border bg-card lg:w-80 xl:w-96",
            mobileShowChat ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvos && <ConversationSkeleton />}

            {!loadingConvos && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  {search
                    ? "Aucune conversation trouvée"
                    : "Aucune conversation"}
                </p>
                <p className="max-w-[240px] text-xs text-muted-foreground">
                  {search
                    ? "Essayez avec un autre nom ou mot-clé."
                    : "Vos échanges avec les entreprises apparaîtront ici une fois un stage démarré."}
                </p>
              </div>
            )}

            {!loadingConvos &&
              filtered.map((c) => (
                <ConversationItem
                  key={c.idConversation}
                  conversation={c}
                  active={c.idConversation === selectedId}
                  onSelect={handleSelect}
                />
              ))}
          </div>
        </aside>

        {/* Chat panel */}
        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col bg-muted/20",
            !mobileShowChat ? "hidden lg:flex" : "flex",
          )}
        >
          {!selectedId && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Sélectionnez une conversation
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Choisissez une conversation pour consulter vos échanges.
              </p>
            </div>
          )}

          {selectedId && selected && (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted lg:hidden"
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                  {selected.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.logoUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {selected.nomEntreprise}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Stage · {selected.secteurActivite || "Entreprise"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
                {loadingMessages && <MessagesSkeleton />}

                {!loadingMessages && (!messages || messages.length === 0) && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      Aucun message pour le moment. Envoyez le premier !
                    </p>
                  </div>
                )}

                {!loadingMessages &&
                  groups.map((group) => (
                    <div key={group.label} className="mb-4 space-y-2.5">
                      <div className="flex items-center justify-center py-2">
                        <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((msg) => (
                        <MessageBubble
                          key={msg.idMessage}
                          message={msg}
                          isMine={msg.idExpediteur === user?.idUtilisateur}
                          reduceMotion={reduceMotion}
                        />
                      ))}
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              {selected.messagerieActive ? (
                <Composer
                  onSend={handleSend}
                  disabled={sendMutation.isPending}
                />
              ) : (
                <div className="border-t border-border bg-muted/40 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Messagerie indisponible
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.statutStage === "termine" || selected.statutStage === "interrompu"
                      ? "Ce stage est terminé. La conversation est en lecture seule."
                      : "Les échanges seront disponibles dès le début officiel du stage."}
                  </p>
                  {selected.dateDebut && selected.statutStage !== "termine" && selected.statutStage !== "interrompu" && (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                      Début du stage :{" "}
                      {new Date(selected.dateDebut).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
