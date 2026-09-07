"use client";

import {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatComposer = forwardRef(function ChatComposer(
  { onSend, disabled, blocked, blockedReason },
  ref,
) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || sending || disabled) return;
    setSending(true);
    setSendError(null);
    try {
      await onSend(value);
      setText("");
      textareaRef.current?.focus();
    } catch {
      setSendError(t("suivi.msg.sendError"));
    } finally {
      setSending(false);
    }
  }, [text, sending, disabled, onSend, t]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (blocked) {
    return (
      <div className="border-t border-border bg-muted/40 px-4 py-5 text-center">
        <MessageSquare className="mx-auto size-5 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium text-foreground">
          {t("suivi.msg.messagingUnavailable")}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          {blockedReason || t("suivi.msg.sendOnlyActive")}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      {sendError && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <span>{sendError}</span>
          <button
            type="button"
            className="font-semibold underline-offset-2 hover:underline"
            onClick={handleSend}
          >
            {t("suivi.msg.retry")}
          </button>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        <label htmlFor="stagiaire-msg-input" className="sr-only">
          {t("suivi.msg.writeLabel")}
        </label>
        <textarea
          id="stagiaire-msg-input"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSendError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("suivi.msg.write")}
          disabled={disabled || sending}
          maxLength={5000}
          className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <Button
          type="button"
          size="icon"
          disabled={!text.trim() || sending || disabled}
          onClick={handleSend}
          aria-label={t("suivi.msg.sendAria")}
          className="size-8 shrink-0 rounded-lg transition-transform active:scale-[0.96]"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {t("suivi.msg.hintKeys")}
      </p>
    </div>
  );
});

export default ChatComposer;
