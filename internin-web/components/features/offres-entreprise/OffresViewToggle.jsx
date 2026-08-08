"use client";

import { FiGrid, FiList } from "react-icons/fi";

export default function OffresViewToggle({ vue, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-1">
      <button
        type="button"
        onClick={() => onChange("grille")}
        title="Vue grille"
        className={`flex h-8 w-8 items-center justify-center rounded-sm transition ${
          vue === "grille"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        <FiGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("liste")}
        title="Vue liste"
        className={`flex h-8 w-8 items-center justify-center rounded-sm transition ${
          vue === "liste"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        <FiList className="h-4 w-4" />
      </button>
    </div>
  );
}
