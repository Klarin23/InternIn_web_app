"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
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
import { peutChangerStatutCandidature } from "@/lib/candidatures/statut";

const OPTION_DEFS = [
  { value: "soumise", labelKey: "entrepriseSpace.candidatures.statusSubmitted", disabled: true },
  { value: "consultee", labelKey: "entrepriseSpace.candidatures.statusViewed" },
  { value: "preselectionnee", labelKey: "entrepriseSpace.candidatures.statusPreselected" },
  { value: "rejetee", labelKey: "entrepriseSpace.candidatures.statusRejectedF" },
];

export default function StatutSelect({ idCandidature, statutActuel }) {
  const { t } = useTranslation();
  const OPTIONS = OPTION_DEFS.map((o) => ({
    ...o,
    label: t(o.labelKey),
    disabled:
      o.disabled ||
      !peutChangerStatutCandidature(statutActuel, o.value),
  }));
  const mutation = useUpdateCandidatureStatut();

  return (
    <Select
      value={statutActuel}
      onValueChange={(statut) => {
        if (!peutChangerStatutCandidature(statutActuel, statut)) return;
        mutation.mutate({ idCandidature, statut });
      }}
      disabled={mutation.isPending || statutActuel === "retiree" || statutActuel === "acceptee"}
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
