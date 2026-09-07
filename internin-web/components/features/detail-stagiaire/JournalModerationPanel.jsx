"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  FiCheck,
  FiX,
  FiFlag,
  FiLoader,
  FiInbox,
  FiBookOpen,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModererEntreeJournal } from "@/lib/queries/useSuperviseur";
import { cn } from "@/lib/utils";

const STATUT_LABEL_KEYS = {
  en_attente: "mesStagiaires.journal.pending",
  validee: "mesStagiaires.journal.validated",
  correction_demandee: "mesStagiaires.journal.correctionRequested",
  terminee: "mesStagiaires.journal.completed",
};

const STATUT_COLORS = {
  en_attente:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  validee:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  correction_demandee: "bg-destructive/10 text-destructive",
  terminee: "bg-primary/10 text-primary",
};

const FILTER_DEFS = [
  { id: "toutes", labelKey: "mesStagiaires.journal.filterAll" },
  { id: "en_attente", labelKey: "mesStagiaires.journal.pending" },
  { id: "validee", labelKey: "mesStagiaires.journal.validatedPlural" },
  { id: "correction_demandee", labelKey: "mesStagiaires.journal.corrections" },
  { id: "terminee", labelKey: "mesStagiaires.journal.completedPlural" },
];

function formatDay(dateStr, locale = "fr") {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LigneEntree({ idStage, entree, index }) {
  const { t, locale } = useTranslation();
  const [commentaire, setCommentaire] = useState("");
  const [zoneCommentaireOuverte, setZoneCommentaireOuverte] = useState(false);
  const moderer = useModererEntreeJournal(idStage);
  const reduceMotion = useReducedMotion();

  function handleAction(statutValidation) {
    if (moderer.isPending) return;
    moderer.mutate({
      idEntree: entree.idEntree,
      payload: {
        statutValidation,
        commentaireSuperviseur: commentaire.trim() || undefined,
      },
    });
  }

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.2),
      }}
      className="relative pl-6"
    >
      <span
        className="absolute top-2 left-0 size-2.5 rounded-full bg-primary ring-4 ring-card"
        aria-hidden
      />
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-border">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {entree.titre || entree.activite || t("mesStagiaires.journal.activity")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDay(entree.dateActivite || entree.dateCreation, locale)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              STATUT_COLORS[entree.statutValidation] ||
                "bg-muted text-muted-foreground",
            )}
          >
            {(STATUT_LABEL_KEYS[entree.statutValidation] ? t(STATUT_LABEL_KEYS[entree.statutValidation]) : t("mesStagiaires.journal.unknownStatus"))}
          </span>
        </div>

        {entree.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {entree.description}
          </p>
        )}

        {entree.commentaireSuperviseur && (
          <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-xs text-foreground">
            <span className="font-semibold">{t("mesStagiaires.journal.commentLabel")} </span>
            {entree.commentaireSuperviseur}
          </div>
        )}

        {zoneCommentaireOuverte && (
          <Textarea
            className="mt-3 min-h-[72px] rounded-xl text-sm"
            placeholder={t("mesStagiaires.journal.commentPlaceholder")}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {entree.statutValidation !== "validee" && (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              disabled={moderer.isPending}
              onClick={() => handleAction("validee")}
            >
              {moderer.isPending ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FiCheck className="h-3.5 w-3.5" />
              )}
              Valider
            </Button>
          )}
          {entree.statutValidation !== "terminee" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              disabled={moderer.isPending}
              onClick={() => handleAction("terminee")}
            >
              <FiFlag className="h-3.5 w-3.5" />
              {t("mesStagiaires.journal.markDone")}
            </Button>
          )}
          {entree.statutValidation !== "correction_demandee" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-destructive hover:text-destructive"
              disabled={moderer.isPending}
              onClick={() => {
                if (!zoneCommentaireOuverte) {
                  setZoneCommentaireOuverte(true);
                  return;
                }
                handleAction("correction_demandee");
              }}
            >
              <FiX className="h-3.5 w-3.5" />
              {t("mesStagiaires.journal.requestCorrection")}
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function JournalModerationPanel({ idStage, entrees }) {
  const { t, locale } = useTranslation();
  const FILTERS = useMemo(
    () => FILTER_DEFS.map((f) => ({ id: f.id, label: t(f.labelKey) })),
    [t],
  );
  const [filter, setFilter] = useState("toutes");
  const list = useMemo(
    () => (Array.isArray(entrees) ? entrees : []),
    [entrees],
  );

  const counts = useMemo(() => {
    const c = {
      toutes: list.length,
      en_attente: 0,
      validee: 0,
      correction_demandee: 0,
      terminee: 0,
    };
    for (const e of list) {
      if (c[e.statutValidation] != null) c[e.statutValidation] += 1;
    }
    return c;
  }, [list]);

  const filtered =
    filter === "toutes"
      ? list
      : list.filter((e) => e.statutValidation === filter);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FiBookOpen className="size-7" strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          {t("mesStagiaires.journal.emptyTitle")}
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {t("mesStagiaires.journal.emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("mesStagiaires.journal.activities"), value: counts.toutes },
          { label: t("mesStagiaires.journal.validatedPlural"), value: counts.validee },
          { label: t("mesStagiaires.journal.pending"), value: counts.en_attente },
          {
            label: t("mesStagiaires.journal.corrections"),
            value: counts.correction_demandee,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = counts[f.id];
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/60",
              )}
            >
              {f.label}
              {typeof n === "number" ? ` ${n}` : ""}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t("mesStagiaires.journal.emptyFilter")}
        </div>
      ) : (
        <div className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[4px] before:w-px before:bg-border/80">
          {filtered.map((e, i) => (
            <LigneEntree
              key={e.idEntree}
              idStage={idStage}
              entree={e}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
