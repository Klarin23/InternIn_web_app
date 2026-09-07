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
  FiSend,
  FiSearch,
  FiHeart,
  FiShield,
  FiClock,
  FiActivity,
  FiMonitor,
  FiBell,
} from "react-icons/fi";
import { Building2 } from "lucide-react";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useUniversiteStats } from "@/lib/queries/useUniversiteStats";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import { useEntretiensEnAttente } from "@/lib/queries/useEntretiens";
import { useAdminStats } from "@/lib/queries/useAdminStats";
import { useSecurityOverview } from "@/lib/queries/useSecurityCentre";
import { useNotificationsNonLuesCount } from "@/lib/queries/useNotifications";
import { useAdminProfile } from "@/lib/queries/useAdminProfile";
import { adminCanAccessHref } from "@/lib/admin/adminScopes";
import { useInvitationsRecues } from "@/lib/queries/usePartenariats";
import {
  useMesStagiaires,
  useEvaluationsSuperviseur,
} from "@/lib/queries/useSuperviseur";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useOffres } from "@/lib/queries/useOffres";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useMesEntretiens } from "@/lib/queries/useEntretiens";
import { compterEntretiensATraiterStagiaire } from "@/lib/entretiens/statut";
import { useMonStage } from "@/lib/queries/useStages";
import {
  usePropositionsStagiaire,
  countPropositionsEnAttente,
} from "@/lib/queries/usePropositionsStagiaire";
import { useFavorisCount } from "@/lib/queries/useFavoris";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useEtatVue, useMarkEtatVue } from "@/lib/queries/useEtatsVue";

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
  const pathname = usePathname();
  const userId = useAuthStore((s) => s.user?.idUtilisateur);

  const { data: offresData } = useOffres({});
  const { data: etatOffres } = useEtatVue("offres", Boolean(userId));
  const { data: candidaturesData } = useMesCandidatures();
  const { data: entretiensData } = useMesEntretiens();
  const { data: monStageData } = useMonStage();
  const { data: favorisCount } = useFavorisCount();
  const { data: propositionsData } = usePropositionsStagiaire();

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

  // --- Dot "nouvelles offres" : état serveur, par utilisateur ---
  const lastSeenOffres = etatOffres?.dateDerniereVue || null;

  const hasNouvellesOffres = offres.some((o) => {
    if (!o.datePublication) return false;
    // Jamais consulté la section → signaler s'il existe au moins une offre publiée.
    if (!lastSeenOffres) return true;
    return new Date(o.datePublication).getTime() > new Date(lastSeenOffres).getTime();
  });

  // --- Compteurs ---
  const nbCandidaturesActives = candidatures.filter(
    (c) => !["rejetee", "retiree"].includes(c.statut),
  ).length;

  const nbEntretiens = entretiens.length;
  // Actions requises (ex. nouvelle date à confirmer après replanification)
  const nbEntretiensATraiter = compterEntretiensATraiterStagiaire(entretiens);

  const monStage =
    monStageData?.stage || monStageData?.monStage || monStageData || null;
  const hasStageActif =
    monStage &&
    monStage.idStage &&
    !["termine", "annule", "refuse"].includes(monStage.statut);

  const propositions = Array.isArray(propositionsData)
    ? propositionsData
    : Array.isArray(propositionsData?.data)
      ? propositionsData.data
      : [];
  const nbPropositionsEnAttente = countPropositionsEnAttente(propositions);

  return [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
    {
      href: "/offres",
      label: t("sidebar.internshipOffers"),
      icon: FiSearch,
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
      href: "/favoris",
      label: t("sidebar.favorites"),
      icon: FiHeart,
      badge: favorisCount || undefined,
    },
    {
      href: "/propositions-stage",
      label: t("sidebar.propositions"),
      icon: FiSend,
      badge: nbPropositionsEnAttente || undefined,
      badgePulseColor: nbPropositionsEnAttente > 0 ? "#14b8a6" : null,
    },
    {
      href: "/entretiens",
      label: t("sidebar.interviews"),
      icon: FiCalendar,
      // Badge = entretiens nécessitant une action (planifie), pas le total
      badge: nbEntretiensATraiter || undefined,
      badgePulseColor: nbEntretiensATraiter > 0 ? "#F59E0B" : null,
    },
    {
      href: "/convention",
      label: t("sidebar.convention"),
      icon: FiFileText,
    },
    {
      href: "/stage",
      label: t("sidebar.myInternship"),
      icon: FiClipboard,
      badge: hasStageActif ? 1 : undefined,
    },
    { href: "/certificats", label: t("sidebar.certificates"), icon: FiAward },
    {
      href: "/securite",
      label: t("sidebar.safetyReports"),
      icon: FiShield,
    },
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
      badge:
        nbReprogrammation > 0
          ? nbReprogrammation
          : candidatures?.length || undefined,
      badgePulseColor: nbReprogrammation > 0 ? "#F97316" : null,
      section: "gestion",
    },
    {
      href: "/talents",
      label: t("sidebar.talents"),
      icon: FiUserPlus,
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
      href: "/conventions-entreprise",
      label: t("sidebar.conventions"),
      icon: FiFileText,
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
      label: t("sidebar.calendar"),
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
      label: t("sidebar.myProfileShort"),
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

// Menu de l'espace membre d'équipe (typeUtilisateur = "membre_entreprise").
// Construit dynamiquement à partir des permissions effectives renvoyées par
// /equipe/moi. Ainsi, dès que l'entreprise ajoute ou retire un droit
// (ex. offres.gerer), le menu du membre se met à jour au prochain chargement
// / focus de la page.
export function useSuperviseurNavItems() {
  const { t } = useTranslation();
  const { data: profil } = useMonProfilEquipe();
  const { data: stagiaires } = useMesStagiaires();
  const { data: evaluations } = useEvaluationsSuperviseur();
  const { data: offres } = useMesOffres();
  const { data: candidatures } = useCandidaturesEntreprise();
  const { data: entretiens } = useEntretiensEntreprise();
  const { data: enAttente } = useEntretiensEnAttente();
  const { data: invitationsPartenariat } = useInvitationsRecues();

  // Permissions strictes du membre. Si le profil API est indisponible
  // (ex. maintenance), on réutilise le dernier snapshot en session —
  // JAMAIS un jeu de droits élargi.
  const permissions = (() => {
    if (Array.isArray(profil?.permissions)) return profil.permissions;
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem("internin_membre_perms");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.permissions) ? parsed.permissions : [];
    } catch {
      return [];
    }
  })();
  const has = (cle) => permissions.includes(cle);

  const aTraiter = evaluations?.filter(
    (e) =>
      e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard",
  ).length;
  const nbReprogrammation = enAttente?.reprogrammation ?? 0;

  // Toujours visible : tableau de bord
  const items = [
    { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
  ];

  // —— Recrutement (permissions entreprise) ——
  if (has("offres.gerer")) {
    items.push({
      href: "/offres-entreprise",
      label: t("sidebar.internshipOffers"),
      icon: FiBriefcase,
      badge: offres?.filter((o) => o.statut === "publie").length || undefined,
      section: "gestion",
    });
  }
  if (has("candidats.gerer")) {
    items.push({
      href: "/candidats",
      label: t("sidebar.applications"),
      icon: FiUsers,
      badge:
        nbReprogrammation > 0
          ? nbReprogrammation
          : candidatures?.length || undefined,
      badgePulseColor: nbReprogrammation > 0 ? "#F97316" : null,
      section: "gestion",
    });
  }
  if (has("talents.voir") || has("talents.proposer")) {
    items.push({
      href: "/talents",
      label: t("sidebar.talents"),
      icon: FiUserPlus,
      section: "gestion",
    });
  }
  if (has("conventions.voir") || has("conventions.gerer") || has("stagiaires.suivre")) {
    items.push({
      href: "/conventions-entreprise",
      label: "Conventions",
      icon: FiFileText,
      section: "gestion",
    });
  }
  if (has("entretiens.gerer")) {
    items.push({
      href: "/entretiens-entreprise",
      label: t("sidebar.interviews"),
      icon: FiCalendar,
      badge:
        entretiens?.filter((e) => e.statut === "confirme").length || undefined,
      section: "gestion",
    });
  }
  if (has("partenariats.gerer")) {
    items.push({
      href: "/partenariats-universites",
      label: t("sidebar.universityPartnerships"),
      icon: FiUserCheck,
      badge: invitationsPartenariat?.length || undefined,
      section: "gestion",
    });
  }

  // —— Supervision ——
  if (
    has("stagiaires.suivre") ||
    has("stagiaires.evaluer") ||
    has("stagiaires.terminer")
  ) {
    items.push({
      href: "/mes-stagiaires",
      label: t("sidebar.myInterns"),
      icon: FiUsers,
      badge: stagiaires?.length || undefined,
      section: "supervision",
    });
  }
  if (has("stagiaires.evaluer")) {
    items.push({
      href: "/mes-stagiaires/evaluations",
      label: t("sidebar.evaluations"),
      icon: FiClipboard,
      badge: aTraiter || undefined,
      section: "supervision",
    });
  }
  // Calendrier utile dès qu'il y a du suivi ou des entretiens
  if (
    has("stagiaires.suivre") ||
    has("stagiaires.evaluer") ||
    has("entretiens.gerer")
  ) {
    items.push({
      href: "/calendrier-supervision",
      label: "Calendrier",
      icon: FiCalendar,
      section: "supervision",
    });
  }

  // —— Administration ——
  if (has("equipe.gerer")) {
    items.push({
      href: "/equipe",
      label: t("sidebar.team"),
      icon: FiUserPlus,
      section: "entreprise",
    });
  }

  // Messages : toujours proposés aux membres actifs (pas de permission dédiée)
  items.push({
    href: "/messages-entreprise",
    label: t("sidebar.messages"),
    icon: FiMessageSquare,
    section: "entreprise",
  });

  return items;
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
  const { data: securityOverview } = useSecurityOverview({
    refetchInterval: 60_000,
  });
  const { data: notifUnread } = useNotificationsNonLuesCount();
  const { data: adminProfile } = useAdminProfile();
  const scopes = adminProfile?.scopes || [];
  const secEtat = securityOverview?.etat || "securisee";
  const secAlert = secEtat === "critique" || secEtat === "attention";

  const items = [
    // —— PILOTAGE ——
    {
      href: "/tableau-de-bord",
      label: t("sidebar.dashboard"),
      icon: FiGrid,
      section: "pilotage",
    },
    {
      href: "/gestion-stages",
      label: t("sidebar.internshipFiles"),
      icon: FiMonitor,
      section: "pilotage",
    },
    {
      href: "/gestion-conventions",
      label: t("sidebar.conventions"),
      icon: FiFileText,
      section: "pilotage",
    },

    // —— GESTION ——
    {
      href: "/verifications/offres-finales",
      label: t("sidebar.internshipOffers"),
      icon: FiAward,
      badge: stats?.offresEnAttente,
      badgeTone: stats?.offresEnAttente > 0 ? "warning" : undefined,
      section: "gestion",
    },
    {
      href: "/gestion-entreprises",
      label: t("sidebar.companiesMgmt"),
      icon: Building2,
      badge: stats?.entitesNonVerifiees?.entreprises,
      badgeTone:
        stats?.entitesNonVerifiees?.entreprises > 0 ? "warning" : undefined,
      section: "gestion",
    },
    {
      href: "/gestion-universites",
      label: t("sidebar.universitiesMgmt"),
      icon: FiHome,
      badge: stats?.entitesNonVerifiees?.universites,
      badgeTone:
        stats?.entitesNonVerifiees?.universites > 0 ? "warning" : undefined,
      section: "gestion",
    },
    {
      href: "/utilisateurs",
      label: t("sidebar.users"),
      icon: FiUsers,
      section: "gestion",
    },

    // —— SURVEILLANCE ——
    {
      href: "/centre-controle",
      label: t("sidebar.controlCenter"),
      icon: FiActivity,
      section: "surveillance",
    },
    {
      href: "/centre-securite",
      label: t("sidebar.securityCenter"),
      icon: FiShield,
      section: "surveillance",
      // Badge numérique si incidents critiques, sinon "!" en attention
      badge:
        secEtat === "critique"
          ? securityOverview?.kpi?.comptesSuspectsCritiques ||
            securityOverview?.kpi?.comptesSuspects ||
            "!"
          : secEtat === "attention"
            ? securityOverview?.kpi?.comptesSuspects || "!"
            : undefined,
      badgeTone:
        secEtat === "critique"
          ? "danger"
          : secEtat === "attention"
            ? "warning"
            : undefined,
      dot: secAlert,
      dotColor: secEtat === "critique" ? "#ef4444" : "#f59e0b",
    },
    {
      href: "/centre-notifications",
      label: t("sidebar.notificationsCenter"),
      icon: FiBell,
      section: "surveillance",
      // Notifications non lues destinées à CET admin (COUNT SQL) — ≠ anomalies / sécurité
      badge: (() => {
        const n = Number(
          notifUnread?.nonLues ??
            notifUnread?.count ??
            (typeof notifUnread === "number" ? notifUnread : 0),
        );
        return n > 0 ? n : undefined;
      })(),
      badgeTone: (() => {
        const n = Number(
          notifUnread?.nonLues ??
            notifUnread?.count ??
            (typeof notifUnread === "number" ? notifUnread : 0),
        );
        return n > 0 ? "warning" : undefined;
      })(),
    },
    {
      href: "/signalements",
      label: t("sidebar.flaggedReports"),
      icon: FiAlertTriangle,
      badge: stats?.signalementsOuverts,
      badgeTone: stats?.signalementsOuverts > 0 ? "danger" : undefined,
      section: "surveillance",
    },

    // —— TRAÇABILITÉ ——
    {
      href: "/journal-audit",
      label: t("sidebar.auditLog"),
      icon: FiClock,
      section: "tracabilite",
    },

    // —— CONFIGURATION ——
    {
      href: "/parametres-admin",
      label: t("sidebar.settings"),
      icon: FiSettings,
      section: "configuration",
    },
  ];

  if (!adminProfile) return items;
  return items.filter((item) => adminCanAccessHref(scopes, item.href));
}

