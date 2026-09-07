"use client";
// Offres finales reçues (en attente) + historique (acceptées / refusées).

import { useMemo, useState } from "react";
import {
  FiAward,
  FiCheck,
  FiX,
  FiLoader,
  FiClock,
  FiInbox,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  useMesOffresFinales,
  useRepondreOffreFinale,
} from "@/lib/queries/useOffresFinales";
import { useTranslation } from "@/lib/i18n/useTranslation";
import RefusOffreFinaleDialog from "./RefusOffreFinaleDialog";

const DUREE_KEYS = {
  "1_mois": "durationLabels.1_mois",
  "2_mois": "durationLabels.2_mois",
  "3_mois": "durationLabels.3_mois",
};
const MODE_KEYS = {
  distance: "workMode.distance",
  hybride: "workMode.hybride",
  presentiel: "workMode.presentiel",
};

function formatDate(value, locale) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(
      locale === "en" ? "en-GB" : "fr-FR",
      { day: "numeric", month: "long", year: "numeric" },
    );
  } catch {
    return String(value);
  }
}

export default function OffresFinalesRecues() {
  const { t, locale } = useTranslation();
  const { data: offres } = useMesOffresFinales();
  const mutation = useRepondreOffreFinale();
  const [refusTarget, setRefusTarget] = useState(null);

  const { enAttente, historique } = useMemo(() => {
    const list = Array.isArray(offres) ? offres : [];
    const attente = list.filter(
      (o) =>
        o.statutValidationPlateforme === "approuve" &&
        o.statutReponseStagiaire === "en_attente",
    );
    const hist = list
      .filter(
        (o) =>
          o.statutValidationPlateforme === "approuve" &&
          (o.statutReponseStagiaire === "acceptee" ||
            o.statutReponseStagiaire === "refusee"),
      )
      .slice()
      .sort((a, b) => {
        const da = new Date(a.dateReponseStagiaire || 0).getTime();
        const db = new Date(b.dateReponseStagiaire || 0).getTime();
        return db - da;
      });
    return { enAttente: attente, historique: hist };
  }, [offres]);

  if (enAttente.length === 0 && historique.length === 0) return null;

  return (
    <div className="mb-6 space-y-6">
      {enAttente.length > 0 && (
        <div className="space-y-3">
          <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FiAward className="h-4 w-4 text-primary" />
            {t("stagiaireSpace.finalOffers.title")}
          </h5>
          {enAttente.map((o) => {
            const duree =
              (DUREE_KEYS[o.dureeStage] && t(DUREE_KEYS[o.dureeStage])) ||
              o.dureeStage;
            const mode =
              (MODE_KEYS[o.modeTravail] && t(MODE_KEYS[o.modeTravail])) ||
              o.modeTravail;
            return (
              <div
                key={o.idOffreFinale}
                className="rounded-md border border-primary/30 bg-primary/5 p-5"
              >
                <h6 className="mb-1 font-semibold text-foreground">
                  {o.intitulePoste}
                </h6>
                <span className="mb-2 inline-block rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                  {t("stagiaireSpace.finalOffers.validatedByAdmin")}
                </span>
                <p className="mb-3 text-sm text-muted-foreground">
                  {o.nomEntreprise} · {duree} · {mode} ·{" "}
                  {t("stagiaireSpace.finalOffers.hoursPerWeek", {
                    n: o.volumeHoraireHebdo,
                  })}{" "}
                  ·{" "}
                  {t("stagiaireSpace.finalOffers.start", {
                    date: o.dateDebut,
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        id: o.idOffreFinale,
                        statutReponseStagiaire: "acceptee",
                      })
                    }
                    className="rounded-sm"
                  >
                    {mutation.isPending ? (
                      <FiLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiCheck className="h-4 w-4" />
                    )}
                    {t("stagiaireSpace.finalOffers.accept")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() => setRefusTarget(o)}
                    className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
                  >
                    <FiX className="h-4 w-4" />
                    {t("stagiaireSpace.finalOffers.refuse")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historique.length > 0 && (
        <div className="space-y-3">
          <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FiInbox className="h-4 w-4 text-muted-foreground" />
            {t("stagiaireSpace.finalOffers.historyTitle")}
          </h5>
          {historique.map((o) => {
            const refusee = o.statutReponseStagiaire === "refusee";
            return (
              <div
                key={o.idOffreFinale}
                className="rounded-md border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h6 className="font-semibold text-foreground">
                      {o.intitulePoste}
                    </h6>
                    <p className="text-sm text-muted-foreground">
                      {o.nomEntreprise}
                    </p>
                  </div>
                  <span
                    className={
                      refusee
                        ? "rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive"
                        : "rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-700"
                    }
                  >
                    {refusee
                      ? t("stagiaireSpace.finalOffers.statusRefused")
                      : t("stagiaireSpace.finalOffers.statusAccepted")}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FiClock className="h-3.5 w-3.5" />
                  {refusee
                    ? t("stagiaireSpace.finalOffers.refusedOn", {
                        date: formatDate(o.dateReponseStagiaire, locale),
                      })
                    : t("stagiaireSpace.finalOffers.acceptedOn", {
                        date: formatDate(o.dateReponseStagiaire, locale),
                      })}
                </p>
                {refusee && o.motifRefusStagiaire && (
                  <div className="mt-3 rounded-sm border border-border bg-muted/30 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("stagiaireSpace.finalOffers.yourReason")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      « {o.motifRefusStagiaire} »
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RefusOffreFinaleDialog
        open={!!refusTarget}
        onOpenChange={(open) => {
          if (!open) setRefusTarget(null);
        }}
        offre={refusTarget}
        isPending={mutation.isPending}
        onConfirm={async (motif) => {
          if (!refusTarget) return;
          await mutation.mutateAsync({
            id: refusTarget.idOffreFinale,
            statutReponseStagiaire: "refusee",
            motifRefusStagiaire: motif,
          });
          setRefusTarget(null);
        }}
      />
    </div>
  );
}
