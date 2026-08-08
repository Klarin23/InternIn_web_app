import { FiSettings } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";

export default function ParametresEntreprisePage() {
  return (
    <>
      <AppHeader title="Paramètres" />
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <FiSettings className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Paramètres à venir
        </p>
        <p className="max-w-90 text-xs text-muted-foreground">
          Modèles d&apos;e-mails, gestion des rôles d&apos;administrateurs,
          préférences de la plateforme — à construire lors d&apos;un
          prochain chantier.
        </p>
      </div>
    </>
  );
}