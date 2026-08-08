"use client";
// Modale de candidature : lettre de motivation facultative. Utilise
// useMutation (TanStack Query) pour gérer l'état de la requête et
// invalider automatiquement le cache après succès (statut + liste).

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiLoader, FiAlertCircle, FiSend, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { postulerRequest } from "@/lib/api/candidatures";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PostulerDialog({ idOffre, offreTitle }) {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [lettreMotivation, setLettreMotivation] = useState("");

  const mutation = useMutation({
    mutationFn: () => postulerRequest({ idOffre, lettreMotivation }, token),
    onSuccess: () => {
      // Rafraîchit le statut affiché sur cette page et la liste "Mes candidatures"
      queryClient.invalidateQueries({
        queryKey: ["candidatureStatut", idOffre],
      });
      queryClient.invalidateQueries({ queryKey: ["mesCandidatures"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="group/postuler flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-shadow hover:shadow-[0_10px_24px_-8px_rgba(20,184,166,0.5)]"
        >
          {t("offersPage.apply.cta")}
          <FiArrowRight className="h-4 w-4 transition-transform group-hover/postuler:translate-x-1" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="rounded-md sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {t("offersPage.apply.dialogTitle", { title: offreTitle })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="lettreMotivation">
              {t("offersPage.apply.coverLetter")}{" "}
              <span className="text-muted-foreground">
                {t("offersPage.apply.optional")}
              </span>
            </Label>
            <Textarea
              id="lettreMotivation"
              rows={6}
              placeholder={t("offersPage.apply.coverLetterPlaceholder")}
              value={lettreMotivation}
              onChange={(e) => setLettreMotivation(e.target.value)}
              className="rounded-sm"
            />
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="h-12 w-full rounded-sm"
          >
            {mutation.isPending ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                {t("offersPage.apply.sending")}
              </>
            ) : (
              <>
                <FiSend className="h-4 w-4" />
                {t("offersPage.apply.submit")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
