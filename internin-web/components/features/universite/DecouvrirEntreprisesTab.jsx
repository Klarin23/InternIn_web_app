"use client";

import { useState } from "react";
import {
  FiSearch,
  FiLoader,
  FiSend,
  FiCheck,
  FiClock,
  FiMapPin,
  FiBriefcase,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEntreprisesDecouvrir,
  useEnvoyerInvitation,
} from "@/lib/queries/usePartenariats";
import { useTranslation } from "@/lib/i18n/useTranslation";

function initiales(nom) {
  const mots = String(nom || "")
    .trim()
    .split(/\s+/);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

function ActionInvitation({ entreprise, onOuvrirDialog, t }) {
  const statut = entreprise.partenariat?.statut;

  if (statut === "acceptee") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
        <FiCheck className="h-3.5 w-3.5" aria-hidden />
        {t("universiteSpace.discoverCompanies.partner")}
      </span>
    );
  }
  if (statut === "en_attente") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <FiClock className="h-3.5 w-3.5" aria-hidden />
        {t("universiteSpace.discoverCompanies.invitationSent")}
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-lg"
      onClick={() => onOuvrirDialog(entreprise)}
    >
      <FiSend className="h-3.5 w-3.5" aria-hidden />
      {statut === "refusee"
        ? t("universiteSpace.discoverCompanies.resendInvitation")
        : t("universiteSpace.discoverCompanies.invite")}
    </Button>
  );
}

export default function DecouvrirEntreprisesTab() {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [cible, setCible] = useState(null);
  const [message, setMessage] = useState("");
  const { data: entreprises, isLoading, isError, error, refetch } =
    useEntreprisesDecouvrir(recherche);
  const mutation = useEnvoyerInvitation();

  function ouvrirDialog(entreprise) {
    setCible(entreprise);
    setMessage("");
    mutation.reset();
  }

  function envoyer() {
    if (!cible) return;
    mutation.mutate(
      { idEntreprise: cible.idEntreprise, message },
      { onSuccess: () => setCible(null) },
    );
  }

  const list = Array.isArray(entreprises) ? entreprises : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("universiteSpace.companies.discoverTitle") ||
            t("universiteSpace.companies.tabs.discover")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("universiteSpace.companies.discoverSubtitle")}
        </p>
      </div>

      <div className="relative max-w-md">
        <FiSearch
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t(
            "universiteSpace.discoverCompanies.searchPlaceholder",
          )}
          aria-label={t(
            "universiteSpace.discoverCompanies.searchPlaceholder",
          )}
          className="h-11 rounded-xl pl-9"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <FiLoader className="h-5 w-5 animate-spin" />
          {t("universiteSpace.discoverCompanies.loading")}
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 text-sm text-destructive">
          {error?.message || t("universiteSpace.companies.loadError")}
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => refetch()}
            >
              {t("universiteSpace.companies.retry")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <FiBriefcase className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {recherche
              ? t("universiteSpace.companies.emptySearch")
              : t("universiteSpace.discoverCompanies.empty")}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {recherche
              ? t("universiteSpace.companies.emptySearchDesc")
              : t("universiteSpace.companies.discoverEmptyDesc")}
          </p>
        </div>
      )}

      {!isLoading && !isError && list.length > 0 && (
        <div className="space-y-3">
          {list.map((e) => (
            <div
              key={e.idEntreprise}
              className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#5B3DF5]/10 text-sm font-bold text-[#5B3DF5] dark:text-[#A78BFA]">
                  {initiales(e.nomEntreprise)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {e.nomEntreprise}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <span>
                      {e.secteurActivite ||
                        t("universiteSpace.discoverCompanies.sectorMissing")}
                    </span>
                    {e.ville ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <FiMapPin className="h-3 w-3" aria-hidden />
                          {e.ville}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <ActionInvitation
                entreprise={e}
                onOuvrirDialog={ouvrirDialog}
                t={t}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!cible} onOpenChange={(open) => !open && setCible(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {t("universiteSpace.discoverCompanies.dialogTitle", {
                company: cible?.nomEntreprise || "",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t("universiteSpace.discoverCompanies.dialogDescription")}
            </p>
            <textarea
              rows={4}
              placeholder={t(
                "universiteSpace.discoverCompanies.messagePlaceholder",
              )}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
            />
            {mutation.isError && (
              <p className="text-xs text-destructive">
                {mutation.error?.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCible(null)}
              >
                {t("universiteSpace.discoverCompanies.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={mutation.isPending}
                onClick={envoyer}
                className="rounded-lg"
              >
                {mutation.isPending ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  t("universiteSpace.discoverCompanies.send")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
