"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/store/useToastStore";
import { STATUT_LABELS, estSupprimable } from "./talentUtils";
import { usePermissions } from "@/hooks/usePermissions";

export default function TalentProposals({ token }) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("talents.proposer");
  const [deletingId, setDeletingId] = useState(null);
  const reduceMotion = useReducedMotion();

  const { data: propositions, isLoading } = useQuery({
    queryKey: ["propositions-entreprise"],
    queryFn: () => apiFetch("/propositions/entreprise", { token }),
    enabled: !!token,
  });

  async function handleDelete(prop) {
    const ok = window.confirm(
      t("talents.proposals.confirmDelete", {
        name: `${prop.prenom} ${prop.nom}`,
        offer: prop.titreOffre,
      }),
    );
    if (!ok) return;
    setDeletingId(prop.idProposition);
    try {
      await apiFetch(`/propositions/${prop.idProposition}`, {
        method: "DELETE",
        token,
      });
      toast.success(t("talents.proposals.deleted"));
      queryClient.invalidateQueries({ queryKey: ["propositions-entreprise"] });
    } catch (err) {
      toast.error(err?.message || t("talents.proposals.deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  if (!isLoading && (!propositions || propositions.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {t("talents.proposals.sentTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("talents.proposals.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <ul className="divide-y divide-border/60">
            {propositions.map((p, index) => {
              const statutInfo = STATUT_LABELS[p.statut] || {
                label: p.statut,
                className: "bg-muted text-muted-foreground",
              };
              const supprimable = canManage && estSupprimable(p.statut);
              return (
                <motion.li
                  key={p.idProposition}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.2,
                    delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.15),
                  }}
                  className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.prenom} {p.nom}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        — {p.titreOffre}
                      </span>
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statutInfo.className}`}
                    >
                      {statutInfo.labelKey ? t(statutInfo.labelKey) : statutInfo.label}
                    </span>
                    {p.statut === "refusee" && p.commentaireReponse && (
                      <div className="mt-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                          {t("talents.proposals.internReason")}
                        </p>
                        <p className="italic text-foreground/90">
                          « {p.commentaireReponse} »
                        </p>
                        {p.dateReponse && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {new Date(p.dateReponse).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {supprimable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === p.idProposition}
                      onClick={() => handleDelete(p)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {deletingId === p.idProposition
                        ? t("talents.proposals.deleting")
                        : t("talents.proposals.delete")}
                    </Button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
