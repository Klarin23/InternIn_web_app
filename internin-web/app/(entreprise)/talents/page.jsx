"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { UsersRound } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useCompetences } from "@/lib/queries/useCompetences";
import { toast } from "@/lib/store/useToastStore";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import TalentCard from "@/components/features/talents/TalentCard";
import TalentSearch from "@/components/features/talents/TalentSearch";
import TalentFilters from "@/components/features/talents/TalentFilters";
import { TalentGridSkeleton } from "@/components/features/talents/TalentSkeleton";
import TalentEmptyState from "@/components/features/talents/TalentEmptyState";
import TalentPreviewPanel from "@/components/features/talents/TalentPreviewPanel";
import TalentProposeDialog from "@/components/features/talents/TalentProposeDialog";
import TalentProposals from "@/components/features/talents/TalentProposals";

const DEFAULT_FILTERS = {
  disponibilite: "",
  localisation: "",
  competence: "",
  sort: "completude",
};

export default function TalentsPage() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const { hasPermission } = usePermissions();
  const canPropose = hasPermission("talents.proposer");
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [pageState, setPageState] = useState({ page: 1, key: null });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedLocalisation = useDebouncedValue(filters.localisation, 350);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: offres } = useMesOffres();
  const { data: competencesRef } = useCompetences();
  const offresActives = useMemo(
    () => (offres || []).filter((o) => o.statut === "publie"),
    [offres],
  );

  // Clé de filtres : si elle change, la page affichée redevient 1 (sans useEffect)
  const filterKey = useMemo(
    () =>
      [
        debouncedSearch,
        filters.disponibilite,
        filters.competence,
        filters.sort,
        debouncedLocalisation,
      ].join("\0"),
    [
      debouncedSearch,
      filters.disponibilite,
      filters.competence,
      filters.sort,
      debouncedLocalisation,
    ],
  );
  const page =
    pageState.key === filterKey || pageState.key === null
      ? pageState.page
      : 1;
  const setPage = (p) => setPageState({ page: p, key: filterKey });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      "talents",
      debouncedSearch,
      page,
      filters.disponibilite,
      filters.competence,
      filters.sort,
      debouncedLocalisation,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.disponibilite)
        params.set("disponibilite", filters.disponibilite);
      if (debouncedLocalisation)
        params.set("localisation", debouncedLocalisation);
      if (filters.competence) params.set("competence", filters.competence);
      if (filters.sort) params.set("sort", filters.sort);
      return apiFetch(`/propositions/talents?${params}`, { token });
    },
    enabled: !!token,
  });

  const talents = Array.isArray(data?.data) ? data.data : [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const isSearching =
    search !== debouncedSearch ||
    filters.localisation !== debouncedLocalisation ||
    (isFetching && !isLoading);

  function openPreview(talent) {
    setSelectedTalent(talent);
    setPreviewOpen(true);
  }

  function openPropose(talent) {
    setSelectedTalent(talent);
    setProposeOpen(true);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setPage(1);
  }

  async function handleSendProposition({ idOffre, message }) {
    if (!selectedTalent) return;
    setSending(true);
    try {
      await apiFetch("/propositions", {
        method: "POST",
        body: {
          idStagiaire: selectedTalent.idStagiaire,
          idOffre,
          message: message?.trim() || undefined,
        },
        token,
      });
      toast.success(t("talents.page.proposalSent"));
      queryClient.invalidateQueries({ queryKey: ["propositions-entreprise"] });
    } catch (err) {
      toast.error(t("talents.page.proposalSendError"));
      throw err;
    } finally {
      setSending(false);
    }
  }

  const hasActiveCriteria =
    !!debouncedSearch ||
    !!filters.disponibilite ||
    !!filters.competence ||
    !!debouncedLocalisation;

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: t("talents.page.title") }]}
        title={t("talents.page.title")}
        subtitle={t("talents.page.subtitle")}
      />

      <div className="space-y-6 p-4 md:p-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersRound className="size-4 shrink-0" aria-hidden />
            <span>
              {isLoading
                ? "…"
                : hasActiveCriteria
                  ? `${t(total !== 1 ? "talents.page.matchingOther" : "talents.page.matchingOne", { count: total })}`
                  : t(total !== 1 ? "talents.page.availableOther" : "talents.page.availableOne", { count: total })}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.22,
            delay: reduceMotion ? 0 : 0.04,
          }}
          className="space-y-3"
        >
          <TalentSearch
            value={search}
            onChange={setSearch}
            isSearching={isSearching}
          />
          <TalentFilters
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            competenceSuggestions={
              Array.isArray(competencesRef) ? competencesRef : []
            }
          />
        </motion.div>

        <TalentProposals token={token} />

        {isLoading ? (
          <TalentGridSkeleton />
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <p className="font-medium text-foreground">
              {t("talents.page.loadError")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error?.message ||
                t("talents.page.loadErrorDetail")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => refetch()}
            >
              {t("talents.page.retry")}
            </Button>
          </div>
        ) : talents.length === 0 ? (
          <TalentEmptyState
            hasSearch={hasActiveCriteria}
            onClear={resetFilters}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {talents.map((t, i) => (
              <TalentCard
                key={t.idStagiaire}
                talent={t}
                index={i}
                onView={openPreview}
                onPropose={openPropose}
                canPropose={canPropose}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("talents.page.prev")}
            </Button>
            <span className="flex items-center px-3 text-sm tabular-nums text-muted-foreground">
              {t("talents.page.pageOf", { page, total: totalPages })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("talents.page.next")}
            </Button>
          </div>
        )}
      </div>

      <TalentPreviewPanel
        talent={selectedTalent}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onPropose={openPropose}
                canPropose={canPropose}
      />

      <TalentProposeDialog
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        talent={selectedTalent}
        offresActives={offresActives}
        onSubmit={handleSendProposition}
        sending={sending}
      />
    </>
  );
}
