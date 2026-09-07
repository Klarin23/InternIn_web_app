"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PropositionsEmpty({ onRefresh }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/60">
        <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {t("stagiaireSpace.propositions.emptyTitle")}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {t("stagiaireSpace.propositions.emptyDesc")}
      </p>
      {onRefresh && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={onRefresh}
        >
          {t("stagiaireSpace.propositions.refresh")}
        </Button>
      )}
    </div>
  );
}
