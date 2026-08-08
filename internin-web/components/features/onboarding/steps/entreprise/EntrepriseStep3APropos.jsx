"use client";
// Étape 3 : présentation de l'entreprise en texte libre. `aPropos` est
// obligatoire (visible publiquement sur les offres de stage), les deux
// autres champs sont facultatifs.

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { entrepriseStep3Schema } from "@/lib/schemas/onboardingEntreprise.schema";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";

// Petit composant réutilisable pour une zone de texte avec compteur de caractères
function TextareaField({
  id,
  label,
  placeholder,
  minRows = 4,
  registration,
  error,
  helper,
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        placeholder={placeholder}
        rows={minRows}
        className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
        {...registration}
      />
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function EntrepriseStep3APropos() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingEntrepriseStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrepriseStep3Schema),
    defaultValues: {
      aPropos: data.aPropos || "",
      mission: data.mission || "",
      cultureEntreprise: data.cultureEntreprise || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/4");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-secondary/10 text-blue-400">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Présentez votre entreprise
        </h1>
        <p className="text-sm text-muted-foreground">
          Ce texte sera visible par les stagiaires sur vos offres de stage.
        </p>
      </div>

      <TextareaField
        id="aPropos"
        label="À propos de l'entreprise"
        placeholder="Décrivez votre entreprise, son activité, son histoire..."
        registration={register("aPropos")}
        error={errors.aPropos?.message}
      />

      <TextareaField
        id="mission"
        label={
          <>
            Mission <span className="text-muted-foreground">(facultatif)</span>
          </>
        }
        placeholder="Quelle est la mission de votre entreprise ?"
        minRows={3}
        registration={register("mission")}
      />

      <TextareaField
        id="cultureEntreprise"
        label={
          <>
            Culture d&apos;entreprise{" "}
            <span className="text-muted-foreground">(facultatif)</span>
          </>
        }
        placeholder="Décrivez l'ambiance de travail, les valeurs de votre équipe..."
        minRows={3}
        registration={register("cultureEntreprise")}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/2")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          Continuer
        </Button>
      </div>
    </form>
  );
}
