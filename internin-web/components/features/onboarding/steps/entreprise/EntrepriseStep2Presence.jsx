"use client";
// Étape 2 : présence en ligne. Le logo est facultatif (contrairement au CV
// obligatoire du stagiaire) — d'où une zone d'upload plus compacte, sans
// bloquer la progression si l'entreprise préfère l'ajouter plus tard.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrepriseStep2Schema } from "@/lib/schemas/onboardingEntreprise.schema";
import { useOnboardingEntrepriseStore } from "@/lib/store/useOnboardingEntrepriseStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { uploadDocumentRequest } from "@/lib/api/documents";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { FaArrowLeft, FaCircleExclamation, FaGlobe, FaImage, FaLinkedin, FaSpinner } from "react-icons/fa6";

const URL_ERROR_TRANSLATIONS = {
  "URL invalide.": "urlInvalid",
  "Le lien doit utiliser HTTPS.": "httpsRequired",
  "Ce lien LinkedIn n'est pas valide.": "linkedinInvalid",
  "Ce lien LinkedIn n’est pas valide.": "linkedinInvalid",
  "L'URL est trop longue.": "urlTooLong",
  "L’URL est trop longue.": "urlTooLong",
  "Les identifiants intégrés dans une URL ne sont pas autorisés.": "credentialsNotAllowed",
};

export default function EntrepriseStep2Presence() {
  const router = useRouter();
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const { data, saveStepData } = useOnboardingEntrepriseStore();

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
    resolver: zodResolver(entrepriseStep2Schema),
    defaultValues: {
      siteWeb: data.siteWeb || "",
      linkedinUrl: data.linkedinUrl || "",
      logoUrl: data.logoUrl || "",
    },
  });

  const translateUrlError = (message) => {
    const key = URL_ERROR_TRANSLATIONS[message];
    return key ? t(`onboardingEntreprise.step2.${key}`) : message;
  };

  function handleSelectLogo(file) {
    setLogoError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError(t("onboardingEntreprise.step2.formatError"));
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
          {t("onboardingEntreprise.step2.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboardingEntreprise.step2.description")}
        </p>
      </div>

      {logoError && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <FaCircleExclamation className="h-4 w-4 shrink-0" />
          {logoError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>
          {t("onboardingEntreprise.step2.logoLabel")} {" "}
          <span className="text-muted-foreground">
            ({t("onboardingEntreprise.step2.optional")})
          </span>
        </Label>
        {logoPreview ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt={t("onboardingEntreprise.step2.previewAlt")}
              className="h-14 w-14 rounded-sm object-cover"
            />
            <span className="flex-1 truncate text-sm text-foreground">
              {logoFile?.name || t("onboardingEntreprise.step2.currentLogo")}
            </span>
            <button
              type="button"
              onClick={() => {
                setLogoPreview(null);
                setLogoFile(null);
              }}
              className="text-muted-foreground hover:text-destructive"
              aria-label={t("onboardingEntreprise.step2.removeLogo")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/40 p-8 text-center hover:border-primary/50"
          >
            <FaImage className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("onboardingEntreprise.step2.uploadPrompt")}
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
        <Label htmlFor="siteWeb">{t("onboardingEntreprise.step2.siteWeb")}</Label>
        <div className="relative">
          <FaGlobe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="siteWeb"
            type="url"
            placeholder={t("onboardingEntreprise.step2.siteWebPlaceholder")}
            className="h-12 rounded-sm pl-10"
            {...register("siteWeb")}
          />
        </div>
        {errors.siteWeb && (
          <p className="text-xs text-destructive">
            {translateUrlError(errors.siteWeb.message)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedinUrl">{t("onboardingEntreprise.step2.linkedin")}</Label>
        <div className="relative">
          <FaLinkedin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="linkedinUrl"
            type="url"
            placeholder={t("onboardingEntreprise.step2.linkedinPlaceholder")}
            className="h-12 rounded-sm pl-10"
            {...register("linkedinUrl")}
          />
        </div>
        {errors.linkedinUrl && (
          <p className="text-xs text-destructive">
            {translateUrlError(errors.linkedinUrl.message)}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/1")}
          aria-label={t("onboardingEntreprise.step2.back")}
        >
          <FaArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isUploadingLogo}
          className="h-12 flex-1 rounded-sm"
        >
          {isUploadingLogo ? (
            <>
              <FaSpinner className="h-4 w-4 animate-spin" />
              {t("onboardingEntreprise.step2.uploadingLogo")}
            </>
          ) : (
            t("onboardingEntreprise.step2.continue")
          )}
        </Button>
      </div>
    </form>
  );
}
