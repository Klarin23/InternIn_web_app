"use client";
// Section "Activité récente" : réutilise useNotifications (déjà utilisé par
// la cloche dans AppHeader) plutôt que d'introduire une nouvelle source de
// données. Affiche les 6 dernières, avec entrée en cascade au montage.

import { FiBell } from "react-icons/fi";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useNotifications } from "@/lib/queries/useNotifications";

function tempsEcoule(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `Il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return `Il y a ${jours} j`;
}

export default function RecentActivityFeed() {
  const { data: notifications, isLoading } = useNotifications();
  const recentes = (notifications || []).slice(0, 6);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h5 className="mb-4 text-sm font-semibold text-foreground">
        Activité récente
      </h5>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chargement...
        </p>
      ) : recentes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune activité récente
        </p>
      ) : (
        <Stagger className="space-y-3" staggerDelay={0.06}>
          {recentes.map((n) => (
            <StaggerItem key={n.idNotification}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FiBell className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {tempsEcoule(n.dateCreation)}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
