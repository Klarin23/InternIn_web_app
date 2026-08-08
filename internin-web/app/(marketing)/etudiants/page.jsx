import Hero from "@/components/features/marketing/Hero";
import HowItWorks from "@/components/features/marketing/HowItWorks";
import FeaturesGrid from "@/components/features/marketing/FeaturesGrid";
import CategoriesGrid from "@/components/features/marketing/CategoriesGrid";
import Testimonial from "@/components/features/marketing/Testimonial";
import Faq from "@/components/features/marketing/Faq";
import CtaFinal from "@/components/features/marketing/CtaFinal";

export const metadata = {
  title: "InternIn — Pour les Étudiants",
  description:
    "Trouvez un stage vérifié, développez vos compétences avec le Coach IA, et obtenez une expérience reconnue.",
};

export default function EtudiantsPage() {
  return (
    <>
      <Hero i18nKey="marketing.students.hero" />
      <HowItWorks i18nKey="marketing.students.howItWorks" />
      <FeaturesGrid i18nKey="marketing.students.features" />
      <CategoriesGrid />
      <Testimonial i18nKey="marketing.home.testimonial" />
      <Faq i18nKey="marketing.students.faq" />
      <CtaFinal i18nKey="marketing.students.cta" ctaHref="/inscription/stagiaire" />
    </>
  );
}