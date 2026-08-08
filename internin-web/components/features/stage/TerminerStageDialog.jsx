"use client";

import { useState } from "react";
import { FiCheckCircle, FiLoader, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTerminerStage } from "@/lib/queries/useStages";

export default function TerminerStageDialog({ idStage, stagiaireNom }) {
  const [open, setOpen] = useState(false);
  const mutation = useTerminerStage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="h-11 flex-1 rounded-sm">
          👍 Valider stage
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Clôturer le stage de {stagiaireNom}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Cette action générera automatiquement un certificat et un badge
            d&apos;expérience vérifiée pour {stagiaireNom}. Cette action est
            irréversible.
          </p>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={() =>
              mutation.mutate(idStage, { onSuccess: () => setOpen(false) })
            }
            disabled={mutation.isPending}
            className="h-11 w-full rounded-sm"
          >
            {mutation.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              <FiCheckCircle className="h-4 w-4" />
            )}
            Confirmer la clôture
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
