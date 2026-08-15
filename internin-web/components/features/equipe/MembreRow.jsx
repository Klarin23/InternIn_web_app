"use client";

import { motion } from "framer-motion";
import { FiRefreshCw, FiX, FiPause, FiPlay, FiSettings } from "react-icons/fi";
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

export default function MembreRow({ membre, index, onOuvrirDetail }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="grid w-full grid-cols-[1.6fr_1.1fr_1fr_1.2fr] items-center gap-3 border-b border-border px-3 py-3.5 text-sm transition-colors hover:bg-muted/30 last:border-b-0"
    >
      <button
        type="button"
        onClick={() => onOuvrirDetail(membre)}
        className="flex items-center gap-2.5 text-left"
      >
        <span className="relative flex-shrink-0">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: couleur }}
          >
            {initiales}
          </span>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${STATUT_DOT_COLORS[membre.statutMembre] || "bg-muted"}`}
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-foreground">
            {membre.nom}
            {membre.estAdminPrincipal && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (vous)
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {membre.email}
          </span>
        </span>
      </button>

      <span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_COLORS[membre.roleEquipe] || "bg-muted text-muted-foreground border-border"}`}
        >
          {ROLE_LABELS[membre.roleEquipe]}
        </span>
      </span>

      <span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUT_MEMBRE_COLORS[membre.statutMembre]}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${STATUT_DOT_COLORS[membre.statutMembre]}`}
          />
          {STATUT_MEMBRE_LABELS[membre.statutMembre]}
        </span>
      </span>

      <span className="flex items-center justify-end gap-1.5">
        {membre.statutMembre === "invite" && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-md px-2 text-xs"
              disabled={renvoyer.isPending}
              onClick={() => renvoyer.mutate(membre.idMembre)}
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Renvoyer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-md px-2 text-xs text-destructive hover:text-destructive"
              disabled={annuler.isPending}
              onClick={() => annuler.mutate(membre.idMembre)}
            >
              <FiX className="h-3.5 w-3.5" />
              Annuler
            </Button>
          </>
        )}

        {!membre.estAdminPrincipal && membre.statutMembre !== "invite" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-md px-2 text-xs"
            disabled={updateStatut.isPending}
            onClick={() =>
              updateStatut.mutate({
                idMembre: membre.idMembre,
                statutMembre:
                  membre.statutMembre === "actif" ? "desactive" : "actif",
              })
            }
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
          </Button>
        )}

        {!membre.estAdminPrincipal && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 rounded-md px-2 text-xs"
            onClick={() => onOuvrirDetail(membre)}
            aria-label="Modifier le membre"
          >
            <FiSettings className="h-3.5 w-3.5" />
          </Button>
        )}
      </span>
    </motion.div>
  );
}
