"use client";
import FadeIn from "@/components/motion/FadeIn";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Testimonial({
  i18nKey,
  quote: quoteProp,
  name: nameProp,
  role: roleProp,
  imageUrl = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const quote =
    quoteProp ??
    i18n?.quote ??
    "Grâce au suivi hebdomadaire et au Coach IA, j'ai terminé mon stage avec un certificat et une recommandation qui ont fait la différence sur mon CV.";
  const name = nameProp ?? i18n?.name ?? "Amara K.";
  const role = roleProp ?? i18n?.role ?? "Ancienne stagiaire, Génie Logiciel";
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-20">
        <FadeIn>
          <div className="grid grid-cols-1 items-center gap-8 rounded-lg bg-linear-to-br from-secondary/10 to-primary/10 p-10 md:grid-cols-[auto_1fr] md:p-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Portrait de ${name}`}
              className="mx-auto h-24 w-24 rounded-full object-cover shadow-md md:mx-0"
            />
            <div className="text-center md:text-left">
              <span className="mb-3 block text-4xl font-extrabold leading-none text-secondary">
                &ldquo;
              </span>
              <blockquote className="mb-4 text-lg font-semibold text-foreground">
                {quote}
              </blockquote>
              <cite className="text-sm not-italic text-muted-foreground">
                <b className="text-foreground">{name}</b> — {role}
              </cite>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
