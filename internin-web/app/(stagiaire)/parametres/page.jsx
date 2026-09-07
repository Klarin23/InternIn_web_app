"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Palette,
  Languages,
  Lock,
  AlertTriangle,
  LogOut,
  Trash2,
  Check,
  ChevronRight,
  Mail,
  Phone,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Loader2,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  useStagiaireProfile,
  useUpdateStagiairePrivacy,
} from "@/lib/queries/useStagiaireProfile";
import { calculerCompletionProfil } from "@/lib/utils/profilCompletion";
import { resendEmailVerificationRequest, logoutRequest } from "@/lib/api/auth";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTIONS = [
  {
    id: "profil",
    group: "Compte",
    label: "Profil et compte",
    description: "Identité et informations",
    icon: User,
  },
  {
    id: "securite",
    group: "Sécurité",
    label: "Sécurité",
    description: "Mot de passe et vérifications",
    icon: Shield,
  },
  {
    id: "notifications",
    group: "Préférences",
    label: "Notifications",
    description: "Alertes et communications",
    icon: Bell,
  },
  {
    id: "apparence",
    group: "Préférences",
    label: "Apparence",
    description: "Thème clair ou sombre",
    icon: Palette,
  },
  {
    id: "langue",
    group: "Préférences",
    label: "Langue",
    description: "Langue de l'interface",
    icon: Languages,
  },
  {
    id: "confidentialite",
    group: "Sécurité",
    label: "Confidentialité",
    description: "Visibilité de votre profil",
    icon: Lock,
  },
  {
    id: "danger",
    group: "Compte sensible",
    label: "Zone dangereuse",
    description: "Déconnexion et suppression",
    icon: AlertTriangle,
  },
];

const NOTIF_PREFS_KEY = "internin-notif-prefs";

const DEFAULT_NOTIF_PREFS = {
  candidatures: true,
  entretiens: true,
  evaluations: true,
  opportunites: false,
  emails: true,
};

// ---------------------------------------------------------------------------
// Small UI primitives
// ---------------------------------------------------------------------------

function Switch({ checked, onCheckedChange, id, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SectionCard({ title, description, children, actions }) {
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-5 p-5">{children}</div>
      {actions && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          {actions}
        </div>
      )}
    </div>
  );
}

