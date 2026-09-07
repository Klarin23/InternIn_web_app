"use client";

import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiLoader,
  FiCheck,
  FiFileText,
  FiBriefcase,
  FiAlertTriangle,
  FiMonitor,
  FiMapPin,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useUtilisateurAdminDetail,
  useUtilisateurDocuments,
  useUtilisateurCandidatures,
  useUtilisateurStages,
  useUtilisateurSignalements,
  useUtilisateurSessions,
} from "@/lib/queries/useUtilisateursAdmin";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

const LOCALES_INTL = { fr: "fr-FR", en: "en-US" };

function formatDate(date, locale = "fr-FR") {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date, locale = "fr-FR") {
  if (!date) return "—";
  return new Date(date).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UtilisateurDetailPanel({
  utilisateur,
  statutMutation,
}) {
  const { t, locale } = useTranslation();
  const intlLocale = LOCALES_INTL[locale] || "fr-FR";
  const [tab, setTab] = useState("vue");
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const id = utilisateur.idUtilisateur;
  const role = utilisateur.role;

  const ROLE_LABEL = {
    stagiaire: t("peopleCenter.roleIntern"),
    entreprise: t("peopleCenter.roleCompany"),
    universite: t("peopleCenter.roleUniversity"),
  };

  const TABS_BASE = [
    { id: "vue", label: t("userDetailPanel.tabOverview") },
    { id: "documents", label: t("userDetailPanel.tabDocuments") },
    { id: "sessions", label: t("userDetailPanel.tabSessions") },
    { id: "signalements", label: t("userDetailPanel.tabReports") },
  ];

  const tabs = [
    ...TABS_BASE.slice(0, 1),
    ...(role === "stagiaire"
      ? [
          { id: "candidatures", label: t("userDetailPanel.tabApplications") },
          { id: "stages", label: t("userDetailPanel.tabInternships") },
        ]
      : role === "entreprise"
        ? [{ id: "stages", label: t("userDetailPanel.tabInternships") }]
        : []),
    ...TABS_BASE.slice(1),
  ];

  const { data: detail, isLoading: loadingDetail } = useUtilisateurAdminDetail(
    id,
    true,
  );
  const { data: docs, isLoading: loadingDocs } = useUtilisateurDocuments(
    id,
    tab === "documents",
  );
  const { data: candidatures, isLoading: loadingCand } =
    useUtilisateurCandidatures(id, tab === "candidatures");
  const { data: stagesList, isLoading: loadingStages } = useUtilisateurStages(
    id,
    tab === "stages",
  );
  const { data: signalements, isLoading: loadingSig } =
    useUtilisateurSignalements(id, tab === "signalements");
  const { data: sessions, isLoading: loadingSessions } = useUtilisateurSessions(
    id,
    tab === "sessions",
  );

  const isPending =
    statutMutation.isPending && statutMutation.variables?.id === id;

  const statut = detail?.statutCompte || utilisateur.statutCompte;
  const emailVerifie =
    detail?.emailVerifie ?? utilisateur.emailVerifie;

  return (
    <div className="flex min-h-[480px] flex-col overflow-hidden bg-transparent">
      <div className="border-b border-[#E5E7EB] px-5 py-4 dark:border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiUser className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {utilisateur.nom}
                </h2>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    statut === "suspendu"
                      ? "bg-muted text-muted-foreground"
                      : statut === "actif"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-700",
                  )}
                >
                  {statut}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {utilisateur.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABEL[role] || role}
                {utilisateur.organisation && utilisateur.organisation !== "—"
                  ? ` · ${utilisateur.organisation}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {statut === "suspendu" ? (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  statutMutation.mutate({ id, statutCompte: "actif" })
                }
              >
                {isPending && <FiLoader className="h-4 w-4 animate-spin" />}
                {t("peopleCenter.actionActivate")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-destructive/30 text-destructive"
                disabled={isPending}
                onClick={() => setConfirmSuspend(true)}
              >
                {t("peopleCenter.actionSuspend")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 pt-2" role="tablist">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            role="tab"
            aria-selected={tab === tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={cn(
              "shrink-0 rounded-t-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              tab === tabItem.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "vue" && (
          <div className="space-y-4">
            {loadingDetail ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Info
                    label={t("userDetailPanel.emailVerified")}
                    value={
                      emailVerifie
                        ? t("userDetailPanel.yes")
                        : t("userDetailPanel.no")
                    }
                  />
                  <Info
                    label={t("userDetailPanel.signupDate")}
                    value={formatDate(
                      detail?.dateCreation || utilisateur.dateCreation,
                      intlLocale,
                    )}
                  />
                  <Info
                    label={t("userDetailPanel.lastLogin")}
                    value={formatDateTime(
                      detail?.derniereConnexion || utilisateur.derniereConnexion,
                      intlLocale,
                    )}
                  />
                </div>
                {detail?.stats && Object.keys(detail.stats).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-3">
                    {detail.stats.nbCandidatures != null && (
                      <Stat
                        label={t("userDetailPanel.tabApplications")}
                        value={detail.stats.nbCandidatures}
                      />
                    )}
                    {detail.stats.nbStages != null && (
                      <Stat
                        label={t("userDetailPanel.tabInternships")}
                        value={detail.stats.nbStages}
                      />
                    )}
                    {detail.stats.scoreCompletude != null && (
                      <Stat
                        label={t("userDetailPanel.statProfile")}
                        value={`${detail.stats.scoreCompletude}%`}
                      />
                    )}
                    {detail.stats.nbOffres != null && (
                      <Stat
                        label={t("userDetailPanel.statOffers")}
                        value={detail.stats.nbOffres}
                      />
                    )}
                  </div>
                )}
                {detail?.profil && (
                  <div className="space-y-2 text-sm">
                    {detail.profil.telephone && (
                      <p className="text-muted-foreground">
                        {t("userDetailPanel.phone")}{" "}
                        <span className="font-medium text-foreground">
                          {detail.profil.telephone}
                        </span>
                      </p>
                    )}
                    {(detail.profil.ville || detail.profil.pays) && (
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <FiMapPin className="h-3.5 w-3.5" />
                        {[detail.profil.ville, detail.profil.pays]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {detail.profil.nomUniversite && (
                      <p className="text-muted-foreground">
                        {t("userDetailPanel.universityLabel")}{" "}
                        <span className="font-medium text-foreground">
                          {detail.profil.nomUniversite}
                        </span>
                      </p>
                    )}
                    {detail.profil.nomEntreprise && (
                      <p className="text-muted-foreground">
                        {t("userDetailPanel.companyLabel")}{" "}
                        <span className="font-medium text-foreground">
                          {detail.profil.nomEntreprise}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "documents" && (
          <TabList
            loading={loadingDocs}
            empty={t("userDetailPanel.noDocuments")}
            items={docs}
            render={(d) => (
              <li
                key={d.idDocument}
                className="flex justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">
                  {d.nomFichier || d.typeDocument}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(d.dateUpload, intlLocale)}
                </span>
              </li>
            )}
          />
        )}

        {tab === "candidatures" && (
          <TabList
            loading={loadingCand}
            empty={t("userDetailPanel.noApplications")}
            items={candidatures}
            render={(c) => (
              <li
                key={c.idCandidature}
                className="rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <p className="font-semibold">{c.titreOffre}</p>
                <p className="text-xs text-muted-foreground">
                  {c.nomEntreprise} · {c.statut} ·{" "}
                  {formatDate(c.dateCandidature, intlLocale)}
                </p>
              </li>
            )}
          />
        )}

        {tab === "stages" && (
          <TabList
            loading={loadingStages}
            empty={t("userDetailPanel.noInternships")}
            items={stagesList}
            render={(s) => (
              <li
                key={s.idStage}
                className="rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <p className="font-semibold">
                  {s.nomEntreprise ||
                    (s.prenom
                      ? `${s.prenom} ${s.nom}`
                      : t("userDetailPanel.internshipFallback"))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.statut} · {formatDate(s.dateDebut, intlLocale)} →{" "}
                  {formatDate(s.dateFinPrevue, intlLocale)}
                </p>
              </li>
            )}
          />
        )}

        {tab === "sessions" && (
          <TabList
            loading={loadingSessions}
            empty={t("userDetailPanel.noSessions")}
            items={sessions}
            render={(s) => (
              <li
                key={s.idSession}
                className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <FiMonitor className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {s.adresseIp || t("userDetailPanel.unknownIp")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("userDetailPanel.sessionCreated")}{" "}
                    {formatDateTime(s.dateCreation, intlLocale)} ·{" "}
                    {t("userDetailPanel.sessionExpires")}{" "}
                    {formatDateTime(s.dateExpiration, intlLocale)}
                  </p>
                </div>
              </li>
            )}
          />
        )}

        {tab === "signalements" && (
          <TabList
            loading={loadingSig}
            empty={t("userDetailPanel.noReports")}
            items={signalements}
            render={(s) => (
              <li
                key={s.idLitige}
                className="rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <p className="flex items-center gap-1 font-semibold">
                  <FiAlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  {s.typeLitige || t("userDetailPanel.reportFallback")}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {s.description}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(s.dateCreation, intlLocale)} · {s.statut}
                </p>
              </li>
            )}
          />
        )}
      </div>

      <Dialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("userDetailPanel.suspendDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("userDetailPanel.suspendDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmSuspend(false)}
            >
              {t("userDetailPanel.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                statutMutation.mutate(
                  { id, statutCompte: "suspendu" },
                  { onSettled: () => setConfirmSuspend(false) },
                )
              }
            >
              {t("peopleCenter.actionSuspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-border/50 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function TabList({ loading, empty, items, render }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (!items?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
    );
  }
  return <ul className="space-y-2">{items.map(render)}</ul>;
}
