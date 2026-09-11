"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";
import { useTranslation } from "@/lib/i18n/useTranslation";

const EMPTY = { poste: "", entreprise: "", dateDebut: "", dateFin: "", enCours: false, description: "" };

export default function ExperiencesProfessionnellesSection({ profil }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateProfile = useUpdateStagiaireProfile();
  const { register, control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { experiencesProfessionnelles: profil.experiencesProfessionnelles || [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "experiencesProfessionnelles" });

  function openEditor() {
    reset({ experiencesProfessionnelles: profil.experiencesProfessionnelles || [] });
    setOpen(true);
  }
  function onSubmit(values) {
    const cleaned = values.experiencesProfessionnelles.map((e) => ({
      poste: e.poste?.trim(), entreprise: e.entreprise?.trim() || undefined,
      dateDebut: e.dateDebut?.trim() || undefined, dateFin: e.enCours ? undefined : (e.dateFin?.trim() || undefined),
      enCours: !!e.enCours, description: e.description?.trim() || undefined,
    })).filter((e) => e.poste);
    updateProfile.mutate({ experiencesProfessionnelles: cleaned }, { onSuccess: () => setOpen(false) });
  }
  const experiences = profil.experiencesProfessionnelles || [];
  return (<><ProfilSectionCard title={t("stagiaireSpace.profile.experiences")} icon={BriefcaseBusiness} onEdit={openEditor}>
    {experiences.length === 0 ? <p className="text-sm text-muted-foreground">{t("stagiaireSpace.profile.experiencesEmpty")}</p> : <div className="relative space-y-4 pl-5">{experiences.map((e, i) => <div key={i} className="relative rounded-md border border-border/60 bg-muted/30 p-3.5">
      <p className="text-sm font-semibold text-foreground">{e.poste}</p>
      {e.entreprise && <p className="text-sm text-muted-foreground">{e.entreprise}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{[e.dateDebut, e.enCours ? t("stagiaireSpace.profile.current") : e.dateFin].filter(Boolean).join(" — ")}</p>
      {e.description && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{e.description}</p>}
    </div>)}</div>}
  </ProfilSectionCard>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{t("stagiaireSpace.profile.experiences")}</DialogTitle></DialogHeader>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">{fields.map((field, index) => { const enCours = watch(`experiencesProfessionnelles.${index}.enCours`); return <div key={field.id} className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between"><span className="text-sm font-semibold">{t("stagiaireSpace.profile.experienceNumber", { n: index + 1 })}</span><button type="button" onClick={() => remove(index)} aria-label={t("stagiaireSpace.profile.delete")} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>
      <div><Label>{t("stagiaireSpace.profile.jobTitle")}</Label><Input className="mt-1.5" {...register(`experiencesProfessionnelles.${index}.poste`)} /></div>
      <div><Label>{t("stagiaireSpace.profile.companyOptional")}</Label><Input className="mt-1.5" {...register(`experiencesProfessionnelles.${index}.entreprise`)} /></div>
      <div className="grid grid-cols-2 gap-3"><div><Label>{t("stagiaireSpace.profile.startDate")}</Label><Input className="mt-1.5" placeholder="MM/AAAA" {...register(`experiencesProfessionnelles.${index}.dateDebut`)} /></div><div><Label>{t("stagiaireSpace.profile.endDate")}</Label><Input className="mt-1.5" placeholder="MM/AAAA" disabled={enCours} {...register(`experiencesProfessionnelles.${index}.dateFin`)} /></div></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded border-border" {...register(`experiencesProfessionnelles.${index}.enCours`)} />{t("stagiaireSpace.profile.currentExperience")}</label>
      <div><Label>{t("stagiaireSpace.profile.descriptionOptional")}</Label><Textarea className="mt-1.5" rows={3} {...register(`experiencesProfessionnelles.${index}.description`)} /></div>
    </div>})}
    <Button type="button" variant="outline" onClick={() => append(EMPTY)} className="w-full"><Plus className="mr-2 h-4 w-4" />{t("stagiaireSpace.profile.addExperience")}</Button>
    <Button type="submit" disabled={isSubmitting || updateProfile.isPending} className="w-full">{t("stagiaireSpace.profile.save")}</Button></form>
  </DialogContent></Dialog></>);
}
