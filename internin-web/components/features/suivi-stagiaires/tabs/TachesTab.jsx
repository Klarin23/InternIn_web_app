// TachesTab.jsx
import { FiCheckSquare } from "react-icons/fi";

export default function TachesTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FiCheckSquare className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        Gestion des tâches à venir
      </p>
      <p className="max-w-[320px] text-xs text-muted-foreground">
        Cette fonctionnalité sera construite lors d&apos;un prochain chantier —
        attribution de tâches, suivi d&apos;avancement.
      </p>
    </div>
  );
}
