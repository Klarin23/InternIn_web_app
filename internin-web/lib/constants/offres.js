// Constantes et fonctions utilitaires partagées entre l'affichage des offres
// en liste (OffreCard) et la page de détail. Centralisées ici pour garantir
// un rendu visuel identique partout (mêmes libellés, mêmes couleurs) et
// éviter toute divergence entre les deux pages.
//
// Les libellés dépendent de la langue courante : les fonctions ci-dessous
// prennent toutes `t` (issu de useTranslation()) en premier paramètre.

export const MODE_BADGE_CLASSNAMES = {
  distance: "bg-success/15 text-green-700",
  hybride: "bg-info/15 text-blue-700",
  presentiel: "bg-muted text-muted-foreground",
};

export function modeBadge(t, mode) {
  if (!mode || !MODE_BADGE_CLASSNAMES[mode]) return null;
  return {
    label: t(`workMode.${mode}`),
    className: MODE_BADGE_CLASSNAMES[mode],
  };
}

export function remunerationLabel(t, type) {
  return t(`remunerationLabels.${type}`);
}

export function dureeLabel(t, duree) {
  return t(`durationLabels.${duree}`);
}

// Libellés/couleurs du statut de candidature — mêmes valeurs que
// `candidatures.statut` côté API (voir statutCandidatureEnum dans
// internin-api/src/db/schema.js : soumise, consultee, preselectionnee,
// rejetee, retiree, acceptee). Rien n'est inventé au-delà de ces 6 valeurs.
export const STATUT_CANDIDATURE_CLASSNAMES = {
  soumise: "bg-primary/10 text-primary",
  consultee: "bg-blue-100 text-blue-700",
  preselectionnee: "bg-amber-100 text-amber-700",
  entretien: "bg-[#8B5CF6]/15 text-[#6D28D9]",
  acceptee: "bg-success/15 text-green-700",
  rejetee: "bg-destructive/10 text-destructive",
  retiree: "bg-muted text-muted-foreground",
};

export function statutCandidature(t, statut) {
  if (!statut || !STATUT_CANDIDATURE_CLASSNAMES[statut]) return null;
  return {
    label: t(`offersPage.applicationStatusLong.${statut}`),
    className: STATUT_CANDIDATURE_CLASSNAMES[statut],
  };
}

// Progression "positive" utilisée uniquement pour la timeline visuelle de la
// page de détail. "rejetee" et "retiree" sont des états terminaux qui ne
// s'inscrivent pas sur cette ligne d'avancement : ils sont affichés à part.
export const STATUT_CANDIDATURE_ETAPES = [
  "soumise",
  "consultee",
  "preselectionnee",
  "acceptee",
];

const SECTEUR_PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
];

const AVATAR_PALETTE = [
  "bg-blue-600",
  "bg-cyan-500",
  "bg-purple-600",
  "bg-slate-900",
  "bg-emerald-600",
  "bg-pink-600",
  "bg-orange-500",
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function couleurSecteur(secteur) {
  if (!secteur) return { bg: "bg-muted", text: "text-muted-foreground" };
  return SECTEUR_PALETTE[hashString(secteur) % SECTEUR_PALETTE.length];
}

export function couleurAvatar(nom) {
  return AVATAR_PALETTE[hashString(nom || "?") % AVATAR_PALETTE.length];
}

// Compétences stockées en texte libre côté backend (pas une liste
// structurée) : on les découpe pour un rendu en badges.
export function parseCompetences(texte, limite = 4) {
  if (!texte) return [];
  return texte
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, limite);
}

export function formatRemuneration(t, offre) {
  if (offre.remunerationType === "allocation_mensuelle") {
    return offre.montantRemuneration
      ? t("remunerationLabels.perMonthAmount", {
          amount: Number(offre.montantRemuneration).toLocaleString(),
        })
      : t("remunerationLabels.paid");
  }
  if (offre.remunerationType === "indemnite_transport")
    return t("remunerationLabels.indemnite_transport");
  if (offre.remunerationType === "indemnite_repas")
    return t("remunerationLabels.indemnite_repas");
  if (offre.remunerationType === "indemnite_internet_appel")
    return t("remunerationLabels.indemnite_internet_appel");
  return t("remunerationLabels.aucune");
}

// Une offre est considérée "Nouvelle" si publiée il y a 7 jours ou moins.
export const SEUIL_NOUVEAU_MS = 7 * 24 * 60 * 60 * 1000;

export function estNouvelle(datePublication, maintenant) {
  return Boolean(
    datePublication &&
    maintenant - new Date(datePublication).getTime() <= SEUIL_NOUVEAU_MS,
  );
}

/** Offre expirée = date limite de candidature dépassée (jour courant exclus si on compare à minuit local). */
export function estOffreExpiree(offre) {
  if (!offre?.dateLimiteCandidature) return false;
  // Même logique que le côté entreprise (OffreCardEntreprise / OffreListRow)
  return new Date(offre.dateLimiteCandidature) < new Date();
}