import path from "node:path";
import fs from "node:fs";
import { eq, and, or, like, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  documents,
  stagiaires,
  candidatures,
  offresStage,
  propositionsStage,
  stages,
  activitesEquipe,
} from "../../db/schema.js";
import { resolveEntrepriseContext } from "../../utils/entrepriseContext.js";
import { UPLOAD_ROOT } from "../../utils/upload.js";

export async function saveDocumentRecord({
  idUtilisateur,
  typeDocument,
  urlFichier,
  nomFichier,
}) {
  const [document] = await db
    .insert(documents)
    .values({ idUtilisateur, typeDocument, urlFichier, nomFichier })
    .returning();
  return document;
}

/**
 * Résout un stagiaire à partir d'un nom de fichier CV stocké
 * (chemins historiques et format protégé).
 */
export async function findStagiaireByCvFilename(filename) {
  const safeFilename = path.basename(filename);
  const cheminRelatif = `/documents/download/cv/${safeFilename}`;
  const uploadsPath = `/uploads/cv/${safeFilename}`;
  const publicPrefix = process.env.API_PUBLIC_URL || "http://localhost:4000";
  const ancienFormat = `${publicPrefix}/uploads/cv/${safeFilename}`;

  const [stag] = await db
    .select({
      idStagiaire: stagiaires.idStagiaire,
      idUtilisateur: stagiaires.idUtilisateur,
      cvUrl: stagiaires.cvUrl,
      profilVisibleEntreprises: stagiaires.profilVisibleEntreprises,
    })
    .from(stagiaires)
    .where(
      or(
        eq(stagiaires.cvUrl, cheminRelatif),
        eq(stagiaires.cvUrl, uploadsPath),
        eq(stagiaires.cvUrl, ancienFormat),
        like(stagiaires.cvUrl, `%/${safeFilename}`),
      ),
    )
    .limit(1);

  return stag || null;
}

export async function findDocumentByFilename(type, filename) {
  const safeFilename = path.basename(filename);
  const cheminRelatif = `/documents/download/${type}/${safeFilename}`;
  const uploadsPath = `/uploads/${type}/${safeFilename}`;
  const publicPrefix = process.env.API_PUBLIC_URL || "http://localhost:4000";
  const ancienFormat = `${publicPrefix}/uploads/${type}/${safeFilename}`;

  const [doc] = await db
    .select()
    .from(documents)
    .where(
      or(
        eq(documents.urlFichier, cheminRelatif),
        eq(documents.urlFichier, uploadsPath),
        eq(documents.urlFichier, ancienFormat),
        like(documents.urlFichier, `%/${safeFilename}`),
      ),
    )
    .limit(1);

  return doc || null;
}

/**
 * Vérifie si l'entreprise (ou membre) a une relation légitime avec le stagiaire :
 * - candidature sur une offre de l'entreprise
 * - proposition de stage de l'entreprise
 * - stage actif / terminé lié à une offre de l'entreprise
 */
export async function entrepriseHasRelationWithStagiaire(
  idEntreprise,
  idStagiaire,
) {
  // Candidature → offre de l'entreprise
  const [cand] = await db
    .select({ idCandidature: candidatures.idCandidature })
    .from(candidatures)
    .innerJoin(offresStage, eq(offresStage.idOffre, candidatures.idOffre))
    .where(
      and(
        eq(candidatures.idStagiaire, idStagiaire),
        eq(offresStage.idEntreprise, idEntreprise),
      ),
    )
    .limit(1);

  if (cand) return { type: "candidature", id: cand.idCandidature };

  // Proposition de stage
  const [prop] = await db
    .select({ idProposition: propositionsStage.idProposition })
    .from(propositionsStage)
    .where(
      and(
        eq(propositionsStage.idStagiaire, idStagiaire),
        eq(propositionsStage.idEntreprise, idEntreprise),
      ),
    )
    .limit(1);

  if (prop) return { type: "proposition", id: prop.idProposition };

  // Stage lié à l'entreprise
  const [stg] = await db
    .select({ idStage: stages.idStage })
    .from(stages)
    .where(
      and(
        eq(stages.idStagiaire, idStagiaire),
        eq(stages.idEntreprise, idEntreprise),
      ),
    )
    .limit(1);
  if (stg) return { type: "stage", id: stg.idStage };

  return null;
}

/**
 * Autorisation d'accès à un CV.
 *
 * Retourne { allowed: true, reason } ou { allowed: false, status, error }.
 *
 * Règles :
 * 1. Propriétaire (stagiaire) → toujours
 * 2. Administrateur → toujours
 * 3. Entreprise / membre_entreprise actif :
 *    a) relation candidature/proposition/stage + permission candidats.gerer
 *       (ou admin principal / propriétaire)
 *    b) profilVisibleEntreprises === true + permission talents.voir
 *       (ou admin principal / propriétaire)
 * 4. Sinon → refusé
 */
