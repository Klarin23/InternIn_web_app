"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BriefcaseBusiness,
  ExternalLink,
  GraduationCap,
  Languages,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getInitials, localization, DISPONIBILITE_LABELS, formatFormation } from "./talentUtils";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/utils/urlValidation";
import { canProposeToTalent } from "./TalentCard";

function ProfileSection({ icon: Icon, title, count, children, empty }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {count != null && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="p-4">{empty ? <p className="text-sm text-muted-foreground">{empty}</p> : children}</div>
    </section>
  );
}

export default function TalentPreviewPanel({ talent, open, onClose, onPropose, canPropose = true }) {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const id = talent?.idStagiaire;

  const { data: detail, isLoading } = useQuery({
    queryKey: ["talent-detail", id],
    queryFn: () => apiFetch(`/propositions/talents/${id}`, { token }),
    enabled: !!token && !!id && open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const profile = detail || talent;
  if (!talent) return null;

  const loc = localization(profile);
  const dispo = DISPONIBILITE_LABELS[profile?.statutStage];
  const score = typeof profile?.scoreCompletudeProfil === "number"
    ? Math.min(100, Math.max(0, profile.scoreCompletudeProfil))
    : null;
  const competences = Array.isArray(profile?.competences) ? profile.competences : [];
  const formations = Array.isArray(profile?.formations)
    ? profile.formations
    : profile?.formation ? [profile.formation] : [];
  const experiences = Array.isArray(profile?.experiencesProfessionnelles) ? profile.experiencesProfessionnelles : [];
  const qualites = Array.isArray(profile?.qualites) ? profile.qualites : [];
  const langues = Array.isArray(profile?.langues) ? profile.langues : [];

  const empty = (key) => t(`talents.preview.empty.${key}`);
  const level = (value) => value ? t(`stagiaireSpace.profile.levels.${value}`) || value : null;

  return (
    <SidePanel open={open} onClose={onClose} title={t("talents.preview.title")}>
      {isLoading && !detail ? (
        <div className="space-y-4">
          <div className="flex gap-3"><Skeleton className="size-16 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-32" /></div></div>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-4">
            <div className="flex items-start gap-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60">
                {profile.photoProfilUrl ? <img src={profile.photoProfilUrl} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">{getInitials(profile.prenom, profile.nom)}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">{profile.prenom} {profile.nom}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{profile.titreProfessionnel || t("talents.preview.student")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {dispo && <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", dispo.className)}>{dispo.labelKey ? t(dispo.labelKey) : dispo.label}</span>}
                  {loc && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{loc}</span>}
                </div>
              </div>
            </div>
            {profile.presentation && <p className="mt-4 border-t border-border/50 pt-3 text-sm leading-relaxed text-muted-foreground">{profile.presentation}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <UserRound className="size-4 text-primary" aria-hidden />
              <div><h3 className="text-sm font-semibold">{t("talents.preview.professionalSnapshot")}</h3><p className="text-xs text-muted-foreground">{t("talents.preview.professionalSnapshotHint")}</p></div>
            </div>

            <ProfileSection icon={Award} title={t("talents.preview.skills")} count={competences.length} empty={competences.length ? null : empty("skills")}>
              <div className="flex flex-wrap gap-2">{competences.map((c) => <span key={c.idCompetence || c.nom} className="rounded-lg bg-primary/8 px-2.5 py-1.5 text-xs font-medium text-foreground">{c.nom}</span>)}</div>
            </ProfileSection>

            <ProfileSection icon={GraduationCap} title={t("talents.preview.education")} count={formations.length} empty={formations.length ? null : empty("education")}>
              <div className="space-y-3">{formations.map((f, i) => { const fmt = formatFormation(f); return <div key={f.idFormation || i} className="relative pl-5"><span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" /><p className="text-sm font-semibold">{fmt?.title || t("talents.preview.education")}</p><p className="mt-0.5 text-xs text-muted-foreground">{[fmt?.school, fmt?.level].filter(Boolean).join(" · ")}</p>{f.departement && <p className="mt-1 text-xs text-muted-foreground">{f.departement}</p>}</div>; })}</div>
            </ProfileSection>

            <ProfileSection icon={Sparkles} title={t("talents.preview.qualities")} count={qualites.length} empty={qualites.length ? null : empty("qualities")}>
              <div className="flex flex-wrap gap-2">{qualites.map((q, i) => <span key={`${q}-${i}`} className="rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-xs font-medium">{q}</span>)}</div>
            </ProfileSection>

            <ProfileSection icon={BriefcaseBusiness} title={t("talents.preview.experience")} count={experiences.length} empty={experiences.length ? null : empty("experience")}>
              <div className="space-y-4">{experiences.map((e, i) => <div key={`${e.poste}-${i}`} className="border-l-2 border-primary/20 pl-3"><p className="text-sm font-semibold">{e.poste}</p>{e.entreprise && <p className="text-xs font-medium text-muted-foreground">{e.entreprise}</p>} {(e.dateDebut || e.dateFin || e.enCours) && <p className="mt-1 text-[11px] text-muted-foreground">{[e.dateDebut, e.enCours ? t("talents.preview.current") : e.dateFin].filter(Boolean).join(" → ")}</p>}{e.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{e.description}</p>}</div>)}</div>
            </ProfileSection>

            <ProfileSection icon={Languages} title={t("talents.preview.languages")} count={langues.length} empty={langues.length ? null : empty("languages")}>
              <div className="flex flex-wrap gap-2">{langues.map((l, i) => <span key={`${l.nom}-${i}`} className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium">{l.nom}{level(l.niveau) ? ` · ${level(l.niveau)}` : ""}</span>)}</div>
            </ProfileSection>

            {profile.objectifProfessionnel && <ProfileSection icon={UserRound} title={t("talents.preview.objective")}><p className="text-sm leading-relaxed text-muted-foreground">{profile.objectifProfessionnel}</p></ProfileSection>}

            {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl || profile.behanceUrl || profile.siteWebUrl) && (
              <ProfileSection icon={ExternalLink} title={t("talents.preview.links")}>
                <div className="flex flex-wrap gap-2">{[["LinkedIn", profile.linkedinUrl], ["GitHub", profile.githubUrl], ["Portfolio", profile.portfolioUrl], ["Behance", profile.behanceUrl], [t("talents.preview.website"), profile.siteWebUrl]].filter(([, url]) => safeHref(url)).map(([label, url]) => <a key={label} href={safeHref(url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted"><ExternalLink className="size-3" />{label}</a>)}</div>
              </ProfileSection>
            )}
          </div>

          {score != null && <div className="rounded-2xl border border-border/70 bg-card p-4"><div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{t("talents.preview.completeness")}</span><span className="font-semibold tabular-nums">{score} %</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} /></div></div>}

          <Button type="button" className="w-full rounded-xl" disabled={!canPropose || !canProposeToTalent(profile)} title={!canPropose ? t("talents.preview.noPermission") : canProposeToTalent(profile) ? undefined : t("talents.preview.inInternshipHint")} onClick={() => { if (!canPropose || !canProposeToTalent(profile)) return; onPropose?.(profile); onClose?.(); }}>
            {!canPropose ? t("talents.preview.permissionDenied") : canProposeToTalent(profile) ? t("talents.preview.propose") : t("talents.preview.proposeUnavailable")}
          </Button>
        </div>
      )}
    </SidePanel>
  );
}
