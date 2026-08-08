"use client";

import { useState } from "react";
import { FiLoader, FiAlertCircle, FiCheck } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES_INVITABLES } from "./equipeConstants";
import {
  useParametresEquipe,
  useUpdateParametresEquipe,
} from "@/lib/queries/useEquipe";

// Formulaire isolé : son état local est initialisé directement à partir des
// paramètres déjà chargés (le parent ne le monte qu'une fois les données
// disponibles), donc pas besoin d'effet pour "synchroniser" l'état.
function ParametresEquipeForm({ parametres }) {
  const mutation = useUpdateParametresEquipe();

  const [roleParDefautInvitation, setRoleParDefautInvitation] = useState(
    parametres.roleParDefautInvitation,
  );
  const [expirationInvitationJours, setExpirationInvitationJours] = useState(
    parametres.expirationInvitationJours,
  );
  const [
    approbationRequisePourInvitation,
    setApprobationRequisePourInvitation,
  ] = useState(parametres.approbationRequisePourInvitation);
  const [notifierAdminNouvelleActivite, setNotifierAdminNouvelleActivite] =
    useState(parametres.notifierAdminNouvelleActivite);

  function handleSubmit() {
    mutation.mutate({
      roleParDefautInvitation,
      expirationInvitationJours: Number(expirationInvitationJours),
      approbationRequisePourInvitation,
      notifierAdminNouvelleActivite,
    });
  }

  return (
    <div className="max-w-lg space-y-5 rounded-md border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label>Rôle par défaut pour les nouvelles invitations</Label>
        <Select
          value={roleParDefautInvitation}
          onValueChange={setRoleParDefautInvitation}
        >
          <SelectTrigger className="h-11 w-full rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES_INVITABLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expiration">Expiration des invitations (jours)</Label>
        <Input
          id="expiration"
          type="number"
          min={1}
          max={90}
          value={expirationInvitationJours}
          onChange={(e) => setExpirationInvitationJours(e.target.value)}
          className="h-11 w-32 rounded-sm"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <Checkbox
          checked={approbationRequisePourInvitation}
          onCheckedChange={(v) => setApprobationRequisePourInvitation(!!v)}
        />
        Exiger une validation avant l&apos;envoi d&apos;une invitation
      </label>

      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <Checkbox
          checked={notifierAdminNouvelleActivite}
          onCheckedChange={(v) => setNotifierAdminNouvelleActivite(!!v)}
        />
        Notifier l&apos;administrateur principal des activités importantes
      </label>

      {mutation.isError && (
        <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {mutation.error.message}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="h-11 rounded-sm"
      >
        {mutation.isPending ? (
          <FiLoader className="h-4 w-4 animate-spin" />
        ) : mutation.isSuccess ? (
          <>
            <FiCheck className="h-4 w-4" />
            Enregistré
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </div>
  );
}

export default function ParametresEquipePanel() {
  const { data: parametres, isLoading } = useParametresEquipe();

  if (isLoading || !parametres) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <FiLoader className="h-5 w-5 animate-spin" />
        Chargement...
      </div>
    );
  }

  return <ParametresEquipeForm parametres={parametres} />;
}
