// Logique de statut/timeline des candidatures.
// La logique métier reste inchangée.
// Les clés de traduction sont exposées aux composants UI.

import { FiCalendar, FiClock, FiX, FiCheckCircle, FiCornerUpLeft } from "react-icons/fi";

export const MOTIFS_RETRAIT = [
  { code: "ACCEPTED_OTHER_OPPORTUNITY", labelKey: "candidatures.withdraw.reasons.ACCEPTED_OTHER_OPPORTUNITY", label: "J'ai accepté une autre opportunité." },
  { code: "NO_LONGER_AVAILABLE", labelKey: "candidatures.withdraw.reasons.NO_LONGER_AVAILABLE", label: "Je ne suis plus disponible." },
  { code: "OFFER_NO_LONGER_FITS", labelKey: "candidatures.withdraw.reasons.OFFER_NO_LONGER_FITS", label: "L'offre ne correspond plus à mon projet." },
  { code: "FOUND_INTERNSHIP_ELSEWHERE", labelKey: "candidatures.withdraw.reasons.FOUND_INTERNSHIP_ELSEWHERE", label: "J'ai trouvé un stage ailleurs." },
  { code: "AVAILABILITY_CHANGED", labelKey: "candidatures.withdraw.reasons.AVAILABILITY_CHANGED", label: "Mes disponibilités ont changé." },
  { code: "PERSONAL_REASONS", labelKey: "candidatures.withdraw.reasons.PERSONAL_REASONS", label: "Raisons personnelles." },
  { code: "OTHER", labelKey: "candidatures.withdraw.reasons.OTHER", label: "Autre." },
];

export const MOTIFS_RETRAIT_LABELS = Object.fromEntries(
  MOTIFS_RETRAIT.map((m) => [m.code, m.label]),
);

/** Statuts pour lesquels le stagiaire peut encore retirer sa candidature */
export const TRANSITIONS_CANDIDATURE = Object.freeze({
  soumise: Object.freeze(["consultee", "preselectionnee", "rejetee"]),
  consultee: Object.freeze(["preselectionnee", "rejetee"]),
  preselectionnee: Object.freeze(["rejetee"]),
  rejetee: Object.freeze([]),
  acceptee: Object.freeze([]),
  retiree: Object.freeze([]),
});

/**
 * Vérifie côté UI si un changement de statut est autorisé par la machine
 * d'état métier. Le backend reste la source d'autorité finale.
 */
export function peutChangerStatutCandidature(statutActuel, nouveauStatut) {
  if (!statutActuel || !nouveauStatut || statutActuel === nouveauStatut) {
    return false;
  }

  return TRANSITIONS_CANDIDATURE[statutActuel]?.includes(nouveauStatut) ?? false;
}

export const STATUTS_RETRAIT_AUTORISES = ["soumise", "consultee", "preselectionnee"];

export function peutRetirerCandidature(candidature) {
  return !!candidature && STATUTS_RETRAIT_AUTORISES.includes(candidature.statut);
}


export const STATUTS_ENTRETIEN_ACTIFS = [
  "planifie",
  "valide",
  "confirme",
  "reprogramme",
  "termine",
];

export const FILTRES_STATUT = [
  {
    valeur: "toutes",
    label: "Toutes",
    labelKey: "candidatures.filters.all",
  },
  {
    valeur: "attente",
    label: "En attente",
    labelKey: "candidatures.filters.pending",
  },
  {
    valeur: "consultee",
    label: "Consultées",
    labelKey: "candidatures.filters.viewed",
  },
  {
    valeur: "entretien",
    label: "Entretien",
    labelKey: "candidatures.filters.interview",
  },
  {
    valeur: "acceptee",
    label: "Acceptées",
    labelKey: "candidatures.filters.accepted",
  },
  {
    valeur: "refusee",
    label: "Refusées",
    labelKey: "candidatures.filters.rejected",
  },
  {
    valeur: "retiree",
    label: "Retirées",
    labelKey: "candidatures.filters.withdrawn",
  },
];

