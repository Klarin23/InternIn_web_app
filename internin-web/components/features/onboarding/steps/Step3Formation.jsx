"use client";
// Étape 3 : cursus académique. useFieldArray gère la liste dynamique
// de formations (relation 1-n avec la table `formations`), permettant
// d'ajouter/retirer des entrées sans re-render manuel de tableau.

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
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
import { step3Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

const EMPTY_FORMATION = {
  typeFormation: undefined,
  nomUniversite: "",
  faculte: "",
  departement: "",
  diplome: "",
  anneeEtude: "",
  anneeObtention: "",
};

export default function Step3Formation() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data, saveStepData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      formations: data.formations?.length ? data.formations : [EMPTY_FORMATION],
    },
  });

  // Gère l'ajout/suppression dynamique d'entrées dans le tableau "formations"
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formations",
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/4");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          {t("auditUi.onboarding.academicPath")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auditUi.onboarding.academicPathDescription")}
        </p>
      </div>

      {fields.map((field, index) => {
        // Lit en temps réel le type sélectionné pour cette entrée précise,
        // afin d'afficher le bon champ d'année (étude en cours vs obtenue)
        // eslint-disable-next-line react-hooks/incompatible-library
        const typeFormation = watch(`formations.${index}.typeFormation`);

        return (
          <div
            key={field.id}
            className="space-y-4 rounded-md border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-foreground">
                {t("auditUi.onboarding.formation", { n: index + 1 })}
              </h5>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t("auditUi.onboarding.removeFormation")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("auditUi.onboarding.status")}</Label>
              <Controller
                name={`formations.${index}.typeFormation`}
                control={control}
                render={({ field: selectField }) => (
                  <Select
                    value={selectField.value}
                    onValueChange={selectField.onChange}
                  >
                    <SelectTrigger className="h-12 w-full rounded-sm">
                      <SelectValue
                        placeholder={t(
                          "auditUi.onboarding.formationStatusPlaceholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_cours">
                        {t("auditUi.onboarding.formationInProgress")}
                      </SelectItem>
                      <SelectItem value="obtenue">
                        {t("auditUi.onboarding.formationObtained")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.formations?.[index]?.typeFormation && (
                <p className="text-xs text-destructive">
                  {t(errors.formations[index].typeFormation.message)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("auditUi.onboarding.institution")}</Label>
              <Input
                className="h-12 rounded-sm"
                placeholder={t("auditUi.onboarding.institutionPlaceholder")}
                {...register(`formations.${index}.nomUniversite`)}
              />
              {errors.formations?.[index]?.nomUniversite && (
                <p className="text-xs text-destructive">
                  {t(errors.formations[index].nomUniversite.message)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  {t("auditUi.onboarding.faculty")}{" "}
                  <span className="text-muted-foreground">
                    ({t("auditUi.common.optional")})
                  </span>
                </Label>
                <Input
                  className="h-12 rounded-sm"
                  {...register(`formations.${index}.faculte`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("auditUi.onboarding.department")}{" "}
                  <span className="text-muted-foreground">
                    ({t("auditUi.common.optional")})
                  </span>
                </Label>
                <Input
                  className="h-12 rounded-sm"
                  {...register(`formations.${index}.departement`)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("auditUi.onboarding.degree")}</Label>
              <Input
                className="h-12 rounded-sm"
                placeholder={t("auditUi.onboarding.degreePlaceholder")}
                {...register(`formations.${index}.diplome`)}
              />
              {errors.formations?.[index]?.diplome && (
                <p className="text-xs text-destructive">
                  {t(errors.formations[index].diplome.message)}
                </p>
              )}
            </div>

            {/* Champ d'année conditionnel selon le statut sélectionné */}
            {typeFormation === "en_cours" && (
              <div className="space-y-1.5">
                <Label>{t("auditUi.onboarding.currentStudyYear")}</Label>
                <Input
                  type="number"
                  className="h-12 rounded-sm"
                  placeholder={t("auditUi.onboarding.studyYearPlaceholder")}
                  {...register(`formations.${index}.anneeEtude`)}
                />
              </div>
            )}
            {typeFormation === "obtenue" && (
              <div className="space-y-1.5">
                <Label>{t("auditUi.onboarding.graduationYear")}</Label>
                <Input
                  type="number"
                  className="h-12 rounded-sm"
                  placeholder={t(
                    "auditUi.onboarding.graduationYearPlaceholder",
                  )}
                  {...register(`formations.${index}.anneeObtention`)}
                />
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-sm"
        onClick={() => append(EMPTY_FORMATION)}
      >
        <Plus className="h-4 w-4" />
        {t("auditUi.onboarding.addFormation")}
      </Button>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/2")}
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
