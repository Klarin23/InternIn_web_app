import { eq, desc, asc, and, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  litigesReclamations,
  utilisateurs,
  administrateurs,
  stages,
  stagiaires,
  entreprises,
  contactsEntreprise,
  affectationsSuperviseurStage,
  membresEquipe,
  litigesNotesInternes,
  litigesMessages,
  litigesPiecesJointes,
  journalActionsAdmin,
} from "../../db/schema.js";
import {
  creerNotification,
  notifierAdmins,
} from "../notifications/notifications.service.js";
import { logAdminAction } from "../administrateurs/auditAdmin.service.js";
import { TRANSITIONS_LITIGE } from "./litiges.schema.js";
import {
  enrichWithDelaiTraitement,
  computeDelaiMeta,
  getDelaiTraitementHeures,
} from "../../utils/delaiTraitement.js";
import { changerStatutCompteEntreprise } from "../administrateurs/administrateurs.service.js";

const CATEGORY_LABELS = {
  harassment: "Harassment",
  discrimination: "Discrimination",
  inappropriate_behavior: "Inappropriate behavior",
  unsafe_working_conditions: "Unsafe working conditions",
  contract_internship_issue: "Contract / internship issue",
  payment_issue: "Payment issue",
  abuse_of_authority: "Abuse of authority",
  privacy_concern: "Privacy concern",
  other: "Other",
};


async function resolveSuperviseurForStage(idStage, idContactSuperviseur) {
  if (idContactSuperviseur) {
    const [contact] = await db
      .select({
        nom: contactsEntreprise.nom,
        fonction: contactsEntreprise.fonction,
        email: contactsEntreprise.email,
      })
      .from(contactsEntreprise)
      .where(eq(contactsEntreprise.idContact, idContactSuperviseur));
    if (contact?.nom) return contact;
  }
  if (!idStage) return null;
  const [aff] = await db
    .select({
      nom: membresEquipe.nom,
      email: membresEquipe.email,
    })
    .from(affectationsSuperviseurStage)
    .innerJoin(
      membresEquipe,
      eq(membresEquipe.idMembre, affectationsSuperviseurStage.idMembre),
    )
    .where(eq(affectationsSuperviseurStage.idStage, idStage))
    .limit(1);
  if (aff?.nom) {
    return { nom: aff.nom, fonction: "Superviseur", email: aff.email };
  }
  return null;
}

async function enrichLitigesAvecCible(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows || [];
  const out = [];
  for (const r of rows) {
    let nomSuperviseur = r.nomSuperviseur || null;
    let fonctionSuperviseur = r.fonctionSuperviseur || null;
    if (r.cibleType === "superviseur" && !nomSuperviseur && r.idStage) {
      const sup = await resolveSuperviseurForStage(
        r.idStage,
        r.idContactSuperviseur || null,
      );
      if (sup) {
        nomSuperviseur = sup.nom;
        fonctionSuperviseur = sup.fonction || null;
      }
    }
    const cibleLabel =
      r.cibleType === "superviseur"
        ? nomSuperviseur
          ? `Superviseur : ${nomSuperviseur}`
          : "Superviseur"
        : r.cibleType === "entreprise"
          ? r.nomEntreprise
            ? `Entreprise : ${r.nomEntreprise}`
            : "Entreprise"
          : r.typeLitige || "Signalement";
    out.push({
      ...r,
      nomSuperviseur,
      fonctionSuperviseur,
      cibleLabel,
    });
  }
  return out;
}

/**
 * Vérifie que l'utilisateur est le stagiaire (ou l'entreprise) du stage.
 * Pour les signalements Safety Center, seul le stagiaire du stage est autorisé.
 */
async function verifierAccesStage(idUtilisateur, idStage, { stagiaireOnly = false } = {}) {
  const [stage] = await db
    .select({
      idStage: stages.idStage,
      idStagiaire: stages.idStagiaire,
      idEntreprise: stages.idEntreprise,
      idContactSuperviseur: stages.idContactSuperviseur,
      statut: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
    })
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stage) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  const [stagiaire] = await db
    .select({
      idUtilisateur: stagiaires.idUtilisateur,
      idStagiaire: stagiaires.idStagiaire,
    })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  const estStagiaire = stagiaire && stagiaire.idUtilisateur === idUtilisateur;

  if (stagiaireOnly) {
    if (!estStagiaire) {
      const err = new Error("Seul le stagiaire de ce stage peut déposer ce signalement");
      err.status = 403;
      throw err;
    }
    return { stage, stagiaire };
  }

  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, stage.idEntreprise));

  const estAutorise =
    estStagiaire ||
    (entreprise && entreprise.idUtilisateur === idUtilisateur);

  if (!estAutorise) {
    const err = new Error("Vous n'êtes pas autorisé à signaler ce stage");
    err.status = 403;
    throw err;
  }

  return { stage, stagiaire };
}

