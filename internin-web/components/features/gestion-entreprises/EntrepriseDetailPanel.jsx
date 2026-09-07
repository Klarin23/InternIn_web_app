"use client";

import { useState } from "react";
import {
  FiBriefcase,
  FiMail,
  FiMapPin,
  FiGlobe,
  FiLinkedin,
  FiUsers,
  FiFileText,
  FiLoader,
  FiCheck,
  FiExternalLink,
  FiCalendar,
  FiAlertTriangle,
  FiBriefcase as FiOffer,
  FiBookOpen,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentsEntreprise } from "@/lib/queries/useDocumentsEntreprise";
import {
  useEntrepriseAdminStats,
  useEntrepriseEquipe,
  useEntrepriseOffres,
  useEntrepriseStages,
  useEntreprisePartenariats,
  useEntrepriseSignalements,
  useEntrepriseJournal,
  useEntrepriseRiskScore,
} from "@/lib/queries/useEntrepriseAdminDetail";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { safeHref } from "@/lib/utils/urlValidation";

const TAILLE_LABEL_KEYS = {
  "1-10": "sizeLabel1_10",
  "11-50": "sizeLabel11_50",
  "51-200": "sizeLabel51_200",
  "201-500": "sizeLabel201_500",
  "500+": "sizeLabel500Plus",
};

const TYPE_DOCUMENT_LABEL_KEYS = {
  registre_commerce: "docTypeRegistreCommerce",
  certificat_constitution: "docTypeCertificatConstitution",
  justificatif_entreprise: "docTypeJustificatifEntreprise",
  autre: "docTypeAutre",
};

const ROLE_LABEL_KEYS = {
  administrateur_principal: "roleAdminPrincipal",
  gestionnaire_recrutement: "roleGestionnaireRecrutement",
  superviseur: "roleSuperviseur",
  lecture_seule: "roleLectureSeule",
};

const TAB_DEFS = [
  { id: "vue", labelKey: "tabOverview" },
  { id: "documents", labelKey: "tabDocuments" },
  { id: "equipe", labelKey: "tabTeam" },
  { id: "offres", labelKey: "tabOffers" },
  { id: "stages", labelKey: "tabInternships" },
  { id: "partenariats", labelKey: "tabPartnerships" },
  { id: "signalements", labelKey: "tabReports" },
  { id: "journal", labelKey: "tabHistory" },
];

function formatDate(date, t) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(t("adminEntreprises.localeDate"), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Champ({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}

function BlocTexte({ titre, texte }) {
  if (!texte) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-sm font-semibold text-foreground">{titre}</h4>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{texte}</p>
    </div>
  );
}

function EmptyTab({ message }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
  );
}

