import { FiUserPlus } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";

export default function MaitresStagePage() {
  return (
    <>
      <AppHeader title="Maîtres de stage" />
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <FiUserPlus className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Maîtres de stage à venir</p>
        <p className="max-w-[360px] text-xs text-muted-foreground">
          Cette page permettra de gérer les enseignants référents et maîtres de stage rattachés à l&apos;établissement.
        </p>
      </div>
    </>
  );
}