"use client";
// Source UNIQUE des menus de navigation par rôle — utilisée à la fois par
// DashboardRouter (page /tableau-de-bord) ET par les layouts de Route Group
// (toutes les autres pages du rôle). Évite toute divergence entre les deux.
//
// Tous les libellés passent par useTranslation() (lib/i18n) afin que les
// menus changent immédiatement de langue avec le reste de l'application.

import {
  FiGrid,
  FiBriefcase,
  FiFileText,
  FiCalendar,
  FiAward,
  FiMessageSquare,
  FiUser,
  FiUsers,
  FiUserPlus,
  FiHome,
  FiAlertTriangle,
  FiSettings,
  FiClipboard,
  FiBarChart2,
  FiUserCheck,
} from "react-icons/fi";
import { Building2 } from "lucide-react";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useUniversiteStats } from "@/lib/queries/useUniversiteStats";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import { useEntretiensEnAttente } from "@/lib/queries/useEntretiens";
import { useAdminStats } from "@/lib/queries/useAdminStats";
import { useInvitationsRecues } from "@/lib/queries/usePartenariats";
import {
  useMesStagiaires,
  useEvaluationsSuperviseur,
} from "@/lib/queries/useSuperviseur";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useOffres } from "@/lib/queries/useOffres";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { useMonStage } from "@/lib/queries/useStages";

// Table des libellés de rôle admin. Reste un objet simple (clé métier ->
// clé de traduction) ; utiliser useRoleAdminLabels() pour obtenir la version
// traduite dans la langue courante.
const ROLE_ADMIN_LABEL_KEYS = {
  super_admin: "roles.superAdmin",
  operations: "roles.operations",
  support: "roles.support",
  relations_entreprises: "roles.companyRelations",
  relations_universites: "roles.universityRelations",
  conformite: "roles.compliance",
};

export function useRoleAdminLabels() {
  const { t } = useTranslation();
  return Object.fromEntries(
    Object.entries(ROLE_ADMIN_LABEL_KEYS).map(([cle, cleTraduction]) => [
      cle,
      t(cleTraduction),
    ]),
  );
}

function subscribeOffresSeen(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener("internin-offres-seen", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("internin-offres-seen", handler);
    window.removeEventListener("storage", handler);
  };
}

function getOffresSeenSnapshot(storageKey) {
  if (typeof window === "undefined" || !storageKey) return null;
  return localStorage.getItem(storageKey);
}

/** À appeler quand l'étudiant ouvre la page Offres */
export function markOffresAsSeen(userId) {
  if (typeof window === "undefined" || !userId) return;
  const key = `internin:lastSeenOffres:${userId}`;
  localStorage.setItem(key, new Date().toISOString());
  window.dispatchEvent(new Event("internin-offres-seen"));
}

