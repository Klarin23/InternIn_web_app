"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiCheckSquare,
  FiPlus,
  FiSearch,
  FiLoader,
  FiTrash2,
  FiAlertCircle,
  FiCheck,
  FiCircle,
  FiList,
  FiColumns,
  FiX,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProgression,
  useAjouterTache,
  useUpdateTache,
  useSupprimerTache,
  useAjouterObjectif,
} from "@/lib/queries/useSuperviseur";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const FILTER_DEFS = [
  { value: "toutes", labelKey: "suivi.tasks.filterAll" },
  { value: "a_faire", labelKey: "suivi.tasks.filterTodo" },
  { value: "terminee", labelKey: "suivi.tasks.filterDone" },
];

function formatDate(d, locale) {
  if (!d) return "—";
  try {
    const tag = locale === "fr" || locale === "fr-FR" ? "fr-FR" : "en-GB";
    return new Date(d).toLocaleDateString(tag, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ statut }) {
  const { t } = useTranslation();
  const done = statut === "terminee";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        done
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          done ? "bg-emerald-500" : "bg-amber-500",
        )}
        aria-hidden
      />
      {done ? t("suivi.tasks.completed") : t("suivi.tasks.todo")}
    </span>
  );
}

export default function TachesTab({ stage }) {
  const { t, locale } = useTranslation();
  const FILTERS = useMemo(
    () => FILTER_DEFS.map((f) => ({ ...f, label: t(f.labelKey) })),
    [t],
  );
  const reduce = useReducedMotion();
  const idStage = stage?.idStage;
  const {
    data: progression,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useProgression(idStage);

  const ajouter = useAjouterTache(idStage);
  const update = useUpdateTache(idStage);
  const supprimer = useSupprimerTache(idStage);
  const ajouterObjectif = useAjouterObjectif(idStage);

  const [filtre, setFiltre] = useState("toutes");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // list | kanban
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [title, setTitle] = useState("");
  const [idObjectif, setIdObjectif] = useState("");
  const [newObjectif, setNewObjectif] = useState("");
  const [formError, setFormError] = useState("");

  const taches = progression?.taches || [];
  const objectifs = progression?.objectifs || [];

  const stats = useMemo(() => {
    const total = taches.length;
    const completed = taches.filter((task) => task.statut === "terminee").length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  }, [taches]);

  const filtered = useMemo(() => {
    let list = taches;
    if (filtre === "a_faire") list = list.filter((task) => task.statut === "a_faire");
    if (filtre === "terminee")
      list = list.filter((task) => task.statut === "terminee");
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((task) =>
        (task.description || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [taches, filtre, search]);

  const objectifLabel = useMemo(() => {
    const map = {};
    for (const o of objectifs) map[o.idObjectif] = o.description;
    return map;
  }, [objectifs]);

  function toggleStatut(task) {
    const next = task.statut === "terminee" ? "a_faire" : "terminee";
    update.mutate({ idTache: task.idTache, payload: { statut: next } });
  }

  function handleCreate(e) {
    e?.preventDefault?.();
    setFormError("");
    const desc = title.trim();
    if (!desc) {
      setFormError(t("suivi.tasks.titleRequired"));
      return;
    }
    ajouter.mutate(
      {
        description: desc,
        idObjectif: idObjectif && idObjectif !== "none" ? idObjectif : null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setIdObjectif("");
          setCreateOpen(false);
        },
        onError: (err) => {
          setFormError(err?.message || t("suivi.tasks.createError"));
        },
      },
    );
  }

  function handleCreateObjectif() {
    const d = newObjectif.trim();
    if (!d) return;
    ajouterObjectif.mutate(d, {
      onSuccess: (obj) => {
        setNewObjectif("");
        if (obj?.idObjectif) setIdObjectif(obj.idObjectif);
      },
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    supprimer.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
    });
  }

  if (!idStage) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t("suivi.tasks.selectIntern")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-6 text-center">
        <FiAlertCircle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
        <p className="mt-2 text-sm font-medium text-foreground">
          {t("suivi.tasks.loadError")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          {t("suivi.common.retry")}
        </Button>
      </div>
    );
  }

  const studentName = [stage?.prenom, stage?.nom].filter(Boolean).join(" ");

  return (
    <motion.div
      className="space-y-5"
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("suivi.tasks.companyTitle")}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-foreground">
            {t("suivi.tasks.management")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("suivi.tasks.track")}
            {studentName ? (
              <>
                {" "}
                · <span className="font-medium text-foreground">{studentName}</span>
              </>
            ) : null}
            {isFetching && !isLoading ? " · " + t("suivi.tasks.updating") : null}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
          onClick={() => {
            setFormError("");
            setCreateOpen(true);
          }}
        >
          <FiPlus className="h-3.5 w-3.5" />
          {t("suivi.tasks.newTask")}
        </Button>
      </div>

      {/* Overview stats */}
      <section className="rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("suivi.tasks.overview")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("suivi.tasks.total")} value={stats.total} tone="teal" />
          <Stat label={t("suivi.tasks.completed")} value={stats.completed} tone="green" />
          <Stat label={t("suivi.tasks.todo")} value={stats.pending} tone="amber" />
          <Stat label={t("suivi.tasks.progress")} value={`${stats.percent}%`} tone="purple" />
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-medium text-muted-foreground">
              {t("suivi.tasks.progressLabel")}
            </span>
            <span className="tabular-nums text-foreground">
              {t("suivi.tasks.progressCount", { completed: stats.completed, total: stats.total || 0 })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Filters + view */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("suivi.tasks.search")}
            className="h-9 rounded-lg border-border bg-card pl-9 text-sm focus-visible:ring-teal-500/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1"
            role="tablist"
          >
            {FILTERS.map((f) => {
              const active = filtre === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFiltre(f.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                    active
                      ? f.value === "terminee"
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                        : f.value === "a_faire"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "bg-teal-500/15 text-teal-800 dark:text-teal-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              aria-label={t("suivi.tasks.listView")}
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5 transition",
                view === "list"
                  ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <FiList className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={t("suivi.tasks.boardView")}
              onClick={() => setView("kanban")}
              className={cn(
                "rounded-md p-1.5 transition",
                view === "kanban"
                  ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <FiColumns className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty filtered */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-border/80 bg-card px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10">
            <FiCheckSquare className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {taches.length === 0 ? t("suivi.tasks.noTasks") : t("suivi.tasks.noMatch")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {taches.length === 0
              ? t("suivi.tasks.createFirst")
              : t("suivi.tasks.tryFilters")}
          </p>
          {taches.length === 0 ? (
            <Button
              type="button"
              size="sm"
              className="mt-4 gap-1.5 bg-teal-600 text-white hover:bg-teal-700"
              onClick={() => setCreateOpen(true)}
            >
              <FiPlus className="h-3.5 w-3.5" />
              {t("suivi.tasks.create")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFiltre("toutes");
                setSearch("");
              }}
            >
              {t("suivi.tasks.clearFilters")}
            </Button>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <AnimatePresence initial={false}>
            {filtered.map((task) => (
              <motion.li
                key={task.idTache}
                layout
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-muted/20"
              >
                <Checkbox
                  checked={task.statut === "terminee"}
                  onCheckedChange={() => toggleStatut(task)}
                  disabled={update.isPending}
                  className="mt-0.5"
                  aria-label={
                    task.statut === "terminee"
                      ? t("suivi.tasks.markTodo")
                      : t("suivi.tasks.markDone")
                  }
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium text-foreground",
                      task.statut === "terminee" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {task.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge statut={task.statut} />
                    {task.idObjectif && objectifLabel[task.idObjectif] && (
                      <span className="truncate text-[11px] text-violet-700 dark:text-violet-300">
                        {objectifLabel[task.idObjectif]}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(task.dateCompletion || task.dateCreation, locale)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(task.idTache)}
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600"
                  aria-label={t("suivi.tasks.delete")}
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Kanban view — only real statuses */}
      {view === "kanban" && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <KanbanColumn
            title={t("suivi.tasks.todo")}
            tone="amber"
            items={filtered.filter((task) => task.statut === "a_faire")}
            objectifLabel={objectifLabel}
            onToggle={toggleStatut}
            onDelete={setDeleteId}
            busy={update.isPending}
          />
          <KanbanColumn
            title={t("suivi.tasks.completed")}
            tone="green"
            items={filtered.filter((task) => task.statut === "terminee")}
            objectifLabel={objectifLabel}
            onToggle={toggleStatut}
            onDelete={setDeleteId}
            busy={update.isPending}
          />
        </div>
      )}

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("suivi.tasks.newTask")}</DialogTitle>
            <DialogDescription>
              {t("suivi.tasks.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("suivi.tasks.title")}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("suivi.tasks.titlePlaceholder")}
                className="mt-1 h-10"
                autoFocus
              />
              {formError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {formError}
                </p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("suivi.tasks.linkedObjective")}
              </label>
              <Select
                value={idObjectif || "none"}
                onValueChange={(v) => setIdObjectif(v === "none" ? "" : v)}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder={t("suivi.tasks.noObjective")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("suivi.tasks.noObjective")}</SelectItem>
                  {objectifs.map((o) => (
                    <SelectItem key={o.idObjectif} value={o.idObjectif}>
                      {o.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t("suivi.tasks.quickAddObjective")}
              </p>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={newObjectif}
                  onChange={(e) => setNewObjectif(e.target.value)}
                  placeholder={t("suivi.tasks.newObjective")}
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  disabled={!newObjectif.trim() || ajouterObjectif.isPending}
                  onClick={handleCreateObjectif}
                >
                  {ajouterObjectif.isPending ? (
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {t("suivi.tasks.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={ajouter.isPending}
                className="gap-1.5 bg-teal-600 text-white hover:bg-teal-700"
              >
                {ajouter.isPending ? (
                  <FiLoader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FiCheck className="h-3.5 w-3.5" />
                )}
                {t("suivi.tasks.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("suivi.tasks.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("suivi.tasks.deleteBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              {t("suivi.tasks.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={supprimer.isPending}
              onClick={confirmDelete}
              className="gap-1.5"
            >
              {supprimer.isPending ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FiTrash2 className="h-3.5 w-3.5" />
              )}
              {t("suivi.tasks.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Stat({ label, value, tone }) {
  const dot = {
    teal: "bg-teal-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-violet-500",
  }[tone];
  return (
    <div>
      <span className={cn("mb-1 inline-block h-1.5 w-1.5 rounded-full", dot)} />
      <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function KanbanColumn({
  title,
  tone,
  items,
  objectifLabel,
  onToggle,
  onDelete,
  busy,
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.1em]",
            tone === "green"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400",
          )}
        >
          {title}
        </p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="py-6 text-center text-xs text-muted-foreground">
            {t("suivi.tasks.noTasks")}
          </li>
        ) : (
          items.map((task) => (
            <li
              key={task.idTache}
              className="rounded-lg border border-border/80 bg-background px-3 py-2.5"
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(t)}
                  disabled={busy}
                  className="mt-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={t("suivi.tasks.toggleStatus")}
                >
                  {task.statut === "terminee" ? (
                    <FiCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <FiCircle className="h-4 w-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {task.description}
                  </p>
                  {task.idObjectif && objectifLabel[task.idObjectif] && (
                    <p className="mt-0.5 truncate text-[11px] text-violet-700 dark:text-violet-300">
                      {objectifLabel[task.idObjectif]}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(task.idTache)}
                  className="text-muted-foreground hover:text-red-600"
                  aria-label={t("suivi.tasks.deleteAria")}
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
