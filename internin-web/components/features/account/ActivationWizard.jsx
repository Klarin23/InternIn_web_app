"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  GraduationCap,
  Heart,
  Loader2,
  Sparkles,
  Target,
  UserRound,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useStagiaireProfile,
  useUpdateStagiaireProfile,
} from "@/lib/queries/useStagiaireProfile";
import { uploadPhotoProfilRequest } from "@/lib/api/stagiaires";
import { uploadDocumentRequest } from "@/lib/api/documents";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { calculerCompletionProfil } from "@/lib/utils/profilCompletion";
import { useCentresInteret } from "@/lib/queries/useCentresInteret";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

const STEP_META = {
  photo: {
    title: "Photo de profil",
    subtitle:
      "Ajoutez une photo claire pour inspirer confiance aux recruteurs.",
    icon: Camera,
  },
  titre: {
    title: "Titre professionnel",
    subtitle:
      "Ex. « Étudiant en génie logiciel · Recherche stage développement »",
    icon: UserRound,
  },
  presentation: {
    title: "Présentation",
    subtitle: "Quelques lignes sur votre parcours et ce que vous recherchez.",
    icon: FileText,
  },
  formation: {
    title: "Formation",
    subtitle: "Indiquez votre formation principale en cours ou obtenue.",
    icon: GraduationCap,
  },
  competences: {
    title: "Compétences",
    subtitle: "Au moins une compétence (technique, pro ou langue).",
    icon: Wrench,
  },
  cv: {
    title: "CV",
    subtitle: "PDF ou Word, max 5 Mo. Indispensable pour postuler.",
    icon: FileText,
  },
  centresInteret: {
    title: "Centres d'intérêt",
    subtitle: "Domaines de stage qui vous intéressent.",
    icon: Heart,
  },
  preferences: {
    title: "Préférences de recherche",
    subtitle: "Secteurs ou villes ciblés pour affiner les offres.",
    icon: Target,
  },
};

/** Conteneur : charge le profil, puis monte le formulaire (évite setState dans useEffect) */
export default function ActivationWizard() {
  const { data, isLoading, refetch } = useStagiaireProfile();
  const profil = data?.stagiaire || data || null;

  if (isLoading || !profil) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Chargement de votre profil…
      </div>
    );
  }

  return (
    <ActivationWizardInner
      key={profil.idStagiaire || profil.id || "profil"}
      profil={profil}
      refetch={refetch}
    />
  );
}

