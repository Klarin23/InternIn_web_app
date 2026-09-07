import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import {
  ALLOWED_LITIGE_MIME,
  ALLOWED_LITIGE_EXTENSIONS,
  EXTENSION_BY_MIME,
  matchesDeclaredType,
} from "../../utils/fileSignature.js";
import { uploadLimiter, downloadLimiter } from "../../middlewares/rateLimit.middleware.js";
import { assertLitigePieceAccess } from "./litiges.service.js";
import {
  creer,
  lister,
  listerMes,
  detail,
  changerStatut,
  listerNotes,
  creerNote,
  listerMessages,
  creerMessage,
  escalader,
  demanderInfo,
  listerPieces,
  telechargerPiece,
  uploadPiece,
  listerHistorique,
  actionDisciplinaire,
} from "./litiges.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createLitigeSchema,
  changerStatutLitigeSchema,
  noteInterneSchema,
  messageLitigeSchema,
  escaladeLitigeSchema,
  requestInfoSchema,
  actionDisciplinaireSchema,
} from "./litiges.schema.js";

const router = Router();

const litigesUploadDir = path.resolve(process.cwd(), "uploads", "litiges");
fs.mkdirSync(litigesUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, litigesUploadDir),
  // Toujours utiliser un nom temporaire généré côté serveur.
  // L'extension finale sera déterminée après validation du contenu réel.
  filename: (_req, _file, cb) => {
    cb(null, `${randomUUID()}.uploading`);
  },
});

function sanitizeOriginalName(name) {
  const base = path.basename(String(name || "fichier"));
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "_").trim();
  return (cleaned || "fichier").slice(0, 255);
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
    parts: 12,
    fieldNameSize: 100,
    fieldSize: 64 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_LITIGE_MIME.has(file.mimetype)) {
      return cb(new Error("Type de fichier non autorisé"));
    }
    const originalExt = path.extname(file.originalname || "").toLowerCase();
    const allowedExts = ALLOWED_LITIGE_EXTENSIONS[file.mimetype];
    if (!allowedExts?.has(originalExt)) {
      return cb(new Error("L'extension du fichier ne correspond pas au type déclaré"));
    }
    cb(null, true);
  },
});

async function authorizeLitigePieceAccess(req, _res, next) {
  try {
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    await assertLitigePieceAccess(req.user.idUtilisateur, req.params.id, { isAdmin });
    next();
  } catch (err) {
    next(err);
  }
}

async function validateAndFinalizeLitigeUpload(req, _res, next) {
  if (!req.file) {
    const err = new Error("Fichier requis");
    err.status = 400;
    return next(err);
  }

  const filePath = req.file.path;
  try {
    if (!req.file.size || req.file.size <= 0) {
      throw Object.assign(new Error("Le fichier est vide"), { status: 400 });
    }

    const expectedExt = EXTENSION_BY_MIME[req.file.mimetype];
    if (!expectedExt || !matchesDeclaredType(filePath, req.file.mimetype)) {
      throw Object.assign(
        new Error("Le contenu du fichier ne correspond pas au format attendu"),
        { status: 400 },
      );
    }

    const finalFilename = `${randomUUID()}${expectedExt}`;
    const finalPath = path.join(litigesUploadDir, finalFilename);
    await fs.promises.rename(filePath, finalPath);

    req.file.path = finalPath;
    req.file.filename = finalFilename;
    req.file.originalname = sanitizeOriginalName(req.file.originalname);
    next();
  } catch (err) {
    await fs.promises.unlink(filePath).catch(() => {});
    next(err);
  }
}

router.post("/", requireAuth, validate(createLitigeSchema), creer);
router.get("/mes", requireAuth, listerMes);
router.get("/", requireAuth, requireRole("administrateur"), lister);

// Notes internes — admin only (avant /:id pour éviter collision? order: specific first)
router.get(
  "/:id/notes",
  requireAuth,
  requireRole("administrateur"),
  listerNotes,
);
router.post(
  "/:id/notes",
  requireAuth,
  requireRole("administrateur"),
  validate(noteInterneSchema),
  creerNote,
);

router.get("/:id/messages", requireAuth, listerMessages);
router.post(
  "/:id/messages",
  requireAuth,
  validate(messageLitigeSchema),
  creerMessage,
);

router.post(
  "/:id/escalader",
  requireAuth,
  requireRole("administrateur"),
  validate(escaladeLitigeSchema),
  escalader,
);
router.post(
  "/:id/demander-info",
  requireAuth,
  requireRole("administrateur"),
  validate(requestInfoSchema),
  demanderInfo,
);

router.get("/:id/pieces", requireAuth, listerPieces);
router.post(
  "/:id/pieces",
  requireAuth,
  uploadLimiter,
  authorizeLitigePieceAccess,
  upload.single("fichier"),
  validateAndFinalizeLitigeUpload,
  uploadPiece,
);
router.get(
  "/pieces/:pieceId/download",
  requireAuth,
  downloadLimiter,
  telechargerPiece,
);

router.get(
  "/:id/historique",
  requireAuth,
  requireRole("administrateur"),
  listerHistorique,
);
router.post(
  "/:id/action-disciplinaire",
  requireAuth,
  requireRole("administrateur"),
  validate(actionDisciplinaireSchema),
  actionDisciplinaire,
);

router.get("/:id", requireAuth, detail);
router.patch(
  "/:id/statut",
  requireAuth,
  requireRole("administrateur"),
  validate(changerStatutLitigeSchema),
  changerStatut,
);

export default router;
