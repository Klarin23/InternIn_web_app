"use client";

import { FiLoader, FiCheck } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EditProfilActionsBar({
  onCancel,
  disabled,
  isPending,
  isSuccess,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-5 py-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isPending}
        className="h-10 rounded-md"
      >
        {t("profilEntreprise.edit.actions.cancel")}
      </Button>
      <Button
        type="submit"
        disabled={disabled || isPending}
        className="h-10 rounded-md"
      >
        {isPending ? (
          <>
            <FiLoader className="h-4 w-4 animate-spin" />
            {t("profilEntreprise.edit.actions.saving")}
          </>
        ) : isSuccess && disabled ? (
          <>
            <FiCheck className="h-4 w-4" />
            {t("profilEntreprise.edit.actions.saved")}
          </>
        ) : (
          t("profilEntreprise.edit.actions.save")
        )}
      </Button>
    </div>
  );
}
