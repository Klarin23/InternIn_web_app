"use client";
// Formulaire de saisie du nouveau mot de passe, atteint depuis le lien
// envoyé par e-mail (?token=...). Trois états possibles :
// - lien absent/invalide dès l'arrivée sur la page
// - formulaire (cas normal)
// - succès une fois le mot de passe changé

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import PasswordField from "./PasswordField";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";
import { resetPasswordRequest } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const passwordValue = watch("password");

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await resetPasswordRequest({ token, password: data.password });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message);
    }
  };

  // ---------- LIEN ABSENT/INVALIDE DÈS LE DÉPART ----------
  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t("auth.resetPassword.invalidLinkTitle")}
        </h1>
        <p className="mb-7 text-sm text-muted-foreground">
          {t("auth.resetPassword.invalidLinkSubtitle")}
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
        >
          {t("auth.resetPassword.requestNewLink")}
        </Link>
      </div>
    );
  }

  // ---------- ÉCRAN DE SUCCÈS ----------
  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t("auth.resetPassword.successTitle")}
        </h1>
        <p className="mb-7 text-sm text-muted-foreground">
          {t("auth.resetPassword.successSubtitle")}
        </p>
        <Button
          className="h-12 w-full rounded-sm"
          onClick={() => router.push("/connexion")}
        >
          {t("auth.resetPassword.backToLogin")}
        </Button>
      </div>
    );
  }

  // ---------- FORMULAIRE ----------
  return (
    <div>
      <Link
        href="/connexion"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("auth.resetPassword.backToLogin")}
      </Link>

      <div className="mb-7">
        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {t("auth.resetPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.resetPassword.subtitle")}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          id="password"
          label={t("auth.shared.passwordLabel")}
          registration={register("password")}
          error={errors.password?.message}
          value={passwordValue}
          showRequirements
        />

        <PasswordField
          id="confirmPassword"
          label={t("auth.shared.confirmPasswordLabel")}
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-sm"
        >
          {isSubmitting
            ? t("auth.resetPassword.submitting")
            : t("auth.resetPassword.submit")}
        </Button>
      </form>
    </div>
  );
}
