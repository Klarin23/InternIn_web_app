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
import { useForm, Controller } from "react-hook-form";
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

import EditProfilLogoHeader from "./edit/EditProfilLogoHeader";
import EditProfilCompletionBar from "./edit/EditProfilCompletionBar";
import EditProfilNav from "./edit/EditProfilNav";
import EditProfilFormSection from "./edit/EditProfilFormSection";
import EditProfilField from "./edit/EditProfilField";
import EditProfilActionsBar from "./edit/EditProfilActionsBar";

const TAILLE_LABELS = {
  "1-10": "1 à 10 employés",
  "11-50": "11 à 50 employés",
  "51-200": "51 à 200 employés",
  "201-500": "201 à 500 employés",
  "500+": "Plus de 500 employés",
};

const SECTIONS = [
  { id: "general", navLabel: "Informations générales", icon: FiInfo },
  { id: "coordonnees", navLabel: "Coordonnées", icon: FiPhone },
  { id: "localisation", navLabel: "Localisation", icon: FiMapPin },
  { id: "presentation", navLabel: "Présentation", icon: FiFileText },
  { id: "professionnel", navLabel: "Informations professionnelles", icon: FiUsers },
  { id: "reseaux", navLabel: "Réseaux sociaux", icon: FiLinkedin },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function EditProfilEntrepriseDialog({ open, onOpenChange, profil }) {
  const updateProfile = useUpdateEntrepriseProfile();
  const shouldReduceMotion = useReducedMotion();

  const containerRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const {
    register,
    handleSubmit,
    control,
    watch,
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

  const watched = watch();
  const completion = useMemo(
    () =>
      calculerCompletionEntreprise({
        ...watched,
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
        "Des modifications n'ont pas été enregistrées. Voulez-vous vraiment fermer sans enregistrer ?",
      );
      if (!confirmerFermeture) return;
    }
    if (!nextOpen) updateProfile.reset();
    onOpenChange(nextOpen);
  }

  function onSubmit(values) {
    updateProfile.mutate(values, {
      onSuccess: () => {
        toast.success("Profil mis à jour");
        setTimeout(() => {
          updateProfile.reset();
          onOpenChange(false);
        }, 900);
      },
      onError: (err) => {
        toast.error(err.message || "Échec de la mise à jour du profil");
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
            <DialogTitle>Modifier le profil de l&apos;entreprise</DialogTitle>
            <DialogDescription>
              Ces informations sont visibles publiquement par les stagiaires et
              universités partenaires.
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
                title="Informations générales"
                description="Le nom et le secteur d'activité de votre entreprise."
              >
                <EditProfilField id="nomEntreprise" label="Nom de l'entreprise" error={errors.nomEntreprise?.message}>
                  <Input
                    id="nomEntreprise"
                    aria-invalid={!!errors.nomEntreprise}
                    {...register("nomEntreprise")}
                  />
                </EditProfilField>
                <EditProfilField id="secteurActivite" label="Secteur d'activité" error={errors.secteurActivite?.message}>
                  <Input
                    id="secteurActivite"
                    placeholder="Ex. Technologies de l'information"
                    aria-invalid={!!errors.secteurActivite}
                    {...register("secteurActivite")}
                  />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="coordonnees"
                sectionRef={(el) => (sectionRefs.current.coordonnees = el)}
                icon={FiPhone}
                title="Coordonnées"
                description="Comment les stagiaires et partenaires peuvent vous joindre."
              >
                <EditProfilField id="siteWeb" label="Site web" error={errors.siteWeb?.message}>
                  <Input
                    id="siteWeb"
                    placeholder="https://votre-entreprise.com"
                    aria-invalid={!!errors.siteWeb}
                    {...register("siteWeb")}
                  />
                </EditProfilField>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <EditProfilField id="emailPro" label="Email professionnel">
                    <Input id="emailPro" value={profil?.email || ""} disabled readOnly />
                  </EditProfilField>
                  <EditProfilField id="telephonePro" label="Téléphone">
                    <Input
                      id="telephonePro"
                      value={profil?.telephone || ""}
                      placeholder="Non renseigné"
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
                title="Localisation"
                description="Où se situe votre entreprise."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <EditProfilField id="ville" label="Ville" error={errors.ville?.message}>
                    <Input id="ville" aria-invalid={!!errors.ville} {...register("ville")} />
                  </EditProfilField>
                  <EditProfilField id="pays" label="Pays" error={errors.pays?.message}>
                    <Input id="pays" aria-invalid={!!errors.pays} {...register("pays")} />
                  </EditProfilField>
                </div>
                <EditProfilField id="adresse" label="Adresse" error={errors.adresse?.message}>
                  <Input id="adresse" aria-invalid={!!errors.adresse} {...register("adresse")} />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="presentation"
                sectionRef={(el) => (sectionRefs.current.presentation = el)}
                icon={FiFileText}
                title="Présentation de l'entreprise"
                description="Aidez les stagiaires à mieux comprendre qui vous êtes."
              >
                <EditProfilField
                  id="aPropos"
                  label="À propos de l'entreprise"
                  error={errors.aPropos?.message}
                >
                  <Textarea
                    id="aPropos"
                    rows={5}
                    aria-invalid={!!errors.aPropos}
                    {...register("aPropos")}
                  />
                </EditProfilField>
                <EditProfilField id="mission" label="Mission" error={errors.mission?.message}>
                  <Textarea id="mission" rows={3} {...register("mission")} />
                </EditProfilField>
                <EditProfilField
                  id="cultureEntreprise"
                  label="Culture d'entreprise"
                  error={errors.cultureEntreprise?.message}
                >
                  <Textarea id="cultureEntreprise" rows={3} {...register("cultureEntreprise")} />
                </EditProfilField>
              </EditProfilFormSection>

              <EditProfilFormSection
                id="professionnel"
                sectionRef={(el) => (sectionRefs.current.professionnel = el)}
                icon={FiUsers}
                title="Informations professionnelles"
                description="La taille de votre structure."
              >
                <EditProfilField id="tailleEntreprise" label="Taille de l'entreprise" error={errors.tailleEntreprise?.message}>
                  <Controller
                    name="tailleEntreprise"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="tailleEntreprise" className="w-full" aria-invalid={!!errors.tailleEntreprise}>
                          <SelectValue placeholder="Sélectionner" />
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
                title="Réseaux sociaux"
                description="Votre profil sur les réseaux professionnels."
              >
                <EditProfilField id="linkedinUrl" label="LinkedIn" error={errors.linkedinUrl?.message}>
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
