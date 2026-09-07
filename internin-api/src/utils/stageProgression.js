/**
 * Calcul unifié de la progression d'un stage (stagiaire + admin + superviseur).
 *
 * Priorité :
 *  1) saisie manuelle superviseur (progressionPourcentage) — y compris 0
 *  2) objectifs réalisés
 *  3) tâches terminées
 *  4) estimation temporelle (lifecycle + dates civiles)
 *
 * Pour l'affichage, préférer `percent` (nombre 0–100) sauf stage interrompu
 * sans saisie manuelle (percent null).
 */
import { toYmd, getStageLifecycleStatus } from "./stageLifecycle.js";

function toProgressDate(value) {
  const ymd = toYmd(value);
  if (ymd) {
    const d = new Date(`${ymd}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value != null && value !== "") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function isDoneObjectif(statut) {
  return (
    statut === "realise" ||
    statut === "realisee" ||
    statut === "atteint" ||
    statut === "fait"
  );
}

function isDoneTache(statut) {
  return (
    statut === "terminee" ||
    statut === "termine" ||
    statut === "realise" ||
    statut === "faite" ||
    statut === "fait"
  );
}

/**
 * @param {Array<{statut?: string}>} [objectifs]
 * @param {Array<{statut?: string}>} [taches]
 * @param {object|null} [stage]
 * @returns {{ percent: number|null, source: string|null, done: number|null, total: number|null }}
 */
export function computeStageProgression(
  objectifs = [],
  taches = [],
  stage = null,
) {
  // 1) Manuel (0 est une valeur valide)
  if (
    stage &&
    stage.progressionPourcentage != null &&
    stage.progressionPourcentage !== ""
  ) {
    const n = Number(stage.progressionPourcentage);
    if (Number.isFinite(n)) {
      return {
        percent: Math.min(100, Math.max(0, Math.round(n))),
        source: "manuelle",
        done: null,
        total: null,
      };
    }
  }

  // 2) Objectifs
  const objs = Array.isArray(objectifs) ? objectifs : [];
  if (objs.length > 0) {
    const done = objs.filter((o) => isDoneObjectif(o?.statut)).length;
    if (done > 0) {
      return {
        percent: Math.round((done / objs.length) * 100),
        source: "objectifs",
        done,
        total: objs.length,
      };
    }
  }

  // 3) Tâches
  const tasks = Array.isArray(taches) ? taches : [];
  if (tasks.length > 0) {
    const done = tasks.filter((t) => isDoneTache(t?.statut)).length;
    if (done > 0) {
      return {
        percent: Math.round((done / tasks.length) * 100),
        source: "taches",
        done,
        total: tasks.length,
      };
    }
  }

  // 4) Temporel
  if (!stage) {
    return { percent: 0, source: null, done: 0, total: 0 };
  }

  const lifecycle =
    stage.statutLifecycle ||
    getStageLifecycleStatus({
      statut: stage.statutStocke || stage.statut || null,
      dateDebut: stage.dateDebut,
      dateFinPrevue: stage.dateFinPrevue,
      dateFinReelle: stage.dateFinReelle,
    });

  if (lifecycle === "termine") {
    return { percent: 100, source: "temps", done: null, total: null };
  }
  if (lifecycle === "interrompu") {
    return { percent: null, source: "temps", done: null, total: null };
  }
  if (lifecycle === "a_venir") {
    return { percent: 0, source: "temps", done: null, total: null };
  }

  // actif (ou statut inconnu avec dates)
  let debut = toProgressDate(stage.dateDebut);
  let fin = toProgressDate(stage.dateFinPrevue || stage.dateFinReelle);
  if (!debut || !fin) {
    return { percent: 0, source: "temps", done: null, total: null };
  }
  if (fin.getTime() < debut.getTime()) {
    const tmp = debut;
    debut = fin;
    fin = tmp;
  }
  const dureeMs = fin.getTime() - debut.getTime();
  if (dureeMs <= 0) {
    return { percent: 0, source: "temps", done: null, total: null };
  }
  const percent = Math.min(
    100,
    Math.max(0, Math.round(((Date.now() - debut.getTime()) / dureeMs) * 100)),
  );
  return { percent, source: "temps", done: null, total: null };
}

/** Pour l'UI : toujours un nombre sauf interrompu sans manuel → null */
export function progressionAffichee(result) {
  if (!result) return 0;
  if (result.percent == null) return null;
  return result.percent;
}

export const computeProgression = computeStageProgression;
