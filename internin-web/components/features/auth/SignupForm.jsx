"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordField from "./PasswordField";
import GoogleButton from "./GoogleButton";
import { signupSchema } from "@/lib/schemas/auth.schema";
import { registerRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SignupForm({ role }) {
  const router = useRouter();
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState(null);
  const roleLabel = t(`auth.signup.roleLabels.${role}`);
  const title = t(`auth.signup.titles.${role}`);

 const {
   register,
   handleSubmit,
   control,
   watch,
   formState: { errors, isSubmitting },
 } = useForm({
   
   resolver: zodResolver(signupSchema),
   defaultValues: {
     email: "",
     password: "",
     confirmPassword: "",
     acceptTerms: false,
   },
 });
  // eslint-disable-next-line react-hooks/incompatible-library
  const passwordValue = watch("password");

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const { user, token } = await registerRequest({
        email: data.email,
        password: data.password,
        typeUtilisateur: role, // "stagiaire" | "entreprise" | "universite"
      });
      setSession(user, token);
      // TODO : rediriger vers /onboarding/1 une fois cette page construite.
      router.push("/verification-email");
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div>
      <Link
        href="/inscription"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("auth.signup.changeProfile")}
      </Link>

      <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm font-semibold">
        <span className="h-2 w-2 rounded-full bg-primary" />
        {roleLabel}
      </span>

      <div className="mb-7">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signup.subtitle")}
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

        <PasswordField
          id="password"
          label={t("auth.shared.passwordLabel")}
          placeholder={t("auth.signup.passwordPlaceholder")}
          registration={register("password")}
          error={errors.password?.message}
          value={passwordValue}
          showRequirements
        />

        <PasswordField
          id="confirmPassword"
          label={t("auth.shared.confirmPasswordLabel")}
          placeholder="••••••••"
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                className="mt-0.5"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <span>
            {t("auth.signup.acceptTermsPrefix")}{" "}
            <Link
              href="/conditions"
              className="font-semibold text-blue-400 hover:underline"
            >
              {t("auth.signup.termsOfUse")}
            </Link>{" "}
            {t("auth.signup.and")}{" "}
            <Link
              href="/confidentialite"
              className="font-semibold text-blue-400 hover:underline"
            >
              {t("auth.signup.privacyPolicy")}
            </Link>{" "}
            {t("auth.signup.acceptTermsSuffix")}
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-destructive">
            {errors.acceptTerms.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-sm"
        >
          {isSubmitting ? t("auth.signup.submitting") : t("auth.signup.submit")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("auth.shared.orContinueWith")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {t("auth.signup.alreadyAccount")}{" "}
        <Link
          href="/connexion"
          className="font-semibold text-blue-400 hover:underline"
        >
          {t("auth.signup.login")}
        </Link>
      </p>
    </div>
  );
}
