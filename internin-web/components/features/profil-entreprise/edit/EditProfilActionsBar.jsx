"use client";

import { FiLoader, FiCheck } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

// Barre d'action sticky en bas du dialogue (DialogFooter est déjà collée en
// bas visuellement grâce à ses styles existants — border-t + bg-muted/50).
export default function EditProfilActionsBar({
  onCancel,
  disabled,
  isPending,
  isSuccess,
}) {
  return (
    <DialogFooter className="mx-0 mb-0 sm:justify-between">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
        Annuler
      </Button>
      <Button type="submit" disabled={disabled || isPending} className="min-w-40">
        {isPending ? (
          <>
            <FiLoader className="h-4 w-4 animate-spin" />
            Enregistrement…
          </>
        ) : isSuccess ? (
          <>
            <FiCheck className="h-4 w-4" />
            Modifications enregistrées
          </>
        ) : (
          "Enregistrer les modifications"
        )}
      </Button>
    </DialogFooter>
  );
}
