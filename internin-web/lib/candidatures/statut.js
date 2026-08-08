// Logique de statut/timeline des candidatures.
// La logique métier reste inchangée.
// Les clés de traduction sont exposées aux composants UI.

import { FiCalendar, FiClock, FiX, FiCheckCircle } from "react-icons/fi";

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
];

const LABEL_PAR_FILTRE = {
  attente: "En attente",
  consultee: "Consultée",
  entretien: "Entretien",
  acceptee: "Accepté",
  refusee: "Refusé",
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
    return {
      label: t ? t("candidatures.status.withdrawn.label") : "Retirée",
      className: "bg-muted text-muted-foreground",
      Icon: FiX,
      detail: null,
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

  return (
    getAffichage(candidature, entretiens).label === LABEL_PAR_FILTRE[filtre]
  );
}

export function matchRecherche(candidature, recherche) {
  if (!recherche?.trim()) return true;

  const q = recherche.trim().toLowerCase();

  return (
    candidature.titre?.toLowerCase().includes(q) ||
    candidature.nomEntreprise?.toLowerCase().includes(q)
  );
}
