"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import {
  FiLoader,
  FiStar,
  FiCheck,
  FiArrowLeft,
  FiSpeaker,
  FiTrendingUp,
  FiAlertTriangle,
  FiZap,
  FiUser,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import {
  useDetailStagiaire,
  useEvaluationDetail,
  useCreerEvaluation,
  useModifierEvaluation,
} from "@/lib/queries/useSuperviseur";
import { cn } from "@/lib/utils";

const CRITERES = [
  {
    key: "noteAssiduite",
    label: "Assiduité",
    description: "Respect des horaires, présence et ponctualité",
  },
  {
    key: "noteCommunication",
    label: "Communication",
    description: "Clarté des échanges oraux et écrits avec l'équipe",
  },
  {
    key: "noteInitiative",
    label: "Autonomie / Initiative",
    description: "Capacité à avancer seul et à proposer des idées",
  },
  {
    key: "noteProfessionnalisme",
    label: "Professionnalisme",
    description: "Attitude, sérieux et posture en entreprise",
  },
  {
    key: "noteTravailEquipe",
    label: "Travail d'équipe",
    description: "Collaboration, entraide et esprit collectif",
  },
  {
    key: "notePerformanceTechnique",
    label: "Progression / Objectifs atteints",
    description: "Qualité du travail et atteinte des objectifs",
  },
];

const FEEDBACK_NOTE = {
  1: "Insuffisant",
  2: "À renforcer",
  3: "Correct",
  4: "Très bonne maîtrise",
  5: "Excellent",
};

function labelNoteGlobale(moyenne) {
  if (moyenne >= 4.5) return "Excellente évaluation";
  if (moyenne >= 3.5) return "Très bonne évaluation";
  if (moyenne >= 2.5) return "Évaluation correcte";
  if (moyenne >= 1.5) return "À renforcer";
  return "Points d'attention";
}

function labelStatutStage(statut) {
  if (statut === "actif") return "Stage actif";
  if (statut === "termine") return "Stage terminé";
  if (statut === "suspendu") return "Stage suspendu";
  return statut || "Stage";
}

function Etoiles({ valeur, onChange, lectureSeule }) {
  const [hover, setHover] = useState(0);
  const affiche = hover || valeur;

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div
        className="flex gap-0.5"
        onMouseLeave={() => !lectureSeule && setHover(0)}
        role="group"
        aria-label="Notation sur 5"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= affiche;
          return (
            <button
              key={n}
              type="button"
              disabled={lectureSeule}
              onClick={() => onChange(n)}
              onMouseEnter={() => !lectureSeule && setHover(n)}
              className={cn(
                "rounded-md p-1 transition-transform duration-150 ease-out",
                !lectureSeule && "hover:scale-110 active:scale-95",
                lectureSeule && "cursor-default opacity-90",
              )}
              aria-label={`${n} sur 5`}
              aria-pressed={valeur >= n}
            >
              <FiStar
                className={cn(
                  "h-6 w-6 transition-all duration-150 ease-out sm:h-7 sm:w-7",
                  active
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-muted-foreground/25",
                )}
              />
            </button>
          );
        })}
      </div>
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
        {valeur > 0 ? (
          <>
            {valeur} / 5
            {FEEDBACK_NOTE[valeur] && (
              <span className="ml-1.5 font-medium text-foreground/80">
                · {FEEDBACK_NOTE[valeur]}
              </span>
            )}
          </>
        ) : (
          "Non noté"
        )}
      </span>
    </div>
  );
}

