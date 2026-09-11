"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState } from "react";
import { FiAward, FiDownload, FiShield, FiLoader } from "react-icons/fi";
import { useDownloadCertificat } from "@/lib/queries/useStages";
import { toast } from "@/lib/store/useToastStore";

export default function CertificatCard({ certificat, idStage }) {
  const { t } = useTranslation();
  const downloadMut = useDownloadCertificat();
  const [busy, setBusy] = useState(false);

  if (!certificat) return null;

  const stageId = idStage || certificat.idStage;

  async function handleDownload() {
    if (!stageId || busy) return;
    setBusy(true);
    try {
      const { blob, filename } = await downloadMut.mutateAsync(stageId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(t("stagiaireSpace.stage.downloadOk"));
    } catch (err) {
      toast.error(err?.message || t("stagiaireSpace.stage.downloadError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <FiAward className="h-5 w-5 text-primary" />
        <h6 className="font-semibold text-foreground">
          {t("auditUi.stage.certificate")}
        </h6>
      </div>
      {certificat.codeVerification && (
        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiShield className="h-3.5 w-3.5" />
          {t("stagiaireSpace.stage.verificationCode")}{" "}
          {certificat.codeVerification}
        </p>
      )}
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy || !stageId}
        className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? (
          <FiLoader className="h-4 w-4 animate-spin" />
        ) : (
          <FiDownload className="h-4 w-4" />
        )}
        {busy
          ? t("stagiaireSpace.stage.preparing")
          : t("stagiaireSpace.stage.downloadCert")}
      </button>
    </div>
  );
}
