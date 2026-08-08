"use client";
// Bloc "Prochaine étape" du tableau de bord stagiaire : checklist des
// actions de complétion de profil, avec petite animation quand une étape
// passe de "à faire" à "validée".

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiTarget, FiCheck } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

function Etape({ label, fait, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-sm px-1 py-2 transition hover:bg-muted/40"
    >
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
          fait
            ? "border-[#14b8a6] bg-[#14b8a6]"
            : "border-muted-foreground/30 bg-transparent"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {fait && (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <FiCheck className="h-3.5 w-3.5 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span
        className={`text-sm ${
          fait
            ? "text-muted-foreground line-through"
            : "font-medium text-foreground"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default function ProchaineEtapeCard({ profil }) {
  const { t } = useTranslation();
  if (!profil) return null;

  const etapes = [
    {
      label: t("dashboard.nextStep.steps.addCv"),
      fait: !!profil.cvUrl,
      href: "/profil",
    },
    {
      label: t("dashboard.nextStep.steps.addPhoto"),
      fait: !!profil.photoProfilUrl,
      href: "/profil",
    },
    {
      label: t("dashboard.nextStep.steps.verifyEmail"),
      fait: !!profil.emailVerifie,
      href: "/parametres",
    },
    {
      label: t("dashboard.nextStep.steps.addSkills"),
      fait: (profil.competences?.length ?? 0) > 0,
      href: "/profil",
    },
  ];

  const restantes = etapes.filter((e) => !e.fait).length;

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <div className="mb-1 flex items-center gap-2">
        <FiTarget className="h-4 w-4 text-[#14b8a6]" />
        <h3 className="text-sm font-bold text-foreground">
          {t("dashboard.nextStep.title")}
        </h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {restantes > 0
          ? t(
              restantes > 1
                ? "dashboard.nextStep.remainingMany"
                : "dashboard.nextStep.remainingOne",
              { n: restantes },
            )
          : t("dashboard.nextStep.complete")}
      </p>

      <div className="space-y-1">
        {etapes.map((e) => (
          <Etape key={e.label} label={e.label} fait={e.fait} href={e.href} />
        ))}
      </div>
    </div>
  );
}
