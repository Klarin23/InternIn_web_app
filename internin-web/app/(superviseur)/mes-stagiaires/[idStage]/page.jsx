"use client";

import { useSearchParams, usePathname, useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { FiLoader, FiFileText, FiEye, FiDownload } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import ProfilSectionCard from "@/components/features/profil/ProfilSectionCard";
import DetailStagiaireHeader from "@/components/features/detail-stagiaire/DetailStagiaireHeader";
import DetailStagiaireTabs from "@/components/features/detail-stagiaire/DetailStagiaireTabs";
import HistoriqueStage from "@/components/features/detail-stagiaire/HistoriqueStage";
import {
  useDetailStagiaire,
  useProgression,
  useJournalSuperviseur,
} from "@/lib/queries/useSuperviseur";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { openProtectedCv } from "@/lib/utils/openProtectedDocument";
import { toast } from "@/lib/store/useToastStore";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import CorrectionDatesAnomalie from "@/components/features/detail-stagiaire/CorrectionDatesAnomalie";

const MODE_TRAVAIL_KEYS = {
  presentiel: "mesStagiaires.detail.modeOnsite",
  distanciel: "mesStagiaires.detail.modeRemote",
  hybride: "mesStagiaires.detail.modeHybrid",
};

function formatDate(dateStr, locale = "fr") {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function ConventionStatutLigne({ label, valide, yesLabel, noLabel }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          valide
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {valide ? yesLabel : noLabel}
      </span>
    </div>
  );
}


function resolveSupervisionPaths(pathname) {
  const isEntreprisePath = pathname?.startsWith("/supervision/mes-stagiaires");
  const basePath = isEntreprisePath
    ? "/supervision/mes-stagiaires"
    : "/mes-stagiaires";
  const segments = (pathname || "").split("/").filter(Boolean);
  const idx = segments.indexOf("mes-stagiaires");
  const idStage = idx >= 0 ? segments[idx + 1] : undefined;
  return { basePath, idStage, isEntreprisePath };
}

function Section({ delay, children }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, delay: reduceMotion ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export default function DetailStagiairePage() {
  // Ordre des hooks FIXE — ne jamais appeler un hook après un return conditionnel
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const { isEntreprise } = useSupervisionContext();
  const { basePath, idStage: idFromPath } = resolveSupervisionPaths(pathname);
  const idStage = idFromPath || routeParams?.idStage;
  const showCorrectionDates =
    isEntreprise && searchParams?.get("anomalie") === "dates";
  const { data, isLoading, error, refetch } = useDetailStagiaire(idStage);
  const { data: progression } = useProgression(idStage);
  const { data: journal } = useJournalSuperviseur(idStage);

  if (isLoading) {
    return (
      <div className="space-y-4 px-6 py-6">
        <div className="h-40 animate-pulse rounded-2xl bg-muted/70" />
        <div className="h-10 animate-pulse rounded-xl bg-muted/50" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
          <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-semibold text-foreground">
          {t("mesStagiaires.detail.loadError")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || t("mesStagiaires.common.error")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-lg"
          onClick={() => refetch()}
        >
          {t("mesStagiaires.detail.retry")}
        </Button>
      </div>
    );
  }

  const {
    stagiaire,
    formation,
    universite,
    offre,
    convention,
    stage,
    historique,
  } = data;

  const objectifs = progression?.objectifs || [];
  const taches = progression?.taches || [];
  const stats = {
    progression:
      progression?.progressionManuelle ?? progression?.progressionCalculee,
    objectifsFaits: objectifs.filter((o) => o.statut === "realise").length,
    objectifsTotal: objectifs.length || null,
    tachesFaites: taches.filter((task) => task.statut === "terminee").length,
    tachesTotal: taches.length || null,
    journalCount: Array.isArray(journal) ? journal.length : null,
  };
  if (stats.objectifsTotal === 0) stats.objectifsTotal = null;
  if (stats.tachesTotal === 0) stats.tachesTotal = null;

  const formationLabel = [
    formation?.diplome,
    universite?.nomUniversite || formation?.nomUniversite,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("mesStagiaires.header.myInterns"), href: basePath },
          { label: `${stagiaire.prenom} ${stagiaire.nom}` },
        ]}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6">
        <DetailStagiaireHeader
          stagiaire={stagiaire}
          stage={stage}
          stats={stats}
          meta={{
            titrePoste: offre?.titre || stage?.titrePoste,
            ville: stagiaire.ville,
            formationLabel,
          }}
        />
        {showCorrectionDates && stage && (
          <div className="mb-4">
            <CorrectionDatesAnomalie
              idStage={idStage}
              dateDebut={stage.dateDebut}
              dateFinPrevue={stage.dateFinPrevue}
              onCorrected={() => refetch()}
            />
          </div>
        )}

        <DetailStagiaireTabs idStage={idStage} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Section delay={0.04}>
            <ProfilSectionCard title={t("mesStagiaires.detail.personalInfo")}>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.email")}</dt>
                  <dd className="text-right text-foreground">
                    {stagiaire.email || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.phone")}</dt>
                  <dd className="text-right text-foreground">
                    {stagiaire.telephone || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.city")}</dt>
                  <dd className="text-right text-foreground">
                    {stagiaire.ville || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.country")}</dt>
                  <dd className="text-right text-foreground">
                    {stagiaire.pays || "—"}
                  </dd>
                </div>
                {stagiaire.dateNaissance && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("mesStagiaires.detail.birthDate")}</dt>
                    <dd className="text-right text-foreground">
                      {formatDate(stagiaire.dateNaissance, locale)}
                    </dd>
                  </div>
                )}
              </dl>
            </ProfilSectionCard>
          </Section>

          <Section delay={0.08}>
            <ProfilSectionCard title={t("mesStagiaires.detail.education")}>
              {formation ? (
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("mesStagiaires.detail.degree")}</dt>
                    <dd className="text-right text-foreground">
                      {formation.diplome || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {t("mesStagiaires.detail.faculty")}
                    </dt>
                    <dd className="text-right text-foreground">
                      {formation.faculte || formation.departement || "—"}
                    </dd>
                  </div>
                  {formation.anneeEtude != null && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("mesStagiaires.detail.level")}</dt>
                      <dd className="text-right text-foreground">
                        {formation.anneeEtude}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("mesStagiaires.detail.institution")}</dt>
                    <dd className="text-right text-foreground">
                      {universite?.nomUniversite ||
                        formation.nomUniversite ||
                        "—"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("mesStagiaires.detail.noEducation")}
                </p>
              )}
            </ProfilSectionCard>
          </Section>

          <Section delay={0.12}>
            <ProfilSectionCard title={t("mesStagiaires.detail.offer")}>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.position")}</dt>
                  <dd className="text-right text-foreground">
                    {offre?.titre || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.workMode")}</dt>
                  <dd className="text-right text-foreground">
                    {(MODE_TRAVAIL_KEYS[offre?.modeTravail] ? t(MODE_TRAVAIL_KEYS[offre?.modeTravail]) : offre?.modeTravail) ||
                      "—"}
                  </dd>
                </div>
              </dl>
              {offre?.description && (
                <p className="mt-3 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                  {offre.description}
                </p>
              )}
            </ProfilSectionCard>
          </Section>

          <Section delay={0.16}>
            <ProfilSectionCard title={t("mesStagiaires.detail.dates")}>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.startDate")}</dt>
                  <dd className="text-right text-foreground">
                    {formatDate(stage.dateDebut, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("mesStagiaires.detail.endDatePlanned")}</dt>
                  <dd className="text-right text-foreground">
                    {formatDate(stage.dateFinPrevue, locale)}
                  </dd>
                </div>
                {stage.dateFinReelle && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("mesStagiaires.detail.endDateActual")}</dt>
                    <dd className="text-right text-foreground">
                      {formatDate(stage.dateFinReelle, locale)}
                    </dd>
                  </div>
                )}
              </dl>
            </ProfilSectionCard>
          </Section>

          <Section delay={0.2}>
            <ProfilSectionCard title={t("mesStagiaires.detail.objectivesTitle")}>
              <p className="text-sm text-foreground">
                {stage.objectifsApprentissage ||
                  t("mesStagiaires.detail.noObjectives")}
              </p>
            </ProfilSectionCard>
          </Section>

          <Section delay={0.24}>
            <ProfilSectionCard title={t("mesStagiaires.detail.convention")}>
              {convention ? (
                <div className="space-y-2.5">
                  <ConventionStatutLigne label={t("mesStagiaires.detail.acceptedByCompany")} valide={convention.accepteeParEntreprise} yesLabel={t("mesStagiaires.detail.yes")} noLabel={t("mesStagiaires.detail.no")} />
                  <ConventionStatutLigne label={t("mesStagiaires.detail.acceptedByIntern")} valide={convention.accepteeParStagiaire} yesLabel={t("mesStagiaires.detail.yes")} noLabel={t("mesStagiaires.detail.no")} />
                  <ConventionStatutLigne label={t("mesStagiaires.detail.validatedByUniversity")} valide={convention.valideeParUniversite} yesLabel={t("mesStagiaires.detail.yes")} noLabel={t("mesStagiaires.detail.no")} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("mesStagiaires.detail.noConvention")}
                </p>
              )}
            </ProfilSectionCard>
          </Section>

          {stagiaire.cvUrl && (
            <Section delay={0.28}>
              <ProfilSectionCard title={t("mesStagiaires.detail.documents")}>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FiFileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t("mesStagiaires.detail.cv")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("mesStagiaires.detail.cvDoc")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 rounded-lg text-xs"
                      onClick={async () => {
                        try {
                          await openProtectedCv(stagiaire.cvUrl);
                        } catch (err) {
                          toast.error(
                            err?.message || t("mesStagiaires.detail.openCvError"),
                          );
                        }
                      }}
                    >
                      <FiEye className="size-3.5" />
                      {t("mesStagiaires.detail.view")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 rounded-lg text-xs"
                      onClick={async () => {
                        try {
                          await openProtectedCv(stagiaire.cvUrl, {
                            download: true,
                          });
                        } catch (err) {
                          toast.error(
                            err?.message || t("mesStagiaires.detail.downloadError"),
                          );
                        }
                      }}
                    >
                      <FiDownload className="size-3.5" />
                      {t("mesStagiaires.detail.download")}
                    </Button>
                  </div>
                </div>
              </ProfilSectionCard>
            </Section>
          )}

          <Section delay={0.32}>
            <ProfilSectionCard title={t("mesStagiaires.detail.history")}>
              <HistoriqueStage historique={historique} />
            </ProfilSectionCard>
          </Section>
        </div>
      </div>
    </>
  );
}