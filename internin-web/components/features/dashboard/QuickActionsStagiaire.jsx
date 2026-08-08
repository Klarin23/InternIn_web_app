"use client";
// Actions rapides sous les statistiques. Au survol : légère montée +
// halo lumineux coloré (box-shadow teinté selon l'action, pas juste plus
// sombre) — "Favoris" reste désactivé, la fonctionnalité n'existe pas
// encore côté backend (cf. QuickStatsGrid : "Offres enregistrées").

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, FileText, Heart, User } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function QuickActionsStagiaire() {
  const { t } = useTranslation();

  const ACTIONS = [
    {
      key: "rechercher",
      icon: Search,
      label: t("dashboard.quickActions.search"),
      href: "/offres",
      color: "bg-primary/10 text-primary",
      glow: "rgba(20, 184, 166, 0.25)",
    },
    {
      key: "candidatures",
      icon: FileText,
      label: t("dashboard.quickActions.applications"),
      href: "/candidatures",
      color: "bg-secondary-foreground/10 text-secondary-foreground",
      glow: "rgba(91, 61, 245, 0.22)",
    },
    {
      key: "favoris",
      icon: Heart,
      label: t("dashboard.quickActions.favorites"),
      href: null,
      color: "bg-pink-500/10 text-pink-500",
      glow: "rgba(236, 72, 153, 0.2)",
      indisponible: true,
    },
    {
      key: "profil",
      icon: User,
      label: t("dashboard.quickActions.editProfile"),
      href: "/profil",
      color: "bg-amber-500/10 text-amber-600",
      glow: "rgba(245, 158, 11, 0.22)",
    },
  ];

  return (
    <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ACTIONS.map(
        ({ key, icon: Icon, label, href, color, glow, indisponible }) => (
          <StaggerItem key={key}>
            {indisponible ? (
              <div className="flex cursor-not-allowed flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-4 py-5 text-center opacity-60">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-foreground">
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("dashboard.quickActions.comingSoon")}
                </span>
              </div>
            ) : (
              <Link href={href} className="block">
                <motion.div
                  whileHover={{ y: -4, boxShadow: `0 12px 28px -6px ${glow}` }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-4 py-5 text-center shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)]"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {label}
                  </span>
                </motion.div>
              </Link>
            )}
          </StaggerItem>
        ),
      )}
    </Stagger>
  );
}
