"use client";
// Étape 2 : présence en ligne. Réutilise le module documents (type="logo"),
// exactement comme pour l'entreprise.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiGlobe,
  FiImage,
  FiX,
  FiLoader,
  FiArrowLeft,
  FiAlertCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { universiteStep2Schema } from "@/lib/schemas/onboardingUniversite.schema";
import { useOnboardingUniversiteStore } from "@/lib/store/useOnboardingUniversiteStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { uploadDocumentRequest } from "@/lib/api/documents";

export default function UniversiteStep2Presence() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { data, saveStepData } = useOnboardingUniversiteStore();

  const [logoPreview, setLogoPreview] = useState(data.logoUrl || null);
  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const inputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(universiteStep2Schema),
    defaultValues: { siteWeb: data.siteWeb || "", logoUrl: data.logoUrl || "" },
  });

  function handleSelectLogo(file) {
    setLogoError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError("Format non autorisé — utilisez un PNG ou JPEG.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  const onSubmit = async (values) => {
    let logoUrl = data.logoUrl || "";
    if (logoFile) {
      setIsUploadingLogo(true);
      try {
        const { url } = await uploadDocumentRequest(logoFile, "logo", token);
        logoUrl = url;
      } catch (err) {
        setLogoError(err.message);
        setIsUploadingLogo(false);
        return;
      }
      setIsUploadingLogo(false);
    }
    saveStepData({ ...values, logoUrl });
    router.push("/onboarding/3");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Présence en ligne
        </h1>
        <p className="text-sm text-muted-foreground">
          Facultatif, mais renforce la visibilité de votre établissement.
        </p>
      </div>

      {logoError && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {logoError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>
          Logo de l&apos;établissement{" "}
          <span className="text-muted-foreground">(facultatif)</span>
        </Label>
        {logoPreview ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt="Aperçu du logo"
              className="h-14 w-14 rounded-sm object-cover"
            />
            <span className="flex-1 truncate text-sm text-foreground">
              {logoFile?.name || "Logo actuel"}
            </span>
            <button
              type="button"
              onClick={() => {
                setLogoPreview(null);
                setLogoFile(null);
              }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Retirer le logo"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 p-8 text-center hover:border-primary/50"
          >
            <FiImage className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cliquez pour ajouter un logo (PNG ou JPEG)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleSelectLogo(e.target.files[0])
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="siteWeb">Site web</Label>
        <div className="relative">
          <FiGlobe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="siteWeb"
            type="url"
            placeholder="https://votre-universite.edu"
            className="h-12 rounded-sm pl-10"
            {...register("siteWeb")}
          />
        </div>
        {errors.siteWeb && (
          <p className="text-xs text-destructive">{errors.siteWeb.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/1")}
        >
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isUploadingLogo}
          className="h-12 flex-1 rounded-sm"
        >
          {isUploadingLogo ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Envoi du logo...
            </>
          ) : (
            "Continuer"
          )}
        </Button>
      </div>
    </form>
  );
}
