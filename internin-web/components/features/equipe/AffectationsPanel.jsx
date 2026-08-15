"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiLoader,
  FiInbox,
  FiX,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiBriefcase,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAffectations,
  useAffecterSuperviseur,
  useRetirerAffectation,
  useMembresEquipe,
} from "@/lib/queries/useEquipe";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: "easeOut" },
  }),
};

function StatMini({ icon: Icon, value, label, iconBg, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-md border border-border bg-card p-4 shadow-sm"
    >
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function AffectationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-[1.4fr_1.2fr_1.4fr_auto]"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function AffectationsPanel() {
  const { data: affectations, isLoading } = useAffectations();
  const { data: membresActifs } = useMembresEquipe({ statut: "actif" });
  const affecter = useAffecterSuperviseur();
  const retirer = useRetirerAffectation();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous"); // tous | affecte | non_affecte

  const liste = useMemo(() => {
    let items = affectations || [];
    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase();
      items = items.filter(
        (a) =>
          `${a.prenomStagiaire || ""} ${a.nomStagiaire || ""}`
            .toLowerCase()
            .includes(q) ||
          (a.titrePoste || "").toLowerCase().includes(q),
      );
    }
    if (filtre === "affecte") items = items.filter((a) => a.idMembre);
    if (filtre === "non_affecte") items = items.filter((a) => !a.idMembre);
    return items;
  }, [affectations, recherche, filtre]);

  const stats = useMemo(() => {
    const all = affectations || [];
    const affectes = all.filter((a) => a.idMembre).length;
    return {
      total: all.length,
      affectes,
      nonAffectes: all.length - affectes,
    };
  }, [affectations]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <AffectationSkeleton />
      </div>
    );
  }

  if (!affectations || affectations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FiBriefcase className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold text-foreground">
          Aucune affectation
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Les affectations de votre équipe apparaîtront ici lorsqu&apos;il y
          aura des stagiaires en poste.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground">Affectations</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gérez les superviseurs affectés à vos stagiaires en poste.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMini
          index={0}
          icon={FiUsers}
          value={stats.total}
          label="Stagiaires en poste"
          iconBg="bg-[#14b8a6] text-white"
        />
        <StatMini
          index={1}
          icon={FiUserCheck}
          value={stats.affectes}
          label="Affectés"
          iconBg="bg-emerald-500 text-white"
        />
        <StatMini
          index={2}
          icon={FiUserX}
          value={stats.nonAffectes}
          label="Non affectés"
          iconBg="bg-amber-500 text-white"
        />
      </div>

      {/* Actions bar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative max-w-md flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un stagiaire ou un poste..."
            className="h-10 rounded-md pl-10 pr-9"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher une affectation"
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
        <Select value={filtre} onValueChange={setFiltre}>
          <SelectTrigger className="h-10 w-full rounded-md sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous</SelectItem>
            <SelectItem value="affecte">Affectés</SelectItem>
            <SelectItem value="non_affecte">Non affectés</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Liste */}
      {liste.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12 text-center"
        >
          <FiSearch className="mb-3 h-6 w-6 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">
            Aucune affectation trouvée
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez de modifier votre recherche ou vos filtres.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 rounded-md"
            onClick={() => {
              setRecherche("");
              setFiltre("tous");
            }}
          >
            Effacer les filtres
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-md border border-border bg-card md:block">
            <div className="grid grid-cols-[1.6fr_1.4fr_1.4fr_0.6fr] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>Stagiaire</span>
              <span>Poste</span>
              <span>Superviseur affecté</span>
              <span className="text-right">Actions</span>
            </div>
            {liste.map((a, i) => (
              <motion.div
                key={a.idStage}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-[1.6fr_1.4fr_1.4fr_0.6fr] items-center gap-3 border-b border-border px-4 py-3.5 text-sm transition-colors hover:bg-muted/30 last:border-b-0"
              >
                <span className="truncate font-semibold text-foreground">
                  {a.prenomStagiaire} {a.nomStagiaire}
                </span>
                <span className="truncate text-muted-foreground">
                  {a.titrePoste || "—"}
                </span>
                <Select
                  value={a.idMembre || ""}
                  onValueChange={(idMembre) =>
                    affecter.mutate({ idStage: a.idStage, idMembre })
                  }
                  disabled={affecter.isPending}
                >
                  <SelectTrigger className="h-9 w-full rounded-md text-xs">
                    <SelectValue placeholder="Non affecté" />
                  </SelectTrigger>
                  <SelectContent>
                    {(membresActifs || []).map((m) => (
                      <SelectItem key={m.idMembre} value={m.idMembre}>
                        {m.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex justify-end">
                  {a.idMembre && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-md px-2 text-xs text-destructive hover:text-destructive"
                      disabled={retirer.isPending}
                      onClick={() => retirer.mutate(a.idStage)}
                      title="Retirer l'affectation"
                      aria-label="Retirer l'affectation"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {liste.map((a, i) => (
              <motion.div
                key={a.idStage}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="rounded-md border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {a.prenomStagiaire} {a.nomStagiaire}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.titrePoste || "Poste non renseigné"}
                    </p>
                  </div>
                  {a.idMembre && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 shrink-0 rounded-md px-2 text-destructive"
                      disabled={retirer.isPending}
                      onClick={() => retirer.mutate(a.idStage)}
                      aria-label="Retirer l'affectation"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <LabelLike>Superviseur</LabelLike>
                <Select
                  value={a.idMembre || ""}
                  onValueChange={(idMembre) =>
                    affecter.mutate({ idStage: a.idStage, idMembre })
                  }
                  disabled={affecter.isPending}
                >
                  <SelectTrigger className="mt-1 h-10 w-full rounded-md text-sm">
                    <SelectValue placeholder="Non affecté" />
                  </SelectTrigger>
                  <SelectContent>
                    {(membresActifs || []).map((m) => (
                      <SelectItem key={m.idMembre} value={m.idMembre}>
                        {m.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LabelLike({ children }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
