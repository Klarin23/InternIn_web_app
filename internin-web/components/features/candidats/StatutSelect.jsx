"use client";
// Menu déroulant de changement de statut, isolé pour être réutilisé
// facilement (ex: futur module entretiens).

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateCandidatureStatut } from "@/lib/queries/useCandidaturesEntreprise";

const OPTIONS = [
  { value: "soumise", label: "Soumise", disabled: true }, // état initial, non re-sélectionnable manuellement
  { value: "consultee", label: "Consultée" },
  { value: "preselectionnee", label: "Présélectionnée" },
  { value: "rejetee", label: "Rejetée" },
  
];

export default function StatutSelect({ idCandidature, statutActuel }) {
  const mutation = useUpdateCandidatureStatut();

  return (
    <Select
      value={statutActuel}
      onValueChange={(statut) => mutation.mutate({ idCandidature, statut })}
      disabled={mutation.isPending}
    >
      <SelectTrigger className="h-9 w-[160px] rounded-sm text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
