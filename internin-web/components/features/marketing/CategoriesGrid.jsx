"use client";
// Grille de catégories de stages, alignée sur le référentiel `centres_interet`
// du Schéma BDD. Chaque carte affiche une photo avec un léger zoom au survol.

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useTranslation } from "@/lib/i18n/useTranslation";

const categoriesParDefaut = [
  [
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80",
    "Génie Logiciel",
    "Développement web & mobile",
  ],
  [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=500&q=80",
    "Marketing",
    "Campagnes & réseaux sociaux",
  ],
  [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80",
    "Finance",
    "Analyse & reporting",
  ],
  [
    "https://images.unsplash.com/photo-1587440871875-191322ee64b0?auto=format&fit=crop&w=500&q=80",
    "UI/UX Design",
    "Interfaces & expérience",
  ],
];

export default function CategoriesGrid({
  i18nKey = "marketing.categoriesGrid",
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const eyebrow = i18n?.eyebrow ?? "Domaines de stage";
  const title = i18n?.title ?? "Explorez les stages par domaine";
  const description =
    i18n?.description ??
    "De la technologie au marketing, en passant par la finance et le design — trouvez des opportunités dans des entreprises vérifiées.";
  const browseAll = i18n?.browseAll ?? "Parcourir tous les stages";
  const categories = i18n?.categories ?? categoriesParDefaut;

  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-20">
        <FadeIn className="mb-10 max-w-170">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="text-muted-foreground">{description}</p>
        </FadeIn>

        <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(([img, title, subtitle]) => (
            <StaggerItem key={title}>
              <div className="group relative h-57.5 overflow-hidden rounded-md shadow-sm">
                <motion.img
                  src={img}
                  alt={`Stage en ${title}`}
                  className="h-full w-full object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.35 }}
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/85 via-black/15 to-transparent p-4">
                  <h5 className="text-base font-semibold text-white">
                    {title}
                  </h5>
                  <span className="text-xs text-white/80">{subtitle}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-9 text-center" delay={0.1}>
          <Button variant="outline" asChild>
            <Link href="/offres">{browseAll}</Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
