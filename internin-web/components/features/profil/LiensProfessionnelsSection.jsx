"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiGithub, FiLinkedin, FiGlobe, FiLink } from "react-icons/fi";
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
import { safeHref } from "@/lib/utils/urlValidation";

const LIENS = [
  { key: "githubUrl", labelKey: "github", icon: FiGithub },
  { key: "linkedinUrl", labelKey: "linkedin", icon: FiLinkedin },
  { key: "portfolioUrl", labelKey: "portfolio", icon: FiLink },
  { key: "siteWebUrl", labelKey: "website", icon: FiGlobe },
];

export default function LiensProfessionnelsSection({ profil }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateProfile = useUpdateStagiaireProfile();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    values: {
      githubUrl: profil.githubUrl || "",
      linkedinUrl: profil.linkedinUrl || "",
      portfolioUrl: profil.portfolioUrl || "",
      siteWebUrl: profil.siteWebUrl || "",
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

  return (
    <>
      <ProfilSectionCard
        title={t("stagiaireSpace.profile.links")}
        icon={FiLink}
        onEdit={() => setOpen(true)}
      >
        <div className="space-y-1">
          {LIENS.map(({ key, labelKey, icon: Icon }) => {
            const href = safeHref(profil[key]);
            return href ? (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-sm text-primary transition-all duration-150 hover:translate-x-0.5 hover:bg-primary/5"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate group-hover:underline">
                  {profil[key]}
                </span>
              </a>
            ) : (
              <div
                key={key}
                className="flex items-center gap-2.5 px-1.5 py-1.5 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {t(`stagiaireSpace.profile.linksSection.${labelKey}`)} — {t("stagiaireSpace.profile.notProvided")}
              </div>
            );
          })}
        </div>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stagiaireSpace.profile.links")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {LIENS.map(({ key, labelKey }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{t(`stagiaireSpace.profile.linksSection.${labelKey}`)}</Label>
                <Input id={key} placeholder="https://" {...register(key)} />
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {t("stagiaireSpace.profile.save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}