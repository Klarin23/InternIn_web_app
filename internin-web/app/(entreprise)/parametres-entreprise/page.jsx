"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Building2,
  Shield,
  Bell,
  Palette,
  Languages,
  Users,
  AlertTriangle,
  LogOut,
  Check,
  CheckCircle2,
  XCircle,
  Mail,
  ExternalLink,
  KeyRound,
  Pencil,
  Sun,
  Moon,
  MessageSquare,
  FileUser,
  ClipboardCheck,
  UsersRound,
  Loader2,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { useMembresEquipe } from "@/lib/queries/useEquipe";
import { resendEmailVerificationRequest, logoutRequest } from "@/lib/api/auth";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  SettingRow,
  InfoLine,
  SettingsSkeleton,
} from "@/components/features/parametres-entreprise/SettingsPrimitives";
import LanguagePicker from "@/components/features/parametres-entreprise/LanguagePicker";
import {
  useEntrepriseNotifPrefs,
  useUpdateEntrepriseNotifPrefs,
} from "@/lib/queries/useEntrepriseNotifPrefs";

function getSections(t) {
  return [
    {
      id: "profil",
      group: t("entrepriseSpace.settings.groups.account"),
      label: t("entrepriseSpace.settings.nav.profile"),
      description: t("entrepriseSpace.settings.nav.profileDesc"),
      icon: Building2,
    },
    {
      id: "securite",
      group: t("entrepriseSpace.settings.groups.account"),
      label: t("entrepriseSpace.settings.nav.security"),
      description: t("entrepriseSpace.settings.nav.securityDesc"),
      icon: Shield,
    },
    {
      id: "notifications",
      group: t("entrepriseSpace.settings.groups.preferences"),
      label: t("entrepriseSpace.settings.nav.notifications"),
      description: t("entrepriseSpace.settings.nav.notificationsDesc"),
      icon: Bell,
    },
    {
      id: "apparence",
      group: t("entrepriseSpace.settings.groups.preferences"),
      label: t("entrepriseSpace.settings.nav.appearance"),
      description: t("entrepriseSpace.settings.nav.appearanceDesc"),
      icon: Palette,
    },
    {
      id: "langue",
      group: t("entrepriseSpace.settings.groups.preferences"),
      label: t("entrepriseSpace.settings.nav.language"),
      description: t("entrepriseSpace.settings.nav.languageDesc"),
      icon: Languages,
    },
    {
      id: "equipe",
      group: t("entrepriseSpace.settings.groups.management"),
      label: t("entrepriseSpace.settings.nav.team"),
      description: t("entrepriseSpace.settings.nav.teamDesc"),
      icon: Users,
    },
    {
      id: "danger",
      group: t("entrepriseSpace.settings.groups.danger"),
      label: t("entrepriseSpace.settings.nav.danger"),
      description: t("entrepriseSpace.settings.nav.dangerDesc"),
      icon: AlertTriangle,
    },
  ];
}

