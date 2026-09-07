"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiLoader,
  FiSettings,
  FiUsers,
  FiShield,
  FiBell,
  FiTool,
  FiAlertTriangle,
  FiCheck,
  FiSearch,
} from "react-icons/fi";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useParametres,
  useUpdateParametres,
} from "@/lib/queries/useParametres";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/store/useToastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

/** Navigation — ids aligned with existing section content (labels via i18n) */
const NAV_GROUP_DEFS = [
  {
    labelKey: "adminSettings.groupPlatform",
    items: [
      { id: "general", labelKey: "adminSettings.navGeneral", icon: FiSettings },
    ],
  },
  {
    labelKey: "adminSettings.groupSystem",
    items: [
      {
        id: "maintenance",
        labelKey: "adminSettings.navMaintenance",
        icon: FiTool,
      },
    ],
  },
  {
    labelKey: "adminSettings.groupPeople",
    items: [
      { id: "utilisateurs", labelKey: "adminSettings.navUsers", icon: FiUsers },
    ],
  },
  {
    labelKey: "adminSettings.groupCommunication",
    items: [
      {
        id: "notifications",
        labelKey: "adminSettings.navNotifications",
        icon: FiBell,
      },
    ],
  },
  {
    labelKey: "adminSettings.groupSecurity",
    items: [
      {
        id: "securite",
        labelKey: "adminSettings.navSecurity",
        icon: FiShield,
      },
    ],
  },
];

