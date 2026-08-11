"use client";
// Parcours en N étapes, réutilisable. Le numéro (1, 2, 3...) est
// généré automatiquement à partir de la position dans le tableau `steps`.

import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function HowItWorks({
  i18nKey,
  sectionId = "comment-ca-marche",
  eyebrow: eyebrowProp,
  title: titleProp,
  steps: stepsProp,
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow =
    eyebrowProp ?? i18n?.eyebrow ?? "Comment ça fonctionne pour les stagiaires";
  const title =
    titleProp ?? i18n?.title ?? "Votre parcours en 5 étapes simples";
  const steps = stepsProp ??
    i18n?.steps ?? [
      [
        "Créez votre profil",
        "Renseignez votre formation, vos disponibilités, vos compétences et centres d'intérêt.",
      ],
      [
        "Postulez ou soyez invité",
        "Parcourez les offres vérifiées ou recevez des invitations directes des entreprises.",
      ],
      [
        "Passez l'entretien",
        "Entretiens planifiés et menés directement sur InternIn, avec rappels automatiques.",
      ],
      [
        "Apprenez & progressez",
        "Évaluations hebdomadaires de votre superviseur et accompagnement du Coach IA.",
      ],
      [
        "Obtenez votre reconnaissance",
        "Certificat de réussite et recommandation officielle de votre employeur.",
      ],
    ];
  return (
    <section id={sectionId} className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-20">
        <FadeIn className="mx-auto mb-14 max-w-160 text-center">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
        </FadeIn>

        <Stagger
          className={`relative grid grid-cols-1 gap-10 lg:grid-cols-${Math.min(steps.length, 5)} lg:gap-6`}
        >
          <div className="absolute top-5.5 left-0 right-0 hidden h-0.5 bg-border lg:block" />
          {steps.map(([title, desc], index) => (
            <StaggerItem key={index} className="relative pr-4">
              <div className="relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary font-bold text-white ring-8 ring-background">
                {index + 1}
              </div>
              <h5 className="mb-1.5 font-semibold text-foreground">{title}</h5>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
