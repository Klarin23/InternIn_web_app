"use client";

import { Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { FormTextField, FormTextareaField } from "../OffreFormFields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  SECTEUR_OPTIONS,
  DEPARTEMENT_OPTIONS,
} from "../offreForm.constants";
import { cn } from "@/lib/utils";

export default function StepInformationsGenerales({
  register,
  control,
  errors,
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {t("entrepriseSpace.offers.stepInfoTitle")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("entrepriseSpace.offers.infoHint")}
        </p>
      </div>

      <FormTextField
        id="titre"
        label={t("entrepriseSpace.offers.jobTitle")}
        placeholder={t("entrepriseSpace.offers.jobTitlePlaceholder")}
        helper={t("entrepriseSpace.offers.titleHelper")}
        registration={register("titre")}
        error={errors.titre?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="secteurActivite"
              className="text-sm font-medium text-foreground"
            >
              {t("entrepriseSpace.offers.sector")}
            </label>
            <Controller
              name="secteurActivite"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="secteurActivite"
                    className={cn(
                      "w-full",
                      errors.secteurActivite && "border-destructive",
                    )}
                    aria-invalid={!!errors.secteurActivite}
                  >
                    <SelectValue
                      placeholder={t("entrepriseSpace.offers.sectorPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTEUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.secteurActivite?.message && (
              <p className="text-xs text-destructive">
                {errors.secteurActivite.message}
              </p>
            )}
          </div>
          <FormTextField
            id="secteurActiviteCustom"
            label={t("entrepriseSpace.offers.sectorCustom")}
            optional
            placeholder={t("entrepriseSpace.offers.sectorCustomPlaceholder")}
            helper={t("entrepriseSpace.offers.sectorCustomHint")}
            registration={register("secteurActiviteCustom")}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="departement"
              className="text-sm font-medium text-foreground"
            >
              {t("entrepriseSpace.offers.department")}
            </label>
            <Controller
              name="departement"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="departement"
                    className={cn(
                      "w-full",
                      errors.departement && "border-destructive",
                    )}
                    aria-invalid={!!errors.departement}
                  >
                    <SelectValue
                      placeholder={t(
                        "entrepriseSpace.offers.departmentPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTEMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.departement?.message && (
              <p className="text-xs text-destructive">
                {errors.departement.message}
              </p>
            )}
          </div>
          <FormTextField
            id="departementCustom"
            label={t("entrepriseSpace.offers.departmentCustom")}
            optional
            placeholder={t(
              "entrepriseSpace.offers.departmentCustomPlaceholder",
            )}
            helper={t("entrepriseSpace.offers.departmentCustomHint")}
            registration={register("departementCustom")}
          />
        </div>
      </div>

      <FormTextareaField
        id="description"
        label={t("entrepriseSpace.offers.description")}
        placeholder={t("entrepriseSpace.offers.descriptionPlaceholder")}
        rows={6}
        registration={register("description")}
        error={errors.description?.message}
      />
    </motion.div>
  );
}
