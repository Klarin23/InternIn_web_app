"use client";

// Refonte visuelle de "Modifier le profil" (espace Entreprise). La logique
// métier existante est intégralement conservée :
//   - mêmes champs, mêmes clés de payload envoyées à useUpdateEntrepriseProfile
//     (PATCH /entreprises/me, inchangé)
//   - upload du logo toujours géré séparément via useUploadLogoEntreprise
//     (POST /entreprises/me/logo, inchangé)
// Seule l'expérience (organisation en sections, navigation, animations,
// progression, gestion des modifications non sauvegardées) a été ajoutée.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiInfo,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiUsers,
  FiLinkedin,
} from "react-icons/fi";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { useUpdateEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import {
  editProfilEntrepriseSchema,
  TAILLES_ENTREPRISE,
} from "@/lib/schemas/editProfilEntreprise.schema";
import { calculerCompletionEntreprise } from "@/lib/utils/profilCompletion";
import { toast } from "@/lib/store/useToastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

import EditProfilLogoHeader from "./edit/EditProfilLogoHeader";
import EditProfilCompletionBar from "./edit/EditProfilCompletionBar";
import EditProfilNav from "./edit/EditProfilNav";
import EditProfilFormSection from "./edit/EditProfilFormSection";
import EditProfilField from "./edit/EditProfilField";
import EditProfilActionsBar from "./edit/EditProfilActionsBar";

const SECTION_IDS = [
  { id: "general", icon: FiInfo },
  { id: "coordonnees", icon: FiPhone },
  { id: "localisation", icon: FiMapPin },
  { id: "presentation", icon: FiFileText },
  { id: "professionnel", icon: FiUsers },
  { id: "reseaux", icon: FiLinkedin },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function EditProfilEntrepriseDialog({ open, onOpenChange, profil }) {
  const { t } = useTranslation();
  const updateProfile = useUpdateEntrepriseProfile();
  const shouldReduceMotion = useReducedMotion();

  const SECTIONS = useMemo(
    () =>
      SECTION_IDS.map((s) => ({
        ...s,
        navLabel: t(`profilEntreprise.edit.sections.${s.id}`),
      })),
    [t],
  );

  const TAILLE_LABELS = useMemo(
    () => ({
      "1-10": t("profilEntreprise.companySize.1-10"),
      "11-50": t("profilEntreprise.companySize.11-50"),
      "51-200": t("profilEntreprise.companySize.51-200"),
      "201-500": t("profilEntreprise.companySize.201-500"),
      "500+": t("profilEntreprise.companySize.500+"),
    }),
    [t],
  );

  const containerRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeId, setActiveId] = useState("general");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(editProfilEntrepriseSchema),
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
      mission: profil?.mission || "",
      cultureEntreprise: profil?.cultureEntreprise || "",
    },
  });

  // useWatch (et non watch()) pour rester compatible avec le React Compiler
  const watched = useWatch({ control });
  const completion = useMemo(
    () =>
      calculerCompletionEntreprise({
        ...(watched ?? {}),
        logoUrl: profil?.logoUrl,
      }),
    [watched, profil?.logoUrl],
  );

  // Avertit avant de fermer l'onglet/la page si des modifications ne sont
  // pas sauvegardées — n'empêche jamais réellement la navigation, comme
  // demandé (le navigateur affiche sa propre confirmation native).
  useEffect(() => {
    if (!open || !isDirty) return;
    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open, isDirty]);

  // Repère la section visible pour surligner la navigation pendant le défilement.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { root: container, rootMargin: "-8% 0px -75% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [open]);

  const handleNavigate = useCallback(
    (id) => {
      setActiveId(id);
      sectionRefs.current[id]?.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [shouldReduceMotion],
  );

  function handleOpenChange(nextOpen) {
    if (!nextOpen && isDirty) {
      const confirmerFermeture = window.confirm(
        t("profilEntreprise.edit.unsavedChanges"),
      );
      if (!confirmerFermeture) return;
    }
    if (!nextOpen) updateProfile.reset();
    onOpenChange(nextOpen);
  }

  function onSubmit(values) {
    updateProfile.mutate(values, {
      onSuccess: () => {
        toast.success(t("profilEntreprise.edit.updated"));
        setTimeout(() => {
          updateProfile.reset();
          onOpenChange(false);
        }, 900);
      },
      onError: (err) => {
        toast.error(err.message || t("profilEntreprise.edit.updateError"));
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)_auto]"
        >
          <DialogHeader className="gap-1 px-5 pt-5 pr-10">
            <DialogTitle>{t("profilEntreprise.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("profilEntreprise.edit.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-5 pt-3 empty:hidden">
            {profil && (
              <>
                <EditProfilLogoHeader profil={profil} />
                <EditProfilCompletionBar
                  pourcentage={completion.pourcentage}
                  complet={completion.complet}
                />
              </>
            )}
          </div>

          <div
            ref={containerRef}
            className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-4 md:flex-row md:gap-6"
          >
            <EditProfilNav sections={SECTIONS} activeId={activeId} onNavigate={handleNavigate} />

            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              variants={staggerContainer}
              className="min-w-0 flex-1 space-y-4"
            >
              <EditProfilFormSection
                id="general"
                sectionRef={(el) => (sectionRefs.current.general = el)}
                icon={FiInfo}
                title={t("profilEntreprise.edit.general.title")}
                description={t("profilEntreprise.edit.general.description")}
              >
                <EditProfilField id="nomEntreprise" label={t("profilEntreprise.edit.general.companyName")} error={errors.nomEntreprise?.message ? t(errors.nomEntreprise.message, { defaultValue: errors.nomEntreprise.message }) : undefined}>
                  <Input
                    id="nomEntreprise"
                    aria-invalid={!!errors.nomEntreprise}
                    {...register("nomEntreprise")}
                  />
                </EditProfilField>
                <EditProfilField id="secteurActivite" label={t("profilEntreprise.edit.general.industry")} error={errors.secteurActivite?.message}>
                  <Input
                    id="secteurActivite"
                    placeholder={t("profilEntreprise.edit.general.industryPlaceholder")}
                    aria-invalid={!!errors.secteurActivite}
                    {...register("secteurActivite")}
                  />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="coordonnees"
                sectionRef={(el) => (sectionRefs.current.coordonnees = el)}
                icon={FiPhone}
                title={t("profilEntreprise.edit.contact.title")}
                description={t("profilEntreprise.edit.contact.description")}
              >
                <EditProfilField id="siteWeb" label={t("profilEntreprise.edit.contact.website")} error={errors.siteWeb?.message}>
                  <Input
                    id="siteWeb"
                    placeholder="https://votre-entreprise.com"
                    aria-invalid={!!errors.siteWeb}
                    {...register("siteWeb")}
                  />
                </EditProfilField>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <EditProfilField id="emailPro" label={t("profilEntreprise.edit.contact.email")}>
                    <Input id="emailPro" value={profil?.email || ""} disabled readOnly />
                  </EditProfilField>
                  <EditProfilField id="telephonePro" label={t("profilEntreprise.edit.contact.phone")}>
                    <Input
                      id="telephonePro"
                      value={profil?.telephone || ""}
                      placeholder={t("profilEntreprise.edit.contact.phonePlaceholder")}
                      disabled
                      readOnly
                    />
                  </EditProfilField>
                </div>
                <p className="text-xs text-muted-foreground">
                  L&apos;email et le téléphone se gèrent respectivement depuis
                  votre compte et le menu Équipe.
                </p>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="localisation"
                sectionRef={(el) => (sectionRefs.current.localisation = el)}
                icon={FiMapPin}
                title={t("profilEntreprise.edit.location.title")}
                description={t("profilEntreprise.edit.location.description")}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <EditProfilField id="ville" label={t("profilEntreprise.edit.location.city")} error={errors.ville?.message}>
                    <Input id="ville" aria-invalid={!!errors.ville} {...register("ville")} />
                  </EditProfilField>
                  <EditProfilField id="pays" label={t("profilEntreprise.edit.location.country")} error={errors.pays?.message}>
                    <Input id="pays" aria-invalid={!!errors.pays} {...register("pays")} />
                  </EditProfilField>
                </div>
                <EditProfilField id="adresse" label={t("profilEntreprise.edit.location.address")} error={errors.adresse?.message}>
                  <Input id="adresse" aria-invalid={!!errors.adresse} {...register("adresse")} />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="presentation"
                sectionRef={(el) => (sectionRefs.current.presentation = el)}
                icon={FiFileText}
                title={t("profilEntreprise.edit.presentation.title")}
                description={t("profilEntreprise.edit.presentation.description")}
              >
                <EditProfilField
                  id="aPropos"
                  label={t("profilEntreprise.edit.presentation.about")}
                  error={errors.aPropos?.message}
                >
                  <Textarea
                    id="aPropos"
                    rows={5}
                    aria-invalid={!!errors.aPropos}
                    {...register("aPropos")}
                  />
                </EditProfilField>
                <EditProfilField id="mission" label={t("profilEntreprise.edit.presentation.mission")} error={errors.mission?.message}>
                  <Textarea id="mission" rows={3} {...register("mission")} />
                </EditProfilField>
                <EditProfilField
                  id="cultureEntreprise"
                  label={t("profilEntreprise.edit.presentation.companyCulture")}
                  error={errors.cultureEntreprise?.message}
                >
                  <Textarea id="cultureEntreprise" rows={3} {...register("cultureEntreprise")} />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="professionnel"
                sectionRef={(el) => (sectionRefs.current.professionnel = el)}
                icon={FiUsers}
                title={t("profilEntreprise.edit.professional.title")}
                description={t("profilEntreprise.edit.professional.description")}
              >
                <EditProfilField id="tailleEntreprise" label={t("profilEntreprise.edit.professional.companySize")} error={errors.tailleEntreprise?.message}>
                  <Controller
                    name="tailleEntreprise"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="tailleEntreprise" className="w-full" aria-invalid={!!errors.tailleEntreprise}>
                          <SelectValue placeholder={t("profilEntreprise.edit.professional.select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {TAILLES_ENTREPRISE.map((t) => (
                            <SelectItem key={t} value={t}>
                              {TAILLE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="reseaux"
                sectionRef={(el) => (sectionRefs.current.reseaux = el)}
                icon={FiLinkedin}
                title={t("profilEntreprise.edit.social.title")}
                description={t("profilEntreprise.edit.social.description")}
              >
                <EditProfilField id="linkedinUrl" label={t("profilEntreprise.edit.social.linkedin")} error={errors.linkedinUrl?.message}>
                  <Input
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/company/..."
                    aria-invalid={!!errors.linkedinUrl}
                    {...register("linkedinUrl")}
                  />
                </EditProfilField>
              </EditProfilFormSection>
            </motion.div>
          </div>

          <EditProfilActionsBar
            onCancel={() => handleOpenChange(false)}
            disabled={!isDirty}
            isPending={isSubmitting || updateProfile.isPending}
            isSuccess={updateProfile.isSuccess}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
