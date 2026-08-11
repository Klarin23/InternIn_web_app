"use client";

function calculerBadges(offre, seuilPopulaire) {
  const badges = [];

  if (offre.dateLimiteCandidature && offre.statut === "publie") {
    const joursRestants = Math.ceil(
      (new Date(offre.dateLimiteCandidature) - new Date()) / 86400000,
    );
    if (joursRestants >= 0 && joursRestants <= 3) {
      badges.push({
        key: "expire",
        emoji: "⏰",
        label:
          joursRestants === 0
            ? "Expire aujourd'hui"
            : `Expire dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}`,
        className: "bg-destructive/10 text-destructive",
      });
    }
  }

  if (offre.nombreCandidatures >= seuilPopulaire) {
    badges.push({
      key: "populaire",
      emoji: "🔥",
      label: "Offre très populaire",
      className: "bg-accent/40 text-amber-700",
    });
  }

  if (offre.dateCreation) {
    const joursDepuisCreation = Math.floor(
      (new Date() - new Date(offre.dateCreation)) / 86400000,
    );
    if (joursDepuisCreation <= 2) {
      badges.push({
        key: "nouvelle",
        emoji: "⭐",
        label: "Nouvelle offre",
        className: "bg-primary/10 text-primary",
      });
    }
  }

  return badges;
}

export default function OffreBadgesInfo({ offre, seuilPopulaire }) {
  const badges = calculerBadges(offre, seuilPopulaire);
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      {badges.map((b) => (
        <span
          key={b.key}
          title={b.label}
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.className}`}
        >
          {b.emoji} {b.label}
        </span>
      ))}
    </div>
  );
}
