"use client";
// Étape 1 : informations générales de l'université.

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiHome, FiMail } from "react-icons/fi";
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
import { universiteStep1Schema } from "@/lib/schemas/onboardingUniversite.schema";
import { useOnboardingUniversiteStore } from "@/lib/store/useOnboardingUniversiteStore";

const TYPES_ETABLISSEMENT = [
  "Université publique",
  "Université privée",
  "Grande École",
  "Institut Supérieur",
  "Centre de formation professionnelle",
  "Autre",
];

export default function UniversiteStep1Infos() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingUniversiteStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(universiteStep1Schema),
    defaultValues: {
      nomUniversite: data.nomUniversite || "",
      emailOfficiel: data.emailOfficiel || "",
      typeEtablissement: data.typeEtablissement || undefined,
      pays: data.pays || "",
      nombreEtudiants: data.nombreEtudiants || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/2");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-muted text-foreground">
          <FiHome className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Parlez-nous de votre établissement
        </h1>
        <p className="text-sm text-muted-foreground">
          Ces informations seront visibles par les entreprises partenaires.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nomUniversite">Nom de l&apos;établissement</Label>
        <Input
          id="nomUniversite"
          className="h-12 rounded-sm"
          {...register("nomUniversite")}
        />
        {errors.nomUniversite && (
          <p className="text-xs text-destructive">
            {errors.nomUniversite.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="emailOfficiel">E-mail officiel</Label>
        <div className="relative">
          <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="emailOfficiel"
            type="email"
            placeholder="contact@universite.edu"
            className="h-12 rounded-sm pl-10"
            {...register("emailOfficiel")}
          />
        </div>
        {errors.emailOfficiel && (
          <p className="text-xs text-destructive">
            {errors.emailOfficiel.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="typeEtablissement">Type d&apos;établissement</Label>
        <Controller
          name="typeEtablissement"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="typeEtablissement"
                className="h-12 w-full rounded-sm"
              >
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES_ETABLISSEMENT.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.typeEtablissement && (
          <p className="text-xs text-destructive">
            {errors.typeEtablissement.message}
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
          <Label htmlFor="nombreEtudiants">
            Nombre d&apos;étudiants{" "}
            <span className="text-muted-foreground">(facultatif)</span>
          </Label>
          <Input
            id="nombreEtudiants"
            type="number"
            className="h-12 rounded-sm"
            {...register("nombreEtudiants")}
          />
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
