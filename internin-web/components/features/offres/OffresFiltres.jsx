"use client";
// Barre de filtres : recherche texte (titre/entreprise/ville) + pastilles de
// secteur + 3 filtres avancés (ville, mode de travail, rémunération). Tout
// est calculé/filtré côté client à partir du même jeu d'offres déjà chargé
// (voir page.jsx) : les options proposées ne listent donc jamais une valeur
// qui ne correspondrait à aucune offre réelle.
//
// Refonte UI uniquement : la logique de filtrage (props, valeurs, callbacks)
// est strictement identique à la version précédente. Les filtres avancés
// sont désormais regroupés dans un panneau (SidePanel) ouvert via le bouton
// "Filtres", ce qui libère de l'espace horizontal et s'adapte mieux au mobile.

import { useState } from "react";
import {
  FiSearch,
  FiMapPin,
  FiMonitor,
  FiDollarSign,
  FiX,
  FiSliders,
} from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/ui/side-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OffresViewToggle from "./OffresViewToggle";
import { useTranslation } from "@/lib/i18n/useTranslation";

function FiltreSelect({ icon: Icon, placeholder, value, onChange, options }) {
  return (
    <Select
      value={value || "tous"}
      onValueChange={(v) => onChange(v === "tous" ? undefined : v)}
    >
      <SelectTrigger className="h-11 w-full rounded-sm">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tous">{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function OffresFiltres({
  recherche,
  onRechercheChange,
  secteurs,
  secteurActif,
  onSecteurChange,
  villes,
  villeActive,
  onVilleChange,
  modeActif,
  onModeChange,
  remunerationActive,
  onRemunerationChange,
  vue,
  onVueChange,
}) {
  const { t } = useTranslation();
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [rechercheFocus, setRechercheFocus] = useState(false);

  const modeLabels = t("offersPage.filters.modeLabels");
  const REMUNERATION_KEYS = [
    "aucune",
    "indemnite_transport",
    "indemnite_repas",
    "indemnite_internet_appel",
    "allocation_mensuelle",
  ];

  const nbFiltresActifs = [villeActive, modeActif, remunerationActive].filter(
    Boolean,
  ).length;

  function reinitialiser() {
    onVilleChange(undefined);
    onModeChange(undefined);
    onRemunerationChange(undefined);
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Recherche + secteurs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={`relative flex-1 rounded-sm transition-shadow duration-200 ${
            rechercheFocus ? "shadow-[0_0_0_4px_rgba(20,184,166,0.15)]" : ""
          }`}
        >
          <FiSearch
            className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
              rechercheFocus ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <Input
            placeholder={t("offersPage.filters.searchPlaceholder")}
            className={`h-12 rounded-sm pl-11 text-[15px] transition-colors ${
              rechercheFocus ? "border-primary" : ""
            }`}
            value={recherche}
            onChange={(e) => onRechercheChange(e.target.value)}
            onFocus={() => setRechercheFocus(true)}
            onBlur={() => setRechercheFocus(false)}
          />
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-sm"
            onClick={() => setPanneauOuvert(true)}
          >
            <FiSliders className="h-4 w-4" />
            {t("offersPage.filters.filtersButton")}
            {nbFiltresActifs > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {nbFiltresActifs}
              </span>
            )}
          </Button>
          {onVueChange && (
            <div className="hidden sm:block">
              <OffresViewToggle vue={vue} onChange={onVueChange} />
            </div>
          )}
        </div>
      </div>

      {/* Pastilles de secteur */}
      {secteurs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSecteurChange(undefined)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              !secteurActif
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {t("offersPage.filters.all")}
          </button>
          {secteurs.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSecteurChange(s)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                secteurActif === s
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Panneau de filtres avancés (ville, mode de travail, rémunération) */}
      <SidePanel
        open={panneauOuvert}
        onClose={() => setPanneauOuvert(false)}
        title={t("offersPage.filters.filtersButton")}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("offersPage.filters.city")}
            </label>
            <FiltreSelect
              icon={FiMapPin}
              placeholder={t("offersPage.filters.allCities")}
              value={villeActive}
              onChange={onVilleChange}
              options={villes.map((v) => ({ value: v, label: v }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("offersPage.filters.workType")}
            </label>
            <FiltreSelect
              icon={FiMonitor}
              placeholder={t("offersPage.filters.allTypes")}
              value={modeActif}
              onChange={onModeChange}
              options={Object.entries(modeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("offersPage.filters.remuneration")}
            </label>
            <FiltreSelect
              icon={FiDollarSign}
              placeholder={t("offersPage.filters.allRemuneration")}
              value={remunerationActive}
              onChange={onRemunerationChange}
              options={REMUNERATION_KEYS.map((value) => ({
                value,
                label: t(`remunerationLabels.${value}`),
              }))}
            />
          </div>

          {nbFiltresActifs > 0 && (
            <button
              type="button"
              onClick={reinitialiser}
              className="flex items-center gap-1.5 text-sm font-semibold text-destructive hover:underline"
            >
              <FiX className="h-4 w-4" />
              {t("offersPage.filters.resetFilters", { n: nbFiltresActifs })}
            </button>
          )}
        </div>
      </SidePanel>
    </div>
  );
}
