"use client";

import AppHeader from "@/components/layout/AppHeader";
import ActivationWizard from "@/components/features/account/ActivationWizard";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ActivationPage() {
  const { t } = useTranslation();

  return (
    <>
      <AppHeader
        title={t("dashboard.profileCard.completeProfile")}
        subtitle={t("account.inactive.progressDescription")}
      />
      <ActivationWizard />
    </>
  );
}