export function useStagiaireNavItems() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const userId = useAuthStore((s) => s.user?.idUtilisateur);

  const { data: offresData } = useOffres({});
  const { data: candidaturesData } = useMesCandidatures();
  const { data: entretiensData } = useMesEntretiens();
  const { data: monStageData } = useMonStage();

  const offres = Array.isArray(offresData)
    ? offresData
    : Array.isArray(offresData?.offres)
      ? offresData.offres
      : [];

  const candidatures = Array.isArray(candidaturesData)
    ? candidaturesData
    : Array.isArray(candidaturesData?.candidatures)
      ? candidaturesData.candidatures
      : [];

  const entretiens = Array.isArray(entretiensData)
    ? entretiensData
    : Array.isArray(entretiensData?.entretiens)
      ? entretiensData.entretiens
      : [];

  // --- Dot "nouvelles offres" (localStorage, par utilisateur) ---
  const storageKey = userId ? `internin:lastSeenOffres:${userId}` : null;

  const lastSeenOffres = useSyncExternalStore(
    subscribeOffresSeen,
    () => getOffresSeenSnapshot(storageKey),
    () => null, // serveur
  );

  const hasNouvellesOffres = offres.some((o) => {
    if (!o.datePublication) return false;
    // Jamais consulté le menu → signaler s'il existe au moins une offre publiée
    if (!lastSeenOffres) return true;
    return new Date(o.datePublication) > new Date(lastSeenOffres);
  });

  // --- Compteurs ---
  const nbCandidaturesActives = candidatures.filter(
    (c) => !["rejetee", "retiree"].includes(c.statut),
  ).length;

  const nbEntretiens = entretiens.length;

  const monStage =
    monStageData?.stage || monStageData?.monStage || monStageData || null;
  const hasStageActif =
    monStage &&
    monStage.idStage &&
    !["termine", "annule", "refuse"].includes(monStage.statut);

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/offres",
      label: t("sidebar.internshipOffers"),
      icon: FiBriefcase,
      // Point clignotant (NavLink gère déjà `dot` + `animate-blink`)
      dot: hasNouvellesOffres,
      dotColor: "#14b8a6",
    },
    {
      href: "/candidatures",
      label: t("sidebar.applications"),
      icon: FiFileText,
      badge: nbCandidaturesActives || undefined,
    },
    {
      href: "/entretiens",
      label: t("sidebar.interviews"),
      icon: FiCalendar,
      badge: nbEntretiens || undefined,
    },
    {
      href: "/stage",
      label: t("sidebar.myInternship"),
      icon: FiBriefcase,
      badge: hasStageActif ? 1 : undefined,
    },
    { href: "/certificats", label: t("sidebar.certificates"), icon: FiAward },
    {
      href: "/messages",
      label: t("sidebar.messages"),
      icon: FiMessageSquare,
    },
    { href: "/profil", label: t("sidebar.myProfile"), icon: FiUser },
  ];
}

export function useEntrepriseNavItems() {
  const { t } = useTranslation();
  const { data: offres } = useMesOffres();
  const { data: candidatures } = useCandidaturesEntreprise();
  const { data: entretiens } = useEntretiensEntreprise();
  const { data: enAttente } = useEntretiensEnAttente();
  const { data: invitationsPartenariat } = useInvitationsRecues();
  // Données de supervision (mêmes hooks — l\'API accepte désormais le compte entreprise).
  const { data: stagiairesSupervision } = useMesStagiaires();
  const { data: evaluationsSupervision } = useEvaluationsSuperviseur();

  const nbReprogrammation = enAttente?.reprogrammation ?? 0;
  const nbStagiaires = stagiairesSupervision?.length ?? 0;
  const nbEvalATraiter =
    evaluationsSupervision?.filter(
      (e) =>
        e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard",
    ).length ?? 0;

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    // —— Gestion ——
    {
      href: "/offres-entreprise",
      label: t("sidebar.internshipOffers"),
      icon: FiBriefcase,
      badge: offres?.filter((o) => o.statut === "publie").length,
      section: "gestion",
    },
    {
      href: "/candidats",
      label: t("sidebar.applications"),
      icon: FiUsers,
      badge: candidatures?.length,
      badgePulseColor: nbReprogrammation > 0 ? "#F97316" : null,
      section: "gestion",
    },
    {
      href: "/entretiens-entreprise",
      label: t("sidebar.interviews"),
      icon: FiCalendar,
      badge: entretiens?.filter((e) => e.statut === "confirme").length,
      section: "gestion",
    },
    {
      href: "/partenariats-universites",
      label: t("sidebar.universityPartnerships"),
      icon: FiUserCheck,
      badge: invitationsPartenariat?.length,
      section: "gestion",
    },
    // —— Supervision (réutilise les fonctionnalités Superviseur) ——
    {
      href: "/supervision/mes-stagiaires",
      label: t("sidebar.myInterns") || "Mes stagiaires",
      icon: FiUsers,
      badge: nbStagiaires || undefined,
      section: "supervision",
    },
    {
      href: "/supervision/evaluations",
      label: t("sidebar.evaluations") || "Évaluations",
      icon: FiClipboard,
      badge: nbEvalATraiter || undefined,
      section: "supervision",
    },
    {
      href: "/supervision/calendrier",
      label: "Calendrier",
      icon: FiCalendar,
      section: "supervision",
    },
    {
      href: "/suivi-stagiaires",
      label: t("sidebar.internTracking"),
      icon: FiBarChart2,
      section: "supervision",
    },
    // —— Entreprise ——
    {
      href: "/messages-entreprise",
      label: t("sidebar.messages"),
      icon: FiMessageSquare,
      section: "entreprise",
    },
    {
      href: "/equipe",
      label: t("sidebar.team"),
      icon: FiUserPlus,
      section: "entreprise",
    },
    {
      href: "/profil-entreprise",
      label: "Mon profil",
      icon: Building2,
      section: "entreprise",
    },
  ];
}

