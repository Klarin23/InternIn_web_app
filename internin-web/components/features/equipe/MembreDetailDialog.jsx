"use client";

import { useState } from "react";
import { FiLoader, FiAlertCircle, FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ROLES_INVITABLES,
  ROLE_LABELS,
  STATUT_MEMBRE_LABELS,
  STATUT_MEMBRE_COLORS,
  STATUT_DOT_COLORS,
  AVATAR_COLORS,
} from "./equipeConstants";
import { useCatalogueEquipe, useUpdateMembre } from "@/lib/queries/useEquipe";

// Formulaire isolé, remonté (via key={membre.idMembre} dans le parent) à
// chaque changement de membre sélectionné : son état local part directement
// des valeurs du membre, sans effet de synchronisation.
function MembreDetailForm({ membre, catalogue, onClose }) {
  const mutation = useUpdateMembre();
  const [roleEquipe, setRoleEquipe] = useState(membre.roleEquipe);
  const [permissions, setPermissions] = useState(
    membre.permissionsPersonnalisees,
  );

  const permissionsEffectives =
    permissions ?? catalogue?.permissionsParDefautRole[roleEquipe] ?? [];

  function togglePermission(cle) {
    const base = permissionsEffectives;
    setPermissions(
      base.includes(cle) ? base.filter((p) => p !== cle) : [...base, cle],
    );
  }

  function handleRoleChange(nouveauRole) {
    setRoleEquipe(nouveauRole);
    setPermissions(null);
  }

  function handleSubmit() {
    mutation.mutate(
      {
        idMembre: membre.idMembre,
        payload: {
          roleEquipe,
          permissionsPersonnalisees: permissionsEffectives,
        },
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label>Rôle</Label>
        <Select value={roleEquipe} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-11 w-full rounded-md">
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

      {catalogue && (
        <div className="space-y-2">
          <Label>Fonctionnalités accessibles</Label>
          <div className="space-y-2 rounded-md border border-border p-3">
            {catalogue.permissions.map((p) => (
              <label
                key={p.cle}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
              >
                <Checkbox
                  checked={permissionsEffectives.includes(p.cle)}
                  onCheckedChange={() => togglePermission(p.cle)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {mutation.error.message}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="h-11 w-full rounded-md"
      >
        {mutation.isPending ? (
          <FiLoader className="h-4 w-4 animate-spin" />
        ) : (
          "Enregistrer les modifications"
        )}
      </Button>
    </>
  );
}

export default function MembreDetailDialog({ membre, onClose }) {
  const { data: catalogue } = useCatalogueEquipe();

  const initiales = membre
    ? (membre.nom || "?")
        .split(" ")
        .map((mot) => mot.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <Dialog open={!!membre} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-[480px]">
        <DialogHeader>
          {membre && (
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: AVATAR_COLORS[0] }}
              >
                {initiales}
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-semibold">
                  {membre.nom}
                </DialogTitle>
                <DialogDescription className="truncate text-sm">
                  {membre.email}
                </DialogDescription>
              </div>
            </div>
          )}
        </DialogHeader>

        {membre && (
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {ROLE_LABELS[membre.roleEquipe] || membre.roleEquipe}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_MEMBRE_COLORS[membre.statutMembre]}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUT_DOT_COLORS[membre.statutMembre]}`}
                />
                {STATUT_MEMBRE_LABELS[membre.statutMembre]}
              </span>
            </div>

            {membre.estAdminPrincipal ? (
              <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                L&apos;administrateur principal dispose d&apos;un accès complet
                et non modifiable à toutes les fonctionnalités.
              </p>
            ) : (
              <MembreDetailForm
                key={membre.idMembre}
                membre={membre}
                catalogue={catalogue}
                onClose={onClose}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
