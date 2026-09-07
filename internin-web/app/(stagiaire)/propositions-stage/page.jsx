"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import {
  usePropositionsStagiaire,
  useUpdatePropositionStatut,
  countPropositionsEnAttente,
} from "@/lib/queries/usePropositionsStagiaire";

import PropositionsHero from "@/components/stagiaire/propositions/PropositionsHero";
import PropositionFilters from "@/components/stagiaire/propositions/PropositionFilters";
import PropositionCard from "@/components/stagiaire/propositions/PropositionCard";
import PropositionDetailDrawer from "@/components/stagiaire/propositions/PropositionDetailDrawer";
import PropositionDecisionDialog from "@/components/stagiaire/propositions/PropositionDecisionDialog";
import PropositionsEmpty from "@/components/stagiaire/propositions/PropositionsEmpty";
import PropositionsSkeleton from "@/components/stagiaire/propositions/PropositionsSkeleton";
import {
  countByFilter,
  filterList,
} from "@/components/stagiaire/propositions/propositionUtils";

export default function PropositionsStagePage() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePropositionsStagiaire();
  const updateMut = useUpdatePropositionStatut();

  const list = useMemo(
    () => (Array.isArray(data) ? data : data?.propositions || []),
    [data],
  );
  const pending = countPropositionsEnAttente(list);
  const counts = useMemo(() => countByFilter(list), [list]);

  const [filter, setFilter] = useState("toutes");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null); // "accept" | "refuse" | null

  const filtered = useMemo(
    () => filterList(list, filter),
    [list, filter],
  );

  // Marquer comme "vue" à l'ouverture du détail (comportement existant)
  useEffect(() => {
    if (!selected || selected.statut !== "envoyee") return;
    updateMut.mutate(
      { idProposition: selected.idProposition, statut: "vue" },
      {
        onSuccess: (updated) => {
          setSelected((s) =>
            s && s.idProposition === selected.idProposition
              ? { ...s, ...(updated || {}), statut: "vue" }
              : s,
          );
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volontairement uniquement à l'ouverture
  }, [selected?.idProposition]);

  const openDetail = useCallback((prop) => {
    setSelected(prop);
  }, []);

  const closeDetail = useCallback(() => {
    setSelected(null);
  }, []);

  async function handleDecision({ mode, commentaireReponse, silentToast }) {
    if (!selected || !mode) return;
    const statut = mode === "accept" ? "acceptee" : "refusee";
    // Laisser remonter l'erreur au dialog (états loading / error / success)
    await updateMut.mutateAsync({
      idProposition: selected.idProposition,
      statut,
      commentaireReponse:
        statut === "refusee" ? commentaireReponse || null : null,
      silentToast: !!silentToast || statut === "acceptee",
    });
    setSelected((s) =>
      s
        ? {
            ...s,
            statut,
            commentaireReponse:
              statut === "refusee" ? commentaireReponse : s.commentaireReponse,
          }
        : s,
    );
    // Refus : fermer le dialog. Acceptation : le dialog gère l'écran succès.
    if (mode === "refuse") {
      setConfirm(null);
    }
  }

  return (
    <>
      <AppHeader
        title={t("stagiaireSpace.propositions.title")}
        subtitle={t("stagiaireSpace.propositions.subtitle")}
      />

      <div className="w-full space-y-6 px-4 py-5 sm:px-6">
        <PropositionsHero pendingCount={pending} />

        <PropositionFilters
          filter={filter}
          onChange={setFilter}
          counts={counts}
        />

        {isLoading ? (
          <PropositionsSkeleton />
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <p className="font-semibold text-foreground">
              Impossible de charger les propositions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error?.message ||
                "Une erreur est survenue lors du chargement de vos propositions de stage."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Réessayer
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <PropositionsEmpty onRefresh={() => refetch()} />
        ) : (
          <motion.div
            layout={!reduce}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((prop, index) => (
                <PropositionCard
                  key={prop.idProposition}
                  prop={prop}
                  index={index}
                  onOpen={openDetail}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <PropositionDetailDrawer
        prop={selected}
        open={!!selected && !confirm}
        onClose={closeDetail}
        onAccept={() => setConfirm("accept")}
        onRefuse={() => setConfirm("refuse")}
        isUpdating={updateMut.isPending}
      />

      <PropositionDecisionDialog
        open={!!confirm}
        mode={confirm}
        prop={selected}
        pending={updateMut.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDecision}
      />
    </>
  );
}
