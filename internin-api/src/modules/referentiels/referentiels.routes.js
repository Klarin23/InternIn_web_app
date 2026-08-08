// Ces routes sont publiques (pas de requireAuth) : elles ne renvoient que
// des listes de référence sans donnée personnelle, utilisables même avant
// authentification complète si besoin plus tard (ex. filtres publics).

import { Router } from "express";
import {
  listCompetences,
  listCentresInteret,
  listObjectifs,
} from "./referentiels.controller.js";

const router = Router();

router.get("/competences", listCompetences);
router.get("/centres-interet", listCentresInteret);
router.get("/objectifs-developpement", listObjectifs);

export default router;