/**
 * Génère une référence lisible unique : RPT-YYYY-NNNN
 *
 * SÉCURITÉ CONCURRENCE :
 * - Ancien mécanisme COUNT(*)+1 : vulnérable (double création → même ref,
 *   suppression → collision).
 * - Nouveau : séquence PostgreSQL `litiges_reference_seq` via nextval()
 *   (atomique sous charge concurrente).
 * - L'unicité est aussi garantie par l'index UNIQUE sur `reference`.
 *
 * L'année dans le préfixe est purement visuelle ; le compteur est global
 * (ne se réinitialise pas) pour éviter toute ambiguïté.
 */
async function genererReference() {
  const year = new Date().getFullYear();
  // nextval est atomique : deux transactions concurrentes obtiennent des valeurs distinctes
  const result = await db.execute(
    sql`SELECT nextval('litiges_reference_seq')::int AS n`,
  );
  // node-postgres / drizzle : rows selon le driver
  const rows = result?.rows ?? result;
  const n = Number(rows?.[0]?.n ?? rows?.[0]?.nextval);
  if (!Number.isFinite(n) || n < 1) {
    const err = new Error("Impossible de générer une référence de signalement");
    err.status = 500;
    throw err;
  }
  // 4 chiffres mini, s'étend automatiquement au-delà de 9999
  const seq = String(n).padStart(4, "0");
  return `RPT-${year}-${seq}`;
}

/**
 * Anti-spam léger : max 5 signalements ouverts par stagiaire, et
 * pas de doublon (même stage + même cible + même catégorie) dans les 24h.
 */
async function verifierAntiSpam(idUtilisateur, idStage, cibleType, categorie) {
  const ouverts = await db
    .select({ idLitige: litigesReclamations.idLitige })
    .from(litigesReclamations)
    .where(
      and(
        eq(litigesReclamations.idUtilisateurPlaignant, idUtilisateur),
        eq(litigesReclamations.statut, "ouvert"),
      ),
    );

  if (ouverts.length >= 5) {
    const err = new Error(
      "Vous avez déjà plusieurs signalements en cours. Attendez le traitement avant d'en déposer un nouveau.",
    );
    err.status = 429;
    throw err;
  }

  if (cibleType && categorie) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recents = await db
      .select({ idLitige: litigesReclamations.idLitige })
      .from(litigesReclamations)
      .where(
        and(
          eq(litigesReclamations.idUtilisateurPlaignant, idUtilisateur),
          eq(litigesReclamations.idStage, idStage),
          eq(litigesReclamations.cibleType, cibleType),
          eq(litigesReclamations.categorie, categorie),
          sql`${litigesReclamations.dateCreation} >= ${since}`,
        ),
      );
    if (recents.length > 0) {
      const err = new Error(
        "Un signalement similaire a déjà été déposé récemment pour ce stage.",
      );
      err.status = 409;
      throw err;
    }
  }
}


async function stageHasSuperviseur(idStage, idContactSuperviseur) {
  if (idContactSuperviseur) return true;
  const [aff] = await db
    .select({ idAffectation: affectationsSuperviseurStage.idAffectation })
    .from(affectationsSuperviseurStage)
    .where(eq(affectationsSuperviseurStage.idStage, idStage))
    .limit(1);
  return Boolean(aff);
}

