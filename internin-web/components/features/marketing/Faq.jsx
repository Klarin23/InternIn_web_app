"use client";
import FadeIn from "@/components/motion/FadeIn";
import FaqItem from "./FaqItem";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Faq({
  i18nKey,
  eyebrow: eyebrowProp,
  title: titleProp,
  questions: questionsProp,
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow = eyebrowProp ?? i18n?.eyebrow ?? "Questions fréquentes";
  const title =
    titleProp ?? i18n?.title ?? "Des questions ? Nous avons les réponses.";
  const questions = questionsProp ??
    i18n?.questions ?? [
      [
        "Puis-je postuler à plusieurs stages ?",
        "Oui, tant que vous n'avez pas de stage actif. Dès qu'une offre est acceptée, vos autres candidatures en cours sont automatiquement désactivées.",
      ],
      [
        "Les entreprises voient-elles mes coordonnées ?",
        "Non. Vos coordonnées directes ne sont visibles par l'entreprise qu'une fois votre stage activé, après acceptation de la convention.",
      ],
      [
        "InternIn est-il gratuit ?",
        "Oui, InternIn est entièrement gratuit pour les stagiaires.",
      ],
    ];
  return (
    <section className="bg-muted py-20">
      <div className="mx-auto max-w-190 px-6 md:px-10 lg:px-20">
        <FadeIn className="mb-12 text-center">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          {questions.map(([q, a], index) => (
            <FaqItem key={index} question={q} answer={a} />
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
