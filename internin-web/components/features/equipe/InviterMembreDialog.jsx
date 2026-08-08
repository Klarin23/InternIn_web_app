"use client";

import { useState } from "react";
import { FiUserPlus, FiLoader, FiAlertCircle } from "react-icons/fi";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROLES_INVITABLES } from "./equipeConstants";
import { useCatalogueEquipe, useInviterMembre } from "@/lib/queries/useEquipe";

export default function InviterMembreDialog() {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [roleEquipe, setRoleEquipe] = useState("lecture_seule");
  // null = l'administrateur n'a pas encore personnalisé la liste : on affiche
  // les permissions par défaut du rôle, calculées au rendu (pas d'effet).
  const [permissions, setPermissions] = useState(null);

  const { data: catalogue } = useCatalogueEquipe();
  const mutation = useInviterMembre();

  const permissionsEffectives =
    permissions ?? catalogue?.permissionsParDefautRole[roleEquipe] ?? [];

  function handleRoleChange(nouveauRole) {
    setRoleEquipe(nouveauRole);
    // Le changement de rôle réinitialise la personnalisation : on revient
    // aux permissions par défaut du nouveau rôle.
    setPermissions(null);
  }

  function togglePermission(cle) {
    const base = permissionsEffectives;
    setPermissions(
      base.includes(cle) ? base.filter((p) => p !== cle) : [...base, cle],
    );
  }

  function resetForm() {
    setNom("");
    setEmail("");
    setRoleEquipe("lecture_seule");
    setPermissions(null);
  }

  function handleSubmit() {
    mutation.mutate(
      {
        nom,
        email,
        roleEquipe,
        permissionsPersonnalisees: permissionsEffectives,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) mutation.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" className="h-10 rounded-sm">
          <FiUserPlus className="h-4 w-4" />
          Inviter un membre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-md sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Inviter un membre de l&apos;équipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom complet</Label>
            <Input
              id="nom"
              placeholder="Ex : Awa Koné"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="h-11 rounded-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="awa.kone@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Select value={roleEquipe} onValueChange={handleRoleChange}>
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

          {catalogue && (
            <div className="space-y-2">
              <Label>Fonctionnalités accessibles</Label>
              <div className="space-y-2 rounded-sm border border-border p-3">
                {catalogue.permissions.map((p) => (
                  <label
                    key={p.cle}
                    className="flex items-center gap-2.5 text-sm text-foreground"
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
            <div className="flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {mutation.error.message}
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!nom || !email || mutation.isPending}
            className="h-11 w-full rounded-sm"
          >
            {mutation.isPending ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              "Envoyer l'invitation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
