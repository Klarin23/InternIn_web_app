"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getInvitationUniversiteRequest,
  accepterInvitationUniversiteRequest,
  refuserInvitationUniversiteRequest,
} from "@/lib/api/universites";

export default function UniversiteInvitationClient({ token }) {
  const router = useRouter();
  const { t } = useTranslation();
  const authToken = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getInvitationUniversiteRequest(token)
      .then((data) => {
        if (!cancelled) setInvitation(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function continueToSignup() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("internin_universite_invitation", token);
    }
    router.push(`/inscription/stagiaire?invitation=${encodeURIComponent(token)}`);
  }

  const compteEtudiantValide =
    !user || user.typeUtilisateur === "stagiaire";

  function continueToLogin() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("internin_universite_invitation", token);
    }
    router.push("/connexion");
  }

  async function handleAccept() {
    if (!authToken) return continueToSignup();
    if (!compteEtudiantValide) return;
    setAction("accept");
    setError(null);
    try {
      await accepterInvitationUniversiteRequest(token, authToken);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("internin_universite_invitation");
      }
      router.push("/mon-etablissement");
    } catch (err) {
      if (err?.status === 404 && typeof window !== "undefined") {
        window.localStorage.setItem("internin_universite_invitation", token);
        router.push("/onboarding/1");
        return;
      }
      setError(err.message);
    } finally {
      setAction(null);
    }
  }

  async function handleRefuse() {
    if (!authToken) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("internin_universite_invitation");
      }
      router.push("/connexion");
      return;
    }
    setAction("refuse");
    setError(null);
    try {
      await refuserInvitationUniversiteRequest(token, authToken);
      router.push("/tableau-de-bord");
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("universityLinking.invitation.loading")}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <section className="w-full max-w-xl rounded-xl border border-border bg-card p-7 shadow-sm">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {invitation ? (
          <>
            <p className="mb-2 text-sm font-semibold text-primary">
              {t("universityLinking.invitation.eyebrow")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {invitation.nomUniversite}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("universityLinking.invitation.description")}
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                {t("universityLinking.invitation.secureNotice")}
              </p>
            </div>

            {!authToken && (
              <p className="mt-5 text-sm text-muted-foreground">
                {t("universityLinking.invitation.loginHint")}
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                disabled={!!action || !compteEtudiantValide}
                onClick={handleAccept}
              >
                {action === "accept"
                  ? t("universityLinking.invitation.accepting")
                  : t("universityLinking.invitation.accept")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!!action || !compteEtudiantValide}
                onClick={handleRefuse}
              >
                {action === "refuse"
                  ? t("universityLinking.invitation.refusing")
                  : t("universityLinking.invitation.refuse")}
              </Button>
            </div>

            {!authToken && (
              <Button
                type="button"
                variant="ghost"
                className="mt-3 w-full"
                onClick={continueToSignup}
              >
                {t("universityLinking.invitation.createAccount")}
              </Button>
            )}
            {!authToken && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={continueToLogin}
              >
                {t("universityLinking.invitation.login")}
              </Button>
            )}

            {user && user.typeUtilisateur !== "stagiaire" && (
              <p className="mt-4 text-xs text-destructive">
                {t("universityLinking.invitation.studentOnly")}
              </p>
            )}
          </>
        ) : (
          <h1 className="text-xl font-semibold text-foreground">
            {t("universityLinking.invitation.invalid")}
          </h1>
        )}
      </section>
    </main>
  );
}
