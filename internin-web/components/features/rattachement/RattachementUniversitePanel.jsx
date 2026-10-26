"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, Link2, Mail, RefreshCw, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  creerInvitationEtudiantRequest,
  getDemandesRattachementUniversiteRequest,
  confirmerDemandeRattachementRequest,
  refuserDemandeRattachementRequest,
  creerCodeRattachementRequest,
  creerLienRattachementRequest,
} from "@/lib/api/universites";

export default function RattachementUniversitePanel({ onChanged }) {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const [email, setEmail] = useState("");
  const [demandes, setDemandes] = useState([]);
  const [secret, setSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [loadedToken, setLoadedToken] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationRequiredToken, setVerificationRequiredToken] = useState(null);
  const verificationRequired = Boolean(token) && verificationRequiredToken === token;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleRequestError(err) {
    if (err?.code === "UNIVERSITE_NON_VERIFIEE") {
      setVerificationRequiredToken(token);
      setDemandes([]);
      setSecret(null);
      setError(null);
      setSuccess(null);
      return;
    }
    setError(err?.message || "Une erreur est survenue. Veuillez réessayer.");
  }

  async function loadDemandes() {
    if (!token) return;
    setLoadingDemandes(true);
    try {
      setDemandes(await getDemandesRattachementUniversiteRequest(token));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoadingDemandes(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    let active = true;
    getDemandesRattachementUniversiteRequest(token)
      .then((result) => {
        if (active) {
          setVerificationRequiredToken(null);
          setDemandes(result);
        }
      })
      .catch((err) => {
        if (active) handleRequestError(err);
      })
      .finally(() => {
        if (active) {
          setLoadedToken(token);
          setLoadingDemandes(false);
        }
      });

    return () => {
      active = false;
    };
  }, [handleRequestError, token]);

  async function invite() {
    setError(null);
    setSuccess(null);
    setSecret(null);
    setLoading(true);
    try {
      const result = await creerInvitationEtudiantRequest(email, token);
      setEmail("");
      setSuccess(t("universityLinking.university.inviteSuccess"));
      if (result?.dateExpiration) {
        setSuccess(
          t("universityLinking.university.inviteSuccessWithExpiry", {
            date: new Date(result.dateExpiration).toLocaleDateString(),
          }),
        );
      }
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await creerCodeRattachementRequest(token);
      setSecret({ type: "code", value: result.code, expires: result.dateExpiration });
      setSuccess(t("universityLinking.university.secretCreated"));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateLink() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await creerLienRattachementRequest(token);
      setSecret({ type: "link", value: result.lien, expires: result.dateExpiration });
      setSuccess(t("universityLinking.university.secretCreated"));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  }

  async function decide(id, action) {
    setError(null);
    try {
      if (action === "confirm") {
        await confirmerDemandeRattachementRequest(id, token);
      } else {
        await refuserDemandeRattachementRequest(id, token);
      }
      await loadDemandes();
      onChanged?.();
    } catch (err) {
      handleRequestError(err);
    }
  }

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess(t("universityLinking.university.copied"));
    } catch {
      setError(t("universityLinking.university.copyFailed"));
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          {t("universityLinking.university.eyebrow")}
        </p>
        <h2 className="text-xl font-bold text-foreground">
          {t("universityLinking.university.title")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("universityLinking.university.description")}
        </p>
      </div>

      {verificationRequired ? (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-foreground"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-semibold">{t("universityLinking.university.verificationRequiredTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("universityLinking.university.verificationRequiredMessage")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("universityLinking.university.verificationRequiredNextStep")}
            </p>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div role="alert" className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              {success}
            </div>
          )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">
              {t("universityLinking.university.inviteTitle")}
            </h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("universityLinking.university.emailPlaceholder")}
              className="h-10"
            />
            <Button
              type="button"
              disabled={loading || !email.trim()}
              onClick={invite}
              className="h-10 shrink-0"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t("universityLinking.university.invite")}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("universityLinking.university.inviteHelp")}
          </p>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-secondary" />
            <h3 className="font-semibold text-foreground">
              {t("universityLinking.university.selfJoinTitle")}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={generateCode}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("universityLinking.university.generateCode")}
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={generateLink}>
              <Link2 className="mr-2 h-4 w-4" />
              {t("universityLinking.university.generateLink")}
            </Button>
          </div>
          {secret && (
            <div className="mt-3 rounded-md bg-muted p-3">
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all text-xs font-semibold text-foreground">
                  {secret.value}
                </code>
                <Button type="button" variant="ghost" size="icon" onClick={() => copy(secret.value)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("universityLinking.university.secretOnce")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">
              {t("universityLinking.university.requestsTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("universityLinking.university.requestsDescription")}
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
            {demandes.length}
          </span>
        </div>

        {Boolean(token) && (loadingDemandes || loadedToken !== token) ? (
          <p className="text-sm text-muted-foreground">
            {t("universityLinking.university.loading")}
          </p>
        ) : demandes.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t("universityLinking.university.noRequests")}
          </p>
        ) : (
          <div className="space-y-2">
            {demandes.map((demande) => (
              <div
                key={demande.idRattachement}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {demande.prenom && demande.nom
                      ? `${demande.prenom} ${demande.nom}`
                      : demande.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {demande.source} ·{" "}
                    {demande.dateDemande
                      ? new Date(demande.dateDemande).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => decide(demande.idRattachement, "confirm")}>
                    <Check className="mr-1.5 h-4 w-4" />
                    {t("universityLinking.university.confirm")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => decide(demande.idRattachement, "refuse")}>
                    <X className="mr-1.5 h-4 w-4" />
                    {t("universityLinking.university.refuse")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </section>
  );
}
