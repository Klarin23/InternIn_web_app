"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FiLoader, FiStar, FiCheck, FiArrowLeft } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import {
  useDetailStagiaire,
  useEvaluationDetail,
  useCreerEvaluation,
  useModifierEvaluation,
} from "@/lib/queries/useSuperviseur";

const CRITERES = [
  { key: "noteAssiduite", label: "Assiduité" },
  { key: "noteCommunication", label: "Communication" },
  { key: "noteInitiative", label: "Autonomie / Initiative" },
  { key: "noteProfessionnalisme", label: "Professionnalisme" },
  { key: "noteTravailEquipe", label: "Travail d'équipe" },
  {
    key: "notePerformanceTechnique",
    label: "Progression / Objectifs atteints",
  },
];

function Etoiles({ valeur, onChange, lectureSeule }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={lectureSeule}
          onClick={() => onChange(n)}
          className={`transition-transform ${lectureSeule ? "" : "hover:scale-110"}`}
          aria-label={`${n} sur 5`}
        >
          <FiStar
            className={`h-6 w-6 ${
              n <= valeur
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------
// Wrapper : gère le chargement, puis remonte <Formulaire> avec une `key`
// dès que les données arrivent. Comme React réinitialise tout l'état local
// d'un composant quand sa `key` change, l'état initial du formulaire est
// calculé directement dans useState (pas de useEffect + setState, donc pas
// de rendu en cascade).
// -----------------------------------------------------------------------
export default function FormulaireEvaluationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const idStage = params.idStage;
  const idEvaluation = searchParams.get("idEvaluation");
  const numeroSemaineDepart = searchParams.get("numeroSemaine");

  const { data: detailStagiaire } = useDetailStagiaire(idStage);
  const stagiaire = detailStagiaire?.stagiaire;
  const { data: detail, isLoading: chargementDetail } = useEvaluationDetail(
    idStage,
    idEvaluation,
  );

  if (idEvaluation && chargementDetail) {
    return (
      <>
        <AppHeader
          breadcrumb={[
            { label: "Évaluations", href: "/evaluations" },
            { label: "..." },
          ]}
        />
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <FiLoader className="h-5 w-5 animate-spin" />
          Chargement...
        </div>
      </>
    );
  }

  return (
    <Formulaire
      key={idEvaluation || "nouvelle"}
      idStage={idStage}
      idEvaluation={idEvaluation}
      numeroSemaineDepart={numeroSemaineDepart}
      detail={detail}
      stagiaire={stagiaire}
    />
  );
}

function Formulaire({
  idStage,
  idEvaluation,
  numeroSemaineDepart,
  detail,
  stagiaire,
}) {
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

  async function enregistrer(statutCible) {
    setErreur("");
    if (statutCible === "soumise" && !notesCompletes) {
      setErreur("Merci de noter les 6 critères avant de soumettre.");
      return;
    }
    const payload = {
      // Zod exige un entier >= 1 : on force 1 par défaut pour une note pas
      // encore renseignée dans un brouillon, sans jamais bloquer la
      // sauvegarde en cours de route (seule la soumission finale est
      // bloquée plus haut si toutes les notes ne sont pas renseignées).
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
      router.push("/evaluations");
    } catch (err) {
      setErreur(err?.message || "Une erreur est survenue, merci de réessayer.");
    }
  }

  const enCours = creer.isPending || modifier.isPending;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: "Évaluations", href: "/evaluations" },
          {
            label: stagiaire
              ? `${stagiaire.prenom} ${stagiaire.nom}`
              : "Évaluation",
          },
        ]}
      />
      <div className="mx-auto max-w-2xl px-6 py-6">
        <button
          type="button"
          onClick={() => router.push("/evaluations")}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <FiArrowLeft className="h-4 w-4" />
          Retour aux évaluations
        </button>

        <h1 className="mb-1 text-xl font-bold text-foreground">
          Évaluation hebdomadaire
          {evaluationExistante &&
            ` — Semaine ${evaluationExistante.numeroSemaine}`}
          {!evaluationExistante &&
            numeroSemaineDepart &&
            ` — Semaine ${numeroSemaineDepart}`}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {stagiaire ? `${stagiaire.prenom} ${stagiaire.nom}` : "Stagiaire"}
        </p>

        {dejaSoumise && (
          <div className="mb-6 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-green-800">
            Cette évaluation a déjà été soumise le{" "}
            {new Date(evaluationExistante.dateSoumission).toLocaleDateString(
              "fr-FR",
            )}
            . Elle est en lecture seule.
          </div>
        )}

        <div className="space-y-5 rounded-md border border-border bg-card p-5">
          {CRITERES.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm font-medium text-foreground">
                {c.label}
              </span>
              <Etoiles
                valeur={notes[c.key]}
                lectureSeule={dejaSoumise}
                onChange={(n) => setNotes((prev) => ({ ...prev, [c.key]: n }))}
              />
            </div>
          ))}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Commentaire du superviseur
            </label>
            <textarea
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
              disabled={dejaSoumise}
              rows={4}
              placeholder="Observations, points forts, axes de progression..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:bg-muted/40"
            />
          </div>
        </div>

        {detail?.coaching && (
          <div className="mt-4 rounded-md border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-bold text-foreground">
              Analyse Coach IA
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Forces : </span>
                {detail.coaching.forces}
              </p>
              <p>
                <span className="font-semibold text-foreground">
                  Axes d&apos;amélioration :{" "}
                </span>
                {detail.coaching.axesAmelioration}
              </p>
              <p>
                <span className="font-semibold text-foreground">
                  Actions recommandées :{" "}
                </span>
                {detail.coaching.actionsRecommandees}
              </p>
            </div>
          </div>
        )}

        {erreur && <p className="mt-4 text-sm text-destructive">{erreur}</p>}

        {!dejaSoumise && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={enCours}
              onClick={() => enregistrer("brouillon")}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Enregistrer comme brouillon
            </button>
            <button
              type="button"
              disabled={enCours}
              onClick={() => enregistrer("soumise")}
              className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {enCours ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiCheck className="h-4 w-4" />
              )}
              Soumettre l&apos;évaluation
            </button>
          </div>
        )}
      </div>
    </>
  );
}
