"use client";

import Link from "next/link";
import {
  FiLoader,
  FiUsers,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiClipboard,
  FiBell,
  FiChevronRight,
  FiInbox,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StatCard from "../dashboard-entreprise/StatCard";
import { useTableauDeBordSuperviseur } from "@/lib/queries/useSuperviseur";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";

// Style par niveau de gravité pour la section « À traiter aujourd'hui ».
const STYLE_GRAVITE = {
  urgent: {
    dot: "bg-destructive",
    badge:
      "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white",
  },
  attention: {
    dot: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
  },
  attente: {
    dot: "bg-accent",
    badge:
      "bg-accent/40 text-amber-700 group-hover:bg-secondary group-hover:text-secondary-foreground",
  },
};

const LIBELLE_ACTION = {
  evaluation: "Évaluer",
  fin_stage: "Voir le suivi",
  journal: "Consulter",
};

function ATraiterAujourdhui({ items }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          À traiter aujourd&apos;hui
        </h3>
        {items.length > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <FiInbox className="h-6 w-6" />
          <p className="text-sm">Rien à traiter, tout est à jour 🎉</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => {
            const style = STYLE_GRAVITE[item.gravite] || STYLE_GRAVITE.attente;
            return (
              <li key={`${item.type}-${item.idStage}-${idx}`}>
                <Link
                  href={item.lien}
                  className="group flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.titre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`hidden shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors sm:inline-block ${style.badge}`}
                  >
                    {LIBELLE_ACTION[item.type] || "Voir"}
                  </span>
                  <FiChevronRight className="h-4 w-4 shrink-0 text-muted-foreground sm:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SuperviseurDashboardContent() {
  const { data: profil } = useMonProfilEquipe();
  const { data, isLoading } = useTableauDeBordSuperviseur();

  const aujourdHui = new Date();

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Tableau de bord" }]}
        avatarLabel={profil?.nom?.slice(0, 2).toUpperCase()}
      />
      <div className="space-y-6 px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {data && (
          <>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Bonjour{profil?.nom ? `, ${profil.nom.split(" ")[0]}` : ""} 👋
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {aujourdHui.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {profil?.nomEntreprise && ` · ${profil.nomEntreprise}`}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={FiUsers}
                value={data.compteurs.stagiaires}
                label="Stagiaires supervisés"
                color="bg-primary/10 text-primary"
              />
              <StatCard
                icon={FiBriefcase}
                value={data.compteurs.stagesEnCours}
                label="Stages en cours"
                color="bg-secondary/10 text-secondary"
              />
              <StatCard
                icon={FiClock}
                value={data.compteurs.stagesBientotTermines}
                label="Bientôt terminés"
                sublabel="dans les 30 prochains jours"
                color="bg-accent/40 text-amber-700"
              />
              <StatCard
                icon={FiCheckCircle}
                value={data.compteurs.stagesTermines}
                label="Stages terminés"
                color="bg-success/10 text-green-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <StatCard
                icon={FiClipboard}
                value={data.compteurs.evaluationsAEffectuer}
                label="Évaluations à effectuer"
                sublabel="stages sans évaluation récente"
                color="bg-destructive/10 text-destructive"
              />
              <StatCard
                icon={FiBell}
                value={data.notificationsNonLues}
                label="Notifications non lues"
                color="bg-primary/10 text-primary"
              />
            </div>

            <ATraiterAujourdhui items={data.aTraiterAujourdhui || []} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-bold text-foreground">
                  Activités récentes
                </h3>
                {data.activitesRecentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune activité récente.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.activitesRecentes.map((a) => (
                      <li key={a.idEvaluation} className="text-sm">
                        <span className="font-semibold text-foreground">
                          {a.prenomStagiaire} {a.nomStagiaire}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          — évaluation semaine {a.numeroSemaine} soumise le{" "}
                          {new Date(a.dateSoumission).toLocaleDateString(
                            "fr-FR",
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-md border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-bold text-foreground">
                  Notifications importantes
                </h3>
                {data.notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune notification.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.notifications.map((n) => (
                      <li key={n.idNotification} className="text-sm">
                        <span className="font-semibold text-foreground">
                          {n.titre}
                        </span>
                        <p className="text-muted-foreground">{n.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
