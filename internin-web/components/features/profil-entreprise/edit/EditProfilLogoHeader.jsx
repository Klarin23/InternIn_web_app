"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiCamera, FiLoader, FiCheckCircle } from "react-icons/fi";
import { useUploadLogoEntreprise } from "@/lib/queries/useEntrepriseProfile";
import { toast } from "@/lib/store/useToastStore";

// Header du formulaire d'édition : logo (modifiable avec aperçu immédiat),
// nom, secteur et badge de vérification. Gère son propre upload (comme le
// faisait déjà EntrepriseProfilHeader sur la page profil) afin de ne pas
// dépendre du cycle de soumission du reste du formulaire — le logo est
// sauvegardé indépendamment, exactement comme avant.
export default function EditProfilLogoHeader({ profil }) {
  const fileInputRef = useRef(null);
  const uploadLogo = useUploadLogoEntreprise();
  const [previewUrl, setPreviewUrl] = useState(null);

  // Nettoie l'URL objet créée localement pour éviter les fuites mémoire.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    uploadLogo.mutate(file, {
      onError: (err) => {
        toast.error(err.message || "Échec de l'envoi du logo");
        setPreviewUrl(null);
      },
      onSuccess: () => setPreviewUrl(null),
    });
    e.target.value = "";
  }

  const estVerifiee = profil.statutVerification === "verifie";
  const logoAffiche = previewUrl || profil.logoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-start gap-4 rounded-md border border-border bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent p-4 sm:flex-row sm:items-center"
    >
      <div className="group relative flex-shrink-0">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-primary text-xl font-bold text-primary-foreground shadow-sm">
          {logoAffiche ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoAffiche}
              alt={profil.nomEntreprise}
              className="h-full w-full object-cover"
            />
          ) : (
            profil.nomEntreprise?.charAt(0)
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLogo.isPending}
          aria-label="Changer le logo de l'entreprise"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground opacity-0 shadow-sm transition-opacity duration-150 hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100"
        >
          {uploadLogo.isPending ? (
            <FiLoader className="h-3 w-3 animate-spin" />
          ) : (
            <FiCamera className="h-3 w-3" />
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
          <h3 className="truncate text-base font-semibold text-foreground">
            {profil.nomEntreprise || "Votre entreprise"}
          </h3>
          {estVerifiee && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-green-700">
              <FiCheckCircle className="h-3 w-3" />
              Entreprise vérifiée
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {profil.secteurActivite || "Secteur non renseigné"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadLogo.isPending}
        className="flex-shrink-0 self-start rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 sm:self-center"
      >
        Modifier le logo
      </button>
    </motion.div>
  );
}
