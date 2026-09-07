/**
 * Traduit titre/message d'une notification selon son `type`.
 * Fallback : normalisation des types (dot → underscore) + extraction de paramètres.
 */

function extractOffer(message = "") {
  const m = String(message).match(/[«"]\s*([^»"]+?)\s*[»"]/);
  if (m) return m[1].trim();
  // "opportunité de stage : Titre"
  const m2 = String(message).match(/stage\s*:\s*(.+)$/i);
  if (m2) return m2[1].trim();
  return "";
}

function extractCompany(message = "") {
  const msg = String(message);
  let m = msg.match(/^(.+?)\s+(?:a |n'a |souhaite )/);
  if (m) return m[1].trim();
  m = msg.match(/chez\s+(.+?)\s+est/i);
  if (m) return m[1].trim();
  m = msg.match(/»\s*\(([^)]+)\)/);
  if (m) return m[1].trim();
  return "";
}

function extractWeek(titre = "", message = "") {
  const m = String(titre).match(/semaine\s+(\d+)/i) || String(message).match(/semaine\s+(\d+)/i);
  if (m) return m[1];
  const m2 = String(titre).match(/week\s+(\d+)/i);
  return m2?.[1] || "";
}

/** Normalise type API (entretien.planifie → entretien_planifie, etc.) */
function normalizeType(type = "") {
  let t = String(type || "").toLowerCase().trim();
  t = t.replace(/\./g, "_");
  // alias courants
  const aliases = {
    entretien_cree: "entretien_planifie",
    entretien_maj: "entretien_replanifie",
    entretien_valide: "entretien_confirme",
    entretien_reprogramme: "entretien_replanifie",
    candidature_recue: "candidature_recue",
    proposition: "proposition_stage",
  };
  return aliases[t] || t;
}

/** Fallback si le type n'est pas mappé : tenter via le titre FR connu */
const TITLE_TO_TYPE = {
  "nouvelle proposition de stage": "proposition_stage",
  "proposition acceptée": "proposition_acceptee",
  "proposition refusée": "proposition_refusee",
  "candidature présélectionnée": "candidature_preselectionnee",
  "candidature non retenue": "candidature_rejetee",
  "candidature retirée": "candidature_retiree_confirmation",
  "nouvel entretien planifié": "entretien_planifie",
  "nouvelle date d'entretien proposée": "entretien_replanifie",
  "entretien annulé par le candidat": "entretien_annule",
  "entretien confirmé par le candidat": "entretien_confirme",
  "demande de reprogrammation": "entretien_reprogrammation_demandee",
  "offre finale validée": "offre_finale_approuvee",
  "offre finale rejetée": "offre_finale_rejetee",
  "offre finale acceptée 🎉": "offre_finale_acceptee",
  "offre finale acceptée": "offre_finale_acceptee",
  "offre finale déclinée": "offre_finale_refusee",
  "votre stage est programmé": "stage_programme",
  "votre stage démarre aujourd'hui": "stage_demarre",
  "stage terminé — certificat disponible": "stage_termine",
  "convention validée par votre université": "convention_validee_universite",
  "convention validée par l'université": "convention_validee_universite",
  "nouvelle recommandation reçue": "recommandation_recue",
  "rappel : évaluation à effectuer": "rappel_evaluation_stage",
  "nouvelle candidature reçue": "candidature_recue",
  "nouveau signalement à traiter": "signalement_cree",
  "report received": "signalement_soumis",
  "signalement reçu": "signalement_soumis",
  "signalement en cours de traitement": "signalement_en_cours",
  "report under review": "signalement_en_cours",
  "signalement résolu": "signalement_resolu",
  "report resolved": "signalement_resolu",
  "signalement rejeté": "signalement_rejete",
  "report dismissed": "signalement_rejete",
  "[sécurité] état critique": "securite_etat_critique",
  "[sécurité] état attention": "securite_etat_attention",
  "[sécurité] état sécurisée": "securite_etat_securisee",
};

export function translateNotification(n, t) {
  if (!n) return { titre: "", message: "" };

  let type = normalizeType(n.type);
  if (!type || type === "systeme" || type === "notification_created") {
    const fromTitle = TITLE_TO_TYPE[String(n.titre || "").toLowerCase().trim()];
    if (fromTitle) type = fromTitle;
  }
  // Évaluation semaine N
  if (/évaluation semaine/i.test(n.titre || "") || /evaluation week/i.test(n.titre || "")) {
    type = "evaluation_soumise";
  }


  // Admin security state notifications: "[Sécurité] État Critique"
  if (/\[Sécurité\]\s*État\s*Critique/i.test(n.titre || "") || /\[Security\]\s*State\s*Critical/i.test(n.titre || "")) {
    type = "securite_etat_critique";
  } else if (/\[Sécurité\]\s*État\s*Attention/i.test(n.titre || "") || /\[Security\]\s*State\s*Attention/i.test(n.titre || "")) {
    type = "securite_etat_attention";
  } else if (/\[Sécurité\]\s*État\s*Sécurisée/i.test(n.titre || "")) {
    type = "securite_etat_securisee";
  }

  const titleKey = `notifications.types.${type}.title`;
  const messageKey = `notifications.types.${type}.message`;

  const company = extractCompany(n.message) || "—";
  const offer = extractOffer(n.message) || extractOffer(n.titre) || "—";
  const week = extractWeek(n.titre, n.message) || "—";

  const params = { company, offer, week };

  const rawTitle = t(titleKey);
  const rawMessage = t(messageKey);

  const titre =
    rawTitle && rawTitle !== titleKey
      ? t(titleKey, params)
      : n.titre || "";

  const message =
    rawMessage && rawMessage !== messageKey
      ? t(messageKey, params)
      : n.message || "";

  return { titre, message };
}
