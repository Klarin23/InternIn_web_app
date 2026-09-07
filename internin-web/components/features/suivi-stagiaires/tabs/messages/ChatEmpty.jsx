"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatEmpty({ canSend, onStart }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MessageSquare className="size-6" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">
        {t("suivi.msg.empty")}
      </p>
      <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
        {t("suivi.msg.emptyHint")}
      </p>
      {canSend ? (
        <Button
          type="button"
          size="sm"
          className="mt-5 rounded-lg"
          onClick={onStart}
        >
          {t("suivi.msg.firstMessage")}
        </Button>
      ) : null}
    </div>
  );
}
