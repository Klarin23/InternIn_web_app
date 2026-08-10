import Hero from "@/components/features/marketing/Hero";
import HowItWorks from "@/components/features/marketing/HowItWorks";
import FeaturesGrid from "@/components/features/marketing/FeaturesGrid";
import Testimonial from "@/components/features/marketing/Testimonial";
import Faq from "@/components/features/marketing/Faq";
import CtaFinal from "@/components/features/marketing/CtaFinal";

export const metadata = {
  title: "InternIn — Pour les Universités",
  description:
    "Accompagnez vos étudiants vers l'emploi grâce à des stages de qualité et un suivi en temps réel.",
};

export default function UniversitesPage() {
  return (
    <>
      <Hero
        i18nKey="marketing.universities.hero"
        imageUrl="/images/university-hero.png"
        imageAlt="Universités partenaires sur InternIn"
        titleClassName="mt-5 max-w-150 text-3xl font-bold leading-tight text-foreground md:text-4xl"
      />
      <HowItWorks i18nKey="marketing.universities.howItWorks" />
      <FeaturesGrid i18nKey="marketing.universities.features" />
      <Testimonial i18nKey="marketing.universities.testimonial" />
      <Faq i18nKey="marketing.universities.faq" />
      <CtaFinal
        i18nKey="marketing.universities.cta"
        ctaHref="/inscription/universite"
      />
    </>
  );
}