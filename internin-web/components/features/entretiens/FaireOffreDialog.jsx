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

const JOUR_KEYS = {
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
  dimanche: "sunday",
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

// Les colonnes "heure_debut"/"heure_fin" (type TIME) peuvent revenir au
// format "08:00:00" — on ne garde que "HH:MM" pour l'affichage.
function formatHeure(valeur) {
  if (!valeur) return null;
  return valeur.slice(0, 5);
}

function minutesEntre(debut, fin) {
  if (!debut || !fin) return 0;
  const [debutH, debutM] = debut.split(":").map(Number);
  const [finH, finM] = fin.split(":").map(Number);
  const totalDebut = debutH * 60 + debutM;
  const totalFin = finH * 60 + finM;
  return totalFin > totalDebut ? totalFin - totalDebut : 0;
}

export default function FaireOffreDialog({
  idEntretien,
  candidatNom,
  offreTitre,
  openControlled,
  onOpenChangeControlled,
  hideTrigger = false,
}) {
  const { t } = useTranslation();
  const [openInterne, setOpenInterne] = useState(false);
  const open = openControlled !== undefined ? openControlled : openInterne;
  const setOpen = onOpenChangeControlled || setOpenInterne;
  const [form, setForm] = useState({
    objectifsApprentissage: "",
    volumeHoraireHebdo: 20,
    dureeStage: "",
    modeTravail: "",
    lienReunionOnline: "",
    dateDebut: "",
    horairesStage: [],
  });
  const [formError, setFormError] = useState(null);
  const mutation = useCreateOffreFinale();
  const { data: candidatInfo, isLoading: loadingDispos } =
    useDisponibilitesCandidat(idEntretien, open);

  const disponibilites = candidatInfo?.disponibilites ?? [];
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const totalMinutes = form.horairesStage.reduce(
    (total, horaire) =>
      total + minutesEntre(horaire.heureDebut, horaire.heureFin),
    0,
  );
  const totalHeures = totalMinutes / 60;

  function validateForm() {
    const objectifs = String(form.objectifsApprentissage || "")
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter(Boolean);
    if (objectifs.length < 1) {
      return t("entrepriseSpace.candidatures.errObjectives");
    }
    for (let i = 0; i < objectifs.length; i++) {
      if (objectifs[i].length < 10) {
        return t("entrepriseSpace.candidatures.errObjectiveTooShort", { n: i + 1 });
      }
      if (objectifs[i].length > 500) {
        return t("entrepriseSpace.candidatures.errObjectiveTooLong", { n: i + 1 });
      }
    }
    if (!form.dureeStage) return t("entrepriseSpace.candidatures.errDuration");
    if (!form.modeTravail) return t("entrepriseSpace.candidatures.errWorkMode");
    if (form.modeTravail === "distance" && !form.lienReunionOnline.trim()) {
      return t("entrepriseSpace.candidatures.errMeetingLinkRequired");
    }
    if (!form.dateDebut) return t("entrepriseSpace.candidatures.errStartDate");
    const vol = Number(form.volumeHoraireHebdo);
    if (!Number.isFinite(vol) || vol < 15 || vol > 40) {
      return t("entrepriseSpace.candidatures.errHours");
    }
    if (form.horairesStage.length === 0) {
      return t("entrepriseSpace.candidatures.errScheduleDays");
    }
    if (
      form.horairesStage.some(
        (h) => minutesEntre(h.heureDebut, h.heureFin) <= 0,
      )
    ) {
      return t("entrepriseSpace.candidatures.errScheduleTimes");
    }
    if (totalMinutes !== vol * 60) {
      return t("entrepriseSpace.candidatures.errScheduleTotal", { n: vol });
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
        objectifsApprentissage: form.objectifsApprentissage.trim(),
        volumeHoraireHebdo: Number(form.volumeHoraireHebdo),
        dureeStage: form.dureeStage,
        modeTravail: form.modeTravail,
        lienReunionOnline:
          form.modeTravail === "distance"
            ? form.lienReunionOnline.trim()
            : null,
        dateDebut: form.dateDebut,
        horairesStage: form.horairesStage,
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
            {t("entrepriseSpace.candidatures.makeOffer")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="internin-mobile-dialog-content internin-custom-scrollbar w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] min-w-0 overflow-x-hidden overflow-y-auto rounded-md p-3 sm:max-h-[85vh] sm:w-auto sm:max-w-120 sm:p-4"
      >
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle className="wrap-break-word">
            {t("entrepriseSpace.candidatures.finalOfferTitle", {
              name: candidatNom,
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2 rounded-sm border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FiCalendar className="h-4 w-4 text-primary" />
              {t("entrepriseSpace.candidatures.candidateAvailability")}
            </div>
            {loadingDispos ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
                {t("entrepriseSpace.candidatures.loadingAvailability")}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
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
                          {t(`entrepriseSpace.candidatures.days.${JOUR_KEYS[jour]}`)}
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
                    {t("entrepriseSpace.candidatures.noAvailability")}
                  </p>
                )}
                <p className="pt-1 text-[11px] text-muted-foreground">
                  {t("entrepriseSpace.candidatures.availabilityHelp")}
                </p>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("entrepriseSpace.candidatures.jobTitle")}</Label>
            <Input
              className="h-11 rounded-sm bg-muted/40"
              value={offreTitre || ""}
              readOnly
              disabled
              aria-describedby="offre-finale-titre-help"
            />
            <p
              id="offre-finale-titre-help"
              className="text-[11px] text-muted-foreground"
            >
              {t("entrepriseSpace.candidatures.jobTitleHelp")}
            </p>
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
              placeholder={t(
                "entrepriseSpace.candidatures.objectivesPlaceholder",
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              {t("entrepriseSpace.candidatures.objectivesHelp")}
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

          <div className="space-y-3 rounded-sm border border-border bg-muted/30 p-4">
            <div>
              <Label>{t("entrepriseSpace.candidatures.scheduleTitle")}</Label>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("entrepriseSpace.candidatures.scheduleHelp")}
              </p>
            </div>
            <div className="space-y-2">
              {ORDRE_JOURS.map((jour) => {
                const horaire = form.horairesStage.find(
                  (item) => item.jourSemaine === jour,
                );
                return (
                  <div
                    key={jour}
                    className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2"
                  >
                    <label className="flex min-w-0 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(horaire)}
                        onChange={(event) => {
                          setForm((current) => ({
                            ...current,
                            horairesStage: event.target.checked
                              ? [
                                  ...current.horairesStage,
                                  {
                                    jourSemaine: jour,
                                    heureDebut: "09:00",
                                    heureFin: "17:00",
                                  },
                                ]
                              : current.horairesStage.filter(
                                  (item) => item.jourSemaine !== jour,
                                ),
                          }));
                          setFormError(null);
                        }}
                      />
                      <span>{t(`entrepriseSpace.candidatures.days.${JOUR_KEYS[jour]}`)}</span>
                    </label>
                    <Input
                      type="time"
                      className="min-w-0"
                      aria-label={`${jour} - ${t("entrepriseSpace.candidatures.startTime")}`}
                      disabled={!horaire}
                      value={horaire?.heureDebut || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          horairesStage: current.horairesStage.map((item) =>
                            item.jourSemaine === jour
                              ? { ...item, heureDebut: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                    <Input
                      type="time"
                      className="min-w-0"
                      aria-label={`${jour} - ${t("entrepriseSpace.candidatures.endTime")}`}
                      disabled={!horaire}
                      value={horaire?.heureFin || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          horairesStage: current.horairesStage.map((item) =>
                            item.jourSemaine === jour
                              ? { ...item, heureFin: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
            <p
              className={`text-xs font-medium ${totalHeures === Number(form.volumeHoraireHebdo) ? "text-green-700" : "text-destructive"}`}
            >
              {t("entrepriseSpace.candidatures.scheduleTotal", {
                n: totalHeures,
              })}{" "}
              / {form.volumeHoraireHebdo}h
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("entrepriseSpace.candidatures.duration")}</Label>
              <Select
                value={form.dureeStage}
                onValueChange={(v) => update("dureeStage", v)}
              >
                <SelectTrigger className="h-11 w-full rounded-sm">
                  <SelectValue
                    placeholder={t("entrepriseSpace.candidatures.select")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_mois">
                    {t("entrepriseSpace.candidatures.duration1Month")}
                  </SelectItem>
                  <SelectItem value="2_mois">
                    {t("entrepriseSpace.candidatures.duration2Months")}
                  </SelectItem>
                  <SelectItem value="3_mois">
                    {t("entrepriseSpace.candidatures.duration3Months")}
                  </SelectItem>
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
                  <SelectValue
                    placeholder={t("entrepriseSpace.candidatures.select")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">
                    {t("entrepriseSpace.candidatures.modeRemote")}
                  </SelectItem>
                  <SelectItem value="hybride">
                    {t("entrepriseSpace.candidatures.modeHybrid")}
                  </SelectItem>
                  <SelectItem value="presentiel">
                    {t("entrepriseSpace.candidatures.modeOnsite")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.modeTravail === "distance" && (
            <div className="w-full space-y-1.5">
              <Label htmlFor="lien-reunion-online">
                {t("entrepriseSpace.candidatures.meetingLink")}
              </Label>
              <Input
                id="lien-reunion-online"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder={t(
                  "entrepriseSpace.candidatures.meetingLinkPlaceholder",
                )}
                value={form.lienReunionOnline}
                onChange={(event) => {
                  update("lienReunionOnline", event.target.value);
                  setFormError(null);
                }}
                className="h-11 w-full min-w-0 rounded-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("entrepriseSpace.candidatures.meetingLinkHelp")}
              </p>
            </div>
          )}

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
