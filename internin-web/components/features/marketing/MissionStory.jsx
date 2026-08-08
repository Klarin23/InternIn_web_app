"use client";
// Bloc "mission" de la page À propos : 4 chiffres clés à gauche,
// texte de mission à droite. Réutilise FadeIn pour l'apparition au scroll.

import FadeIn from "@/components/motion/FadeIn";
import { useTranslation } from "@/lib/i18n/useTranslation";

const tilesParDefaut = [
  ["12", "Étapes du cycle de stage"],
  ["4", "Communautés connectées"],
  ["100%", "Gratuit pour les stagiaires"],
  ["IA", "Coaching personnalisé"],
];

const paragraphesParDefaut = [
  "InternIn a été créé pour réduire le fossé entre l'éducation et l'emploi. Trop d'étudiants obtiennent leur diplôme sans expérience pratique, tandis que les entreprises rencontrent des difficultés pour identifier et développer les talents émergents.",
  "Nous changeons cette réalité en rendant les stages structurés, mesurables et orientés vers le développement professionnel. Notre plateforme rassemble étudiants, universités et employeurs afin de créer des expériences de stage enrichissantes, soutenues par le mentorat, la responsabilisation et le développement professionnel assisté par l'intelligence artificielle.",
  "Parce que chaque étudiant mérite l'opportunité d'acquérir une expérience concrète avant d'entrer sur le marché du travail.",
];

export default function MissionStory({
  i18nKey = "marketing.about.missionStory",
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow = i18n?.eyebrow ?? "À propos d'InternIn";
  const title =
    i18n?.title ??
    "Former les professionnels prêts pour l'avenir à travers l'Afrique";
  const tiles = i18n?.tiles ?? tilesParDefaut;
  const paragraphs = i18n?.paragraphs ?? paragraphesParDefaut;

  return (
    <section className="bg-background py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-20">
        {/* Grille de 4 chiffres clés */}
        <FadeIn
          y={0}
          className="grid grid-cols-2 gap-4 rounded-md bg-secondary/10 p-8"
        >
          {tiles.map(([num, label]) => (
            <div key={label} className="rounded-md bg-card p-5 shadow-sm">
              <div className="text-2xl font-extrabold text-secondary">
                {num}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </FadeIn>

        {/* Texte de mission */}
        <FadeIn delay={0.1}>
          <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
          <h2 className="mb-5 text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
          <div className="space-y-4 text-muted-foreground">
            {paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={
                  index === paragraphs.length - 1
                    ? "font-semibold text-foreground"
                    : undefined
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
