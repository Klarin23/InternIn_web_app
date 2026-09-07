"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { FiMapPin, FiCalendar, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { calculerAge } from "@/lib/utils/calculerAge";

const ENTRETIEN_ACTION_LABELS = {
  reprogramme: "entrepriseSpace.candidatures.interviewRescheduleRequested",
  planifie: "entrepriseSpace.candidatures.interviewAwaitingReply",
  valide: "entrepriseSpace.candidatures.interviewAwaitingConfirm",
};

export default function KanbanCard({
  candidature,
  onOpen,
  estNouvelle = false,
  entretienASignaler = null,
  dragDisabled = false,
}) {
  const { t, locale } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: candidature.idCandidature,
      disabled: dragDisabled,
    });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    touchAction: dragDisabled ? "auto" : "none",
    cursor: dragDisabled ? "pointer" : undefined,
  };

  const age = calculerAge(candidature.dateNaissance);
  const date = new Date(candidature.dateCandidature).toLocaleDateString(
    locale === "en" ? "en-GB" : "fr-FR",
    {
      day: "2-digit",
      month: "short",
    },
  );
  const competencesAffichees = (candidature.competences || []).slice(0, 3);
  const competencesRestantes =
    (candidature.competences || []).length - competencesAffichees.length;

  const actionRequise = entretienASignaler?.statut === "reprogramme";

  return (
    <motion.div
      layout
      initial={estNouvelle ? { opacity: 0, x: 60 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative"
    >
      {estNouvelle && !actionRequise && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.25,
            type: "spring",
            stiffness: 500,
            damping: 15,
          }}
          className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white shadow"
        >
          Nouveau
        </motion.span>
      )}

      {actionRequise && (
        <span className="absolute -right-1.5 -top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <FiAlertCircle className="h-3 w-3" aria-hidden />
          Action requise
        </span>
      )}

      <div
        ref={setNodeRef}
        style={dragStyle}
        {...listeners}
        {...attributes}
        onClick={() => onOpen(candidature)}
        className={`rounded-md border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md ${
          dragDisabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
        } ${
          actionRequise
            ? "border-amber-300 ring-1 ring-amber-200/60 dark:border-amber-700 dark:ring-amber-900/40"
            : "border-border"
        }`}
      >
        <div className="mb-2.5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {candidature.photoProfilUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidature.photoProfilUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              `${candidature.prenom?.[0] || ""}${candidature.nom?.[0] || ""}`
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {candidature.prenom} {candidature.nom}
              {age && (
                <span className="ml-1 font-normal text-muted-foreground">
                  · {t("entrepriseSpace.candidatures.yearsOld", { age })}
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {candidature.titreOffre}
            </p>
          </div>
        </div>

        <div className="mb-2 space-y-0.5 text-xs text-muted-foreground">
          {candidature.nomUniversite && (
            <p className="truncate">{candidature.nomUniversite}</p>
          )}
          {(candidature.diplome || candidature.departement) && (
            <p className="truncate">
              {candidature.diplome}
              {candidature.departement && ` · ${candidature.departement}`}
              {candidature.anneeEtude && ` · ${candidature.anneeEtude}e année`}
            </p>
          )}
          <div className="flex items-center gap-3 pt-0.5">
            {candidature.ville && (
              <span className="flex items-center gap-1">
                <FiMapPin className="h-3 w-3" />
                {candidature.ville}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FiCalendar className="h-3 w-3" />
              {date}
            </span>
          </div>
        </div>

        {competencesAffichees.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {competencesAffichees.map((c) => (
              <span
                key={c}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {c}
              </span>
            ))}
            {competencesRestantes > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{competencesRestantes}
              </span>
            )}
          </div>
        )}

        {entretienASignaler && (
          <div
            className={`mt-2.5 rounded-md px-2 py-1.5 text-[11px] font-medium ${
              actionRequise
                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                : "bg-muted/60 text-muted-foreground"
            }`}
          >
            <span className="flex items-center justify-between gap-1">
              <span>
                {(ENTRETIEN_ACTION_LABELS[entretienASignaler.statut] ? t(ENTRETIEN_ACTION_LABELS[entretienASignaler.statut]) : null) ||
                  t("entrepriseSpace.candidatures.interviewFollowUp")}
              </span>
              {actionRequise && (
                <span className="inline-flex items-center gap-0.5 font-semibold text-amber-700 dark:text-amber-300">
                  Traiter
                  <FiArrowRight className="h-3 w-3" aria-hidden />
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
