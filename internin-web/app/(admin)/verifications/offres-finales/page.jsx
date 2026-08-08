"use client";

import { useState } from "react";
import { FiLoader, FiCheck, FiX, FiInbox } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import {
  useOffresFinalesAdmin,
  useValiderOffreFinale,
} from "@/lib/queries/useOffresFinales";

// Écart assumé n°5 : le mockup affiche des durées de 3 à 6 mois, mais la
// règle métier de la plateforme (documentée dans le Schéma BDD) plafonne
// les stages à 3 mois. Les données réelles n'afficheront donc jamais plus
// que "3 mois" ici — c'est le comportement voulu, pas un bug.
const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};

const ONGLETS = [
  { value: undefined, label: "Toutes les offres" },
  { value: "en_attente", label: "En attente" },
  { value: "approuve", label: "Approuvé" },
  { value: "rejete", label: "Rejeté" },
];

const STATUT_STYLE = {
  en_attente: {
    dot: "#F59E0B",
    bg: "bg-warning/10",
    text: "text-amber-700",
    label: "En attente",
  },
  approuve: {
    dot: "#22C55E",
    bg: "bg-success/10",
    text: "text-green-700",
    label: "Approuvé",
  },
  rejete: {
    dot: "#EF4444",
    bg: "bg-destructive/10",
    text: "text-red-700",
    label: "Rejeté",
  },
};

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRef(numero) {
  return `OFF-${String(numero).padStart(4, "0")}`;
}

export default function VerificationsOffresFinalesPage() {
  const [onglet, setOnglet] = useState(undefined);
  const { data: offres, isLoading } = useOffresFinalesAdmin(onglet);
  const mutation = useValiderOffreFinale();

  const resultats = offres?.length ?? 0;

  return (
    <>
      <AppHeader title="Offres de stage" />
      <div className="px-6 py-6">
        <p className="-mt-4 mb-6 text-sm text-muted-foreground">
          Modération et validation des offres
        </p>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {ONGLETS.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setOnglet(o.value)}
                className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                  onglet === o.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {resultats} résultat{resultats > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {offres && offres.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiInbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucune offre pour ce filtre
            </p>
          </div>
        )}

        {offres && offres.length > 0 && (
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-linear-to-r from-blue-600/75 to-blue-600/80 text-left text-[11px] font-bold uppercase tracking-wider text-white">
                  <th className="px-4 py-3.5">Réf.</th>
                  <th className="px-4 py-3.5">Titre</th>
                  <th className="px-4 py-3.5">Entreprise</th>
                  <th className="px-4 py-3.5">Secteur</th>
                  <th className="px-4 py-3.5">Durée</th>
                  <th className="px-4 py-3.5">Déposé le</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {offres.map((o, i) => {
                  const style = STATUT_STYLE[o.statutValidationPlateforme];
                  return (
                    <tr
                      key={o.idOffreFinale}
                      className={`border-b border-border/60 last:border-0 transition hover:bg-primary/[0.06] ${
                        i % 2 === 0 ? "bg-card" : "bg-muted/40"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-primary">
                        {formatRef(o.numero)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {o.intitulePoste}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.nomEntreprise}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-foreground">
                          {o.secteurActivite || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {DUREE_LABELS[o.dureeStage] || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(o.dateCreation)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: style.dot }}
                          />
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {o.statutValidationPlateforme === "en_attente" && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={mutation.isPending}
                              onClick={() =>
                                mutation.mutate({
                                  id: o.idOffreFinale,
                                  statutValidationPlateforme: "approuve",
                                })
                              }
                              aria-label="Approuver"
                              className="flex h-7 w-7 items-center justify-center rounded-sm bg-success/15 text-green-700 transition hover:bg-success/25 disabled:opacity-50"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={mutation.isPending}
                              onClick={() =>
                                mutation.mutate({
                                  id: o.idOffreFinale,
                                  statutValidationPlateforme: "rejete",
                                })
                              }
                              aria-label="Rejeter"
                              className="flex h-7 w-7 items-center justify-center rounded-sm bg-destructive/15 text-destructive transition hover:bg-destructive/25 disabled:opacity-50"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