export async function createLitige(idUtilisateur, payload) {
  const stagiaireOnly = Boolean(payload.cibleType);
  const { stage } = await verifierAccesStage(idUtilisateur, payload.idStage, {
    stagiaireOnly,
  });

  if (payload.cibleType === "superviseur") {
    const hasSup = await stageHasSuperviseur(
      stage.idStage,
      stage.idContactSuperviseur,
    );
    if (!hasSup) {
      const err = new Error(
        "Aucun superviseur n'est associé à votre stage. Vous ne pouvez signaler que l'entreprise.",
      );
      err.status = 400;
      throw err;
    }
  }

  await verifierAntiSpam(
    idUtilisateur,
    payload.idStage,
    payload.cibleType,
    payload.categorie,
  );

  const typeLitige =
    payload.typeLitige ||
    (payload.categorie
      ? CATEGORY_LABELS[payload.categorie] || payload.categorie
      : payload.cibleType === "superviseur"
        ? "Supervisor report"
        : "Company report");

  // Insertion avec référence atomique ; retry unique si collision théorique
  let litige;
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = await genererReference();
    try {
      const [row] = await db
        .insert(litigesReclamations)
        .values({
          idStage: payload.idStage,
          idUtilisateurPlaignant: idUtilisateur,
          typeLitige,
          cibleType: payload.cibleType || null,
          categorie: payload.categorie || null,
          severite: payload.severite || null,
          dateIncident: payload.dateIncident || null,
          reference,
          description: payload.description,
          statut: "ouvert",
        })
        .returning();
      litige = row;
      break;
    } catch (e) {
      // 23505 = unique_violation (référence)
      const code = e?.code || e?.cause?.code;
      if (code === "23505" && attempt < 2) continue;
      throw e;
    }
  }
  if (!litige) {
    const err = new Error("Impossible de créer le signalement (référence)");
    err.status = 500;
    throw err;
  }

  await notifierAdmins({
    type: "signalement_cree",
    titre: "Nouveau signalement à traiter",
    message: `Un signalement (${typeLitige}${
      litige.reference ? ` — ${litige.reference}` : ""
    }) vient d'être déposé.`,
    lien: "/signalements",
  });

  await creerNotification({
    idUtilisateur,
    type: "signalement_soumis",
    titre: "Report received",
    message:
      "Your report has been securely submitted to the InternIn administration team.",
    lien: "/securite",
  });

  return litige;
}

/** Liste des signalements du stagiaire connecté (ownership). */
export async function listMesLitiges(idUtilisateur) {
  const rows = await db
    .select({
      idLitige: litigesReclamations.idLitige,
      idStage: litigesReclamations.idStage,
      typeLitige: litigesReclamations.typeLitige,
      cibleType: litigesReclamations.cibleType,
      categorie: litigesReclamations.categorie,
      severite: litigesReclamations.severite,
      dateIncident: litigesReclamations.dateIncident,
      reference: litigesReclamations.reference,
      description: litigesReclamations.description,
      statut: litigesReclamations.statut,
      attendInfo: litigesReclamations.attendInfo,
      dateCreation: litigesReclamations.dateCreation,
      dateResolution: litigesReclamations.dateResolution,
      nomEntreprise: entreprises.nomEntreprise,
      idContactSuperviseur: stages.idContactSuperviseur,
      nomSuperviseur: contactsEntreprise.nom,
      fonctionSuperviseur: contactsEntreprise.fonction,
    })
    .from(litigesReclamations)
    .leftJoin(stages, eq(litigesReclamations.idStage, stages.idStage))
    .leftJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .leftJoin(
      contactsEntreprise,
      eq(stages.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .where(eq(litigesReclamations.idUtilisateurPlaignant, idUtilisateur))
    .orderBy(desc(litigesReclamations.dateCreation));

  return enrichLitigesAvecCible(rows);
}

/**
 * Détail d'un signalement avec contrôle d'accès strict (IDOR).
 * - Stagiaire : uniquement ses propres reports
 * - Admin : tous
 */
export async function getLitigeById(idUtilisateur, idLitige, { isAdmin = false } = {}) {
  const [litige] = await db
    .select({
      idLitige: litigesReclamations.idLitige,
      idStage: litigesReclamations.idStage,
      idUtilisateurPlaignant: litigesReclamations.idUtilisateurPlaignant,
      typeLitige: litigesReclamations.typeLitige,
      cibleType: litigesReclamations.cibleType,
      categorie: litigesReclamations.categorie,
      severite: litigesReclamations.severite,
      dateIncident: litigesReclamations.dateIncident,
      reference: litigesReclamations.reference,
      description: litigesReclamations.description,
      statut: litigesReclamations.statut,
      dateCreation: litigesReclamations.dateCreation,
      dateResolution: litigesReclamations.dateResolution,
      idAdminAssigne: litigesReclamations.idAdminAssigne,
      escalade: litigesReclamations.escalade,
      motifEscalade: litigesReclamations.motifEscalade,
      dateEscalade: litigesReclamations.dateEscalade,
      motifDecision: litigesReclamations.motifDecision,
      attendInfo: litigesReclamations.attendInfo,
      nomEntreprise: entreprises.nomEntreprise,
      idEntreprise: entreprises.idEntreprise,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      idContactSuperviseur: stages.idContactSuperviseur,
    })
    .from(litigesReclamations)
    .leftJoin(stages, eq(litigesReclamations.idStage, stages.idStage))
    .leftJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(litigesReclamations.idLitige, idLitige));

  if (!litige) {
    const err = new Error("Signalement introuvable");
    err.status = 404;
    throw err;
  }

  if (!isAdmin && litige.idUtilisateurPlaignant !== idUtilisateur) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }

  let superviseur = null;
  if (litige.idContactSuperviseur) {
    const [contact] = await db
      .select({
        nom: contactsEntreprise.nom,
        fonction: contactsEntreprise.fonction,
      })
      .from(contactsEntreprise)
      .where(eq(contactsEntreprise.idContact, litige.idContactSuperviseur));
    if (contact) superviseur = contact;
  }
  if (!superviseur && litige.idStage) {
    const [aff] = await db
      .select({
        nom: membresEquipe.nom,
        email: membresEquipe.email,
      })
      .from(affectationsSuperviseurStage)
      .innerJoin(
        membresEquipe,
        eq(membresEquipe.idMembre, affectationsSuperviseurStage.idMembre),
      )
      .where(eq(affectationsSuperviseurStage.idStage, litige.idStage))
      .limit(1);
    if (aff) {
      superviseur = { nom: aff.nom, fonction: "Superviseur", email: aff.email };
    }
  }

  const { idUtilisateurPlaignant, idAdminAssigne, ...safe } = litige;
  const pending = litige.statut === "ouvert" || litige.statut === "en_cours";
  const delaiHeures = await getDelaiTraitementHeures();
  const sla = computeDelaiMeta(litige.dateCreation, delaiHeures, pending);

  const cibleLabel =
    litige.cibleType === "superviseur"
      ? superviseur?.nom
        ? `Superviseur : ${superviseur.nom}`
        : "Superviseur"
      : litige.cibleType === "entreprise"
        ? litige.nomEntreprise
          ? `Entreprise : ${litige.nomEntreprise}`
          : "Entreprise"
        : litige.typeLitige || "Signalement";

  return {
    ...safe,
    superviseur,
    nomSuperviseur: superviseur?.nom || null,
    fonctionSuperviseur: superviseur?.fonction || null,
    cibleLabel,
    transitionsAutorisees: TRANSITIONS_LITIGE[litige.statut] || [],
    ...sla,
    ...(isAdmin
      ? { idUtilisateurPlaignant, idAdminAssigne }
      : {}),
  };
}