/** Aligné sur ELEMENTS_VALIDATION_AUTO (API administrateurs.schema.js) */
const ELEMENTS_VALIDATION_AUTO_DEFS = [
  {
    cle: "offres_finales",
    labelKey: "adminSettings.elemFinalOffers",
    descriptionKey: "adminSettings.elemFinalOffersDesc",
  },
  {
    cle: "conventions",
    labelKey: "adminSettings.elemAgreements",
    descriptionKey: "adminSettings.elemAgreementsDesc",
  },
  {
    cle: "entreprises",
    labelKey: "adminSettings.elemCompanies",
    descriptionKey: "adminSettings.elemCompaniesDesc",
  },
  {
    cle: "universites",
    labelKey: "adminSettings.elemUniversities",
    descriptionKey: "adminSettings.elemUniversitiesDesc",
  },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted-foreground/25",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SettingsSection({ eyebrow, title, description, children, danger }) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-card",
        danger ? "border-destructive/25" : "border-border",
      )}
    >
      <div
        className={cn(
          "border-b px-5 py-4 sm:px-6",
          danger ? "border-destructive/15 bg-destructive/[0.02]" : "border-border",
        )}
      >
        {eyebrow && (
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.12em]",
              danger ? "text-destructive/80" : "text-muted-foreground",
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function SettingRow({ label, description, children, align = "center" }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:justify-between sm:px-6",
        align === "center" ? "sm:items-center" : "sm:items-start",
      )}
    >
      <div className="min-w-0 flex-1 pr-0 sm:pr-6">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, disabled, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="h-9 w-24 rounded-md border border-border bg-background px-2.5 text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
      />
      {suffix && (
        <span className="text-xs text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}

function toLocalInputValue(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(local) {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function ParametresAdminPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [section, setSection] = useState("general");
  const [search, setSearch] = useState("");
  const { data: serverParams, isLoading, isError, refetch } = useParametres();
  const updateMutation = useUpdateParametres();
  const [draft, setDraft] = useState(null);

  const navGroups = useMemo(
    () =>
      NAV_GROUP_DEFS.map((g) => ({
        label: t(g.labelKey),
        items: g.items.map((it) => ({
          id: it.id,
          label: t(it.labelKey),
          icon: it.icon,
        })),
      })),
    [t],
  );

  const sections = useMemo(
    () => navGroups.flatMap((g) => g.items),
    [navGroups],
  );

  const elementsValidationAuto = useMemo(
    () =>
      ELEMENTS_VALIDATION_AUTO_DEFS.map((el) => ({
        cle: el.cle,
        label: t(el.labelKey),
        description: t(el.descriptionKey),
      })),
    [t],
  );

  const formFromServer = useMemo(() => {
    if (!serverParams) return null;
    return {
      validationAutomatique: serverParams.validationAutomatique,
      elementsValidationAutomatique: Array.isArray(
        serverParams.elementsValidationAutomatique,
      )
        ? [...serverParams.elementsValidationAutomatique]
        : [],
      delaiTraitementHeures: serverParams.delaiTraitementHeures,
      documentsRequisParEntite: serverParams.documentsRequisParEntite,
      notificationsEmail: serverParams.notificationsEmail,
      doubleAuthentification: serverParams.doubleAuthentification,
      modeMaintenance: serverParams.modeMaintenance ?? false,
      messageMaintenance: serverParams.messageMaintenance ?? "",
      maintenanceDebut: serverParams.maintenanceDebut ?? null,
      maintenanceFin: serverParams.maintenanceFin ?? null,
      adminsPeuventAcceder: serverParams.adminsPeuventAcceder ?? true,
    };
  }, [serverParams]);

  const formValues = draft ?? formFromServer;

  const dirty = useMemo(() => {
    if (!formValues || !serverParams) return {};
    const keys = [
      "validationAutomatique",
      "elementsValidationAutomatique",
      "delaiTraitementHeures",
      "documentsRequisParEntite",
      "notificationsEmail",
      "doubleAuthentification",
      "modeMaintenance",
      "messageMaintenance",
      "maintenanceDebut",
      "maintenanceFin",
      "adminsPeuventAcceder",
    ];
    const changes = {};
    for (const k of keys) {
      let a = formValues[k];
      let b = serverParams[k];
      if (k === "messageMaintenance") {
        a = a || "";
        b = b || "";
      }
      if (k === "modeMaintenance" || k === "adminsPeuventAcceder") {
        b = b ?? (k === "adminsPeuventAcceder");
      }
      if (k === "maintenanceDebut" || k === "maintenanceFin") {
        const as = a ? new Date(a).toISOString() : null;
        const bs = b ? new Date(b).toISOString() : null;
        if (as !== bs) changes[k] = a;
        continue;
      }
      if (k === "elementsValidationAutomatique") {
        const sa = JSON.stringify(Array.isArray(a) ? [...a].sort() : []);
        const sb = JSON.stringify(Array.isArray(b) ? [...b].sort() : []);
        if (sa !== sb) changes[k] = Array.isArray(a) ? a : [];
        continue;
      }
      if (a !== b) changes[k] = a;
    }
    return changes;
  }, [formValues, serverParams]);

  const isDirty = Object.keys(dirty).length > 0;

  function setField(key, value) {
    setDraft((prev) => {
      const base = prev ?? formFromServer ?? {};
      return { ...base, [key]: value };
    });
  }

  function resetDraft() {
    setDraft(null);
  }

  function save() {
    if (!isDirty) return;
    const payload = { ...dirty };
    if ("messageMaintenance" in payload && payload.messageMaintenance === "") {
      payload.messageMaintenance = null;
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t("adminSettings.toastSaved"));
        setDraft(null);
        if (typeof window !== "undefined" && "modeMaintenance" in payload) {
          if (payload.modeMaintenance) {
            window.dispatchEvent(
              new CustomEvent("internin:maintenance", {
                detail: {
                  message:
                    payload.messageMaintenance ??
                    formValues.messageMaintenance ??
                    null,
                },
              }),
            );
          } else {
            window.dispatchEvent(new CustomEvent("internin:maintenance-off"));
          }
        }
      },
      onError: (err) => {
        toast.error(err?.message || t("adminSettings.toastSaveFailed"));
      },
    });
  }

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const searchQ = search.trim().toLowerCase();
  const filteredNav = useMemo(() => {
    if (!searchQ) return navGroups;
    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.label.toLowerCase().includes(searchQ) ||
            g.label.toLowerCase().includes(searchQ) ||
            it.id.includes(searchQ),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [searchQ, navGroups]);

  const activeMeta = sections.find((s) => s.id === section);

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("adminSettings.breadcrumbAdmin") },
          { label: t("adminSettings.breadcrumbSettings") },
        ]}
        refreshKeys={["parametresPlateforme"]}
      />

      <div className="px-4 pt-5 sm:px-6">
        <AdminPageHeader
          context={t("adminSettings.context")}
          title={t("adminSettings.title")}
          description={t("adminSettings.description")}
          metadata={
            isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t("adminSettings.unsavedChanges")}
              </span>
            ) : !isLoading && !isError ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("adminSettings.allSaved")}
              </span>
            ) : null
          }
        />
      </div>

      <motion.div
        className="px-4 py-5 sm:px-6"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/25 bg-destructive/[0.03] px-6 py-14 text-center">
            <FiAlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("adminSettings.loadErrorTitle")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("adminSettings.loadErrorDesc")}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => refetch()}
            >
              {t("adminSettings.retry")}
            </Button>
          </div>
        )}

        {!isLoading && !isError && formValues && (
          <div className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-[240px_1fr]">
            {/* Internal navigation */}
            <aside className="lg:sticky lg:top-4 lg:self-start">
              <div className="mb-3">
                <label htmlFor="settings-search" className="sr-only">
                  {t("adminSettings.searchLabel")}
                </label>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="settings-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("adminSettings.searchPlaceholder")}
                    className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              {/* Mobile select */}
              <div className="mb-3 lg:hidden">
                <label htmlFor="settings-section-mobile" className="sr-only">
                  {t("adminSettings.sectionSelectLabel")}
                </label>
                <select
                  id="settings-section-mobile"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <nav
                className="hidden space-y-4 lg:block"
                aria-label={t("adminSettings.navAria")}
              >
                {filteredNav.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((s) => {
                        const active = section === s.id;
                        const Icon = s.icon;
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => setSection(s.id)}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                                active
                                  ? "bg-muted font-medium text-foreground"
                                  : "font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                              )}
                              aria-current={active ? "page" : undefined}
                            >
                              <Icon
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  active
                                    ? "text-primary"
                                    : "text-muted-foreground",
                                )}
                              />
                              {s.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {filteredNav.length === 0 && (
                  <p className="px-2.5 text-xs text-muted-foreground">
                    {t("adminSettings.noMatchingCategories")}
                  </p>
                )}
              </nav>
            </aside>

            {/* Content */}
            <div className="min-w-0 space-y-5">
              <div className="border-b border-border pb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {activeMeta?.label || t("adminSettings.title")}
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  {section === "general" && (
                    <SettingsSection
                      eyebrow={t("adminSettings.groupPlatform")}
                      title={t("adminSettings.platformBehaviorTitle")}
                      description={t("adminSettings.platformBehaviorDesc")}
                    >
                      <SettingRow
                        label={t("adminSettings.automaticValidation")}
                        description={t("adminSettings.automaticValidationDesc")}
                      >
                        <Toggle
                          checked={!!formValues.validationAutomatique}
                          onChange={(v) => setField("validationAutomatique", v)}
                          disabled={updateMutation.isPending}
                        />
                      </SettingRow>

                      {formValues.validationAutomatique && (
                        <div className="px-5 py-4 sm:px-6">
                          <p className="text-sm font-medium text-foreground">
                            {t("adminSettings.coveredElements")}
                          </p>
                          <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                            {t("adminSettings.coveredElementsDesc")}
                          </p>
                          <div className="space-y-1.5 rounded-md border border-border bg-muted/20 p-2">
                            {elementsValidationAuto.map((el) => {
                              const selected = Array.isArray(
                                formValues.elementsValidationAutomatique,
                              )
                                ? formValues.elementsValidationAutomatique
                                : [];
                              const checked = selected.includes(el.cle);
                              return (
                                <label
                                  key={el.cle}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                                    checked
                                      ? "bg-primary/5"
                                      : "hover:bg-muted/50",
                                    updateMutation.isPending && "opacity-60",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                    checked={checked}
                                    disabled={updateMutation.isPending}
                                    onChange={() => {
                                      const prev = Array.isArray(
                                        formValues.elementsValidationAutomatique,
                                      )
                                        ? formValues.elementsValidationAutomatique
                                        : [];
                                      const next = checked
                                        ? prev.filter((c) => c !== el.cle)
                                        : [...prev, el.cle];
                                      setField(
                                        "elementsValidationAutomatique",
                                        next,
                                      );
                                    }}
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-foreground">
                                      {el.label}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {el.description}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          {Array.isArray(
                            formValues.elementsValidationAutomatique,
                          ) &&
                            formValues.elementsValidationAutomatique.length ===
                              0 && (
                              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                {t("adminSettings.noElementSelected")}
                              </p>
                            )}
                        </div>
                      )}

                      <SettingRow
                        label={t("adminSettings.processingDelay")}
                        description={t("adminSettings.processingDelayDesc")}
                      >
                        <NumberInput
                          value={formValues.delaiTraitementHeures}
                          min={1}
                          max={720}
                          onChange={(v) => setField("delaiTraitementHeures", v)}
                          disabled={updateMutation.isPending}
                          suffix={t("adminSettings.hours")}
                        />
                      </SettingRow>

                      <SettingRow
                        label={t("adminSettings.documentsRequired")}
                        description={t("adminSettings.documentsRequiredDesc")}
                      >
                        <NumberInput
                          value={formValues.documentsRequisParEntite}
                          min={0}
                          max={20}
                          onChange={(v) =>
                            setField("documentsRequisParEntite", v)
                          }
                          disabled={updateMutation.isPending}
                        />
                      </SettingRow>
                    </SettingsSection>
                  )}

                  {section === "maintenance" && (
                    <>
                      <SettingsSection
                        eyebrow={t("adminSettings.groupSystem")}
                        title={t("adminSettings.maintenanceTitle")}
                        description={t("adminSettings.maintenanceDesc")}
                        danger={!!formValues.modeMaintenance}
                      >
                        <div className="px-5 py-4 sm:px-6">
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium",
                              formValues.modeMaintenance
                                ? "border-destructive/30 bg-destructive/5 text-destructive"
                                : "border-border bg-muted/40 text-muted-foreground",
                            )}
                          >
                            {formValues.modeMaintenance ? (
                              <>
                                <FiAlertTriangle className="h-3.5 w-3.5" />
                                {t("adminSettings.maintenanceActive")}
                              </>
                            ) : (
                              <>
                                <FiCheck className="h-3.5 w-3.5" />
                                {t("adminSettings.platformOperational")}
                              </>
                            )}
                          </div>
                        </div>

                        <SettingRow
                          label={t("adminSettings.enableMaintenance")}
                          description={t("adminSettings.enableMaintenanceDesc")}
                        >
                          <Toggle
                            checked={!!formValues.modeMaintenance}
                            onChange={(v) => setField("modeMaintenance", v)}
                            disabled={updateMutation.isPending}
                          />
                        </SettingRow>

                        <SettingRow
                          label={t("adminSettings.adminsCanAccess")}
                          description={t("adminSettings.adminsCanAccessDesc")}
                        >
                          <Toggle
                            checked={!!formValues.adminsPeuventAcceder}
                            onChange={(v) =>
                              setField("adminsPeuventAcceder", v)
                            }
                            disabled={updateMutation.isPending}
                          />
                        </SettingRow>

                        <div className="space-y-2 px-5 py-4 sm:px-6">
                          <label
                            htmlFor="message-maintenance"
                            className="text-sm font-medium text-foreground"
                          >
                            {t("adminSettings.displayedMessage")}
                          </label>
                          <textarea
                            id="message-maintenance"
                            value={formValues.messageMaintenance || ""}
                            onChange={(e) =>
                              setField("messageMaintenance", e.target.value)
                            }
                            rows={3}
                            disabled={updateMutation.isPending}
                            placeholder={t(
                              "adminSettings.maintenanceMessagePlaceholder",
                            )}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 sm:px-6">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="maintenance-debut"
                              className="text-xs font-medium text-muted-foreground"
                            >
                              {t("adminSettings.startOptional")}
                            </label>
                            <input
                              id="maintenance-debut"
                              type="datetime-local"
                              value={toLocalInputValue(
                                formValues.maintenanceDebut,
                              )}
                              onChange={(e) =>
                                setField(
                                  "maintenanceDebut",
                                  fromLocalInputValue(e.target.value),
                                )
                              }
                              disabled={updateMutation.isPending}
                              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="maintenance-fin"
                              className="text-xs font-medium text-muted-foreground"
                            >
                              {t("adminSettings.endOptional")}
                            </label>
                            <input
                              id="maintenance-fin"
                              type="datetime-local"
                              value={toLocalInputValue(
                                formValues.maintenanceFin,
                              )}
                              onChange={(e) =>
                                setField(
                                  "maintenanceFin",
                                  fromLocalInputValue(e.target.value),
                                )
                              }
                              disabled={updateMutation.isPending}
                              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <p className="px-5 pb-4 text-[11px] leading-relaxed text-muted-foreground sm:px-6">
                          {t("adminSettings.maintenanceNote")}
                        </p>
                      </SettingsSection>
                    </>
                  )}

                  {section === "utilisateurs" && (
                    <SettingsSection
                      eyebrow={t("adminSettings.groupPeople")}
                      title={t("adminSettings.userManagementTitle")}
                      description={t("adminSettings.userManagementDesc")}
                    >
                      <div className="px-5 py-10 text-center sm:px-6">
                        <p className="text-sm text-muted-foreground">
                          {t("adminSettings.userManagementHintBefore")}{" "}
                          <span className="font-medium text-foreground">
                            {t("adminSettings.userManagementHintUsers")}
                          </span>{" "}
                          {t("adminSettings.userManagementHintAfter")}
                        </p>
                      </div>
                    </SettingsSection>
                  )}

                  {section === "notifications" && (
                    <SettingsSection
                      eyebrow={t("adminSettings.groupCommunication")}
                      title={t("adminSettings.notificationChannelsTitle")}
                      description={t("adminSettings.notificationChannelsDesc")}
                    >
                      <SettingRow
                        label={t("adminSettings.emailNotifications")}
                        description={t("adminSettings.emailNotificationsDesc")}
                      >
                        <Toggle
                          checked={!!formValues.notificationsEmail}
                          onChange={(v) => setField("notificationsEmail", v)}
                          disabled={updateMutation.isPending}
                        />
                      </SettingRow>
                    </SettingsSection>
                  )}

                  {section === "securite" && (
                    <SettingsSection
                      eyebrow={t("adminSettings.groupSecurity")}
                      title={t("adminSettings.adminProtectionTitle")}
                      description={t("adminSettings.adminProtectionDesc")}
                    >
                      <SettingRow
                        label={t("adminSettings.twoFactorAdmins")}
                        description={t("adminSettings.twoFactorAdminsDesc")}
                      >
                        <Toggle
                          checked={!!formValues.doubleAuthentification}
                          onChange={(v) =>
                            setField("doubleAuthentification", v)
                          }
                          disabled={updateMutation.isPending}
                        />
                      </SettingRow>
                    </SettingsSection>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* Unsaved changes bar */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/90">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t("adminSettings.unsavedChanges")}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={updateMutation.isPending}
                onClick={resetDraft}
              >
                {t("adminSettings.discard")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateMutation.isPending}
                onClick={save}
              >
                {updateMutation.isPending && (
                  <FiLoader className="h-4 w-4 animate-spin" />
                )}
                {t("adminSettings.saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
