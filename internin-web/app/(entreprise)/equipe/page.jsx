"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLoader,
  FiInbox,
  FiSearch,
  FiGrid,
  FiList,
  FiUsers,
  FiX,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EquipeFiltres from "@/components/features/equipe/EquipeFiltres";
import EquipeStats from "@/components/features/equipe/EquipeStats";
import MembreRow from "@/components/features/equipe/MembreRow";
import MembreCard from "@/components/features/equipe/MembreCard";
import InviterMembreDialog from "@/components/features/equipe/InviterMembreDialog";
import MembreDetailDialog from "@/components/features/equipe/MembreDetailDialog";
import AffectationsPanel from "@/components/features/equipe/AffectationsPanel";
import ActivitePanel from "@/components/features/equipe/ActivitePanel";
import ParametresEquipePanel from "@/components/features/equipe/ParametresEquipePanel";
import { useMembresEquipe } from "@/lib/queries/useEquipe";

const ONGLETS = [
  { value: "membres", label: "Membres" },
  { value: "affectations", label: "Affectations" },
  { value: "activite", label: "Activité" },
  { value: "parametres", label: "Paramètres" },
];

function MembreSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-md border border-border bg-card p-5"
        >
          <Skeleton className="mb-3 h-14 w-14 rounded-full" />
          <Skeleton className="mb-1.5 h-4 w-28" />
          <Skeleton className="mb-4 h-3 w-36" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MembreSkeletonList() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.6fr_1.1fr_1fr_1.2fr] items-center gap-3 border-b border-border px-3 py-3.5 last:border-b-0"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="flex justify-end gap-1.5">
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EquipePage() {
  const [onglet, setOnglet] = useState("membres");
  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [membreOuvert, setMembreOuvert] = useState(null);
  const [vue, setVue] = useState("grille"); // "grille" | "liste"

  // Liste filtrée (onglet Membres)
  const { data: membres, isLoading } = useMembresEquipe({
    recherche: recherche || undefined,
    role: role !== "tous" ? role : undefined,
    statut: statut !== "tous" ? statut : undefined,
  });

  // Stats globales fixes (sans filtres) — même hook, clé de cache différente
  const { data: membresStats, isLoading: isLoadingStats } = useMembresEquipe({});

  const liste = membres || [];
  const listeStats = membresStats || [];
  const hasFiltres = Boolean(recherche || role !== "tous" || statut !== "tous");

  function reinitialiserFiltres() {
    setRecherche("");
    setRole("tous");
    setStatut("tous");
  }

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Équipe" }]}
        subtitle="Membres et rôles de votre équipe de recrutement"
        refreshKeys={["membresEquipe", "activitesEquipe"]}
      />

      <div className="px-4 py-6 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Équipe
              </h1>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Gérez les membres qui collaborent avec votre entreprise.
              </p>
            </div>
            <InviterMembreDialog />
          </div>

          {/* Stats fixes — visibles sur tous les onglets */}
          {!isLoadingStats && listeStats.length > 0 && (
            <EquipeStats membres={listeStats} />
          )}
        </motion.div>

        {/* Onglets */}
        <div className="mb-5 flex flex-wrap gap-1 border-b border-border">
          {ONGLETS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOnglet(o.value)}
              className={`relative border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${
                onglet === o.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {onglet === "membres" && (
          <>
            {/* Barre d'actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="relative max-w-md flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  className="h-10 rounded-md pl-10 pr-9 transition focus:ring-2 focus:ring-primary/20"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  aria-label="Rechercher un membre"
                />
                {recherche && (
                  <button
                    type="button"
                    onClick={() => setRecherche("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Effacer la recherche"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <EquipeFiltres
                  role={role}
                  onRoleChange={setRole}
                  statut={statut}
                  onStatutChange={setStatut}
                />

                {/* Toggle grille / liste */}
                <div className="flex items-center rounded-md border border-border bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => setVue("grille")}
                    aria-label="Vue grille"
                    aria-pressed={vue === "grille"}
                    className={`flex h-8 w-8 items-center justify-center rounded-sm transition ${
                      vue === "grille"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FiGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVue("liste")}
                    aria-label="Vue liste"
                    aria-pressed={vue === "liste"}
                    className={`flex h-8 w-8 items-center justify-center rounded-sm transition ${
                      vue === "liste"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FiList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Contenu */}
            {isLoading && (
              vue === "grille" ? <MembreSkeletonGrid /> : <MembreSkeletonList />
            )}

            {!isLoading && liste.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  {hasFiltres ? (
                    <FiSearch className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <FiUsers className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {hasFiltres ? (
                  <>
                    <h3 className="text-sm font-bold text-foreground">
                      Aucun membre trouvé
                    </h3>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      Essayez avec un autre nom, email ou filtre.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 rounded-md"
                      onClick={reinitialiserFiltres}
                    >
                      Effacer les filtres
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-foreground">
                      Votre équipe est encore vide
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Invitez vos collaborateurs pour commencer à travailler
                      ensemble sur InternIn.
                    </p>
                    <div className="mt-4">
                      <InviterMembreDialog />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {!isLoading && liste.length > 0 && (
              <AnimatePresence mode="wait">
                {vue === "grille" ? (
                  <motion.div
                    key="grille"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {liste.map((m, i) => (
                      <MembreCard
                        key={m.idMembre}
                        membre={m}
                        index={i}
                        onOuvrirDetail={setMembreOuvert}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="liste"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden rounded-md border border-border bg-card"
                  >
                    <div className="grid grid-cols-[1.6fr_1.1fr_1fr_1.2fr] gap-3 border-b border-border bg-muted/40 px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <span>Membre</span>
                      <span>Rôle</span>
                      <span>Statut</span>
                      <span className="text-right">Actions</span>
                    </div>
                    {liste.map((m, i) => (
                      <MembreRow
                        key={m.idMembre}
                        membre={m}
                        index={i}
                        onOuvrirDetail={setMembreOuvert}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </>
        )}

        {onglet === "affectations" && <AffectationsPanel />}
        {onglet === "activite" && <ActivitePanel />}
        {onglet === "parametres" && <ParametresEquipePanel />}
      </div>

      <MembreDetailDialog
        membre={membreOuvert}
        onClose={() => setMembreOuvert(null)}
      />
    </>
  );
}
