"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";

export default function InfosPersonnellesSection({ profil }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        prenom: z.string().min(1, t("stagiaireSpace.profile.validation.firstNameRequired")),
        nom: z.string().min(1, t("stagiaireSpace.profile.validation.lastNameRequired")),
        telephone: z.string().min(6, t("stagiaireSpace.profile.validation.phoneInvalid")),
        ville: z.string().min(1, t("stagiaireSpace.profile.validation.cityRequired")),
        pays: z.string().min(1, t("stagiaireSpace.profile.validation.countryRequired")),
      }),
    [t],
  );
  const updateProfile = useUpdateStagiaireProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      prenom: profil.prenom || "",
      nom: profil.nom || "",
      telephone: profil.telephone || "",
      ville: profil.ville || "",
      pays: profil.pays || "",
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

  return (
    <>
      <ProfilSectionCard
        title={t("stagiaireSpace.profile.personalInfo")}
        icon={FiUser}
        onEdit={() => setOpen(true)}
      >
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">{t("stagiaireSpace.profile.email")}</dt>
            <dd className="text-sm text-foreground">{profil.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("stagiaireSpace.profile.phone")}</dt>
            <dd className="text-sm text-foreground">{profil.telephone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("stagiaireSpace.profile.city")}</dt>
            <dd className="text-sm text-foreground">{profil.ville}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("stagiaireSpace.profile.country")}</dt>
            <dd className="text-sm text-foreground">{profil.pays}</dd>
          </div>
        </dl>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stagiaireSpace.profile.personalInfo")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">{t("stagiaireSpace.profile.firstName")}</Label>
                <Input id="prenom" {...register("prenom")} />
                {errors.prenom && (
                  <p className="text-xs text-destructive">
                    {errors.prenom.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">{t("stagiaireSpace.profile.lastName")}</Label>
                <Input id="nom" {...register("nom")} />
                {errors.nom && (
                  <p className="text-xs text-destructive">
                    {errors.nom.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone">{t("stagiaireSpace.profile.phone")}</Label>
              <Input id="telephone" {...register("telephone")} />
              {errors.telephone && (
                <p className="text-xs text-destructive">
                  {errors.telephone.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ville">{t("stagiaireSpace.profile.city")}</Label>
                <Input id="ville" {...register("ville")} />
                {errors.ville && (
                  <p className="text-xs text-destructive">
                    {errors.ville.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pays">{t("stagiaireSpace.profile.country")}</Label>
                <Input id="pays" {...register("pays")} />
                {errors.pays && (
                  <p className="text-xs text-destructive">
                    {errors.pays.message}
                  </p>
                )}
              </div>
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
