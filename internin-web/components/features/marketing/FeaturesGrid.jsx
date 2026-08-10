"use client";
// Grille de fonctionnalités réutilisable. Chaque feature référence une icône
// par sa clé (string) dans iconMap, jamais par composant direct en prop.

import { motion } from "framer-motion";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ShieldCheck,
  Sparkles,
  Users,
  ClipboardCheck,
  Award,
  Share2,
  Briefcase,
  LineChart,
  BarChart3,
  Handshake,
  Calendar,
  MessageSquare,
  Target,
} from "lucide-react";

const iconMap = {
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: Users,
  clipboard: ClipboardCheck,
  award: Award,
  share: Share2,
  briefcase: Briefcase,
  linechart: LineChart,
  barchart: BarChart3,
  handshake: Handshake,
  calendar: Calendar,
  message: MessageSquare,
  target: Target,
};

const colorMap = {
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  gold: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
};

export default function FeaturesGrid({
  i18nKey,
  eyebrow: eyebrowProp,
  title: titleProp,
  features: featuresProp,
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow =
    eyebrowProp ?? i18n?.eyebrow ?? "Tout ce qu'il vous faut pour grandir";
  const title =
    titleProp ?? i18n?.title ?? "Des outils pensés pour votre réussite";
  const features = featuresProp ??
    i18n?.features ?? [
      {
        icon: "shield",
        title: "Opportunités Vérifiées",
        desc: "Chaque entreprise est vérifiée avant de rejoindre la plateforme.",
        color: "teal",
      },
      {
        icon: "sparkles",
        title: "Coach IA de Développement",
        desc: "Un accompagnement personnalisé basé sur votre progression réelle durant le stage.",
        color: "violet",
      },
      {
        icon: "users",
        title: "Mentorat Structuré",
        desc: "Un superviseur dédié pour vous accompagner et vous fournir un retour hebdomadaire.",
        color: "gold",
      },
      {
        icon: "clipboard",
        title: "Évaluations Hebdomadaires",
        desc: "Un suivi régulier et concret de votre progression, semaine après semaine.",
        color: "teal",
      },
      {
        icon: "award",
        title: "Expérience Vérifiée",
        desc: "Terminez vos stages avec un certificat reconnu et un badge d'expérience vérifiée.",
        color: "violet",
      },
      {
        icon: "share",
        title: "Recommandations Employeur",
        desc: "Obtenez une recommandation officielle, partageable directement sur LinkedIn.",
        color: "gold",
      },
    ];
  return (
    <section className="bg-muted py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-20">
        <FadeIn className="mb-14 max-w-170">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
        </FadeIn>

        <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ icon, title, desc, color }) => {
            const Icon = iconMap[icon];
            return (
              <StaggerItem key={title}>
                <motion.div
                  whileHover={{
                    y: -6,
                    boxShadow: "0 12px 24px rgba(17,24,39,0.08)",
                  }}
                  className="h-full rounded-md border border-border bg-card p-6 shadow-sm"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-sm ${colorMap[color]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h5 className="mb-1.5 font-semibold text-foreground">
                    {title}
                  </h5>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
