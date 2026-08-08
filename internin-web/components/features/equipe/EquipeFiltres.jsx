"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES_INVITABLES } from "./equipeConstants";

const STATUTS = [
  { value: "tous", label: "Tous les statuts" },
  { value: "actif", label: "Actif" },
  { value: "invite", label: "Invitation en attente" },
  { value: "desactive", label: "Désactivé" },
];

export default function EquipeFiltres({
  role,
  onRoleChange,
  statut,
  onStatutChange,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="h-10 w-[190px] rounded-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les rôles</SelectItem>
          <SelectItem value="administrateur_principal">
            Administrateur principal
          </SelectItem>
          {ROLES_INVITABLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statut} onValueChange={onStatutChange}>
        <SelectTrigger className="h-10 w-[190px] rounded-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
