"use client";

import { useState, useRef } from "react";
import { FiLoader, FiImage, FiX, FiCheckCircle, FiClock } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import {
  useUniversiteProfile,
  useUpdateUniversiteProfile,
} from "@/lib/queries/useUniversiteProfile";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { uploadDocumentRequest } from "@/lib/api/documents";

function Section({ title, description, children }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// Non contrôlé : `key={value}` force un remount (donc un nouveau
// defaultValue) chaque fois que la valeur source change depuis l'extérieur
// (ex. après un succès de mutation) — seul le blur déclenche l'enregistrement.
function TextField({ value, onCommit, disabled, placeholder, width = "w-56" }) {
  return (
    <input
      key={value}
      type="text"
      defaultValue={value || ""}
      placeholder={placeholder}
      disabled={disabled}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (v !== (value || "")) onCommit(v);
      }}
      className={`${width} rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary`}
    />
  );
}

function NumberField({ value, onCommit, disabled }) {
  return (
    <input
      key={value}
      type="number"
      defaultValue={value ?? ""}
      disabled={disabled}
      onBlur={(e) => {
        const n = e.target.value === "" ? null : Number(e.target.value);
        if (n !== value && !(n === null && !value)) onCommit(n ?? "");
      }}
      className="w-24 rounded-md border border-border bg-white px-3 py-2 text-right text-sm text-foreground outline-none focus:border-primary"
    />
  );
}

function StatutVerificationBadge({ statut }) {
  if (statut === "verifiee") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        <FiCheckCircle className="h-3.5 w-3.5" />
        Vérifiée
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <FiClock className="h-3.5 w-3.5" />
      En attente de vérification
    </span>
  );
}

function LogoField({ logoUrl, onCommit, disabled }) {
  const token = useAuthStore((state) => state.token);
  const [isUploading, setIsUploading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const inputRef = useRef(null);

  async function handleSelect(file) {
    setErreur(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setErreur("Format non autorisé — utilisez un PNG ou JPEG.");
      return;
    }
    setIsUploading(true);
    try {
      const { url } = await uploadDocumentRequest(file, "logo", token);
      onCommit(url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo de l'établissement"
              className="h-10 w-10 rounded-sm border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => onCommit("")}
              disabled={disabled || isUploading}
              className="text-xs font-medium text-muted-foreground hover:text-destructive"
            >
              <FiX className="mr-1 inline h-3.5 w-3.5" />
              Retirer
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          {isUploading ? (
            <FiLoader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FiImage className="h-3.5 w-3.5" />
          )}
          {logoUrl ? "Changer" : "Ajouter un logo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] && handleSelect(e.target.files[0])
          }
        />
      </div>
      {erreur && <p className="text-xs text-destructive">{erreur}</p>}
    </div>
  );
}

export default function ParametresUniversitePage() {
  const [recherche, setRecherche] = useState("");
  const { data: profile, isLoading } = useUniversiteProfile();
  const updateMutation = useUpdateUniversiteProfile();

  function commit(champ, valeur) {
    updateMutation.mutate({ [champ]: valeur });
  }

  return (
    <>
      <AppHeader
        title="Paramètres"
        subtitle="Informations et préférences de l'établissement"
        searchValue={recherche}
        onSearchChange={setRecherche}
      />

      <div className="max-w-2xl space-y-6 px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {profile && (
          <>
            <Section
              title="Établissement"
              description="Ces informations ont été vérifiées lors de l'inscription. Pour les corriger, contactez le support."
            >
              <Row label="Nom de l'établissement">
                <span className="text-sm text-foreground">
                  {profile.nomUniversite}
                </span>
              </Row>
              <Row label="E-mail officiel">
                <span className="text-sm text-foreground">
                  {profile.emailOfficiel}
                </span>
              </Row>
              <Row label="Type d'établissement">
                <span className="text-sm text-foreground">
                  {profile.typeEtablissement}
                </span>
              </Row>
              <Row label="Pays">
                <span className="text-sm text-foreground">{profile.pays}</span>
              </Row>
              <Row label="Statut de vérification">
                <StatutVerificationBadge statut={profile.statutVerification} />
              </Row>
            </Section>

            <Section title="Présence en ligne">
              <Row
                label="Logo de l'établissement"
                description="Visible par les entreprises partenaires"
              >
                <LogoField
                  logoUrl={profile.logoUrl}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("logoUrl", v)}
                />
              </Row>
              <Row label="Site web">
                <TextField
                  value={profile.siteWeb}
                  placeholder="https://votre-universite.edu"
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("siteWeb", v)}
                />
              </Row>
            </Section>

            <Section
              title="Coordination des stages"
              description="Aide les entreprises partenaires à mieux comprendre vos attentes"
            >
              <Row label="Nom du coordinateur de stage">
                <TextField
                  value={profile.nomCoordinateurStage}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("nomCoordinateurStage", v)}
                />
              </Row>
              <Row label="Contact du service carrière">
                <TextField
                  value={profile.contactServiceCarriere}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("contactServiceCarriere", v)}
                />
              </Row>
              <Row
                label="Période de stage habituelle"
                description="Ex : Juin - Août"
              >
                <TextField
                  value={profile.periodeStageHabituelle}
                  placeholder="Juin - Août"
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("periodeStageHabituelle", v)}
                />
              </Row>
              <Row label="Heures recommandées / semaine">
                <NumberField
                  value={profile.heuresRecommandeesSemaine}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("heuresRecommandeesSemaine", v)}
                />
              </Row>
              <Row label="Nombre d'étudiants">
                <NumberField
                  value={profile.nombreEtudiants}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("nombreEtudiants", v)}
                />
              </Row>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
