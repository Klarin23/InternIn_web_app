"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUserPlus,
  FiLoader,
  FiAlertCircle,
  FiMail,
  FiUser,
  FiCheck,
  FiX,
} from "react-icons/fi";
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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROLES_INVITABLES, ROLE_LABELS } from "./equipeConstants";
import { useCatalogueEquipe, useInviterMembre } from "@/lib/queries/useEquipe";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviterMembreDialog() {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [roleEquipe, setRoleEquipe] = useState("lecture_seule");
  // null = l'administrateur n'a pas encore personnalisé la liste : on affiche
  // les permissions par défaut du rôle, calculées au rendu (pas d'effet).
  const [permissions, setPermissions] = useState(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: catalogue } = useCatalogueEquipe();
  const mutation = useInviterMembre();

  const permissionsEffectives =
    permissions ?? catalogue?.permissionsParDefautRole[roleEquipe] ?? [];

  const emailValide = EMAIL_REGEX.test(email.trim());
  const emailErreur =
    emailTouched && email.trim() && !emailValide
      ? "Veuillez saisir une adresse e-mail valide."
      : null;
  const emailOk = emailTouched && emailValide;

  const roleSelectionne = useMemo(
    () => ROLES_INVITABLES.find((r) => r.value === roleEquipe),
    [roleEquipe],
  );

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
    setEmailTouched(false);
    setShowSuccess(false);
  }

  function handleSubmit() {
    if (!nom.trim() || !emailValide || mutation.isPending) return;

    mutation.mutate(
      {
        nom: nom.trim(),
        email: email.trim(),
        roleEquipe,
        permissionsPersonnalisees: permissionsEffectives,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => {
            setOpen(false);
            resetForm();
            mutation.reset();
          }, 1400);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          mutation.reset();
          setShowSuccess(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="h-10 gap-2 rounded-md transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <FiUserPlus className="h-4 w-4" />
          Inviter un membre
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl p-0 sm:max-w-[720px]">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
              >
                <FiCheck className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground">
                Invitation envoyée !
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                L&apos;invitation a été envoyée avec succès.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="border-b border-border px-6 pb-4 pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FiUserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold">
                      Inviter un membre
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                      Ajoutez un collaborateur à votre équipe InternIn.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-0 md:grid-cols-[1fr_240px]">
                {/* Formulaire */}
                <div className="space-y-4 px-6 py-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-nom">Nom complet</Label>
                    <div className="relative">
                      <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="invite-nom"
                        placeholder="Ex : Awa Koné"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="h-11 rounded-md pl-10"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">
                      Adresse e-mail professionnelle
                    </Label>
                    <div className="relative">
                      <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="awa.kone@entreprise.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        className={`h-11 rounded-md pl-10 pr-10 ${
                          emailErreur
                            ? "border-destructive focus-visible:ring-destructive/30"
                            : emailOk
                              ? "border-emerald-500/60 focus-visible:ring-emerald-500/30"
                              : ""
                        }`}
                        autoComplete="email"
                        aria-invalid={!!emailErreur}
                      />
                      {emailOk && (
                        <FiCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                      )}
                    </div>
                    {emailErreur && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <FiAlertCircle className="h-3 w-3" />
                        {emailErreur}
                      </p>
                    )}
                    {emailOk && (
                      <p className="text-xs text-emerald-600">
                        Adresse e-mail valide ✓
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Rôle</Label>
                    <Select value={roleEquipe} onValueChange={handleRoleChange}>
                      <SelectTrigger className="h-11 w-full rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES_INVITABLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            <div className="flex flex-col py-0.5">
                              <span>{r.label}</span>
                              {r.description && (
                                <span className="text-[11px] text-muted-foreground">
                                  {r.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roleSelectionne?.description && (
                      <p className="text-xs text-muted-foreground">
                        {roleSelectionne.description}
                      </p>
                    )}
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
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{mutation.error.message}</span>
                    </motion.div>
                  )}

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      !nom.trim() || !emailValide || mutation.isPending
                    }
                    className="h-11 w-full rounded-md"
                  >
                    {mutation.isPending ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer l'invitation"
                    )}
                  </Button>
                </div>

                {/* Aperçu (desktop) */}
                <div className="hidden border-l border-border bg-muted/30 p-5 md:block">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Aperçu
                  </p>
                  <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                        IN
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        InternIn
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Vous êtes invité à rejoindre l&apos;équipe de cette
                      entreprise.
                    </p>
                    <div className="mt-4 space-y-2 border-t border-border pt-3">
                      <div className="flex items-center gap-2 text-xs">
                        <FiUser className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {nom.trim() || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <FiMail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate text-muted-foreground">
                          {email.trim() || "email@exemple.com"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {ROLE_LABELS[roleEquipe] || roleEquipe}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
