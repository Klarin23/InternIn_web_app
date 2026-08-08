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

// Point 13 : le parcours en 4 étapes contient davantage de contenu que
// l'ancien formulaire vertical -> largeur portée de 600px à ~760px sur
// desktop. Le header reste fixe et le contenu défile (overflow-y-auto sur
// DialogContent), le footer d'actions vit dans StepApercu / OffreForm et
// reste donc toujours visible en bas du contenu scrollable.
export default function OffreFormDialog({ open, onOpenChange, idOffre }) {
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
                {idOffre ? "Modifier l'offre" : "Nouvelle offre de stage"}
              </DialogTitle>
              <DialogDescription>
                {idOffre
                  ? "Mettez à jour les informations de votre offre."
                  : "Créez une offre claire et attractive pour attirer les meilleurs candidats."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {idOffre && isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
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
