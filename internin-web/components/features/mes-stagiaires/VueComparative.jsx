"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiUsers,
  FiSearch,
  FiX,
  FiTrendingUp,
  FiStar,
  FiTarget,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiChevronDown,
  FiGrid,
  FiList,
  FiArrowUpRight,
  FiAward,
  FiEye,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const SITUATION_CONFIG = {
  excellent: {
    label: "Excellent",
    emoji: "🟢",
    badge: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  bon: {
    label: "Bon",
    emoji: "🟢",
    badge: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  surveiller: {
    label: "À surveiller",
    emoji: "🟡",
    badge: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  attention: {
    label: "Attention",
    emoji: "🟠",
    badge: "bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/20 dark:text-orange-400",
    bar: "bg-orange-500",
  },
  critique: {
    label: "Critique",
    emoji: "🔴",
    badge: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
    bar: "bg-destructive",
  },
  termine: {
    label: "Terminé",
    emoji: "⚪",
    badge: "bg-muted text-muted-foreground ring-1 ring-border",
    bar: "bg-muted-foreground/40",
  },
};

const OPTIONS_TRI = [
  { valeur: "nom", label: "Nom" },
  { valeur: "progression", label: "Progression" },
  { valeur: "note", label: "Note moyenne" },
  { valeur: "objectifs", label: "Objectifs terminés" },
  { valeur: "fin", label: "Fin de stage" },
  { valeur: "situation", label: "Situation" },
];

const FILTRES_SITUATION = [
  { valeur: "tous", label: "Tous" },
  { valeur: "excellent", label: "🟢 Excellent" },
  { valeur: "bon", label: "🟢 Bon" },
  { valeur: "surveiller", label: "🟡 À surveiller" },
  { valeur: "attention", label: "🟠 Attention" },
  { valeur: "critique", label: "🔴 Critique" },
];

const FILTRES_STATUT = [
  { valeur: "tous", label: "Tous" },
  { valeur: "en_cours", label: "En cours" },
  { valeur: "bientot", label: "Bientôt terminé" },
  { valeur: "termine", label: "Terminé" },
];

const FILTRES_PROGRESSION = [
  { valeur: "toutes", label: "Toutes" },
  { valeur: "lt50", label: "< 50 %" },
  { valeur: "50-75", label: "50–75 %" },
  { valeur: "gt75", label: "> 75 %" },
];

const ORDRE_SITUATION = {
  critique: 0,
  attention: 1,
  surveiller: 2,
  bon: 3,
  excellent: 4,
  termine: 5,
};

function ProgressBar({ value, className }) {
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setWidth(value);
      return;
    }
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value, reduceMotion]);

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, width))}%` }}
      />
    </div>
  );
}

function Avatar({ prenom, nom, photoUrl, size = "md" }) {
  const initials = `${(prenom || "")[0] || ""}${(nom || "")[0] || ""}`.toUpperCase();
  const colors = ["#14B8A6", "#5B3DF5", "#F59E0B", "#3B82F6", "#EC4899", "#10B981"];
  const color = colors[(prenom?.charCodeAt(0) || 0) % colors.length];
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${prenom} ${nom}`}
        className={cn(sizeClass, "rounded-full object-cover ring-2 ring-background")}
      />
    );
  }
  return (
    <div
      className={cn(
        sizeClass,
        "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-background",
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}

function NoteStars({ note }) {
  if (note == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <span className="font-semibold text-foreground">{note.toFixed(1)}</span>
      <span className="text-muted-foreground">/ 5</span>
      <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
    </span>
  );
}

function SituationBadge({ situation }) {
  const cfg = SITUATION_CONFIG[situation] || SITUATION_CONFIG.bon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.badge,
      )}
    >
      <span aria-hidden>{cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, className, delay = 0 }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "rounded-xl border border-border/70 bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StagiaireRow({ s, index }) {
  const { basePath } = useSupervisionContext();
  const reduceMotion = useReducedMotion();
  const cfg = SITUATION_CONFIG[s.situation] || SITUATION_CONFIG.bon;
  return (
    <motion.tr
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className="group border-b border-border/50 transition-colors hover:bg-muted/40"
    >
      <td className="px-4 py-3">
        <Link
          href={`${basePath}/${s.idStage}`}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        >
          <Avatar prenom={s.prenom} nom={s.nom} photoUrl={s.photoProfilUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground group-hover:text-primary">
              {s.prenom} {s.nom}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {s.formation || s.poste || "—"}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 min-w-[120px]">
          <ProgressBar value={s.progression} className="flex-1 max-w-[80px]" />
          <span className="text-sm font-semibold tabular-nums text-foreground w-10">
            {s.progression}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <NoteStars note={s.noteMoyenne} />
      </td>
      <td className="px-4 py-3">
        <span className="tabular-nums text-sm font-medium">
          {s.objectifsAtteints} / {s.objectifsTotal || 0}
        </span>
      </td>
      <td className="px-4 py-3">
        {s.joursRestants != null ? (
          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
            <FiClock className="h-3.5 w-3.5 text-muted-foreground" />
            {s.joursRestants}j
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <SituationBadge situation={s.situation} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`${basePath}/${s.idStage}`}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Voir <FiArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </motion.tr>
  );
}

function StagiaireCardComparative({ s, index }) {
  const { basePath } = useSupervisionContext();
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35) }}
      className="rounded-xl border border-border/70 bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="mb-4 flex items-start gap-3">
        <Avatar prenom={s.prenom} nom={s.nom} photoUrl={s.photoProfilUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">
            {s.prenom} {s.nom}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {s.formation || s.poste || "—"}
          </p>
        </div>
        <SituationBadge situation={s.situation} />
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progression</span>
          <span className="font-semibold tabular-nums">{s.progression}%</span>
        </div>
        <ProgressBar value={s.progression} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[10px] uppercase text-muted-foreground">Évaluation</p>
          <NoteStars note={s.noteMoyenne} />
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[10px] uppercase text-muted-foreground">Objectifs</p>
          <p className="font-semibold tabular-nums">
            {s.objectifsAtteints} / {s.objectifsTotal || 0}
          </p>
        </div>
      </div>

      {s.joursRestants != null && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiClock className="h-3.5 w-3.5" />
          {s.joursRestants} jour{s.joursRestants > 1 ? "s" : ""} restant
          {s.joursRestants > 1 ? "s" : ""}
        </p>
      )}

      <Link
        href={`${basePath}/${s.idStage}`}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Voir le dossier <FiArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}

