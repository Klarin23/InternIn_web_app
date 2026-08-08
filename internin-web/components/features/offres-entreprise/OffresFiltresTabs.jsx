"use client";

const TABS = [
  { value: "tous", label: "Tous" },
  { value: "publie", label: "Actif" },
  { value: "ferme", label: "Fermé" },
  { value: "brouillon", label: "Brouillon" },
];

export default function OffresFiltresTabs({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
