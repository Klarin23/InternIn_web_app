"use client";

import { FiSearch, FiPlus } from "react-icons/fi";
import RippleButton from "@/components/motion/RippleButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OffresViewToggle from "./OffresViewToggle";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffresToolbar({
  recherche,
  onRechercheChange,
  statut,
  onStatutChange,
  departement,
  onDepartementChange,
  departements,
  tri,
  onTriChange,
  onNouvelleOffre,
  vue,
  onVueChange,
  peutCreerOffre = true,
}) {
  const { t } = useTranslation();

  const STATUTS = [
    { value: "tous", label: t("entrepriseSpace.offers.allStatuses") },
    { value: "brouillon", label: t("entrepriseSpace.offers.statusDraft") },
    { value: "publie", label: t("entrepriseSpace.offers.statusActive") },
    { value: "expire", label: t("entrepriseSpace.offers.statusExpired") },
    { value: "ferme", label: t("entrepriseSpace.offers.statusClosed") },
    { value: "archive", label: t("entrepriseSpace.offers.statusArchived") },
    { value: "pause", label: t("entrepriseSpace.offers.statusPaused") },
  ];

  const TRIS = [
    { value: "recent", label: t("entrepriseSpace.offers.sortRecent") },
    { value: "ancien", label: t("entrepriseSpace.offers.sortOldest") },
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:gap-3">
        {/* Recherche */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-2.5">
          <FiSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => onRechercheChange(e.target.value)}
            placeholder={t("entrepriseSpace.offers.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label={t("entrepriseSpace.offers.searchPlaceholder")}
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statut} onValueChange={onStatutChange}>
            <SelectTrigger className="h-10 w-[150px] rounded-lg border-border bg-background">
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

          <Select value={departement} onValueChange={onDepartementChange}>
            <SelectTrigger className="h-10 w-[160px] rounded-lg border-border bg-background">
              <SelectValue placeholder={t("entrepriseSpace.offers.department")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">
                {t("entrepriseSpace.offers.allDepartments")}
              </SelectItem>
              {departements.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tri} onValueChange={onTriChange}>
            <SelectTrigger className="h-10 w-[170px] rounded-lg border-border bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Affichage + action */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <OffresViewToggle vue={vue} onChange={onVueChange} />

          <RippleButton
            className="h-10 shrink-0 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onNouvelleOffre}
            disabled={!peutCreerOffre}
            title={
              !peutCreerOffre
                ? t("entrepriseSpace.offers.publishDisabledHint")
                : undefined
            }
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("entrepriseSpace.offers.publishOffer")}
            </span>
            <span className="sm:hidden">
              {t("entrepriseSpace.offers.publishShort") || "Publier"}
            </span>
          </RippleButton>
        </div>
      </div>
    </div>
  );
}
