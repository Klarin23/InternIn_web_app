import fs from "node:fs";
import {
  getMaConvention,
  signerMaConvention,
  getMaConventionPdfPath,
  listConventionsEntreprise,
  getStatsConventionsEntreprise,
  getActionsRequisesEntreprise,
  getConventionEntrepriseById,
  signerConventionEntreprise,
  getConventionEntreprisePdfPath,
} from "./conventions.service.js";

// ── Stagiaire ──────────────────────────────────────────────────────────────

export async function maConvention(req, res, next) {
  try {
    const data = await getMaConvention(req.user.idUtilisateur);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function signer(req, res, next) {
  try {
    const data = await signerMaConvention(req.user.idUtilisateur);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function pdf(req, res, next) {
  try {
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";
    const lang = req.query.lang === "en" ? "en" : "fr";
    const { filepath, filename } = await getMaConventionPdfPath(
      req.user.idUtilisateur,
      lang,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename}"`,
    );

    const stream = fs.createReadStream(filepath);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ error: "Document introuvable" });
      }
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// ── Entreprise ─────────────────────────────────────────────────────────────

function resolveEntrepriseId(req) {
  return (
    req.entreprise?.idEntreprise ||
    req.entrepriseContext?.entreprise?.idEntreprise
  );
}

export async function listEntreprise(req, res, next) {
  try {
    const idEntreprise = resolveEntrepriseId(req);
    const { recherche, statut } = req.query;
    const data = await listConventionsEntreprise(idEntreprise, {
      recherche,
      statut,
    });
    res.json({ conventions: data });
  } catch (err) {
    next(err);
  }
}

export async function statsEntreprise(req, res, next) {
  try {
    const idEntreprise = resolveEntrepriseId(req);
    const stats = await getStatsConventionsEntreprise(idEntreprise);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function actionsRequisesEntreprise(req, res, next) {
  try {
    const idEntreprise = resolveEntrepriseId(req);
    const actions = await getActionsRequisesEntreprise(idEntreprise);
    res.json({ actions });
  } catch (err) {
    next(err);
  }
}

export async function detailEntreprise(req, res, next) {
  try {
    const idEntreprise = resolveEntrepriseId(req);
    const { id } = req.params;
    const data = await getConventionEntrepriseById(idEntreprise, id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function signerEntreprise(req, res, next) {
  try {
    const idEntreprise = resolveEntrepriseId(req);
    const { id } = req.params;
    const data = await signerConventionEntreprise(idEntreprise, id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function pdfEntreprise(req, res, next) {
  try {
    const idEntreprise = resolveEntrepriseId(req);
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";
    const lang = req.query.lang === "en" ? "en" : "fr";
    const { filepath, filename } = await getConventionEntreprisePdfPath(
      idEntreprise,
      req.params.id,
      lang,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename}"`,
    );

    const stream = fs.createReadStream(filepath);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ error: "Document introuvable" });
      }
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}
