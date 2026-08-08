// RapportsTab.jsx
import { FiFileText } from "react-icons/fi";

export default function RapportsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FiFileText className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">Rapports à venir</p>
      <p className="max-w-[320px] text-xs text-muted-foreground">
        Cette fonctionnalité sera construite lors d&apos;un prochain chantier —
        soumission de rapports d&apos;intégration et de mi-parcours.
      </p>
    </div>
  );
}
