"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMoreVertical,
  FiRefreshCw,
  FiX,
  FiPause,
  FiPlay,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  STATUT_MEMBRE_LABELS,
  STATUT_MEMBRE_COLORS,
  STATUT_DOT_COLORS,
  AVATAR_COLORS,
} from "./equipeConstants";
import {
  useRenvoyerInvitation,
  useAnnulerInvitation,
  useUpdateStatutMembre,
} from "@/lib/queries/useEquipe";

export default function MembreCard({ membre, index, onOuvrirDetail }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const renvoyer = useRenvoyerInvitation();
  const annuler = useAnnulerInvitation();
  const updateStatut = useUpdateStatutMembre();

  const initiales = (membre.nom || "?")
    .split(" ")
    .map((mot) => mot.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const hasActions =
    membre.statutMembre === "invite" ||
    (!membre.estAdminPrincipal && membre.statutMembre !== "invite") ||
    !membre.estAdminPrincipal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: "0 10px 24px -8px rgba(17, 24, 39, 0.12)" }}
      className="group relative flex flex-col rounded-md border border-border bg-card p-5 transition-shadow"
    >
      {/* Menu actions */}
      {hasActions && (
        <div className="absolute right-3 top-3" ref={menuRef}>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="h-8 w-8 opacity-60 transition group-hover:opacity-100"
            aria-label="Actions du membre"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <FiMoreVertical className="h-4 w-4" />
          </Button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg"
                role="menu"
              >
                {membre.statutMembre === "invite" && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={renvoyer.isPending}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted disabled:opacity-50"
                      onClick={() => {
                        renvoyer.mutate(membre.idMembre);
                        setMenuOpen(false);
                      }}
                    >
                      <FiRefreshCw className="h-3.5 w-3.5" />
                      Renvoyer l&apos;invitation
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={annuler.isPending}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      onClick={() => {
                        annuler.mutate(membre.idMembre);
                        setMenuOpen(false);
                      }}
                    >
                      <FiX className="h-3.5 w-3.5" />
                      Annuler l&apos;invitation
                    </button>
                  </>
                )}

                {!membre.estAdminPrincipal &&
                  membre.statutMembre !== "invite" && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={updateStatut.isPending}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted disabled:opacity-50"
                      onClick={() => {
                        updateStatut.mutate({
                          idMembre: membre.idMembre,
                          statutMembre:
                            membre.statutMembre === "actif"
                              ? "desactive"
                              : "actif",
                        });
                        setMenuOpen(false);
                      }}
                    >
                      {membre.statutMembre === "actif" ? (
                        <>
                          <FiPause className="h-3.5 w-3.5" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <FiPlay className="h-3.5 w-3.5" />
                          Activer
                        </>
                      )}
                    </button>
                  )}

                {!membre.estAdminPrincipal && (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    onClick={() => {
                      onOuvrirDetail(membre);
                      setMenuOpen(false);
                    }}
                  >
                    <FiSettings className="h-3.5 w-3.5" />
                    Modifier le rôle
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Avatar + identité */}
      <button
        type="button"
        onClick={() => onOuvrirDetail(membre)}
        className="flex flex-col items-center text-center"
      >
        <div className="relative mb-3">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white transition group-hover:scale-105"
            style={{ backgroundColor: couleur }}
          >
            {initiales}
          </span>
          <span
            className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${STATUT_DOT_COLORS[membre.statutMembre] || "bg-muted"}`}
            title={STATUT_MEMBRE_LABELS[membre.statutMembre]}
          />
        </div>

        <span className="block max-w-full truncate text-sm font-semibold text-foreground">
          {membre.nom}
          {membre.estAdminPrincipal && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (vous)
            </span>
          )}
        </span>
        <span className="mt-0.5 block max-w-full truncate text-xs text-muted-foreground">
          {membre.email}
        </span>
      </button>

      {/* Badges rôle + statut */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_COLORS[membre.roleEquipe] || "bg-muted text-muted-foreground border-border"}`}
        >
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
    </motion.div>
  );
}
