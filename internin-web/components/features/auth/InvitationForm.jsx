"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PasswordField from "./PasswordField";
import { accepterInvitationSchema } from "@/lib/schemas/auth.schema";
import { useInvitation, useAccepterInvitation } from "@/lib/queries/useEquipe";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ROLE_LABELS } from "@/components/features/equipe/equipeConstants";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function InvitationForm({ token }) {
  const router = useRouter();
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    data: invitation,
    isLoading,
    error: erreurChargement,
  } = useInvitation(token);
  const mutation = useAccepterInvitation(token);

 const {
   register,
   handleSubmit,
   watch,
   formState: { errors, isSubmitting },
 } = useForm({
   resolver: zodResolver(accepterInvitationSchema),
   defaultValues: { motDePasse: "", confirmMotDePasse: "" },
 });
  // eslint-disable-next-line react-hooks/incompatible-library
  const passwordValue = watch("motDePasse");

  const onSubmit = async (data) => {
    try {
      const { user, token: sessionToken } = await mutation.mutateAsync(
        data.motDePasse,
      );
      setSession(user, sessionToken);
      router.push("/tableau-de-bord");
    } catch (err) {
      // L'erreur est déjà exposée via mutation.error ci-dessous
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("auth.invitation.checking")}
      </div>
    );
  }

  if (erreurChargement) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {erreurChargement.message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {t("auth.invitation.joinCompany", {
            company: invitation.nomEntreprise,
          })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {invitation.nom}, {t("auth.invitation.invitedAs")}{" "}
          <span className="font-semibold text-foreground">
            {ROLE_LABELS[invitation.roleEquipe]}
          </span>
          . {t("auth.invitation.choosePassword", { email: invitation.email })}
        </p>
      </div>

      {mutation.isError && (
        <div className="mb-4 flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {mutation.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          id="motDePasse"
          label={t("auth.shared.passwordLabel")}
          placeholder="••••••••"
          registration={register("motDePasse")}
          error={errors.motDePasse?.message}
          value={passwordValue}
          showRequirements
        />

        <PasswordField
          id="confirmMotDePasse"
          label={t("auth.shared.confirmPasswordLabel")}
          placeholder="••••••••"
          registration={register("confirmMotDePasse")}
          error={errors.confirmMotDePasse?.message}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-sm"
        >
          {isSubmitting
            ? t("auth.invitation.submitting")
            : t("auth.invitation.submit")}
        </Button>
      </form>
    </div>
  );
}
