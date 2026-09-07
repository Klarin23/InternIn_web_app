import path from "node:path";
import fs from "node:fs";
import {
  createLitige,
  listLitiges,
  listMesLitiges,
  getLitigeById,
  changerStatutLitige,
  listNotesInternes,
  ajouterNoteInterne,
  listMessagesLitige,
  ajouterMessageLitige,
  escaladerLitige,
  demanderInformation,
  listPiecesJointes,
  enregistrerPieceJointe,
  getPieceJointeForDownload,
  listHistoriqueLitige,
  actionDisciplinaireLitige,
} from "./litiges.service.js";

export async function creer(req, res, next) {
  try {
    const litige = await createLitige(req.user.idUtilisateur, req.body);
    res.status(201).json({ litige });
  } catch (err) {
    next(err);
  }
}

export async function listerMes(req, res, next) {
  try {
    const litiges = await listMesLitiges(req.user.idUtilisateur);
    res.json({ litiges });
  } catch (err) {
    next(err);
  }
}

export async function detail(req, res, next) {
  try {
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    const litige = await getLitigeById(
      req.user.idUtilisateur,
      req.params.id,
      { isAdmin },
    );
    res.json({ litige });
  } catch (err) {
    next(err);
  }
}

export async function lister(req, res, next) {
  try {
    res.json(await listLitiges(req.query.statut));
  } catch (err) {
    next(err);
  }
}

export async function changerStatut(req, res, next) {
  try {
    const litige = await changerStatutLitige(
      req.user.idUtilisateur,
      req.params.id,
      req.body.statut,
      { motif: req.body.motif },
    );
    res.json({ litige });
  } catch (err) {
    next(err);
  }
}

export async function listerNotes(req, res, next) {
  try {
    const notes = await listNotesInternes(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

export async function creerNote(req, res, next) {
  try {
    const note = await ajouterNoteInterne(
      req.user.idUtilisateur,
      req.params.id,
      req.body.contenu,
    );
    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
}

export async function listerMessages(req, res, next) {
  try {
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    const messages = await listMessagesLitige(
      req.user.idUtilisateur,
      req.params.id,
      { isAdmin },
    );
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

export async function creerMessage(req, res, next) {
  try {
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    const message = await ajouterMessageLitige(
      req.user.idUtilisateur,
      req.params.id,
      req.body.contenu,
      { isAdmin },
    );
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

export async function escalader(req, res, next) {
  try {
    const litige = await escaladerLitige(
      req.user.idUtilisateur,
      req.params.id,
      req.body.motif,
    );
    res.json({ litige });
  } catch (err) {
    next(err);
  }
}

export async function demanderInfo(req, res, next) {
  try {
    const message = await demanderInformation(
      req.user.idUtilisateur,
      req.params.id,
      req.body.message,
    );
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

export async function listerPieces(req, res, next) {
  try {
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    const pieces = await listPiecesJointes(
      req.user.idUtilisateur,
      req.params.id,
      { isAdmin },
    );
    res.json({ pieces });
  } catch (err) {
    next(err);
  }
}

export async function telechargerPiece(req, res, next) {
  try {
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    const piece = await getPieceJointeForDownload(
      req.user.idUtilisateur,
      req.params.pieceId,
      { isAdmin },
    );
    const filepath = path.resolve(
      process.cwd(),
      "uploads",
      "litiges",
      piece.nomStockage,
    );
    if (!fs.existsSync(filepath)) {
      const err = new Error("Fichier introuvable");
      err.status = 404;
      throw err;
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.download(filepath, piece.nomOriginal);
  } catch (err) {
    next(err);
  }
}

export async function uploadPiece(req, res, next) {
  let piecePersisted = false;
  try {
    if (!req.file) {
      const err = new Error("Fichier requis");
      err.status = 400;
      throw err;
    }
    const isAdmin = req.user?.typeUtilisateur === "administrateur";
    const piece = await enregistrerPieceJointe(
      req.user.idUtilisateur,
      req.params.id,
      {
        nomOriginal: req.file.originalname,
        nomStockage: req.file.filename,
        mimeType: req.file.mimetype,
        tailleOctets: req.file.size,
      },
      { isAdmin },
    );
    piecePersisted = true;
    res.status(201).json({ piece });
  } catch (err) {
    // Ne supprimer le fichier que si aucun enregistrement BDD n'a été créé.
    // Cela évite de créer une pièce BDD orpheline si une notification échoue après insertion.
    if (!piecePersisted && req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}


export async function listerHistorique(req, res, next) {
  try {
    const historique = await listHistoriqueLitige(
      req.user.idUtilisateur,
      req.params.id,
    );
    res.json({ historique });
  } catch (err) {
    next(err);
  }
}

export async function actionDisciplinaire(req, res, next) {
  try {
    const result = await actionDisciplinaireLitige(
      req.user.idUtilisateur,
      req.params.id,
      { type: req.body.type, motif: req.body.motif },
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
