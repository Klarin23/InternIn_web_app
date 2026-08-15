"use client";

/**
 * Recherche globale (AppHeader) — active sur tous les espaces.
 *
 * - Navigation du rôle (liste statique, sans déclencher d'API)
 * - Entités déjà en cache React Query (stagiaires, offres, candidatures…)
 * - Raccourci Ctrl/Cmd + K
 * - Clavier : ↑↓ Entrée Échap
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiX,
  FiGrid,
  FiUsers,
  FiClipboard,
  FiArrowRight,
  FiFileText,
  FiBriefcase,
  FiCalendar,
  FiHome,
  FiSettings,
  FiUser,
  FiUserPlus,
  FiAward,
  FiMessageSquare,
  FiBarChart2,
  FiUserCheck,
  FiAlertTriangle,
} from "react-icons/fi";
import { Building2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/** Menus de navigation par rôle — miroir de useNavItems, sans hooks de données */
function getStaticNavForRole(type, t) {
  switch (type) {
    case "stagiaire":
      return [
        { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
        { href: "/offres", label: t("sidebar.internshipOffers"), icon: FiBriefcase },
        { href: "/candidatures", label: t("sidebar.applications"), icon: FiFileText },
        { href: "/entretiens", label: t("sidebar.interviews"), icon: FiCalendar },
        { href: "/stage", label: t("sidebar.myInternship"), icon: FiBriefcase },
        { href: "/certificats", label: t("sidebar.certificates"), icon: FiAward },
        { href: "/messages", label: t("sidebar.messages"), icon: FiMessageSquare },
        { href: "/profil", label: t("sidebar.myProfile"), icon: FiUser },
      ];
    case "entreprise":
      return [
        { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
        { href: "/offres-entreprise", label: t("sidebar.internshipOffers"), icon: FiBriefcase },
        { href: "/candidats", label: t("sidebar.applications"), icon: FiUsers },
        { href: "/entretiens-entreprise", label: t("sidebar.interviews"), icon: FiCalendar },
        { href: "/partenariats-universites", label: t("sidebar.universityPartnerships"), icon: FiUserCheck },
        { href: "/supervision/mes-stagiaires", label: t("sidebar.myInterns") || "Mes stagiaires", icon: FiUsers },
        { href: "/supervision/evaluations", label: t("sidebar.evaluations") || "Évaluations", icon: FiClipboard },
        { href: "/supervision/calendrier", label: "Calendrier", icon: FiCalendar },
        { href: "/suivi-stagiaires", label: t("sidebar.internTracking"), icon: FiBarChart2 },
        { href: "/messages-entreprise", label: t("sidebar.messages"), icon: FiMessageSquare },
        { href: "/equipe", label: t("sidebar.team"), icon: FiUserPlus },
        { href: "/profil-entreprise", label: "Mon profil", icon: Building2 },
        { href: "/parametres-entreprise", label: t("sidebar.settings"), icon: FiSettings },
      ];
    case "membre_entreprise":
      return [
        { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
        { href: "/mes-stagiaires", label: t("sidebar.myInterns"), icon: FiUsers },
        { href: "/mes-stagiaires/evaluations", label: t("sidebar.evaluations"), icon: FiClipboard },
        { href: "/calendrier-supervision", label: "Calendrier", icon: FiCalendar },
      ];
    case "universite":
      return [
        { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
        { href: "/etudiants-universite", label: t("sidebar.studentsUniv"), icon: FiUsers },
        { href: "/entreprises-universite", label: t("sidebar.companiesUniv"), icon: FiBriefcase },
        { href: "/conventions", label: t("sidebar.conventions"), icon: FiFileText },
        { href: "/maitres-de-stage", label: t("sidebar.internshipSupervisors"), icon: FiUserPlus },
        { href: "/rapports", label: t("sidebar.reports"), icon: FiClipboard },
        { href: "/statistiques", label: t("sidebar.statistics"), icon: FiBarChart2 },
        { href: "/parametres-universite", label: t("sidebar.settings"), icon: FiSettings },
      ];
    case "administrateur":
      return [
        { href: "/tableau-de-bord", label: t("sidebar.dashboard"), icon: FiGrid },
        { href: "/verifications/offres-finales", label: t("sidebar.internshipOffers"), icon: FiFileText },
        { href: "/gestion-universites", label: t("sidebar.universitiesMgmt"), icon: FiHome },
        { href: "/gestion-entreprises", label: t("sidebar.companiesMgmt"), icon: FiBriefcase },
        { href: "/utilisateurs", label: t("sidebar.users"), icon: FiUsers },
        { href: "/signalements", label: t("sidebar.flaggedReports"), icon: FiAlertTriangle },
        { href: "/parametres-admin", label: t("sidebar.settings"), icon: FiSettings },
      ];
    default:
      return [];
  }
}

function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function scoreMatch(query, text) {
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => t.includes(w))) return 40;
  return 0;
}

function ResultIcon({ type }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "nav":
      return <FiGrid className={cls} />;
    case "stagiaire":
      return <FiUsers className={cls} />;
    case "offre":
      return <FiBriefcase className={cls} />;
    case "candidature":
      return <FiFileText className={cls} />;
    default:
      return <FiSearch className={cls} />;
  }
}

function collectCachedEntities(queryClient, type, q) {
  const results = [];

  const stagiaires =
    queryClient.getQueryData(["mesStagiaires"]) || null;
  if (Array.isArray(stagiaires)) {
    for (const s of stagiaires) {
      const nom = `${s.prenom || ""} ${s.nom || ""}`.trim();
      const hay = `${nom} ${s.formation || ""} ${s.poste || ""} ${s.universite || ""}`;
      const score = scoreMatch(q, hay);
      if (score <= 0 || s.idStage == null) continue;
      const href =
        type === "entreprise"
          ? `/supervision/mes-stagiaires/${s.idStage}`
          : `/mes-stagiaires/${s.idStage}`;
      // Uniquement pour les rôles qui ont accès à ces routes
      if (type !== "entreprise" && type !== "membre_entreprise") continue;
      results.push({
        id: `stagiaire-${s.idStage}`,
        type: "stagiaire",
        label: nom || "Stagiaire",
        description: s.formation || s.poste || s.statutStage || "Stagiaire",
        href,
        score: score + 15,
      });
    }
  }

  if (type === "entreprise") {
    const offres = queryClient.getQueryData(["mesOffres"]);
    if (Array.isArray(offres)) {
      for (const o of offres) {
        const score = scoreMatch(q, `${o.titre || ""} ${o.departement || ""}`);
        if (score <= 0) continue;
        results.push({
          id: `offre-${o.idOffre}`,
          type: "offre",
          label: o.titre || "Offre",
          description: o.statut || "Offre de stage",
          href: o.idOffre ? `/offres-entreprise/${o.idOffre}` : "/offres-entreprise",
          score,
        });
      }
    }

    const candidatures = queryClient.getQueryData(["candidaturesEntreprise"]);
    if (Array.isArray(candidatures)) {
      for (const c of candidatures.slice(0, 80)) {
        const nom = `${c.prenom || c.stagiaire?.prenom || ""} ${c.nom || c.stagiaire?.nom || ""}`.trim();
        const titre = c.titreOffre || c.offre?.titre || "";
        const score = scoreMatch(q, `${nom} ${titre} ${c.statut || ""}`);
        if (score <= 0) continue;
        results.push({
          id: `cand-${c.idCandidature}`,
          type: "candidature",
          label: nom || "Candidature",
          description: titre || c.statut || "Candidature",
          href: "/candidats",
          score,
        });
      }
    }
  }

  if (type === "stagiaire") {
    const offres = queryClient.getQueryData(["offres"]);
    const list = Array.isArray(offres)
      ? offres
      : Array.isArray(offres?.offres)
        ? offres.offres
        : [];
    for (const o of list.slice(0, 80)) {
      const score = scoreMatch(
        q,
        `${o.titre || ""} ${o.nomEntreprise || o.entreprise?.nomEntreprise || ""} ${o.ville || ""}`,
      );
      if (score <= 0) continue;
      results.push({
        id: `offre-pub-${o.idOffre}`,
        type: "offre",
        label: o.titre || "Offre",
        description:
          o.nomEntreprise || o.entreprise?.nomEntreprise || o.ville || "Offre",
        href: o.idOffre ? `/offres/${o.idOffre}` : "/offres",
        score,
      });
    }
  }

  return results;
}

export default function GlobalSearch({ className, placeholder }) {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const type = user?.typeUtilisateur;
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const placeholderText =
    placeholder || t("header.searchPlaceholder") || "Rechercher...";

  const navItems = useMemo(
    () => getStaticNavForRole(type, t),
    [type, t],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const navResults = (navItems || [])
      .map((item) => {
        const score = scoreMatch(q, item.label);
        if (score <= 0) return null;
        return {
          id: `nav-${item.href}`,
          type: "nav",
          label: item.label,
          description: t("header.searchNavigation") || "Menu",
          href: item.href,
          icon: item.icon,
          score,
        };
      })
      .filter(Boolean);

    const entities = collectCachedEntities(queryClient, type, q);

    const merged = [...navResults, ...entities];
    merged.sort((a, b) => b.score - a.score);

    const seen = new Set();
    const unique = [];
    for (const r of merged) {
      const key = `${r.href}::${r.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(r);
    }
    return unique.slice(0, 12);
  }, [query, navItems, queryClient, type, t]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = useCallback(
    (href) => {
      if (!href) return;
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) goTo(r.href);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[360px]", className)}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground transition-shadow",
          open && "ring-2 ring-primary/30",
        )}
      >
        <FiSearch className="h-4 w-4 flex-shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholderText}
          className="w-full truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          aria-label={placeholderText}
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label={t("header.clearSearch") || "Effacer"}
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(420px,70vh)] overflow-y-auto rounded-xl border border-border bg-card py-2 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("header.noSearchResults") || "Aucun résultat"}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((r, i) => {
                const Icon = r.icon;
                return (
                  <li key={r.id} role="option" aria-selected={i === activeIndex}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => goTo(r.href)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                        i === activeIndex
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground hover:bg-muted/80",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          i === activeIndex
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {Icon ? (
                          <Icon className="h-4 w-4" />
                        ) : (
                          <ResultIcon type={r.type} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {r.label}
                        </span>
                        {r.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.description}
                          </span>
                        )}
                      </span>
                      <FiArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-50" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-1 border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            <span className="mr-3">↑↓ naviguer</span>
            <span className="mr-3">↵ ouvrir</span>
            <span>esc fermer</span>
          </div>
        </div>
      )}
    </div>
  );
}
