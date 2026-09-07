"use client";

import { FiBriefcase, FiUsers, FiGlobe, FiLinkedin, FiMail, FiPhone, FiMapPin, FiPlus } from "react-icons/fi";
import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { safeHref } from "@/lib/utils/urlValidation";

function Champ({ icon: Icon, label, valeur, lien, onAjouter, addLabel }) {
  const href = lien ? safeHref(lien) : null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {valeur ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm font-medium text-primary hover:underline"
            >
              {valeur}
            </a>
          ) : (
            <p className="truncate text-sm font-medium text-foreground">{valeur}</p>
          )
        ) : (
          <button
            type="button"
            onClick={onAjouter}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <FiPlus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function InformationsContactSection({ profil, onModifier }) {
  const { t } = useTranslation();

  const tailleLabel = profil.tailleEntreprise
    ? t(`profilEntreprise.companySize.${profil.tailleEntreprise}`)
    : null;

  const fields = [
    {
      icon: FiBriefcase,
      label: t("profilEntreprise.contact.industry"),
      valeur: profil.secteurActivite,
    },
    {
      icon: FiUsers,
      label: t("profilEntreprise.contact.companySize"),
      valeur: tailleLabel,
    },
    {
      icon: FiMapPin,
      label: t("profilEntreprise.contact.address"),
      valeur: profil.adresse,
    },
    {
      icon: FiMapPin,
      label: t("profilEntreprise.contact.location"),
      valeur: [profil.ville, profil.pays].filter(Boolean).join(", ") || null,
    },
    {
      icon: FiGlobe,
      label: t("profilEntreprise.contact.website"),
      valeur: profil.siteWeb,
      lien: profil.siteWeb,
    },
    {
      icon: FiLinkedin,
      label: t("profilEntreprise.contact.linkedin"),
      valeur: profil.linkedinUrl,
      lien: profil.linkedinUrl,
    },
    {
      icon: FiMail,
      label: t("profilEntreprise.contact.email"),
      valeur: profil.email,
    },
    {
      icon: FiPhone,
      label: t("profilEntreprise.contact.phone"),
      valeur: profil.telephone,
    },
  ];

  return (
    <ProfilSectionCard title={t("profilEntreprise.contact.title")} onEdit={onModifier}>
      <div className="divide-y divide-border/60">
        {fields.map((f) => (
          <Champ
            key={f.label}
            icon={f.icon}
            label={f.label}
            valeur={f.valeur}
            lien={f.lien}
            onAjouter={onModifier}
            addLabel={t("profilEntreprise.contact.add", { label: f.label.toLowerCase() })}
          />
        ))}
      </div>
    </ProfilSectionCard>
  );
}
