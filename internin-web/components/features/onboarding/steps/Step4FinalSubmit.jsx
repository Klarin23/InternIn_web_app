"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { completeOnboardingRequest } from "@/lib/api/stagiaires";
import { toast } from "@/lib/store/useToastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

const JOURS = [
  { value: "lundi", key: "monday" },
  { value: "mardi", key: "tuesday" },
  { value: "mercredi", key: "wednesday" },
  { value: "jeudi", key: "thursday" },
  { value: "vendredi", key: "friday" },
  { value: "samedi", key: "saturday" },
  { value: "dimanche", key: "sunday" },
];

const schema = z.object({
  joursDisponibles: z.array(z.string()).min(1, "Sélectionnez au moins un jour"),
  heureDebutDisponible: z.string().min(1),
  heureFinDisponible: z.string().min(1),
  dureeStageSouhaitee: z.enum(["1_mois", "2_mois", "3_mois"]),
  heuresHebdoSouhaitees: z.number().min(15).max(40),
  dateDebutSouhaitee: z.string().min(1, "Date requise"),
});

export default function Step4FinalSubmit() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, saveStepData, resetOnboarding } = useOnboardingStore();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      joursDisponibles: data.joursDisponibles || [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
      ],
      heureDebutDisponible: data.heureDebutDisponible || "08:00",
      heureFinDisponible: data.heureFinDisponible || "17:00",
      dureeStageSouhaitee: data.dureeStageSouhaitee || "3_mois",
      heuresHebdoSouhaitees: data.heuresHebdoSouhaitees || 35,
      dateDebutSouhaitee: data.dateDebutSouhaitee || "",
    },
  });

  const onSubmit = async (values) => {
    saveStepData(values);

    const payload = {
      ...data,
      ...values,
      statutAcademique: data.statutAcademique || "etudiant",
      competences: data.competences || [],
      centresInteret: data.centresInteret || [],
      objectifsDeveloppement: data.objectifsDeveloppement || [],
    };

    try {
      const result = await completeOnboardingRequest(payload, token);

      // Toujours prendre le statut renvoyé par l'API (score → actif/inactif)
      // Ne JAMAIS forcer "actif" côté client
      const statutCompte = result?.stagiaire?.statutCompte || "inactif";

      setSession(
        {
          ...user,
          statutCompte,
        },
        token,
      );

      resetOnboarding();
      router.push("/tableau-de-bord");
      toast.success(
        statutCompte === "actif"
          ? t("auditUi.onboarding.profileCompleted")
          : t("auditUi.onboarding.profileSavedIncomplete"),
      );
      router.push("/tableau-de-bord");
    } catch (err) {
      toast.error(err.message || t("auditUi.onboarding.finalizationError"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Disponibilités & stage
        </h1>
        <p className="text-sm text-muted-foreground">
          Dernière étape : indiquez quand vous êtes disponible.
        </p>
      </div>

      <Controller
        name="joursDisponibles"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {JOURS.map((j) => {
              const active = field.value?.includes(j.value);
              return (
                <button
                  key={j.value}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? field.value.filter((v) => v !== j.value)
                      : [...(field.value || []), j.value];
                    field.onChange(next);
                  }}
                  className={`rounded-sm border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t(`auditUi.onboarding.days.${j.key}`)}
                </button>
              );
            })}
          </div>
        )}
      />
      {errors.joursDisponibles && (
        <p className="text-xs text-destructive">
          {errors.joursDisponibles.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("auditUi.onboarding.startTime")}</Label>
          <Input
            type="time"
            className="h-12 rounded-sm"
            {...register("heureDebutDisponible")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("auditUi.onboarding.endTime")}</Label>
          <Input
            type="time"
            className="h-12 rounded-sm"
            {...register("heureFinDisponible")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("auditUi.onboarding.desiredDuration")}</Label>
        <Controller
          name="dureeStageSouhaitee"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {[
                { value: "1_mois", label: t("auditUi.common.oneMonth") },
                { value: "2_mois", label: t("auditUi.common.twoMonths") },
                { value: "3_mois", label: t("auditUi.common.threeMonths") },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={`rounded-sm border px-4 py-2 text-sm font-medium ${
                    field.value === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("auditUi.onboarding.hoursPerWeek")}</Label>
          <Controller
            name="heuresHebdoSouhaitees"
            control={control}
            render={({ field }) => (
              <span className="text-sm font-semibold text-primary">
                {field.value}h
              </span>
            )}
          />
        </div>
        <Controller
          name="heuresHebdoSouhaitees"
          control={control}
          render={({ field }) => (
            <Slider
              min={15}
              max={40}
              step={5}
              value={[field.value]}
              onValueChange={([val]) => field.onChange(val)}
            />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dateDebutSouhaitee">
          {t("auditUi.onboarding.desiredStartDate")}
        </Label>
        <Input
          id="dateDebutSouhaitee"
          type="date"
          className="h-12 rounded-sm"
          {...register("dateDebutSouhaitee")}
        />
        {errors.dateDebutSouhaitee && (
          <p className="text-xs text-destructive">
            {errors.dateDebutSouhaitee.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/9")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi…
            </>
          ) : (
            t("auditUi.onboarding.finishRegistration")
          )}
        </Button>
      </div>
    </form>
  );
}
