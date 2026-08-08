"use client";

import Link from "next/link";
import { GraduationCap, Briefcase, Landmark } from "lucide-react";
import RoleCard from "./RoleCard";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function RoleSelection() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-7">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {t("auth.roleSelection.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.roleSelection.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <RoleCard
          href="/inscription/stagiaire"
          icon={GraduationCap}
          iconClass="bg-blue-600 text-white"
          title={t("auth.roleSelection.student.title")}
          description={t("auth.roleSelection.student.desc")}
        />
        <RoleCard
          href="/inscription/entreprise"
          icon={Briefcase}
          iconClass="bg-violet-600 text-white"
          title={t("auth.roleSelection.company.title")}
          description={t("auth.roleSelection.company.desc")}
        />
        <RoleCard
          href="/inscription/universite"
          icon={Landmark}
          iconClass="bg-emerald-600 text-white"
          title={t("auth.roleSelection.university.title")}
          description={t("auth.roleSelection.university.desc")}
        />
      </div>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {t("auth.roleSelection.alreadyAccount")}{" "}
        <Link
          href="/connexion"
          className="font-semibold text-blue-500 hover:underline"
        >
          {t("auth.roleSelection.login")}
        </Link>
      </p>
    </div>
  );
}
