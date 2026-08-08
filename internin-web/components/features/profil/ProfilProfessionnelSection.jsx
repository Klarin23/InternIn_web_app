"use client";

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
        title="Profil professionnel"
        icon={FiFileText}
        onEdit={() => setOpen(true)}
      >
        <div className="space-y-3">
          <div>
            <dt className="text-xs text-muted-foreground">
              Titre professionnel
            </dt>
            <dd className="text-sm text-foreground">
              {profil.titreProfessionnel || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Présentation personnelle
            </dt>
            <dd className="text-sm text-foreground">
              {profil.presentation || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Objectif professionnel
            </dt>
            <dd className="text-sm text-foreground">
              {profil.objectifProfessionnel || "—"}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">
                Type de stage recherché
              </dt>
              <dd className="text-sm text-foreground">
                {DUREE_LABELS[profil.dureeStageSouhaitee] || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Disponibilité</dt>
              <dd className="text-sm text-foreground">
                {profil.dateDebutSouhaitee
                  ? `À partir du ${profil.dateDebutSouhaitee}`
                  : "—"}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Localisation souhaitée
            </dt>
            <dd className="text-sm text-foreground">{villes || "—"}</dd>
          </div>
        </div>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil professionnel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titreProfessionnel">Titre professionnel</Label>
              <Input
                id="titreProfessionnel"
                placeholder="Ex. Développeur Web Front-End"
                {...register("titreProfessionnel")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="presentation">Présentation personnelle</Label>
              <Textarea
                id="presentation"
                rows={4}
                {...register("presentation")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="objectifProfessionnel">
                Objectif professionnel
              </Label>
              <Textarea
                id="objectifProfessionnel"
                rows={3}
                {...register("objectifProfessionnel")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type de stage recherché</Label>
              <Controller
                name="dureeStageSouhaitee"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DUREE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateDebutSouhaitee">Disponible à partir du</Label>
              <Input
                id="dateDebutSouhaitee"
                type="date"
                {...register("dateDebutSouhaitee")}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
