"use client";
// Formulaire "mot de passe oublié" : demande l'e-mail, puis affiche
// un état de confirmation (on ne révèle jamais si l'e-mail existe ou
// non en base — bonne pratique de sécurité standard).

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";
import { forgotPasswordRequest } from "@/lib/api/auth";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  // Une fois la demande envoyée, on bascule sur l'écran de confirmation.
  const [submittedEmail, setSubmittedEmail] = useState(null);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await forgotPasswordRequest(data.email);
      setSubmittedEmail(data.email);
    } catch (err) {
      // Erreur réseau/serveur uniquement — le backend ne révèle jamais
      // si l'adresse existe ou non (voir requestPasswordReset côté API).
      setServerError(err.message);
    }
  };

  // ---------- ÉCRAN DE CONFIRMATION ----------
  if (submittedEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t("auth.forgotPassword.confirmTitle")}
        </h1>
        <p className="mb-1 text-sm text-muted-foreground">
          {t("auth.forgotPassword.confirmIfAccountFor")}
        </p>
        <p className="mb-5 text-sm font-semibold text-foreground">
          {submittedEmail}
        </p>
        <p className="mb-7 text-sm text-muted-foreground">
          {t("auth.forgotPassword.confirmWillReceive")}
        </p>
        <Link
          href="/connexion"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.forgotPassword.backToLogin")}
        </Link>
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
        {t("auth.forgotPassword.backToLogin")}
      </Link>

      <div className="mb-7">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgotPassword.subtitle")}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.shared.emailLabel")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={t("auth.shared.emailPlaceholder")}
              className="h-12 rounded-sm pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-sm"
        >
          {isSubmitting
            ? t("auth.forgotPassword.submitting")
            : t("auth.forgotPassword.submit")}
        </Button>
      </form>
    </div>
  );
}
