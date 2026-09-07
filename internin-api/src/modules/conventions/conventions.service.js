import path from "node:path";
import fs from "node:fs";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  conventionsStage,
  stages,
  stagiaires,
  entreprises,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  contactsEntreprise,
  formations,
  utilisateurs,
  membresEquipe,
  affectationsSuperviseurStage,
} from "../../db/schema.js";
import { genererConventionPdf } from "../../utils/conventionPdf.js";
import { getStageLifecycleStatus } from "../../utils/stageLifecycle.js";
import { repondreOffreFinale } from "../offres-finales/offresFinales.service.js";


/**
 * Résout le maître de stage / superviseur :
 * 1) contacts_entreprise via idContactSuperviseur (stage ou offre finale)
 * 2) sinon membre d'équipe affecté (affectations_superviseur_stage)
 */
async function resolveSuperviseurForConvention(stageRow, offreFinale) {
  const contactId =
    stageRow?.idContactSuperviseur || offreFinale?.idContactSuperviseur || null;

  if (contactId) {
    const [c] = await db
      .select({
        nom: contactsEntreprise.nom,
        fonction: contactsEntreprise.fonction,
        email: contactsEntreprise.email,
        telephone: contactsEntreprise.telephone,
      })
      .from(contactsEntreprise)
      .where(eq(contactsEntreprise.idContact, contactId))
      .limit(1);
    if (c?.nom) return c;
  }

  const idStage = stageRow?.idStage;
  if (!idStage) return null;

  const [aff] = await db
    .select({
      nom: membresEquipe.nom,
      email: membresEquipe.email,
      roleEquipe: membresEquipe.roleEquipe,
      idUtilisateur: membresEquipe.idUtilisateur,
    })
    .from(affectationsSuperviseurStage)
    .innerJoin(
      membresEquipe,
      eq(membresEquipe.idMembre, affectationsSuperviseurStage.idMembre),
    )
    .where(eq(affectationsSuperviseurStage.idStage, idStage))
    .limit(1);

  if (!aff?.nom && !aff?.email) return null;

  let email = aff.email || null;
  if (aff.idUtilisateur) {
    const [u] = await db
      .select({ email: utilisateurs.email })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, aff.idUtilisateur))
      .limit(1);
    if (u?.email) email = u.email;
  }

  return {
    nom: aff.nom || email || "Superviseur",
    fonction:
      aff.roleEquipe === "superviseur"
        ? "Superviseur"
        : aff.roleEquipe || "Maître de stage",
    email,
    telephone: null,
  };
}


/**
 * Profil entreprise considéré complet pour une convention si :
 * - raison sociale présente
 * - ET une localisation exploitable (adresse libre OU ville+pays)
 * Les champs email/téléphone sont enrichis depuis le compte / contacts
 * et ne bloquent plus le statut "complet" s'ils manquent ponctuellement.
 */
function isEntrepriseConventionComplete(entreprise) {
  if (!entreprise) return false;
  const nom = (entreprise.nomEntreprise || entreprise.nom || "").trim();
  if (!nom) return false;
  const adresse = (entreprise.adresse || "").trim();
  const ville = (entreprise.ville || "").trim();
  const pays = (entreprise.pays || "").trim();
  if (adresse) return true;
  if (ville && pays) return true;
  return false;
}

/**
 * Email (compte propriétaire) + téléphone (contact principal).
 * La table entreprises n'a pas de colonnes email/téléphone.
 */
async function enrichEntrepriseContacts(entreprise) {
  if (!entreprise) return null;
  let email = null;
  let telephone = null;

  if (entreprise.idUtilisateur) {
    const [u] = await db
      .select({ email: utilisateurs.email })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, entreprise.idUtilisateur))
      .limit(1);
    email = u?.email || null;
  }

  const [principal] = await db
    .select({
      telephone: contactsEntreprise.telephone,
      email: contactsEntreprise.email,
    })
    .from(contactsEntreprise)
    .where(
      and(
        eq(contactsEntreprise.idEntreprise, entreprise.idEntreprise),
        eq(contactsEntreprise.estContactPrincipal, true),
      ),
    )
    .limit(1);

  if (principal) {
    telephone = principal.telephone || null;
    if (!email) email = principal.email || null;
  }

  if (!telephone) {
    const [any] = await db
      .select({
        telephone: contactsEntreprise.telephone,
        email: contactsEntreprise.email,
      })
      .from(contactsEntreprise)
      .where(eq(contactsEntreprise.idEntreprise, entreprise.idEntreprise))
      .limit(1);
    if (any) {
      telephone = any.telephone || null;
      if (!email) email = any.email || null;
    }
  }

  return {
    ...entreprise,
    email,
    telephone,
  };
}

/**
 * Statut métier dérivé des flags existants (pas de second système parallèle).
 */
