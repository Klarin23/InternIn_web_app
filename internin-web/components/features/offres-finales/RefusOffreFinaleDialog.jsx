"use client";

import { useMemo, useState } from "react";
import { FiAlertCircle, FiLoader, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

const MOTIF_KEYS = [
  "conditions",
  "remuneration",
  "startDate",
  "duration",
  "location",
  "roleMismatch",
  "otherOffer",
  "personal",
  "other",
];

const MIN = 10;
const MAX = 1000;

export default function RefusOffreFinaleDialog({
  open,
  onOpenChange,
  offre,
  onConfirm,
  isPending = false,
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [texte, setTexte] = useState("");

  const motifFinal = useMemo(() => {
    const custom = String(texte || "").trim().replace(/\s+/g, " ");
    if (custom) return custom;
    if (selected && selected !== "other") {
      return t(`stagiaireSpace.finalOffers.refuseReasons.${selected}`);
    }
    return "";
  }, [texte, selected, t]);

  const len = motifFinal.length;
  const valid = len >= MIN && len <= MAX;

  function resetAndClose(next) {
    if (!next) {
      setSelected(null);
      setTexte("");
    }
    onOpenChange?.(next);
  }

  async function handleConfirm() {
    if (!valid || isPending) return;
    await onConfirm?.(motifFinal);
    setSelected(null);
    setTexte("");
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="internin-custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <FiX className="h-5 w-5" />
          </div>
          <DialogTitle>
            {t("stagiaireSpace.finalOffers.refuseDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("stagiaireSpace.finalOffers.refuseDialogDesc")}
          </DialogDescription>
        </DialogHeader>

        {offre && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <p className="font-semibold text-foreground">{offre.intitulePoste}</p>
            <p className="text-xs text-muted-foreground">
              {offre.nomEntreprise}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("stagiaireSpace.finalOffers.quickReasons")}</Label>
          <div className="flex flex-wrap gap-2">
            {MOTIF_KEYS.map((key) => {
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {t(`stagiaireSpace.finalOffers.refuseReasons.${key}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="motif-refus">
            {t("stagiaireSpace.finalOffers.refuseMotifLabel")}
          </Label>
          <Textarea
            id="motif-refus"
            rows={4}
            maxLength={MAX}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder={t("stagiaireSpace.finalOffers.refuseMotifPlaceholder")}
            className="resize-none"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {len < MIN
                ? t("stagiaireSpace.finalOffers.refuseMotifMin", { min: MIN })
                : " "}
            </span>
            <span>
              {len}/{MAX}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-sm border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t("stagiaireSpace.finalOffers.refuseWarning")}</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => resetAndClose(false)}
            disabled={isPending}
          >
            {t("stagiaireSpace.finalOffers.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!valid || isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              <FiX className="h-4 w-4" />
            )}
            {t("stagiaireSpace.finalOffers.confirmRefuse")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
