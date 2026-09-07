import {
  listTalents,
  getTalentById,
  createProposition,
  listPropositionsEntreprise,
  listPropositionsStagiaire,
  updatePropositionStatut,
  deletePropositionEntreprise,
} from "./propositions.service.js";
import { db } from "../../db/index.js";
import { stagiaires } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { resolveEntrepriseContext, resolveEntrepriseContextOrThrow, hasEntreprisePermission } from "../../utils/entrepriseContext.js";

/**
 * Le middleware RBAC attache déjà le contexte entreprise. Pour les routes
 * partagées (PATCH), on le résout via le même service central plutôt que de
 * refaire une recherche propriétaire/membre locale.
 */
async function resolveIdEntreprise(req) {
  if (req.entrepriseContext?.entreprise?.idEntreprise) {
    return req.entrepriseContext.entreprise.idEntreprise;
  }

  const idUtilisateur = req.user?.idUtilisateur;
  if (!idUtilisateur) return null;

  const ctx = await resolveEntrepriseContext(idUtilisateur);
  if (!ctx) return null;
  req.entrepriseContext = ctx;
  req.entreprise = ctx.entreprise;
  return ctx.entreprise.idEntreprise;
}

function isEntrepriseLike(type) {
  return type === "entreprise" || type === "membre_entreprise";
}

async function getStagiaireIdFromUser(idUtilisateur) {
  const [s] = await db
    .select({ idStagiaire: stagiaires.idStagiaire })
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);
  return s?.idStagiaire;
}

/**
 * Vérifie que le membre a bien la permission demandée (hors propriétaire / admin principal).
 * Utilisé pour les routes partagées (ex. PATCH) où le middleware route ne peut pas
 * imposer une permission équipe (car stagiaire aussi).
 */
async function assertEntreprisePermission(req, clePermission) {
  const idUtilisateur = req.user?.idUtilisateur;
  if (!idUtilisateur) {
    const err = new Error("Authentification requise");
    err.status = 401;
    throw err;
  }

  const ctx = req.entrepriseContext || (await resolveEntrepriseContextOrThrow(idUtilisateur));
  if (!hasEntreprisePermission(ctx, clePermission)) {
    const err = new Error(
      "Vous n'avez pas la permission nécessaire pour effectuer cette action.",
    );
    err.status = 403;
    throw err;
  }

  req.entrepriseContext = ctx;
  req.entreprise = ctx.entreprise;
  return ctx;
}

export async function getTalents(req, res, next) {
  try {
    if (!isEntrepriseLike(req.user.typeUtilisateur)) {
      return res.status(403).json({ error: "Accès réservé aux entreprises" });
    }
    const result = await listTalents({
      search: req.query.search,
      competence: req.query.competence,
      domaine: req.query.domaine,
      niveau: req.query.niveau,
      universite: req.query.universite,
      disponibilite: req.query.disponibilite,
      localisation: req.query.localisation,
      typeStage: req.query.typeStage,
      sort: req.query.sort,
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 12, 50),
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getTalent(req, res, next) {
  try {
    if (!isEntrepriseLike(req.user.typeUtilisateur)) {
      return res.status(403).json({ error: "Accès réservé aux entreprises" });
    }
    const talent = await getTalentById(req.params.id);
    if (!talent) {
      return res.status(404).json({ error: "Profil non trouvé" });
    }
    res.json(talent);
  } catch (e) {
    next(e);
  }
}

export async function postProposition(req, res, next) {
  try {
    if (!isEntrepriseLike(req.user.typeUtilisateur)) {
      return res.status(403).json({ error: "Accès réservé aux entreprises" });
    }
    // requireEquipePermission("talents.proposer") a déjà validé la permission
    // et attaché req.entrepriseContext
    const idEntreprise = await resolveIdEntreprise(req);
    if (!idEntreprise) {
      return res.status(403).json({ error: "Entreprise non trouvée" });
    }
    const prop = await createProposition({
      idEntreprise,
      idStagiaire: req.body.idStagiaire,
      idOffre: req.body.idOffre,
      message: req.body.message,
    });
    res.status(201).json(prop);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
}

export async function getPropositionsEntreprise(req, res, next) {
  try {
    if (!isEntrepriseLike(req.user.typeUtilisateur)) {
      return res.status(403).json({ error: "Accès réservé aux entreprises" });
    }
    // requireEquipePermission("talents.voir") a déjà validé
    const idEntreprise = await resolveIdEntreprise(req);
    if (!idEntreprise) {
      return res.status(403).json({ error: "Entreprise non trouvée" });
    }
    const list = await listPropositionsEntreprise(idEntreprise);
    res.json(list);
  } catch (e) {
    next(e);
  }
}

export async function getPropositionsStagiaire(req, res, next) {
  try {
    if (req.user.typeUtilisateur !== "stagiaire") {
      return res.status(403).json({ error: "Accès réservé aux stagiaires" });
    }
    const idStagiaire = await getStagiaireIdFromUser(req.user.idUtilisateur);
    const list = await listPropositionsStagiaire(idStagiaire);
    res.json(list);
  } catch (e) {
    next(e);
  }
}

export async function deleteProposition(req, res, next) {
  try {
    if (!isEntrepriseLike(req.user.typeUtilisateur)) {
      return res.status(403).json({ error: "Accès réservé aux entreprises" });
    }
    // requireEquipePermission("talents.proposer") a déjà validé
    const idEntreprise = await resolveIdEntreprise(req);
    if (!idEntreprise) {
      return res.status(403).json({ error: "Entreprise non trouvée" });
    }
    const result = await deletePropositionEntreprise({
      idProposition: req.params.id,
      idEntreprise,
    });
    res.json(result);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
}

export async function patchProposition(req, res, next) {
  try {
    const type = req.user.typeUtilisateur;
    let idEntreprise = null;
    let idStagiaire = null;

    if (isEntrepriseLike(type)) {
      // Côté entreprise : exiger talents.proposer (créer/modifier/annuler)
      // lecture_seule / superviseur sans cette permission → 403
      await assertEntreprisePermission(req, "talents.proposer");
      idEntreprise = await resolveIdEntreprise(req);
      if (!idEntreprise) {
        return res.status(403).json({ error: "Entreprise non trouvée" });
      }
    } else if (type === "stagiaire") {
      idStagiaire = await getStagiaireIdFromUser(req.user.idUtilisateur);
      if (!idStagiaire) {
        return res.status(403).json({ error: "Profil stagiaire non trouvé" });
      }
    } else {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const updated = await updatePropositionStatut({
      idProposition: req.params.id,
      idUtilisateur: req.user.idUtilisateur,
      typeUtilisateur: type,
      idEntreprise,
      idStagiaire,
      statut: req.body.statut,
      commentaireReponse: req.body.commentaireReponse ?? null,
    });
    res.json(updated);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
}
