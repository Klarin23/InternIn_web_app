// Bannière de statut de vérification — toute nouvelle entreprise démarre
// "en_attente" (cf. entreprises.service.js à l'onboarding). Un administrateur
// devra la faire passer à "verifiee" avant que publier des offres soit possible
// (règle à appliquer côté module offres/nouveau, pas encore construit).

import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

const CONFIG = {
  en_attente: {
    icon: FiClock,
    bg: "bg-linear-to-r from-accent/25 via-accent/10 to-transparent border-accent/40",
    text: "text-amber-800",
    message:
      "Votre entreprise est en cours de vérification par notre équipe. Certaines actions seront limitées d'ici là.",
  },
  verifiee: {
    icon: FiCheckCircle,
    bg: "bg-linear-to-r from-success/15 via-success/5 to-transparent border-success/30",
    text: "text-green-600",
    message:
      "Votre entreprise est vérifiée — vous pouvez publier des offres de stage.",
  },
  rejetee: {
    icon: FiXCircle,
    bg: "bg-linear-to-r from-destructive/15 via-destructive/5 to-transparent border-destructive/30",
    text: "text-destructive",
    message:
      "Votre demande de vérification a été rejetée. Contactez notre équipe pour plus d'informations.",
  },
};

export default function VerificationBanner({ statut }) {
  const config = CONFIG[statut] || CONFIG.en_attente;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-4 py-3.5 text-sm font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {config.message}
    </div>
  );
}