// Réservé à l'espace Administrateur — file de traitement des signalements.
export async function listLitiges(statut) {
  const rows = await db
    .select({
      idLitige: litigesReclamations.idLitige,
      idStage: litigesReclamations.idStage,
      typeLitige: litigesReclamations.typeLitige,
      cibleType: litigesReclamations.cibleType,
      categorie: litigesReclamations.categorie,
      severite: litigesReclamations.severite,
      dateIncident: litigesReclamations.dateIncident,
      reference: litigesReclamations.reference,
      description: litigesReclamations.description,
      statut: litigesReclamations.statut,
      dateCreation: litigesReclamations.dateCreation,
      dateResolution: litigesReclamations.dateResolution,
      emailPlaignant: utilisateurs.email,
      adminAssigne: administrateurs.nom,
      nomEntreprise: entreprises.nomEntreprise,
      idEntreprise: entreprises.idEntreprise,
      idContactSuperviseur: stages.idContactSuperviseur,
      nomSuperviseur: contactsEntreprise.nom,
      fonctionSuperviseur: contactsEntreprise.fonction,
      escalade: litigesReclamations.escalade,
      attendInfo: litigesReclamations.attendInfo,
      motifDecision: litigesReclamations.motifDecision,
    })
    .from(litigesReclamations)
    .innerJoin(
      utilisateurs,
      eq(
        litigesReclamations.idUtilisateurPlaignant,
        utilisateurs.idUtilisateur,
      ),
    )
    .leftJoin(
      administrateurs,
      eq(litigesReclamations.idAdminAssigne, administrateurs.idAdmin),
    )
    .leftJoin(stages, eq(litigesReclamations.idStage, stages.idStage))
    .leftJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .leftJoin(
      contactsEntreprise,
      eq(stages.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .where(statut ? eq(litigesReclamations.statut, statut) : undefined)
    .orderBy(desc(litigesReclamations.dateCreation));

  const withCible = await enrichLitigesAvecCible(rows);
  return enrichWithDelaiTraitement(
    withCible,
    (r) => r.dateCreation,
    (r) => r.statut === "ouvert" || r.statut === "en_cours",
  );
}

export async function changerStatutLitige(
  idUtilisateurAdmin,
  idLitige,
  statut,
  { motif } = {},
) {
  const [admin] = await db
    .select()
    .from(administrateurs)
    .where(eq(administrateurs.idUtilisateur, idUtilisateurAdmin));

  if (!admin) {
    const err = new Error("Administrateur introuvable");
    err.status = 403;
    throw err;
  }

  const [existant] = await db
    .select()
    .from(litigesReclamations)
    .where(eq(litigesReclamations.idLitige, idLitige));

  if (!existant) {
    const err = new Error("Signalement introuvable");
    err.status = 404;
    throw err;
  }

  if (existant.statut === statut) {
    return {
      ...existant,
      transitionsAutorisees: TRANSITIONS_LITIGE[existant.statut] || [],
    };
  }

  const allowed = TRANSITIONS_LITIGE[existant.statut] || [];
  if (!allowed.includes(statut)) {
    const err = new Error(
      `Transition non autorisée : ${existant.statut} → ${statut}`,
    );
    err.status = 409;
    throw err;
  }

  if ((statut === "resolu" || statut === "rejete") && !String(motif || "").trim()) {
    const err = new Error(
      statut === "resolu"
        ? "Un résumé de résolution est obligatoire."
        : "Un motif de rejet est obligatoire.",
    );
    err.status = 400;
    throw err;
  }

  const estFinal = statut === "resolu" || statut === "rejete";

  const [litige] = await db
    .update(litigesReclamations)
    .set({
      statut,
      idAdminAssigne: admin.idAdmin,
      dateResolution: estFinal ? new Date() : null,
      motifDecision: estFinal
        ? String(motif || "").trim()
        : existant.motifDecision,
      attendInfo: statut === "en_cours" ? false : existant.attendInfo,
    })
    .where(eq(litigesReclamations.idLitige, idLitige))
    .returning();

  await logAdminAction({
    idAdministrateur: admin.idUtilisateur,
    typeEntite: "signalement",
    idEntite: idLitige,
    action:
      statut === "en_cours"
        ? "REPORT_INVESTIGATION_STARTED"
        : statut === "resolu"
          ? "REPORT_RESOLVED"
          : statut === "rejete"
            ? "REPORT_REJECTED"
            : "REPORT_STATUS_CHANGED",
    ancienStatut: existant.statut,
    nouveauStatut: statut,
    motif: String(motif || existant.reference || "").slice(0, 2000) || null,
  });

  const MESSAGES_STATUT = {
    en_cours: {
      titre: "Signalement en cours de traitement",
      message:
        "Votre signalement est désormais pris en charge par un administrateur.",
    },
    resolu: {
      titre: "Signalement résolu",
      message: "Votre signalement a été traité et marqué comme résolu.",
    },
    rejete: {
      titre: "Signalement rejeté",
      message:
        "Votre signalement a été examiné et rejeté par l'administration.",
    },
  };

  const infoNotif = MESSAGES_STATUT[statut];
  if (infoNotif) {
    await creerNotification({
      idUtilisateur: litige.idUtilisateurPlaignant,
      type: `signalement_${statut}`,
      titre: infoNotif.titre,
      message: infoNotif.message,
      lien: "/securite",
    });
  }

  return {
    ...litige,
    transitionsAutorisees: TRANSITIONS_LITIGE[litige.statut] || [],
  };
}



async function getAdminOrThrow(idUtilisateur) {
  const [admin] = await db
    .select()
    .from(administrateurs)
    .where(eq(administrateurs.idUtilisateur, idUtilisateur));
  if (!admin) {
    const err = new Error("Administrateur introuvable");
    err.status = 403;
    throw err;
  }
  return admin;
}

async function getLitigeRowOrThrow(idLitige) {
  const [row] = await db
    .select()
    .from(litigesReclamations)
    .where(eq(litigesReclamations.idLitige, idLitige));
  if (!row) {
    const err = new Error("Signalement introuvable");
    err.status = 404;
    throw err;
  }
  return row;
}

export async function listNotesInternes(idUtilisateurAdmin, idLitige) {
  await getAdminOrThrow(idUtilisateurAdmin);
  await getLitigeRowOrThrow(idLitige);
  return db
    .select({
      idNote: litigesNotesInternes.idNote,
      contenu: litigesNotesInternes.contenu,
      dateCreation: litigesNotesInternes.dateCreation,
      adminNom: administrateurs.nom,
    })
    .from(litigesNotesInternes)
    .leftJoin(administrateurs, eq(litigesNotesInternes.idAdmin, administrateurs.idAdmin))
    .where(eq(litigesNotesInternes.idLitige, idLitige))
    .orderBy(desc(litigesNotesInternes.dateCreation));
}

export async function ajouterNoteInterne(idUtilisateurAdmin, idLitige, contenu) {
  const admin = await getAdminOrThrow(idUtilisateurAdmin);
  await getLitigeRowOrThrow(idLitige);
  const [note] = await db
    .insert(litigesNotesInternes)
    .values({
      idLitige,
      idAdmin: admin.idAdmin,
      contenu: String(contenu).trim(),
    })
    .returning();
  await logAdminAction({
    idAdministrateur: admin.idUtilisateur,
    typeEntite: "signalement",
    idEntite: idLitige,
    action: "REPORT_INTERNAL_NOTE_ADDED",
    motif: String(contenu).slice(0, 200),
  });
  return note;
}

/** Messages visibles stagiaire + admin */
export async function listMessagesLitige(idUtilisateur, idLitige, { isAdmin }) {
  const row = await getLitigeRowOrThrow(idLitige);
  if (!isAdmin && row.idUtilisateurPlaignant !== idUtilisateur) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }
  return db
    .select({
      idMessage: litigesMessages.idMessage,
      contenu: litigesMessages.contenu,
      roleAuteur: litigesMessages.roleAuteur,
      dateCreation: litigesMessages.dateCreation,
      emailAuteur: utilisateurs.email,
    })
    .from(litigesMessages)
    .leftJoin(utilisateurs, eq(litigesMessages.idAuteur, utilisateurs.idUtilisateur))
    .where(eq(litigesMessages.idLitige, idLitige))
    .orderBy(asc(litigesMessages.dateCreation));
}

export async function ajouterMessageLitige(
  idUtilisateur,
  idLitige,
  contenu,
  { isAdmin },
) {
  const row = await getLitigeRowOrThrow(idLitige);
  if (!isAdmin && row.idUtilisateurPlaignant !== idUtilisateur) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }
  if (row.statut === "resolu" || row.statut === "rejete") {
    const err = new Error("Ce signalement est clos — message impossible");
    err.status = 409;
    throw err;
  }
  const roleAuteur = isAdmin ? "admin" : "stagiaire";
  const [msg] = await db
    .insert(litigesMessages)
    .values({
      idLitige,
      idAuteur: idUtilisateur,
      roleAuteur,
      contenu: String(contenu).trim(),
    })
    .returning();

  if (isAdmin) {
    // Demande d'info / message admin → stagiaire
    await db
      .update(litigesReclamations)
      .set({ attendInfo: true })
      .where(eq(litigesReclamations.idLitige, idLitige));
    await creerNotification({
      idUtilisateur: row.idUtilisateurPlaignant,
      type: "signalement_message",
      titre: "Nouveau message sur votre signalement",
      message: "L'administration a publié un message concernant votre signalement.",
      lien: "/securite",
    });
    const admin = await getAdminOrThrow(idUtilisateur);
    await logAdminAction({
      idAdministrateur: admin.idUtilisateur,
      typeEntite: "signalement",
      idEntite: idLitige,
      action: "REPORT_MESSAGE_SENT",
      motif: String(contenu).slice(0, 200),
    });
  } else {
    // Réponse stagiaire → notifier admins
    await db
      .update(litigesReclamations)
      .set({ attendInfo: false })
      .where(eq(litigesReclamations.idLitige, idLitige));
    await notifierAdmins({
      type: "signalement_reponse",
      titre: "Réponse sur un signalement",
      message: `Le stagiaire a répondu sur le signalement ${row.reference || idLitige}.`,
      lien: "/signalements",
    });
  }
  return msg;
}

