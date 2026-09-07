"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

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

const REMUNERATION_LABEL_KEYS = {
  aucune: "entrepriseSpace.candidatures.remNone",
  indemnite_transport: "entrepriseSpace.candidatures.remTransport",
  indemnite_repas: "entrepriseSpace.candidatures.remMeals",
  indemnite_internet_appel: "entrepriseSpace.candidatures.remInternet",
  allocation_mensuelle: "entrepriseSpace.candidatures.remMonthly",
};

const MODE_TRAVAIL_LABEL_KEYS = {
  presentiel: "entrepriseSpace.candidatures.modeOnsite",
  hybride: "entrepriseSpace.candidatures.modeHybrid",
  distance: "entrepriseSpace.candidatures.modeRemote",
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
  const { t } = useTranslation();
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
  const [formError, setFormError] = useState(null);
  const mutation = useCreateOffreFinale();
    const { data: candidatInfo, isLoading: loadingDispos } =
      useDisponibilitesCandidat(idEntretien);

    const disponibilites = candidatInfo?.disponibilites ?? [];
    const preferences = candidatInfo?.preferences ?? null;
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function validateForm() {
    if (!form.intitulePoste?.trim()) {
      return t("entrepriseSpace.candidatures.errJobTitleRequired");
    }
    const objectifs = String(form.objectifsApprentissage || "")
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter(Boolean);
    if (objectifs.length < 1) {
      return t("entrepriseSpace.candidatures.errObjectives");
    }
    for (let i = 0; i < objectifs.length; i++) {
      if (objectifs[i].length < 10) {
        return `L'objectif ${i + 1} est trop court (minimum 10 caractères).`;
      }
      if (objectifs[i].length > 500) {
        return `L'objectif ${i + 1} est trop long (maximum 500 caractères).`;
      }
    }
    if (!form.dureeStage) return t("entrepriseSpace.candidatures.errDuration");
    if (!form.modeTravail) return t("entrepriseSpace.candidatures.errWorkMode");
    if (!form.remunerationType) return t("entrepriseSpace.candidatures.errRemuneration");
    if (!form.dateDebut) return t("entrepriseSpace.candidatures.errStartDate");
    const vol = Number(form.volumeHoraireHebdo);
    if (!Number.isFinite(vol) || vol < 15 || vol > 40) {
      return t("entrepriseSpace.candidatures.errHours");
    }
    return null;
  }

  function handleSubmit() {
    const errMsg = validateForm();
    if (errMsg) {
      setFormError(errMsg);
      return;
    }
    setFormError(null);
    mutation.mutate(
      {
        idEntretien,
        intitulePoste: form.intitulePoste.trim(),
        objectifsApprentissage: form.objectifsApprentissage.trim(),
        volumeHoraireHebdo: Number(form.volumeHoraireHebdo),
        dureeStage: form.dureeStage,
        modeTravail: form.modeTravail,
        remunerationType: form.remunerationType,
        dateDebut: form.dateDebut,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormError(null);
        },
      },
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
      <DialogContent className="internin-custom-scrollbar max-h-[85vh] overflow-y-auto rounded-md sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{t("entrepriseSpace.candidatures.finalOfferTitle", { name: candidatNom })}</DialogTitle>
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
                              t("entrepriseSpace.candidatures.available")
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
                      ? (REMUNERATION_LABEL_KEYS[
                          preferences.remunerationSouhaitee
                        ]
                          ? t(
                              REMUNERATION_LABEL_KEYS[
                                preferences.remunerationSouhaitee
                              ],
                            )
                          : preferences.remunerationSouhaitee)
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
                          .map((m) =>
                            MODE_TRAVAIL_LABEL_KEYS[m]
                              ? t(MODE_TRAVAIL_LABEL_KEYS[m])
                              : m,
                          )
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
            <Label>{t("entrepriseSpace.candidatures.jobTitle")}</Label>
            <Input
              className="h-11 rounded-sm"
              value={form.intitulePoste}
              onChange={(e) => update("intitulePoste", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              {t("entrepriseSpace.candidatures.learningObjectives")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-none"
              value={form.objectifsApprentissage}
              onChange={(e) => {
                update("objectifsApprentissage", e.target.value);
                setFormError(null);
              }}
              placeholder={t("entrepriseSpace.candidatures.objectivesPlaceholder")}
            />
            <p className="text-[11px] text-muted-foreground">
              Au moins 1 objectif pédagogique (10 à 500 caractères par ligne).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("entrepriseSpace.candidatures.hoursPerWeek")}</Label>
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
              <Label>{t("entrepriseSpace.candidatures.duration")}</Label>
              <Select
                value={form.dureeStage}
                onValueChange={(v) => update("dureeStage", v)}
              >
                <SelectTrigger className="h-11 w-full rounded-sm">
                  <SelectValue placeholder={t("entrepriseSpace.candidatures.select")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_mois">{t("entrepriseSpace.candidatures.duration1Month")}</SelectItem>
                  <SelectItem value="2_mois">{t("entrepriseSpace.candidatures.duration2Months")}</SelectItem>
                  <SelectItem value="3_mois">{t("entrepriseSpace.candidatures.duration3Months")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("entrepriseSpace.candidatures.workMode")}</Label>
              <Select
                value={form.modeTravail}
                onValueChange={(v) => update("modeTravail", v)}
              >
                <SelectTrigger className="h-11 w-full rounded-sm">
                  <SelectValue placeholder={t("entrepriseSpace.candidatures.select")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">{t("entrepriseSpace.candidatures.modeRemote")}</SelectItem>
                  <SelectItem value="hybride">{t("entrepriseSpace.candidatures.modeHybrid")}</SelectItem>
                  <SelectItem value="presentiel">{t("entrepriseSpace.candidatures.modeOnsite")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("entrepriseSpace.candidatures.remuneration")}</Label>
            <Select
              value={form.remunerationType}
              onValueChange={(v) => update("remunerationType", v)}
            >
              <SelectTrigger className="h-11 w-full rounded-sm">
                <SelectValue placeholder={t("entrepriseSpace.candidatures.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucune">{t("entrepriseSpace.candidatures.remNone")}</SelectItem>
                <SelectItem value="indemnite_transport">
                  {t("entrepriseSpace.candidatures.remTransport")}
                </SelectItem>
                <SelectItem value="indemnite_repas">{t("entrepriseSpace.candidatures.remMeals")}</SelectItem>
                <SelectItem value="indemnite_internet_appel">
                  {t("entrepriseSpace.candidatures.remInternet")}
                </SelectItem>
                <SelectItem value="allocation_mensuelle">
                  {t("entrepriseSpace.candidatures.remMonthly")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("entrepriseSpace.candidatures.startDate")}</Label>
            <Input
              type="date"
              className="h-11 rounded-sm"
              value={form.dateDebut}
              onChange={(e) => update("dateDebut", e.target.value)}
            />
          </div>

          {(formError || mutation.isError) && (
            <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError || mutation.error?.message}</span>
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
              t("entrepriseSpace.candidatures.sendFinalOffer")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