function SettingRow({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function AccountStatusCard({ profil, user }) {
  const completion = useMemo(
    () => (profil ? calculerCompletionProfil(profil) : { pourcentage: 0 }),
    [profil],
  );
  const prenom = profil?.prenom || user?.prenom || "";
  const nom = profil?.nom || user?.nom || "";
  const initiales = `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase() || "U";
  const emailVerifie = user?.emailVerifie ?? profil?.emailVerifie;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {profil?.photoProfilUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profil.photoProfilUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initiales
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {[prenom, nom].filter(Boolean).join(" ") || "Utilisateur"}
          </p>
          <p className="text-xs text-muted-foreground">Stagiaire</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Profil complété</span>
          <span className="font-medium tabular-nums text-foreground">
            {completion.pourcentage} %
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${completion.pourcentage}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          {emailVerifie ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span className="text-muted-foreground">Email vérifié</span>
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5 text-warning" />
              <span className="text-muted-foreground">Email non vérifié</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsNav({ activeId, onSelect }) {
  return (
    <nav className="space-y-1" aria-label="Sections des paramètres">
      {SECTIONS.map((section, index) => {
        const showGroup =
          index === 0 || section.group !== SECTIONS[index - 1].group;
        const Icon = section.icon;
        const active = activeId === section.id;
        return (
          <div key={section.id}>
            {showGroup && (
              <p className="mb-1.5 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:mt-0">
                {section.group}
              </p>
            )}
            <button
              type="button"
              onClick={() => onSelect(section.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="truncate">{section.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Sections content
// ---------------------------------------------------------------------------

function ProfilSection({ profil, user }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <SectionCard
      title={t("stagiaireSpace.settings.profileAccount")}
      description="Vos informations personnelles et l'accès à votre profil public."
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {profil?.photoProfilUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profil.photoProfilUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            `${profil?.prenom?.[0] || ""}${profil?.nom?.[0] || ""}`.toUpperCase() ||
            "U"
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-base font-semibold text-foreground">
            {[profil?.prenom, profil?.nom].filter(Boolean).join(" ") || "—"}
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              {user?.email || profil?.email || "—"}
            </p>
            {(profil?.telephone || user?.telephone) && (
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                {profil?.telephone || user?.telephone}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="pt-1">
        <Button
          variant="outline"
          size="default"
          onClick={() => router.push("/profil")}
          className="gap-2"
        >
          Modifier mon profil
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </SectionCard>
  );
}

function SecuriteSection({ user, profil }) {
  const { t } = useTranslation();
  const [resending, setResending] = useState(false);
  const token = useAuthStore((s) => s.token);
  const emailVerifie = user?.emailVerifie ?? profil?.emailVerifie;

  async function handleResend() {
    if (!token || resending) return;
    setResending(true);
    try {
      await resendEmailVerificationRequest(token);
      toast.success(t("stagiaireSpace.settings.resendSuccess"));
    } catch (err) {
      toast.error(err?.message || t("stagiaireSpace.settings.resendError"));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("stagiaireSpace.settings.password")}
        description={t("stagiaireSpace.settings.passwordDesc")}
      >
        <SettingRow
          title={t("stagiaireSpace.settings.changePassword")}
          description={t("stagiaireSpace.settings.changePasswordDesc")}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/mot-de-passe-oublie";
            }}
            className="gap-1.5"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Modifier
          </Button>
        </SettingRow>
      </SectionCard>

      <SectionCard title={t("stagiaireSpace.settings.emailVerification")}>
        <SettingRow
          title={emailVerifie ? t("stagiaireSpace.settings.emailVerified") : t("stagiaireSpace.settings.emailNotVerified")}
          description={
            emailVerifie
              ? t("stagiaireSpace.settings.emailVerifiedDesc")
              : t("stagiaireSpace.settings.emailNotVerifiedDesc")
          }
        >
          {emailVerifie ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Vérifié
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? t("stagiaireSpace.settings.sending") : t("stagiaireSpace.settings.resendEmail")}
            </Button>
          )}
        </SettingRow>
      </SectionCard>

      <SectionCard
        title={t("stagiaireSpace.settings.activeSessions")}
        description={t("stagiaireSpace.settings.sessionsDesc")}
      >
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <Monitor className="mx-auto h-7 w-7 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Session actuelle uniquement
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            La liste et la révocation des autres appareils seront disponibles
            prochainement.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsSection() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_NOTIF_PREFS;
    try {
      const raw = localStorage.getItem(NOTIF_PREFS_KEY);
      return raw ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIF_PREFS;
    } catch {
      return DEFAULT_NOTIF_PREFS;
    }
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = [
    {
      key: "candidatures",
      titleKey: "notifCandidatures",
      descriptionKey: "notifCandidaturesDesc",
    },
    {
      key: "entretiens",
      titleKey: "notifEntretiens",
      descriptionKey: "notifEntretiensDesc",
    },
    {
      key: "evaluations",
      titleKey: "notifEvaluations",
      descriptionKey: "notifEvaluationsDesc",
    },
    {
      key: "opportunites",
      titleKey: "notifOpportunites",
      descriptionKey: "notifOpportunitesDesc",
    },
    {
      key: "emails",
      titleKey: "notifEmails",
      descriptionKey: "notifEmailsDesc",
    },
  ];

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  }

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
      setDirty(false);
      toast.success("Préférences de notifications enregistrées.");
    } catch {
      toast.error("Impossible d'enregistrer les préférences.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    try {
      const raw = localStorage.getItem(NOTIF_PREFS_KEY);
      setPrefs(raw ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIF_PREFS);
    } catch {
      setPrefs(DEFAULT_NOTIF_PREFS);
    }
    setDirty(false);
  }

  return (
    <SectionCard
      title={t("stagiaireSpace.settings.notifications")}
      description="Choisissez les alertes que vous souhaitez recevoir."
      actions={
        dirty ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </>
        ) : null
      }
    >
      <div className="space-y-5">
        {items.map((item) => (
          <SettingRow
            key={item.key}
            title={t(`stagiaireSpace.settings.${item.titleKey}`)}
            description={t(`stagiaireSpace.settings.${item.descriptionKey}`)}
          >
            <Switch
              id={`notif-${item.key}`}
              checked={!!prefs[item.key]}
              onCheckedChange={() => toggle(item.key)}
            />
          </SettingRow>
        ))}
      </div>
    </SectionCard>
  );
}

function ApparenceSection() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const options = [
    {
      id: "light",
      label: "Clair",
      icon: Sun,
      preview: "bg-white border-border",
    },
    {
      id: "dark",
      label: "Sombre",
      icon: Moon,
      preview: "bg-slate-900 border-slate-700",
    },
  ];

  return (
    <SectionCard
      title={t("stagiaireSpace.settings.appearance")}
      description="Personnalisez l'apparence de l'interface."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((opt) => {
          const active = theme === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setTheme(opt.id);
                toast.success(
                  opt.id === "dark" ? "Thème sombre activé." : "Thème clair activé.",
                );
              }}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-md border-2 p-4 transition-all",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-sm border",
                  opt.preview,
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    opt.id === "dark" ? "text-slate-300" : "text-slate-600",
                  )}
                />
              </div>
              <span className="text-sm font-medium text-foreground">
                {opt.label}
              </span>
              {active && (
                <span className="absolute right-2 top-2 text-primary">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function LangueSection() {
  const { locale, setLocale, t } = useTranslation();

  const langues = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
  ];

  return (
    <SectionCard
      title={t("stagiaireSpace.settings.language")}
      description="Choisissez la langue de l'interface."
    >
      <div className="space-y-2">
        {langues.map((l) => {
          const active = locale === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                if (locale !== l.code) {
                  setLocale(l.code);
                  toast.success(
                    l.code === "fr"
                      ? "Langue définie sur Français."
                      : "Language set to English.",
                  );
                }
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span className="text-sm font-medium text-foreground">
                {l.label}
              </span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ConfidentialiteSection({ profil }) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const updatePrivacy = useUpdateStagiairePrivacy();
  const visible = Boolean(profil?.profilVisibleEntreprises);
  const saving = updatePrivacy.isPending;

  async function handleToggle(next) {
    if (saving) return;
    try {
      await updatePrivacy.mutateAsync({ profilVisibleEntreprises: next });
      if (next) {
        toast.success(
          "Profil visible — votre profil peut apparaître dans les recherches des entreprises.",
        );
      } else {
        toast.success(
          "Profil masqué — votre profil n'apparaît plus dans les recherches des entreprises.",
        );
      }
    } catch (err) {
      toast.error(
        err?.message || "Impossible de mettre à jour la visibilité du profil.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("stagiaireSpace.settings.visibility")}
        description="Contrôlez si les entreprises peuvent découvrir votre profil dans Talents."
      >
        <div
          className={cn(
            "rounded-xl border p-4 sm:p-5 transition-colors",
            visible
              ? "border-primary/25 bg-primary/[0.04]"
              : "border-border bg-muted/20",
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  visible
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <motion.div
                  key={visible ? "eye" : "eye-off"}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {visible ? (
                    <Eye className="h-5 w-5" aria-hidden />
                  ) : (
                    <EyeOff className="h-5 w-5" aria-hidden />
                  )}
                </motion.div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    Profil visible auprès des entreprises
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      visible
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Building2 className="h-3 w-3" aria-hidden />
                    {visible ? "Visible" : "Masqué"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Lorsque cette option est activée, votre profil peut apparaître
                  dans les recherches de talents effectuées par les entreprises.
                  Vous pouvez modifier ce choix à tout moment.
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={visible ? "on" : "off"}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="mt-2 text-xs font-medium text-foreground/80"
                  >
                    {visible
                      ? "Votre profil peut apparaître dans Talents."
                      : "Votre profil n'apparaît pas dans les recherches des entreprises."}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              {saving && (
                <Loader2
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  aria-hidden
                />
              )}
              <Switch
                id="profil-visible-entreprises"
                checked={visible}
                disabled={saving || !profil}
                onCheckedChange={handleToggle}
              />
              <label htmlFor="profil-visible-entreprises" className="sr-only">
                Profil visible auprès des entreprises
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-card px-3.5 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Même masqué, votre profil reste accessible aux entreprises avec
            lesquelles vous avez déjà une candidature ou un stage en cours.
            Seule la découverte dans le module Talents est concernée.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function DangerSection({ onLogout }) {
  const { t } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const router = useRouter();

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (token) await logoutRequest(null, token);
    } catch {
      /* ignore network errors on logout */
    } finally {
      clearSession();
      router.replace("/connexion");
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("stagiaireSpace.settings.logout")}
        description="Déconnecter votre session actuelle sur cet appareil."
      >
        <SettingRow
          title={t("stagiaireSpace.settings.logoutAction")}
          description="Vous pourrez vous reconnecter à tout moment."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={loggingOut}
            onClick={handleLogout}
            className="gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </SettingRow>
      </SectionCard>

      <div className="rounded-md border border-destructive/30 bg-destructive/5">
        <div className="border-b border-destructive/20 px-5 py-4">
          <h2 className="text-base font-semibold text-destructive">
            Supprimer mon compte
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            La suppression du compte est une action sensible. Contactez le
            support si vous souhaitez poursuivre.
          </p>
        </div>
        <div className="p-5">
          <SettingRow
            title="Suppression définitive"
            description="Cette action n'est pas encore automatisée dans l'application."
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer mon compte
            </Button>
          </SettingRow>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer votre compte ?</DialogTitle>
            <DialogDescription>
              La suppression automatisée n&apos;est pas encore disponible. Pour
              demander la suppression de vos données, contactez le support
              InternIn. Aucune action irréversible ne sera effectuée depuis
              cette boîte de dialogue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                toast.info(
                  "Contactez le support pour une demande de suppression de compte.",
                );
              }}
            >
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ParametresStagiairePage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("profil");
  const shouldReduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const { data: profil, isLoading } = useStagiaireProfile();

  const activeMeta = SECTIONS.find((s) => s.id === activeSection);

  return (
    <>
      <AppHeader
        title="Paramètres"
        subtitle="Gérez votre compte, vos préférences et votre sécurité."
      />

      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-4 lg:w-64">
            {isLoading ? (
              <Skeleton className="h-36 w-full rounded-md" />
            ) : (
              <AccountStatusCard profil={profil} user={user} />
            )}

            {/* Desktop nav */}
            <div className="hidden rounded-md border border-border bg-card p-3 lg:block">
              <SettingsNav
                activeId={activeSection}
                onSelect={setActiveSection}
              />
            </div>

            {/* Mobile nav */}
            <div className="lg:hidden">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Section
              </label>
              <div className="relative">
                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  className="w-full appearance-none rounded-md border border-border bg-card px-3 py-2.5 pr-9 text-sm font-medium text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, x: 8 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeSection === "profil" && (
                  <ProfilSection profil={profil} user={user} />
                )}
                {activeSection === "securite" && (
                  <SecuriteSection user={user} profil={profil} />
                )}
                {activeSection === "notifications" && <NotificationsSection />}
                {activeSection === "apparence" && <ApparenceSection />}
                {activeSection === "langue" && <LangueSection />}
                {activeSection === "confidentialite" && (
                  <ConfidentialiteSection profil={profil} />
                )}
                {activeSection === "danger" && <DangerSection />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}
