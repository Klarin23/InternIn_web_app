"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Clock3, Hash, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getRattachementEtudiantRequest,
  rejoindreUniversiteParCodeRequest,
  rejoindreUniversiteParLienRequest,
} from "@/lib/api/universites";

export default function MonEtablissementPage() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState(null);
  const [code, setCode] = useState("");
  const [linkToken, setLinkToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      setData(await getRattachementEtudiantRequest(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function joinCode() {
    setAction(true);
    setError(null);
    setMessage(null);
    try {
      await rejoindreUniversiteParCodeRequest(code, token);
      setCode("");
      setMessage(t("universityLinking.student.requestSent"));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(false);
    }
  }

  async function joinLink() {
    const raw = linkToken.trim().split("/").filter(Boolean).pop();
    if (!raw) return;
    setAction(true);
    setError(null);
    setMessage(null);
    try {
      await rejoindreUniversiteParLienRequest(raw, token);
      setLinkToken("");
      setMessage(t("universityLinking.student.requestSent"));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t("universityLinking.student.loading")}
      </div>
    );
  }

  const universite = data?.universite;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          {t("universityLinking.student.eyebrow")}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          {t("universityLinking.student.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("universityLinking.student.description")}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      )}

      {data?.demande && !universite && data.demande.statut === "en_attente" && (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">
                {t("universityLinking.student.pendingTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("universityLinking.student.pendingDescription", {
                  university:
                    data.demande.universite?.nomUniversite ||
                    t("universityLinking.student.yourInstitution"),
                })}
              </p>
            </div>
          </div>
        </section>
      )}

      {universite ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
              {universite.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={universite.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground">
                {universite.nomUniversite}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                {t("universityLinking.student.confirmed")}
              </div>
            </div>
            {universite.siteWeb && (
              <Button asChild variant="outline">
                <a href={universite.siteWeb} target="_blank" rel="noreferrer">
                  {t("universityLinking.student.website")}
                </a>
              </Button>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">
                {t("universityLinking.student.notAttachedTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("universityLinking.student.notAttachedDescription")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {t("universityLinking.student.codeTitle")}
                </h3>
              </div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("universityLinking.student.codePlaceholder")}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <Button className="mt-3 w-full" disabled={action || !code.trim()} onClick={joinCode}>
                {t("universityLinking.student.join")}
              </Button>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-secondary" />
                <h3 className="font-semibold text-foreground">
                  {t("universityLinking.student.linkTitle")}
                </h3>
              </div>
              <input
                value={linkToken}
                onChange={(e) => setLinkToken(e.target.value)}
                placeholder={t("universityLinking.student.linkPlaceholder")}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <Button className="mt-3 w-full" variant="outline" disabled={action || !linkToken.trim()} onClick={joinLink}>
                {t("universityLinking.student.join")}
              </Button>
            </div>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            {t("universityLinking.student.securityNotice")}
          </p>
        </section>
      )}

      <Link href="/tableau-de-bord" className="text-sm font-semibold text-primary hover:underline">
        {t("universityLinking.student.backDashboard")}
      </Link>
    </div>
  );
}
