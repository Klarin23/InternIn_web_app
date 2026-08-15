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

const SECTIONS = [
  {
    id: "invitations",
    label: "Invitations",
    description: "Rôle par défaut et expiration",
    icon: FiMail,
  },
  {
    id: "approbation",
    label: "Approbation",
    description: "Validation des invitations",
    icon: FiShield,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alertes administrateur",
    icon: FiBell,
  },
];

// Formulaire isolé : son état local est initialisé directement à partir des
// paramètres déjà chargés (le parent ne le monte qu'une fois les données
// disponibles), donc pas besoin d'effet pour "synchroniser" l'état.
function ParametresEquipeForm({ parametres }) {
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
    if (!hasChanges || mutation.isPending) return;
    mutation.mutate({
      roleParDefautInvitation,
      expirationInvitationJours: Number(expirationInvitationJours),
      approbationRequisePourInvitation,
      notifierAdminNouvelleActivite,
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground">
          Paramètres de l&apos;équipe
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configurez les règles d&apos;invitation, d&apos;approbation et de
          notification.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Navigation sections */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Sections des paramètres">
          {SECTIONS.map((s) => {
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
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="hidden text-[11px] opacity-80 lg:block">
                    {s.description}
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

        {/* Contenu */}
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
                  title="Rôle par défaut"
                  description="Rôle attribué automatiquement aux nouvelles invitations."
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
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingCard>

                <SettingCard
                  icon={FiClock}
                  title="Expiration des invitations"
                  description="Nombre de jours avant expiration d'une invitation non acceptée."
                >
                  <div className="flex items-center gap-2">
                    <Input
                      id="expiration"
                      type="number"
                      min={1}
                      max={90}
                      value={expirationInvitationJours}
                      onChange={(e) =>
                        setExpirationInvitationJours(e.target.value)
                      }
                      className="h-11 w-28 rounded-md"
                      aria-label="Jours d'expiration"
                    />
                    <span className="text-sm text-muted-foreground">jours</span>
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
                  title="Validation des invitations"
                  description="Les administrateurs doivent valider une invitation avant son envoi."
                >
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <span className="text-sm font-medium text-foreground">
                      Exiger une validation avant l&apos;envoi
                    </span>
                    <Checkbox
                      checked={approbationRequisePourInvitation}
                      onCheckedChange={(v) =>
                        setApprobationRequisePourInvitation(!!v)
                      }
                    />
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
                  title="Alertes administrateur"
                  description="Recevoir une notification pour les activités importantes de l'équipe."
                >
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <span className="text-sm font-medium text-foreground">
                      Notifier l&apos;administrateur principal
                    </span>
                    <Checkbox
                      checked={notifierAdminNouvelleActivite}
                      onCheckedChange={(v) =>
                        setNotifierAdminNouvelleActivite(!!v)
                      }
                    />
                  </label>
                </SettingCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erreur / Sauvegarde */}
          <div className="mt-6 space-y-3">
            {mutation.isError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                {mutation.error.message}
              </motion.div>
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
                    Enregistrement...
                  </>
                ) : mutation.isSuccess && !hasChanges ? (
                  <>
                    <FiCheck className="h-4 w-4" />
                    Modifications enregistrées
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
              {!hasChanges && !mutation.isPending && (
                <span className="text-xs text-muted-foreground">
                  Aucune modification en attente
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