export async function escaladerLitige(idUtilisateurAdmin, idLitige, motif) {
  const admin = await getAdminOrThrow(idUtilisateurAdmin);
  const row = await getLitigeRowOrThrow(idLitige);
  if (row.statut === "resolu" || row.statut === "rejete") {
    const err = new Error("Impossible d'escalader un signalement clos");
    err.status = 409;
    throw err;
  }
  const [litige] = await db
    .update(litigesReclamations)
    .set({
      escalade: true,
      motifEscalade: String(motif).trim(),
      dateEscalade: new Date(),
      idAdminAssigne: admin.idAdmin,
      statut: row.statut === "ouvert" ? "en_cours" : row.statut,
    })
    .where(eq(litigesReclamations.idLitige, idLitige))
    .returning();

  await logAdminAction({
    idAdministrateur: admin.idUtilisateur,
    typeEntite: "signalement",
    idEntite: idLitige,
    action: "REPORT_ESCALATED",
    ancienStatut: row.statut,
    nouveauStatut: litige.statut,
    motif: String(motif).trim(),
  });

  await notifierAdmins({
    type: "signalement_escalade",
    titre: "Signalement escaladé",
    message: `Le signalement ${row.reference || idLitige} a été escaladé : ${String(motif).slice(0, 120)}`,
    lien: "/signalements",
  });

  return litige;
}

