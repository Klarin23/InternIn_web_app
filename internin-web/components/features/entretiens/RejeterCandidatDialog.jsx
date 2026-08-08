"use client";

import { useState } from "react";
import { FiXCircle, FiLoader, FiAlertCircle, FiMail } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRejeterCandidature } from "@/lib/queries/useCandidaturesEntreprise";

export default function RejeterCandidatDialog({ idEntretien, candidatNom }) {
  const [open, setOpen] = useState(false);
  const mutation = useRejeterCandidature();

  function handleConfirm() {
    mutation.mutate(idEntretien, { onSuccess: () => setOpen(false) });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
        >
          <FiXCircle className="h-4 w-4" />
          Rejeter
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Rejeter la candidature — {candidatNom}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2.5 rounded-sm border border-border bg-muted/40 p-3.5 text-sm text-muted-foreground">
            <FiMail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p>
              Un message professionnel sera automatiquement envoyé à{" "}
              <b className="text-foreground">{candidatNom}</b> pour
              l&apos;informer que sa candidature n&apos;a pas été retenue pour
              ce stage. Cette action est définitive.
            </p>
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-sm"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className="flex-1 rounded-sm bg-destructive text-white hover:bg-destructive/90"
            >
              {mutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmer le rejet"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}