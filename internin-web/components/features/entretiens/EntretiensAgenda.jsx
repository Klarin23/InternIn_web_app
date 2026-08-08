"use client";
// Vue agenda chronologique des entretiens à venir, groupés par jour
// (Aujourd'hui / Demain / date), triés par heure.

import { motion } from "framer-motion";
import { FiVideo, FiPhone, FiMapPin } from "react-icons/fi";
import { formatJourRelatif, formatHeure } from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

const MODE_ICONS = { video: FiVideo, telephone: FiPhone, presentiel: FiMapPin };

export default function EntretiensAgenda({
  entretiens,
  maintenant,
  onVoirDetails,
}) {
  const { t, locale } = useTranslation();
  const tries = [...(entretiens || [])].sort(
    (a, b) => new Date(a.dateHeure) - new Date(b.dateHeure),
  );

  if (tries.length === 0) return null;

  const groupes = [];
  for (const e of tries) {
    const label = formatJourRelatif(
      new Date(e.dateHeure),
      maintenant,
      locale,
      t,
    );
    let groupe = groupes.find((g) => g.label === label);
    if (!groupe) {
      groupe = { label, items: [] };
      groupes.push(groupe);
    }
    groupe.items.push(e);
  }

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="space-y-6">
        {groupes.map((groupe) => (
          <div key={groupe.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {groupe.label}
            </p>
            <div className="space-y-1 border-l-2 border-border pl-4">
              {groupe.items.map((e, i) => {
                const ModeIcon = MODE_ICONS[e.modeEntretien];
                return (
                  <motion.button
                    key={e.idEntretien}
                    type="button"
                    onClick={() => onVoirDetails(e)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: i * 0.06,
                      ease: "easeOut",
                    }}
                    className="relative flex w-full items-start gap-2.5 rounded-sm py-2 text-left transition hover:bg-muted/40"
                  >
                    <span className="absolute -left-5.25 flex h-4 w-4 items-center justify-center rounded-full bg-card">
                      <ModeIcon className="h-4 w-4 text-[#14b8a6]" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatHeure(new Date(e.dateHeure), locale)} ·{" "}
                        {e.titreOffre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.nomEntreprise}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
