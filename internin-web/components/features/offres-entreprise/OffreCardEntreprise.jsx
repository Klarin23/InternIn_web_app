"use client";

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

const STATUT_LABELS = {
  brouillon: "Brouillon",
  publie: "Active",
  pause: "En pause",
  ferme: "Fermée",
  archive: "Archivée",
};
const STATUT_COLORS = {
  brouillon: "bg-accent/40 text-amber-700",
  publie: "bg-success/10 text-green-700",
  pause: "bg-accent/40 text-amber-700",
  ferme: "bg-destructive/10 text-destructive",
  archive: "bg-muted text-muted-foreground",
};
const MODE_LABELS = {
  distance: "Distance",
  hybride: "Hybride",
  presentiel: "Présentiel",
};
const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};
const REMUNERATION_LABELS = {
  aucune: "Non rémunéré",
  indemnite_transport: "Indemnité transport",
  indemnite_repas: "Indemnité repas",
  allocation_mensuelle: "Allocation mensuelle",
  indemnite_internet_appel: "Indemnité internet / appel",
};

function estExpiree(offre) {
  return (
    offre.statut === "publie" &&
    offre.dateLimiteCandidature &&
    new Date(offre.dateLimiteCandidature) < new Date()
  );
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("fr-FR", {
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
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm ${
        danger
          ? "text-destructive hover:bg-destructive/5"
          : "text-foreground hover:bg-muted"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {loading ? (
        <FiLoader className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const updateMutation = useUpdateOffre();
  const deleteMutation = useDeleteOffre();
  const dupliquerMutation = useDupliquerOffre();

  const expiree = estExpiree(offre);
  const statutAffiche = expiree ? "expire" : offre.statut;
  const labels = { ...STATUT_LABELS, expire: "Expirée" };
  const colors = {
    ...STATUT_COLORS,
    expire: "bg-destructive/10 text-destructive",
  };
  const peutSupprimer = offre.nombreCandidatures === 0;

  function changerStatut(statut) {
    updateMutation.mutate({ id: offre.idOffre, payload: { statut } });
    setMenuOpen(false);
  }

  function handleDupliquer() {
    dupliquerMutation.mutate(offre.idOffre, {
      onSuccess: () => toast.success("Offre dupliquée en brouillon"),
    });
    setMenuOpen(false);
  }

  function handleExporter() {
    if (candidatsRecents.length === 0) {
      toast.info("Aucune candidature à exporter pour cette offre");
    } else {
      exporterCandidaturesCsv(offre, candidatsRecents);
    }
    setMenuOpen(false);
  }

  function handleSupprimer() {
    if (confirm(`Supprimer définitivement l'offre "${offre.titre}" ?`)) {
      deleteMutation.mutate(offre.idOffre);
    }
    setMenuOpen(false);
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 14px 28px rgba(17,24,39,0.10)" }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col rounded-md border border-border bg-card p-5"
    >
      <OffreBadgesInfo offre={offre} seuilPopulaire={seuilPopulaire} />
      <div className="mb-3 flex items-start justify-between gap-3">
        {offre.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offre.logoUrl}
            alt="Logo de l'entreprise"
            className="h-11 w-11 shrink-0 rounded-sm border border-border object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <FiBriefcase className="h-5 w-5" />
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <motion.span
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`cursor-default rounded-full px-2.5 py-1 text-xs font-semibold ${colors[statutAffiche]}`}
          >
            {labels[statutAffiche]}
          </motion.span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Actions de l'offre"
            >
              <FiMoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-60 rounded-md border border-border bg-white py-1.5 shadow-md">
                  <MenuItem
                    icon={FiEdit2}
                    label="Modifier"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(offre.idOffre);
                    }}
                  />
                  <MenuItem
                    icon={FiCopy}
                    label="Dupliquer"
                    onClick={handleDupliquer}
                    loading={dupliquerMutation.isPending}
                  />
                  {offre.statut === "publie" && (
                    <MenuItem
                      icon={FiPauseCircle}
                      label="Mettre en pause"
                      onClick={() => changerStatut("pause")}
                      loading={updateMutation.isPending}
                    />
                  )}
                  {offre.statut === "pause" && (
                    <MenuItem
                      icon={FiPlayCircle}
                      label="Reprendre la publication"
                      onClick={() => changerStatut("publie")}
                      loading={updateMutation.isPending}
                    />
                  )}
                  {(offre.statut === "publie" || offre.statut === "pause") && (
                    <MenuItem
                      icon={FiXCircle}
                      label="Fermer"
                      onClick={() => changerStatut("ferme")}
                      loading={updateMutation.isPending}
                    />
                  )}
                  <MenuItem
                    icon={FiDownload}
                    label="Exporter les candidatures"
                    onClick={handleExporter}
                  />
                  <div className="my-1 border-t border-border" />
                  <MenuItem
                    icon={FiTrash2}
                    label={
                      peutSupprimer
                        ? "Supprimer"
                        : "Impossible : candidatures reçues"
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

      <h5 className="mb-0.5 font-semibold text-foreground">{offre.titre}</h5>
      <p className="mb-3 text-sm text-muted-foreground">
        {offre.departement || offre.secteurActivite}
      </p>

      <CandidatsRecentsAvatars candidats={candidatsRecents} />

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FiMapPin className="h-3.5 w-3.5" />
          {offre.ville || "Non précisé"}
        </span>
        <span className="flex items-center gap-1">
          <FiClock className="h-3.5 w-3.5" />
          {MODE_LABELS[offre.modeTravail]}
          {offre.dureeStage && ` · ${DUREE_LABELS[offre.dureeStage]}`}
        </span>
      </div>

      <div className="mb-3 space-y-1 text-xs text-muted-foreground">
        {offre.datePublication && (
          <p className="flex items-center gap-1.5">
            <FiCalendar className="h-3.5 w-3.5 shrink-0" />
            Publiée le {formatDate(offre.datePublication)}
          </p>
        )}
        {offre.dateLimiteCandidature && (
          <p
            className={`flex items-center gap-1.5 ${expiree ? "font-medium text-destructive" : ""}`}
          >
            <FiCalendar className="h-3.5 w-3.5 shrink-0" />
            Date limite : {formatDate(offre.dateLimiteCandidature)}
          </p>
        )}
        {offre.remunerationType && offre.remunerationType !== "aucune" && (
          <p>
            {REMUNERATION_LABELS[offre.remunerationType]}
            {offre.montantRemuneration &&
              ` · ${Number(offre.montantRemuneration).toLocaleString()} FCFA`}
          </p>
        )}
      </div>

      <Link
        href={`/candidats?idOffre=${offre.idOffre}`}
        className="mb-4 grid grid-cols-3 gap-2 rounded-sm bg-muted/40 py-2.5 text-center transition hover:bg-muted/70"
      >
        <div>
          <div className="text-base font-bold text-foreground">
            {offre.nombreCandidatures}
          </div>
          <div className="text-[10px] text-muted-foreground">Candidatures</div>
        </div>
        <div className="border-x border-border">
          <div className="text-base font-bold text-foreground">
            {offre.nombreConsultes}
          </div>
          <div className="text-[10px] text-muted-foreground">Consultés</div>
        </div>
        <div>
          <div className="text-base font-bold text-foreground">
            {offre.nombrePreselectionnes}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Présélectionnés
          </div>
        </div>
      </Link>

      {offre.nombrePostes > 0 && (
        <div className="mt-auto">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Recrutement</span>
            <span className="font-semibold text-muted-foreground">
              {Math.min(
                100,
                Math.round((offre.nombreAcceptes / offre.nombrePostes) * 100),
              )}
              %
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, Math.round((offre.nombreAcceptes / offre.nombrePostes) * 100))}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full bg-linear-to-r from-primary/70 to-primary"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {offre.nombreAcceptes} candidat{offre.nombreAcceptes > 1 ? "s" : ""}{" "}
            retenu
            {offre.nombreAcceptes > 1 ? "s" : ""} sur {offre.nombrePostes}
          </p>
        </div>
      )}
    </motion.div>
  );
}
