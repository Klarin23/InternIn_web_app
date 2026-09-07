import path from "node:path";
import fs from "node:fs";
import { matchesDeclaredType } from "../../utils/fileSignature.js";
import {
  saveDocumentRecord,
  findStagiaireByCvFilename,
  findDocumentByFilename,
  authorizeCvAccess,
  journaliserAccesCv,
  resolveSafeUploadPath,
  tryDeleteCvFile,
} from "./documents.service.js";
import { db } from "../../db/index.js";
import { stagiaires } from "../../db/schema.js";
import { eq } from "drizzle-orm";

// Types qui correspondent à des images de profil / logo.
// Ils sont stockés uniquement sur le disque (et plus tard sur le profil
// entreprise / université / stagiaire), pas dans la table `documents`
// car ils ne font pas partie de l'enum type_document en base.
const TYPES_SANS_ENREGISTREMENT_DB = new Set(["logo", "photo_profil"]);

const TYPES_PUBLICS_AUTH = new Set(["logo", "photo_profil"]);

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error("Aucun fichier reçu");
      err.status = 400;
      throw err;
    }

    // Fichier vide
    if (!req.file.size || req.file.size <= 0) {
      fs.unlink(req.file.path, () => {});
      const err = new Error("Le fichier est vide");
      err.status = 400;
      throw err;
    }

    // Le Content-Type et l'extension sont déclarés par le client (donc
    // falsifiables) — on vérifie ici le contenu réel du fichier écrit sur
    // disque (magic bytes) avant d'aller plus loin.
    if (!matchesDeclaredType(req.file.path, req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      const err = new Error(
        "Le contenu du fichier ne correspond pas au format attendu",
      );
      err.status = 400;
      throw err;
    }

    const { type } = req.params; // ex : "cv", "logo", "photo_profil"

    // URL relative protégée — jamais d'URL publique permanente pour les CV
    const urlFichier = `/documents/download/${type}/${req.file.filename}`;

    // Pour logo / photo de profil : on renvoie une URL publique (affichage)
    if (TYPES_SANS_ENREGISTREMENT_DB.has(type)) {
      const publicUrl = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/uploads/${type}/${req.file.filename}`;
      return res.status(201).json({
        url: publicUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    }

    // Remplacement de CV stagiaire : supprimer l'ancien fichier après succès
    let previousCvUrl = null;
    if (type === "cv" && req.user?.typeUtilisateur === "stagiaire") {
      const [stag] = await db
        .select({ cvUrl: stagiaires.cvUrl })
        .from(stagiaires)
        .where(eq(stagiaires.idUtilisateur, req.user.idUtilisateur))
        .limit(1);
      previousCvUrl = stag?.cvUrl || null;
    }

    const document = await saveDocumentRecord({
      idUtilisateur: req.user.idUtilisateur,
      typeDocument: type,
      urlFichier,
      nomFichier: req.file.originalname,
    });

    // Mettre à jour cvUrl stagiaire si applicable
    if (type === "cv" && req.user?.typeUtilisateur === "stagiaire") {
      await db
        .update(stagiaires)
        .set({ cvUrl: urlFichier })
        .where(eq(stagiaires.idUtilisateur, req.user.idUtilisateur));

      // Ancien fichier seulement après succès du nouveau
      if (previousCvUrl && previousCvUrl !== urlFichier) {
        tryDeleteCvFile(previousCvUrl);
      }
    }

    res.status(201).json({
      document,
      url: urlFichier,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    // Si erreur après écriture disque, nettoyer le fichier uploadé
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}

/**
 * Téléchargement / consultation protégée d'un fichier.
 * Query : ?disposition=inline|attachment (défaut attachment)
 */
export async function downloadDocument(req, res, next) {
  try {
    const { type, filename } = req.params;
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";

    const DOSSIERS_AUTORISES = [
      "cv",
      "registre_commerce",
      "certificat_constitution",
      "justificatif_entreprise",
      "accreditation_universite",
      "enregistrement_officiel",
      "autorisation_administrative",
      "autre",
      "logo",
      "photo_profil",
      "conventions",
      "certificats",
    ];

    if (!DOSSIERS_AUTORISES.includes(type)) {
      return res.status(400).json({ error: "Type de document invalide" });
    }

    const resolved = resolveSafeUploadPath(type, filename);
    if (!resolved) {
      // Message générique — ne pas révéler si le fichier existe
      return res.status(404).json({ error: "Document introuvable" });
    }

    const { filePath, safeFilename } = resolved;

    // --- Accès public authentifié pour logos / photos ---
    if (TYPES_PUBLICS_AUTH.has(type)) {
      return sendFile(res, filePath, safeFilename, disposition, type);
    }

    // --- CV : autorisation stricte ---
    if (type === "cv") {
      const stagiaire = await findStagiaireByCvFilename(safeFilename);
      const auth = await authorizeCvAccess(req.user, stagiaire);

      if (!auth.allowed) {
        if (stagiaire && auth.entrepriseContext) {
          await journaliserAccesCv({
            entrepriseContext: auth.entrepriseContext,
            idStagiaire: stagiaire.idStagiaire,
            action: disposition === "inline" ? "consultation" : "telechargement",
            resultat: "refuse",
            details: auth.error,
          });
        }
        return res.status(auth.status || 403).json({
          error: auth.error || "Accès refusé",
        });
      }

      if (auth.entrepriseContext && stagiaire) {
        await journaliserAccesCv({
          entrepriseContext: auth.entrepriseContext,
          idStagiaire: stagiaire.idStagiaire,
          action: disposition === "inline" ? "consultation" : "telechargement",
          resultat: "autorise",
          details: auth.reason,
        });
      }

      // Nom d'affichage : original si connu, sinon générique
      const doc = await findDocumentByFilename("cv", safeFilename);
      const downloadName =
        doc?.nomFichier && path.extname(doc.nomFichier)
          ? path.basename(doc.nomFichier)
          : "cv.pdf";

      return sendFile(res, filePath, downloadName, disposition, "cv");
    }

    // --- Autres documents sensibles : propriétaire ou admin ---
    const doc = await findDocumentByFilename(type, safeFilename);
    if (!doc) {
      return res.status(404).json({ error: "Document introuvable" });
    }

    const isOwner = doc.idUtilisateur === req.user.idUtilisateur;
    const isAdmin = req.user.typeUtilisateur === "administrateur";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à accéder à ce document",
      });
    }

    const downloadName = doc.nomFichier
      ? path.basename(doc.nomFichier)
      : safeFilename;

    return sendFile(res, filePath, downloadName, disposition, type);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /documents/cv/stagiaire/:idStagiaire
 * Accès CV par identifiant stagiaire (anti-énumération + auth métier).
 */
export async function downloadCvByStagiaire(req, res, next) {
  try {
    const { idStagiaire } = req.params;
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";

    const [stagiaire] = await db
      .select({
        idStagiaire: stagiaires.idStagiaire,
        idUtilisateur: stagiaires.idUtilisateur,
        cvUrl: stagiaires.cvUrl,
        profilVisibleEntreprises: stagiaires.profilVisibleEntreprises,
      })
      .from(stagiaires)
      .where(eq(stagiaires.idStagiaire, idStagiaire))
      .limit(1);

    if (!stagiaire || !stagiaire.cvUrl) {
      return res.status(404).json({ error: "Document introuvable" });
    }

    const auth = await authorizeCvAccess(req.user, stagiaire);
    if (!auth.allowed) {
      if (auth.entrepriseContext) {
        await journaliserAccesCv({
          entrepriseContext: auth.entrepriseContext,
          idStagiaire: stagiaire.idStagiaire,
          action: disposition === "inline" ? "consultation" : "telechargement",
          resultat: "refuse",
          details: auth.error,
        });
      }
      return res.status(auth.status || 403).json({
        error: auth.error || "Accès refusé",
      });
    }

    // Extraire le nom de fichier depuis cvUrl
    const match = String(stagiaire.cvUrl).match(
      /\/(?:documents\/download|uploads)\/cv\/([^/?#]+)/,
    );
    if (!match) {
      return res.status(404).json({ error: "Document introuvable" });
    }

    const resolved = resolveSafeUploadPath(
      "cv",
      decodeURIComponent(match[1]),
    );
    if (!resolved) {
      return res.status(404).json({ error: "Document introuvable" });
    }

    if (auth.entrepriseContext) {
      await journaliserAccesCv({
        entrepriseContext: auth.entrepriseContext,
        idStagiaire: stagiaire.idStagiaire,
        action: disposition === "inline" ? "consultation" : "telechargement",
        resultat: "autorise",
        details: auth.reason,
      });
    }

    const doc = await findDocumentByFilename("cv", resolved.safeFilename);
    const downloadName =
      doc?.nomFichier && path.extname(doc.nomFichier)
        ? path.basename(doc.nomFichier)
        : "cv.pdf";

    return sendFile(
      res,
      resolved.filePath,
      downloadName,
      disposition,
      "cv",
    );
  } catch (err) {
    next(err);
  }
}

function sendFile(res, filePath, downloadName, disposition, type) {
  const mime =
    type === "cv" || downloadName.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : undefined;

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  // Ne pas exposer le chemin réel
  res.removeHeader("X-Powered-By");

  if (mime) {
    res.setHeader("Content-Type", mime);
  }

  const safeName = String(downloadName).replace(/[^\w.\- ()\[\]]+/g, "_");
  const disp =
    disposition === "inline"
      ? `inline; filename="${safeName}"`
      : `attachment; filename="${safeName}"`;
  res.setHeader("Content-Disposition", disp);

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(404).json({ error: "Document introuvable" });
    }
  });
  stream.pipe(res);
}
