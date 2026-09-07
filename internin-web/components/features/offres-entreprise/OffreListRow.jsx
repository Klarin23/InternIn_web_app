"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useState } from "react";
import {
  FiBriefcase,
  FiMapPin,
  FiEdit2,
  FiUsers,
  FiMoreVertical,
  FiCopy,
  FiPauseCircle,
  FiPlayCircle,
  FiXCircle,
  FiDownload,
  FiTrash2,
  FiLoader,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { toast } from "@/lib/store/useToastStore";
import { exporterCandidaturesCsv } from "@/lib/utils/exportCsv";
import {
  useUpdateOffre,
  useDeleteOffre,
  useDupliquerOffre,
} from "@/lib/queries/useCreateOffre";
import OffreBadgesInfo from "./OffreBadgesInfo";
import CandidatsRecentsAvatars from "./CandidatsRecentsAvatars";

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

function estExpiree(offre) {
  return (
    offre.statut === "publie" &&
    offre.dateLimiteCandidature &&
    new Date(offre.dateLimiteCandidature) < new Date()
  );
}

function formatDate(date, locale = "fr") {
  if (!date) return "—";
  const tag = String(locale).toLowerCase().startsWith("en") ? "en-GB" : "fr-FR";
  return new Date(date).toLocaleDateString(tag, {
    day: "2-digit",
    month: "short",
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

export default function OffreListRow({
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

  const statutAffiche = estExpiree(offre) ? "expire" : offre.statut;
  const pourcentage = offre.nombrePostes
    ? Math.min(
        100,
        Math.round((offre.nombreAcceptes / offre.nombrePostes) * 100),
      )
    : 0;
  const peutSupprimer = offre.nombreCandidatures === 0;

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
t("entrepriseSpace.offers.confirmDelete", { title: offre.titre }),
      )
    ) {
      deleteMutation.mutate(offre.idOffre);
    }
    setMenuOpen(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      {/* Logo */}
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

      {/* Identité + meta */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {offre.titre}
          </h3>
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUT_COLORS[statutAffiche] || STATUT_COLORS.archive}`}
          >
            {labels[statutAffiche]}
          </span>
          <OffreBadgesInfo offre={offre} seuilPopulaire={seuilPopulaire} compact />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="truncate">
            {offre.departement || offre.secteurActivite || "—"}
          </span>
          <span className="flex items-center gap-1">
            <FiMapPin className="h-3 w-3" />
            {offre.ville || t("entrepriseSpace.offers.notSpecified")}
          </span>
          <span className="flex items-center gap-1">
            <FiClock className="h-3 w-3" />
            {t(MODE_LABELS_KEYS[offre.modeTravail]) || offre.modeTravail || "—"}
          </span>
          {offre.dateLimiteCandidature && (
            <span className="flex items-center gap-1">
              <FiCalendar className="h-3 w-3" />
              {formatDate(offre.dateLimiteCandidature, locale)}
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <CandidatsRecentsAvatars candidats={candidatsRecents} compact />
        </div>
      </div>

      {/* Métriques + progression + actions */}
      <div className="flex shrink-0 items-center gap-5">
        <div className="hidden text-center sm:block">
          <div className="text-sm font-bold tabular-nums text-foreground">
            {offre.nombreCandidatures ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {t("entrepriseSpace.offers.applications")}
          </div>
        </div>

        {offre.nombrePostes > 0 && (
          <div className="hidden w-28 md:block">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{t("entrepriseSpace.offers.recruitment")}</span>
              <span className="font-semibold tabular-nums">{pourcentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${pourcentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Link
            href={`/candidats?idOffre=${offre.idOffre}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title={t("entrepriseSpace.offers.viewCandidates") || "Voir les candidats"}
          >
            <FiUsers className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => onEdit(offre.idOffre)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title={t("entrepriseSpace.offers.edit")}
          >
            <FiEdit2 className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("entrepriseSpace.offers.actionsMenu") || "Actions"}
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
                    icon={FiCopy}
                    label={t("entrepriseSpace.offers.duplicate") || "Dupliquer"}
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
                      label={t("entrepriseSpace.offers.close") || "Fermer"}
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
                        ? t("entrepriseSpace.offers.delete") || "Supprimer"
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
    </div>
  );
}
