"use client";

import { useState } from "react";
import { FiLoader, FiAlertCircle, FiEdit3 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateRecommandation } from "@/lib/queries/useRecommandations";

export default function RecommandationDialog({ idStage, stagiaireNom }) {
  const [open, setOpen] = useState(false);
  const [contenu, setContenu] = useState("");
  const mutation = useCreateRecommandation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="rounded-sm">
          <FiEdit3 className="h-4 w-4" />
          Rédiger une recommandation
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Recommandation pour {stagiaireNom}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <textarea
            rows={6}
            placeholder={`Décrivez le travail et les qualités de ${stagiaireNom} durant son stage...`}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-none"
          />

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={() =>
              mutation.mutate(
                { idStage, contenu },
                { onSuccess: () => setOpen(false) },
              )
            }
            disabled={contenu.length < 20 || mutation.isPending}
            className="h-11 w-full rounded-sm"
          >
            {mutation.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              "Envoyer la recommandation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
