import Hero from "@/components/features/marketing/Hero";
import MissionStory from "@/components/features/marketing/MissionStory";
import FeaturesGrid from "@/components/features/marketing/FeaturesGrid";
import CtaFinal from "@/components/features/marketing/CtaFinal";

export const metadata = {
  title: "InternIn — À propos",
  description:
    "InternIn réduit le fossé entre l'éducation et l'emploi en rendant les stages structurés, mesurables et porteurs de sens à travers l'Afrique.",
};

export default function AProposPage() {
  return (
    <>
      <Hero
        i18nKey="marketing.about.hero"
        imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
        imageAlt="Équipe collaborant autour d'un projet"
      />

      <MissionStory />

      <FeaturesGrid i18nKey="marketing.about.features" />

      <CtaFinal i18nKey="marketing.about.cta" ctaHref="/inscription" />
    </>
  );
}
