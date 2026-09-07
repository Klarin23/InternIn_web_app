"use client";

import { motion } from "framer-motion";
import { FiTrendingUp } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

/** Mappe un id de champ ou un label FR historique vers une clé i18n */
function fieldLabel(t, item) {
  if (!item) return "";
  // Nouveau format : id technique (logoUrl, siteWeb…)
  const key = `profilEntreprise.completion.fields.${item}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  // Ancien format API : libellés FR déjà en base
  const legacy = {
    "votre logo": "logoUrl",
    "votre secteur d'activité": "secteurActivite",
    "la taille de l'entreprise": "tailleEntreprise",
    "votre site web": "siteWeb",
    "votre adresse": "adresse",
    "une description de l'entreprise": "aPropos",
  };
  const id = legacy[item];
  if (id) {
    return t(`profilEntreprise.completion.fields.${id}`);
  }
  return item;
}

export default function CompletudeCard({ profil }) {
  const { t } = useTranslation();
  const score = profil.scoreCompletude ?? 0;
  const manquants = profil.champsManquants || [];

  if (score >= 100) return null;

  const first = manquants.slice(0, 2).map((m) => fieldLabel(t, m));
  const fieldsStr = first.join(t("profilEntreprise.completion.and"));
  const extra = manquants.length - 2;
  const more =
    extra > 0
      ? t("profilEntreprise.completion.andMore", { count: extra })
      : "";

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FiTrendingUp className="h-4 w-4 text-primary" />
          {t("profilEntreprise.completion.title", { score })}
        </h5>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
        />
      </div>

      {manquants.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("profilEntreprise.completion.addFields", {
            fields: `${fieldsStr}${more}`,
          })}
        </p>
      )}
    </div>
  );
}
