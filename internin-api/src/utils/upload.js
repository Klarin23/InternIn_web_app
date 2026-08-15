// Configuration multer : stocke les fichiers reçus sur le disque local,
// organisés par type de document. En production, ce module sera remplacé
// par un upload vers un stockage cloud (S3, Cloudinary...), mais l'interface
// des routes qui l'utilisent ne changera pas.

import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const UPLOAD_ROOT = path.resolve("uploads");

//Liste blanche stricte des sous-dossiers autorisés: req.params.type vient
//directement de l'URL et ne doit jamais etre utilisé tel quel dans un chemin
// de fichier (sinon traversée de repertoire possible, ex./upload/...).

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
//Extension/ mimetypes accpetés, mis en correspondancestricte( le mimetype
//envoyé par le client peut etre falsifié, on vérifie donc aussi l'extension
//réelle du fichier)
const MIME_VERS_EXTENSIONS = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpeg", ".jpg"],
  "image/webp": [".webp"],
};

// Crée le dossier de destination s'il n'existe pas encore
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

    // Garde-fou supplémentaire: s'assurer que le chemin resoulu reste bien
    //sous UPLOAD_ROOT, même si la liste blanche ci dessus était un jour
    //modifiée par erreur
    if (path.relative(UPLOAD_ROOT, dest).startsWith("..")) {
      const err = new Error("Chemin de destination invalide");
      err.status = 400;
      return cb(err);
    }


    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Nom unique : horodatage + nom original nettoyé (évite les collisions et espaces)
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

function fileFilter(req, file, cb) {
  const extensionsAttendues = MIME_VERS_EXTENSIONS[file.mimetype];
  if (!extensionsAttendues) {
    const err = new Error(
      "Format de fichier non autorisé (PDF, PNG, JPEG ou WEBP uniquement)",
    );
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

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});
