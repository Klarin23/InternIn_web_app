"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiLoader,
  FiClipboard,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useEvaluationsSuperviseur } from "@/lib/queries/useSuperviseur";
import { cn } from "@/lib/utils";

const FILTRES = [
  { valeur: "toutes", label: "Toutes" },
  { valeur: "a_effectuer", label: "À effectuer" },
  { valeur: "en_retard", label: "En retard" },
  { valeur: "terminee", label: "Terminées" },
];

const STATUT_INFO = {
  a_effectuer: {
    label: "À effectuer",
    classe:
      "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400",
  },
  en_retard: {
    label: "En retard",
    classe: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
  },
  brouillon: {
    label: "Brouillon",
    classe:
      "bg-accent/50 text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-300",
  },
  terminee: {
    label: "Terminée",
    classe:
      "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
  },
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);
  return value;
}

function StatCard({ icon: Icon, value, label, hint, tone, delay }) {
  const reduced = usePrefersReducedMotion();
  const display = useCountUp(value, 800);
  const tones = {
    amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    red: "bg-destructive/10 text-destructive ring-destructive/20",
    emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  };
  const blurs = { amber: "bg-amber-400", red: "bg-red-400", emerald: "bg-emerald-400" };
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_6px_20px_-10px_rgba(17,24,39,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-12px_rgba(17,24,39,0.16)]",
        !reduced && "animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
      )}
      style={reduced ? undefined : { animationDuration: "500ms", animationDelay: `${delay}ms` }}
    >
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70", blurs[tone])} />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl ring-1", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{hint}</span>
      </div>
      <p className="relative mt-4 text-3xl font-bold tracking-tight text-foreground tabular-nums">{display}</p>
      <p className="relative mt-1 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function initials(prenom, nom) {
  return `${(prenom || "?").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase();
}

export default function EvaluationsPage() {
  const { evaluationsPath } = useSupervisionContext();
  const router = useRouter();
  const { data: evaluations, isLoading } = useEvaluationsSuperviseur();
  const [filtre, setFiltre] = useState("toutes");
  const reduced = usePrefersReducedMotion();

  const stats = useMemo(() => {
    if (!evaluations) return { aEffectuer: 0, enRetard: 0, terminees: 0 };
    return {
      aEffectuer: evaluations.filter((e) => e.statutAffichage === "a_effectuer").length,
      enRetard: evaluations.filter((e) => e.statutAffichage === "en_retard").length,
      terminees: evaluations.filter((e) => e.statutAffichage === "terminee").length,
    };
  }, [evaluations]);

  const total = evaluations?.length ?? 0;

  const resultats = useMemo(() => {
    if (!evaluations) return [];
    if (filtre === "toutes") return evaluations;
    return evaluations.filter((e) => e.statutAffichage === filtre);
  }, [evaluations, filtre]);

  function ouvrirEvaluation(e) {
    if (e.idEvaluation) {
      router.push(`${evaluationsPath}/${e.idStage}?idEvaluation=${e.idEvaluation}`);
    } else {
      router.push(`${evaluationsPath}/${e.idStage}?numeroSemaine=${e.numeroSemaine}`);
    }
  }

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Évaluations" }]}
        subtitle="Évaluations de vos stagiaires encadrés"
        refreshKeys={["evaluationsSuperviseur"]}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className={cn("mb-8 max-w-3xl", !reduced && "animate-in fade-in slide-in-from-bottom-2 duration-500")}>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <FiClipboard className="h-3.5 w-3.5" />
            Espace superviseur
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Évaluations</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Suivez et complétez les évaluations hebdomadaires de vos stagiaires.
            {total > 0 && (
              <span className="ml-1 font-medium text-foreground">
                {total} évaluation{total > 1 ? "s" : ""} au total.
              </span>
            )}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={FiClock} value={stats.aEffectuer} label="À effectuer" hint="En attente" tone="amber" delay={80} />
          <StatCard icon={FiAlertCircle} value={stats.enRetard} label="En retard" hint="Urgent" tone="red" delay={160} />
          <StatCard icon={FiCheckCircle} value={stats.terminees} label="Terminées" hint="Validées" tone="emerald" delay={240} />
        </div>

        <div
          className={cn("mb-6", !reduced && "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500")}
          style={reduced ? undefined : { animationDelay: "280ms" }}
        >
          <div className="relative -mx-1 max-w-full overflow-x-auto px-1 pb-0.5">
            <div
              className="inline-flex min-w-min gap-1 rounded-xl border border-border bg-muted/40 p-1"
              role="tablist"
              aria-label="Filtrer les évaluations"
            >
              {FILTRES.map((f) => {
                const actif = filtre === f.valeur;
                return (
                  <button
                    key={f.valeur}
                    type="button"
                    role="tab"
                    aria-selected={actif}
                    onClick={() => setFiltre(f.valeur)}
                    className={
                      "relative z-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors " +
                      (actif
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {actif && (
                      <motion.span
                        layoutId={reduced ? undefined : "filtre-pill-evaluations"}
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement des évaluations…
          </div>
        ) : resultats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FiClipboard className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucune évaluation dans ce filtre</p>
            <p className="mt-1 text-xs text-muted-foreground">Changez de filtre ou attendez les prochaines échéances.</p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_6px_20px_-10px_rgba(17,24,39,0.10)] sm:block",
                !reduced && "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
              )}
              style={reduced ? undefined : { animationDelay: "320ms" }}
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3.5 font-semibold">Stagiaire</th>
                    <th className="px-5 py-3.5 font-semibold">Période</th>
                    <th className="px-5 py-3.5 font-semibold">Statut</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {resultats.map((e) => {
                    const info = STATUT_INFO[e.statutAffichage] || STATUT_INFO.a_effectuer;
                    return (
                      <tr
                        key={`${e.idStage}-${e.numeroSemaine}-${e.idEvaluation ?? "virtuelle"}`}
                        onClick={() => ouvrirEvaluation(e)}
                        className="group cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
                              {initials(e.prenomStagiaire, e.nomStagiaire)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {e.prenomStagiaire} {e.nomStagiaire}
                              </p>
                              <p className="text-xs text-muted-foreground">Stage encadré</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                            Semaine {e.numeroSemaine}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", info.classe)}>
                            {info.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                            {e.statutAffichage === "terminee" ? "Consulter" : "Évaluer"}
                            <FiChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {resultats.map((e) => {
                const info = STATUT_INFO[e.statutAffichage] || STATUT_INFO.a_effectuer;
                return (
                  <button
                    key={`${e.idStage}-${e.numeroSemaine}-${e.idEvaluation ?? "virtuelle"}`}
                    type="button"
                    onClick={() => ouvrirEvaluation(e)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/25 hover:shadow-md active:scale-[0.99] active:bg-muted/40"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {e.prenomStagiaire ? initials(e.prenomStagiaire, e.nomStagiaire) : <FiUser className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {e.prenomStagiaire} {e.nomStagiaire}
                      </p>
                      <p className="text-xs text-muted-foreground">Semaine {e.numeroSemaine}</p>
                      <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", info.classe)}>
                        {info.label}
                      </span>
                    </div>
                    <FiChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

