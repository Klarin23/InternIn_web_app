"use client";
// Étape 2 : statut académique + rattachement optionnel à une université partenaire.
// La liste des universités est statique pour l'instant (le module backend
// `universites` n'existe pas encore) — remplacée plus tard par un vrai
// appel API une fois ce module construit.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { step2Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

// TODO : remplacer par un appel GET /universites/public une fois le module
// backend "universites" construit (liste des universités vérifiées).
const UNIVERSITES_TEMPORAIRES = [
  { id: "non-rattache", nomKey: "auditUi.onboarding.noPartnerUniversity" },
];

export default function Step2StatutAcademique() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, saveStepData } = useOnboardingStore();

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      statutAcademique: data.statutAcademique || undefined,
      idUniversite: data.idUniversite || "non-rattache",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/3");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("auditUi.onboarding.academicStatus")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.academicStatusDescription")}
        </p>
      </div>

      {/* Choix du statut sous forme de 2 cartes cliquables (RadioGroup stylé) */}
      <div className="space-y-1.5">
        <Label>{t("auditUi.onboarding.status")}</Label>
        <Controller
          name="statutAcademique"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <label
                htmlFor="statut-etudiant"
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 transition ${
                  field.value === "etudiant"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value="etudiant" id="statut-etudiant" />
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {t("auditUi.onboarding.student")}
                </span>
              </label>

              <label
                htmlFor="statut-diplome"
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 transition ${
                  field.value === "jeune_diplome"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value="jeune_diplome" id="statut-diplome" />
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {t("auditUi.onboarding.graduate")}
                </span>
              </label>
            </RadioGroup>
          )}
        />
        {errors.statutAcademique && (
          <p className="text-xs text-destructive">
            {t(errors.statutAcademique.message)}
          </p>
        )}
      </div>

      {/* Rattachement à une université partenaire */}
      <div className="space-y-1.5">
        <Label htmlFor="idUniversite">
          {t("auditUi.onboarding.partnerUniversity")}
        </Label>
        <Controller
          name="idUniversite"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="idUniversite"
                className="h-12 w-full rounded-sm"
              >
                <SelectValue
                  placeholder={t("auditUi.onboarding.universityPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {UNIVERSITES_TEMPORAIRES.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {t(u.nomKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {t("auditUi.onboarding.universityHelp")}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/1")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          {t("auditUi.common.continue")}
        </Button>
      </div>
    </form>
  );
}
