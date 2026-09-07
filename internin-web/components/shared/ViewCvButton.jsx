"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { openProtectedCv } from "@/lib/utils/openProtectedDocument";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

/**
 * Bouton universel « Voir le CV » — fetch authentifié.
 * Props:
 * - cvUrl (required unless idStagiaire)
 * - idStagiaire (optionnel) : utilise la route anti-IDOR dédiée
 * - label, className
 * - onBeforeOpen: callback optionnel (ex. signalerCv)
 * - download: true pour forcer le téléchargement
 */
export default function ViewCvButton({
  cvUrl,
  idStagiaire,
  label,
  className,
  onBeforeOpen,
  children,
  disabled,
  download = false,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!cvUrl && !idStagiaire) return null;

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (loading || disabled) return;
    setLoading(true);
    try {
      onBeforeOpen?.();
      await openProtectedCv(cvUrl || "", {
        download,
        idStagiaire: idStagiaire || undefined,
      });
    } catch (err) {
      toast.error(err?.message || t("entrepriseSpace.candidatures.cvAccessError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(className, (loading || disabled) && "opacity-60")}
      aria-label={label || t("entrepriseSpace.candidatures.viewCvDefault")}
    >
      {loading ? t("entrepriseSpace.candidatures.loadingEllipsis") : children || label || t("entrepriseSpace.candidatures.viewCvDefault")}
    </button>
  );
}
