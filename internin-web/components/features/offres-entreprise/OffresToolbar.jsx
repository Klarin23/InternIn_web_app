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

const STATUTS = [
  { value: "tous", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Active" },
  { value: "expire", label: "Expirée" },
  { value: "ferme", label: "Fermée" },
  { value: "archive", label: "Archivée" },
];

const TRIS = [
  { value: "recent", label: "Plus récentes d'abord" },
  { value: "ancien", label: "Plus anciennes d'abord" },
];

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
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3.5">
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-sm border border-border bg-background px-3.5 py-2.5">
        <FiSearch className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={recherche}
          onChange={(e) => onRechercheChange(e.target.value)}
          placeholder="Rechercher une offre..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <Select value={statut} onValueChange={onStatutChange}>
        <SelectTrigger className="h-11 w-[170px] rounded-sm">
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
        <SelectTrigger className="h-11 w-[190px] rounded-sm">
          <SelectValue placeholder="Département" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les départements</SelectItem>
          {departements.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tri} onValueChange={onTriChange}>
        <SelectTrigger className="h-11 w-[200px] rounded-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRIS.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <OffresViewToggle vue={vue} onChange={onVueChange} />

      <RippleButton
        className="h-11 flex-shrink-0 rounded-sm disabled:cursor-not-allowed disabled:opacity-50"
        whileHover={peutCreerOffre ? { y: -1 } : undefined}
        onClick={onNouvelleOffre}
        disabled={!peutCreerOffre}
        title={
          !peutCreerOffre
            ? "Disponible après vérification de votre entreprise par l'administration"
            : undefined
        }
      >
        <FiPlus className="h-4 w-4" />
        Publier une offre
      </RippleButton>
    </div>
  );
}
