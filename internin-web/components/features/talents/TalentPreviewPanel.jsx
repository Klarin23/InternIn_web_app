"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, GraduationCap } from "lucide-react";
import { TalentCvCard } from "./TalentCvActions";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  getInitials,
  localization,
  DISPONIBILITE_LABELS,
  formatFormation,
} from "./talentUtils";
import { cn } from "@/lib/utils";
import { canProposeToTalent } from "./TalentCard";

export default function TalentPreviewPanel({
  talent,
  open,
  onClose,
  onPropose,
  canPropose = true,
}) {
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
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const profile = detail || talent;
  const loc = localization(profile);
  const score =
    typeof profile?.scoreCompletudeProfil === "number"
      ? profile.scoreCompletudeProfil
      : null;
  const competences = Array.isArray(profile?.competences)
    ? profile.competences
    : Array.isArray(talent?.competences)
      ? talent.competences
      : [];
  const formations = Array.isArray(profile?.formations)
    ? profile.formations
    : profile?.formation
      ? [profile.formation]
      : [];
  const dispo = DISPONIBILITE_LABELS[profile?.statutStage];

  return (
    <SidePanel open={open} onClose={onClose} title={t("talents.preview.title")}>
      {!talent ? null : isLoading && !detail ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
              {profile.photoProfilUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoProfilUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">
                  {getInitials(profile.prenom, profile.nom)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">
                {profile.prenom} {profile.nom}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile.titreProfessionnel || t("talents.preview.student")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {dispo && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      dispo.className,
                    )}
                  >
                    {dispo.labelKey ? t(dispo.labelKey) : dispo.label}
                  </span>
                )}
                {loc && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden />
                    {loc}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.presentation && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("talents.preview.about")}</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {profile.presentation}
              </p>
            </div>
          )}

          {formations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("talents.preview.education")}
              </h3>
              <ul className="mt-2 space-y-2">
                {formations.map((f, i) => {
                  const fmt = formatFormation(f);
                  return (
                    <li
                      key={f.idFormation || i}
                      className="flex gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <GraduationCap
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {fmt?.title || t("talents.preview.education")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[fmt?.school, fmt?.level].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {competences.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("talents.preview.skills")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {competences.map((c) => (
                  <span
                    key={c.idCompetence || c.nom}
                    className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    {c.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {score != null && (
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("talents.preview.completeness")}
                </span>
                <span className="font-semibold tabular-nums">{score} %</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            </div>
          )}

          <TalentCvCard cvUrl={profile.cvUrl} idStagiaire={profile.idStagiaire || id} />

          <Button
            type="button"
            className="w-full rounded-lg"
            disabled={!canPropose || !canProposeToTalent(profile)}
            title={
              !canPropose
                ? t("talents.preview.noPermission")
                : canProposeToTalent(profile)
                  ? undefined
                  : t("talents.preview.inInternshipHint")
            }
            onClick={() => {
              if (!canPropose || !canProposeToTalent(profile)) return;
              onPropose?.(profile);
              onClose?.();
            }}
          >
            {!canPropose
              ? t("talents.preview.permissionDenied")
              : canProposeToTalent(profile)
                ? t("talents.preview.propose")
                : t("talents.preview.proposeUnavailable")}
          </Button>
        </div>
      )}
    </SidePanel>
  );
}
