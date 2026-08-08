"use client";

const TABS = [
  { value: "tous", label: "Tous" },
  { value: "en_attente", label: "En attente" },
  { value: "verifiee", label: "Vérifié" },
  { value: "rejetee", label: "Rejeté" },
];

export default function EntrepriseFiltresTabs({ value, onChange, counts }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        const count = counts[tab.value] ?? 0;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label} <span className="opacity-70">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
