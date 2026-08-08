"use client";
// Page "Partenariats universités" côté entreprise — miroir de l'onglet
// "Découvrir des entreprises" côté université : ici l'entreprise consulte
// les invitations reçues et peut les accepter/refuser, et retrouve la liste
// des universités déjà partenaires.

import { useState } from "react";
import {
  FiLoader,
  FiCheck,
  FiX,
  FiInbox,
  FiUsers,
  FiMapPin,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  useInvitationsRecues,
  useUniversitesPartenaires,
  useRepondreInvitation,
} from "@/lib/queries/usePartenariats";

function initiales(nom) {
  const mots = nom.trim().split(/\s+/);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

function CarteInvitation({ invitation }) {
  const mutation = useRepondreInvitation();

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-secondary/10 text-sm font-bold text-secondary">
          {initiales(invitation.nomUniversite)}
        </div>
        <div className="min-w-0">
          <h5 className="truncate font-semibold text-foreground">
            {invitation.nomUniversite}
          </h5>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {invitation.typeEtablissement || "Établissement"}
            {invitation.pays && (
              <>
                <span>·</span>
                <FiMapPin className="h-3 w-3" />
                {invitation.pays}
              </>
            )}
          </p>
        </div>
      </div>

      {invitation.messageInvitation && (
        <p className="mb-4 rounded-sm bg-muted/40 p-3 text-sm text-foreground">
          &laquo;&nbsp;{invitation.messageInvitation}&nbsp;&raquo;
        </p>
      )}

      {mutation.isError && (
        <p className="mb-2 text-xs text-destructive">
          {mutation.error.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              idPartenariat: invitation.idPartenariat,
              accepter: true,
            })
          }
          className="rounded-sm"
        >
          {mutation.isPending && mutation.variables?.accepter ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiCheck className="h-4 w-4" />
          )}
          Accepter
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              idPartenariat: invitation.idPartenariat,
              accepter: false,
            })
          }
          className="rounded-sm"
        >
          {mutation.isPending && mutation.variables?.accepter === false ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiX className="h-4 w-4" />
          )}
          Décliner
        </Button>
      </div>
    </div>
  );
}

function LigneUniversitePartenaire({ universite }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3.5 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-secondary/10 text-xs font-bold text-secondary">
          {initiales(universite.nomUniversite)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {universite.nomUniversite}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {universite.typeEtablissement || "Établissement"}
            {universite.pays ? ` · ${universite.pays}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <FiUsers className="h-3.5 w-3.5" />
        {universite.nbEtudiants > 0
          ? `${universite.nbEtudiants} étudiant${universite.nbEtudiants > 1 ? "s" : ""} placé${universite.nbEtudiants > 1 ? "s" : ""}`
          : "Aucun stage démarré"}
      </div>
    </div>
  );
}

export default function PartenariatsUniversitesPage() {
  const [onglet, setOnglet] = useState("invitations");
  const { data: invitations, isLoading: loadingInvitations } =
    useInvitationsRecues();
  const { data: universites, isLoading: loadingUniversites } =
    useUniversitesPartenaires();

  return (
    <>
      <AppHeader
        title="Partenariats universités"
        subtitle="Invitations reçues et universités partenaires"
      />

      <div className="space-y-6 px-6 py-6">
        <div className="inline-flex rounded-sm border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setOnglet("invitations")}
            className={`flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-sm font-medium transition ${
              onglet === "invitations"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invitations reçues
            {invitations && invitations.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {invitations.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setOnglet("partenaires")}
            className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition ${
              onglet === "partenaires"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Universités partenaires
          </button>
        </div>

        {onglet === "invitations" && (
          <>
            {loadingInvitations && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <FiLoader className="h-5 w-5 animate-spin" />
                Chargement...
              </div>
            )}
            {invitations && invitations.length === 0 && !loadingInvitations && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FiInbox className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucune invitation en attente
                </p>
                <p className="max-w-[360px] text-xs text-muted-foreground">
                  Les universités intéressées par vos offres peuvent vous
                  envoyer une invitation de partenariat — elle apparaîtra ici.
                </p>
              </div>
            )}
            {invitations && invitations.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {invitations.map((inv) => (
                  <CarteInvitation key={inv.idPartenariat} invitation={inv} />
                ))}
              </div>
            )}
          </>
        )}

        {onglet === "partenaires" && (
          <>
            {loadingUniversites && (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <FiLoader className="h-5 w-5 animate-spin" />
                Chargement...
              </div>
            )}
            {universites && universites.length === 0 && !loadingUniversites && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FiUsers className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Aucune université partenaire pour l&apos;instant
                </p>
              </div>
            )}
            {universites && universites.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border bg-card">
                {universites.map((u) => (
                  <LigneUniversitePartenaire
                    key={u.idUniversite}
                    universite={u}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
