"use client";

const TABS = [
  { value: "tous", label: "Tous" },
  { value: "soumise", label: "Nouveau" },
  { value: "consultee", label: "En cours" },
  { value: "preselectionnee", label: "Entretien" },
  { value: "acceptee", label: "Accepté" },
  { value: "rejetee", label: "Refusé" },
];

export default function CandidaturesFiltres({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              isActive ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}