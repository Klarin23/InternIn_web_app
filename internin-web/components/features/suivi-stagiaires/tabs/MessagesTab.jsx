// MessagesTab.jsx
import { FiMessageSquare } from "react-icons/fi";

export default function MessagesTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FiMessageSquare className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">Messagerie à venir</p>
      <p className="max-w-[320px] text-xs text-muted-foreground">
        La messagerie sécurisée sera construite lors d&apos;un prochain chantier
        dédié.
      </p>
    </div>
  );
}
