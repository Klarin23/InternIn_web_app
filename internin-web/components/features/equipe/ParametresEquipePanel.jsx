"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiSettings,
  FiMail,
  FiBell,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES_INVITABLES } from "./equipeConstants";
import {
  useParametresEquipe,
  useUpdateParametresEquipe,
} from "@/lib/queries/useEquipe";
import { useTranslation } from "@/lib/i18n/useTranslation";

const SECTION_DEFS = [
  {
    id: "invitations",
    labelKey: "equipe.parametres.sections.invitations",
    descriptionKey: "equipe.parametres.sections.invitationsDescription",
    icon: FiMail,
  },
  {
    id: "approbation",
    labelKey: "equipe.parametres.sections.approbation",
    descriptionKey: "equipe.parametres.sections.approbationDescription",
    icon: FiShield,
  },
  {
    id: "notifications",
    labelKey: "equipe.parametres.sections.notifications",
    descriptionKey: "equipe.parametres.sections.notificationsDescription",
    icon: FiBell,
  },
];

// Formulaire isolé : son état local est initialisé directement à partir des
// paramètres déjà chargés (le parent ne le monte qu'une fois les données
// disponibles), donc pas besoin d'effet pour "synchroniser" l'état.
function ParametresEquipeForm({ parametres }) {
  const { t } = useTranslation();
  const mutation = useUpdateParametresEquipe();
  const [section, setSection] = useState("invitations");

  const [roleParDefautInvitation, setRoleParDefautInvitation] = useState(
    parametres.roleParDefautInvitation,
  );
  const [expirationInvitationJours, setExpirationInvitationJours] = useState(
    parametres.expirationInvitationJours,
  );
  const [
    approbationRequisePourInvitation,
    setApprobationRequisePourInvitation,
  ] = useState(parametres.approbationRequisePourInvitation);
  const [notifierAdminNouvelleActivite, setNotifierAdminNouvelleActivite] =
    useState(parametres.notifierAdminNouvelleActivite);

  const hasChanges = useMemo(() => {
    return (
      roleParDefautInvitation !== parametres.roleParDefautInvitation ||
      Number(expirationInvitationJours) !==
        parametres.expirationInvitationJours ||
      approbationRequisePourInvitation !==
        parametres.approbationRequisePourInvitation ||
      notifierAdminNouvelleActivite !== parametres.notifierAdminNouvelleActivite
    );
  }, [
    roleParDefautInvitation,
    expirationInvitationJours,
    approbationRequisePourInvitation,
    notifierAdminNouvelleActivite,
    parametres,
  ]);

  function handleSubmit() {
    mutation.mutate({
      roleParDefautInvitation,
      expirationInvitationJours: Number(expirationInvitationJours),
      approbationRequisePourInvitation,
      notifierAdminNouvelleActivite,
    });
  }

  const errorMessage =
    mutation.isError
      ? mutation.error?.code
        ? t(`equipe.parametres.errors.${mutation.error.code}`, {
            defaultValue: mutation.error?.message || t("equipe.parametres.errors.generic"),
          })
        : mutation.error?.message || t("equipe.parametres.errors.generic")
      : null;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground">
          {t("equipe.parametres.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("equipe.parametres.description")}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav
          className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
          aria-label={t("equipe.parametres.navAria")}
        >
          {SECTION_DEFS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`relative flex min-w-[140px] items-center gap-2.5 rounded-md px-3 py-2.5 text-left transition lg:min-w-0 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {t(s.labelKey)}
                  </span>
                  <span className="hidden text-[11px] opacity-80 lg:block">
                    {t(s.descriptionKey)}
                  </span>
                </span>
                {active && (
                  <motion.span
                    layoutId="param-section-indicator"
                    className="absolute inset-0 rounded-md ring-1 ring-primary/20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {section === "invitations" && (
              <motion.div
                key="invitations"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <SettingCard
                  icon={FiShield}
                  title={t("equipe.parametres.invitations.defaultRole")}
                  description={t(
                    "equipe.parametres.invitations.defaultRoleDescription",
                  )}
                >
                  <Select
                    value={roleParDefautInvitation}
                    onValueChange={setRoleParDefautInvitation}
                  >
                    <SelectTrigger className="h-11 w-full max-w-sm rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES_INVITABLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {t(r.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ROLES_INVITABLES.find(
                    (r) => r.value === roleParDefautInvitation,
                  )?.descriptionKey && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t(
                        ROLES_INVITABLES.find(
                          (r) => r.value === roleParDefautInvitation,
                        ).descriptionKey,
                      )}
                    </p>
                  )}
                </SettingCard>

                <SettingCard
                  icon={FiClock}
                  title={t("equipe.parametres.invitations.expiration")}
                  description={t(
                    "equipe.parametres.invitations.expirationDescription",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={expirationInvitationJours}
                      onChange={(e) =>
                        setExpirationInvitationJours(e.target.value)
                      }
                      className="h-11 w-24 rounded-md"
                      aria-label={t(
                        "equipe.parametres.invitations.expirationDaysAria",
                      )}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("equipe.parametres.invitations.days")}
                    </span>
                  </div>
                </SettingCard>
              </motion.div>
            )}

            {section === "approbation" && (
              <motion.div
                key="approbation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <SettingCard
                  icon={FiShield}
                  title={t("equipe.parametres.approbation.title")}
                  description={t("equipe.parametres.approbation.description")}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={!!approbationRequisePourInvitation}
                      onCheckedChange={(v) =>
                        setApprobationRequisePourInvitation(!!v)
                      }
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground">
                      {t("equipe.parametres.approbation.requireApproval")}
                    </span>
                  </label>
                </SettingCard>
              </motion.div>
            )}

            {section === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <SettingCard
                  icon={FiBell}
                  title={t("equipe.parametres.notifications.title")}
                  description={t(
                    "equipe.parametres.notifications.description",
                  )}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={!!notifierAdminNouvelleActivite}
                      onCheckedChange={(v) =>
                        setNotifierAdminNouvelleActivite(!!v)
                      }
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground">
                      {t(
                        "equipe.parametres.notifications.notifyPrimaryAdmin",
                      )}
                    </span>
                  </label>
                </SettingCard>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 border-t border-border pt-4">
            {mutation.isError && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!hasChanges || mutation.isPending}
                className="h-10 rounded-md"
              >
                {mutation.isPending ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    {t("equipe.parametres.actions.saving")}
                  </>
                ) : mutation.isSuccess && !hasChanges ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    {t("equipe.parametres.actions.saved")}
                  </>
                ) : (
                  t("equipe.parametres.actions.save")
                )}
              </Button>
              {!hasChanges && !mutation.isPending && (
                <span className="text-xs text-muted-foreground">
                  {t("equipe.parametres.actions.noPendingChanges")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ParametresEquipePanel() {
  const { data: parametres, isLoading } = useParametresEquipe();

  if (isLoading || !parametres) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-md" />
            <Skeleton className="h-32 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return <ParametresEquipeForm parametres={parametres} />;
}
