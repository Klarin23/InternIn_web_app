"use client";

import { useState } from "react";
import {
  FiSearch,
  FiLoader,
  FiSend,
  FiCheck,
  FiClock,
  FiMapPin,
  FiBriefcase,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEntreprisesDecouvrir,
  useEnvoyerInvitation,
} from "@/lib/queries/usePartenariats";

function initiales(nom) {
  const mots = nom.trim().split(/\s+/);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

// Bouton d'action à droite de chaque ligne, dont l'état dépend du
// partenariat éventuellement déjà existant avec cette entreprise.
function ActionInvitation({ entreprise, onOuvrirDialog }) {
  const statut = entreprise.partenariat?.statut;

  if (statut === "acceptee") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-green-700">
        <FiCheck className="h-3.5 w-3.5" />
        Partenaire
      </span>
    );
  }
  if (statut === "en_attente") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1.5 text-xs font-bold text-[#B45309]">
        <FiClock className="h-3.5 w-3.5" />
        Invitation envoyée
      </span>
    );
  }
  // statut === "refusee" ou aucun partenariat : on peut (re)envoyer une invitation
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-sm"
      onClick={() => onOuvrirDialog(entreprise)}
    >
      <FiSend className="h-3.5 w-3.5" />
      {statut === "refusee" ? "Renvoyer une invitation" : "Inviter"}
    </Button>
  );
}

export default function DecouvrirEntreprisesTab() {
  const [recherche, setRecherche] = useState("");
  const [cible, setCible] = useState(null);
  const [message, setMessage] = useState("");
  const { data: entreprises, isLoading } = useEntreprisesDecouvrir(recherche);
  const mutation = useEnvoyerInvitation();

  function ouvrirDialog(entreprise) {
    setCible(entreprise);
    setMessage("");
    mutation.reset();
  }

    function envoyer() {
    if(!cible) return;
    mutation.mutate(
      { idEntreprise: cible.idEntreprise, message },
      { onSuccess: () => setCible(null) },
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une entreprise..."
          className="h-10 rounded-sm pl-9"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <FiLoader className="h-5 w-5 animate-spin" />
          Chargement...
        </div>
      )}

      {entreprises && entreprises.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <FiBriefcase className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Aucune entreprise vérifiée trouvée
          </p>
        </div>
      )}

      {entreprises && entreprises.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          {entreprises.map((e) => (
            <div
              key={e.idEntreprise}
              className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3.5 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-primary/10 text-xs font-bold text-primary">
                  {initiales(e.nomEntreprise)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {e.nomEntreprise}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {e.secteurActivite || "Secteur non renseigné"}
                    {e.ville && (
                      <>
                        <span>·</span>
                        <FiMapPin className="h-3 w-3" />
                        {e.ville}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <ActionInvitation entreprise={e} onOuvrirDialog={ouvrirDialog} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!cible} onOpenChange={(open) => !open && setCible(null)}>
        <DialogContent className="rounded-md sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Inviter {cible?.nomEntreprise}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Un message court expliquant votre intérêt augmente les chances que
              l&apos;entreprise accepte votre invitation.
            </p>
            <textarea
              rows={4}
              placeholder="Bonjour, nous souhaiterions proposer vos offres à nos étudiants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            {mutation.isError && (
              <p className="text-xs text-destructive">
                {mutation.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCible(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={mutation.isPending}
                onClick={envoyer}
                className="rounded-sm"
              >
                {mutation.isPending ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  "Envoyer l'invitation"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
