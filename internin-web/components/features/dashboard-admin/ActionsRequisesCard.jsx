"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function ActionsRequisesCard({ total = 0 }) {
  return (
    <div
      className="rounded-md p-5 text-white"
      style={{
        background: "linear-gradient(135deg, var(--sidebar-primary), #8B5CF6)",
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-white/70">
        Actions requises
      </p>
      <p className="mt-2 text-4xl font-extrabold">{total}</p>
      <p className="mt-1.5 text-sm text-white/80">
        Offres, entités et signalements en attente
      </p>
      <Link
        href="/verifications/offres-finales"
        className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
      >
        Voir la file <FiArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