export function deriveConventionStatus(convention, offreFinale) {
  if (!convention) return null;

  if (offreFinale?.statutValidationPlateforme === "rejete") {
    return "REFUSEE";
  }
  if (offreFinale?.statutReponseStagiaire === "refusee") {
    return "REFUSEE";
  }

  const ent = !!convention.accepteeParEntreprise;
  const stag = !!convention.accepteeParStagiaire;
  const plat =
    !!convention.approuveeParPlateforme ||
    offreFinale?.statutValidationPlateforme === "approuve";

  if (ent && stag && plat) return "VALIDEE";
  if (ent && stag && !plat) return "EN_ATTENTE_VALIDATION";
  if (ent && !stag) {
    if (!plat) return "EN_ATTENTE_VALIDATION";
    return "EN_ATTENTE_SIGNATURE_STAGIAIRE";
  }
  if (!ent && stag) return "EN_ATTENTE_SIGNATURE_ENTREPRISE";
  return "BROUILLON";
}

export const CONVENTION_STATUS_META = {
  BROUILLON: {
    label: "Brouillon",
    description: "La convention est en cours de préparation.",
  },
  EN_ATTENTE_VALIDATION: {
    label: "En attente de validation",
    description:
      "La plateforme ou l'entreprise doit encore valider les éléments de la convention.",
  },
  EN_ATTENTE_SIGNATURE_STAGIAIRE: {
    label: "Signature stagiaire requise",
    description:
      "Votre accord est requis pour finaliser la convention de stage.",
  },
  EN_ATTENTE_SIGNATURE_ENTREPRISE: {
    label: "En attente de l'entreprise",
    description: "L'entreprise n'a pas encore formalisé son accord.",
  },
  VALIDEE: {
    label: "Convention validée",
    description:
      "Tous les accords sont réunis. La convention est finalisée (le stage suit son propre calendrier).",
  },
  REFUSEE: {
    label: "Refusée",
    description: "La convention ou l'offre associée a été refusée.",
  },
  A_CORRIGER: {
    label: "À corriger",
    description: "Des corrections ont été demandées.",
  },
  ANNULEE: {
    label: "Annulée",
    description: "La convention a été annulée.",
  },
};

async function resolveStagiaire(idUtilisateur) {
  const [s] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);
  return s || null;
}

/**
 * Charge la convention du stagiaire authentifié (via stage OU offre finale en cours).
 * Ne se base jamais sur un idConvention fourni par le client.
 */