function ActivationWizardInner({ profil, refetch }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const updateUser = useAuthStore((s) => s.updateUser);
  const updateMutation = useUpdateStagiaireProfile();
  const { data: centresList } = useCentresInteret();

  const completion = useMemo(() => calculerCompletionProfil(profil), [profil]);
  const manquants = completion.manquants || [];

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Initialisés une seule fois au montage (profil déjà chargé) — PAS de useEffect
  const [titre, setTitre] = useState(profil.titreProfessionnel || "");
  const [presentation, setPresentation] = useState(profil.presentation || "");
  const [formation, setFormation] = useState({
    typeFormation: "en_cours",
    nomUniversite: "",
    diplome: "",
    anneeEtude: "",
  });
  const [competenceNom, setCompetenceNom] = useState("");
  const [centresSel, setCentresSel] = useState(
    (profil.centresInteret || []).map((c) => c.idCentreInteret || c.id || c),
  );
  const [secteur, setSecteur] = useState("");
  const [ville, setVille] = useState("");

  const current = manquants[stepIndex];
  const meta = current ? STEP_META[current.id] : null;
  const Icon = meta?.icon || Sparkles;
  const progressPct =
    manquants.length === 0
      ? 100
      : Math.round(
          ((Math.min(stepIndex, manquants.length - 1) + 1) / manquants.length) *
            100,
        );

  async function afterSave() {
    const refreshed = await refetch();
    const p = refreshed?.data?.stagiaire || refreshed?.data || null;
    const next = calculerCompletionProfil(p);
    const statut = p?.statutCompte;
    if (statut) updateUser({ statutCompte: statut });

    if (next.complet || next.manquants.length === 0) {
      updateUser({ statutCompte: "actif" });
      toast.success("Profil complet — compte activé !");
      router.replace("/tableau-de-bord");
      return true;
    }
    setStepIndex(0);
    toast.success("Enregistré — continuez pour activer votre compte");
    return false;
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      await uploadPhotoProfilRequest(file, token);
      await afterSave();
    } catch (err) {
      toast.error(err.message || "Upload photo impossible");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  async function handleCv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const up = await uploadDocumentRequest(file, "cv", token);
      const url = up?.url || up?.cvUrl || up?.data?.url;
      if (!url) throw new Error("URL du CV manquante");
      await updateMutation.mutateAsync({ cvUrl: url });
      await afterSave();
    } catch (err) {
      toast.error(err.message || "Upload CV impossible");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  async function handleNext() {
    if (!current) return;
    setSaving(true);
    try {
      if (current.id === "titre") {
        if (!titre.trim()) {
          toast.error("Indiquez un titre professionnel");
          return;
        }
        await updateMutation.mutateAsync({ titreProfessionnel: titre.trim() });
      } else if (current.id === "presentation") {
        if (!presentation.trim()) {
          toast.error("Ajoutez une présentation");
          return;
        }
        await updateMutation.mutateAsync({ presentation: presentation.trim() });
      } else if (current.id === "formation") {
        if (!formation.nomUniversite.trim() || !formation.diplome.trim()) {
          toast.error("Université et diplôme sont requis");
          return;
        }
        await updateMutation.mutateAsync({ formations: [formation] });
      } else if (current.id === "competences") {
        if (!competenceNom.trim()) {
          toast.error("Ajoutez au moins une compétence");
          return;
        }
        await updateMutation.mutateAsync({
          competences: [
            {
              nom: competenceNom.trim(),
              typeCompetence: "technique",
              niveau: "intermediaire",
              isCustom: true,
            },
          ],
        });
      } else if (current.id === "centresInteret") {
        if (centresSel.length === 0) {
          toast.error("Sélectionnez au moins un centre d'intérêt");
          return;
        }
        await updateMutation.mutateAsync({ centresInteret: centresSel });
      } else if (current.id === "preferences") {
        if (!secteur.trim() && !ville.trim()) {
          toast.error("Indiquez un secteur ou une ville");
          return;
        }
        await updateMutation.mutateAsync({
          secteursRecherches: secteur.trim() ? [secteur.trim()] : [],
          villesRecherchees: ville.trim() ? [ville.trim()] : [],
        });
      }
      await afterSave();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (!current || manquants.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">Profil complet</h1>
        <Button onClick={() => router.push("/tableau-de-bord")}>
          Aller au tableau de bord
        </Button>
      </div>
    );
  }

  const centresOptions = Array.isArray(centresList)
    ? centresList
    : centresList?.centres || [];

  return (
    <main className="min-h-full bg-gradient-to-br from-background via-background to-muted/40 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Complétude du profil
            </span>
            <span className="font-bold text-primary">
              {completion.pourcentage}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completion.pourcentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {manquants.length} élément{manquants.length > 1 ? "s" : ""} restant
            {manquants.length > 1 ? "s" : ""} pour activer votre compte
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-black/5">
          <div className="border-b border-border/60 px-6 py-5 sm:px-8">
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Étape {stepIndex + 1} / {manquants.length}
              </span>
              <span className="font-medium text-primary">{progressPct}%</span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary to-teal-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {meta.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {meta.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-8">
            {current.id === "photo" && (
              <div>
                <Label className="mb-2 block">Choisir une photo</Label>
                <Input type="file" accept="image/*" onChange={handlePhoto} />
                {saving && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Envoi en cours…
                  </p>
                )}
              </div>
            )}

            {current.id === "titre" && (
              <div className="space-y-2">
                <Label htmlFor="titre">Titre professionnel</Label>
                <Input
                  id="titre"
                  className="h-12 rounded-sm"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex. Étudiant en informatique"
                />
              </div>
            )}

            {current.id === "presentation" && (
              <div className="space-y-2">
                <Label htmlFor="pres">Présentation</Label>
                <Textarea
                  id="pres"
                  rows={5}
                  className="rounded-sm"
                  value={presentation}
                  onChange={(e) => setPresentation(e.target.value)}
                />
              </div>
            )}

            {current.id === "formation" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Université / école</Label>
                  <Input
                    className="h-12 rounded-sm"
                    value={formation.nomUniversite}
                    onChange={(e) =>
                      setFormation((f) => ({
                        ...f,
                        nomUniversite: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Diplôme / filière</Label>
                  <Input
                    className="h-12 rounded-sm"
                    value={formation.diplome}
                    onChange={(e) =>
                      setFormation((f) => ({ ...f, diplome: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {current.id === "competences" && (
              <div className="space-y-2">
                <Label>Compétence</Label>
                <Input
                  className="h-12 rounded-sm"
                  value={competenceNom}
                  onChange={(e) => setCompetenceNom(e.target.value)}
                  placeholder="Ex. React, Excel…"
                />
              </div>
            )}

            {current.id === "cv" && (
              <div>
                <Label className="mb-2 block">Fichier CV</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCv}
                />
                {saving && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Envoi en cours…
                  </p>
                )}
              </div>
            )}

            {current.id === "centresInteret" && (
              <div className="flex flex-wrap gap-2">
                {centresOptions.map((c) => {
                  const id = c.idCentreInteret || c.id;
                  const label = c.nom || c.libelle || c.label;
                  const active = centresSel.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setCentresSel((prev) =>
                          active ? prev.filter((x) => x !== id) : [...prev, id],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {current.id === "preferences" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Secteur recherché</Label>
                  <Input
                    className="h-12 rounded-sm"
                    value={secteur}
                    onChange={(e) => setSecteur(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ville recherchée</Label>
                  <Input
                    className="h-12 rounded-sm"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border/60 px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-sm"
              disabled={stepIndex === 0 || saving}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {current.id !== "photo" && current.id !== "cv" ? (
              <Button
                type="button"
                className="h-11 flex-1 rounded-sm"
                disabled={saving}
                onClick={handleNext}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <p className="flex-1 text-center text-xs text-muted-foreground">
                Choisissez un fichier pour continuer
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Vous pouvez quitter à tout moment.{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => router.push("/tableau-de-bord")}
          >
            Plus tard
          </button>
        </p>
      </div>
    </main>
  );
}
