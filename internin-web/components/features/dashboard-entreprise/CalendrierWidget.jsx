"use client";
// Calendrier entreprise : fusionne deux sources — les entretiens planifiés
// (déjà présents) et les stages actifs (nouveau, via useMesStages, la même
// requête que "Suivi des stagiaires") — pour afficher aussi les débuts et
// fins de stage des candidats sélectionnés. Chaque événement porte un label
// (Entretien / Début de stage / Fin de stage) + le titre de l'offre ou du
// poste correspondant.

import Link from "next/link";
import { FiCalendar, FiUserCheck, FiFlag } from "react-icons/fi";
import { useMesStages } from "@/lib/queries/useStages";

function estAujourdhui(date) {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

const TYPE_CONFIG = {
  entretien: {
    icon: FiCalendar,
    label: "Entretien",
    badge: "bg-primary text-primary-foreground",
    rowBg: "bg-primary/5",
  },
  debut_stage: {
    icon: FiUserCheck,
    label: "Début de stage",
    badge: "bg-success text-white",
    rowBg: "bg-success/5",
  },
  fin_stage: {
    icon: FiFlag,
    label: "Fin de stage",
    badge: "bg-accent text-amber-900",
    rowBg: "bg-accent/10",
  },
};

export default function CalendrierWidget({ entretiens }) {
  const { data: stages } = useMesStages();

  const evenementsEntretiens = (entretiens || [])
    .filter((e) => e.statut === "planifie")
    .map((e) => ({
      id: `entretien-${e.idEntretien}`,
      type: "entretien",
      date: e.dateHeure,
      prenom: e.prenom,
      nom: e.nom,
      titre: e.titreOffre,
    }));

  const evenementsDebuts = (stages || [])
    .filter(
      (s) =>
        s.statut === "actif" &&
        new Date(s.dateDebut) >= new Date(new Date().toDateString()),
    )
    .map((s) => ({
      id: `debut-${s.idStage}`,
      type: "debut_stage",
      date: s.dateDebut,
      prenom: s.prenom,
      nom: s.nom,
      titre: s.titrePoste,
    }));

  const evenementsFins = (stages || [])
    .filter(
      (s) =>
        s.statut === "actif" &&
        !s.dateFinReelle &&
        new Date(s.dateFinPrevue) >= new Date(new Date().toDateString()),
    )
    .map((s) => ({
      id: `fin-${s.idStage}`,
      type: "fin_stage",
      date: s.dateFinPrevue,
      prenom: s.prenom,
      nom: s.nom,
      titre: s.titrePoste,
    }));

  const tousLesEvenements = [
    ...evenementsEntretiens,
    ...evenementsDebuts,
    ...evenementsFins,
  ];

  const aujourdHui = tousLesEvenements
    .filter((e) => estAujourdhui(e.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const aVenir = tousLesEvenements
    .filter((e) => new Date(e.date) > new Date() && !estAujourdhui(e.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const dateAujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FiCalendar className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h5 className="text-sm font-semibold text-foreground">Calendrier</h5>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {dateAujourdhui}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Aujourd&apos;hui {aujourdHui.length > 0 && `(${aujourdHui.length})`}
        </p>
        {aujourdHui.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien de prévu aujourd&apos;hui
          </p>
        ) : (
          <div className="space-y-2">
            {aujourdHui.map((e) => {
              const config = TYPE_CONFIG[e.type];
              const Icon = config.icon;
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-2.5 rounded-sm px-2.5 py-2 ${config.rowBg}`}
                >
                  <span
                    className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${config.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    {e.type === "entretien"
                      ? new Date(e.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : config.label}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {e.prenom} {e.nom}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {config.label} · {e.titre}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Rendez-vous à venir
        </p>
        {aVenir.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien de prévu prochainement
          </p>
        ) : (
          <div className="space-y-2">
            {aVenir.map((e) => {
              const config = TYPE_CONFIG[e.type];
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="truncate text-foreground">
                      {e.prenom} {e.nom}
                    </span>
                    <p className="truncate text-xs text-muted-foreground">
                      {config.label} · {e.titre}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/entretiens-entreprise"
        className="mt-4 block text-center text-xs font-semibold text-primary hover:underline"
      >
        Voir tous les entretiens
      </Link>
    </div>
  );
}
