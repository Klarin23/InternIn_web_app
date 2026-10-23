import fs from "node:fs";
import {
  completeUniversiteOnboarding,
  getUniversiteProfile,
  updateUniversiteProfile,
  getUniversiteStats,
  listEtudiants,
  listEntreprisesPartenaires,
  listConventions,
  validerConvention,
  genererPdfConvention,
  getStatistiquesUniversite,
  listMaitresDeStage,
  getMaitreDeStageDetail,
} from "./universites.service.js";
import {
  listEtudiantsQuerySchema,
  listEntreprisesQuerySchema,
  listConventionsQuerySchema,
  listMaitresDeStageQuerySchema,
} from "./universites.schema.js";

function validerQuery(schema, query, res) {
  const validation = schema.safeParse(query);
  if (!validation.success) {
    res.status(400).json({
      error: "Paramètres de requête invalides",
      details: validation.error.flatten().fieldErrors,
    });
    return null;
  }
  return validation.data;
}

export async function completeOnboarding(req, res, next) {
  try {
    const universite = await completeUniversiteOnboarding(
      req.user.idUtilisateur,
      req.body,
    );
    res.status(201).json({ universite });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    res.json(await getUniversiteProfile(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    res.json(await updateUniversiteProfile(req.user.idUtilisateur, req.body));
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    res.json(await getUniversiteStats(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listEtudiantsHandler(req, res, next) {
  try {
    const query = validerQuery(listEtudiantsQuerySchema, req.query, res);
    if (!query) return;

    const { recherche, statut, page, parPage } = query;
    const resultat = await listEtudiants(req.user.idUtilisateur, {
      recherche,
      statut,
      page,
      parPage,
    });
    res.json(resultat);
  } catch (err) {
    next(err);
  }
}

export async function listEntreprisesHandler(req, res, next) {
  try {
    const query = validerQuery(listEntreprisesQuerySchema, req.query, res);
    if (!query) return;

    res.json(
      await listEntreprisesPartenaires(req.user.idUtilisateur, query),
    );
  } catch (err) {
    next(err);
  }
}

export async function listConventionsHandler(req, res, next) {
  try {
    const query = validerQuery(listConventionsQuerySchema, req.query, res);
    if (!query) return;

    res.json(await listConventions(req.user.idUtilisateur, query));
  } catch (err) {
    next(err);
  }
}

export async function validerConventionHandler(req, res, next) {
  try {
    const convention = await validerConvention(
      req.user.idUtilisateur,
      req.params.id,
      req.body.valider,
    );
    res.json({ convention });
  } catch (err) {
    next(err);
  }
}

export async function genererPdfConventionHandler(req, res, next) {
  try {
    const disposition =
      req.query.disposition === "inline" ? "inline" : "attachment";
    const lang = req.query.lang === "en" ? "en" : "fr";
    const { filepath, filename } = await genererPdfConvention(
      req.user.idUtilisateur,
      req.params.id,
      lang,
    );

    // Auth + ownership déjà vérifiés dans genererPdfConvention.
    // Ne jamais renvoyer d'URL publique ni de chemin absolu.
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${filename.replace(/"/g, "")}"`,
    );

    const stream = fs.createReadStream(filepath);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ error: "Document introuvable" });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function getStatistiquesHandler(req, res, next) {
  try {
    res.json(await getStatistiquesUniversite(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function listMaitresDeStageHandler(req, res, next) {
  try {
    const query = validerQuery(listMaitresDeStageQuerySchema, req.query, res);
    if (!query) return;

    const {
      recherche,
      entreprise,
      statut,
      encadrement,
      page,
      parPage,
      tri,
      ordre,
    } = query;

    res.json(
      await listMaitresDeStage(req.user.idUtilisateur, {
        recherche,
        idEntreprise: entreprise,
        statut,
        encadrement,
        page,
        parPage,
        tri,
        ordre,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getMaitreDeStageDetailHandler(req, res, next) {
  try {
    res.json(await getMaitreDeStageDetail(req.user.idUtilisateur, req.params.idMembre));
  } catch (err) {
    next(err);
  }
}
