"use client";

import AppHeader from "@/components/layout/AppHeader";
import SupervisionCalendar from "@/components/features/dashboard-superviseur/SupervisionCalendar";

export default function CalendrierSupervisionPage() {
  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Calendrier" }]}
        subtitle="Événements de supervision de vos stagiaires"
        refreshKeys={["calendrierSupervision"]}
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Calendrier de supervision
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualisez les évaluations, journaux et échéances de fin de stage.
          </p>
        </div>
        <SupervisionCalendar />
      </div>
    </>
  );
}