export async function demanderInformation(idUtilisateurAdmin, idLitige, message) {
  const admin = await getAdminOrThrow(idUtilisateurAdmin);
  const row = await getLitigeRowOrThrow(idLitige);
  if (row.statut === "resolu" || row.statut === "rejete") {
    const err = new Error("Signalement clos");
    err.status = 409;
    throw err;
  }
  // Passe en en_cours si encore ouvert
  if (row.statut === "ouvert") {
    await db
      .update(litigesReclamations)
      .set({ statut: "en_cours", idAdminAssigne: admin.idAdmin })
      .where(eq(litigesReclamations.idLitige, idLitige));
  }
  const msg = await ajouterMessageLitige(idUtilisateurAdmin, idLitige, message, {
    isAdmin: true,
  });
  await logAdminAction({
    idAdministrateur: admin.idUtilisateur,
    typeEntite: "signalement",
    idEntite: idLitige,
    action: "REPORT_INFORMATION_REQUESTED",
    motif: String(message).slice(0, 200),
  });
  await creerNotification({
    idUtilisateur: row.idUtilisateurPlaignant,
    type: "signalement_info_demandee",
    titre: "Informations demandées",
    message:
      "L'administration demande des informations complémentaires sur votre signalement.",
    lien: "/securite",
  });
  return msg;
}