export async function getMaConvention(idUtilisateur) {
  const stagiaire = await resolveStagiaire(idUtilisateur);
  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  // 1) Stage existant → convention liée
  const [stageRow] = await db
    .select({
      idStage: stages.idStage,
      idConvention: stages.idConvention,
      idEntreprise: stages.idEntreprise,
      idContactSuperviseur: stages.idContactSuperviseur,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      statutStage: stages.statut,
      objectifsApprentissage: stages.objectifsApprentissage,
    })
    .from(stages)
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire))
    .orderBy(desc(stages.dateCreation))
    .limit(1);

  let convention = null;
  let offreFinale = null;
  let entreprise = null;
  let superviseur = null;
  let stage = null;

  if (stageRow) {
    stage = {
      ...stageRow,
      statutEffectif: getStageLifecycleStatus({
        statut: stageRow.statutStage,
        dateDebut: stageRow.dateDebut,
        dateFinPrevue: stageRow.dateFinPrevue,
      }),
    };

    const [conv] = await db
      .select()
      .from(conventionsStage)
      .where(eq(conventionsStage.idConvention, stageRow.idConvention))
      .limit(1);
    convention = conv || null;

    if (convention) {
      const [of] = await db
        .select()
        .from(offresFinales)
        .where(eq(offresFinales.idOffreFinale, convention.idOffreFinale))
        .limit(1);
      offreFinale = of || null;
    }

    const [ent] = await db
      .select()
      .from(entreprises)
      .where(eq(entreprises.idEntreprise, stageRow.idEntreprise))
      .limit(1);
    entreprise = ent || null;

    superviseur = await resolveSuperviseurForConvention(stageRow, offreFinale);
    entreprise = await enrichEntrepriseContacts(entreprise);
  } else {
    // 2) Pas encore de stage : convention via offre finale liée à une candidature
    const [row] = await db
      .select({
        convention: conventionsStage,
        offreFinale: offresFinales,
        idEntreprise: offresStage.idEntreprise,
        idContactSuperviseur: offresFinales.idContactSuperviseur,
      })
      .from(conventionsStage)
      .innerJoin(
        offresFinales,
        eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
      )
      .innerJoin(
        entretiens,
        eq(offresFinales.idEntretien, entretiens.idEntretien),
      )
      .innerJoin(
        candidatures,
        eq(entretiens.idCandidature, candidatures.idCandidature),
      )
      .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
      .where(eq(candidatures.idStagiaire, stagiaire.idStagiaire))
      .orderBy(desc(conventionsStage.dateCreation))
      .limit(1);

    if (row) {
      convention = row.convention;
      offreFinale = row.offreFinale;
      const [ent] = await db
        .select()
        .from(entreprises)
        .where(eq(entreprises.idEntreprise, row.idEntreprise))
        .limit(1);
      entreprise = ent || null;
      superviseur = await resolveSuperviseurForConvention(
        { idStage: null, idContactSuperviseur: row.idContactSuperviseur },
        offreFinale,
      );
      entreprise = await enrichEntrepriseContacts(entreprise);
    }
  }

  if (!convention) {
    return {
      convention: null,
      statut: null,
      statutMeta: null,
      stage: null,
      offreFinale: null,
      entreprise: null,
      superviseur: null,
      stagiaire: await buildStagiairePayload(stagiaire, idUtilisateur),
      historique: [],
      peutSigner: false,
    };
  }

  const statut = deriveConventionStatus(convention, offreFinale);
  const statutMeta = CONVENTION_STATUS_META[statut] || {
    label: statut,
    description: "",
  };

  const historique = buildHistorique(convention, offreFinale);
  const peutSigner =
    statut === "EN_ATTENTE_SIGNATURE_STAGIAIRE" &&
    offreFinale?.statutValidationPlateforme === "approuve" &&
    !convention.accepteeParStagiaire;

  return {
    convention: {
      idConvention: convention.idConvention,
      idOffreFinale: convention.idOffreFinale,
      accepteeParEntreprise: convention.accepteeParEntreprise,
      dateAcceptationEntreprise: convention.dateAcceptationEntreprise,
      accepteeParStagiaire: convention.accepteeParStagiaire,
      dateAcceptationStagiaire: convention.dateAcceptationStagiaire,
      approuveeParPlateforme: convention.approuveeParPlateforme,
      valideeParUniversite: convention.valideeParUniversite,
      dateValidationUniversite: convention.dateValidationUniversite,
      dateCreation: convention.dateCreation,
      numero: offreFinale?.numero ?? null,
      version: 1,
    },
    statut,
    statutMeta,
    stage: stage
      ? {
          idStage: stage.idStage,
          dateDebut: stage.dateDebut,
          dateFinPrevue: stage.dateFinPrevue,
          statut: stage.statutEffectif,
          objectifsApprentissage: stage.objectifsApprentissage,
          intitulePoste: offreFinale?.intitulePoste || null,
          modeTravail: offreFinale?.modeTravail || null,
          dureeStage: offreFinale?.dureeStage || null,
          volumeHoraireHebdo: offreFinale?.volumeHoraireHebdo || null,
        }
      : offreFinale
        ? {
            idStage: null,
            dateDebut: offreFinale.dateDebut,
            dateFinPrevue: null,
            statut: null,
            objectifsApprentissage: offreFinale.objectifsApprentissage,
            intitulePoste: offreFinale.intitulePoste,
            modeTravail: offreFinale.modeTravail,
            dureeStage: offreFinale.dureeStage,
            volumeHoraireHebdo: offreFinale.volumeHoraireHebdo,
          }
        : null,
    offreFinale: offreFinale
      ? {
          idOffreFinale: offreFinale.idOffreFinale,
          intitulePoste: offreFinale.intitulePoste,
          objectifsApprentissage: offreFinale.objectifsApprentissage,
          statutValidationPlateforme: offreFinale.statutValidationPlateforme,
          statutReponseStagiaire: offreFinale.statutReponseStagiaire,
          dateDebut: offreFinale.dateDebut,
          dureeStage: offreFinale.dureeStage,
          modeTravail: offreFinale.modeTravail,
          volumeHoraireHebdo: offreFinale.volumeHoraireHebdo,
          remunerationType: offreFinale.remunerationType,
          dateValidation: offreFinale.dateValidation,
          numero: offreFinale.numero,
        }
      : null,
    entreprise: entreprise
      ? {
          nomEntreprise: entreprise.nomEntreprise,
          adresse: entreprise.adresse,
          ville: entreprise.ville,
          pays: entreprise.pays,
          logoUrl: entreprise.logoUrl,
          secteurActivite: entreprise.secteurActivite,
          email: entreprise.email || null,
          telephone: entreprise.telephone || null,
        }
      : null,
    superviseur: superviseur
      ? {
          nom: superviseur.nom,
          fonction: superviseur.fonction,
          email: superviseur.email,
          telephone: superviseur.telephone,
        }
      : null,
    stagiaire: await buildStagiairePayload(stagiaire, idUtilisateur),
    historique,
    peutSigner,
  };
}

async function buildStagiairePayload(stagiaire, idUtilisateur) {
  const [user] = await db
    .select({ email: utilisateurs.email })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur))
    .limit(1);

  const forms = await db
    .select()
    .from(formations)
    .where(eq(formations.idStagiaire, stagiaire.idStagiaire));

  const form =
    forms.find((f) => f.typeFormation === "en_cours") || forms[0] || null;

  return {
    prenom: stagiaire.prenom,
    nom: stagiaire.nom,
    email: user?.email || null,
    telephone: stagiaire.telephone,
    formation: form
      ? {
          diplome: form.diplome,
          nomUniversite: form.nomUniversite,
          anneeEtude: form.anneeEtude,
          faculte: form.faculte,
        }
      : null,
  };
}

function buildHistorique(convention, offreFinale) {
  const events = [];
  if (convention.dateCreation) {
    events.push({
      type: "creation",
      label: "Convention créée",
      date: convention.dateCreation,
    });
  }
  if (convention.dateAcceptationEntreprise) {
    events.push({
      type: "signature_entreprise",
      label: "Accord de l'entreprise enregistré",
      date: convention.dateAcceptationEntreprise,
    });
  }
  if (offreFinale?.dateValidation) {
    events.push({
      type: "validation_plateforme",
      label: "Validée par la plateforme",
      date: offreFinale.dateValidation,
    });
  }
  if (convention.dateAcceptationStagiaire) {
    events.push({
      type: "signature_stagiaire",
      label: "Signée par le stagiaire",
      date: convention.dateAcceptationStagiaire,
    });
  }
  if (convention.dateValidationUniversite) {
    events.push({
      type: "validation_universite",
      label: "Validée par l'université",
      date: convention.dateValidationUniversite,
    });
  }
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return events;
}


