import { FiSettings } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";

export default function ParametresStagiairePage() {
  return (
    <>
      <AppHeader title="Paramètres" />
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <FiSettings className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Paramètres à venir
        </p>
        <p className="max-w-90 text-xs text-muted-foreground">
          Préférences de notifications, changement de mot de passe, langue — à
          construire lors d&apos;un prochain chantier.
        </p>
      </div>
    </>
  );
}
