"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { FiBookOpen } from "react-icons/fi";
import ProfilSectionCard from "./ProfilSectionCard";

export default function ParcoursAcademiqueSection({ profil }) {
  const { t } = useTranslation();
  const formations = profil.formations || [];
  const plusieurs = formations.length > 1;

  return (
    <ProfilSectionCard title={t("stagiaireSpace.profile.academic")} icon={FiBookOpen}>
      {formations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("stagiaireSpace.profile.academicSection.empty")}
        </p>
      ) : (
        <div className={plusieurs ? "relative space-y-5 pl-5" : "space-y-4"}>
          {plusieurs && (
            <div className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
          )}
          {formations.map((f, i) => (
            <div key={i} className="relative">
              {plusieurs && (
                <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-card" />
              )}
              <div className="rounded-md border border-border/60 bg-muted/30 p-3.5 transition-colors duration-150 hover:border-primary/40">
                <p className="text-sm font-medium text-foreground">
                  {f.diplome}
                </p>
                <p className="text-sm text-muted-foreground">
                  {f.nomUniversite}
                  {f.faculte ? ` — ${f.faculte}` : ""}
                  {f.departement ? ` — ${f.departement}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`stagiaireSpace.profile.formationTypes.${f.typeFormation}`) || f.typeFormation}
                  {f.anneeEtude ? ` · ${t("stagiaireSpace.profile.academicSection.year")} ${f.anneeEtude}` : ""}
                  {f.anneeObtention ? ` · ${t("stagiaireSpace.profile.academicSection.obtained")} ${f.anneeObtention}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfilSectionCard>
  );
}
