"use client";

import { FiMessageSquare, FiLinkedin } from "react-icons/fi";
import { Checkbox } from "@/components/ui/checkbox";
import { useToggleVisibilite } from "@/lib/queries/useRecommandations";

export default function RecommandationCard({ recommandation, idStage }) {
  const mutation = useToggleVisibilite();

  if (!recommandation) return null;

  return (
    <div className="rounded-md border border-secondary/30 bg-secondary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FiMessageSquare className="h-5 w-5 text-secondary" />
        <h6 className="font-semibold text-foreground">
          Recommandation de votre employeur
        </h6>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {recommandation.contenu}
      </p>
      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <Checkbox
          checked={recommandation.visibleLinkedin}
          onCheckedChange={(checked) =>
            mutation.mutate({ idStage, visibleLinkedin: checked })
          }
        />
        <FiLinkedin className="h-4 w-4 text-secondary" />
        Rendre visible sur LinkedIn
      </label>
    </div>
  );
}
