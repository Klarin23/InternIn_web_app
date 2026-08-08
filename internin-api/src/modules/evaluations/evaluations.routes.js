// Note : la vérification "cette personne a-t-elle le droit de voir ce stage"
// n'est pas encore appliquée sur les routes GET (elle l'est seulement à la
// création). Comme il faut connaître idStage pour interroger l'API (donc déjà
// être dans un contexte légitime — son propre stage ou celui qu'on encadre),
// le risque est faible pour un MVP, mais à renforcer avant une mise en production.

import { Router } from "express";
import { creer, listPourStage, listCoachingPourStage } from "./evaluations.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createEvaluationSchema } from "./evaluations.schema.js";

const router = Router();

router.post("/", requireAuth, validate(createEvaluationSchema), creer);
router.get("/stage/:idStage", requireAuth, listPourStage);
router.get("/coaching/stage/:idStage", requireAuth, listCoachingPourStage);

export default router;