"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiFileText } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";

const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};

const schema = z.object({
  titreProfessionnel: z.string().max(150).optional(),
  presentation: z.string().optional(),
  objectifProfessionnel: z.string().optional(),
  dureeStageSouhaitee: z.string().optional(),
  dateDebutSouhaitee: z.string().optional(),
});

export default function ProfilProfessionnelSection({ profil }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateProfile = useUpdateStagiaireProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      titreProfessionnel: profil.titreProfessionnel || "",
      presentation: profil.presentation || "",
      objectifProfessionnel: profil.objectifProfessionnel || "",
      dureeStageSouhaitee: profil.dureeStageSouhaitee || "",
      dateDebutSouhaitee: profil.dateDebutSouhaitee || "",
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

  const villes = (profil.villesRecherchees || []).join(", ");

  return (
    <>
      <ProfilSectionCard
        title={t("stagiaireSpace.profile.professional")}
        icon={FiFileText}
        onEdit={() => setOpen(true)}
      >
        <div className="space-y-3">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("stagiaireSpace.profile.professionalTitle")}
            </dt>
            <dd className="text-sm text-foreground">
              {profil.titreProfessionnel || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("stagiaireSpace.profile.personalPresentation")}
            </dt>
            <dd className="text-sm text-foreground">
              {profil.presentation || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("stagiaireSpace.profile.careerObjective")}
            </dt>
            <dd className="text-sm text-foreground">
              {profil.objectifProfessionnel || "—"}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("stagiaireSpace.profile.internshipTypeSought")}
              </dt>
              <dd className="text-sm text-foreground">
                {(t(`stagiaireSpace.profile.duration.${profil.dureeStageSouhaitee}`) || profil.dureeStageSouhaitee) || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("stagiaireSpace.profile.availability")}</dt>
              <dd className="text-sm text-foreground">
                {profil.dateDebutSouhaitee
                  ? `${t("stagiaireSpace.profile.fromDate")} ${profil.dateDebutSouhaitee}`
                  : "—"}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("stagiaireSpace.profile.desiredLocation")}
            </dt>
            <dd className="text-sm text-foreground">{villes || "—"}</dd>
          </div>
        </div>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stagiaireSpace.profile.professional")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titreProfessionnel">{t("stagiaireSpace.profile.professionalTitle")}</Label>
              <Input
                id="titreProfessionnel"
                placeholder={t("stagiaireSpace.profile.professionalTitlePlaceholder")}
                {...register("titreProfessionnel")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="presentation">{t("stagiaireSpace.profile.personalPresentation")}</Label>
              <Textarea
                id="presentation"
                rows={4}
                {...register("presentation")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="objectifProfessionnel">{t("stagiaireSpace.profile.careerObjective")}</Label>
              <Textarea
                id="objectifProfessionnel"
                rows={3}
                {...register("objectifProfessionnel")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("stagiaireSpace.profile.internshipTypeSought")}</Label>
              <Controller
                name="dureeStageSouhaitee"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("stagiaireSpace.profile.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DUREE_LABELS).map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`stagiaireSpace.profile.duration.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateDebutSouhaitee">{t("stagiaireSpace.profile.availableFrom")}</Label>
              <Input
                id="dateDebutSouhaitee"
                type="date"
                {...register("dateDebutSouhaitee")}
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
