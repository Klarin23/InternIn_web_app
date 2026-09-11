"use client";
// Étape 4 : contact principal de l'entreprise. Ce contact sera automatiquement
// marqué "est_contact_principal = true" côté backend lors de la création
// (cf. stagiaires.service.js — même logique de transaction qu'on écrira
// pour entreprises.service.js au moment du récapitulatif).

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { entrepriseStep4Schema } from "@/lib/schemas/onboardingEntreprise.schema";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EntrepriseStep4Contact() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingEntrepriseStore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrepriseStep4Schema),
    defaultValues: {
      contactNom: data.contactNom || "",
      contactFonction: data.contactFonction || "",
      contactEmail: data.contactEmail || "",
      contactTelephone: data.contactTelephone || "",
      peutEtreSuperviseur: data.peutEtreSuperviseur ?? true,
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/5");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <User className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("auditUi.onboarding.entrepriseOnboarding.step4.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.entrepriseOnboarding.step4.description")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactNom">{t("auditUi.onboarding.entrepriseOnboarding.step4.fullName")}</Label>
        <Input
          id="contactNom"
          className="h-12 rounded-sm"
          {...register("contactNom")}
        />
        {errors.contactNom && (
          <p className="text-xs text-destructive">
            {errors.contactNom.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactFonction">{t("auditUi.onboarding.entrepriseOnboarding.step4.function")}</Label>
        <Input
          id="contactFonction"
          placeholder={t("auditUi.onboarding.entrepriseOnboarding.step4.functionPlaceholder")}
          className="h-12 rounded-sm"
          {...register("contactFonction")}
        />
        {errors.contactFonction && (
          <p className="text-xs text-destructive">
            {errors.contactFonction.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">{t("auditUi.onboarding.entrepriseOnboarding.step4.professionalEmail")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="contactEmail"
            type="email"
            className="h-12 rounded-sm pl-10"
            {...register("contactEmail")}
          />
        </div>
        {errors.contactEmail && (
          <p className="text-xs text-destructive">
            {errors.contactEmail.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactTelephone">{t("auditUi.onboarding.entrepriseOnboarding.step4.phone")}</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="contactTelephone"
            type="tel"
            placeholder={t("auditUi.onboarding.entrepriseOnboarding.step4.phonePlaceholder")}
            className="h-12 rounded-sm pl-10"
            {...register("contactTelephone")}
          />
        </div>
        {errors.contactTelephone && (
          <p className="text-xs text-destructive">
            {errors.contactTelephone.message}
          </p>
        )}
      </div>

      <label className="flex items-start gap-2.5 text-sm text-foreground">
        <Controller
          name="peutEtreSuperviseur"
          control={control}
          render={({ field }) => (
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <span>
          {t("auditUi.onboarding.entrepriseOnboarding.step4.canSupervise")}
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t("auditUi.onboarding.entrepriseOnboarding.step4.canSuperviseHelp")}
          </span>
        </span>
      </label>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/3")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{t("auditUi.common.back")}</span>
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
