import Hero from "@/components/features/marketing/Hero";
import HowItWorks from "@/components/features/marketing/HowItWorks";
import FeaturesGrid from "@/components/features/marketing/FeaturesGrid";
import Testimonial from "@/components/features/marketing/Testimonial";
import Faq from "@/components/features/marketing/Faq";
import CtaFinal from "@/components/features/marketing/CtaFinal";

export const metadata = {
  title: "InternIn — Pour les Entreprises",
  description:
    "Découvrez, encadrez et développez les meilleurs talents étudiants grâce à une plateforme de gestion de stages complète.",
};

export default function EntreprisesPage() {
  return (
    <>
      <Hero
        i18nKey="marketing.companies.hero"
        imageUrl="/images/company.png"
        imageAlt="Entreprises partenaires sur InternIn"
        secondaryCtaClassName="h-12 rounded-sm border border-[#450f9cb2] bg-[#450f9cb2] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#450f9c] hover:text-white"
      />
      <HowItWorks i18nKey="marketing.companies.howItWorks" />
      <FeaturesGrid i18nKey="marketing.companies.features" />
      <Testimonial i18nKey="marketing.companies.testimonial" />
      <Faq i18nKey="marketing.companies.faq" />
      <CtaFinal
        i18nKey="marketing.companies.cta"
        ctaHref="/inscription/entreprise"
      />
    </>
  );
}