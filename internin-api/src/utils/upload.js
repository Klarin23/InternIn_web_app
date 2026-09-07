// Configuration multer : stocke les fichiers reçus sur le disque local,
// organisés par type de document. En production, ce module sera remplacé
// par un upload vers un stockage cloud (S3, Cloudinary...), mais l'interface
// des routes qui l'utilisent ne changera pas.

import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const UPLOAD_ROOT = path.resolve("uploads");

// Liste blanche stricte des sous-dossiers autorisés: req.params.type vient
// directement de l'URL et ne doit jamais etre utilisé tel quel dans un chemin
// de fichier (sinon traversée de repertoire possible, ex./upload/...).
//
// Doit rester synchronisé avec typeDocumentEnum dans src/db/schema.js, plus
// "logo" qui n'est pas un type de document mais réutilise cette même route
// d'upload lors de l'onboarding entreprise/université.
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
];

// Extension / mimetypes acceptés, mise en correspondance stricte (le mimetype
// envoyé par le client peut etre falsifié, on vérifie donc aussi l'extension
// réelle du fichier). Pour les CV, seuls les PDF sont autorisés.
const MIME_VERS_EXTENSIONS = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
  "image/webp": [".webp"],
};

const TYPES_PDF_UNIQUEMENT = new Set([
  "cv",
  "registre_commerce",
  "certificat_constitution",
  "justificatif_entreprise",
  "accreditation_universite",
  "enregistrement_officiel",
  "autorisation_administrative",
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.params.type;

    if (!DOSSIERS_AUTORISES.includes(subfolder)) {
      const err = new Error("Type de document invalide");
      err.status = 400;
      return cb(err);
    }

    const dest = path.join(UPLOAD_ROOT, subfolder);

    // Garde-fou : le chemin résolu doit rester sous UPLOAD_ROOT
    if (path.relative(UPLOAD_ROOT, dest).startsWith("..")) {
      const err = new Error("Chemin de destination invalide");
      err.status = 400;
      return cb(err);
    }

    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Ne jamais réutiliser le nom fourni par l'utilisateur comme nom de stockage.
    // Identifiant cryptographiquement sûr + extension dérivée du mimetype validé.
    const extensions = MIME_VERS_EXTENSIONS[file.mimetype] || [];
    const ext = extensions[0] || path.extname(file.originalname).toLowerCase() || "";
    const safeExt = ext && /^\.[a-z0-9]{1,8}$/i.test(ext) ? ext : "";
    const id = crypto.randomUUID();
    cb(null, `${id}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const type = req.params?.type;
  const extensionsAttendues = MIME_VERS_EXTENSIONS[file.mimetype];

  if (!extensionsAttendues) {
    const err = new Error(
      "Format de fichier non autorisé (PDF, PNG ou JPEG uniquement)",
    );
    err.status = 400;
    return cb(err);
  }

  // CV et documents officiels : PDF uniquement
  if (TYPES_PDF_UNIQUEMENT.has(type) && file.mimetype !== "application/pdf") {
    const err = new Error("Seuls les fichiers PDF sont acceptés pour ce type de document");
    err.status = 400;
    return cb(err);
  }

  const extensionReelle = path.extname(file.originalname).toLowerCase();
  if (!extensionsAttendues.includes(extensionReelle)) {
    const err = new Error(
      "L'extension du fichier ne correspond pas à son type déclaré",
    );
    err.status = 400;
    return cb(err);
  }

  // Refuser les double-extensions dangereuses (ex. cv.pdf.exe déjà bloqué
  // par l'extension, mais aussi .php.pdf etc. via mimetype mismatch)
  const base = path.basename(file.originalname).toLowerCase();
  if (/\.(exe|js|html|htm|php|svg|zip|rar|7z|sh|bat|cmd)(\.|$)/i.test(base) &&
      !base.endsWith(".pdf") && !base.endsWith(".png") &&
      !base.endsWith(".jpg") && !base.endsWith(".jpeg") && !base.endsWith(".webp")) {
    const err = new Error("Type de fichier non autorisé");
    err.status = 400;
    return cb(err);
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});

export { UPLOAD_ROOT, DOSSIERS_AUTORISES, MIME_VERS_EXTENSIONS };
