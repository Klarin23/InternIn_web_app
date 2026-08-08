"use client";
// Étape 1 : informations personnelles de base. Sert de modèle pour les
// 10 étapes suivantes (même structure : formulaire -> sauvegarde dans le
// store -> navigation vers l'étape suivante).

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { step1Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";

export default function Step1InfosPersonnelles() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step1Schema),
    // Pré-remplit avec les données déjà saisies si l'utilisateur revient en arrière
    defaultValues: {
      prenom: data.prenom || "",
      nom: data.nom || "",
      telephone: data.telephone || "",
      pays: data.pays || "",
      ville: data.ville || "",
      dateNaissance: data.dateNaissance || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/2");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Parlez-nous de vous
        </h1>
        <p className="text-sm text-muted-foreground">
          Ces informations apparaîtront sur votre profil, visible par les
          entreprises une fois votre stage actif.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            className="h-12 rounded-sm"
            {...register("prenom")}
          />
          {errors.prenom && (
            <p className="text-xs text-destructive">{errors.prenom.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" className="h-12 rounded-sm" {...register("nom")} />
          {errors.nom && (
            <p className="text-xs text-destructive">{errors.nom.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input
          id="telephone"
          type="tel"
          placeholder="+225 07 00 00 00 00"
          className="h-12 rounded-sm"
          {...register("telephone")}
        />
        {errors.telephone && (
          <p className="text-xs text-destructive">{errors.telephone.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pays">Pays</Label>
          <Input id="pays" className="h-12 rounded-sm" {...register("pays")} />
          {errors.pays && (
            <p className="text-xs text-destructive">{errors.pays.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ville">Ville</Label>
          <Input
            id="ville"
            className="h-12 rounded-sm"
            {...register("ville")}
          />
          {errors.ville && (
            <p className="text-xs text-destructive">{errors.ville.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dateNaissance">
          Date de naissance{" "}
          <span className="text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id="dateNaissance"
          type="date"
          className="h-12 rounded-sm"
          {...register("dateNaissance")}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-sm"
      >
        Continuer
      </Button>
    </form>
  );
}