/**
 * Assemble les données métier pour le PDF à partir d'un payload convention
 * déjà résolu (getMaConvention / getConventionEntrepriseById).
 * Aucune donnée inventée — champs absents = null.
 */
export function buildConventionPdfData(data, statutOverride = null) {
  if (!data?.convention) {
    const err = new Error("Aucune convention disponible");
    err.status = 404;
    throw err;
  }

  const c = data.convention;
  const s = data.stagiaire || {};
  const e = data.entreprise || {};
  const sup = data.superviseur || {};
  const stage = data.stage || {};
  const of = data.offreFinale || {};

  // Cohérence minimale : stagiaire et entreprise doivent être présents
  if (!s.prenom && !s.nom && !s.nomComplet) {
    const err = new Error(
      "Impossible de générer la convention : les informations du stage sont incohérentes.",
    );
    err.status = 422;
    throw err;
  }
  if (!e.nomEntreprise && !e.nom) {
    const err = new Error(
      "Impossible de générer la convention : les informations du stage sont incohérentes.",
    );
    err.status = 422;
    throw err;
  }

  const form = s.formation || {};
  const nomComplet =
    s.nomComplet ||
    [s.prenom, s.nom].filter(Boolean).join(" ") ||
    null;

  const formationDiplome = [
    form.diplome,
    form.faculte,
  ]
    .filter(Boolean)
    .join(" · ") || form.diplome || null;

  const adresseParts = [e.adresse, e.ville, e.pays].filter(Boolean);
  const adresseComplete = adresseParts.length ? adresseParts.join(", ") : e.adresse || null;

  const statut =
    statutOverride ||
    data.statut ||
    deriveConventionStatus(c, of);

  const numero = c.numero ?? of.numero ?? null;
  const numeroAffiche =
    numero != null
      ? `CS-${new Date(c.dateCreation || Date.now()).getFullYear()}-${String(numero).padStart(5, "0")}`
      : null;

  return {
    idConvention: c.idConvention,
    numero,
    numeroAffiche,
    dateGeneration: new Date(),
    statut,
    stagiaire: {
      nomComplet,
      prenom: s.prenom || null,
      nom: s.nom || null,
      email: s.email || null,
      telephone: s.telephone || null,
      etablissement: form.nomUniversite || null,
      formation: form.diplome || null,
      diplome: form.diplome || null,
      formationDiplome,
      anneeEtude: form.anneeEtude || null,
    },
    entreprise: {
      nom: e.nomEntreprise || e.nom || null,
      secteur: e.secteurActivite || e.secteur || null,
      adresse: e.adresse || null,
      ville: e.ville || null,
      pays: e.pays || null,
      email: e.email || null,
      telephone: e.telephone || null,
      adresseComplete,
    },
    superviseur: sup.nom
      ? {
          nom: sup.nom,
          fonction: sup.fonction || null,
          email: sup.email || null,
          telephone: sup.telephone || null,
        }
      : null,
    stage: {
      intitulePoste: stage.intitulePoste || of.intitulePoste || null,
      objectifsApprentissage:
        stage.objectifsApprentissage || of.objectifsApprentissage || null,
      dateDebut: stage.dateDebut || of.dateDebut || null,
      dateFinPrevue: stage.dateFinPrevue || null,
      dureeStage: stage.dureeStage || of.dureeStage || null,
      volumeHoraireHebdo: stage.volumeHoraireHebdo || of.volumeHoraireHebdo || null,
      modeTravail: stage.modeTravail || of.modeTravail || null,
      remunerationType: stage.remunerationType || of.remunerationType || null,
    },
    missions: [],
    signatures: {
      entreprise: !!c.accepteeParEntreprise,
      dateEntreprise: c.dateAcceptationEntreprise || null,
      stagiaire: !!c.accepteeParStagiaire,
      dateStagiaire: c.dateAcceptationStagiaire || null,
      plateforme: !!c.approuveeParPlateforme || of.statutValidationPlateforme === "approuve",
      datePlateforme: of.dateValidation || null,
    },
    historique: {
      dateCreation: c.dateCreation || null,
      dateAcceptationEntreprise: c.dateAcceptationEntreprise || null,
      dateValidationPlateforme: of.dateValidation || null,
      dateAcceptationStagiaire: c.dateAcceptationStagiaire || null,
    },
  };
}

function waitForPdfFile(filepath) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 20; i++) {
      if (fs.existsSync(filepath)) {
        // fichier non vide
        try {
          const st = fs.statSync(filepath);
          if (st.size > 100) return resolve(true);
        } catch { /* retry */ }
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    reject(Object.assign(new Error("Impossible de générer le document"), { status: 500 }));
  });
}

/**
 * Signature interne traçable (V1) — réutilise le flux d'acceptation offre finale.
 */
