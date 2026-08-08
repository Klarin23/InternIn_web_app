"use client";

import { useState } from "react";
import {
  FiBriefcase,
  FiLoader,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateOffreFinale } from "@/lib/queries/useOffresFinales";
import { useDisponibilitesCandidat } from "@/lib/queries/useEntretiens";

const JOUR_LABELS_COURT = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
};
const ORDRE_JOURS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};

const REMUNERATION_LABELS = {
  aucune: "Non rémunéré",
  indemnite_transport: "Indemnité transport",
  indemnite_repas: "Indemnité repas",
  indemnite_internet_appel: "Indemnité internet / appel",
  allocation_mensuelle: "Allocation mensuelle",
};

const MODE_TRAVAIL_LABELS = {
  presentiel: "Présentiel",
  hybride: "Hybride",
  distance: "Distance",
};

// Les colonnes "heure_debut"/"heure_fin" (type TIME) peuvent revenir au
// format "08:00:00" — on ne garde que "HH:MM" pour l'affichage.
function formatHeure(valeur) {
  if (!valeur) return null;
  return valeur.slice(0, 5);
}

export default function FaireOffreDialog({
  idEntretien,
  candidatNom,
  openControlled,
  onOpenChangeControlled,
  hideTrigger = false,
}) {
  const [openInterne, setOpenInterne] = useState(false);
  const open = openControlled !== undefined ? openControlled : openInterne;
  const setOpen = onOpenChangeControlled || setOpenInterne;
  const [form, setForm] = useState({
    intitulePoste: "",
    objectifsApprentissage: "",
    volumeHoraireHebdo: 20,
    dureeStage: "",
    modeTravail: "",
    remunerationType: "",
    dateDebut: "",
  });
  const mutation = useCreateOffreFinale();
    const { data: candidatInfo, isLoading: loadingDispos } =
      useDisponibilitesCandidat(idEntretien);

    const disponibilites = candidatInfo?.disponibilites ?? [];
    const preferences = candidatInfo?.preferences ?? null;
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function handleSubmit() {
    mutation.mutate(
      { idEntretien, ...form },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button type="button" size="sm" className="rounded-sm">
            <FiBriefcase className="h-4 w-4" />
            Faire une offre
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-md sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Offre finale — {candidatNom}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2 rounded-sm border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FiCalendar className="h-4 w-4 text-primary" />
              Disponibilités du candidat
            </div>
            {loadingDispos ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
                Chargement des disponibilités...
              </p>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1.5">
                  {ORDRE_JOURS.map((jour) => {
                    const dispo = disponibilites?.find(
                      (d) => d.jourSemaine === jour,
                    );
                    const heureDebut = formatHeure(dispo?.heureDebut);
                    const heureFin = formatHeure(dispo?.heureFin);
                    return (
                      <div
                        key={jour}
                        className={`flex flex-col items-center gap-1 rounded-sm px-1 py-2.5 text-center ${
                          dispo
                            ? "bg-primary/10 text-primary"
                            : "bg-background text-muted-foreground"
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wide">
                          {JOUR_LABELS_COURT[jour]}
                        </span>
                        {dispo ? (
                          <span className="text-[10px] font-medium leading-tight">
                            {heureDebut && heureFin ? (
                              <>
                                {heureDebut}
                                <br />
                                {heureFin}
                              </>
                            ) : (
                              "Dispo"
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(!disponibilites || disponibilites.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    Aucune disponibilité renseignée par le candidat lors de son
                    inscription.
                  </p>
                )}
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Utilisez ces informations pour définir un volume horaire et
                  une durée réalistes ci-dessous.
                </p>
              </>
            )}
          </div>

          {/* Préférences du candidat */}
          <div className="space-y-2 rounded-sm border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FiBriefcase className="h-4 w-4 text-primary" />
              Préférences du candidat
            </div>

            {loadingDispos ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
                Chargement...
              </p>
            ) : preferences ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Durée souhaitée
                  </p>
                  <p className="font-medium text-foreground">
                    {preferences.dureeStageSouhaitee
                      ? DUREE_LABELS[preferences.dureeStageSouhaitee] ||
                        preferences.dureeStageSouhaitee
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Volume horaire
                  </p>
                  <p className="font-medium text-foreground">
                    {preferences.heuresHebdoSouhaitees
                      ? `${preferences.heuresHebdoSouhaitees} h/semaine`
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Date de début souhaitée
                  </p>
                  <p className="font-medium text-foreground">
                    {preferences.dateDebutSouhaitee
                      ? new Date(
                          preferences.dateDebutSouhaitee,
                        ).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Rémunération souhaitée
                  </p>
                  <p className="font-medium text-foreground">
                    {preferences.remunerationSouhaitee
                      ? REMUNERATION_LABELS[
                          preferences.remunerationSouhaitee
                        ] || preferences.remunerationSouhaitee
                      : "—"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Mode de travail souhaité
                  </p>
                  <p className="font-medium text-foreground">
                    {Array.isArray(preferences.modalitesTravailSouhaitees) &&
                    preferences.modalitesTravailSouhaitees.length > 0
                      ? preferences.modalitesTravailSouhaitees
                          .map((m) => MODE_TRAVAIL_LABELS[m] || m)
                          .join(", ")
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aucune préférence renseignée par le candidat.
              </p>
            )}

            <p className="pt-1 text-[11px] text-muted-foreground">
              Ces informations sont indicatives : adaptez l&apos;offre selon les
              besoins de votre entreprise.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Intitulé du poste</Label>
            <Input
              className="h-11 rounded-sm"
              value={form.intitulePoste}
              onChange={(e) => update("intitulePoste", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Objectifs d&apos;apprentissage{" "}
              <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-none"
              value={form.objectifsApprentissage}
              onChange={(e) => update("objectifsApprentissage", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Heures par semaine</Label>
              <span className="text-sm font-semibold text-primary">
                {form.volumeHoraireHebdo}h
              </span>
            </div>
            <Slider
              min={15}
              max={40}
              step={5}
              value={[form.volumeHoraireHebdo]}
              onValueChange={([v]) => update("volumeHoraireHebdo", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Durée</Label>
              <Select
                value={form.dureeStage}
                onValueChange={(v) => update("dureeStage", v)}
              >
                <SelectTrigger className="h-11 w-full rounded-sm">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_mois">1 mois</SelectItem>
                  <SelectItem value="2_mois">2 mois</SelectItem>
                  <SelectItem value="3_mois">3 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mode de travail</Label>
              <Select
                value={form.modeTravail}
                onValueChange={(v) => update("modeTravail", v)}
              >
                <SelectTrigger className="h-11 w-full rounded-sm">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="hybride">Hybride</SelectItem>
                  <SelectItem value="presentiel">Présentiel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Rémunération</Label>
            <Select
              value={form.remunerationType}
              onValueChange={(v) => update("remunerationType", v)}
            >
              <SelectTrigger className="h-11 w-full rounded-sm">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucune">Non rémunéré</SelectItem>
                <SelectItem value="indemnite_transport">
                  Indemnité transport
                </SelectItem>
                <SelectItem value="indemnite_repas">Indemnité repas</SelectItem>
                <SelectItem value="indemnite_internet_appel">
                  Indemnité internet / appel
                </SelectItem>
                <SelectItem value="allocation_mensuelle">
                  Allocation mensuelle
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date de début</Label>
            <Input
              type="date"
              className="h-11 rounded-sm"
              value={form.dateDebut}
              onChange={(e) => update("dateDebut", e.target.value)}
            />
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="h-11 w-full rounded-sm"
          >
            {mutation.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              "Envoyer l'offre finale"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
