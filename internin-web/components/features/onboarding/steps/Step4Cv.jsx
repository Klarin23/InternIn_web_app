"use client";
// Étape 4 : upload du CV (obligatoire, cf. stagiaires.cv_url NOT NULL).
// Zone de dépôt avec glisser-déposer + sélection classique, retour visuel
// de la progression et gestion d'erreur (format, taille, échec réseau).

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocumentRequest } from "@/lib/api/documents";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function Step4Cv() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { data, saveStepData } = useOnboardingStore();

  const [file, setFile] = useState(
    data.cvNomFichier ? { name: data.cvNomFichier } : null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function validateAndSetFile(selectedFile) {
    setError(null);
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Format non autorisé — utilisez un PDF, PNG ou JPEG.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale de 5 Mo.");
      return;
    }
    setFile(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }

  async function handleContinue() {
    if (!file) {
      setError("Merci d'ajouter votre CV avant de continuer.");
      return;
    }

    // Si le fichier vient déjà du store (retour arrière sans nouveau choix), on passe directement
    if (
      data.cvUrl &&
      file.name === data.cvNomFichier &&
      !(file instanceof File)
    ) {
      router.push("/onboarding/4");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const { url } = await uploadDocumentRequest(file, "cv", token);
      saveStepData({ cvUrl: url, cvNomFichier: file.name });
      router.push("/onboarding/4");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Ajoutez votre CV
        </h1>
        <p className="text-sm text-muted-foreground">
          Obligatoire pour candidater aux offres de stage. Format PDF, PNG ou
          JPEG — 5 Mo maximum.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!file ? (
        // Zone de dépôt vide
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-10 text-center transition ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/40"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Glissez-déposez votre CV ici
            </p>
            <p className="text-xs text-muted-foreground">
              ou cliquez pour parcourir vos fichiers
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && validateAndSetFile(e.target.files[0])
            }
          />
        </div>
      ) : (
        // Fichier sélectionné
        <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <span className="flex-1 truncate text-sm font-medium text-foreground">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setError(null);
            }}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Retirer ce fichier"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
          type="button"
          onClick={handleContinue}
          disabled={isUploading}
          className="h-12 flex-1 rounded-sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Continuer"
          )}
        </Button>
      </div>
    </div>
  );
}