export async function signerMaConvention(idUtilisateur) {
  const data = await getMaConvention(idUtilisateur);
  if (!data.convention) {
    const err = new Error("Aucune convention disponible");
    err.status = 404;
    throw err;
  }
  if (!data.peutSigner) {
    const err = new Error(
      data.convention.accepteeParStagiaire
        ? "Cette convention est déjà signée."
        : "Cette convention n'est pas encore prête pour signature.",
    );
    err.status = 403;
    throw err;
  }

  const result = await repondreOffreFinale(
    idUtilisateur,
    data.convention.idOffreFinale,
    "acceptee",
  );

  const refreshed = await getMaConvention(idUtilisateur);
  return { ...refreshed, stageCree: result?.stageCree || false };
}

/**
 * Génère (si besoin) et retourne le chemin absolu du PDF — après auth métier.
 */
export async function getMaConventionPdfPath(idUtilisateur, lang = "fr") {
  const data = await getMaConvention(idUtilisateur);
  const pdfData = buildConventionPdfData(data);
  const relative = genererConventionPdf(pdfData, lang === "en" ? "en" : "fr");
  const filepath = path.resolve("uploads", relative);
  await waitForPdfFile(filepath);
  const suffix = lang === "en" ? "en" : "fr";
  const base = pdfData.numeroAffiche || data.convention.idConvention.slice(0, 8);
  return {
    filepath,
    filename: `convention-${base}-${suffix}.pdf`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Espace ENTREPRISE — liste, stats, détail, signature, PDF (anti-IDOR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Charge toutes les conventions rattachées à l'entreprise (via offre stage
 * ou via stage.idEntreprise). Résolution serveur uniquement.
 */
export async function listConventionsEntreprise(idEntreprise, filters = {}) {
  const { recherche, statut: filtreStatut } = filters;

  // Profil entreprise (une fois) — sert à la complétude et aux actions "completer"
  const [entrepriseRow] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise))
    .limit(1);
  const entrepriseProfil = await enrichEntrepriseContacts(entrepriseRow || null);

  // Convention via stage existant
  const viaStage = await db
    .select({
      convention: conventionsStage,
      stage: stages,
      offreFinale: offresFinales,
      stagiaire: stagiaires,
      superviseur: contactsEntreprise,
    })
    .from(stages)
    .innerJoin(
      conventionsStage,
      eq(stages.idConvention, conventionsStage.idConvention),
    )
    .leftJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .leftJoin(
      contactsEntreprise,
      eq(stages.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .where(eq(stages.idEntreprise, idEntreprise))
    .orderBy(desc(conventionsStage.dateCreation));

  // Convention sans stage encore (offre finale en cours) pour cette entreprise
  const viaOf = await db
    .select({
      convention: conventionsStage,
      offreFinale: offresFinales,
      stagiaire: stagiaires,
      superviseur: contactsEntreprise,
      idEntreprise: offresStage.idEntreprise,
    })
    .from(conventionsStage)
    .innerJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .leftJoin(
      contactsEntreprise,
      eq(offresFinales.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .where(eq(offresStage.idEntreprise, idEntreprise))
    .orderBy(desc(conventionsStage.dateCreation));

  const seen = new Set();
  const items = [];

  function pushItem(row, stage) {
    const id = row.convention.idConvention;
    if (seen.has(id)) return;
    seen.add(id);

    const statut = deriveConventionStatus(row.convention, row.offreFinale);
    const stagiaireNom = `${row.stagiaire.prenom || ""} ${row.stagiaire.nom || ""}`.trim();
    const intitule =
      row.offreFinale?.intitulePoste ||
      stage?.objectifsApprentissage?.slice(0, 80) ||
      "Stage";

    const dateDebut = stage?.dateDebut || row.offreFinale?.dateDebut || null;
    const dateFin = stage?.dateFinPrevue || null;
    const derniereModif =
      row.convention.dateAcceptationStagiaire ||
      row.convention.dateAcceptationEntreprise ||
      row.convention.dateCreation;

    items.push({
      idConvention: id,
      numero: row.offreFinale?.numero || null,
      statut,
      statutMeta: CONVENTION_STATUS_META[statut] || { label: statut, description: "" },
      stagiaire: {
        idStagiaire: row.stagiaire.idStagiaire,
        prenom: row.stagiaire.prenom,
        nom: row.stagiaire.nom,
        nomComplet: stagiaireNom,
      },
      stage: stage
        ? {
            idStage: stage.idStage,
            dateDebut: stage.dateDebut,
            dateFinPrevue: stage.dateFinPrevue,
            statut: getStageLifecycleStatus({
              statut: stage.statut,
              dateDebut: stage.dateDebut,
              dateFinPrevue: stage.dateFinPrevue,
            }),
            intitulePoste: intitule,
          }
        : {
            idStage: null,
            dateDebut,
            dateFinPrevue: dateFin,
            statut: null,
            intitulePoste: intitule,
          },
      superviseur: row.superviseur
        ? {
            nom: row.superviseur.nom,
            fonction: row.superviseur.fonction,
          }
        : null,
      dateCreation: row.convention.dateCreation,
      derniereModification: derniereModif,
      accepteeParEntreprise: !!row.convention.accepteeParEntreprise,
      accepteeParStagiaire: !!row.convention.accepteeParStagiaire,
      entreprise: entrepriseProfil
        ? {
            nomEntreprise: entrepriseProfil.nomEntreprise,
            adresse: entrepriseProfil.adresse,
            ville: entrepriseProfil.ville,
            pays: entrepriseProfil.pays,
            email: entrepriseProfil.email || null,
            telephone: entrepriseProfil.telephone || null,
            complete: isEntrepriseConventionComplete(entrepriseProfil),
          }
        : null,
      // actions recalculées après enrichissement superviseur (plus bas)
      actions: [],
    });
  }

  for (const row of viaStage) {
    pushItem(row, row.stage);
  }
  for (const row of viaOf) {
    // Skip if already have stage for same convention
    pushItem(row, null);
  }

  let filtered = items;
  if (filtreStatut && filtreStatut !== "toutes") {
    const map = {
      a_completer: ["BROUILLON"],
      a_valider: ["EN_ATTENTE_VALIDATION"],
      a_corriger: ["A_CORRIGER"],
      a_signer: ["EN_ATTENTE_SIGNATURE_ENTREPRISE"],
      validees: ["VALIDEE"],
      finalisees: ["VALIDEE"],
      annulees: ["ANNULEE", "REFUSEE"],
    };
    const allowed = map[filtreStatut] || [filtreStatut.toUpperCase()];
    filtered = filtered.filter((i) => allowed.includes(i.statut));
  }

  if (recherche && String(recherche).trim()) {
    const q = String(recherche).trim().toLowerCase();
    filtered = filtered.filter((i) => {
      const hay = [
        i.stagiaire.nomComplet,
        i.stagiaire.prenom,
        i.stagiaire.nom,
        i.numero,
        i.stage?.intitulePoste,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  // Sort by last mod desc
  filtered.sort(
    (a, b) =>
      new Date(b.derniereModification || 0) -
      new Date(a.derniereModification || 0),
  );

  // Superviseurs via affectation d'équipe si absents (contacts_entreprise)
  const needSup = filtered.filter((i) => !i.superviseur && i.stage?.idStage);
  if (needSup.length > 0) {
    const ids = [...new Set(needSup.map((i) => i.stage.idStage))];
    const affs = await db
      .select({
        idStage: affectationsSuperviseurStage.idStage,
        nom: membresEquipe.nom,
        email: membresEquipe.email,
        roleEquipe: membresEquipe.roleEquipe,
      })
      .from(affectationsSuperviseurStage)
      .innerJoin(
        membresEquipe,
        eq(membresEquipe.idMembre, affectationsSuperviseurStage.idMembre),
      )
      .where(inArray(affectationsSuperviseurStage.idStage, ids));

    const map = new Map();
    for (const a of affs) {
      if (!map.has(a.idStage)) {
        map.set(a.idStage, {
          nom: a.nom,
          fonction:
            a.roleEquipe === "superviseur"
              ? "Superviseur"
              : a.roleEquipe || "Maître de stage",
        });
      }
    }
    for (const item of filtered) {
      if (!item.superviseur && item.stage?.idStage && map.has(item.stage.idStage)) {
        item.superviseur = map.get(item.stage.idStage);
      }
    }
  }

  // Recalcule les actions après résolution finale du superviseur + profil entreprise
  for (const item of filtered) {
    item.actions = computeActionsEntreprise(
      item.statut,
      {
        accepteeParEntreprise: item.accepteeParEntreprise,
        accepteeParStagiaire: item.accepteeParStagiaire,
      },
      null,
      item.superviseur,
      item.entreprise || entrepriseProfil,
    );
  }

  return filtered;
}

function computeActionsEntreprise(
  statut,
  convention,
  offreFinale,
  superviseur,
  entreprise = null,
) {
  const actions = ["voir"];
  if (statut === "EN_ATTENTE_SIGNATURE_ENTREPRISE" && !convention.accepteeParEntreprise) {
    actions.push("signer");
  }
  // "Compléter" uniquement si des infos réellement manquantes (superviseur
  // ou profil entreprise), pas simplement parce que le statut est BROUILLON.
  const needsSuperviseur = !superviseur;
  const needsEntreprise = !isEntrepriseConventionComplete(entreprise);
  if (needsSuperviseur || needsEntreprise) {
    actions.push("completer");
  }
  if (statut === "EN_ATTENTE_VALIDATION" && convention.accepteeParEntreprise) {
    actions.push("voir");
  }
  if (["VALIDEE", "EN_ATTENTE_SIGNATURE_STAGIAIRE", "EN_ATTENTE_SIGNATURE_ENTREPRISE"].includes(statut)) {
    actions.push("telecharger");
  }
  if (statut === "A_CORRIGER") {
    actions.push("voir_correction");
  }
  return [...new Set(actions)];
}

export async function getStatsConventionsEntreprise(idEntreprise) {
  const items = await listConventionsEntreprise(idEntreprise, {});
  const stats = {
    total: items.length,
    aCompleter: 0,
    aValider: 0,
    aSigner: 0,
    finalisees: 0,
    aCorriger: 0,
    annulees: 0,
  };
  for (const i of items) {
    switch (i.statut) {
      case "BROUILLON":
        stats.aCompleter += 1;
        break;
      case "EN_ATTENTE_VALIDATION":
        stats.aValider += 1;
        break;
      case "EN_ATTENTE_SIGNATURE_ENTREPRISE":
        stats.aSigner += 1;
        break;
      case "VALIDEE":
        stats.finalisees += 1;
        break;
      case "A_CORRIGER":
        stats.aCorriger += 1;
        break;
      case "ANNULEE":
      case "REFUSEE":
        stats.annulees += 1;
        break;
      default:
        break;
    }
  }
  return stats;
}

export async function getActionsRequisesEntreprise(idEntreprise) {
  const items = await listConventionsEntreprise(idEntreprise, {});
  const actions = [];
  for (const i of items) {
    if (i.actions.includes("completer")) {
      const manques = [];
      if (!i.superviseur) manques.push("superviseur / maître de stage");
      if (!isEntrepriseConventionComplete(i.entreprise)) {
        manques.push("localisation entreprise (adresse ou ville + pays)");
      }
      actions.push({
        idConvention: i.idConvention,
        stagiaireNom: i.stagiaire.nomComplet,
        motif: manques.length
          ? `Informations incomplètes : ${manques.join(", ")}.`
          : "Informations incomplètes.",
        type: "completer",
        labelAction: "Compléter",
      });
    } else if (i.statut === "EN_ATTENTE_SIGNATURE_ENTREPRISE") {
      actions.push({
        idConvention: i.idConvention,
        stagiaireNom: i.stagiaire.nomComplet,
        motif: "Signature entreprise requise.",
        type: "signer",
        labelAction: "Signer",
      });
    } else if (i.statut === "A_CORRIGER") {
      actions.push({
        idConvention: i.idConvention,
        stagiaireNom: i.stagiaire.nomComplet,
        motif: "Correction demandée.",
        type: "voir_correction",
        labelAction: "Voir la correction",
      });
    } else if (i.statut === "EN_ATTENTE_VALIDATION") {
      actions.push({
        idConvention: i.idConvention,
        stagiaireNom: i.stagiaire.nomComplet,
        motif: "En attente de validation plateforme.",
        type: "voir",
        labelAction: "Voir",
      });
    }
  }
  return actions;
}

/**
 * Détail d'une convention pour l'entreprise — vérifie l'appartenance.
 */
export async function getConventionEntrepriseById(idEntreprise, idConvention) {
  const items = await listConventionsEntreprise(idEntreprise, {});
  const summary = items.find((i) => i.idConvention === idConvention);
  if (!summary) {
    const err = new Error("Convention introuvable");
    err.status = 404;
    throw err;
  }

  const [convention] = await db
    .select()
    .from(conventionsStage)
    .where(eq(conventionsStage.idConvention, idConvention))
    .limit(1);
  if (!convention) {
    const err = new Error("Convention introuvable");
    err.status = 404;
    throw err;
  }

  const [offreFinale] = await db
    .select()
    .from(offresFinales)
    .where(eq(offresFinales.idOffreFinale, convention.idOffreFinale))
    .limit(1);

  // Stage éventuel
  const [stageRow] = await db
    .select()
    .from(stages)
    .where(eq(stages.idConvention, idConvention))
    .limit(1);

  // Ownership double-check via stage or offre
  if (stageRow && stageRow.idEntreprise !== idEntreprise) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }

  const stagiaireId =
    stageRow?.idStagiaire ||
    (
      await db
        .select({ idStagiaire: candidatures.idStagiaire })
        .from(offresFinales)
        .innerJoin(entretiens, eq(offresFinales.idEntretien, entretiens.idEntretien))
        .innerJoin(candidatures, eq(entretiens.idCandidature, candidatures.idCandidature))
        .where(eq(offresFinales.idOffreFinale, convention.idOffreFinale))
        .limit(1)
    )[0]?.idStagiaire;

  const [stagiaire] = stagiaireId
    ? await db
        .select()
        .from(stagiaires)
        .where(eq(stagiaires.idStagiaire, stagiaireId))
        .limit(1)
    : [null];

  const [entrepriseRow] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise))
    .limit(1);

  const superviseur = await resolveSuperviseurForConvention(stageRow, offreFinale);

  // Contacts entreprise (email compte + téléphone contact principal)
  const entreprise = await enrichEntrepriseContacts(entrepriseRow || null);

  const statut = deriveConventionStatus(convention, offreFinale);
  const historique = buildHistorique(convention, offreFinale);

  // Progression sections
  const sections = {
    stagiaire: !!stagiaire,
    stage: !!(stageRow || offreFinale?.intitulePoste),
    entreprise: isEntrepriseConventionComplete(entreprise),
    supervision: !!superviseur,
    // Validation = étapes de signature / approbation (pas des "infos à saisir")
    validation: !!convention.accepteeParEntreprise && !!convention.approuveeParPlateforme,
  };
  const completed = Object.values(sections).filter(Boolean).length;
  const totalSections = Object.keys(sections).length;
  const progression = Math.round((completed / totalSections) * 100);

  const peutSigner =
    statut === "EN_ATTENTE_SIGNATURE_ENTREPRISE" &&
    !convention.accepteeParEntreprise;

  return {
    convention: {
      idConvention: convention.idConvention,
      idOffreFinale: convention.idOffreFinale,
      accepteeParEntreprise: convention.accepteeParEntreprise,
      dateAcceptationEntreprise: convention.dateAcceptationEntreprise,
      accepteeParStagiaire: convention.accepteeParStagiaire,
      dateAcceptationStagiaire: convention.dateAcceptationStagiaire,
      approuveeParPlateforme: convention.approuveeParPlateforme,
      valideeParUniversite: convention.valideeParUniversite,
      dateValidationUniversite: convention.dateValidationUniversite,
      dateCreation: convention.dateCreation,
      numero: offreFinale?.numero ?? null,
      version: 1,
    },
    statut,
    statutMeta: CONVENTION_STATUS_META[statut] || { label: statut, description: "" },
    stage: stageRow
      ? {
          idStage: stageRow.idStage,
          dateDebut: stageRow.dateDebut,
          dateFinPrevue: stageRow.dateFinPrevue,
          statut: getStageLifecycleStatus({
            statut: stageRow.statut,
            dateDebut: stageRow.dateDebut,
            dateFinPrevue: stageRow.dateFinPrevue,
          }),
          objectifsApprentissage: stageRow.objectifsApprentissage,
          intitulePoste: offreFinale?.intitulePoste || null,
          modeTravail: offreFinale?.modeTravail || null,
          dureeStage: offreFinale?.dureeStage || null,
          volumeHoraireHebdo: offreFinale?.volumeHoraireHebdo || null,
        }
      : offreFinale
        ? {
            idStage: null,
            dateDebut: offreFinale.dateDebut,
            dateFinPrevue: null,
            statut: null,
            objectifsApprentissage: offreFinale.objectifsApprentissage,
            intitulePoste: offreFinale.intitulePoste,
            modeTravail: offreFinale.modeTravail,
            dureeStage: offreFinale.dureeStage,
            volumeHoraireHebdo: offreFinale.volumeHoraireHebdo,
          }
        : null,
    offreFinale: offreFinale
      ? {
          idOffreFinale: offreFinale.idOffreFinale,
          intitulePoste: offreFinale.intitulePoste,
          objectifsApprentissage: offreFinale.objectifsApprentissage,
          statutValidationPlateforme: offreFinale.statutValidationPlateforme,
          statutReponseStagiaire: offreFinale.statutReponseStagiaire,
          dateDebut: offreFinale.dateDebut,
          dureeStage: offreFinale.dureeStage,
          modeTravail: offreFinale.modeTravail,
          volumeHoraireHebdo: offreFinale.volumeHoraireHebdo,
          remunerationType: offreFinale.remunerationType,
          dateValidation: offreFinale.dateValidation,
          numero: offreFinale.numero,
        }
      : null,
    entreprise: entreprise
      ? {
          nomEntreprise: entreprise.nomEntreprise,
          adresse: entreprise.adresse,
          ville: entreprise.ville,
          pays: entreprise.pays,
          telephone: entreprise.telephone,
          email: entreprise.email,
          logoUrl: entreprise.logoUrl,
          secteurActivite: entreprise.secteurActivite,
          complete: isEntrepriseConventionComplete(entreprise),
        }
      : null,
    superviseur: superviseur
      ? {
          nom: superviseur.nom,
          fonction: superviseur.fonction,
          email: superviseur.email,
          telephone: superviseur.telephone,
        }
      : null,
    stagiaire: stagiaire
      ? await buildStagiairePayload(stagiaire, stagiaire.idUtilisateur)
      : null,
    historique,
    progression: { percent: progression, sections, completed, total: totalSections },
    peutSigner,
    actions: computeActionsEntreprise(statut, convention, offreFinale, superviseur, entreprise),
  };
}

/**
 * Signature / accord entreprise (cas rare : convention créée sans acceptation).
 */
export async function signerConventionEntreprise(idEntreprise, idConvention) {
  const data = await getConventionEntrepriseById(idEntreprise, idConvention);
  if (!data.peutSigner) {
    const err = new Error(
      data.convention.accepteeParEntreprise
        ? "Cette convention est déjà acceptée par l'entreprise."
        : "Cette convention n'est pas en attente de signature entreprise.",
    );
    err.status = 403;
    throw err;
  }

  await db
    .update(conventionsStage)
    .set({
      accepteeParEntreprise: true,
      dateAcceptationEntreprise: new Date(),
    })
    .where(eq(conventionsStage.idConvention, idConvention));

  return getConventionEntrepriseById(idEntreprise, idConvention);
}

export async function getConventionEntreprisePdfPath(idEntreprise, idConvention, lang = "fr") {
  const data = await getConventionEntrepriseById(idEntreprise, idConvention);
  // Anti-IDOR déjà appliqué dans getConventionEntrepriseById
  const pdfData = buildConventionPdfData(data);
  const relative = genererConventionPdf(pdfData, lang === "en" ? "en" : "fr");
  const filepath = path.resolve("uploads", relative);
  await waitForPdfFile(filepath);
  const suffix = lang === "en" ? "en" : "fr";
  const base = pdfData.numeroAffiche || data.convention.idConvention.slice(0, 8);
  return {
    filepath,
    filename: `convention-${base}-${suffix}.pdf`,
  };
}
