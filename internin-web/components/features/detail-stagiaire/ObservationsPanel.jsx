"use client";

import { useState } from "react";
import { FiSend, FiTrash2, FiLoader } from "react-icons/fi";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  useAjouterObservation,
  useSupprimerObservation,
} from "@/lib/queries/useSuperviseur";

export default function ObservationsPanel({ idStage, observations }) {
  const { t, locale } = useTranslation();
  const [contenu, setContenu] = useState("");
  const ajouter = useAjouterObservation(idStage);
  const supprimer = useSupprimerObservation(idStage);

  function handleAjouter() {
    if (!contenu.trim()) return;
    ajouter.mutate(contenu.trim(), { onSuccess: () => setContenu("") });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        {t("mesStagiaires.progression.observationsTitle")}
      </h2>

      <div className="mb-4 space-y-2">
        <Textarea
          placeholder={t("mesStagiaires.progression.addObservation")}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          className="min-h-[80px] rounded-lg"
        />
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-lg px-3 text-xs"
          disabled={!contenu.trim() || ajouter.isPending}
          onClick={handleAjouter}
        >
          {ajouter.isPending ? (
            <FiLoader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <FiSend className="h-3.5 w-3.5" />
              {t("mesStagiaires.progression.publish")}
            </>
          )}
        </Button>
      </div>

      {observations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("mesStagiaires.progression.noObservationsYet")}
        </p>
      ) : (
        <ul className="space-y-3 border-t border-border/60 pt-4">
          {observations.map((o) => (
            <li
              key={o.idObservation}
              className="group flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{o.contenu}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(o.dateCreation).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => supprimer.mutate(o.idObservation)}
                className="rounded-lg p-1.5 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label={t("mesStagiaires.progression.deleteObservation")}
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
