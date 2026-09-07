"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { FiTarget } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import TagInput from "./TagInput";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";

const MODALITES = [
  { value: "presentiel", label: "Présentiel" },
  { value: "hybride", label: "Hybride" },
  { value: "distance", label: "Distance" },
];

const REMUNERATION_LABELS = {
  aucune: "Aucune",
  indemnite_transport: "Indemnité de transport",
  indemnite_repas: "Indemnité de repas",
  allocation_mensuelle: "Allocation mensuelle",
  indemnite_internet_appel: "Indemnité internet / appel",
};

function Badge({ children }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-primary/5"
    >
      {children}
    </motion.span>
  );
}

export default function PreferencesRechercheSection({ profil }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateProfile = useUpdateStagiaireProfile();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    values: {
      secteursRecherches: profil.secteursRecherches || [],
      villesRecherchees: profil.villesRecherchees || [],
      modalitesTravailSouhaitees: profil.modalitesTravailSouhaitees || [],
      remunerationSouhaitee: profil.remunerationSouhaitee || "",
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

  const modalitesLabels = (profil.modalitesTravailSouhaitees || [])
    .map((m) => t(`stagiaireSpace.profile.modes.${m}`))
    .filter(Boolean);

  return (
    <>
      <ProfilSectionCard
        title={t("stagiaireSpace.profile.preferences")}
        icon={FiTarget}
        onEdit={() => setOpen(true)}
      >
        <div className="space-y-4">
          <div>
            <dt className="mb-1.5 text-xs text-muted-foreground">
              {t("stagiaireSpace.profile.preferencesSection.sectors")}
            </dt>
            {profil.secteursRecherches?.length ? (
              <div className="flex flex-wrap gap-2">
                {profil.secteursRecherches.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            ) : (
              <dd className="text-sm text-foreground">—</dd>
            )}
          </div>
          <div>
            <dt className="mb-1.5 text-xs text-muted-foreground">{t("stagiaireSpace.profile.cities")}</dt>
            {profil.villesRecherchees?.length ? (
              <div className="flex flex-wrap gap-2">
                {profil.villesRecherchees.map((v) => (
                  <Badge key={v}>{v}</Badge>
                ))}
              </div>
            ) : (
              <dd className="text-sm text-foreground">—</dd>
            )}
          </div>
          <div>
            <dt className="mb-1.5 text-xs text-muted-foreground">{t("stagiaireSpace.profile.modality")}</dt>
            {modalitesLabels.length ? (
              <div className="flex flex-wrap gap-2">
                {modalitesLabels.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </div>
            ) : (
              <dd className="text-sm text-foreground">—</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("stagiaireSpace.profile.remunerationType")}
            </dt>
            <dd className="text-sm text-foreground">
              {(profil.remunerationSouhaitee === "aucune" ? t("stagiaireSpace.profile.remunerationNone") : t(`stagiaireSpace.profile.advantages.${profil.remunerationSouhaitee}`)) || REMUNERATION_LABELS[profil.remunerationSouhaitee] || "—"}
            </dd>
          </div>
        </div>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("stagiaireSpace.profile.preferences")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label>{t("stagiaireSpace.profile.preferencesSection.sectors")}</Label>
              <Controller
                name="secteursRecherches"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("stagiaireSpace.profile.preferencesSection.sectorsPlaceholder")}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("stagiaireSpace.profile.cities")}</Label>
              <Controller
                name="villesRecherchees"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("stagiaireSpace.profile.preferencesSection.citiesPlaceholder")}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("stagiaireSpace.profile.workModality")}</Label>
              <Controller
                name="modalitesTravailSouhaitees"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    {MODALITES.map((m) => (
                      <label
                        key={m.value}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={field.value.includes(m.value)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, m.value]
                                : field.value.filter((v) => v !== m.value),
                            )
                          }
                        />
                        {t(`stagiaireSpace.profile.modes.${m.value}`)}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("stagiaireSpace.profile.remunerationType")}</Label>
              <Controller
                name="remunerationSouhaitee"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("stagiaireSpace.profile.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(REMUNERATION_LABELS).map((value) => (
                          <SelectItem key={value} value={value}>
                            {value === "aucune" ? t("stagiaireSpace.profile.remunerationNone") : t(`stagiaireSpace.profile.advantages.${value}`)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {t("stagiaireSpace.profile.save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
