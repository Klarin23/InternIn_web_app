"use client";
// Profile Hero de la page "Mon profil" (espace stagiaire) — refonte
// visuelle uniquement. La logique d'upload de photo (useUploadPhotoProfil)
// est inchangée, seule la présentation change. Le pourcentage de
// complétion est calculé en direct à partir des données réelles du
// profil (voir lib/utils/profilCompletion.js) — jamais une valeur
// inventée.

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FiCamera, FiLoader, FiMapPin, FiMail } from "react-icons/fi";
import { useUploadPhotoProfil } from "@/lib/queries/useStagiaireProfile";
import { calculerCompletionProfil } from "@/lib/utils/profilCompletion";

export default function ProfilHeader({ profil }) {
  const fileInputRef = useRef(null);
  const uploadPhoto = useUploadPhotoProfil();
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { pourcentage, manquants } = calculerCompletionProfil(profil);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto.mutate(file);
    e.target.value = "";
  }

  const initiales =
    `${profil.prenom?.[0] || ""}${profil.nom?.[0] || ""}`.toUpperCase();

  const localisation = [profil.ville, profil.pays].filter(Boolean).join(", ");

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-md border border-border bg-card"
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        {/* Photo */}
        <motion.div
          initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="relative mx-auto flex-shrink-0 sm:mx-0"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setIsHoveringPhoto(true)}
            onMouseLeave={() => setIsHoveringPhoto(false)}
            disabled={uploadPhoto.isPending}
            aria-label="Changer la photo de profil"
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-sm ring-4 ring-background transition-transform duration-200 hover:scale-[1.02] sm:h-28 sm:w-28"
          >
            {profil.photoProfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profil.photoProfilUrl}
                alt={`${profil.prenom} ${profil.nom}`}
                className="h-full w-full object-cover"
              />
            ) : (
              initiales
            )}

            {/* Overlay au hover / focus */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white transition-opacity duration-200 ${
                isHoveringPhoto || uploadPhoto.isPending
                  ? "opacity-100"
                  : "opacity-0 group-focus-visible:opacity-100"
              }`}
            >
              {uploadPhoto.isPending ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <FiCamera className="h-5 w-5" />
                  <span className="text-[11px] font-medium">Modifier</span>
                </>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </motion.div>

        {/* Informations */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.12 }}
          className="min-w-0 flex-1 text-center sm:text-left"
        >
          <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
            {profil.prenom} {profil.nom}
          </h1>
          {profil.titreProfessionnel && (
            <p className="mt-0.5 truncate text-sm font-medium text-primary">
              {profil.titreProfessionnel}
            </p>
          )}

          <div className="mt-2 flex flex-col items-center gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
            {localisation && (
              <span className="flex items-center gap-1.5">
                <FiMapPin className="h-3.5 w-3.5 flex-shrink-0" />
                {localisation}
              </span>
            )}
            {profil.email && (
              <span className="flex min-w-0 items-center gap-1.5">
                <FiMail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{profil.email}</span>
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Barre de complétion */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="border-t border-border/60 bg-muted/30 px-5 py-4 sm:px-6"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">
            Profil complété
          </span>
          <span className="text-xs font-semibold text-primary">
            {pourcentage}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            initial={shouldReduceMotion ? false : { width: 0 }}
            animate={{ width: `${pourcentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full bg-primary"
          />
        </div>

        {manquants.length > 0 && pourcentage < 100 && (
          <p className="mt-2.5 truncate text-xs text-muted-foreground">
            Il vous manque :{" "}
            {manquants
              .map((m) => m.label.replace(/^Ajouter (votre|vos|un|une) /i, ""))
              .slice(0, 3)
              .join(", ")}
            {manquants.length > 3 ? "…" : ""}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
