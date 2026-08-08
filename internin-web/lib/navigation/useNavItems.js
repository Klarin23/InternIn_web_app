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

export function useStagiaireNavItems() {
  const { t } = useTranslation();

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/offres",
      label: t("sidebar.internshipOffers"),
      icon: FiBriefcase,
    },
    {
      href: "/candidatures",
      label: t("sidebar.applications"),
      icon: FiFileText,
    },
    { href: "/entretiens", label: t("sidebar.interviews"), icon: FiCalendar },
    { href: "/stage", label: t("sidebar.myInternship"), icon: FiBriefcase },
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

  const nbReprogrammation = enAttente?.reprogrammation ?? 0;

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/offres-entreprise",
      label: t("sidebar.internshipOffers"),
      icon: FiBriefcase,
      badge: offres?.filter((o) => o.statut === "publie").length,
    },
    {
      href: "/candidats",
      label: t("sidebar.applications"),
      icon: FiUsers,
      badge: candidatures?.length,
      badgePulseColor: nbReprogrammation > 0 ? "#F97316" : null,
    },
    {
      href: "/entretiens-entreprise",
      label: t("sidebar.interviews"),
      icon: FiCalendar,
      badge: entretiens?.filter((e) => e.statut === "confirme").length,
    },
    {
      href: "/partenariats-universites",
      label: t("sidebar.universityPartnerships"),
      icon: FiUserCheck,
      badge: invitationsPartenariat?.length,
    },
    {
      href: "/suivi-stagiaires",
      label: t("sidebar.internTracking"),
      icon: FiUsers,
    },
    {
      href: "/messages-entreprise",
      label: t("sidebar.messages"),
      icon: FiMessageSquare,
    },
    { href: "/equipe", label: t("sidebar.team"), icon: FiUserPlus },
    { href: "/profil-entreprise", label: "Mon profil", icon: Building2 },
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
