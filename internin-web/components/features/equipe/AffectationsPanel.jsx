"use client";

import { FiLoader, FiInbox, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAffectations,
  useAffecterSuperviseur,
  useRetirerAffectation,
  useMembresEquipe,
} from "@/lib/queries/useEquipe";

export default function AffectationsPanel() {
  const { data: affectations, isLoading } = useAffectations();
  const { data: membresActifs } = useMembresEquipe({ statut: "actif" });
  const affecter = useAffecterSuperviseur();
  const retirer = useRetirerAffectation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <FiLoader className="h-5 w-5 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (!affectations || affectations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <FiInbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Aucun stagiaire en poste à affecter pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="grid grid-cols-[1.6fr_1.4fr_1.4fr_0.6fr] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <span>Stagiaire</span>
        <span>Poste</span>
        <span>Superviseur affecté</span>
        <span></span>
      </div>

      {affectations.map((a) => (
        <div
          key={a.idStage}
          className="grid grid-cols-[1.6fr_1.4fr_1.4fr_0.6fr] items-center gap-3 border-b border-border px-4 py-3.5 text-sm"
        >
          <span className="truncate font-semibold text-foreground">
            {a.prenomStagiaire} {a.nomStagiaire}
          </span>
          <span className="truncate text-muted-foreground">
            {a.titrePoste || "-"}
          </span>

          <Select
            value={a.idMembre || ""}
            onValueChange={(idMembre) =>
              affecter.mutate({ idStage: a.idStage, idMembre })
            }
            disabled={affecter.isPending}
          >
            <SelectTrigger className="h-9 w-full rounded-sm text-xs">
              <SelectValue placeholder="Non affecté" />
            </SelectTrigger>
            <SelectContent>
              {(membresActifs || []).map((m) => (
                <SelectItem key={m.idMembre} value={m.idMembre}>
                  {m.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span>
            {a.idMembre && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 rounded-sm px-2 text-xs text-destructive hover:text-destructive"
                disabled={retirer.isPending}
                onClick={() => retirer.mutate(a.idStage)}
                title="Retirer l'affectation"
              >
                <FiX className="h-3.5 w-3.5" />
              </Button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
