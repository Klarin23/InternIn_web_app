"use client";

import { useState } from "react";
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

const schema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  telephone: z.string().min(6, "Numéro de téléphone invalide"),
  ville: z.string().min(1, "La ville est requise"),
  pays: z.string().min(1, "Le pays est requis"),
});

export default function InfosPersonnellesSection({ profil }) {
  const [open, setOpen] = useState(false);
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
        title="Informations personnelles"
        icon={FiUser}
        onEdit={() => setOpen(true)}
      >
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="text-sm text-foreground">{profil.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Téléphone</dt>
            <dd className="text-sm text-foreground">{profil.telephone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Ville</dt>
            <dd className="text-sm text-foreground">{profil.ville}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pays</dt>
            <dd className="text-sm text-foreground">{profil.pays}</dd>
          </div>
        </dl>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informations personnelles</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" {...register("prenom")} />
                {errors.prenom && (
                  <p className="text-xs text-destructive">
                    {errors.prenom.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" {...register("nom")} />
                {errors.nom && (
                  <p className="text-xs text-destructive">
                    {errors.nom.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" {...register("telephone")} />
              {errors.telephone && (
                <p className="text-xs text-destructive">
                  {errors.telephone.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" {...register("ville")} />
                {errors.ville && (
                  <p className="text-xs text-destructive">
                    {errors.ville.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pays">Pays</Label>
                <Input id="pays" {...register("pays")} />
                {errors.pays && (
                  <p className="text-xs text-destructive">
                    {errors.pays.message}
                  </p>
                )}
              </div>
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
