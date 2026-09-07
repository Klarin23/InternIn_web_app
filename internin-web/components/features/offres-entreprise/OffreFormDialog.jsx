"use client";

import { FiBriefcase } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import OffreForm from "./OffreForm";
import { useOffreEntreprise } from "@/lib/queries/useCreateOffre";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffreFormDialog({ open, onOpenChange, idOffre }) {
  const { t } = useTranslation();
  const { data: existingOffre, isLoading } = useOffreEntreprise(idOffre);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-md sm:max-w-190">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FiBriefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle>
                {idOffre
                  ? t("entrepriseSpace.offers.editOfferTitle")
                  : t("entrepriseSpace.offers.newOfferTitle")}
              </DialogTitle>
              <DialogDescription>
                {idOffre
                  ? t("entrepriseSpace.offers.editOfferDesc")
                  : t("entrepriseSpace.offers.newOfferDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {idOffre && isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("entrepriseSpace.offers.loading")}
          </p>
        ) : (
          <OffreForm
            existingOffre={idOffre ? existingOffre : null}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