export default function EntrepriseDetailPanel({
  entreprise,
  badge,
  verifierMutation,
  statutMutation,
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("vue");
  const [confirmRejet, setConfirmRejet] = useState(false);
  const [motifRejet, setMotifRejet] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const TABS = TAB_DEFS.map((tb) => ({
    ...tb,
    label: t(`adminEntreprises.${tb.labelKey}`),
  }));

  const { data: stats, isLoading: loadingStats } = useEntrepriseAdminStats(
    entreprise.idEntreprise,
    true,
  );
  const { data: risk, isLoading: loadingRisk } = useEntrepriseRiskScore(
    entreprise.idEntreprise,
    true,
  );
  const { data: docs, isLoading: loadingDocs } = useDocumentsEntreprise(
    entreprise.idEntreprise,
  );
  const { data: equipe, isLoading: loadingEquipe } = useEntrepriseEquipe(
    entreprise.idEntreprise,
    tab === "equipe",
  );
  const { data: offres, isLoading: loadingOffres } = useEntrepriseOffres(
    entreprise.idEntreprise,
    tab === "offres",
  );
  const { data: stagesList, isLoading: loadingStages } = useEntrepriseStages(
    entreprise.idEntreprise,
    tab === "stages",
  );
  const { data: partenariats, isLoading: loadingPartenariats } =
    useEntreprisePartenariats(entreprise.idEntreprise, tab === "partenariats");
  const { data: signalements, isLoading: loadingSignalements } =
    useEntrepriseSignalements(entreprise.idEntreprise, tab === "signalements");
  const { data: journal, isLoading: loadingJournal } = useEntrepriseJournal(
    entreprise.idEntreprise,
    tab === "journal",
  );

  const isPending =
    (verifierMutation.isPending &&
      verifierMutation.variables?.id === entreprise.idEntreprise) ||
    (statutMutation.isPending &&
      statutMutation.variables?.id === entreprise.idEntreprise);

  return (
    <div className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {entreprise.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entreprise.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <FiBriefcase className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {entreprise.nomEntreprise}
                </h2>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    badge.className,
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {badge.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {[entreprise.secteurActivite, entreprise.ville, entreprise.pays]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {entreprise.statutCompte === "suspendu" ? (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  statutMutation.mutate({
                    id: entreprise.idEntreprise,
                    statutCompte: "actif",
                  })
                }
              >
                {isPending && <FiLoader className="h-4 w-4 animate-spin" />}
                {t("adminEntreprises.btnReactivate")}
              </Button>
            ) : (
              <>
                {/* Rejeter : possible si en attente OU déjà vérifiée (annulation d'une validation) */}
                {(entreprise.statutVerification === "en_attente" ||
                  entreprise.statutVerification === "verifiee") && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setMotifRejet("");
                      setConfirmRejet(true);
                    }}
                  >
                    {t("adminEntreprises.btnReject")}
                  </Button>
                )}
                {/* Vérifier : en attente ou précédemment rejetée */}
                {(entreprise.statutVerification === "en_attente" ||
                  entreprise.statutVerification === "rejetee") && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      verifierMutation.mutate({
                        id: entreprise.idEntreprise,
                        statutVerification: "verifiee",
                      })
                    }
                  >
                    {isPending ? (
                      <FiLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiCheck className="h-4 w-4" />
                    )}
                    {t("adminEntreprises.btnVerify")}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmSuspend(true)}
                >
                  {t("adminEntreprises.btnRestrict")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mini stats (lazy stats endpoint) */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(loadingStats
            ? Array.from({ length: 5 })
            : [
                { label: t("adminEntreprises.statOffers"), value: stats?.nbOffres ?? entreprise.nbOffres ?? 0 },
                { label: t("adminEntreprises.statInternships"), value: stats?.nbStages ?? entreprise.nbStages ?? 0 },
                { label: t("adminEntreprises.statMembers"), value: stats?.nbMembres ?? 0 },
                { label: t("adminEntreprises.statPartnerships"), value: stats?.nbPartenariats ?? 0 },
                { label: t("adminEntreprises.statReports"), value: stats?.nbSignalements ?? 0 },
              ]
          ).map((item, i) =>
            loadingStats ? (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ) : (
              <div
                key={item.label}
                className="rounded-lg bg-muted/40 px-2 py-2 text-center"
              >
                <p className="text-base font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 overflow-x-auto border-b border-border/60 px-3 pt-2"
        role="tablist"
      >
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              "shrink-0 rounded-t-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              tab === tb.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "vue" && (
          <div className="space-y-5">

            {/* Score de confiance — informatif uniquement */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("adminEntreprises.trustScoreTitle")}
                </p>
                {!loadingRisk && risk && (
                  <span className="text-xs font-bold text-foreground">
                    {risk.label}
                  </span>
                )}
              </div>
              {loadingRisk ? (
                <Skeleton className="h-3 w-full rounded-full" />
              ) : risk ? (
                <>
                  <div className="mb-1 flex items-end justify-between">
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {risk.score}
                      <span className="text-sm font-normal text-muted-foreground">
                        /100
                      </span>
                    </p>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        risk.score >= 80
                          ? "bg-emerald-500"
                          : risk.score >= 55
                            ? "bg-primary"
                            : risk.score >= 35
                              ? "bg-amber-500"
                              : "bg-destructive",
                      )}
                      style={{ width: `${risk.score}%` }}
                    />
                  </div>
                  <ul className="space-y-1">
                    {(risk.factors || []).slice(0, 6).map((f) => (
                      <li
                        key={f.code}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground">{f.label}</span>
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            f.type === "pos"
                              ? "text-emerald-600"
                              : f.type === "neg"
                                ? "text-destructive"
                                : "text-amber-600",
                          )}
                        >
                          {f.impact > 0 ? `+${f.impact}` : f.impact}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {t("adminEntreprises.trustScoreHint")}
                  </p>
                </>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Champ icon={FiMail} label={t("adminEntreprises.fieldAccountEmail")}>
                {entreprise.email}
              </Champ>
              <Champ icon={FiMapPin} label={t("adminEntreprises.fieldAddress")}>
                {[entreprise.adresse, entreprise.ville, entreprise.pays]
                  .filter(Boolean)
                  .join(", ")}
              </Champ>
              <Champ icon={FiUsers} label={t("adminEntreprises.fieldSize")}>
                {(TAILLE_LABEL_KEYS[entreprise.tailleEntreprise] &&
                  t(`adminEntreprises.${TAILLE_LABEL_KEYS[entreprise.tailleEntreprise]}`)) ||
                  entreprise.tailleEntreprise}
              </Champ>
              <Champ icon={FiCalendar} label={t("adminEntreprises.fieldJoined")}>
                {formatDate(entreprise.dateCreation, t)}
              </Champ>
              {entreprise.dateVerification && (
                <Champ icon={FiCheck} label={t("adminEntreprises.fieldVerifiedOn")}>
                  {formatDate(entreprise.dateVerification, t)}
                </Champ>
              )}
              {entreprise.siteWeb && safeHref(entreprise.siteWeb) && (
                <Champ icon={FiGlobe} label={t("adminEntreprises.fieldWebsite")}>
                  <a
                    href={safeHref(entreprise.siteWeb)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {entreprise.siteWeb.replace(/^https?:\/\//, "")}
                    <FiExternalLink className="h-3 w-3" />
                  </a>
                </Champ>
              )}
              {entreprise.linkedinUrl && safeHref(entreprise.linkedinUrl) && (
                <Champ icon={FiLinkedin} label={t("adminEntreprises.fieldLinkedin")}>
                  <a
                    href={safeHref(entreprise.linkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {t("adminEntreprises.linkedinProfile")}
                    <FiExternalLink className="h-3 w-3" />
                  </a>
                </Champ>
              )}
            </div>
            <BlocTexte titre={t("adminEntreprises.aboutTitle")} texte={entreprise.aPropos} />
            <BlocTexte titre={t("adminEntreprises.missionTitle")} texte={entreprise.mission} />
            <BlocTexte titre={t("adminEntreprises.cultureTitle")} texte={entreprise.cultureEntreprise} />
          </div>
        )}

        {tab === "documents" && (
          <div>
            {loadingDocs && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!loadingDocs && (!docs || docs.length === 0) && (
              <EmptyTab message={t("adminEntreprises.emptyDocuments")} />
            )}
            {!loadingDocs && docs?.length > 0 && (
              <ul className="space-y-2">
                {docs.map((doc) => (
                  <li
                    key={doc.idDocument}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FiFileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {doc.nomFichier ||
                            (TYPE_DOCUMENT_LABEL_KEYS[doc.typeDocument] &&
                              t(`adminEntreprises.${TYPE_DOCUMENT_LABEL_KEYS[doc.typeDocument]}`)) ||
                            t("adminEntreprises.docFallbackName")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(TYPE_DOCUMENT_LABEL_KEYS[doc.typeDocument] &&
                            t(`adminEntreprises.${TYPE_DOCUMENT_LABEL_KEYS[doc.typeDocument]}`)) ||
                            doc.typeDocument}{" "}
                          · {formatDate(doc.dateUpload, t)}
                        </p>
                      </div>
                    </div>
                    {doc.urlFichier && (
                      <a
                        href={doc.urlFichier}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-semibold text-primary hover:underline"
                      >
                        {t("adminEntreprises.viewLink")}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "equipe" && (
          <div>
            {loadingEquipe && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!loadingEquipe && (!equipe || equipe.length === 0) && (
              <EmptyTab message={t("adminEntreprises.emptyTeam")} />
            )}
            {!loadingEquipe && equipe?.length > 0 && (
              <ul className="space-y-2">
                {equipe.map((m) => (
                  <li
                    key={m.idMembre}
                    className="rounded-lg border border-border/60 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {m.nom}
                          {m.estAdminPrincipal && (
                            <span className="ml-2 text-[10px] font-bold text-primary">
                              {t("adminEntreprises.principalBadge")}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {(ROLE_LABEL_KEYS[m.roleEquipe] &&
                          t(`adminEntreprises.${ROLE_LABEL_KEYS[m.roleEquipe]}`)) ||
                          m.roleEquipe}{" "}
                        · {m.statutMembre}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "offres" && (
          <div>
            {loadingOffres && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!loadingOffres && (!offres || offres.length === 0) && (
              <EmptyTab message={t("adminEntreprises.emptyOffers")} />
            )}
            {!loadingOffres && offres?.length > 0 && (
              <ul className="space-y-2">
                {offres.map((o) => (
                  <li
                    key={o.idOffre}
                    className="rounded-lg border border-border/60 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {o.titre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[o.secteurActivite, o.departement]
                            .filter(Boolean)
                            .join(" · ")}
                          {o.datePublication
                            ? ` · ${t("adminEntreprises.publishedOn", { date: formatDate(o.datePublication, t) })}`
                            : ` · ${t("adminEntreprises.createdOn", { date: formatDate(o.dateCreation, t) })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t(
                            (o.nbCandidatures ?? 0) > 1
                              ? "adminEntreprises.applicationPlural"
                              : "adminEntreprises.applicationSingular",
                            { n: o.nbCandidatures ?? 0 },
                          )}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                          {o.statut}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "stages" && (
          <div>
            {loadingStages && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!loadingStages && (!stagesList || stagesList.length === 0) && (
              <EmptyTab message={t("adminEntreprises.emptyInternships")} />
            )}
            {!loadingStages && stagesList?.length > 0 && (
              <ul className="space-y-2">
                {stagesList.map((s) => (
                  <li
                    key={s.idStage}
                    className="rounded-lg border border-border/60 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {s.prenomStagiaire} {s.nomStagiaire}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.dateDebut, t)} → {formatDate(s.dateFinPrevue, t)}
                          {s.nomSuperviseur
                            ? ` · ${t("adminEntreprises.supervisorAbbrev", { name: s.nomSuperviseur })}`
                            : ""}
                          {s.nomUniversite ? ` · ${s.nomUniversite}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                        {s.statut}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "partenariats" && (
          <div>
            {loadingPartenariats && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!loadingPartenariats &&
              (!partenariats || partenariats.length === 0) && (
                <EmptyTab message={t("adminEntreprises.emptyPartnerships")} />
              )}
            {!loadingPartenariats && partenariats?.length > 0 && (
              <ul className="space-y-2">
                {partenariats.map((p) => (
                  <li
                    key={p.idPartenariat}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {p.nomUniversite}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[p.pays, formatDate(p.dateEnvoi, t)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                      {p.statut}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "signalements" && (
          <div>
            {loadingSignalements && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!loadingSignalements &&
              (!signalements || signalements.length === 0) && (
                <EmptyTab message={t("adminEntreprises.emptyReports")} />
              )}
            {!loadingSignalements && signalements?.length > 0 && (
              <ul className="space-y-2">
                {signalements.map((s) => (
                  <li
                    key={s.idLitige}
                    className="rounded-lg border border-border/60 px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {s.typeLitige || t("adminEntreprises.reportFallback")}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {s.description}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDate(s.dateCreation, t)}
                          {s.prenomStagiaire
                            ? ` · ${s.prenomStagiaire} ${s.nomStagiaire || ""}`
                            : ""}
                          {" · "}
                          <span className="font-semibold capitalize">{s.statut}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Dialog open={confirmRejet} onOpenChange={setConfirmRejet}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {entreprise.statutVerification === "verifiee"
                ? t("adminEntreprises.rejectDialogTitleRemove")
                : t("adminEntreprises.rejectDialogTitleReject")}
            </DialogTitle>
            <DialogDescription>
              {t("adminEntreprises.rejectDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label htmlFor="motif-rejet" className="text-sm font-medium">
              {t("adminEntreprises.rejectMotifLabel")}{" "}
              <span className="text-destructive">*</span>
            </label>
            <textarea
              id="motif-rejet"
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder={t("adminEntreprises.rejectMotifPlaceholder")}
            />
            {motifRejet.trim().length > 0 && motifRejet.trim().length < 5 && (
              <p className="text-xs text-destructive">
                {t("adminEntreprises.minChars")}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRejet(false)}
              disabled={isPending}
            >
              {t("adminEntreprises.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || motifRejet.trim().length < 5}
              onClick={() =>
                verifierMutation.mutate(
                  {
                    id: entreprise.idEntreprise,
                    statutVerification: "rejetee",
                    motif: motifRejet.trim(),
                  },
                  { onSettled: () => setConfirmRejet(false) },
                )
              }
            >
              {isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
              {t("adminEntreprises.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("adminEntreprises.suspendDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminEntreprises.suspendDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmSuspend(false)}
              disabled={isPending}
            >
              {t("adminEntreprises.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                statutMutation.mutate(
                  {
                    id: entreprise.idEntreprise,
                    statutCompte: "suspendu",
                  },
                  { onSettled: () => setConfirmSuspend(false) },
                )
              }
            >
              {isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
              {t("adminEntreprises.confirmRestrict")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
