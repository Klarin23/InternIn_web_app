"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { Check, CheckCheck } from "lucide-react";
import { formatMessageTime } from "./messageUtils";
import { cn } from "@/lib/utils";

export default function MessageBubble({ message, isMine }) {
  const { t, locale } = useTranslation();
  const time = formatMessageTime(message.dateEnvoi, locale);
  const isRead = message.statutLecture === "lu" || message.lu === true;

  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
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
            isMine ? "justify-end text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          <span>{time}</span>
          {isMine ? (
            isRead ? (
              <CheckCheck
                className="size-3.5"
                aria-label={t("suivi.msg.read")}
              />
            ) : (
              <Check className="size-3.5" aria-label={t("suivi.msg.sent")} />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
