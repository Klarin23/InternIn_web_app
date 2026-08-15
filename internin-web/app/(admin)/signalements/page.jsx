"use client";

import { useState } from "react";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useLitigesAdmin,
  useChangerStatutLitige,
} from "@/lib/queries/useLitiges";

// Le schéma des signalements (table litiges_reclamations) ne porte ni
// gravité/priorité ni cible polymorphe (offre/utilisateur/entreprise) ni
// nombre de plaignants distinct — chaque ligne correspond à un plaignant
// unique. Le badge affiché ici reflète donc le statut réel du signalement
// (ouvert/en_cours/résolu/rejeté), et le sous-titre affiche la description
// fournie par le plaignant plutôt qu'une référence de cible fabriquée.
const STATUT_STYLE = {
  ouvert: "bg-destructive/10 text-destructive",
  en_cours: "bg-warning/10 text-warning",
  resolu: "bg-success/10 text-success",
  rejete: "bg-muted text-muted-foreground",
};

const STATUT_LABEL = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  resolu: "Résolu",
  rejete: "Rejeté",
};

function codeSignalement(idLitige) {
  return `SIG-${idLitige.replace(/-/g, "").slice(0, 3).toUpperCase()}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SignalementRow({ litige, onTraiter, clotureMutation }) {
  const estFerme = litige.statut === "resolu" || litige.statut === "rejete";
  const isPending =
    clotureMutation.isPending &&
    clotureMutation.variables?.id === litige.idLitige;

  return (
    <div
      className={`flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between ${
        estFerme ? "opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex-shrink-0 font-mono text-xs font-medium text-primary">
          {codeSignalement(litige.idLitige)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">
            {litige.typeLitige || "Signalement"}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {litige.emailPlaignant} — {litige.description}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-4 sm:gap-5">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUT_STYLE[litige.statut]}`}
        >
          {STATUT_LABEL[litige.statut]}
        </span>

        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(litige.dateCreation)}
        </span>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={() => onTraiter(litige)}
          >
            Traiter
          </Button>

          {!estFerme && (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="rounded-sm bg-success text-white hover:bg-success/90"
              onClick={() =>
                clotureMutation.mutate({
                  id: litige.idLitige,
                  statut: "resolu",
                })
              }
            >
              {isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
              Clore
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignalementsAdminPage() {
  const [recherche, setRecherche] = useState("");
  const [litigeOuvert, setLitigeOuvert] = useState(null);
  const [statutChoisi, setStatutChoisi] = useState(null);

  const { data: litiges, isLoading } = useLitigesAdmin();
  const statutMutation = useChangerStatutLitige();

  const litigesFiltres = (litiges || []).filter((l) => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      (l.typeLitige || "").toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.emailPlaignant.toLowerCase().includes(q)
    );
  });

  function ouvrirTraitement(litige) {
    setLitigeOuvert(litige);
    setStatutChoisi(litige.statut);
  }

  function enregistrerStatut() {
    if (!litigeOuvert || !statutChoisi) return;
    statutMutation.mutate(
      { id: litigeOuvert.idLitige, statut: statutChoisi },
      { onSuccess: () => setLitigeOuvert(null) },
    );
  }

  return (
    <>
      <AppHeader
        title="Signalements"
        subtitle="Rapports et contenus signalés par la communauté"
        searchValue={recherche}
        onSearchChange={setRecherche}
        refreshKeys={["litigesAdmin", "adminStats"]}
      />

      <div className="px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {!isLoading && litigesFiltres.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiAlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun signalement pour l&apos;instant
            </p>
          </div>
        )}

        {litigesFiltres.length > 0 && (
          <div className="space-y-3">
            {litigesFiltres.map((l) => (
              <SignalementRow
                key={l.idLitige}
                litige={l}
                onTraiter={ouvrirTraitement}
                clotureMutation={statutMutation}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!litigeOuvert}
        onOpenChange={(open) => !open && setLitigeOuvert(null)}
      >
        <DialogContent>
          {litigeOuvert && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {litigeOuvert.typeLitige || "Signalement"}
                </DialogTitle>
                <DialogDescription>
                  {codeSignalement(litigeOuvert.idLitige)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plaignant</span>
                  <span className="font-medium text-foreground">
                    {litigeOuvert.emailPlaignant}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Description</span>
                  <p className="mt-1 text-foreground">
                    {litigeOuvert.description}
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signalé le</span>
                  <span className="font-medium text-foreground">
                    {formatDate(litigeOuvert.dateCreation)}
                  </span>
                </div>
                {litigeOuvert.adminAssigne && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Pris en charge par
                    </span>
                    <span className="font-medium text-foreground">
                      {litigeOuvert.adminAssigne}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Statut
                  </label>
                  <Select value={statutChoisi} onValueChange={setStatutChoisi}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ouvert">Ouvert</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="resolu">Résolu</SelectItem>
                      <SelectItem value="rejete">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={statutMutation.isPending}
                  onClick={enregistrerStatut}
                >
                  {statutMutation.isPending ? (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  ) : null}
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
