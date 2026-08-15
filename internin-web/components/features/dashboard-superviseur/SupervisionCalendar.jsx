"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClipboard,
  FiBookOpen,
  FiFlag,
  FiLoader,
} from "react-icons/fi";
import { useCalendrierSupervision } from "@/lib/queries/useSuperviseur";
import { cn } from "@/lib/utils";

const FILTRES = [
  { id: "tous", label: "Tous" },
  { id: "evaluation", label: "Évaluations" },
  { id: "journal", label: "Journal" },
  { id: "fin_stage", label: "Fin de stage" },
  { id: "debut_stage", label: "Début de stage" },
];

const TYPE_META = {
  evaluation: {
    label: "Évaluation",
    color: "bg-primary text-primary-foreground",
    dot: "bg-primary",
    icon: FiClipboard,
  },
  journal: {
    label: "Journal",
    color: "bg-amber-500 text-white",
    dot: "bg-amber-500",
    icon: FiBookOpen,
  },
  fin_stage: {
    label: "Fin de stage",
    color: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
    icon: FiFlag,
  },
  debut_stage: {
    label: "Début de stage",
    color: "bg-sky-600 text-white",
    dot: "bg-sky-500",
    icon: FiFlag,
  },
};

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfMonthGrid(year, month) {
  // month 1-12, Monday-first grid
  const first = new Date(year, month - 1, 1);
  let day = first.getDay(); // 0 Sun
  day = day === 0 ? 6 : day - 1;
  const start = new Date(first);
  start.setDate(first.getDate() - day);
  return start;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Clé jour stable (évite les décalages UTC qui cachent les points). */
function dayKey(input) {
  if (!input) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.slice(0, 10)) && input.length <= 10) {
    const [yy, mm, dd] = input.split("-").map(Number);
    return `${yy}-${mm - 1}-${dd}`;
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatMonthTitle(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export default function SupervisionCalendar({ embedded = false }) {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [filtre, setFiltre] = useState("tous");
  const [selected, setSelected] = useState(null);
  const reduceMotion = useReducedMotion();

  const { data, isLoading, isError } = useCalendrierSupervision({ annee, mois });
  const evenements = data?.evenements || [];

  const filtered = useMemo(() => {
    if (filtre === "tous") return evenements;
    return evenements.filter((e) => e.type === filtre);
  }, [evenements, filtre]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const key = dayKey(e.date);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return map;
  }, [filtered]);

  function prevMonth() {
    if (mois === 1) {
      setMois(12);
      setAnnee((y) => y - 1);
    } else setMois((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (mois === 12) {
      setMois(1);
      setAnnee((y) => y + 1);
    } else setMois((m) => m + 1);
    setSelected(null);
  }
  function goToday() {
    setAnnee(now.getFullYear());
    setMois(now.getMonth() + 1);
    setSelected(null);
  }

  const gridStart = startOfMonthGrid(annee, mois);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const agendaMobile = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filtered]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_6px_20px_-10px_rgba(17,24,39,0.10)]",
        !embedded && "min-h-[420px]",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FiCalendar className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold capitalize text-foreground">
              {formatMonthTitle(annee, mois)}
            </h3>
            <p className="text-xs text-muted-foreground">
              Calendrier de supervision
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Mois précédent"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Mois suivant"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="overflow-x-auto border-b border-border/50 px-4 py-2.5">
        <div
          className="inline-flex min-w-min gap-1 rounded-xl border border-border bg-muted/40 p-1"
          role="tablist"
          aria-label="Filtrer le calendrier"
        >
          {FILTRES.map((f) => {
            const actif = filtre === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => setFiltre(f.id)}
                className={
                  "relative z-0 shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors " +
                  (actif
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {actif && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : "filtre-pill-calendrier"}
                    className="absolute inset-0 -z-10 rounded-lg bg-primary shadow-sm"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <FiLoader className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : isError ? (
        <div className="px-5 py-10 text-center text-sm text-destructive">
          Impossible de charger le calendrier.
        </div>
      ) : (
        <>
          {/* Desktop grid */}
          <div className="hidden p-3 sm:block">
            <div className="mb-1 grid grid-cols-7 gap-1">
              {JOURS.map((j) => (
                <div
                  key={j}
                  className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {j}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const inMonth = d.getMonth() === mois - 1;
                const key = dayKey(d);
                const dayEvents = (key && byDay.get(key)) || [];
                const isToday = sameDay(d, now);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      dayEvents.length > 0 &&
                      setSelected({ date: d, events: dayEvents })
                    }
                    className={cn(
                      "min-h-[72px] rounded-xl border p-1.5 text-left transition",
                      inMonth
                        ? "border-border/50 bg-background hover:border-primary/30"
                        : "border-transparent bg-muted/20 text-muted-foreground/50",
                      isToday && "ring-2 ring-primary/40",
                      dayEvents.length > 0 && "cursor-pointer",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday && "bg-primary text-primary-foreground",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            TYPE_META[e.type]?.dot || "bg-muted-foreground",
                            e.gravite === "urgent" && "bg-destructive",
                          )}
                          title={e.titre}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile agenda */}
          <div className="space-y-2 p-4 sm:hidden">
            {agendaMobile.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun événement ce mois-ci
              </p>
            ) : (
              agendaMobile.map((e, idx) => {
                const meta = TYPE_META[e.type] || TYPE_META.evaluation;
                const Icon = meta.icon;
                const d = new Date(e.date);
                return (
                  <motion.div
                    key={e.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : idx * 0.03 }}
                  >
                    <Link
                      href={e.lien || "#"}
                      className="flex gap-3 rounded-xl border border-border/60 bg-background p-3 transition hover:border-primary/25"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          meta.color,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase text-muted-foreground">
                          {d.toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {e.titre}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Detail selected day (desktop) */}
          {selected && (
            <div className="hidden border-t border-border/60 px-4 py-4 sm:block">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selected.date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <ul className="space-y-2">
                {selected.events.map((e) => {
                  const meta = TYPE_META[e.type] || TYPE_META.evaluation;
                  return (
                    <li key={e.id}>
                      <Link
                        href={e.lien || "#"}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 transition hover:bg-muted/40"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {e.titre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.description}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          Ouvrir →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Aperçu compact pour le dashboard */
export function CalendarPreview({ limit = 4 }) {
  const now = new Date();
  const { data, isLoading } = useCalendrierSupervision({
    annee: now.getFullYear(),
    mois: now.getMonth() + 1,
  });
  const upcoming = useMemo(() => {
    const list = [...(data?.evenements || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const futurs = list.filter((e) => new Date(e.date) >= start);
    // Si tout est passé ce mois-ci, afficher quand même les derniers événements
    const source = futurs.length > 0 ? futurs : list;
    return source.slice(0, limit);
  }, [data, limit]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_6px_20px_-10px_rgba(17,24,39,0.10)]">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FiCalendar className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold text-foreground">
            Prochains événements
          </h3>
        </div>
        <Link
          href="/calendrier-supervision"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Voir le calendrier
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <FiLoader className="h-5 w-5 animate-spin" />
        </div>
      ) : upcoming.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Aucun événement à venir ce mois-ci
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {upcoming.map((e) => {
            const d = new Date(e.date);
            return (
              <li key={e.id}>
                <Link
                  href={e.lien || "/calendrier-supervision"}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/40"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {d.toLocaleDateString("fr-FR", { month: "short" })}
                    </p>
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      {d.getDate()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {e.titre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.description}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
