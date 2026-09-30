"use client";
// Étape 2 : statut académique + rattachement optionnel à une université partenaire.
// La liste des universités est statique pour l'instant (le module backend
// `universites` n'existe pas encore) — remplacée plus tard par un vrai
// appel API une fois ce module construit.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { step2Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Step2StatutAcademique() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, saveStepData } = useOnboardingStore();
  const [invitationToken, setInvitationToken] = useState(
    data.rattachementInvitationToken || "",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("internin_universite_invitation");
    if (token && !data.rattachementInvitationToken) {
      setInvitationToken(token);
      saveStepData({ rattachementInvitationToken: token });
    }
  }, [data.rattachementInvitationToken, saveStepData]);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      statutAcademique: data.statutAcademique || undefined,
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

      {/* Rattachement sécurisé : aucune sélection d'université ne devient
          un rattachement confirmé. Une invitation vérifiée est la preuve. */}
      <div className="space-y-3 rounded-md border border-border bg-card p-4">
        <div>
          <Label>{t("universityLinking.onboarding.title")}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("universityLinking.onboarding.description")}
          </p>
        </div>

        {invitationToken ? (
          <div className="flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            <p className="text-sm font-medium text-foreground">
              {t("universityLinking.onboarding.invitationDetected")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("universityLinking.onboarding.noInvitation")}
          </p>
        )}
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
