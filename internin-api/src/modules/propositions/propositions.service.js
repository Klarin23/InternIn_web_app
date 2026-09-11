import { eq, and, desc, asc, sql, or, ilike, isNotNull, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  propositionsStage,
  stagiaires,
  offresStage,
  entreprises,
  notifications,
  formations,
  stagiaireCompetences,
  competences,
  candidatures,
} from "../../db/schema.js";

/**
 * Liste les stagiaires visibles pour les entreprises (Talents).
 * Filtre sur profil_visible_entreprises = true quand la colonne existe.
 * En cas d'absence de la colonne (migration non jouée), retourne tous les stagiaires
 * pour ne pas bloquer l'UI.
 */
export async function listTalents({
  search,
  competence,
  disponibilite,
  localisation,
  sort = "completude",
  page = 1,
  limit = 12,
}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const safeLimit = Math.min(Math.max(1, limit), 50);

  // Confidentialité : seuls les profils explicitement visibles
  const conditions = [eq(stagiaires.profilVisibleEntreprises, true)];

  if (search && String(search).trim()) {
    const q = `%${String(search).trim()}%`;
    conditions.push(
      or(
        ilike(stagiaires.prenom, q),
        ilike(stagiaires.nom, q),
        ilike(stagiaires.titreProfessionnel, q),
        ilike(stagiaires.ville, q),
        // Recherche aussi dans les noms de compétences liées
        sql`EXISTS (
          SELECT 1 FROM stagiaire_competences sc
          INNER JOIN competences c ON c.id_competence = sc.id_competence
          WHERE sc.id_stagiaire = ${stagiaires.idStagiaire}
            AND c.nom ILIKE ${q}
        )`,
      ),
    );
  }

  if (localisation && String(localisation).trim()) {
    const q = `%${String(localisation).trim()}%`;
    conditions.push(
      or(ilike(stagiaires.ville, q), ilike(stagiaires.pays, q)),
    );
  }

  if (disponibilite && String(disponibilite).trim()) {
    conditions.push(eq(stagiaires.statutStage, String(disponibilite).trim()));
  }

  // Filtre compétence : une ou plusieurs (séparées par virgule), mode OR
  const competenceTerms = String(competence || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (competenceTerms.length > 0) {
    const orParts = competenceTerms.map(
      (term) =>
        sql`EXISTS (
          SELECT 1 FROM stagiaire_competences sc
          INNER JOIN competences c ON c.id_competence = sc.id_competence
          WHERE sc.id_stagiaire = ${stagiaires.idStagiaire}
            AND c.nom ILIKE ${"%" + term + "%"}
        )`,
    );
    conditions.push(or(...orParts));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  let orderByClause = desc(stagiaires.scoreCompletudeProfil);
  if (sort === "nom") {
    orderByClause = asc(stagiaires.nom);
  } else if (sort === "recent") {
    orderByClause = desc(stagiaires.dateCreation);
  }

  const rows = await db
    .select({
      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      titreProfessionnel: stagiaires.titreProfessionnel,
      scoreCompletudeProfil: stagiaires.scoreCompletudeProfil,
      statutStage: stagiaires.statutStage,
      ville: stagiaires.ville,
      pays: stagiaires.pays,
      idUniversite: stagiaires.idUniversite,
      presentation: stagiaires.presentation,
    })
    .from(stagiaires)
    .where(whereClause)
    .limit(safeLimit)
    .offset(offset)
    .orderBy(orderByClause);

  const [countRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(stagiaires)
    .where(whereClause);

  const total = Number(countRow?.count ?? 0);
  const ids = rows.map((r) => r.idStagiaire);

  // Enrichissement batch : compétences + formation principale
  let compsByStagiaire = {};
  let formationByStagiaire = {};

  if (ids.length > 0) {
    try {
      const allComps = await db
        .select({
          idStagiaire: stagiaireCompetences.idStagiaire,
          idCompetence: competences.idCompetence,
          nom: competences.nom,
        })
        .from(stagiaireCompetences)
        .innerJoin(
          competences,
          eq(stagiaireCompetences.idCompetence, competences.idCompetence),
        )
        .where(inArray(stagiaireCompetences.idStagiaire, ids));

      for (const c of allComps) {
        if (!compsByStagiaire[c.idStagiaire]) compsByStagiaire[c.idStagiaire] = [];
        compsByStagiaire[c.idStagiaire].push({
          idCompetence: c.idCompetence,
          nom: c.nom,
        });
      }
    } catch {
      compsByStagiaire = {};
    }

    try {
      const allForms = await db
        .select({
          idStagiaire: formations.idStagiaire,
          diplome: formations.diplome,
          nomUniversite: formations.nomUniversite,
          faculte: formations.faculte,
          departement: formations.departement,
          anneeEtude: formations.anneeEtude,
          typeFormation: formations.typeFormation,
        })
        .from(formations)
        .where(inArray(formations.idStagiaire, ids));

      for (const f of allForms) {
        // Première formation rencontrée = principale pour la carte
        if (!formationByStagiaire[f.idStagiaire]) {
          formationByStagiaire[f.idStagiaire] = f;
        }
      }
    } catch {
      formationByStagiaire = {};
    }
  }

  const data = rows.map((r) => {
    const comps = compsByStagiaire[r.idStagiaire] || [];
    const form = formationByStagiaire[r.idStagiaire] || null;
    return {
      ...r,
      competences: comps.slice(0, 6),
      competencesCount: comps.length,
      formation: form
        ? {
            diplome: form.diplome,
            nomUniversite: form.nomUniversite,
            faculte: form.faculte,
            departement: form.departement,
            anneeEtude: form.anneeEtude,
            typeFormation: form.typeFormation,
          }
        : null,
    };
  });

  return {
    data,
    pagination: {
      page: Math.max(1, page),
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function getTalentById(idStagiaire) {
  const [stagiaire] = await db
    .select({
      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      titreProfessionnel: stagiaires.titreProfessionnel,
      scoreCompletudeProfil: stagiaires.scoreCompletudeProfil,
      statutStage: stagiaires.statutStage,
      ville: stagiaires.ville,
      pays: stagiaires.pays,
      idUniversite: stagiaires.idUniversite,
      presentation: stagiaires.presentation,
      objectifProfessionnel: stagiaires.objectifProfessionnel,
      linkedinUrl: stagiaires.linkedinUrl,
      githubUrl: stagiaires.githubUrl,
      behanceUrl: stagiaires.behanceUrl,
      portfolioUrl: stagiaires.portfolioUrl,
      siteWebUrl: stagiaires.siteWebUrl,
      dureeStageSouhaitee: stagiaires.dureeStageSouhaitee,
      dateDebutSouhaitee: stagiaires.dateDebutSouhaitee,
      secteursRecherches: stagiaires.secteursRecherches,
      villesRecherchees: stagiaires.villesRecherchees,
      modalitesTravailSouhaitees: stagiaires.modalitesTravailSouhaitees,
      profilVisibleEntreprises: stagiaires.profilVisibleEntreprises,
      experiencesProfessionnelles: stagiaires.experiencesProfessionnelles,
      qualites: stagiaires.qualites,
    })
    .from(stagiaires)
    .where(
      and(
        eq(stagiaires.idStagiaire, idStagiaire),
        eq(stagiaires.profilVisibleEntreprises, true),
      ),
    )
    .limit(1);

  // Profil inexistant ou masqué → même réponse (pas de fuite d'existence)
  if (!stagiaire) return null;

  const forms = await db
    .select()
    .from(formations)
    .where(eq(formations.idStagiaire, idStagiaire));

  let comps = [];
  try {
    comps = await db
      .select({
        idCompetence: competences.idCompetence,
        nom: competences.nom,
        typeCompetence: competences.typeCompetence,
      })
      .from(stagiaireCompetences)
      .innerJoin(
        competences,
        eq(stagiaireCompetences.idCompetence, competences.idCompetence),
      )
      .where(eq(stagiaireCompetences.idStagiaire, idStagiaire));
  } catch {
    comps = [];
  }

  // Les langues sont stockées comme des compétences de type "langue".
  let langues = [];
  try {
    const langueRows = await db
      .select({
        nom: competences.nom,
        niveau: stagiaireCompetences.niveau,
        typeCompetence: competences.typeCompetence,
      })
      .from(stagiaireCompetences)
      .innerJoin(
        competences,
        eq(stagiaireCompetences.idCompetence, competences.idCompetence),
      )
      .where(
        and(
          eq(stagiaireCompetences.idStagiaire, idStagiaire),
          eq(competences.typeCompetence, "langue"),
        ),
      );
    langues = langueRows.map(({ nom, niveau }) => ({ nom, niveau: niveau || null }));
  } catch {
    langues = [];
  }

  // Pas d'email, téléphone, date de naissance, idUtilisateur ni CV : le profil
  // Talents expose uniquement les informations professionnelles prévues pour
  // le recrutement, conformément à la confidentialité du CV.
  return {
    ...stagiaire,
    formations: forms,
    competences: comps.filter((c) => c.typeCompetence !== "langue"),
    langues,
    experiencesProfessionnelles: Array.isArray(stagiaire.experiencesProfessionnelles)
      ? stagiaire.experiencesProfessionnelles
      : [],
    qualites: Array.isArray(stagiaire.qualites) ? stagiaire.qualites : [],
  };
}

export async function createProposition({
  idEntreprise,
  idStagiaire,
  idOffre,
  message,
}) {
  const [offre] = await db
    .select()
    .from(offresStage)
    .where(
      and(
        eq(offresStage.idOffre, idOffre),
        eq(offresStage.idEntreprise, idEntreprise),
        eq(offresStage.statut, "publie"),
      ),
    )
    .limit(1);

  if (!offre) {
    const err = new Error("Offre introuvable ou non publiée");
    err.status = 404;
    throw err;
  }

  const [stag] = await db
    .select({
      id: stagiaires.idStagiaire,
      idUtilisateur: stagiaires.idUtilisateur,
      prenom: stagiaires.prenom,
      profilVisibleEntreprises: stagiaires.profilVisibleEntreprises,
      experiencesProfessionnelles: stagiaires.experiencesProfessionnelles,
      qualites: stagiaires.qualites,
    })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, idStagiaire))
    .limit(1);

  if (!stag) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  if (!stag.profilVisibleEntreprises) {
    const err = new Error(
      "Ce profil n'est pas disponible pour une proposition directe.",
    );
    err.status = 403;
    throw err;
  }

  try {
    const [prop] = await db
      .insert(propositionsStage)
      .values({
        idEntreprise,
        idStagiaire,
        idOffre,
        message: message || null,
        statut: "envoyee",
      })
      .returning();

    const [ent] = await db
      .select({ nomEntreprise: entreprises.nomEntreprise })
      .from(entreprises)
      .where(eq(entreprises.idEntreprise, idEntreprise))
      .limit(1);

    try {
      await db.insert(notifications).values({
        idUtilisateur: stag.idUtilisateur,
        type: "proposition_stage",
        titre: "Nouvelle proposition de stage",
        message: `${ent?.nomEntreprise || "Une entreprise"} souhaite vous proposer une opportunité de stage : ${offre.titre}`,
        lien: "/propositions-stage",
      });
    } catch (notifErr) {
      console.warn("[propositions] notification non créée:", notifErr?.message);
    }

    return prop;
  } catch (e) {
    // drizzle-orm enveloppe l'erreur pg brute dans `DrizzleQueryError.cause` :
    // e.code est alors undefined et le vrai code (23505, 42P01…) vit dans
    // e.cause.code. Sans ça, aucune des deux branches ci-dessous ne
    // matchait jamais et on retombait toujours sur l'erreur générique.
    const pgCode = e.code || e.cause?.code;
    const pgMessage = e.cause?.message || e.message || "";

    if (pgCode === "23505") {
      const err = new Error(
        "Une proposition pour cette offre a déjà été envoyée à cet étudiant.",
      );
      err.status = 409;
      throw err;
    }
    // Table réellement absente : code Postgres 42P01 (undefined_table) et
    // relation concernée = propositions_stage. On ne se fie plus au seul
    // texte "does not exist", qui matche aussi une colonne manquante ou
    // toute autre relation, et masquait la vraie cause de l'échec.
    if (pgCode === "42P01" && pgMessage.includes("propositions_stage")) {
      const err = new Error(
        "La table des propositions n'existe pas encore. Appliquez la migration 0020_talents_propositions.sql",
      );
      err.status = 503;
      throw err;
    }
    // Toute autre erreur (colonne manquante, contrainte, connexion…) :
    // on la journalise et on la laisse remonter telle quelle pour ne pas
    // orienter à tort vers une migration déjà appliquée.
    console.error("[propositions] echec creerProposition:", e);
    throw e;
  }
}

export async function listPropositionsEntreprise(idEntreprise) {
  return db
    .select({
      idProposition: propositionsStage.idProposition,
      statut: propositionsStage.statut,
      message: propositionsStage.message,
      commentaireReponse: propositionsStage.commentaireReponse,
      dateCreation: propositionsStage.dateCreation,
      dateVue: propositionsStage.dateVue,
      dateReponse: propositionsStage.dateReponse,
      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      titreOffre: offresStage.titre,
      idOffre: offresStage.idOffre,
    })
    .from(propositionsStage)
    .innerJoin(
      stagiaires,
      eq(propositionsStage.idStagiaire, stagiaires.idStagiaire),
    )
    .innerJoin(offresStage, eq(propositionsStage.idOffre, offresStage.idOffre))
    .where(eq(propositionsStage.idEntreprise, idEntreprise))
    .orderBy(desc(propositionsStage.dateCreation));
}

export async function listPropositionsStagiaire(idStagiaire) {
  return db
    .select({
      idProposition: propositionsStage.idProposition,
      statut: propositionsStage.statut,
      message: propositionsStage.message,
      commentaireReponse: propositionsStage.commentaireReponse,
      dateCreation: propositionsStage.dateCreation,
      dateVue: propositionsStage.dateVue,
      dateReponse: propositionsStage.dateReponse,
      titreOffre: offresStage.titre,
      idOffre: offresStage.idOffre,
      descriptionOffre: offresStage.description,
      modeTravail: offresStage.modeTravail,
      dureeStage: offresStage.dureeStage,
      departement: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      villeEntreprise: entreprises.ville,
      paysEntreprise: entreprises.pays,
      aProposEntreprise: entreprises.aPropos,
      idEntreprise: entreprises.idEntreprise,
    })
    .from(propositionsStage)
    .innerJoin(offresStage, eq(propositionsStage.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(propositionsStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(propositionsStage.idStagiaire, idStagiaire))
    .orderBy(desc(propositionsStage.dateCreation));
}

/**
 * Supprime une proposition envoyée par l'entreprise, uniquement tant que
 * l'étudiant n'a pas encore répondu (statut "envoyee" ou "vue"). Une fois
 * que l'étudiant a accepté, refusé, ou que la proposition a expiré /
 * a été annulée, elle ne peut plus être supprimée depuis cet écran.
 */
export async function deletePropositionEntreprise({
  idProposition,
  idEntreprise,
}) {
  const [prop] = await db
    .select()
    .from(propositionsStage)
    .where(eq(propositionsStage.idProposition, idProposition))
    .limit(1);

  if (!prop) {
    const err = new Error("Proposition introuvable");
    err.status = 404;
    throw err;
  }

  if (prop.idEntreprise !== idEntreprise) {
    const err = new Error("Non autorisé");
    err.status = 403;
    throw err;
  }

  if (!["envoyee", "vue"].includes(prop.statut)) {
    const err = new Error(
      "Cette proposition ne peut plus être supprimée : l'étudiant y a déjà répondu.",
    );
    err.status = 409;
    throw err;
  }

  await db
    .delete(propositionsStage)
    .where(eq(propositionsStage.idProposition, idProposition));

  return { idProposition };
}


/**
 * Machine à états propositions_stage — transitions autorisées par acteur.
 * Le client envoie une ACTION (statut cible) ; le serveur autorise ou refuse.
 * Statuts système (expiree) : jamais fixables par le client.
 *
 *   envoyee ──stagiaire──► vue
 *   envoyee|vue ──stagiaire──► acceptee | refusee
 *   envoyee|vue ──entreprise──► annulee
 */
const PROPOSITION_TRANSITIONS = {
  stagiaire: {
    vue: ["envoyee"],
    acceptee: ["envoyee", "vue"],
    refusee: ["envoyee", "vue"],
  },
  entreprise: {
    annulee: ["envoyee", "vue"],
  },
  membre_entreprise: {
    annulee: ["envoyee", "vue"],
  },
};

function assertTransitionAllowed(typeUtilisateur, fromStatut, toStatut) {
  const map = PROPOSITION_TRANSITIONS[typeUtilisateur];
  if (!map || !map[toStatut]) {
    const err = new Error(
      "Action non autorisée pour votre rôle sur cette proposition.",
    );
    err.status = 403;
    throw err;
  }
  const allowedFrom = map[toStatut];
  if (!allowedFrom.includes(fromStatut)) {
    const err = new Error(
      "Cette proposition ne peut plus faire l'objet de cette action (statut incompatible).",
    );
    err.status = 409;
    throw err;
  }
  return allowedFrom;
}

export async function updatePropositionStatut({
  idProposition,
  typeUtilisateur,
  idEntreprise,
  idStagiaire,
  statut,
  commentaireReponse = null,
}) {
  // Le client demande une ACTION (statut cible). On ignore toute autre source
  // d'autorité : le statut courant est lu en DB, la transition est validée serveur.
  if (!statut || typeof statut !== "string") {
    const err = new Error("Action de proposition invalide");
    err.status = 400;
    throw err;
  }

  const [prop] = await db
    .select()
    .from(propositionsStage)
    .where(eq(propositionsStage.idProposition, idProposition))
    .limit(1);

  if (!prop) {
    const err = new Error("Proposition introuvable");
    err.status = 404;
    throw err;
  }

  // IDOR / BOLA
  const isEntrepriseActor =
    typeUtilisateur === "entreprise" || typeUtilisateur === "membre_entreprise";
  if (isEntrepriseActor) {
    if (!idEntreprise || prop.idEntreprise !== idEntreprise) {
      const err = new Error("Non autorisé");
      err.status = 403;
      throw err;
    }
  } else if (typeUtilisateur === "stagiaire") {
    if (!idStagiaire || prop.idStagiaire !== idStagiaire) {
      const err = new Error("Non autorisé");
      err.status = 403;
      throw err;
    }
  } else {
    const err = new Error("Non autorisé");
    err.status = 403;
    throw err;
  }

  // Machine à états : rôle + état courant → statut cible autorisé ?
  const allowedFrom = assertTransitionAllowed(
    typeUtilisateur,
    prop.statut,
    statut,
  );

  // ---- REFUS (stagiaire) ----
  if (typeUtilisateur === "stagiaire" && statut === "refusee") {
    const motif =
      typeof commentaireReponse === "string"
        ? commentaireReponse.trim().slice(0, 2000)
        : null;

    const [updated] = await db
      .update(propositionsStage)
      .set({
        statut: "refusee",
        dateReponse: new Date(),
        commentaireReponse: motif || null,
      })
      .where(
        and(
          eq(propositionsStage.idProposition, idProposition),
          inArray(propositionsStage.statut, allowedFrom),
        ),
      )
      .returning();

    if (!updated) {
      const err = new Error(
        "Cette proposition a déjà été traitée et ne peut plus être modifiée.",
      );
      err.status = 409;
      throw err;
    }

    try {
      const [ent] = await db
        .select({ idUtilisateur: entreprises.idUtilisateur })
        .from(entreprises)
        .where(eq(entreprises.idEntreprise, prop.idEntreprise))
        .limit(1);
      const [stag] = await db
        .select({ prenom: stagiaires.prenom, nom: stagiaires.nom })
        .from(stagiaires)
        .where(eq(stagiaires.idStagiaire, prop.idStagiaire))
        .limit(1);
      const [offre] = await db
        .select({ titre: offresStage.titre })
        .from(offresStage)
        .where(eq(offresStage.idOffre, prop.idOffre))
        .limit(1);

      if (ent?.idUtilisateur) {
        await db.insert(notifications).values({
          idUtilisateur: ent.idUtilisateur,
          type: "proposition_refusee",
          titre: "Proposition refusée",
          message: motif
            ? `${stag?.prenom || "Un stagiaire"} ${stag?.nom || ""} a refusé votre proposition pour « ${offre?.titre || "votre offre"} » : « ${motif.slice(0, 120)}${motif.length > 120 ? "…" : ""} »`.trim()
            : `${stag?.prenom || "Un stagiaire"} ${stag?.nom || ""} a refusé votre proposition pour « ${offre?.titre || "votre offre"} ».`.trim(),
          lien: "/talents",
        });
      }
    } catch (notifErr) {
      console.warn(
        "[propositions] notification entreprise non créée:",
        notifErr?.message,
      );
    }

    return updated;
  }

  // ---- ACCEPTATION (stagiaire, transaction métier) ----
  if (typeUtilisateur === "stagiaire" && statut === "acceptee") {
    const [stagiaireRow] = await db
      .select()
      .from(stagiaires)
      .where(eq(stagiaires.idStagiaire, prop.idStagiaire))
      .limit(1);

    if (!stagiaireRow) {
      const err = new Error("Profil stagiaire introuvable");
      err.status = 404;
      throw err;
    }

    if (stagiaireRow.statutStage === "actif") {
      const err = new Error(
        "Vous avez déjà un stage actif. Vous ne pouvez pas accepter une nouvelle proposition pour le moment.",
      );
      err.status = 409;
      throw err;
    }

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(propositionsStage)
        .set({
          statut: "acceptee",
          dateReponse: new Date(),
          commentaireReponse: null,
        })
        .where(
          and(
            eq(propositionsStage.idProposition, idProposition),
            inArray(propositionsStage.statut, allowedFrom),
          ),
        )
        .returning();

      if (!updated) {
        const err = new Error(
          "Cette proposition a déjà été traitée et ne peut plus être modifiée.",
        );
        err.status = 409;
        throw err;
      }

      const [existingCand] = await tx
        .select()
        .from(candidatures)
        .where(
          and(
            eq(candidatures.idStagiaire, prop.idStagiaire),
            eq(candidatures.idOffre, prop.idOffre),
          ),
        )
        .limit(1);

      let candidature = existingCand;
      if (!existingCand) {
        const [created] = await tx
          .insert(candidatures)
          .values({
            idStagiaire: prop.idStagiaire,
            idOffre: prop.idOffre,
            origine: "invitation_entreprise",
            statut: "preselectionnee",
            lettreMotivation: prop.message || null,
            dateMajStatut: new Date(),
          })
          .returning();
        candidature = created;
      } else if (
        !["acceptee", "rejetee", "retiree"].includes(existingCand.statut)
      ) {
        const [patched] = await tx
          .update(candidatures)
          .set({
            statut: "preselectionnee",
            dateMajStatut: new Date(),
          })
          .where(eq(candidatures.idCandidature, existingCand.idCandidature))
          .returning();
        candidature = patched;
      }

      if (stagiaireRow.statutStage === "disponible") {
        await tx
          .update(stagiaires)
          .set({ statutStage: "en_processus" })
          .where(eq(stagiaires.idStagiaire, prop.idStagiaire));
      }

      return {
        proposition: updated,
        candidature,
        nextSteps: {
          candidatureCreeeOuMiseAJour: true,
          statutStagiaire:
            stagiaireRow.statutStage === "disponible"
              ? "en_processus"
              : stagiaireRow.statutStage,
          message:
            "Proposition acceptée. L'entreprise peut maintenant poursuivre avec un entretien et une offre finale afin de démarrer le stage dans le suivi.",
        },
      };
    });

    try {
      const [ent] = await db
        .select({ idUtilisateur: entreprises.idUtilisateur })
        .from(entreprises)
        .where(eq(entreprises.idEntreprise, prop.idEntreprise))
        .limit(1);
      const [offre] = await db
        .select({ titre: offresStage.titre })
        .from(offresStage)
        .where(eq(offresStage.idOffre, prop.idOffre))
        .limit(1);

      if (ent?.idUtilisateur) {
        await db.insert(notifications).values({
          idUtilisateur: ent.idUtilisateur,
          type: "proposition_acceptee",
          titre: "Proposition acceptée",
          message: `${stagiaireRow.prenom || "Un stagiaire"} ${stagiaireRow.nom || ""} a accepté votre proposition pour « ${offre?.titre || "votre offre"} ». Poursuivez avec un entretien ou une offre finale.`.trim(),
          lien: "/candidats",
        });
      }

      if (stagiaireRow.idUtilisateur) {
        await db.insert(notifications).values({
          idUtilisateur: stagiaireRow.idUtilisateur,
          type: "proposition_acceptee",
          titre: "Proposition acceptée",
          message: `Vous avez accepté la proposition pour « ${offre?.titre || "l'offre"} ». L'entreprise va préparer les prochaines étapes de votre stage.`,
          lien: "/candidatures",
        });
      }
    } catch (notifErr) {
      console.warn(
        "[propositions] notification acceptation non créée:",
        notifErr?.message,
      );
    }

    return result.proposition;
  }

  // ---- VUE (stagiaire) ----
  if (typeUtilisateur === "stagiaire" && statut === "vue") {
    const [updated] = await db
      .update(propositionsStage)
      .set({ statut: "vue", dateVue: new Date() })
      .where(
        and(
          eq(propositionsStage.idProposition, idProposition),
          inArray(propositionsStage.statut, allowedFrom),
        ),
      )
      .returning();

    if (!updated) {
      // Idempotent : déjà vue / déjà traitée
      return prop;
    }
    return updated;
  }

  // ---- ANNULATION (entreprise / membre) ----
  if (isEntrepriseActor && statut === "annulee") {
    const [updated] = await db
      .update(propositionsStage)
      .set({ statut: "annulee" })
      .where(
        and(
          eq(propositionsStage.idProposition, idProposition),
          inArray(propositionsStage.statut, allowedFrom),
        ),
      )
      .returning();

    if (!updated) {
      const err = new Error(
        "Cette proposition ne peut plus être annulée (déjà traitée ou annulée).",
      );
      err.status = 409;
      throw err;
    }
    return updated;
  }

  // Aucune autre transition n'est autorisée (pas de set({ statut }) générique)
  const err = new Error("Transition de statut non autorisée");
  err.status = 403;
  throw err;
}
