"use client";

import { useForm, Controller } from "react-hook-form";
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
import { useUpdateEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";

const TAILLES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function EditProfilEntrepriseDialog({
  open,
  onOpenChange,
  profil,
}) {
  const updateProfile = useUpdateEntrepriseProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    values: {
      nomEntreprise: profil?.nomEntreprise || "",
      secteurActivite: profil?.secteurActivite || "",
      tailleEntreprise: profil?.tailleEntreprise || "",
      pays: profil?.pays || "",
      ville: profil?.ville || "",
      adresse: profil?.adresse || "",
      siteWeb: profil?.siteWeb || "",
      linkedinUrl: profil?.linkedinUrl || "",
      aPropos: profil?.aPropos || "",
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-md sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Modifier le profil de l&apos;entreprise</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nomEntreprise">Nom de l&apos;entreprise</Label>
            <Input id="nomEntreprise" {...register("nomEntreprise")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="secteurActivite">Secteur d&apos;activité</Label>
              <Input id="secteurActivite" {...register("secteurActivite")} />
            </div>
            <div className="space-y-1.5">
              <Label>Taille de l&apos;entreprise</Label>
              <Controller
                name="tailleEntreprise"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAILLES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t} employés
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" {...register("ville")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pays">Pays</Label>
              <Input id="pays" {...register("pays")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" {...register("adresse")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="siteWeb">Site web</Label>
              <Input
                id="siteWeb"
                placeholder="https://"
                {...register("siteWeb")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://"
                {...register("linkedinUrl")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aPropos">À propos de l&apos;entreprise</Label>
            <Textarea id="aPropos" rows={5} {...register("aPropos")} />
          </div>

          <p className="text-xs text-muted-foreground">
            L&apos;email et le téléphone se gèrent respectivement depuis votre compte
            et le menu Équipe.
          </p>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            Enregistrer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
