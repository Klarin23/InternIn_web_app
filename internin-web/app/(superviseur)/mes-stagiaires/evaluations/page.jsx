"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiLoader,
  FiClipboard,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useEvaluationsSuperviseur } from "@/lib/queries/useSuperviseur";

const FILTRES = [
  { valeur: "toutes", label: "Toutes" },
  { valeur: "a_effectuer", label: "À effectuer" },
  { valeur: "en_retard", label: "En retard" },
  { valeur: "terminee", label: "Terminées" },
];

const STATUT_INFO = {
  a_effectuer: {
    label: "À effectuer",
    classe: "bg-amber-500/10 text-amber-700",
  },
  en_retard: {
    label: "En retard",
    classe: "bg-destructive/10 text-destructive",
  },
  brouillon: {
    label: "Brouillon",
    classe: "bg-accent/40 text-amber-700",
  },
  terminee: {
    label: "Terminée",
    classe: "bg-success/10 text-green-700",
  },
};

export default function EvaluationsPage() {
  const router = useRouter();
  const { data: evaluations, isLoading } = useEvaluationsSuperviseur();
  const [filtre, setFiltre] = useState("toutes");

  const stats = useMemo(() => {
    if (!evaluations) return { aEffectuer: 0, enRetard: 0, terminees: 0 };
    return {
      aEffectuer: evaluations.filter((e) => e.statutAffichage === "a_effectuer")
        .length,
      enRetard: evaluations.filter((e) => e.statutAffichage === "en_retard")
        .length,
      terminees: evaluations.filter((e) => e.statutAffichage === "terminee")
        .length,
    };
  }, [evaluations]);

  const resultats = useMemo(() => {
    if (!evaluations) return [];
    if (filtre === "toutes") return evaluations;
    return evaluations.filter((e) => e.statutAffichage === filtre);
  }, [evaluations, filtre]);

  function ouvrirEvaluation(e) {
    if (e.idEvaluation) {
      router.push(`/evaluations/${e.idStage}?idEvaluation=${e.idEvaluation}`);
    } else {
      router.push(`/evaluations/${e.idStage}?numeroSemaine=${e.numeroSemaine}`);
    }
  }

  return (
    <>
      <AppHeader breadcrumb={[{ label: "Évaluations" }]} />
      <div className="px-6 py-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Évaluations</h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-700">
              <FiClock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.aEffectuer}
              </p>
              <p className="text-xs text-muted-foreground">À effectuer</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <FiAlertCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.enRetard}
              </p>
              <p className="text-xs text-muted-foreground">En retard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-green-700">
              <FiCheckCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.terminees}
              </p>
              <p className="text-xs text-muted-foreground">Terminées</p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <button
              key={f.valeur}
              type="button"
              onClick={() => setFiltre(f.valeur)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filtre === f.valeur
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {resultats.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiClipboard className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucune évaluation dans cette catégorie
            </p>
          </div>
        )}

        {resultats.length > 0 && (
          <>
            {/* Tableau (desktop/tablette) */}
            <div className="hidden overflow-hidden rounded-md border border-border bg-card sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Stagiaire</th>
                    <th className="px-4 py-3 font-semibold">Semaine</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((e) => {
                    const info = STATUT_INFO[e.statutAffichage];
                    return (
                      <tr
                        key={`${e.idStage}-${e.numeroSemaine}-${e.idEvaluation ?? "virtuelle"}`}
                        onClick={() => ouvrirEvaluation(e)}
                        className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {e.prenomStagiaire} {e.nomStagiaire}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          Semaine {e.numeroSemaine}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${info.classe}`}
                          >
                            {info.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-semibold text-primary">
                            {e.statutAffichage === "terminee"
                              ? "Consulter"
                              : "Évaluer"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Liste de cartes (mobile) */}
            <div className="space-y-2 sm:hidden">
              {resultats.map((e) => {
                const info = STATUT_INFO[e.statutAffichage];
                return (
                  <button
                    key={`${e.idStage}-${e.numeroSemaine}-${e.idEvaluation ?? "virtuelle"}`}
                    type="button"
                    onClick={() => ouvrirEvaluation(e)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card p-4 text-left transition-colors active:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {e.prenomStagiaire} {e.nomStagiaire}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Semaine {e.numeroSemaine}
                      </p>
                      <span
                        className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${info.classe}`}
                      >
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
