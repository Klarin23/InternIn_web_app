"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  MailCheck,
  CheckCircle2,
  XCircle,
  RotateCw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTranslation } from "@/lib/i18n/useTranslation";

import {
  verifyEmailRequest,
  resendEmailVerificationRequest,
} from "@/lib/api/auth";

import { useAuthStore } from "@/lib/store/useAuthStore";

export default function VerifyEmailStatus() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const { t } = useTranslation();

  const authToken = useAuthStore((state) => state.token);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [status, setStatus] = useState(token ? "checking" : "pending");

  const [cooldown, setCooldown] = useState(0);

  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Vérification réelle du token.
   */
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        setStatus("checking");
        setErrorMessage(null);

        await verifyEmailRequest(token);

          if (!cancelled) {
            updateUser({ emailVerifie: true });
            setStatus("success");
          }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message);
          setStatus("error");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, updateUser]);

  /**
   * Compte à rebours anti-spam.
   */
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  /**
   * Renvoie réellement l'e-mail.
   */
  const handleResend = async () => {
    if (!authToken) {
      setErrorMessage(t("auth.verifyEmail.sessionRequired"));

      return;
    }

    if (cooldown > 0) return;

    try {
      setErrorMessage(null);

      await resendEmailVerificationRequest(authToken);

      setCooldown(30);
      setStatus("pending");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  /**
   * Vérification en cours.
   */
  if (status === "checking") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <RotateCw className="h-7 w-7 animate-spin" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {t("auth.verifyEmail.checking")}
        </h1>
      </div>
    );
  }

  /**
   * Vérification réussie.
   */
    if (status === "success") {
      // Jamais /onboarding/1 ici : le login / tableau de bord gèrent la suite
      // (gate compte incomplet + /activation si profil déjà créé)
      const nextHref = user ? "/tableau-de-bord" : "/connexion";
      const nextLabel = user
        ? "Accéder à mon espace"
        : t("auth.verifyEmail.login");

      return (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-foreground">
            {t("auth.verifyEmail.successTitle")}
          </h1>

          <p className="mb-7 text-sm text-muted-foreground">
            {t("auth.verifyEmail.successDesc")}
          </p>

          <Button asChild className="h-12 w-full rounded-sm">
            <Link href={nextHref}>{nextLabel}</Link>
          </Button>
        </div>
      );
    }

  /**
   * Erreur de vérification.
   */
  if (status === "error") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-500">
          <XCircle className="h-7 w-7" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t("auth.verifyEmail.errorTitle")}
        </h1>

        <p className="mb-4 text-sm text-muted-foreground">
          {t("auth.verifyEmail.errorDesc")}
        </p>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-left text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          onClick={handleResend}
          disabled={cooldown > 0 || !authToken}
          className="h-12 w-full rounded-sm"
        >
          {cooldown > 0
            ? t("auth.verifyEmail.resendIn", {
                n: cooldown,
              })
            : t("auth.verifyEmail.resendVerification")}
        </Button>

        {!authToken && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("auth.verifyEmail.loginToResend")}
          </p>
        )}
      </div>
    );
  }

  /**
   * État après inscription.
   */
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="h-7 w-7" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-foreground">
        {t("auth.verifyEmail.pendingTitle")}
      </h1>

      <p className="mb-7 text-sm text-muted-foreground">
        {t("auth.verifyEmail.pendingDesc")}
      </p>

      {errorMessage && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-left text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        onClick={handleResend}
        disabled={cooldown > 0 || !authToken}
        variant="outline"
        className="h-12 w-full rounded-sm"
      >
        {cooldown > 0
          ? t("auth.verifyEmail.resendIn", {
              n: cooldown,
            })
          : t("auth.verifyEmail.resend")}
      </Button>

      {!authToken && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("auth.verifyEmail.loginToResend")}
        </p>
      )}
    </div>
  );
}
