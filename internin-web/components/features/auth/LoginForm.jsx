"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordField from "./PasswordField";
import GoogleButton from "./GoogleButton";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { loginRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  // Erreur renvoyée par le serveur (ex: "Identifiants invalides"),
  // distincte des erreurs de validation Zod déjà gérées par react-hook-form
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

    const onSubmit = async (data) => {
      setServerError(null);
      try {
        const { user, token, refreshToken } = await loginRequest(data);
        setSession(user, token, refreshToken ?? null);

        const path = await getPostLoginPath(user, token);
        router.push(path);
      } catch (err) {
        setServerError(err.message);
      }
    };

  return (
    <div>
      <div className="mb-7">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {t("auth.login.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.login.subtitle")}
        </p>
      </div>

      {/* Bannière d'erreur serveur, distincte des erreurs de champ */}
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

        <PasswordField
          id="password"
          label={t("auth.shared.passwordLabel")}
          placeholder="••••••••"
          registration={register("password")}
          error={errors.password?.message}
          showRequirements={false}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            {t("auth.login.rememberMe")}
          </label>
          <Link
            href="/mot-de-passe-oublie"
            className="font-semibold text-blue-400 hover:underline"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-sm"
        >
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("auth.shared.orContinueWith")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onError={setServerError} />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")}{" "}
        <Link
          href="/inscription"
          className="font-semibold text-blue-400 hover:underline"
        >
          {t("auth.login.createAccount")}
        </Link>
      </p>
    </div>
  );
}