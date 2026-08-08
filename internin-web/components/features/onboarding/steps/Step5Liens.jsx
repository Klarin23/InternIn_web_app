"use client";
// Étape 5 : liens professionnels, tous facultatifs. Chaque champ affiche
// l'icône de sa plateforme pour une reconnaissance visuelle immédiate.

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Linkedin,
  Github,
  Palette,
  Globe,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { step5Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { FaArrowLeft, FaGithub, FaGlobe, FaLink, FaLinkedin, FaPalette } from "react-icons/fa6";

// Configuration de chaque champ : nom du champ, icône, libellé, placeholder
const FIELDS = [
  {
    name: "linkedinUrl",
    icon: FaLinkedin,
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/votre-profil",
  },
  {
    name: "githubUrl",
    icon: FaGithub,
    label: "GitHub",
    placeholder: "https://github.com/votre-profil",
  },
  {
    name: "behanceUrl",
    icon: FaPalette,
    label: "Behance",
    placeholder: "https://behance.net/votre-profil",
  },
  {
    name: "portfolioUrl",
    icon: FaLink,
    label: "Portfolio",
    placeholder: "https://votre-portfolio.com",
  },
  {
    name: "siteWebUrl",
    icon: FaGlobe,
    label: "Site web personnel",
    placeholder: "https://votre-site.com",
  },
];

export default function Step5Liens() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      linkedinUrl: data.linkedinUrl || "",
      githubUrl: data.githubUrl || "",
      behanceUrl: data.behanceUrl || "",
      portfolioUrl: data.portfolioUrl || "",
      siteWebUrl: data.siteWebUrl || "",
    },
  });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/6");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Vos liens professionnels
        </h1>
        <p className="text-sm text-muted-foreground">
          Tous facultatifs — ajoutez ceux qui valorisent le mieux votre profil.
          Vous pourrez les modifier plus tard.
        </p>
      </div>

      {FIELDS.map(({ name, icon: Icon, label, placeholder }) => (
        <div key={name} className="space-y-1.5">
          <Label htmlFor={name}>{label}</Label>
          <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={name}
              type="url"
              placeholder={placeholder}
              className="h-12 rounded-sm pl-10"
              {...register(name)}
            />
          </div>
          {errors[name] && (
            <p className="text-xs text-destructive">{errors[name].message}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/4")}
        >
          <FaArrowLeft className="h-4 w-4" />
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