export async function authorizeCvAccess(reqUser, stagiaire) {
  if (!stagiaire) {
    return {
      allowed: false,
      status: 404,
      error: "Document introuvable",
    };
  }

  const idUtilisateur = reqUser.idUtilisateur;
  const type = reqUser.typeUtilisateur;

  // 1. Propriétaire
  if (stagiaire.idUtilisateur === idUtilisateur) {
    return { allowed: true, reason: "owner" };
  }

  // 2. Admin plateforme
  if (type === "administrateur") {
    return { allowed: true, reason: "admin" };
  }

  // 3. Entreprise ou membre d'équipe
  if (type === "entreprise" || type === "membre_entreprise") {
    const ctx = await resolveEntrepriseContext(idUtilisateur);
    if (!ctx) {
      return {
        allowed: false,
        status: 403,
        error: "Accès refusé",
      };
    }

    // Membre non actif déjà exclu par resolveEntrepriseContext
    const perms = ctx.permissionsEffectives || [];
    const isFullAccess = ctx.isProprietaire || ctx.isAdminPrincipal;

    // 3a. Relation métier (candidature / proposition / stage)
    const relation = await entrepriseHasRelationWithStagiaire(
      ctx.entreprise.idEntreprise,
      stagiaire.idStagiaire,
    );

    if (relation) {
      if (
        isFullAccess ||
        perms.includes("candidats.gerer") ||
        perms.includes("stagiaires.suivre")
      ) {
        return {
          allowed: true,
          reason: `relation:${relation.type}`,
          entrepriseContext: ctx,
        };
      }
      return {
        allowed: false,
        status: 403,
        error: "Vous n'avez pas la permission de consulter ce CV",
      };
    }

    // 3b. Talent visible
    if (stagiaire.profilVisibleEntreprises === true) {
      if (isFullAccess || perms.includes("talents.voir")) {
        return {
          allowed: true,
          reason: "talent_visible",
          entrepriseContext: ctx,
        };
      }
      return {
        allowed: false,
        status: 403,
        error: "Vous n'avez pas la permission de consulter les talents",
      };
    }

    // Profil non visible et aucune relation → ne pas révéler l'existence
    return {
      allowed: false,
      status: 404,
      error: "Document introuvable",
    };
  }

  return {
    allowed: false,
    status: 403,
    error: "Vous n'êtes pas autorisé à accéder à ce document",
  };
}

/**
 * Journalise un accès CV dans activites_equipe lorsque le contexte entreprise
 * est connu. N'enregistre pas le contenu du fichier.
 */
export async function journaliserAccesCv({
  entrepriseContext,
  idStagiaire,
  action,
  resultat,
  details,
}) {
  if (!entrepriseContext?.entreprise?.idEntreprise) return;

  try {
    await db.insert(activitesEquipe).values({
      idEntreprise: entrepriseContext.entreprise.idEntreprise,
      idMembre: entrepriseContext.membre?.idMembre ?? null,
      action: `cv_${action}`,
      details: [
        `stagiaire=${idStagiaire}`,
        `resultat=${resultat}`,
        details || null,
      ]
        .filter(Boolean)
        .join(" | "),
    });
  } catch (err) {
    // Ne jamais faire échouer la requête métier pour un log
    console.error("[audit-cv]", err?.message || err);
  }
}

/**
 * Résout le chemin disque sûr d'un fichier sous uploads/.
 * Retourne null si path traversal ou fichier absent.
 */
export function resolveSafeUploadPath(type, filename) {
  const safeFilename = path.basename(String(filename || ""));
  if (
    !safeFilename ||
    safeFilename !== String(filename) ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return null;
  }

  const filePath = path.resolve(UPLOAD_ROOT, type, safeFilename);
  const relative = path.relative(UPLOAD_ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return { filePath, safeFilename };
}

/**
 * Supprime un ancien fichier CV du disque si le chemin est sous uploads/cv.
 * Ne lève pas d'erreur si le fichier est absent.
 */
export function tryDeleteCvFile(cvUrl) {
  if (!cvUrl || typeof cvUrl !== "string") return;
  const match = cvUrl.match(/\/(?:documents\/download|uploads)\/cv\/([^/?#]+)/);
  if (!match) return;
  const resolved = resolveSafeUploadPath("cv", decodeURIComponent(match[1]));
  if (!resolved) return;
  try {
    fs.unlinkSync(resolved.filePath);
  } catch {
    /* ignore */
  }
}
