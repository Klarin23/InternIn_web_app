"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiCalendar,
  FiMoreVertical,
  FiEdit2,
  FiCopy,
  FiPauseCircle,
  FiPlayCircle,
  FiXCircle,
  FiDownload,
  FiTrash2,
  FiLoader,
  FiUsers,
  FiArrowRight,
  FiEye,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "@/lib/store/useToastStore";
import { exporterCandidaturesCsv } from "@/lib/utils/exportCsv";
import CandidatsRecentsAvatars from "./CandidatsRecentsAvatars";
import {
  useUpdateOffre,
  useDeleteOffre,
  useDupliquerOffre,
} from "@/lib/queries/useCreateOffre";
import OffreBadgesInfo from "./OffreBadgesInfo";

const STATUT_LABELS_KEYS = {
  brouillon: "entrepriseSpace.offers.statusDraft",
  publie: "entrepriseSpace.offers.statusActive",
  expire: "entrepriseSpace.offers.statusExpired",
  ferme: "entrepriseSpace.offers.statusClosed",
  archive: "entrepriseSpace.offers.statusArchived",
  pause: "entrepriseSpace.offers.statusPaused",
};

const STATUT_COLORS = {
  brouillon: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  publie: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  pause: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  ferme: "bg-destructive/10 text-destructive border-destructive/20",
  archive: "bg-muted text-muted-foreground border-border",
  expire: "bg-destructive/10 text-destructive border-destructive/20",
};

const MODE_LABELS_KEYS = {
  distance: "entrepriseSpace.offers.modeRemote",
  hybride: "entrepriseSpace.offers.modeHybrid",
  presentiel: "entrepriseSpace.offers.modePresentiel",
};

const DUREE_LABELS_KEYS = {
  "1_mois": "entrepriseSpace.offers.duration1",
  "2_mois": "entrepriseSpace.offers.duration2",
  "3_mois": "entrepriseSpace.offers.duration3",
};

function estExpiree(offre) {
  return (
    offre.statut === "publie" &&
    offre.dateLimiteCandidature &&
    new Date(offre.dateLimiteCandidature) < new Date()
  );
}

