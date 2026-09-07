"use client";

import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ROLES_INVITABLES, roleLabel } from "./equipeConstants";

export default function EquipeFiltres({
  role,
  onRoleChange,
  statut,
  onStatutChange,
}) {
  const { t } = useTranslation();

  const STATUTS = [
    { value: "tous", label: t("equipe.filters.allStatuses") },
    { value: "actif", label: t("equipe.status.actif") },
    { value: "invite", label: t("equipe.status.invite") },
    { value: "desactive", label: t("equipe.status.desactive") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap gap-2"
    >
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="h-10 w-full min-w-[160px] rounded-md sm:w-[190px]">
          <SelectValue placeholder={t("equipe.filters.allRoles")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">{t("equipe.filters.allRoles")}</SelectItem>
          <SelectItem value="administrateur_principal">
            {roleLabel(t, "administrateur_principal")}
          </SelectItem>
          {ROLES_INVITABLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {t(r.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statut} onValueChange={onStatutChange}>
        <SelectTrigger className="h-10 w-full min-w-[160px] rounded-md sm:w-[190px]">
          <SelectValue placeholder={t("equipe.filters.allStatuses")} />
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
