"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiVideo,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePlanifierEntretien } from "@/lib/queries/useEntretiens";
import { toast } from "@/lib/store/useToastStore";
import {
  champsVersDateHeure,
  normaliserDateHeurePourApi,
  estDateHeurePassee,
  localeBcp47,
} from "@/lib/entretiens/planification";

const PALETTE_AVATAR = [
  "bg-sky-500",
  "bg-orange-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-600",
  "bg-indigo-500",
];

function couleurAvatar(nom) {
  let hash = 0;
  for (let i = 0; i < nom.length; i++)
    hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE_AVATAR[Math.abs(hash) % PALETTE_AVATAR.length];
}

function CandidatAvatar({ nom, photoUrl }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL API dynamique
      <img
        src={photoUrl}
        alt={nom}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }
  const initiales = nom
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${couleurAvatar(nom)}`}
    >
      {initiales}
    </div>
  );
}

/** Flag temporaire — réactiver le mode téléphone quand l'appel InternIn sera prêt */
const MODE_TELEPHONE_DISPONIBLE = false;

function getModes(t) {
  return [
    {
      valeur: "video",
      label: t("entrepriseSpace.candidatures.modeVideo"),
      description: t("entrepriseSpace.candidatures.modeVideoDesc"),
      Icon: FiVideo,
      disabled: false,
    },
    {
      valeur: "telephone",
      label: t("entrepriseSpace.candidatures.modePhone"),
      description: t("interviews.modes.phoneUnavailableDescription"),
      Icon: FiPhone,
      disabled: !MODE_TELEPHONE_DISPONIBLE,
      badge: t("interviews.modes.phoneComingSoon"),
    },
    {
      valeur: "presentiel",
      label: t("entrepriseSpace.candidatures.modeOnsite"),
      description: t("entrepriseSpace.candidatures.modeOnsiteDesc"),
      Icon: FiMapPin,
      disabled: false,
    },
  ];
}

function getChampConfig(mode, t) {
  if (mode === "video") {
    return {
      label: t("entrepriseSpace.candidatures.fieldVideoLink"),
      Icon: FiVideo,
      placeholder: t("entrepriseSpace.candidatures.fieldVideoPlaceholder"),
      aide: t("entrepriseSpace.candidatures.fieldVideoHelp"),
      type: "url",
      obligatoire: true,
    };
  }
  if (mode === "telephone") {
    return {
      label: t("entrepriseSpace.candidatures.fieldPhone"),
      Icon: FiPhone,
      placeholder: t("entrepriseSpace.candidatures.fieldPhonePlaceholder"),
      aide: t("entrepriseSpace.candidatures.fieldPhoneHelp"),
      type: "tel",
      obligatoire: false,
    };
  }
  return {
    label: t("entrepriseSpace.candidatures.fieldAddress"),
    Icon: FiMapPin,
    placeholder: t("entrepriseSpace.candidatures.fieldAddressPlaceholder"),
    aide: t("entrepriseSpace.candidatures.fieldAddressHelp"),
    type: "text",
    obligatoire: true,
  };
}

function validerChampLienTraduit(mode, valeur, t) {
  const v = (valeur || "").trim();

  if (mode === "video") {
    if (!v) {
      return {
        valide: false,
        message: t("entrepriseSpace.candidatures.errVideoRequired"),
      };
    }
    try {
      const url = new URL(v);
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          valide: false,
          message: t("entrepriseSpace.candidatures.errInvalidUrl"),
        };
      }
      return { valide: true, message: "" };
    } catch {
      return {
        valide: false,
        message: t("entrepriseSpace.candidatures.errInvalidUrl"),
      };
    }
  }

  if (mode === "telephone") {
    if (!v) return { valide: true, message: "" };
    const chiffres = v.replace(/[^\d]/g, "");
    if (chiffres.length < 8 || !/^[\d+\s().-]+$/.test(v)) {
      return {
        valide: false,
        message: t("entrepriseSpace.candidatures.errInvalidPhone"),
      };
    }
    return { valide: true, message: "" };
  }

  if (!v || v.length < 5) {
    return {
      valide: false,
      message: t("entrepriseSpace.candidatures.errAddressRequired"),
    };
  }
  return { valide: true, message: "" };
}

function formatDateLongueLocale(date, heure, locale) {
  const iso = champsVersDateHeure(date, heure);
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return "";
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0);
  if (Number.isNaN(d.getTime())) return "";
  const loc = localeBcp47(locale);
  const jour = d.toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return jour.charAt(0).toUpperCase() + jour.slice(1);
}

export default function PlanifierEntretienDialog({
  idCandidature,
  candidatNom,
  candidatPhoto = null,
  offreTitre = "",
  openControlled,
  onOpenChangeControlled,
  hideTrigger = false,
}) {
  const { t, locale } = useTranslation();
  const [openInterne, setOpenInterne] = useState(false);
  const open = openControlled !== undefined ? openControlled : openInterne;
  const setOpen = onOpenChangeControlled || setOpenInterne;

  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [modeEntretien, setModeEntretien] = useState("video");

  // Mode téléphone temporairement gelé : ne jamais le laisser sélectionné
  useEffect(() => {
    if (!MODE_TELEPHONE_DISPONIBLE && modeEntretien === "telephone") {
      setModeEntretien("video");
    }
  }, [modeEntretien]);
  const [lienGoogleMeet, setLienGoogleMeet] = useState("");
  const [erreurLien, setErreurLien] = useState("");
  const [erreurDate, setErreurDate] = useState("");
  const [tentativeEnvoi, setTentativeEnvoi] = useState(false);

  const mutation = usePlanifierEntretien();
  const reduceMotion = useReducedMotion();

  const modes = getModes(t);
  const champConfig = getChampConfig(modeEntretien, t);
  const dateHeureIso = champsVersDateHeure(date, heure);
  const dateHeureValide = !!date && !!heure && !estDateHeurePassee(date, heure);

  function resetFormulaire() {
    setDate("");
    setHeure("");
    setModeEntretien("video");
    setLienGoogleMeet("");
    setErreurLien("");
    setErreurDate("");
    setTentativeEnvoi(false);
    mutation.reset();
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
    if (!nextOpen) resetFormulaire();
  }

  function validerFormulaire() {
    let ok = true;
    if (!date || !heure) {
      setErreurDate(t("entrepriseSpace.candidatures.scheduleDateRequired"));
      ok = false;
    } else if (estDateHeurePassee(date, heure)) {
      setErreurDate(t("entrepriseSpace.candidatures.schedulePastDate"));
      ok = false;
    } else {
      setErreurDate("");
    }

    const { valide, message } = validerChampLienTraduit(
      modeEntretien,
      lienGoogleMeet,
      t,
    );
    if (!valide) {
      setErreurLien(message);
      ok = false;
    } else {
      setErreurLien("");
    }

    return ok;
  }

  function handleSubmit() {
    setTentativeEnvoi(true);
    if (!validerFormulaire()) return;

    // Garde-fou : le mode téléphone est temporairement indisponible
    const modeFinal =
      modeEntretien === "telephone" && !MODE_TELEPHONE_DISPONIBLE
        ? "video"
        : modeEntretien;
    if (modeFinal !== modeEntretien) {
      setModeEntretien(modeFinal);
      toast.info(`${t("interviews.modes.phoneUnavailableTitle")}. ${t("interviews.modes.phoneUnavailableDescription")}`);
      return;
    }

    mutation.mutate(
      {
        idCandidature,
        dateHeure: normaliserDateHeurePourApi(dateHeureIso),
        modeEntretien: modeFinal,
        lienGoogleMeet,
      },
      {
        onSuccess: () => {
          toast.success(t("entrepriseSpace.candidatures.scheduleSuccess"));
          handleOpenChange(false);
        },
      },
    );
  }

  const transitionRapide = {
    duration: reduceMotion ? 0 : 0.18,
    ease: "easeOut",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-sm"
          >
            <FiCalendar className="h-4 w-4" />
            {t("entrepriseSpace.candidatures.scheduleInterview")}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(92vh,720px)] w-[min(100vw-1.25rem,34rem)] max-w-[min(100vw-1.25rem,34rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:w-[min(100vw-2rem,36rem)] sm:max-w-[min(100vw-2rem,36rem)]"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <CandidatAvatar nom={candidatNom} photoUrl={candidatPhoto} />
            <div className="min-w-0">
              <DialogHeader className="items-start space-y-0 text-left">
                <DialogTitle className="truncate text-base font-semibold text-foreground">
                  {candidatNom}
                </DialogTitle>
              </DialogHeader>
              {offreTitre && (
                <p className="truncate text-sm text-muted-foreground">
                  {offreTitre}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label={t("entrepriseSpace.candidatures.close")}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* BODY — scroll vertical uniquement */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-5">
            {/* Date et heure */}
            <section aria-labelledby="section-date-heure">
              <h4
                id="section-date-heure"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <FiCalendar className="h-4 w-4 shrink-0 text-primary" />
                {t("entrepriseSpace.candidatures.dateAndTime")}
              </h4>
              <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="entretien-date">
                    {t("entrepriseSpace.candidatures.date")}
                  </Label>
                  <Input
                    id="entretien-date"
                    type="date"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setErreurDate("");
                    }}
                    aria-invalid={tentativeEnvoi && !!erreurDate}
                    className="h-11 w-full min-w-0 rounded-lg"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="entretien-heure">
                    {t("entrepriseSpace.candidatures.time")}
                  </Label>
                  <Input
                    id="entretien-heure"
                    type="time"
                    value={heure}
                    onChange={(e) => {
                      setHeure(e.target.value);
                      setErreurDate("");
                    }}
                    aria-invalid={tentativeEnvoi && !!erreurDate}
                    className="h-11 w-full min-w-0 rounded-lg"
                  />
                </div>
              </div>

              {dateHeureValide && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                  <FiClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="break-words">
                    {formatDateLongueLocale(date, heure, locale)} · {heure}
                  </span>
                </p>
              )}

              {tentativeEnvoi && erreurDate && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                  <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{erreurDate}</span>
                </p>
              )}
            </section>

            {/* Mode */}
            <section aria-labelledby="section-mode">
              <h4
                id="section-mode"
                className="mb-3 text-sm font-semibold text-foreground"
              >
                {t("entrepriseSpace.candidatures.interviewMode")}
              </h4>
              <div
                role="radiogroup"
                aria-labelledby="section-mode"
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {modes.map((m) => {
                  const selectionne = modeEntretien === m.valeur && !m.disabled;
                  const indisponible = !!m.disabled;
                  return (
                    <button
                      key={m.valeur}
                      type="button"
                      role="radio"
                      aria-checked={selectionne}
                      aria-disabled={indisponible}
                      tabIndex={0}
                      title={
                        indisponible
                          ? t("interviews.modes.phoneUnavailableDescription")
                          : undefined
                      }
                      aria-label={
                        indisponible
                          ? `${m.label} — ${t("interviews.modes.phoneUnavailableTitle")}`
                          : m.label
                      }
                      onClick={() => {
                        if (indisponible) {
                          toast.info(
                            `${t("interviews.modes.phoneUnavailableTitle")}. ${t("interviews.modes.phoneUnavailableDescription")}`,
                          );
                          return;
                        }
                        setModeEntretien(m.valeur);
                        setErreurLien("");
                      }}
                      onKeyDown={(e) => {
                        if (!indisponible) return;
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          toast.info(
                            `${t("interviews.modes.phoneUnavailableTitle")}. ${t("interviews.modes.phoneUnavailableDescription")}`,
                          );
                        }
                      }}
                      className={`relative flex min-w-0 flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        indisponible
                          ? "cursor-not-allowed border-border/60 bg-muted/40 opacity-60"
                          : selectionne
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03]"
                      }`}
                    >
                      {indisponible && m.badge ? (
                        <span className="absolute right-2 top-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {m.badge}
                        </span>
                      ) : null}
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          selectionne
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <m.Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`text-sm font-semibold leading-tight ${
                          selectionne
                            ? "text-primary"
                            : indisponible
                              ? "text-muted-foreground"
                              : "text-foreground"
                        }`}
                      >
                        {m.label}
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {m.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Champ dynamique */}
            <section aria-labelledby="section-info-rdv">
              <AnimatePresence mode="wait">
                <motion.div
                  key={modeEntretien}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                  transition={transitionRapide}
                  className="min-w-0 space-y-1.5"
                >
                  <Label
                    id="section-info-rdv"
                    htmlFor="entretien-champ-lien"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <champConfig.Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span>{champConfig.label}</span>
                    {champConfig.obligatoire ? (
                      <span className="text-destructive">*</span>
                    ) : (
                      <span className="text-muted-foreground">
                        ({t("entrepriseSpace.candidatures.optional")})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="entretien-champ-lien"
                    type={champConfig.type}
                    placeholder={champConfig.placeholder}
                    value={lienGoogleMeet}
                    onChange={(e) => {
                      setLienGoogleMeet(e.target.value);
                      setErreurLien("");
                    }}
                    aria-invalid={!!erreurLien}
                    className="h-11 w-full min-w-0 rounded-lg"
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {champConfig.aide}
                  </p>
                  {erreurLien && (
                    <p className="flex items-start gap-1.5 text-xs text-destructive">
                      <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{erreurLien}</span>
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>

            {/* Récapitulatif */}
            <AnimatePresence>
              {dateHeureValide && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={transitionRapide}
                  className="overflow-hidden rounded-lg border border-border bg-muted/40 p-3.5"
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("entrepriseSpace.candidatures.interviewSummary")}
                  </p>
                  <div className="space-y-1.5 text-sm text-foreground">
                    <p className="flex items-start gap-1.5">
                      <FiCalendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="break-words">
                        {formatDateLongueLocale(date, heure, locale)}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <FiClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {heure}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <champConfig.Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {
                        modes.find((m) => m.valeur === modeEntretien)?.label
                      }
                    </p>
                    {lienGoogleMeet.trim() && !erreurLien && (
                      <p className="break-all pl-5 text-muted-foreground">
                        {lienGoogleMeet.trim()}
                      </p>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {mutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">
                  {mutation.error?.message ||
                    t("entrepriseSpace.candidatures.scheduleError")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-4 py-3.5 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
            className="rounded-lg"
          >
            {t("entrepriseSpace.candidatures.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="min-w-0 rounded-lg sm:min-w-[10rem]"
          >
            {mutation.isPending ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                {t("entrepriseSpace.candidatures.scheduling")}
              </>
            ) : (
              <>
                <FiCheck className="h-4 w-4" />
                {t("entrepriseSpace.candidatures.confirmInterview")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
