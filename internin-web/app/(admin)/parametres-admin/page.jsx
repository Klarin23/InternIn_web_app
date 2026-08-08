"use client";

import {  useState } from "react";
import { FiLoader } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import {
  useParametres,
  useUpdateParametres,
} from "@/lib/queries/useParametres";

// Interrupteur on/off — il n'existe pas encore de composant "switch" dans
// components/ui, donc on en construit un minimal ici plutôt que d'ajouter
// une dépendance pour un seul usage.
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// Non-contrôlé : `key={value}` force un remount (donc un nouveau
// `defaultValue`) chaque fois que la valeur source change depuis
// l'extérieur (ex. après un succès de mutation) — évite tout
// useState+useEffect de resynchronisation, seul le blur déclenche l'enregistrement.
function NumberField({ value, onCommit, disabled }) {
  return (
    <input
      key={value}
      type="number"
      defaultValue={value}
      disabled={disabled}
      onBlur={(e) => {
        const n = Number(e.target.value);
        if (!Number.isNaN(n) && n !== value) onCommit(n);
      }}
      className="w-20 rounded-md border border-border bg-white px-3 py-2 text-right text-sm text-foreground outline-none focus:border-primary"
    />
  );
}

export default function ParametresAdminPage() {
  const [recherche, setRecherche] = useState("");
  const { data: parametres, isLoading } = useParametres();
  const updateMutation = useUpdateParametres();

  function commit(champ, valeur) {
    updateMutation.mutate({ [champ]: valeur });
  }

  return (
    <>
      <AppHeader
        title="Paramètres"
        subtitle="Configuration générale de la plateforme"
        searchValue={recherche}
        onSearchChange={setRecherche}
      />

      <div className="max-w-2xl space-y-6 px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {parametres && (
          <>
            <Section title="Validation des offres">
              <Row
                label="Validation automatique"
                description="Approuver automatiquement les offres des entreprises déjà vérifiées"
              >
                <Toggle
                  checked={parametres.validationAutomatique}
                  disabled={updateMutation.isPending}
                  onChange={(v) => commit("validationAutomatique", v)}
                />
              </Row>
              <Row
                label="Délai de traitement (heures)"
                description="Au-delà de ce délai, l'offre est marquée urgente"
              >
                <NumberField
                  value={parametres.delaiTraitementHeures}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("delaiTraitementHeures", v)}
                />
              </Row>
            </Section>

            <Section title="Vérification des identités">
              <Row
                label="Documents requis par entité"
                description="Nombre minimal de documents pour valider une université ou entreprise"
              >
                <NumberField
                  value={parametres.documentsRequisParEntite}
                  disabled={updateMutation.isPending}
                  onCommit={(v) => commit("documentsRequisParEntite", v)}
                />
              </Row>
            </Section>

            <Section title="Notifications">
              <Row
                label="Notifications par email"
                description="Recevoir les alertes et actions requises par email"
              >
                <Toggle
                  checked={parametres.notificationsEmail}
                  disabled={updateMutation.isPending}
                  onChange={(v) => commit("notificationsEmail", v)}
                />
              </Row>
            </Section>

            <Section title="Sécurité">
              <Row
                label="Double authentification"
                description="Obligatoire pour tous les comptes administrateurs"
              >
                <Toggle
                  checked={parametres.doubleAuthentification}
                  disabled={updateMutation.isPending}
                  onChange={(v) => commit("doubleAuthentification", v)}
                />
              </Row>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
