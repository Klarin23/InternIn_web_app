"use client";

import {
  FiBriefcase,
  FiMail,
  FiMapPin,
  FiGlobe,
  FiLinkedin,
  FiUsers,
  FiFileText,
  FiLoader,
  FiCheck,
  FiExternalLink,
  FiCalendar,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useDocumentsEntreprise } from "@/lib/queries/useDocumentsEntreprise";

const TAILLE_LABELS = {
  "1-10": "1 à 10 salariés",
  "11-50": "11 à 50 salariés",
  "51-200": "51 à 200 salariés",
  "201-500": "201 à 500 salariés",
  "500+": "Plus de 500 salariés",
};

const TYPE_DOCUMENT_LABELS = {
  registre_commerce: "Registre de commerce",
  certificat_constitution: "Certificat de constitution",
  justificatif_entreprise: "Justificatif d'entreprise",
  autre: "Autre document",
};

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Champ({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-foreground">{children}</p>
      </div>
    </div>
  );
}

function BlocTexte({ titre, texte }) {
  if (!texte) return null;
  return (
    <div>
      <h4 className="mb-1.5 text-sm font-semibold text-foreground">{titre}</h4>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{texte}</p>
    </div>
  );
}

export default function EntrepriseDetailPanel({
  entreprise,
  badge,
  verifierMutation,
  statutMutation,
}) {
  const { data: docs, isLoading: loadingDocs } = useDocumentsEntreprise(
    entreprise.idEntreprise,
  );

  const isPending =
    (verifierMutation.isPending &&
      verifierMutation.variables?.id === entreprise.idEntreprise) ||
    (statutMutation.isPending &&
      statutMutation.variables?.id === entreprise.idEntreprise);

  return (
    <div className="space-y-6 rounded-md border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <FiBriefcase className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                {entreprise.nomEntreprise}
              </h2>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {badge.label}
              </span>
            </div>
            {entreprise.secteurActivite && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {entreprise.secteurActivite}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {entreprise.statutCompte === "suspendu" ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="rounded-sm"
              onClick={() =>
                statutMutation.mutate({
                  id: entreprise.idEntreprise,
                  statutCompte: "actif",
                })
              }
            >
              {isPending && <FiLoader className="h-4 w-4 animate-spin" />}
              Réactiver
            </Button>
          ) : entreprise.statutVerification === "en_attente" ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              className="rounded-sm bg-success text-white hover:bg-success/90"
              onClick={() =>
                verifierMutation.mutate({
                  id: entreprise.idEntreprise,
                  statutVerification: "verifiee",
                })
              }
            >
              {isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiCheck className="h-4 w-4" />
              )}
              Vérifier
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/5"
              onClick={() =>
                statutMutation.mutate({
                  id: entreprise.idEntreprise,
                  statutCompte: "suspendu",
                })
              }
            >
              {isPending && <FiLoader className="h-4 w-4 animate-spin" />}
              Suspendre
            </Button>
          )}
        </div>
      </div>

      {/* Coordonnées */}
      <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <Champ icon={FiMail} label="Email">
          {entreprise.email}
        </Champ>
        <Champ icon={FiMapPin} label="Localisation">
          {[entreprise.adresse, entreprise.ville, entreprise.pays]
            .filter(Boolean)
            .join(", ") || null}
        </Champ>
        <Champ icon={FiUsers} label="Taille de l'entreprise">
          {TAILLE_LABELS[entreprise.tailleEntreprise] || null}
        </Champ>
        <Champ icon={FiCalendar} label="Membre depuis">
          {formatDate(entreprise.dateCreation)}
        </Champ>
        {entreprise.siteWeb && (
          <Champ icon={FiGlobe} label="Site web">
            <a
              href={entreprise.siteWeb}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {entreprise.siteWeb} <FiExternalLink className="h-3 w-3" />
            </a>
          </Champ>
        )}
        {entreprise.linkedinUrl && (
          <Champ icon={FiLinkedin} label="LinkedIn">
            <a
              href={entreprise.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Voir le profil <FiExternalLink className="h-3 w-3" />
            </a>
          </Champ>
        )}
        {entreprise.dateVerification && (
          <Champ icon={FiCheck} label="Vérifiée le">
            {formatDate(entreprise.dateVerification)}
          </Champ>
        )}
      </div>

      {/* Présentation */}
      {(entreprise.aPropos || entreprise.mission || entreprise.cultureEntreprise) && (
        <div className="space-y-4 border-t border-border pt-5">
          <BlocTexte titre="À propos" texte={entreprise.aPropos} />
          <BlocTexte titre="Mission" texte={entreprise.mission} />
          <BlocTexte titre="Culture d'entreprise" texte={entreprise.cultureEntreprise} />
        </div>
      )}

      {/* Documents */}
      <div className="border-t border-border pt-5">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <FiFileText className="h-4 w-4 text-muted-foreground" />
          Documents déposés ({entreprise.nbDocuments})
        </h4>

        {loadingDocs && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FiLoader className="h-3.5 w-3.5 animate-spin" />
            Chargement des documents...
          </p>
        )}

        {!loadingDocs && (!docs || docs.length === 0) && (
          <p className="text-xs text-muted-foreground">
            Aucun document déposé pour l&apos;instant.
          </p>
        )}

        {!loadingDocs && docs && docs.length > 0 && (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.idDocument}
                className="flex items-center justify-between gap-3 rounded-sm border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FiFileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {doc.nomFichier || TYPE_DOCUMENT_LABELS[doc.typeDocument] || "Document"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_DOCUMENT_LABELS[doc.typeDocument] || doc.typeDocument} ·{" "}
                      {formatDate(doc.dateUpload)}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.urlFichier}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Ouvrir <FiExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}