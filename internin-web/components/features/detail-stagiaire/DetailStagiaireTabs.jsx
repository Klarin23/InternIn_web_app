"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DetailStagiaireTabs({ idStage }) {
  const pathname = usePathname();
  const base = `/mes-stagiaires/${idStage}`;

  const onglets = [
    { href: base, label: "Détails" },
    { href: `${base}/progression`, label: "Suivi de progression" },
    { href: `${base}/journal`, label: "Journal de stage" },
  ];

  return (
    <div className="mb-5 flex flex-wrap gap-2 border-b border-border">
      {onglets.map((o) => {
        const actif = pathname === o.href;
        return (
          <Link
            key={o.href}
            href={o.href}
            className={`border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${
              actif
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
