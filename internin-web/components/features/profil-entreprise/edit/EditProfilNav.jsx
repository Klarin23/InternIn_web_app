"use client";

import { cn } from "@/lib/utils";

// Navigation entre sections du formulaire. Desktop : colonne latérale
// verticale. Mobile : rangée de pastilles défilable horizontalement (pas de
// débordement de page grâce à overflow-x-auto contenu dans sa propre zone).
export default function EditProfilNav({ sections, activeId, onNavigate }) {
  return (
    <>
      {/* Desktop */}
      <nav className="hidden w-48 flex-shrink-0 md:block">
        <ul className="sticky top-0 space-y-0.5">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeId;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-150",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{section.navLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile */}
      <div className="sticky top-0 z-10 -mx-5 mb-1 overflow-x-auto bg-popover px-5 py-1.5 md:hidden">
        <div className="flex w-max gap-1.5">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                className={cn(
                  "flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {section.navLabel}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
