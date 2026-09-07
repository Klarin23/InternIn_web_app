"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import CertificatCard from "@/components/features/certificats/CertificatCard";
import CertificateViewer from "@/components/features/certificats/CertificateViewer";
import {
  useMesCertificats,
  useDownloadCertificat,
} from "@/lib/queries/useStages";
import { toast } from "@/lib/store/useToastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CertificatsPage() {
  const { t, locale } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useMesCertificats();
  const downloadMut = useDownloadCertificat();
  const reduceMotion = useReducedMotion();

  const [selected, setSelected] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewStageId, setPreviewStageId] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [previewFilename, setPreviewFilename] = useState(null);

  const list = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    arr.sort(
      (a, b) => new Date(b.dateEmission || 0) - new Date(a.dateEmission || 0),
    );
    return arr;
  }, [data]);

  const stats = {
    total: list.length,
    verifies: list.filter((c) => c.statut === "verifie" || c.codeVerification)
      .length,
    recent: list[0] ? 1 : 0,
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearPreview() {
    setPreviewOpen(false);
    setSelected(null);
    setPreviewStageId(null);
    setPreviewError(null);
    setPreviewBlob(null);
    setPreviewFilename(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function loadPreview(cert) {
    if (!cert?.idStage) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewStageId(cert.idStage);
    setSelected(cert);
    setPreviewOpen(true);

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewBlob(null);
    setPreviewFilename(null);

    try {
      const uiLang = String(locale || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
      const { blob, filename } = await downloadMut.mutateAsync({
        idStage: cert.idStage,
        lang: uiLang,
      });
      const url = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewFilename(filename || `certificat-${cert.idStage}.pdf`);
      setPreviewUrl(url);
    } catch (err) {
      setPreviewError(
        err?.message || t("stagiaireSpace.certificates.previewError"),
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handlePreview(cert) {
    if (!cert?.idStage || previewLoading) return;
    await loadPreview(cert);
  }

  async function handleDownload(cert, lang = "fr") {
    if (!cert?.idStage || downloadMut.isPending) return;
    const localeLang = String(lang || "fr").toLowerCase().startsWith("en")
      ? "en"
      : "fr";

    try {
      const { blob, filename } = await downloadMut.mutateAsync({
        idStage: cert.idStage,
        lang: localeLang,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(t("stagiaireSpace.certificates.downloadOk"));
    } catch (err) {
      toast.error(
        err?.message || t("stagiaireSpace.certificates.downloadError"),
      );
    }
  }

  return (
    <>
      <AppHeader
        title={t("stagiaireSpace.certificates.title")}
        subtitle={t("stagiaireSpace.certificates.subtitle")}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {!isLoading && list.length > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              {
                label: t("stagiaireSpace.certificates.statCertificates"),
                value: stats.total,
              },
              {
                label: t("stagiaireSpace.certificates.statValidated"),
                value: stats.verifies,
              },
              {
                label: t("stagiaireSpace.certificates.statRecent"),
                value: stats.recent,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-center shadow-sm"
              >
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {s.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-muted/70"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <p className="font-semibold">
              {t("stagiaireSpace.certificates.loadError")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error?.message || t("stagiaireSpace.certificates.genericError")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => refetch()}
            >
              {t("stagiaireSpace.certificates.retry")}
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card px-6 py-16 text-center">
            <Award className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 font-semibold text-foreground">
              {t("stagiaireSpace.certificates.empty")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("stagiaireSpace.certificates.emptyHint")}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
              <Link href="/stage">
                {t("stagiaireSpace.certificates.viewStage")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((cert, index) => (
              <CertificatCard
                key={cert.idCertificat || cert.idStage || index}
                certificat={cert}
                index={index}
                onOpen={handlePreview}
                previewLoading={
                  previewLoading && previewStageId === cert.idStage
                }
              />
            ))}
          </div>
        )}
      </div>

      <CertificateViewer
        open={previewOpen}
        certificate={selected}
        previewUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
        onClose={clearPreview}
        onRetry={() => selected && loadPreview(selected)}
        onDownload={handleDownload}
        downloadPending={downloadMut.isPending}
      />
    </>
  );
}
