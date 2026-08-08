"use client";
// 3 cartes présentant chaque type d'utilisateur de la plateforme
// (correspond aux 3 rôles publics : stagiaire, entreprise, universite).

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { GraduationCap, Briefcase, Landmark } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AudienceCards({ i18nKey = "marketing.audienceCards" }) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow = i18n?.eyebrow ?? "Conçu pour tous";
  const title = i18n?.title ?? "Un écosystème pour chaque acteur du stage";
  const students = {
    title: "Étudiants",
    desc: "Lancez votre carrière grâce à une expérience professionnelle enrichissante.",
    cta: "Créer un compte étudiant",
    ...i18n?.students,
  };
  const companies = {
    title: "Entreprises",
    desc: "Identifiez les talents de demain et accompagnez la prochaine génération.",
    cta: "Inscrire mon entreprise",
    ...i18n?.companies,
  };
  const universities = {
    title: "Universités",
    desc: "Favorisez l'employabilité de vos étudiants et suivez leur progression.",
    cta: "Devenir partenaire",
    ...i18n?.universities,
  };

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
          <StaggerItem>
            <motion.div
              id="etudiants"
              whileHover={{ y: -6 }}
              className="flex h-full flex-col rounded-md bg-linear-to-br from-[#0F9C8C] to-primary p-8 text-white shadow-sm"
            >
              <GraduationCap className="mb-4 h-8 w-8" />
              <h5 className="mb-2 text-lg font-semibold">{students.title}</h5>
              <p className="mb-6 text-sm text-white/85">{students.desc}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-auto self-start"
                asChild
              >
                <Link href="/inscription/stagiaire">{students.cta}</Link>
              </Button>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              id="entreprises"
              whileHover={{ y: -6 }}
              className="flex h-full flex-col rounded-md bg-linear-to-br from-[#4B31D6] to-secondary p-8 text-white shadow-sm"
            >
              <Briefcase className="mb-4 h-8 w-8" />
              <h5 className="mb-2 text-lg font-semibold">{companies.title}</h5>
              <p className="mb-6 text-sm text-white/85">{companies.desc}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto self-start border-white/50 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/inscription/entreprise">{companies.cta}</Link>
              </Button>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              id="universites"
              whileHover={{ y: -6 }}
              className="flex h-full flex-col rounded-md bg-linear-to-br from-foreground to-foreground/80 p-8 text-white shadow-sm"
            >
              <Landmark className="mb-4 h-8 w-8" />
              <h5 className="mb-2 text-lg font-semibold">
                {universities.title}
              </h5>
              <p className="mb-6 text-sm text-white/85">{universities.desc}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto self-start border-white/50 bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/inscription/universite">{universities.cta}</Link>
              </Button>
            </motion.div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
