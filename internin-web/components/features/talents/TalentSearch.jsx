"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function TalentSearch({ value, onChange, isSearching }) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        placeholder={t("talents.search.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 rounded-xl border-border/80 bg-card pl-10 pr-10 shadow-sm",
          "transition-[box-shadow,border-color] duration-200",
          "focus-visible:border-primary/40 focus-visible:shadow-md focus-visible:ring-primary/20",
        )}
        aria-label={t("talents.search.label")}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <Loader2
            className="size-4 animate-spin text-muted-foreground"
            aria-label={t("talents.search.loading")}
          />
        ) : value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={t("talents.search.clear")}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