// Menu de l'Espace Université — seul "Tableau de bord" a une page construite
// pour l'instant (chantier en cours) ; les autres pages sont des placeholders
// "à venir" pour garder la navigation fonctionnelle.
export function useUniversiteNavItems() {
  const { t } = useTranslation();
  const { data: stats } = useUniversiteStats();

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/etudiants-universite",
      label: t("sidebar.studentsUniv"),
      icon: FiUsers,
    },
    {
      href: "/entreprises-universite",
      label: t("sidebar.companiesUniv"),
      icon: FiBriefcase,
    },
    {
      href: "/conventions",
      label: t("sidebar.conventions"),
      icon: FiFileText,
      badge: stats?.conventionsEnAttente,
    },
    {
      href: "/maitres-de-stage",
      label: t("sidebar.internshipSupervisors"),
      icon: FiUserPlus,
    },
    { href: "/rapports", label: t("sidebar.reports"), icon: FiClipboard },
    {
      href: "/statistiques",
      label: t("sidebar.statistics"),
      icon: FiBarChart2,
    },
    {
      href: "/parametres-universite",
      label: t("sidebar.settings"),
      icon: FiSettings,
    },
  ];
}

// Menu de l'Espace Superviseur — membre d'équipe (menu Équipe côté
// Entreprise) connecté avec son propre compte. Volontairement minimal pour
// l'instant : seuls "Tableau de bord" et "Mes stagiaires" existent.
export function useSuperviseurNavItems() {
  const { t } = useTranslation();
  const { data: stagiaires } = useMesStagiaires();
  const { data: evaluations } = useEvaluationsSuperviseur();
  const aTraiter = evaluations?.filter(
    (e) =>
      e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard",
  ).length;

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/mes-stagiaires",
      label: t("sidebar.myInterns"),
      icon: FiUsers,
      badge: stagiaires?.length,
    },
    {
      href: "/mes-stagiaires/evaluations",
      label: t("sidebar.evaluations"),
      icon: FiClipboard,
      badge: aTraiter,
    },
    {
      href: "/calendrier-supervision",
      label: "Calendrier",
      icon: FiCalendar,
    },
  ];
}

// Menu de la Console Admin — "Entreprises" (app/(admin)/gestion-entreprises)
// et "Universités" (app/(admin)/gestion-universites) sont désormais des
// pages de gestion complètes — renommées pour éviter la collision avec les
// pages marketing publiques /entreprises et /universites — basées sur leurs
// maquettes dédiées. "Offres de stage" pointe encore vers la file de
// vérification existante (app/(admin)/verifications/offres-finales) en
// attendant son propre chantier. "Signalements" est une liste en lecture
// seule (pas encore d'assignation/résolution). "Utilisateurs" est une simple
// page d'attente ("à venir").
export function useAdminNavItems() {
  const { t } = useTranslation();
  const { data: stats } = useAdminStats();

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/verifications/offres-finales",
      label: t("sidebar.internshipOffers"),
      icon: FiFileText,
      badge: stats?.offresEnAttente,
    },
    {
      href: "/gestion-universites",
      label: t("sidebar.universitiesMgmt"),
      icon: FiHome,
      badge: stats?.entitesNonVerifiees?.universites,
    },
    {
      href: "/gestion-entreprises",
      label: t("sidebar.companiesMgmt"),
      icon: FiBriefcase,
      badge: stats?.entitesNonVerifiees?.entreprises,
    },
    { href: "/utilisateurs", label: t("sidebar.users"), icon: FiUsers },
    {
      href: "/signalements",
      label: t("sidebar.flaggedReports"),
      icon: FiAlertTriangle,
      badge: stats?.signalementsOuverts,
      badgePulseColor: stats?.signalementsOuverts > 0 ? "#EF4444" : null,
    },
    {
      href: "/parametres-admin",
      label: t("sidebar.settings"),
      icon: FiSettings,
    },
  ];
}
