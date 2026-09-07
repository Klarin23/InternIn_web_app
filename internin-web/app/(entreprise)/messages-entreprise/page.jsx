"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  Send,
  MessageSquare,
  User,
  ArrowLeft,
  Check,
  CheckCheck,
  Briefcase,
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

function localeTag(locale) {
  return locale === "en" || locale === "en-GB" ? "en-GB" : "fr-FR";
}

function formatTime(dateStr, locale, t) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return d.toLocaleTimeString(localeTag(locale), {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      return t("messages.yesterday");
    }
    return d.toLocaleDateString(localeTag(locale), {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function formatMessageTime(dateStr, locale) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString(localeTag(locale), {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function dayLabelMeta(dateStr) {
  if (!dateStr) return { type: "empty" };
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    ) {
      return { type: "today" };
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      return { type: "yesterday" };
    }
    return { type: "date", date: d };
  } catch {
    return { type: "empty" };
  }
}

function formatDayLabel(meta, locale, t) {
  if (!meta || meta.type === "empty") return "";
  if (meta.type === "today") return t("messages.today");
  if (meta.type === "yesterday") return t("messages.yesterday");
  if (meta.date) {
    return meta.date.toLocaleDateString(localeTag(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return "";
}

function groupMessagesByDay(list) {
  if (!list?.length) return [];
  const groups = [];
  let currentKey = null;
  let currentItems = [];
  let currentMeta = null;
  for (const msg of list) {
    const meta = dayLabelMeta(msg.dateEnvoi);
    const d = msg.dateEnvoi ? new Date(msg.dateEnvoi) : null;
    const key =
      d && !Number.isNaN(d.getTime())
        ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        : "unknown";
    if (key !== currentKey) {
      if (currentItems.length) {
        groups.push({ key: currentKey, labelMeta: currentMeta, items: currentItems });
      }
      currentKey = key;
      currentMeta = meta;
      currentItems = [msg];
    } else {
      currentItems.push(msg);
    }
  }
  if (currentItems.length) {
    groups.push({ key: currentKey, labelMeta: currentMeta, items: currentItems });
  }
  return groups;
}

function formatDateRange(debut, fin, locale) {
  if (!debut) return null;
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const loc = localeTag(locale);
  const a = new Date(debut).toLocaleDateString(loc, opts);
  const b = fin ? new Date(fin).toLocaleDateString(loc, opts) : "—";
  return `${a} → ${b}`;
}

function stageStatusLabel(statut, t) {
  if (!statut) return "";
  const key = `messages.stageStatus.${statut}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return statut;
}

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
    </div>
  );
}

function ConversationItem({ conversation, active, onSelect }) {
  const { t, locale } = useTranslation();
  const hasUnread = (conversation.nonLus || 0) > 0;
  const name =
    [conversation.prenom, conversation.nom].filter(Boolean).join(" ") ||
    t("messages.intern");
  const preview =
    conversation.dernierMessage?.contenu?.slice(0, 60) ||
    t("messages.noMessageYet");
  const time = formatTime(
    conversation.dernierMessage?.dateEnvoi || conversation.dateCreation,
    locale,
    t,
  );
  const initiales =
    `${conversation.prenom?.[0] || ""}${conversation.nom?.[0] || ""}`.toUpperCase() ||
    "S";

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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xs font-bold text-primary">
        {conversation.photoProfilUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conversation.photoProfilUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initiales
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
            {name}
          </p>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              hasUnread ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {preview}
            {(conversation.dernierMessage?.contenu?.length || 0) > 60 ? "…" : ""}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {conversation.nonLus > 9 ? "9+" : conversation.nonLus}
            </span>
          )}
        </div>
        {conversation.statutStage && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {t("messages.stage")}{" "}
            {stageStatusLabel(conversation.statutStage, t)}
            {!conversation.messagerieActive
              ? ` · ${t("messages.readOnly")}`
              : ""}
          </p>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ message, isMine, reduceMotion }) {
  const { t, locale } = useTranslation();
  const time = formatMessageTime(message.dateEnvoi, locale);
  const isRead = message.statutLecture === "lu" || message.lu === true;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isMine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[75%]",
          isMine
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.contenu}
        </p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            isMine
              ? "justify-end text-primary-foreground/75"
              : "text-muted-foreground",
          )}
        >
          <span>{time}</span>
          {isMine ? (
            isRead ? (
              <CheckCheck
                className="h-3.5 w-3.5"
                aria-label={t("messages.read")}
              />
            ) : (
              <Check className="h-3.5 w-3.5" aria-label={t("messages.sent")} />
            )
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function Composer({ onSend, disabled }) {
  const { t } = useTranslation();
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
      /* toast handled by parent */
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
      <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        <label htmlFor="msg-input-entreprise" className="sr-only">
          {t("messages.writeMessage")}
        </label>
        <textarea
          id="msg-input-entreprise"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("messages.placeholder")}
          disabled={disabled || sending}
          maxLength={5000}
          className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <Button
          type="button"
          size="icon"
          disabled={!text.trim() || sending || disabled}
          onClick={handleSend}
          aria-label={t("messages.sendAria")}
          className="h-8 w-8 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {t("messages.keyboardHint")}
      </p>
    </div>
  );
}

function BlockedComposer({ conversation }) {
  const { t, locale } = useTranslation();
  const isEnded =
    conversation.statutStage === "termine" ||
    conversation.statutStage === "interrompu";

  return (
    <div className="border-t border-border bg-muted/40 px-4 py-6 text-center">
      <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground/50" />
      <p className="mt-2 text-sm font-medium text-foreground">
        {t("messages.messagingUnavailable")}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {isEnded
          ? t("messages.readonlyFinished")
          : t("messages.availableAtStart")}
      </p>
      {!isEnded && conversation.dateDebut && (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {t("messages.internshipStart")}{" "}
          {new Date(conversation.dateDebut).toLocaleDateString(
            localeTag(locale),
            { day: "numeric", month: "long", year: "numeric" },
          )}
        </p>
      )}
    </div>
  );
}

export default function MessagesEntreprisePage() {
  const { t, locale } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: conversations, isLoading: loadingConvos } = useConversations();
  const { data: unreadData } = useMessagesUnreadCount();
  const selected = useMemo(
    () =>
      conversations?.find((c) => c.idConversation === selectedId) || null,
    [conversations, selectedId],
  );

  const {
    data: messages,
    isLoading: loadingMessages,
  } = useMessages(selected?.idConversation);

  const sendMutation = useSendMessage(selected?.idConversation);
  const markRead = useMarkConversationRead();

  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);

  const filtered = useMemo(() => {
    const list = conversations || [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      const name = `${c.prenom || ""} ${c.nom || ""}`.toLowerCase();
      const last = (c.dernierMessage?.contenu || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, search]);

  useEffect(() => {
    if (selectedId && selected?.nonLus > 0) {
      markRead.mutate(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  function handleSelect(convo) {
    setSelectedId(convo.idConversation);
    setMobileShowChat(true);
  }

  async function handleSend(contenu) {
    if (!selected?.messagerieActive) {
      toast.error(t("messages.messagingUnavailableStage"));
      throw new Error("Stage non actif");
    }
    try {
      await sendMutation.mutateAsync(contenu);
    } catch (err) {
      toast.error(t("messages.sendError"));
      throw err;
    }
  }

  const unreadTotal = unreadData?.count ?? 0;
  const selectedName = selected
    ? [selected.prenom, selected.nom].filter(Boolean).join(" ") ||
      t("messages.intern")
    : "";
  const selectedInitiales = selected
    ? `${selected.prenom?.[0] || ""}${selected.nom?.[0] || ""}`.toUpperCase() ||
      "S"
    : "S";

  return (
    <>
      <AppHeader
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
        refreshKeys={["conversations", "messages", "messagesUnread"]}
      />

      {unreadTotal > 0 && (
        <div className="border-b border-border bg-primary/5 px-4 py-2 sm:px-6">
          <p className="text-xs font-medium text-primary">
            {t(
              unreadTotal > 1
                ? "messages.unreadOther"
                : "messages.unreadOne",
              { count: unreadTotal },
            )}
          </p>
        </div>
      )}

      <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden sm:h-[calc(100vh-9rem)]">
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
                placeholder={t("messages.searchPlaceholder")}
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvos && <ConversationSkeleton />}

            {!loadingConvos && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  {search.trim()
                    ? t("messages.emptySearch")
                    : t("messages.empty")}
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {search.trim()
                    ? t("messages.emptySearchHint")
                    : t("messages.emptyHint")}
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

        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col bg-background",
            mobileShowChat ? "flex" : "hidden lg:flex",
          )}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <User className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground">
                {t("messages.selectConversation")}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {t("messages.chooseConversation")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 border-b border-border bg-card px-3 py-3 sm:px-5">
                <button
                  type="button"
                  className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
                  onClick={() => setMobileShowChat(false)}
                  aria-label={t("messages.backToConversations")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xs font-bold text-primary">
                  {selected.photoProfilUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.photoProfilUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedInitiales
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {selectedName}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {t("messages.stage")}{" "}
                      {stageStatusLabel(selected.statutStage, t)}
                    </span>
                  </div>
                  {formatDateRange(
                    selected.dateDebut,
                    selected.dateFinPrevue,
                    locale,
                  ) && (
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateRange(
                        selected.dateDebut,
                        selected.dateFinPrevue,
                        locale,
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
                {loadingMessages && <MessagesSkeleton />}

                {!loadingMessages && (!messages || messages.length === 0) && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {selected.messagerieActive
                        ? t("messages.noMessageSendFirst")
                        : t("messages.noMessageInConversation")}
                    </p>
                  </div>
                )}

                {!loadingMessages &&
                  groups.map((group) => (
                    <div key={group.key} className="mb-4 space-y-2.5">
                      <div className="flex items-center justify-center py-2">
                        <span className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {formatDayLabel(group.labelMeta, locale, t)}
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
                <BlockedComposer conversation={selected} />
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
