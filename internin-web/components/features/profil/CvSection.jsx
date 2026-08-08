"use client";

import { useRef, useState } from "react";
import { FiFileText, FiEye, FiDownload, FiRefreshCw, FiLoader } from "react-icons/fi";
import { uploadDocumentRequest } from "@/lib/api/documents";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";
import { useAuthStore } from "@/lib/store/useAuthStore";
import ProfilSectionCard from "./ProfilSectionCard";

export default function CvSection({ profil }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const updateProfile = useUpdateStagiaireProfile();

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadDocumentRequest(file, "cv", token);
      await updateProfile.mutateAsync({ cvUrl: url });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Nom de fichier extrait de l'URL réelle du CV (rien n'est inventé) —
  // juste la dernière portion du chemin, décodée.
  const nomFichier = profil.cvUrl
    ? decodeURIComponent(profil.cvUrl.split("/").pop() || "")
    : null;

  return (
    <ProfilSectionCard title="CV" icon={FiFileText}>
      <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FiFileText className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {profil.cvUrl ? "CV actuel" : "Aucun CV importé"}
            </p>
            {nomFichier && (
              <p className="truncate text-xs text-muted-foreground">
                {nomFichier}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-1">
          {profil.cvUrl && (
            <>
              <a
                href={profil.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <FiEye className="h-3.5 w-3.5" />
                Voir
              </a>
              <a
                href={profil.cvUrl}
                download
                className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <FiDownload className="h-3.5 w-3.5" />
                Télécharger
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-primary transition-colors duration-150 hover:bg-primary/10"
          >
            {uploading ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FiRefreshCw className="h-3.5 w-3.5" />
            )}
            Remplacer
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
    </ProfilSectionCard>
  );
}