export async function assertLitigePieceAccess(idUtilisateur, idLitige, { isAdmin } = {}) {
  const row = await getLitigeRowOrThrow(idLitige);
  if (!isAdmin && row.idUtilisateurPlaignant !== idUtilisateur) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }
  return row;
}

export async function listPiecesJointes(idUtilisateur, idLitige, { isAdmin }) {
  const row = await assertLitigePieceAccess(idUtilisateur, idLitige, { isAdmin });
  const pieces = await db
    .select({
      idPiece: litigesPiecesJointes.idPiece,
      idUploader: litigesPiecesJointes.idUploader,
      nomOriginal: litigesPiecesJointes.nomOriginal,
      mimeType: litigesPiecesJointes.mimeType,
      tailleOctets: litigesPiecesJointes.tailleOctets,
      dateUpload: litigesPiecesJointes.dateUpload,
      emailUploader: utilisateurs.email,
    })
    .from(litigesPiecesJointes)
    .leftJoin(
      utilisateurs,
      eq(litigesPiecesJointes.idUploader, utilisateurs.idUtilisateur),
    )
    .where(eq(litigesPiecesJointes.idLitige, idLitige))
    .orderBy(desc(litigesPiecesJointes.dateUpload));

  // role: admin if uploader is an administrateur, else student (plaignant)
  const adminIds = new Set(
    (
      await db
        .select({ idUtilisateur: administrateurs.idUtilisateur })
        .from(administrateurs)
    ).map((a) => a.idUtilisateur),
  );
  return pieces.map((pc) => ({
    ...pc,
    roleUploader: adminIds.has(pc.idUploader) ? "admin" : "stagiaire",
  }));
}

export async function enregistrerPieceJointe(
  idUtilisateur,
  idLitige,
  { nomOriginal, nomStockage, mimeType, tailleOctets },
  { isAdmin },
) {
  const row = await assertLitigePieceAccess(idUtilisateur, idLitige, { isAdmin });
  const [piece] = await db
    .insert(litigesPiecesJointes)
    .values({
      idLitige,
      idUploader: idUtilisateur,
      nomOriginal,
      nomStockage,
      mimeType: mimeType || null,
      tailleOctets: tailleOctets || null,
    })
    .returning();
  if (isAdmin) {
    const admin = await getAdminOrThrow(idUtilisateur);
    await logAdminAction({
      idAdministrateur: admin.idUtilisateur,
      typeEntite: "signalement",
      idEntite: idLitige,
      action: "REPORT_ATTACHMENT_ADDED",
      motif: nomOriginal,
    });
  } else {
    // Student evidence — notify admins (attendInfo cleared when they also send a message)
    await notifierAdmins({
      type: "signalement_piece",
      titre: "Nouvelle pièce sur un signalement",
      message: `Le stagiaire a ajouté un fichier au signalement ${row.reference || idLitige}.`,
      lien: "/signalements",
    });
  }
  return piece;
}

export async function getPieceJointeForDownload(
  idUtilisateur,
  idPiece,
  { isAdmin },
) {
  const [piece] = await db
    .select()
    .from(litigesPiecesJointes)
    .where(eq(litigesPiecesJointes.idPiece, idPiece));
  if (!piece) {
    const err = new Error("Pièce introuvable");
    err.status = 404;
    throw err;
  }
  const row = await getLitigeRowOrThrow(piece.idLitige);
  if (!isAdmin && row.idUtilisateurPlaignant !== idUtilisateur) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }
  return piece;
}


