"use client";
// Section affichée en haut de "Mes candidatures" : les offres finales
// approuvées par la plateforme et en attente de réponse du stagiaire.
// Volontairement séparée plutôt qu'ajoutée à la sidebar, pour ne pas
// alourdir davantage la navigation existante.

import { FiAward, FiCheck, FiX, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  useMesOffresFinales,
  useRepondreOffreFinale,
} from "@/lib/queries/useOffresFinales";

const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};
const MODE_LABELS = {
  distance: "Distance",
  hybride: "Hybride",
  presentiel: "Présentiel",
};

export default function OffresFinalesRecues() {
  const { data: offres } = useMesOffresFinales();
  const mutation = useRepondreOffreFinale();

  // On ne montre que les offres validées par la plateforme, en attente
  // de réponse du stagiaire — le reste (en_attente, rejete) n'a rien à faire ici
  const offresEnAttenteDeReponse = offres?.filter(
    (o) =>
      o.statutValidationPlateforme === "approuve" &&
      o.statutReponseStagiaire === "en_attente",
  );

  if (!offresEnAttenteDeReponse || offresEnAttenteDeReponse.length === 0)
    return null;

  return (
    <div className="mb-6 space-y-3">
      <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FiAward className="h-4 w-4 text-primary" />
        Offres finales reçues
      </h5>
      {offresEnAttenteDeReponse.map((o) => (
        <div
          key={o.idOffreFinale}
          className="rounded-md border border-primary/30 bg-primary/5 p-5"
        >
          <h6 className="mb-1 font-semibold text-foreground">
            {o.intitulePoste}
          </h6>
          <span className="mb-2 inline-block rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
            Validée par l&apos;administration
          </span>
          <p className="mb-3 text-sm text-muted-foreground">
            {o.nomEntreprise} · {DUREE_LABELS[o.dureeStage]} ·{" "}
            {MODE_LABELS[o.modeTravail]} · {o.volumeHoraireHebdo}h/semaine ·
            Début : {o.dateDebut}
          </p>
          <div className="flex gap-2">
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
              Accepter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  id: o.idOffreFinale,
                  statutReponseStagiaire: "refusee",
                })
              }
              className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
            >
              <FiX className="h-4 w-4" />
              Refuser
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