function splitItems(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/[;\n•]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function initials(prenom, nom) {
  return `${(prenom || "?").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase();
}

// -----------------------------------------------------------------------
// Wrapper : gère le chargement, puis remonte <Formulaire> avec une `key`
// dès que les données arrivent (évite setState dans un useEffect).
// -----------------------------------------------------------------------
export default function FormulaireEvaluationPage() {
  const { evaluationsPath, basePath } = useSupervisionContext();
  const params = useParams();
  const searchParams = useSearchParams();
  const idStage = params.idStage;
  const idEvaluation = searchParams.get("idEvaluation");
  const numeroSemaineDepart = searchParams.get("numeroSemaine");

  const { data: detailStagiaire } = useDetailStagiaire(idStage);
  const { data: detail, isLoading: chargementDetail } = useEvaluationDetail(
    idStage,
    idEvaluation,
  );

  if (idEvaluation && chargementDetail) {
    return (
      <>
        <AppHeader
          breadcrumb={[
            { label: "Évaluations", href: evaluationsPath },
            { label: "..." },
          ]}
        />
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <FiLoader className="h-5 w-5 animate-spin" />
          Chargement de l&apos;évaluation…
        </div>
      </>
    );
  }

  return (
    <Formulaire
      key={idEvaluation || `nouvelle-${numeroSemaineDepart || "x"}`}
      idStage={idStage}
      idEvaluation={idEvaluation}
      numeroSemaineDepart={numeroSemaineDepart}
      detail={detail}
      stagiaire={detailStagiaire?.stagiaire}
      offre={detailStagiaire?.offre}
      stage={detailStagiaire?.stage}
      formation={detailStagiaire?.formation}
    />
  );
}

function Formulaire({
  idStage,
  idEvaluation,
  numeroSemaineDepart,
  detail,
  stagiaire,
  offre,
  stage,
  formation,
}) {
  const { evaluationsPath } = useSupervisionContext();
  const router = useRouter();
  const creer = useCreerEvaluation(idStage);
  const modifier = useModifierEvaluation(idStage);

  const evaluationExistante = detail?.evaluation;

  const [notes, setNotes] = useState(() => ({
    noteAssiduite: evaluationExistante?.noteAssiduite || 0,
    noteCommunication: evaluationExistante?.noteCommunication || 0,
    noteInitiative: evaluationExistante?.noteInitiative || 0,
    noteProfessionnalisme: evaluationExistante?.noteProfessionnalisme || 0,
    noteTravailEquipe: evaluationExistante?.noteTravailEquipe || 0,
    notePerformanceTechnique:
      evaluationExistante?.notePerformanceTechnique || 0,
  }));
  const [commentaires, setCommentaires] = useState(
    evaluationExistante?.commentaires || "",
  );
  const [erreur, setErreur] = useState("");

  const dejaSoumise = evaluationExistante?.statut === "soumise";
  const notesCompletes = CRITERES.every((c) => notes[c.key] >= 1);
  const criteresRemplis = CRITERES.filter((c) => notes[c.key] >= 1).length;
  const progressionPct = Math.round((criteresRemplis / CRITERES.length) * 100);

  const notesSelectionnees = CRITERES.map((c) => notes[c.key]).filter(
    (n) => n >= 1,
  );
  const moyenne =
    notesSelectionnees.length > 0
      ? notesSelectionnees.reduce((a, b) => a + b, 0) /
        notesSelectionnees.length
      : 0;

  async function enregistrer(statutCible) {
    setErreur("");
    if (statutCible === "soumise" && !notesCompletes) {
      setErreur("Merci de noter les 6 critères avant de soumettre.");
      return;
    }
    const payload = {
      ...Object.fromEntries(Object.entries(notes).map(([k, v]) => [k, v || 1])),
      commentaires,
      statutCible,
      ...(numeroSemaineDepart && !idEvaluation
        ? { numeroSemaine: Number(numeroSemaineDepart) }
        : {}),
    };

    try {
      if (idEvaluation) {
        await modifier.mutateAsync({ idEvaluation, payload });
      } else {
        await creer.mutateAsync(payload);
      }
      router.push(evaluationsPath);
    } catch (err) {
      setErreur(err?.message || "Une erreur est survenue, merci de réessayer.");
    }
  }

  const enCours = creer.isPending || modifier.isPending;

  const forces = useMemo(
    () => splitItems(detail?.coaching?.forces),
    [detail?.coaching?.forces],
  );
  const axes = useMemo(
    () => splitItems(detail?.coaching?.axesAmelioration),
    [detail?.coaching?.axesAmelioration],
  );
  const actions = useMemo(
    () => splitItems(detail?.coaching?.actionsRecommandees),
    [detail?.coaching?.actionsRecommandees],
  );

  const semaineLabel =
    evaluationExistante?.numeroSemaine || numeroSemaineDepart || null;

  const sousTitre =
    offre?.titre ||
    formation?.diplome ||
    formation?.nomUniversite ||
    null;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: "Évaluations", href: evaluationsPath },
          {
            label: stagiaire
              ? `${stagiaire.prenom} ${stagiaire.nom}`
              : "Évaluation",
          },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        {/* Retour */}
        <button
          type="button"
          onClick={() => router.push(evaluationsPath)}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground active:scale-[0.97] motion-reduce:transform-none"
        >
          <FiArrowLeft className="h-4 w-4" />
          Retour aux évaluations
        </button>

        {/* Header stagiaire */}
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_6px_20px_-10px_rgba(17,24,39,0.10)] duration-500 fill-mode-both motion-reduce:animate-none sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {stagiaire?.photoProfilUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stagiaire.photoProfilUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/15 sm:h-16 sm:w-16"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15 sm:h-16 sm:w-16 sm:text-base">
                  {stagiaire ? (
                    initials(stagiaire.prenom, stagiaire.nom)
                  ) : (
                    <FiUser className="h-6 w-6" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {stagiaire
                      ? `${stagiaire.prenom} ${stagiaire.nom}`
                      : "Stagiaire"}
                  </h1>
                  {semaineLabel && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">
                      Semaine {String(semaineLabel).padStart(2, "0")}
                    </span>
                  )}
                </div>
                {sousTitre && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {sousTitre}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {stage?.statut && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {labelStatutStage(stage.statut)}
                    </span>
                  )}
                  {dejaSoumise ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                      <FiCheck className="h-3 w-3" />
                      Évaluation soumise
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                      Évaluation en cours
                    </span>
                  )}
                  {dejaSoumise && evaluationExistante?.dateSoumission && (
                    <span className="text-xs text-muted-foreground">
                      le{" "}
                      {new Date(
                        evaluationExistante.dateSoumission,
                      ).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Colonne principale */}
          <div className="space-y-5">
            {/* Critères */}
            <div className="space-y-3">
              {CRITERES.map((c, idx) => (
                <div
                  key={c.key}
                  className={cn(
                    "rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-200 sm:p-5",
                    "hover:border-primary/20",
                    notes[c.key] >= 1 && "border-primary/15 bg-primary/[0.02]",
                    "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none",
                  )}
                  style={{ animationDelay: `${80 + idx * 50}ms` }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {c.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {c.description}
                        </p>
                      </div>
                    </div>
                    <Etoiles
                      valeur={notes[c.key]}
                      lectureSeule={dejaSoumise}
                      onChange={(n) =>
                        setNotes((prev) => ({ ...prev, [c.key]: n }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Commentaire */}
            <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border/70 bg-card p-4 shadow-sm duration-500 fill-mode-both motion-reduce:animate-none sm:p-5"
              style={{ animationDelay: "420ms" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="commentaire-superviseur"
                  className="text-sm font-semibold text-foreground"
                >
                  Commentaire du superviseur
                </label>
                <span
                  className={cn(
                    "text-xs tabular-nums transition-colors",
                    commentaires.trim()
                      ? "font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {commentaires.length} car.
                </span>
              </div>
              <textarea
                id="commentaire-superviseur"
                value={commentaires}
                onChange={(e) => setCommentaires(e.target.value)}
                disabled={dejaSoumise}
                rows={5}
                placeholder="Observations de la semaine : points forts, axes de progression, contexte…"
                className={cn(
                  "w-full resize-y rounded-xl border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200",
                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:bg-muted/40",
                  commentaires.trim()
                    ? "border-primary/25"
                    : "border-border",
                )}
              />
            </div>

            {erreur && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {erreur}
              </p>
            )}
          </div>

          {/* Colonne secondaire */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {/* Progression */}
            <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-border/70 bg-card p-5 shadow-sm duration-500 fill-mode-both motion-reduce:animate-none"
              style={{ animationDelay: "120ms" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Progression
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {criteresRemplis} / {CRITERES.length} critères complétés
              </p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary to-teal-400 transition-all duration-500 ease-out"
                  style={{ width: `${progressionPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="tabular-nums font-semibold text-primary">
                  {progressionPct} %
                </span>
                <span className="text-muted-foreground">
                  {notesCompletes
                    ? "Prête à soumettre"
                    : "En cours de saisie"}
                </span>
              </div>
            </div>

            {/* Note globale */}
            <div className="animate-in fade-in zoom-in-95 rounded-2xl border border-border/70 bg-linear-to-br from-card to-primary/[0.04] p-5 shadow-sm duration-500 fill-mode-both motion-reduce:animate-none"
              style={{ animationDelay: "180ms" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Note globale
              </p>
              {notesSelectionnees.length > 0 ? (
                <>
                  <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-foreground transition-all duration-300">
                    {moyenne.toFixed(1)}
                    <span className="text-lg font-semibold text-muted-foreground">
                      {" "}
                      / 5
                    </span>
                  </p>
                  <div className="mt-2 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <FiStar
                        key={n}
                        className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          n <= Math.round(moyenne)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/20",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {labelNoteGlobale(moyenne)}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  La moyenne apparaîtra dès la première note.
                </p>
              )}
            </div>

            {/* Coach IA */}
            {detail?.coaching && (
              <div className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-violet-500/20 bg-linear-to-br from-violet-500/5 via-card to-card shadow-sm duration-500 fill-mode-both motion-reduce:animate-none"
                style={{ animationDelay: "260ms" }}
              >
                <div className="flex items-center gap-2.5 border-b border-violet-500/15 px-4 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <FiSpeaker className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Analyse Coach IA
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Synthèse à partir des notes
                    </p>
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  {(forces.length > 0 || detail.coaching.forces) && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both"
                      style={{ animationDelay: "320ms" }}
                    >
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        <FiTrendingUp className="h-3.5 w-3.5" />
                        Forces
                      </div>
                      {forces.length > 0 ? (
                        <ul className="space-y-1.5">
                          {forces.map((f, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {detail.coaching.forces}
                        </p>
                      )}
                    </div>
                  )}
                  {(axes.length > 0 || detail.coaching.axesAmelioration) && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both"
                      style={{ animationDelay: "400ms" }}
                    >
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        <FiAlertTriangle className="h-3.5 w-3.5" />
                        Axes d&apos;amélioration
                      </div>
                      {axes.length > 0 ? (
                        <ul className="space-y-1.5">
                          {axes.map((a, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {detail.coaching.axesAmelioration}
                        </p>
                      )}
                    </div>
                  )}
                  {(actions.length > 0 ||
                    detail.coaching.actionsRecommandees) && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both"
                      style={{ animationDelay: "480ms" }}
                    >
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
                        <FiZap className="h-3.5 w-3.5" />
                        Actions recommandées
                      </div>
                      {actions.length > 0 ? (
                        <ul className="space-y-1.5">
                          {actions.map((a, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <span className="mt-0.5 text-violet-500">→</span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {detail.coaching.actionsRecommandees}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Barre d'actions sticky — uniquement si modifiable */}
      {!dejaSoumise && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(17,24,39,0.18)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground sm:text-sm">
              <span className="font-semibold tabular-nums text-foreground">
                {criteresRemplis} / {CRITERES.length}
              </span>{" "}
              critères complétés
              {notesCompletes && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                  · Prête à soumettre
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={enCours}
                onClick={() => enregistrer("brouillon")}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-muted active:scale-[0.97] disabled:opacity-50 motion-reduce:transform-none sm:flex-none"
              >
                Enregistrer comme brouillon
              </button>
              <button
                type="button"
                disabled={enCours}
                onClick={() => enregistrer("soumise")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 motion-reduce:transform-none sm:flex-none"
              >
                {enCours ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiCheck className="h-4 w-4" />
                )}
                Soumettre l&apos;évaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