function groupSections(sections) {
  const groups = [];
  let current = null;
  for (const s of sections) {
    if (!current || current.name !== s.group) {
      current = { name: s.group, items: [] };
      groups.push(current);
    }
    current.items.push(s);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function ProfilSection({ profil, user }) {
  const { t } = useTranslation();
  const verification = profil?.statutVerification;
  const statusLabel =
    verification === "verifiee"
      ? t("entrepriseSpace.settings.profile.verifiedBadge")
      : verification === "en_attente" || verification === "en_cours"
        ? t("entrepriseSpace.settings.profile.pendingBadge")
        : verification
          ? String(verification)
          : null;

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-xl font-bold text-primary">
            {profil?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profil.logoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              (profil?.nomEntreprise || "E").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {profil?.nomEntreprise || t("entrepriseSpace.settings.profile.companyFallback")}
            </h3>
            {profil?.secteurActivite && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {profil.secteurActivite}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {statusLabel && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {statusLabel}
                </span>
              )}
              {user?.statutCompte && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Compte {user.statutCompte}
                </span>
              )}
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0 gap-1.5 rounded-lg">
            <Link href="/profil-entreprise">
              <Pencil className="size-3.5" aria-hidden />
              {t("entrepriseSpace.settings.profile.editProfile")}
            </Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t("entrepriseSpace.settings.profile.generalTitle")}
        description={t("entrepriseSpace.settings.profile.generalDesc")}
      >
        <dl>
          <InfoLine label={t("entrepriseSpace.settings.profile.name")} value={profil?.nomEntreprise} />
          <InfoLine label={t("entrepriseSpace.settings.profile.sector")} value={profil?.secteurActivite} />
          <InfoLine label={t("entrepriseSpace.settings.profile.size")} value={profil?.tailleEntreprise} />
          <InfoLine label={t("entrepriseSpace.settings.profile.email")} value={profil?.email || user?.email} />
          <InfoLine label={t("entrepriseSpace.settings.profile.phone")} value={profil?.telephone} />
          <InfoLine label={t("entrepriseSpace.settings.profile.website")} value={profil?.siteWeb} />
          <InfoLine label={t("entrepriseSpace.settings.profile.address")} value={profil?.adresse} />
          {profil?.scoreCompletude != null && (
            <InfoLine
              label={t("entrepriseSpace.settings.profile.completeness")}
              value={`${profil.scoreCompletude} %`}
            />
          )}
        </dl>
        {!profil?.nomEntreprise && (
          <p className="text-sm text-muted-foreground">
            {t("entrepriseSpace.settings.profile.emptyHint")}
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function SecuriteSection({ user }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const [resending, setResending] = useState(false);
  const emailVerifie = !!user?.emailVerifie;

  async function handleResend() {
    if (resending || !token) return;
    setResending(true);
    try {
      await resendEmailVerificationRequest(token);
      toast.success(t("entrepriseSpace.settings.security.resendOk"));
    } catch (err) {
      toast.error(err?.message || t("entrepriseSpace.settings.security.resendError"));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("entrepriseSpace.settings.security.emailTitle")}
        description={t("entrepriseSpace.settings.security.emailDesc")}
      >
        <SettingRow
          title={user?.email || "—"}
          description={
            emailVerifie
              ? t("entrepriseSpace.settings.security.emailVerifiedDesc")
              : t("entrepriseSpace.settings.security.emailUnverifiedDesc")
          }
        >
          {emailVerifie ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {t("entrepriseSpace.settings.security.verified")}
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={resending}
              onClick={handleResend}
            >
              <Mail className="mr-1.5 size-3.5" aria-hidden />
              {resending ? t("entrepriseSpace.settings.security.sending") : t("entrepriseSpace.settings.security.resendEmail")}
            </Button>
          )}
        </SettingRow>
      </SectionCard>

      <SectionCard
        title={t("entrepriseSpace.settings.security.passwordTitle")}
        description={t("entrepriseSpace.settings.security.passwordDesc")}
      >
        <SettingRow
          title={t("entrepriseSpace.settings.security.changePassword")}
          description={t("entrepriseSpace.settings.security.changePasswordDesc")}
        >
          <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-lg">
            <Link href="/mot-de-passe-oublie">
              <KeyRound className="size-3.5" aria-hidden />
              {t("entrepriseSpace.settings.security.reset")}
            </Link>
          </Button>
        </SettingRow>
      </SectionCard>
    </div>
  );
}

function NotificationsSection() {
  const { t } = useTranslation();
  const { data: prefs, isLoading, isError } = useEntrepriseNotifPrefs();
  const updatePrefs = useUpdateEntrepriseNotifPrefs();
  const [pendingKey, setPendingKey] = useState(null);

  const items = [
    {
      key: "candidatures",
      icon: FileUser,
      title: t("entrepriseSpace.settings.notifications.applications"),
      description: t("entrepriseSpace.settings.notifications.applicationsDesc"),
    },
    {
      key: "evaluations",
      icon: ClipboardCheck,
      title: t("entrepriseSpace.settings.notifications.evaluations"),
      description: t("entrepriseSpace.settings.notifications.evaluationsDesc"),
    },
    {
      key: "messages",
      icon: MessageSquare,
      title: t("entrepriseSpace.settings.notifications.messages"),
      description: t("entrepriseSpace.settings.notifications.messagesDesc"),
    },
    {
      key: "equipe",
      icon: UsersRound,
      title: t("entrepriseSpace.settings.notifications.team"),
      description: t("entrepriseSpace.settings.notifications.teamDesc"),
    },
  ];

  async function toggle(key) {
    if (!prefs || updatePrefs.isPending) return;
    const next = !prefs[key];
    setPendingKey(key);
    try {
      await updatePrefs.mutateAsync({ [key]: next });
    } finally {
      setPendingKey(null);
    }
  }

  if (isLoading) {
    return (
      <SectionCard
        title={t("entrepriseSpace.settings.notifications.title")}
        description={
          t("entrepriseSpace.settings.notifications.serverNote") ||
          "Ces préférences sont enregistrées sur votre compte."
        }
      >
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("entrepriseSpace.settings.notifications.loading") || "Chargement…"}
        </div>
      </SectionCard>
    );
  }

  if (isError) {
    return (
      <SectionCard
        title={t("entrepriseSpace.settings.notifications.title")}
        description={
          t("entrepriseSpace.settings.notifications.serverNote") ||
          "Ces préférences sont enregistrées sur votre compte."
        }
      >
        <p className="py-6 text-center text-sm text-destructive">
          {t("entrepriseSpace.settings.notifications.loadError") ||
            "Impossible de charger vos préférences."}
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("entrepriseSpace.settings.notifications.title")}
      description={
        t("entrepriseSpace.settings.notifications.serverNote") ||
        "Ces préférences sont enregistrées sur votre compte et s'appliquent sur tous vos appareils."
      }
    >
      <div className="space-y-1">
        {items.map((item) => {
          const enabled = !!prefs?.[item.key];
          const busy = pendingKey === item.key && updatePrefs.isPending;
          return (
            <SettingRow
              key={item.key}
              title={item.title}
              description={item.description}
            >
              <div className="flex items-center gap-3">
                <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                  {enabled
                    ? t("entrepriseSpace.settings.notifications.enabled") ||
                      "Activé"
                    : t("entrepriseSpace.settings.notifications.disabled") ||
                      "Désactivé"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.title}
                  disabled={busy || updatePrefs.isPending}
                  onClick={() => toggle(item.key)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60",
                    enabled ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform",
                      enabled && "translate-x-5",
                    )}
                  >
                    {busy && (
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </span>
                </button>
              </div>
            </SettingRow>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ApparenceSection() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const options = [
    { id: "light", label: t("entrepriseSpace.settings.appearance.light"), icon: Sun },
    { id: "dark", label: t("entrepriseSpace.settings.appearance.dark"), icon: Moon },
  ];

  return (
    <SectionCard
      title={t("entrepriseSpace.settings.appearance.title")}
      description={t("entrepriseSpace.settings.appearance.description")}
    >
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const active = theme === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border text-muted-foreground hover:border-border hover:bg-muted/40",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {opt.label}
              {active && <Check className="size-3.5" aria-hidden />}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function LangueSection() {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t("entrepriseSpace.settings.language.sectionTitle")}
      description={t("entrepriseSpace.settings.language.sectionDesc")}
      className="overflow-visible"
    >
      <LanguagePicker />
    </SectionCard>
  );
}

function EquipeSection() {
  const { t } = useTranslation();
  const { data: membres, isLoading, isError, refetch } = useMembresEquipe();
  const list = Array.isArray(membres)
    ? membres
    : Array.isArray(membres?.membres)
      ? membres.membres
      : [];

  return (
    <SectionCard
      title={t("entrepriseSpace.settings.team.title")}
      description={t("entrepriseSpace.settings.team.description")}
    >
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-muted/70"
              aria-hidden
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Impossible de charger l&apos;équipe.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 rounded-lg"
            onClick={() => refetch()}
          >
            {t("entrepriseSpace.settings.retry")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("entrepriseSpace.settings.team.empty")}
        </p>
      )}

      {!isLoading && !isError && list.length > 0 && (
        <ul className="space-y-2">
          {list.slice(0, 8).map((m) => {
            const name =
              `${m.prenom || ""} ${m.nom || ""}`.trim() ||
              m.email ||
              t("entrepriseSpace.settings.team.member");
            const role = m.roleEquipe || m.role || m.statutMembre || "—";
            return (
              <li
                key={m.idMembre || m.idUtilisateur || name}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email || role}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {role}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-lg">
          <Link href="/equipe">
            {t("entrepriseSpace.settings.team.manage")}
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}

function DangerSection() {
  const { t } = useTranslation();
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
      /* ignore */
    } finally {
      clearSession();
      router.replace("/connexion");
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("entrepriseSpace.settings.danger.logoutTitle")}
        description={t("entrepriseSpace.settings.danger.logoutDesc")}
      >
        <SettingRow
          title={t("entrepriseSpace.settings.danger.logoutAction")}
          description={t("entrepriseSpace.settings.danger.logoutActionDesc")}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loggingOut}
            onClick={handleLogout}
            className="gap-1.5 rounded-lg"
          >
            <LogOut className="size-3.5" aria-hidden />
            {loggingOut ? t("entrepriseSpace.settings.danger.loggingOut") : t("entrepriseSpace.settings.danger.logoutAction")}
          </Button>
        </SettingRow>
      </SectionCard>

      <SectionCard
        title={t("entrepriseSpace.settings.danger.sensitiveTitle")}
        description={t("entrepriseSpace.settings.danger.deleteDesc")}
        danger
      >
        <p className="text-sm text-muted-foreground">
          {t("entrepriseSpace.settings.danger.deleteBody")}
        </p>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ParametresEntreprisePage() {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState("profil");
  const { data: profil, isLoading, isError, refetch } = useEntrepriseProfile();

  const sections = useMemo(() => getSections(t), [t, locale]);
  const groups = useMemo(() => groupSections(sections), [sections]);
  const activeMeta = sections.find((s) => s.id === active);

  const content = (() => {
    if (isLoading && active === "profil") return <SettingsSkeleton />;
    if (isError && active === "profil") {
      return (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            {t("entrepriseSpace.settings.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-lg"
            onClick={() => refetch()}
          >
            {t("entrepriseSpace.settings.retry")}
          </Button>
        </div>
      );
    }
    switch (active) {
      case "profil":
        return <ProfilSection profil={profil} user={user} />;
      case "securite":
        return <SecuriteSection user={user} />;
      case "notifications":
        return <NotificationsSection />;
      case "apparence":
        return <ApparenceSection />;
      case "langue":
        return <LangueSection />;
      case "equipe":
        return <EquipeSection />;
      case "danger":
        return <DangerSection />;
      default:
        return null;
    }
  })();

  return (
    <>
      <AppHeader
        title={t("entrepriseSpace.settings.title")}
        subtitle={t("entrepriseSpace.settings.subtitle")}
      />

      <div className="px-4 py-6 sm:px-6">
        {/* Mobile nav */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {getSections(t).map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Desktop sidebar */}
          <nav
            className="hidden lg:block"
            aria-label={t("entrepriseSpace.settings.navAria")}
          >
            <div className="sticky top-6 space-y-5">
              {groups.map((g) => (
                <div key={g.name}>
                  <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {g.name}
                  </p>
                  <ul className="space-y-0.5">
                    {g.items.map((s) => {
                      const Icon = s.icon;
                      const isActive = active === s.id;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setActive(s.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition",
                              isActive
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                            )}
                          >
                            <Icon className="size-4 shrink-0" aria-hidden />
                            <span className="truncate">{s.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="min-w-0">
            {activeMeta && (
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  {activeMeta.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeMeta.description}
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={
                  reduceMotion ? false : { opacity: 0, x: 6, y: 4 }
                }
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
