import { FiClipboard } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";

export default function RapportsPage() {
  return (
    <>
      <AppHeader
        title="Rapports"
        subtitle="Générez et exportez vos rapports de stages"
      />
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <FiClipboard className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Rapports à venir</p>
        <p className="max-w-[360px] text-xs text-muted-foreground">
          Cette page permettra de consulter les rapports de stage déposés par les étudiants.
        </p>
      </div>
    </>
  );
}