"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { FileText, ExternalLink, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/store/useToastStore";
import { openProtectedCv } from "@/lib/utils/openProtectedDocument";

export function TalentCvCard({ cvUrl, idStagiaire, className }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  if (!cvUrl) return null;

  async function handle(action) {
    if (loading) return;
    setLoading(true);
    try {
      await openProtectedCv(cvUrl, { download: action === "download", idStagiaire });
    } catch (err) {
      toast.error(err?.message || t("talents.cv.openError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.04] to-transparent",
        className,
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t("talents.cv.title")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t("talents.cv.desc")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5 rounded-lg"
              disabled={loading}
              onClick={() => handle("view")}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <ExternalLink className="size-3.5" aria-hidden />
              )}
              {t("talents.cv.viewFull")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-lg"
              disabled={loading}
              onClick={() => handle("download")}
            >
              <Download className="size-3.5" aria-hidden />
              {t("talents.cv.download")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TalentCvButton({ cvUrl, idStagiaire, className }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  if (!cvUrl) return null;

  async function handle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await openProtectedCv(cvUrl, { download: false, idStagiaire });
    } catch (err) {
      toast.error(err?.message || t("talents.cv.openError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
      disabled={loading}
      onClick={handle}
      aria-label={t("talents.cv.viewFull")}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <FileText className="size-3.5" aria-hidden />
      )}
      CV
    </Button>
  );
}