export default function VueComparative({ stagiaires = [], isLoading }) {
  const { basePath } = useSupervisionContext();
  const [recherche, setRecherche] = useState("");
  const [filtreSituation, setFiltreSituation] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreProgression, setFiltreProgression] = useState("toutes");
  const [tri, setTri] = useState("progression");
  const [vue, setVue] = useState("tableau"); // tableau | cartes
  const [showFiltres, setShowFiltres] = useState(false);
  const reduceMotion = useReducedMotion();

  const kpis = useMemo(() => {
    const list = stagiaires || [];
    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        progressionMoy: 0,
        noteMoy: null,
        enDifficulte: 0,
        objectifsEnRetard: 0, // non disponible sans deadline
      };
    }
    const sumProg = list.reduce((a, s) => a + (s.progression || 0), 0);
    const notes = list.filter((s) => s.noteMoyenne != null).map((s) => s.noteMoyenne);
    const noteMoy =
      notes.length > 0
        ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
        : null;
    const enDifficulte = list.filter(
      (s) => s.situation === "critique" || s.situation === "attention",
    ).length;
    return {
      total,
      progressionMoy: Math.round(sumProg / total),
      noteMoy,
      enDifficulte,
    };
  }, [stagiaires]);

  const topProgressions = useMemo(() => {
    return [...(stagiaires || [])]
      .filter((s) => s.statutStage === "actif")
      .sort((a, b) => b.progression - a.progression)
      .slice(0, 3);
  }, [stagiaires]);

  const aSurveiller = useMemo(() => {
    return [...(stagiaires || [])]
      .filter(
        (s) =>
          s.situation === "critique" ||
          s.situation === "attention" ||
          s.situation === "surveiller",
      )
      .sort((a, b) => (ORDRE_SITUATION[a.situation] ?? 9) - (ORDRE_SITUATION[b.situation] ?? 9))
      .slice(0, 4);
  }, [stagiaires]);

  const resultats = useMemo(() => {
    if (!stagiaires) return [];
    const q = recherche.trim().toLowerCase();

    let liste = stagiaires.filter((s) => {
      if (q) {
        const hay = `${s.prenom} ${s.nom} ${s.formation || ""} ${s.poste || ""} ${s.universite || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filtreSituation !== "tous" && s.situation !== filtreSituation) return false;
      if (filtreStatut === "en_cours" && s.statutStage !== "actif") return false;
      if (filtreStatut === "termine" && s.statutStage !== "termine") return false;
      if (filtreStatut === "bientot") {
        if (s.statutStage !== "actif" || s.joursRestants == null || s.joursRestants > 30)
          return false;
      }
      if (filtreProgression === "lt50" && s.progression >= 50) return false;
      if (filtreProgression === "50-75" && (s.progression < 50 || s.progression > 75))
        return false;
      if (filtreProgression === "gt75" && s.progression <= 75) return false;
      return true;
    });

    liste = [...liste].sort((a, b) => {
      if (tri === "progression") return b.progression - a.progression;
      if (tri === "note") {
        const na = a.noteMoyenne ?? -1;
        const nb = b.noteMoyenne ?? -1;
        return nb - na;
      }
      if (tri === "objectifs") {
        const ra = a.objectifsTotal ? a.objectifsAtteints / a.objectifsTotal : 0;
        const rb = b.objectifsTotal ? b.objectifsAtteints / b.objectifsTotal : 0;
        return rb - ra;
      }
      if (tri === "fin") {
        const ja = a.joursRestants ?? 9999;
        const jb = b.joursRestants ?? 9999;
        return ja - jb;
      }
      if (tri === "situation") {
        return (ORDRE_SITUATION[a.situation] ?? 9) - (ORDRE_SITUATION[b.situation] ?? 9);
      }
      return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
    });

    return liste;
  }, [stagiaires, recherche, filtreSituation, filtreStatut, filtreProgression, tri]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!stagiaires || stagiaires.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <FiUsers className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">Aucun stagiaire</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Vous ne supervisez actuellement aucun stagiaire.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Vue comparative
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparez la progression et les performances de vos stagiaires en un
              coup d&apos;œil.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {kpis.total} stagiaire{kpis.total > 1 ? "s" : ""} supervisé
              {kpis.total > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher un stagiaire…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Rechercher un stagiaire"
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Effacer la recherche"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFiltres((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                showFiltres
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              Filtres
              <FiChevronDown
                className={cn("h-4 w-4 transition-transform", showFiltres && "rotate-180")}
              />
            </button>
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setVue("tableau")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  vue === "tableau"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Vue tableau"
                aria-pressed={vue === "tableau"}
              >
                <FiList className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVue("cartes")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  vue === "cartes"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Vue cartes"
                aria-pressed={vue === "cartes"}
              >
                <FiGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFiltres && (
            <motion.div
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-wrap gap-4 border-t border-border/60 pt-4">
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase text-muted-foreground">
                    Situation
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTRES_SITUATION.map((f) => (
                      <button
                        key={f.valeur}
                        type="button"
                        onClick={() => setFiltreSituation(f.valeur)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          filtreSituation === f.valeur
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase text-muted-foreground">
                    Statut stage
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTRES_STATUT.map((f) => (
                      <button
                        key={f.valeur}
                        type="button"
                        onClick={() => setFiltreStatut(f.valeur)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          filtreStatut === f.valeur
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase text-muted-foreground">
                    Progression
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTRES_PROGRESSION.map((f) => (
                      <button
                        key={f.valeur}
                        type="button"
                        onClick={() => setFiltreProgression(f.valeur)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          filtreProgression === f.valeur
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase text-muted-foreground">
                    Trier par
                  </p>
                  <select
                    value={tri}
                    onChange={(e) => setTri(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Trier par"
                  >
                    {OPTIONS_TRI.map((o) => (
                      <option key={o.valeur} value={o.valeur}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Stagiaires"
          value={kpis.total}
          icon={FiUsers}
          delay={0.05}
        />
        <KpiCard
          label="Progression moy."
          value={`${kpis.progressionMoy} %`}
          icon={FiTrendingUp}
          delay={0.1}
        />
        <KpiCard
          label="Note moyenne"
          value={kpis.noteMoy != null ? `${kpis.noteMoy} / 5` : "—"}
          icon={FiStar}
          delay={0.15}
        />
        <KpiCard
          label="En difficulté"
          value={kpis.enDifficulte}
          icon={FiAlertTriangle}
          delay={0.2}
          className={kpis.enDifficulte > 0 ? "border-orange-500/30" : undefined}
        />
      </div>

      {/* Top + À surveiller */}
      <div className="grid gap-4 lg:grid-cols-2">
        {topProgressions.length > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <FiAward className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">
                Meilleures progressions
              </h3>
            </div>
            <ol className="space-y-2">
              {topProgressions.map((s, i) => (
                <li key={s.idStage} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">
                    {i + 1}
                  </span>
                  <Avatar
                    prenom={s.prenom}
                    nom={s.nom}
                    photoUrl={s.photoProfilUrl}
                    size="sm"
                  />
                  <span className="flex-1 truncate text-sm font-medium">
                    {s.prenom} {s.nom}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {s.progression}%
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}

        {aSurveiller.length > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <FiEye className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-foreground">À surveiller</h3>
            </div>
            <ul className="space-y-2">
              {aSurveiller.map((s) => (
                <li key={s.idStage}>
                  <Link
                    href={`${basePath}/${s.idStage}`}
                    className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar
                      prenom={s.prenom}
                      nom={s.nom}
                      photoUrl={s.photoProfilUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.prenom} {s.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Progression {s.progression}%
                        {s.alerte ? " · Éval. en retard" : ""}
                      </p>
                    </div>
                    <SituationBadge situation={s.situation} />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table or Cards */}
      <AnimatePresence mode="wait">
        {vue === "tableau" ? (
          <motion.div
            key="table"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm md:block"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Stagiaire</th>
                    <th className="px-4 py-3 font-semibold">Progression</th>
                    <th className="px-4 py-3 font-semibold">Évaluation</th>
                    <th className="px-4 py-3 font-semibold">Objectifs</th>
                    <th className="px-4 py-3 font-semibold">Restant</th>
                    <th className="px-4 py-3 font-semibold">Situation</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((s, i) => (
                    <StagiaireRow key={s.idStage} s={s} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
            {resultats.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Aucun stagiaire ne correspond aux filtres.
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Cards view (always on mobile, or when selected) */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
          vue === "tableau" && "md:hidden",
        )}
      >
        {resultats.map((s, i) => (
          <StagiaireCardComparative key={s.idStage} s={s} index={i} />
        ))}
        {resultats.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Aucun stagiaire ne correspond aux filtres.
          </div>
        )}
      </div>
    </div>
  );
}
