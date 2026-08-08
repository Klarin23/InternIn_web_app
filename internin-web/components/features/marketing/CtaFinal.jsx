"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CtaFinal({
  i18nKey,
  title: titleProp,
  description: descriptionProp,
  ctaLabel: ctaLabelProp,
  ctaHref = "/inscription",
}) {
  const { t } = useTranslation();
  const i18n = i18nKey ? t(i18nKey) : undefined;

  const title = titleProp ?? i18n?.title ?? "Prêt à commencer ?";
  const description =
    descriptionProp ??
    i18n?.description ??
    "Créez gratuitement votre compte dès aujourd'hui et commencez à construire votre avenir.";
  const ctaLabel = ctaLabelProp ?? i18n?.ctaLabel ?? "Créer un compte";
  return (
    <section className="bg-background pb-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-lg bg-linear-to-br from-[#0B4A45] via-primary to-[#0F9C8C] px-8 py-16 text-center text-white shadow-lg"
        >
          <h2 className="mb-3 text-3xl font-bold text-white">{title}</h2>
          <p className="mb-8 text-white/85">{description}</p>
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Button size="lg" variant="secondary" asChild>
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
