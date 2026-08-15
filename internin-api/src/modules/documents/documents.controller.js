import path from "node:path";
import fs from "node:fs";
import { saveDocumentRecord } from "./documents.service.js";

// Types qui correspondent à des images de profil / logo.
// Ils sont stockés uniquement sur le disque (et plus tard sur le profil
// entreprise / université / stagiaire), pas dans la table `documents`
// car ils ne font pas partie de l'enum type_document en base.
const TYPES_SANS_ENREGISTREMENT_DB = new Set(["logo", "photo_profil"]);

// Liste des types considérés comme SENSIBLES (ne doivent jamais être publics)
const TYPES_SENSIBLES = new Set([
  "cv",
  "registre_commerce",
  "certificat_constitution",
  "justificatif_entreprise",
  "accreditation_universite",
  "enregistrement_officiel",
  "autorisation_administrative",
  "autre",
]);

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error("Aucun fichier reçu");
      err.status = 400;
      throw err;
    }

    const { type } = req.params; // ex : "cv", "logo", "photo_profil"

    // On génère toujours une URL relative maintenant
    // (le frontend appellera /documents/download/... pour les fichiers sensibles)
    const urlFichier = `/documents/download/${type}/${req.file.filename}`;

    // Pour logo / photo de profil : on renvoie juste l'URL, sans écrire
    // dans la table documents (évite la violation d'enum PostgreSQL).
    if (TYPES_SANS_ENREGISTREMENT_DB.has(type)) {
      // Pour les logos/photos on peut encore les servir en public si tu veux.
      // Ici on garde le même format pour rester compatible.
      const publicUrl = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/uploads/${type}/${req.file.filename}`;
      return res.status(201).json({ url: publicUrl });
    }

    const document = await saveDocumentRecord({
      idUtilisateur: req.user.idUtilisateur,
      typeDocument: type,
      urlFichier, // on stocke maintenant le chemin protégé
      nomFichier: req.file.originalname,
    });

    res.status(201).json({ document, url: urlFichier });
  } catch (err) {
    next(err);
  }
}

/**
 * Téléchargement protégé d'un fichier.
 * - Vérifie que l'utilisateur est authentifié
 * - Empêche les path traversal
 * - Pour les types sensibles, on pourrait ajouter un contrôle d'ownership
 *   (à renforcer plus tard selon ton besoin métier)
 */
export async function downloadDocument(req, res, next) {
  try {
    const { type, filename } = req.params;

    // 1. Liste blanche des types
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

    // 2. Nettoyage du nom de fichier (anti path traversal)
    const safeFilename = path.basename(filename); // enlève tout ../
    if (safeFilename !== filename || filename.includes("..")) {
      return res.status(400).json({ error: "Nom de fichier invalide" });
    }

    const filePath = path.resolve("uploads", type, safeFilename);

    // 3. Vérifier que le fichier est bien sous /uploads
    const uploadsRoot = path.resolve("uploads");
    if (!filePath.startsWith(uploadsRoot)) {
      return res.status(400).json({ error: "Chemin invalide" });
    }

    // 4. Vérifier l'existence
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier introuvable" });
    }

    // 5. Contrôle d'ownership pour les types sensibles
    // (logo et photo_profil restent accessibles à tout utilisateur authentifié)
    const TYPES_PUBLICS = new Set(["logo", "photo_profil"]);

    if (!TYPES_PUBLICS.has(type)) {
      const { eq, or } = await import("drizzle-orm");
      const { db } = await import("../../db/index.js");
      const { documents } = await import("../../db/schema.js");

      const cheminRelatif = `/documents/download/${type}/${safeFilename}`;
      const ancienFormat = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/uploads/${type}/${safeFilename}`;

      const [doc] = await db
        .select()
        .from(documents)
        .where(
          or(
            eq(documents.urlFichier, cheminRelatif),
            eq(documents.urlFichier, ancienFormat),
          ),
        );

      // Document introuvable en base → on refuse
      if (!doc) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder à ce document",
        });
      }

      const isOwner = doc.idUtilisateur === req.user.idUtilisateur;
      const isAdmin = req.user.typeUtilisateur === "administrateur";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à accéder à ce document",
        });
      }
    }

    // 6. Envoi du fichier
    res.download(filePath, safeFilename, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
}
