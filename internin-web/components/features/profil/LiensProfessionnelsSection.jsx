"use client";

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

const LIENS = [
  { key: "githubUrl", label: "GitHub", icon: FiGithub },
  { key: "linkedinUrl", label: "LinkedIn", icon: FiLinkedin },
  { key: "portfolioUrl", label: "Portfolio", icon: FiLink },
  { key: "siteWebUrl", label: "Site personnel", icon: FiGlobe },
];

export default function LiensProfessionnelsSection({ profil }) {
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
        title="Liens professionnels"
        icon={FiLink}
        onEdit={() => setOpen(true)}
      >
        <div className="space-y-1">
          {LIENS.map(({ key, label, icon: Icon }) =>
            profil[key] ? (
              <a
                key={key}
                href={profil[key]}
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
                {label} — non renseigné
              </div>
            ),
          )}
        </div>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liens professionnels</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {LIENS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input id={key} placeholder="https://" {...register(key)} />
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}