const LABEL_PAR_FILTRE = {
  attente: "En attente",
  consultee: "Consultée",
  entretien: "Entretien",
  acceptee: "Accepté",
  refusee: "Refusé",
  retiree: "Retirée par vous",
};

export function formatDate(date, avecHeure = false, locale = "fr-FR") {
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(avecHeure && {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}

export function formatDepuis(date, maintenant, t) {
  const jours = Math.floor(
    (maintenant - new Date(date).getTime()) / 86_400_000,
  );

  if (jours <= 0) {
    return t ? t("candidatures.since.today") : "aujourd'hui";
  }

  if (jours === 1) {
    return t ? t("candidatures.since.oneDay") : "il y a 1 jour";
  }

  return t
    ? t("candidatures.since.manyDays", { n: jours })
    : `il y a ${jours} jours`;
}

export function getAffichage(
  candidature,
  entretiens,
  offreFinale,
  options = {},
) {
  const { t, locale = "fr-FR" } = options;

  if (candidature.statut === "rejetee") {
    return {
      label: t ? t("candidatures.status.rejected.label") : "Refusé",
      className: "bg-destructive/10 text-destructive",
      Icon: FiX,
      detail: null,
    };
  }

  if (candidature.statut === "acceptee") {
    return {
      label: t ? t("candidatures.status.accepted.label") : "Accepté",
      className: "bg-success/10 text-green-700",
      Icon: FiCheckCircle,
      detail: offreFinale
        ? t
          ? t("candidatures.status.accepted.detail", {
              date: formatDate(offreFinale.dateDebut, false, locale),
            })
          : `Démarrage le ${formatDate(offreFinale.dateDebut)}`
        : null,
    };
  }

  if (candidature.statut === "retiree") {
    const motifEntry = MOTIFS_RETRAIT.find(
      (m) => m.code === candidature.motifRetraitCode,
    );
    const motifLabel = t && motifEntry?.labelKey
      ? t(motifEntry.labelKey)
      : MOTIFS_RETRAIT_LABELS[candidature.motifRetraitCode] ||
        candidature.motifRetraitCommentaire ||
        null;
    // Si motif OTHER + commentaire, préférer le commentaire libre
    const reasonText =
      candidature.motifRetraitCode === "OTHER" && candidature.motifRetraitCommentaire
        ? candidature.motifRetraitCommentaire
        : motifLabel || candidature.motifRetraitCommentaire || null;
    const dateRetrait = candidature.dateRetrait
      ? formatDate(candidature.dateRetrait, false, locale)
      : null;
    let detail = t
      ? t("candidatures.status.withdrawn.detail")
      : "Vous avez retiré cette candidature";
    if (dateRetrait && reasonText) {
      detail = t
        ? t("candidatures.status.withdrawn.detailDateReason", {
            date: dateRetrait,
            reason: reasonText,
          })
        : `Retrait effectué le ${dateRetrait} — Motif : ${reasonText}`;
    } else if (dateRetrait) {
      detail = t
        ? t("candidatures.status.withdrawn.detailDate", { date: dateRetrait })
        : `Retrait effectué le ${dateRetrait}`;
    } else if (reasonText) {
      detail = t
        ? t("candidatures.status.withdrawn.detailReason", { reason: reasonText })
        : `Motif : ${reasonText}`;
    }
    return {
      label: t ? t("candidatures.status.withdrawn.label") : "Retirée par vous",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      Icon: FiCornerUpLeft,
      detail,
    };
  }

  const entretienActif = entretiens?.find(
    (e) =>
      e.idCandidature === candidature.idCandidature &&
      STATUTS_ENTRETIEN_ACTIFS.includes(e.statut),
  );

  if (entretienActif) {
    const date = formatDate(entretienActif.dateHeure, true, locale);

    const detailsParStatut = {
      planifie: t
        ? t("candidatures.status.interview.planifie", { date })
        : `Entretien proposé — ${date}, à confirmer`,

      valide: t
        ? t("candidatures.status.interview.valide", { date })
        : `Entretien confirmé de votre côté — ${date}`,

      confirme: t
        ? t("candidatures.status.interview.confirme", { date })
        : `Entretien confirmé — ${date}`,

      reprogramme: t
        ? t("candidatures.status.interview.reprogramme")
        : "Reprogrammation demandée, en attente de l'entreprise",

      termine: t
        ? t("candidatures.status.interview.termine")
        : "Entretien passé — réponse de l'entreprise à venir",
    };

    return {
      label: t ? t("candidatures.status.interview.label") : "Entretien",
      className: "bg-[#EDE9FE] text-[#6D28D9]",
      Icon: FiCalendar,
      detail: detailsParStatut[entretienActif.statut],
    };
  }

  if (candidature.statut === "consultee") {
    return {
      label: t ? t("candidatures.status.viewed.label") : "Consultée",
      className: "bg-[#DBEAFE] text-[#1D4ED8]",
      Icon: FiClock,
      detail: t
        ? t("candidatures.status.viewed.detail")
        : "Votre candidature a été consultée par l'entreprise",
    };
  }

  return {
    label: t ? t("candidatures.status.pending.label") : "En attente",
    className: "bg-[#FEF3C7] text-[#B45309]",
    Icon: FiClock,
    detail: t
      ? t("candidatures.status.pending.detail")
      : "En attente de réponse de l'entreprise",
  };
}

export function getEtapesTimeline(candidature, entretiens) {
  if (candidature.statut === "retiree") {
    return {
      retiree: true,
      etapes: [],
    };
  }

  const consulteeFaite = candidature.statut !== "soumise";

  const aUnEntretien = !!entretiens?.some(
    (e) => e.idCandidature === candidature.idCandidature,
  );

  const decisionFaite =
    candidature.statut === "acceptee" || candidature.statut === "rejetee";

  const etapesBrutes = [
    {
      label: "Envoyée",
      labelKey: "candidatures.timeline.sent",
      fait: true,
    },
    {
      label: "Consultée",
      labelKey: "candidatures.timeline.viewed",
      fait: consulteeFaite,
    },
    {
      label: "Entretien",
      labelKey: "candidatures.timeline.interview",
      fait: aUnEntretien,
    },
    {
      label: "Décision",
      labelKey: "candidatures.timeline.decision",
      fait: decisionFaite,
    },
  ];

  const dernierIndexFait = etapesBrutes.reduce(
    (acc, e, i) => (e.fait ? i : acc),
    0,
  );

  const indexCourante = decisionFaite ? -1 : dernierIndexFait + 1;

  return {
    retiree: false,
    etapes: etapesBrutes.map((e, i) => ({
      ...e,
      courante: i === indexCourante,
    })),
  };
}

export function matchFiltre(candidature, entretiens, filtre) {
  if (filtre === "toutes") return true;
  if (filtre === "retiree") return candidature.statut === "retiree";
  if (filtre === "refusee") return candidature.statut === "rejetee";
  if (filtre === "acceptee") return candidature.statut === "acceptee";
  if (filtre === "consultee") return candidature.statut === "consultee";
  if (filtre === "attente") {
    // En attente = soumise sans entretien actif affiché comme "pending"
    if (candidature.statut === "soumise") return true;
    // preselectionnee sans entretien actif
    if (candidature.statut === "preselectionnee") {
      const hasEntretien = (entretiens || []).some(
        (e) =>
          e.idCandidature === candidature.idCandidature &&
          STATUTS_ENTRETIEN_ACTIFS.includes(e.statut),
      );
      return !hasEntretien;
    }
    return false;
  }
  if (filtre === "entretien") {
    return (entretiens || []).some(
      (e) =>
        e.idCandidature === candidature.idCandidature &&
        STATUTS_ENTRETIEN_ACTIFS.includes(e.statut),
    );
  }
  return false;
}

export function matchRecherche(candidature, recherche) {
  if (!recherche?.trim()) return true;

  const q = recherche.trim().toLowerCase();

  return (
    candidature.titre?.toLowerCase().includes(q) ||
    candidature.nomEntreprise?.toLowerCase().includes(q)
  );
}
