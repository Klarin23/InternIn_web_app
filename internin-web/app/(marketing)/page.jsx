import Hero from "@/components/features/marketing/Hero";
import HowItWorks from "@/components/features/marketing/HowItWorks";
import FeaturesGrid from "@/components/features/marketing/FeaturesGrid";
import CategoriesGrid from "@/components/features/marketing/CategoriesGrid";
import AudienceCards from "@/components/features/marketing/AudienceCards";
import Testimonial from "@/components/features/marketing/Testimonial";
import Faq from "@/components/features/marketing/Faq";
import CtaFinal from "@/components/features/marketing/CtaFinal";

export default function HomePage() {
  return (
    <>
      <Hero i18nKey="marketing.home.hero" />
      <HowItWorks i18nKey="marketing.home.howItWorks" />
      <FeaturesGrid i18nKey="marketing.home.features" />
      <CategoriesGrid />
      <AudienceCards />
      <Testimonial i18nKey="marketing.home.testimonial" />
      <Faq i18nKey="marketing.home.faq" />
      <CtaFinal i18nKey="marketing.home.cta" />
    </>
  );
}