/** Historique audit d'un signalement (admin). */
export async function listHistoriqueLitige(idUtilisateurAdmin, idLitige) {
  await getAdminOrThrow(idUtilisateurAdmin);
  await getLitigeRowOrThrow(idLitige);

  const rows = await db
    .select({
      idJournal: journalActionsAdmin.idJournal,
      action: journalActionsAdmin.action,
      ancienStatut: journalActionsAdmin.ancienStatut,
      nouveauStatut: journalActionsAdmin.nouveauStatut,
      motif: journalActionsAdmin.motif,
      dateCreation: journalActionsAdmin.dateCreation,
      adminEmail: utilisateurs.email,
    })
    .from(journalActionsAdmin)
    .leftJoin(
      utilisateurs,
      eq(journalActionsAdmin.idAdministrateur, utilisateurs.idUtilisateur),
    )
    .where(
      and(
        eq(journalActionsAdmin.typeEntite, "signalement"),
        eq(journalActionsAdmin.idEntite, idLitige),
      ),
    )
    .orderBy(asc(journalActionsAdmin.dateCreation));

  return rows;
}

/**
 * Action disciplinaire liée au dossier — réutilise le système de compte existant.
 * - avertissement : audit + notification entreprise (pas de changement de statut)
 * - suspendre_entreprise : statutCompte = suspendu via changerStatutCompteEntreprise
 */
export async function actionDisciplinaireLitige(
  idUtilisateurAdmin,
  idLitige,
  { type, motif },
) {
  const admin = await getAdminOrThrow(idUtilisateurAdmin);
  const row = await getLitigeRowOrThrow(idLitige);

  const allowed = ["avertissement", "suspendre_entreprise"];
  if (!allowed.includes(type)) {
    const err = new Error("Type d'action disciplinaire invalide");
    err.status = 400;
    throw err;
  }
  if (!String(motif || "").trim() || String(motif).trim().length < 5) {
    const err = new Error("Motif obligatoire (5 caractères minimum)");
    err.status = 400;
    throw err;
  }

  // Résoudre l'entreprise via le stage
  let idEntreprise = null;
  let idUtilisateurEntreprise = null;
  let nomEntreprise = null;
  if (row.idStage) {
    const [st] = await db
      .select({
        idEntreprise: stages.idEntreprise,
        idUtilisateur: entreprises.idUtilisateur,
        nomEntreprise: entreprises.nomEntreprise,
      })
      .from(stages)
      .leftJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
      .where(eq(stages.idStage, row.idStage));
    if (st) {
      idEntreprise = st.idEntreprise;
      idUtilisateurEntreprise = st.idUtilisateur;
      nomEntreprise = st.nomEntreprise;
    }
  }

  if (!idEntreprise) {
    const err = new Error(
      "Aucune entreprise liée à ce signalement — action impossible",
    );
    err.status = 409;
    throw err;
  }

  if (type === "suspendre_entreprise") {
    await changerStatutCompteEntreprise(idEntreprise, "suspendu");
  }

  if (idUtilisateurEntreprise) {
    await creerNotification({
      idUtilisateur: idUtilisateurEntreprise,
      type:
        type === "suspendre_entreprise"
          ? "entreprise_suspendue_signalement"
          : "entreprise_avertissement_signalement",
      titre:
        type === "suspendre_entreprise"
          ? "Compte suspendu suite à un signalement"
          : "Avertissement suite à un signalement",
      message:
        type === "suspendre_entreprise"
          ? `Votre compte entreprise a été suspendu suite au traitement d'un signalement (${row.reference || idLitige}). Motif : ${String(motif).trim().slice(0, 300)}`
          : `Votre entreprise a reçu un avertissement suite à un signalement (${row.reference || idLitige}). Motif : ${String(motif).trim().slice(0, 300)}`,
      lien: "/parametres",
    });
  }

  await logAdminAction({
    idAdministrateur: admin.idUtilisateur,
    typeEntite: "signalement",
    idEntite: idLitige,
    action:
      type === "suspendre_entreprise"
        ? "REPORT_DISCIPLINARY_SUSPEND_COMPANY"
        : "REPORT_DISCIPLINARY_WARNING",
    motif: String(motif).trim().slice(0, 2000),
    nouveauStatut: type === "suspendre_entreprise" ? "suspendu" : null,
  });

  // Note interne automatique (traçabilité dossier)
  await db.insert(litigesNotesInternes).values({
    idLitige,
    idAdmin: admin.idAdmin,
    contenu:
      type === "suspendre_entreprise"
        ? `[Discipline] Suspension du compte entreprise « ${nomEntreprise || idEntreprise} ». Motif : ${String(motif).trim()}`
        : `[Discipline] Avertissement envoyé à l'entreprise « ${nomEntreprise || idEntreprise} ». Motif : ${String(motif).trim()}`,
  });

  return {
    ok: true,
    type,
    idEntreprise,
    nomEntreprise,
  };
}
