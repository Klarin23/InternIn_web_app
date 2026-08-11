"use client";
// Hero réutilisable : reçoit son contenu en props, pour être utilisé
// sur la home ET sur les pages Étudiants/Entreprises/Universités.
// Les icônes sont sélectionnées via une petite clé texte (iconMap ci-dessous),
// jamais passées directement en props (une fonction/composant ne peut pas
// traverser la frontière Server → Client Component).

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  Users,
  BarChart3,
  Briefcase,
} from "lucide-react";

const iconMap = {
  shield: ShieldCheck,
  award: Award,
  users: Users,
  chart: BarChart3,
  briefcase: Briefcase,
};

export default function Hero({
  i18nKey,
  eyebrow: eyebrowProp,
  title: titleProp,
  tagline: taglineProp,
  description: descriptionProp,
  checklist: checklistProp,
  primaryCta: primaryCtaProp,
  secondaryCta: secondaryCtaProp,
  imageUrl = "/images/hero.svg",
  imageAlt = "Étudiants, entreprises et universités connectés sur InternIn",
  floatCards: floatCardsProp,
  stats: statsProp,
  titleClassName,
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow =
    eyebrowProp ??
    i18n?.eyebrow ??
    "Connecter l'Éducation, l'Expérience et les Opportunités";
  const title =
    titleProp ??
    i18n?.title ??
    "Lancez votre carrière grâce à des stages porteurs de sens.";
  const tagline =
    taglineProp ??
    i18n?.tagline ??
    "Apprenez. Évoluez. Obtenez des recommandations.";
  const description =
    descriptionProp ??
    i18n?.description ??
    "InternIn connecte les étudiants, les universités et les entreprises grâce à des programmes de stage structurés conçus pour développer une véritable expérience professionnelle et préparer la prochaine génération de professionnels.";
  const checklist = checklistProp ??
    i18n?.checklist ?? [
      "Découvrez des opportunités vérifiées, adaptées à vos compétences",
      "Bénéficiez d'un accompagnement propulsé par l'IA tout au long du stage",
      "Construisez une expérience vérifiée et des recommandations reconnues",
    ];
  const primaryCta = primaryCtaProp ??
    i18n?.primaryCta ?? {
      label: "Créer un compte gratuitement",
      href: "/inscription",
    };
  const secondaryCta = secondaryCtaProp ??
    i18n?.secondaryCta ?? {
      label: "Découvrir le fonctionnement",
      href: "#comment-ca-marche",
    };
  const floatCards = floatCardsProp ??
    i18n?.floatCards ?? [
      {
        icon: "shield",
        title: "Entreprise vérifiée",
        subtitle: "CodeLab · Génie Logiciel",
      },
      {
        icon: "award",
        title: "Certificat obtenu",
        subtitle: "Expérience vérifiée",
      },
    ];
  const stats = statsProp ??
    i18n?.stats ?? [
      ["120+", "Entreprises vérifiées"],
      ["340+", "Stages actifs"],
      ["18", "Universités partenaires"],
      ["560+", "Étudiants placés"],
    ];
  return (
    <>
      <section className="relative overflow-x-clip pt-16 pb-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:px-10 lg:grid-cols-2 lg:gap-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center rounded-full border border-[#F7B500]/35 bg-[#fdfdfd] px-3.5 py-1.5 text-sm font-semibold text-[#faa20b]">
              {eyebrow}
            </span>

            <h1
              className={
                titleClassName ??
                "mt-5 max-w-150 text-4xl font-bold leading-tight text-foreground md:text-5xl"
              }
            >
              {title}
            </h1>
            {tagline && (
              <p className="mt-3.5 text-lg font-semibold text-blue-500">
                {tagline}
              </p>
            )}
            <p className="mt-3.5 max-w-130 text-muted-foreground">
              {description}
            </p>

            <motion.div
              className="mt-6 flex flex-col gap-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              {checklist.map((text, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="flex items-center gap-2.5 text-sm font-medium text-foreground/90"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  {text}
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-7 flex flex-wrap gap-3">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  asChild
                  className="h-12 rounded-sm px-5 text-sm font-medium"
                >
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  asChild
                  className="h-12 rounded-sm border border-[#E8A800] bg-[#fac73a] px-5 text-sm font-semibold text-[#ffffff] shadow-none hover:bg-[#E8A800] hover:text-[#f8f8f8]"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full min-w-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageAlt}
              className="mx-auto block h-auto w-full max-w-full object-contain object-center"
              style={{ maxHeight: "min(560px, 70vh)" }}
            />

            {floatCards[0] && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute left-2 top-4 z-10 flex max-w-62.5 items-center gap-3 rounded-md bg-card p-4 shadow-md sm:left-4 sm:top-6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  {(() => {
                    const Icon = iconMap[floatCards[0].icon];
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {floatCards[0].title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {floatCards[0].subtitle}
                  </div>
                </div>
              </motion.div>
            )}

            {floatCards[1] && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute bottom-4 right-2 z-10 flex max-w-62.5 items-center gap-3 rounded-md bg-card p-4 shadow-md sm:bottom-6 sm:right-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent/40 text-amber-700">
                  {(() => {
                    const Icon = iconMap[floatCards[1].icon];
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {floatCards[1].title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {floatCards[1].subtitle}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {stats.length > 0 && (
        <motion.section
          className="border-y border-border bg-muted py-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 md:px-10 lg:grid-cols-4 lg:px-20">
            {stats.map(([num, label], index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="text-center"
              >
                <div className="text-2xl font-extrabold text-foreground">
                  <span className="text-primary">{num}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </>
  );
}
