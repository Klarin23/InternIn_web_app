"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  FiCamera,
  FiLoader,
  FiCheckCircle,
  FiMapPin,
  FiEdit2,
} from "react-icons/fi";
import { useUploadLogoEntreprise } from "@/lib/queries/useEntrepriseProfile";
import { toast } from "@/lib/store/useToastStore";

export default function EntrepriseProfilHeader({ profil, onModifier }) {
  const fileInputRef = useRef(null);
  const uploadLogo = useUploadLogoEntreprise();

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file, {
      onError: (err) => toast.error(err.message || "Échec de l'envoi du logo"),
    });
    e.target.value = "";
  }

  const estVerifiee = profil.statutVerification === "verifie";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-md border border-border bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent p-6"
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="group relative flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.18 }}
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-primary text-2xl font-bold text-primary-foreground shadow-sm"
          >
            {profil.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profil.logoUrl}
                alt={profil.nomEntreprise}
                className="h-full w-full object-cover"
              />
            ) : (
              profil.nomEntreprise?.charAt(0)
            )}
          </motion.div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLogo.isPending}
            aria-label="Changer le logo de l'entreprise"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground opacity-0 shadow-sm transition-opacity duration-150 hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100"
          >
            {uploadLogo.isPending ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FiCamera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              {profil.nomEntreprise}
            </h1>
            {estVerifiee && (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-green-700">
                <FiCheckCircle className="h-3.5 w-3.5" />
                Entreprise vérifiée
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {profil.secteurActivite || "Secteur non renseigné"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <FiMapPin className="h-3.5 w-3.5" />
            {[profil.ville, profil.pays].filter(Boolean).join(", ") ||
              "Localisation non renseignée"}
          </p>
          {profil.aPropos && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-foreground">
              {profil.aPropos}
            </p>
          )}
        </div>

        <motion.button
          type="button"
          onClick={onModifier}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="group flex flex-shrink-0 items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <FiEdit2 className="h-4 w-4 transition-transform duration-150 group-hover:rotate-6" />
          Modifier le profil
        </motion.button>
      </div>
    </motion.div>
  );
}
