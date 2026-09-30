"use client";
// Étape 1 : informations générales de l'université.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiHome, FiMail } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";
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
import { universiteStep1Schema } from "@/lib/schemas/onboardingUniversite.schema";
import { useOnboardingUniversiteStore } from "@/lib/store/useOnboardingUniversiteStore";

const TYPES_ETABLISSEMENT = [
  { value: "Université publique", labelKey: "types.publicUniversity" },
  { value: "Université privée", labelKey: "types.privateUniversity" },
  { value: "Grande École", labelKey: "types.grandeEcole" },
  { value: "Institut Supérieur", labelKey: "types.higherInstitute" },
  { value: "Centre de formation professionnelle", labelKey: "types.vocationalTrainingCenter" },
  { value: "Autre", labelKey: "types.other" },
];

const PAYS = [
  { value: "Cameroun", labelKey: "countries.cameroon" },
];

export default function UniversiteStep1Infos() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingUniversiteStore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(universiteStep1Schema),
    defaultValues: {
      nomUniversite: data.nomUniversite || "",
      emailOfficiel: data.emailOfficiel || "",
      typeEtablissement: data.typeEtablissement || undefined,
      pays: "Cameroun",
      nombreEtudiants: data.nombreEtudiants || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/2");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-muted text-foreground">
          <FiHome className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("onboardingUniversite.step1.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboardingUniversite.step1.description")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nomUniversite">{t("onboardingUniversite.step1.institutionName")}</Label>
        <Input
          id="nomUniversite"
          className="h-12 rounded-sm"
          {...register("nomUniversite")}
        />
        {errors.nomUniversite && (
          <p className="text-xs text-destructive">
            {errors.nomUniversite.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="emailOfficiel">{t("onboardingUniversite.step1.officialEmail")}</Label>
        <div className="relative">
          <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="emailOfficiel"
            type="email"
            placeholder={t("onboardingUniversite.step1.emailPlaceholder")}
            className="h-12 rounded-sm pl-10"
            {...register("emailOfficiel")}
          />
        </div>
        {errors.emailOfficiel && (
          <p className="text-xs text-destructive">
            {errors.emailOfficiel.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="typeEtablissement">{t("onboardingUniversite.step1.institutionType")}</Label>
        <Controller
          name="typeEtablissement"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="typeEtablissement"
                className="h-12 w-full rounded-sm"
              >
                <SelectValue placeholder={t("onboardingUniversite.step1.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {TYPES_ETABLISSEMENT.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(`onboardingUniversite.step1.${type.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.typeEtablissement && (
          <p className="text-xs text-destructive">
            {errors.typeEtablissement.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pays">{t("onboardingUniversite.step1.country")}</Label>
          <Controller
            name="pays"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="pays" className="h-12 w-full rounded-sm">
                  <SelectValue
                    placeholder={t("onboardingUniversite.step1.countryPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {PAYS.map((pays) => (
                    <SelectItem key={pays.value} value={pays.value}>
                      {t(`onboardingUniversite.step1.${pays.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.pays && (
            <p className="text-xs text-destructive">{errors.pays.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nombreEtudiants">
            {t("onboardingUniversite.step1.studentCount")} {" "}
            <span className="text-muted-foreground">({t("onboardingUniversite.step1.optional")})</span>
          </Label>
          <Input
            id="nombreEtudiants"
            type="number"
            className="h-12 rounded-sm"
            {...register("nombreEtudiants")}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-sm"
      >
        {t("onboardingUniversite.step1.continue")}
      </Button>
    </form>
  );
}
