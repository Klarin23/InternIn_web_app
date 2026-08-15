"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap gap-2"
    >
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="h-10 w-full min-w-[160px] rounded-md sm:w-[190px]">
          <SelectValue placeholder="Tous les rôles" />
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
        <SelectTrigger className="h-10 w-full min-w-[160px] rounded-md sm:w-[190px]">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          {STATUTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
}
