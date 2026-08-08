"use client";

import { useState } from "react";
import { FiLoader, FiInbox, FiSearch } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Input } from "@/components/ui/input";
import EquipeFiltres from "@/components/features/equipe/EquipeFiltres";
import MembreRow from "@/components/features/equipe/MembreRow";
import InviterMembreDialog from "@/components/features/equipe/InviterMembreDialog";
import MembreDetailDialog from "@/components/features/equipe/MembreDetailDialog";
import AffectationsPanel from "@/components/features/equipe/AffectationsPanel";
import ActivitePanel from "@/components/features/equipe/ActivitePanel";
import ParametresEquipePanel from "@/components/features/equipe/ParametresEquipePanel";
import { useMembresEquipe } from "@/lib/queries/useEquipe";

const ONGLETS = [
  { value: "membres", label: "Membres" },
  { value: "affectations", label: "Affectations" },
  { value: "activite", label: "Activité" },
  { value: "parametres", label: "Paramètres" },
];

export default function EquipePage() {
  const [onglet, setOnglet] = useState("membres");
  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [membreOuvert, setMembreOuvert] = useState(null);

  const { data: membres, isLoading } = useMembresEquipe({
    recherche: recherche || undefined,
    role: role !== "tous" ? role : undefined,
    statut: statut !== "tous" ? statut : undefined,
  });

  const totalMembres = membres?.length ?? 0;
  const enAttente =
    membres?.filter((m) => m.statutMembre === "invite").length ?? 0;

  return (
    <>
      <AppHeader breadcrumb={[{ label: "Équipe" }]} />
      <div className="px-6 py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Équipe</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {totalMembres} membre{totalMembres > 1 ? "s" : ""}
              {enAttente > 0 &&
                ` · ${enAttente} invitation${enAttente > 1 ? "s" : ""} en attente`}
            </p>
          </div>
          <InviterMembreDialog />
        </div>

        <div className="mb-5 flex flex-wrap gap-2 border-b border-border">
          {ONGLETS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOnglet(o.value)}
              className={`border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${
                onglet === o.value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {onglet === "membres" && (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-262.5 flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  className="h-10 rounded-full pl-10"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
              <EquipeFiltres
                role={role}
                onRoleChange={setRole}
                statut={statut}
                onStatutChange={setStatut}
              />
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-card">
              <div className="grid grid-cols-[1.6fr_1.1fr_1fr_1.2fr] gap-3 border-b border-border bg-muted/40 px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <span>Membre</span>
                <span>Rôle</span>
                <span>Statut</span>
                <span className="text-right">Actions</span>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <FiLoader className="h-5 w-5 animate-spin" />
                  Chargement...
                </div>
              )}

              {!isLoading && (membres || []).length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <FiInbox className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Aucun membre ne correspond
                  </p>
                </div>
              )}

              {(membres || []).map((m, i) => (
                <MembreRow
                  key={m.idMembre}
                  membre={m}
                  index={i}
                  onOuvrirDetail={setMembreOuvert}
                />
              ))}
            </div>
          </>
        )}

        {onglet === "affectations" && <AffectationsPanel />}
        {onglet === "activite" && <ActivitePanel />}
        {onglet === "parametres" && <ParametresEquipePanel />}
      </div>

      <MembreDetailDialog
        membre={membreOuvert}
        onClose={() => setMembreOuvert(null)}
      />
    </>
  );
}
