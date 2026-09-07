"use client";

import { useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAjouterTache,
  useUpdateTache,
  useSupprimerTache,
} from "@/lib/queries/useSuperviseur";

export default function TachesPanel({ idStage, taches = [], objectifs = [] }) {
  const { t } = useTranslation();
  const [nouvelle, setNouvelle] = useState("");
  const [idObjectif, setIdObjectif] = useState("");
  const ajouter = useAjouterTache(idStage);
  const update = useUpdateTache(idStage);
  const supprimer = useSupprimerTache(idStage);

  function handleAjouter() {
    if (!nouvelle.trim()) return;
    if (!idObjectif) return;
    ajouter.mutate(
      { description: nouvelle.trim(), idObjectif },
      {
        onSuccess: () => {
          setNouvelle("");
        },
      },
    );
  }

  const terminees = taches.filter((task) => task.statut === "terminee").length;

  const groupes = useMemo(() => {
    const byObj = new Map();
    for (const o of objectifs) {
      byObj.set(o.idObjectif, {
        objectif: o,
        taches: [],
      });
    }
    const sans = [];
    for (const task of taches) {
      if (task.idObjectif && byObj.has(task.idObjectif)) {
        byObj.get(task.idObjectif).taches.push(task);
      } else {
        sans.push(task);
      }
    }
    return { groupes: [...byObj.values()], sans };
  }, [taches, objectifs]);

  function renderTache(task) {
    return (
      <li key={task.idTache} className="flex items-center gap-2.5">
        <Checkbox
          checked={task.statut === "terminee"}
          onCheckedChange={(v) =>
            update.mutate({
              idTache: task.idTache,
              payload: { statut: v ? "terminee" : "a_faire" },
            })
          }
        />
        <span
          className={`flex-1 text-sm ${
            task.statut === "terminee"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {task.description}
        </span>
        <button
          type="button"
          onClick={() => supprimer.mutate(task.idTache)}
          className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={t("mesStagiaires.progression.deleteTask")}
        >
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          {t("mesStagiaires.progression.tasksByObjective")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("mesStagiaires.progression.tasksCompletedCount", { done: terminees, total: taches.length })}
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <Select
          value={idObjectif || undefined}
          onValueChange={setIdObjectif}
        >
          <SelectTrigger className="h-10 w-full rounded-sm">
            <SelectValue placeholder={t("mesStagiaires.progression.selectObjective")} />
          </SelectTrigger>
          <SelectContent>
            {objectifs.length === 0 ? (
              <SelectItem value="__none" disabled>
                {t("mesStagiaires.progression.createObjectiveFirst")}
              </SelectItem>
            ) : (
              objectifs.map((o) => (
                <SelectItem key={o.idObjectif} value={o.idObjectif}>
                  {o.description.length > 60
                    ? `${o.description.slice(0, 60)}…`
                    : o.description}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            placeholder={t("mesStagiaires.progression.addTask")}
            value={nouvelle}
            onChange={(e) => setNouvelle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAjouter()}
            className="h-10 rounded-sm"
            disabled={!idObjectif}
          />
          <Button
            type="button"
            className="h-10 rounded-sm px-3"
            disabled={
              !nouvelle.trim() ||
              !idObjectif ||
              ajouter.isPending ||
              objectifs.length === 0
            }
            onClick={handleAjouter}
          >
            {ajouter.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              <FiPlus className="h-4 w-4" />
            )}
          </Button>
        </div>
        {objectifs.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t("mesStagiaires.progression.needObjective")}
          </p>
        )}
      </div>

      {taches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("mesStagiaires.progression.noTasks")}
        </p>
      ) : (
        <div className="space-y-4">
          {groupes.groupes.map(({ objectif, taches: list }) => (
            <div key={objectif.idObjectif}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {objectif.description}
                <span className="ml-1 font-normal normal-case">
                  ({list.filter((task) => task.statut === "terminee").length}/
                  {list.length})
                </span>
              </p>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("mesStagiaires.progression.noTasksForObjective")}
                </p>
              ) : (
                <ul className="space-y-2">{list.map(renderTache)}</ul>
              )}
            </div>
          ))}
          {groupes.sans.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("mesStagiaires.progression.withoutObjective")}
              </p>
              <ul className="space-y-2">{groupes.sans.map(renderTache)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}