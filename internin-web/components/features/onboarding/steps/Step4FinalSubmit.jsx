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

const JOURS = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
  { value: "dimanche", label: "Dimanche" },
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
              ? "Profil complété !"
              : "Profil enregistré — complétez-le pour débloquer toutes les fonctionnalités",
          );
          router.push("/tableau-de-bord");
        } catch (err) {
          toast.error(err.message || "Impossible de finaliser l'onboarding");
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
                  {j.label}
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
          <Label>Heure début</Label>
          <Input
            type="time"
            className="h-12 rounded-sm"
            {...register("heureDebutDisponible")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Heure fin</Label>
          <Input
            type="time"
            className="h-12 rounded-sm"
            {...register("heureFinDisponible")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Durée de stage souhaitée</Label>
        <Controller
          name="dureeStageSouhaitee"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {[
                { value: "1_mois", label: "1 mois" },
                { value: "2_mois", label: "2 mois" },
                { value: "3_mois", label: "3 mois" },
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
          <Label>Heures / semaine</Label>
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
        <Label htmlFor="dateDebutSouhaitee">Date de début souhaitée</Label>
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
          onClick={() => router.push("/onboarding/3")}
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
            "Terminer mon inscription"
          )}
        </Button>
      </div>
    </form>
  );
}
