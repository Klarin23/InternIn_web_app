"use client";

import { FiBriefcase, FiUsers, FiGlobe, FiLinkedin, FiMail, FiPhone, FiMapPin, FiPlus } from "react-icons/fi";
import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";

const TAILLE_LABELS = {
  "1-10": "1 à 10 employés",
  "11-50": "11 à 50 employés",
  "51-200": "51 à 200 employés",
  "201-500": "201 à 500 employés",
  "500+": "Plus de 500 employés",
};

function Champ({ icon: Icon, label, valeur, lien, onAjouter }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {valeur ? (
          lien ? (
            <a
              href={lien}
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
            Ajouter {label.toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}

export default function InformationsContactSection({ profil, onModifier }) {
  return (
    <ProfilSectionCard title="Informations & contact" onEdit={onModifier}>
      <div className="divide-y divide-border/60">
        <Champ icon={FiBriefcase} label="Secteur d'activité" valeur={profil.secteurActivite} onAjouter={onModifier} />
        <Champ
          icon={FiUsers}
          label="Taille de l'entreprise"
          valeur={TAILLE_LABELS[profil.tailleEntreprise]}
          onAjouter={onModifier}
        />
        <Champ icon={FiMapPin} label="Adresse" valeur={profil.adresse} onAjouter={onModifier} />
        <Champ
          icon={FiMapPin}
          label="Localisation"
          valeur={[profil.ville, profil.pays].filter(Boolean).join(", ") || null}
          onAjouter={onModifier}
        />
        <Champ
          icon={FiGlobe}
          label="Site web"
          valeur={profil.siteWeb}
          lien={profil.siteWeb}
          onAjouter={onModifier}
        />
        <Champ
          icon={FiLinkedin}
          label="LinkedIn"
          valeur={profil.linkedinUrl}
          lien={profil.linkedinUrl}
          onAjouter={onModifier}
        />
        <Champ icon={FiMail} label="Email professionnel" valeur={profil.email} lien={`mailto:${profil.email}`} />
        <Champ icon={FiPhone} label="Téléphone" valeur={profil.telephone} lien={profil.telephone ? `tel:${profil.telephone}` : null} />
      </div>
      {!profil.telephone && (
        <p className="mt-2 text-xs text-muted-foreground">
          Le téléphone provient du contact principal de votre équipe — gérable depuis le menu Équipe.
        </p>
      )}
    </ProfilSectionCard>
  );
}