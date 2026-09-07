"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { UsersRound, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TalentEmptyState({ hasSearch, onClear }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {hasSearch ? (
          <SearchX className="size-7" strokeWidth={1.5} aria-hidden />
        ) : (
          <UsersRound className="size-7" strokeWidth={1.5} aria-hidden />
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {hasSearch
          ? t("talents.empty.noResultsTitle")
          : t("talents.empty.noTalentsTitle")}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {hasSearch
          ? t("talents.empty.noResultsDesc")
          : t("talents.empty.noTalentsDesc")}
      </p>
      {hasSearch && onClear && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5 rounded-lg"
          onClick={onClear}
        >
          {t("talents.empty.clearSearch")}
        </Button>
      )}
    </div>
  );
}