function formatDate(date, locale = "fr-FR") {
  if (!date) return null;
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function MenuItem({ icon: Icon, label, onClick, disabled, danger, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {loading ? (
        <FiLoader className="h-3.5 w-3.5 animate-spin shrink-0" />
      ) : (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      )}
      {label}
    </button>
  );
}

export default function OffreCardEntreprise({
  offre,
  candidatsRecents = [],
  seuilPopulaire = 10,
  onEdit,
}) {
  const { t, locale } = useTranslation();
  const labels = Object.fromEntries(
    Object.entries(STATUT_LABELS_KEYS).map(([k, v]) => [k, t(v)]),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const updateMutation = useUpdateOffre();
  const deleteMutation = useDeleteOffre();
  const dupliquerMutation = useDupliquerOffre();

  const expiree = estExpiree(offre);
  const statutAffiche = expiree ? "expire" : offre.statut;
  const statusLabels = {
    ...labels,
    expire: t("entrepriseSpace.offers.statusExpired"),
  };
  const peutSupprimer = offre.nombreCandidatures === 0;

  const progression =
    offre.nombrePostes > 0
      ? Math.min(
          100,
          Math.round((offre.nombreAcceptes / offre.nombrePostes) * 100),
        )
      : 0;

  function changerStatut(statut) {
    updateMutation.mutate({ id: offre.idOffre, payload: { statut } });
    setMenuOpen(false);
  }

  function handleDupliquer() {
    dupliquerMutation.mutate(offre.idOffre, {
      onSuccess: () =>
        toast.success(t("entrepriseSpace.offers.duplicatedDraft")),
    });
    setMenuOpen(false);
  }

  function handleExporter() {
    if (candidatsRecents.length === 0) {
      toast.info(t("entrepriseSpace.offers.noApplicationsExport"));
    } else {
      exporterCandidaturesCsv(offre, candidatsRecents);
    }
    setMenuOpen(false);
  }

  function handleSupprimer() {
    if (
      confirm(
        t("entrepriseSpace.offers.confirmDelete", {
          title: offre.titre,
        }),
      )
    ) {
      deleteMutation.mutate(offre.idOffre);
    }
    setMenuOpen(false);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Badges intelligents */}
      <div className="px-5 pt-4">
        <OffreBadgesInfo offre={offre} seuilPopulaire={seuilPopulaire} />
      </div>

      {/* Header : logo + statut + menu */}
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
        {offre.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offre.logoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FiBriefcase className="h-4.5 w-4.5" />
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUT_COLORS[statutAffiche] || STATUT_COLORS.archive}`}
          >
            {statusLabels[statutAffiche]}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("entrepriseSpace.offers.actionsMenu")}
            >
              <FiMoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
                  <MenuItem
                    icon={FiEdit2}
                    label={t("entrepriseSpace.offers.edit")}
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(offre.idOffre);
                    }}
                  />
                  <MenuItem
                    icon={FiCopy}
                    label={t("entrepriseSpace.offers.duplicate")}
                    onClick={handleDupliquer}
                    loading={dupliquerMutation.isPending}
                  />
                  {offre.statut === "publie" && (
                    <MenuItem
                      icon={FiPauseCircle}
                      label={t("entrepriseSpace.offers.pause")}
                      onClick={() => changerStatut("pause")}
                      loading={updateMutation.isPending}
                    />
                  )}
                  {offre.statut === "pause" && (
                    <MenuItem
                      icon={FiPlayCircle}
                      label={t("entrepriseSpace.offers.resume")}
                      onClick={() => changerStatut("publie")}
                      loading={updateMutation.isPending}
                    />
                  )}
                  {(offre.statut === "publie" || offre.statut === "pause") && (
                    <MenuItem
                      icon={FiXCircle}
                      label={t("entrepriseSpace.offers.close")}
                      onClick={() => changerStatut("ferme")}
                      loading={updateMutation.isPending}
                    />
                  )}
                  <MenuItem
                    icon={FiDownload}
                    label={t("entrepriseSpace.offers.exportApplications")}
                    onClick={handleExporter}
                  />
                  <div className="my-1 border-t border-border" />
                  <MenuItem
                    icon={FiTrash2}
                    label={
                      peutSupprimer
                        ? t("entrepriseSpace.offers.delete")
                        : t("entrepriseSpace.offers.cannotDeleteHasApps")
                    }
                    onClick={handleSupprimer}
                    disabled={!peutSupprimer}
                    loading={deleteMutation.isPending}
                    danger
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Identité de l'offre */}
      <div className="px-5">
        <h3 className="text-base font-semibold leading-snug text-foreground line-clamp-2">
          {offre.titre}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {offre.departement || offre.secteurActivite || "—"}
        </p>
      </div>

      {/* Métadonnées essentielles */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 px-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          <span className="truncate">
            {offre.ville || t("entrepriseSpace.offers.notSpecified")}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <FiBriefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
          <span className="truncate">
            {t(MODE_LABELS_KEYS[offre.modeTravail]) || offre.modeTravail || "—"}
          </span>
        </span>
        {offre.dureeStage && (
          <span className="flex items-center gap-1.5">
            <FiClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
            <span className="truncate">
              {t(DUREE_LABELS_KEYS[offre.dureeStage]) || offre.dureeStage}
            </span>
          </span>
        )}
        {offre.dateLimiteCandidature && (
          <span
            className={`flex items-center gap-1.5 ${expiree ? "font-medium text-destructive" : ""}`}
          >
            <FiCalendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatDate(offre.dateLimiteCandidature, locale === "en" ? "en-GB" : "fr-FR")}
            </span>
          </span>
        )}
      </div>

      {/* Performance du recrutement */}
      <div className="mx-5 mt-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("entrepriseSpace.offers.performanceTitle")}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold tabular-nums text-foreground">
              {offre.nombreCandidatures ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("entrepriseSpace.offers.applications")}
            </div>
          </div>
          <div className="border-x border-border/60">
            <div className="text-lg font-bold tabular-nums text-foreground">
              {offre.nombreConsultes ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("entrepriseSpace.offers.viewed")}
            </div>
          </div>
          <div>
            <div className="text-lg font-bold tabular-nums text-foreground">
              {offre.nombrePreselectionnes ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("entrepriseSpace.offers.preselected")}
            </div>
          </div>
        </div>
      </div>

      {/* Progression du recrutement */}
      {offre.nombrePostes > 0 && (
        <div className="mt-4 px-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {t("entrepriseSpace.offers.recruitmentProgress")}
            </span>
            <span className="tabular-nums font-semibold text-muted-foreground">
              {offre.nombreAcceptes ?? 0} / {offre.nombrePostes}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progression}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-teal-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("entrepriseSpace.offers.positionsFilled", {
              filled: offre.nombreAcceptes ?? 0,
              total: offre.nombrePostes,
            }) ||
              `${offre.nombreAcceptes ?? 0} / ${offre.nombrePostes} postes pourvus`}
          </p>
        </div>
      )}

      {/* Candidats récents */}
      <div className="mt-4 px-5">
        <CandidatsRecentsAvatars candidats={candidatsRecents} />
      </div>

      {/* Action principale */}
      <div className="mt-auto border-t border-border/60 px-5 py-3">
        <Link
          href={`/candidats?idOffre=${offre.idOffre}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <FiUsers className="h-4 w-4" />
          {t("entrepriseSpace.offers.viewCandidates")}
          <FiArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
