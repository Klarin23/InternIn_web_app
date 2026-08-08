"use client";
// Étape 1 de l'onboarding entreprise : informations de base.
// Même structure que Step1InfosPersonnelles (stagiaire), adaptée aux champs
// de la table `entreprises`.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { entrepriseStep1Schema } from "@/lib/schemas/onboardingEntreprise.schema";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";

const TAILLES = [
  { value: "1-10", label: "1 à 10 employés" },
  { value: "11-50", label: "11 à 50 employés" },
  { value: "51-200", label: "51 à 200 employés" },
  { value: "201-500", label: "201 à 500 employés" },
  { value: "500+", label: "Plus de 500 employés" },
];

export default function EntrepriseStep1Infos() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingEntrepriseStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrepriseStep1Schema),
    defaultValues: {
      nomEntreprise: data.nomEntreprise || "",
      secteurActivite: data.secteurActivite || "",
      tailleEntreprise: data.tailleEntreprise || undefined,
      pays: data.pays || "",
      ville: data.ville || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/2");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Parlez-nous de votre entreprise
        </h1>
        <p className="text-sm text-muted-foreground">
          Ces informations seront visibles par les stagiaires sur vos offres de
          stage.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nomEntreprise">Nom de l&apos;entreprise</Label>
        <Input
          id="nomEntreprise"
          className="h-12 rounded-sm"
          {...register("nomEntreprise")}
        />
        {errors.nomEntreprise && (
          <p className="text-xs text-destructive">
            {errors.nomEntreprise.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="secteurActivite">Secteur d&apos;activité</Label>
        <Input
          id="secteurActivite"
          placeholder="Ex : Technologies, Finance, Marketing..."
          className="h-12 rounded-sm"
          {...register("secteurActivite")}
        />
        {errors.secteurActivite && (
          <p className="text-xs text-destructive">
            {errors.secteurActivite.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tailleEntreprise">Taille de l&apos;entreprise</Label>
        <Controller
          name="tailleEntreprise"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="tailleEntreprise"
                className="h-12 w-full rounded-sm"
              >
                <SelectValue placeholder="Sélectionnez une taille" />
              </SelectTrigger>
              <SelectContent>
                {TAILLES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tailleEntreprise && (
          <p className="text-xs text-destructive">
            {errors.tailleEntreprise.message}
          </p>
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
