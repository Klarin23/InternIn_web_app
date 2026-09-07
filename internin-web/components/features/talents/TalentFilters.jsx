"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const QUICK = [
  { id: "tous", labelKey: "talents.filters.all", key: "disponibilite", value: "" },
  {
    id: "disponible",
    labelKey: "talents.filters.available",
    key: "disponibilite",
    value: "disponible",
  },
  {
    id: "en_processus",
    labelKey: "talents.filters.inProcess",
    key: "disponibilite",
    value: "en_processus",
  },
  { id: "actif", labelKey: "talents.filters.inInternship", key: "disponibilite", value: "actif" },
];

/**
 * Filtres branchés sur les query params API listTalents.
 * filters: { disponibilite, localisation, competence, sort }
 */
export default function TalentFilters({
  filters,
  onChange,
  onReset,
  competenceSuggestions = [],
}) {
  const { t } = useTranslation();
  const quickItems = QUICK.map((q) => ({ ...q, label: t(q.labelKey) }));
  const reduceMotion = useReducedMotion();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const selectedSkills = String(filters.competence || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function setField(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function addSkill(name) {
    const n = name.trim();
    if (!n) return;
    if (selectedSkills.some((s) => s.toLowerCase() === n.toLowerCase())) {
      setSkillInput("");
      return;
    }
    const next = [...selectedSkills, n];
    setField("competence", next.join(","));
    setSkillInput("");
  }

  function removeSkill(name) {
    const next = selectedSkills.filter((s) => s !== name);
    setField("competence", next.join(","));
  }

  const activeChips = [];
  if (filters.disponibilite) {
    const q = quickItems.find((x) => x.value === filters.disponibilite);
    activeChips.push({
      key: "disponibilite",
      label: q?.label || filters.disponibilite,
      clear: () => setField("disponibilite", ""),
    });
  }
  if (filters.localisation) {
    activeChips.push({
      key: "localisation",
      label: filters.localisation,
      clear: () => setField("localisation", ""),
    });
  }
  selectedSkills.forEach((s) => {
    activeChips.push({
      key: `skill-${s}`,
      label: s,
      clear: () => removeSkill(s),
    });
  });

  const suggestions = competenceSuggestions
    .map((c) => (typeof c === "string" ? c : c.nom))
    .filter(Boolean)
    .filter(
      (n) =>
        !selectedSkills.some((s) => s.toLowerCase() === n.toLowerCase()) &&
        (!skillInput ||
          n.toLowerCase().includes(skillInput.toLowerCase())),
    )
    .slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {quickItems.map((f) => {
          const active =
            (f.value === "" && !filters.disponibilite) ||
            filters.disponibilite === f.value;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setField("disponibilite", f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/60",
              )}
            >
              {f.label}
            </button>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
          {t("talents.filters.title")}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {t("talents.filters.sort")}
          </span>
          <Select
            value={filters.sort || "completude"}
            onValueChange={(v) => setField("sort", v)}
          >
            <SelectTrigger className="h-8 w-[160px] rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completude">{t("talents.filters.sortCompleteness")}</SelectItem>
              <SelectItem value="nom">{t("talents.filters.sortName")}</SelectItem>
              <SelectItem value="recent">{t("talents.filters.sortRecent")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnimatePresence>
        {advancedOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {t("talents.filters.location")}
                </label>
                <Input
                  placeholder={t("talents.filters.locationPlaceholder")}
                  value={filters.localisation || ""}
                  onChange={(e) => setField("localisation", e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {t("talents.filters.skills")}
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("talents.filters.skillPlaceholder")}
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    className="h-9 rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-lg"
                    onClick={() => addSkill(skillInput)}
                  >
                    {t("talents.filters.add")}
                  </Button>
                </div>
                {suggestions.length > 0 && skillInput && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {suggestions.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => addSkill(n)}
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] hover:bg-muted"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("talents.filters.active")}</span>
          {activeChips.map((c) => (
            <motion.button
              key={c.key}
              type="button"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={c.clear}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium"
            >
              {c.label}
              <X className="size-3" aria-hidden />
            </motion.button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("talents.filters.reset")}
          </button>
        </div>
      )}
    </div>
  );
}
