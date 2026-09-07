/**
 * Scoring comportemental pur (sans I/O) — Centre de sécurité InternIn.
 * Partage ≠ automatisation ≠ conformité auth.
 */

export function scoreRegulariteIntervalles(datesMs) {
  if (!datesMs || datesMs.length < 4) return 0;
  const sorted = [...datesMs].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = sorted[i] - sorted[i - 1];
    if (g > 0 && g < 30 * 60 * 1000) gaps.push(g);
  }
  if (gaps.length < 3) return 0;
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (mean <= 0) return 0;
  const variance = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv > 0.5) return 0;
  if (cv <= 0.15) return 1;
  return Math.max(0, 1 - cv / 0.5);
}

/**
 * Heuristique prudente "impossible travel" sans lat/lng.
 * Même pays + villes différentes + délai très court → signal faible/moyen.
 * Pays différents + délai extrême → signal fort.
 * Ne prétend pas mesurer une vitesse réelle.
 */
export function detectIncompatibleTravel(connexionsSorted) {
  const signals = [];
  for (let i = 1; i < connexionsSorted.length; i++) {
    const prev = connexionsSorted[i - 1];
    const cur = connexionsSorted[i];
    const dt =
      new Date(cur.dateConnexion || cur.at || 0).getTime() -
      new Date(prev.dateConnexion || prev.at || 0).getTime();
    if (dt <= 0 || dt > 6 * 60 * 60 * 1000) continue;

    // Accepte villeConnexion/paysConnexion OU ville/pays (agrégats service)
    const villeA = (prev.villeConnexion || prev.ville || "").trim().toLowerCase();
    const villeB = (cur.villeConnexion || cur.ville || "").trim().toLowerCase();
    const paysA = (prev.paysConnexion || prev.pays || "").trim().toLowerCase();
    const paysB = (cur.paysConnexion || cur.pays || "").trim().toLowerCase();

    if (!villeA && !paysA) continue;
    if (!villeB && !paysB) continue;

    const sameCity = villeA && villeB && villeA === villeB;
    if (sameCity) continue;

    const sameCountry = paysA && paysB && paysA === paysB;
    const differentCountry =
      paysA && paysB && paysA !== paysB;

    // < 30 min, villes différentes même pays
    if (dt < 30 * 60 * 1000 && villeA && villeB && villeA !== villeB && sameCountry) {
      signals.push({ strength: "faible", dt, prev, cur });
    }
    // < 2 h, pays différents
    if (dt < 2 * 60 * 60 * 1000 && differentCountry) {
      signals.push({ strength: "fort", dt, prev, cur });
    }
    // < 15 min, villes clairement différentes (même si pays manquant)
    if (dt < 15 * 60 * 1000 && villeA && villeB && villeA !== villeB) {
      signals.push({ strength: differentCountry ? "fort" : "moyen", dt, prev, cur });
    }
  }
  return signals;
}

export function countRapidIpSwitches(connexionsSorted, windowMs = 15 * 60 * 1000) {
  let hops = 0;
  for (let i = 1; i < connexionsSorted.length; i++) {
    const prev = connexionsSorted[i - 1];
    const cur = connexionsSorted[i];
    const dt =
      new Date(cur.dateConnexion || 0).getTime() -
      new Date(prev.dateConnexion || 0).getTime();
    if (
      dt > 0 &&
      dt < windowMs &&
      prev.adresseIp &&
      cur.adresseIp &&
      prev.adresseIp !== cur.adresseIp
    ) {
      hops += 1;
    }
  }
  return hops;
}

/**
 * @param {object} agg agrégats utilisateur
 * @param {object} profil
 * @param {object} T seuils
 * @param {{ multiAccountsSameIp?: number }} ipContext
 */
export function computeBehavioralScores(agg, profil, T, ipContext = {}) {
  const signaux = [];
  let scorePartage = 0;
  let scoreAuto = 0;
  let scoreAuth = 0;

  const nIp = agg.ips7j?.size || agg.ipsActives?.size || 0;
  const nLieux = (agg.lieux && agg.lieux.size) || 0;

  const connexionsSorted = [...(agg.connexions || [])].sort(
    (a, b) =>
      new Date(a.dateConnexion || 0).getTime() -
      new Date(b.dateConnexion || 0).getTime(),
  );

  // —— PARTAGE (uniquement signaux multi-session / multi-contexte) ——
  // Un seul signal isolé reste modéré pour limiter les faux positifs.
  if (agg.sessionsActives >= (T.multiSessionsActives || 3)) {
    const pts = agg.sessionsActives >= 5 ? 28 : 16;
    scorePartage += pts;
    signaux.push({
      code: "multi_sessions",
      label: `${agg.sessionsActives} sessions actives simultanées`,
      severite: agg.sessionsActives >= 5 ? "important" : "attention",
      points: pts,
      axe: "partage",
      value: agg.sessionsActives,
    });
  }

  if (nIp >= (T.multiIp7j || 3)) {
    // Corrélation avec sessions : ne pas sur-pondérer le même phénomène
    const pts = nIp >= 5 ? 22 : 12;
    scorePartage += pts;
    signaux.push({
      code: "multi_ip",
      label: `${nIp} adresses IP distinctes (7 j)`,
      severite: nIp >= 5 ? "important" : "attention",
      points: pts,
      axe: "partage",
      value: nIp,
    });
  }

  const hops = countRapidIpSwitches(connexionsSorted);
  if (hops >= 2) {
    const pts = Math.min(18, 6 + hops * 4);
    scorePartage += pts;
    signaux.push({
      code: "rapid_ip_switch",
      label: `${hops} changements d'IP en moins de 15 min`,
      severite: hops >= 3 ? "important" : "attention",
      points: pts,
      axe: "partage",
      value: hops,
    });
  }

  const travel = detectIncompatibleTravel(connexionsSorted);
  if (travel.some((s) => s.strength === "fort")) {
    const pts = 30;
    scorePartage += pts;
    signaux.push({
      code: "impossible_travel",
      label: "Localisations temporellement incompatibles",
      severite: "critique",
      points: pts,
      axe: "partage",
    });
  } else if (travel.some((s) => s.strength === "moyen")) {
    const pts = 14;
    scorePartage += pts;
    signaux.push({
      code: "impossible_travel",
      label: "Localisations difficilement compatibles",
      severite: "attention",
      points: pts,
      axe: "partage",
    });
  } else if (nLieux >= 3 && travel.length > 0) {
    const pts = 10;
    scorePartage += pts;
    signaux.push({
      code: "multi_lieux",
      label: `${nLieux} zones géographiques distinctes`,
      severite: "attention",
      points: pts,
      axe: "partage",
      value: nLieux,
    });
  }

  // Sessions rapides : signal faible de partage seulement si déjà multi-IP
  if (agg.sessions24h >= (T.sessionsRapides24h || 5) && nIp >= 2) {
    const pts = 8;
    scorePartage += pts;
    signaux.push({
      code: "sessions_rapides",
      label: `${agg.sessions24h} sessions créées en 24 h`,
      severite: "attention",
      points: pts,
      axe: "partage",
      value: agg.sessions24h,
    });
  }

  // —— AUTOMATISATION / ATTAQUE ——
  if (agg.echecs1h >= (T.echecsLogin1h || 5)) {
    const pts = Math.min(40, 20 + agg.echecs1h);
    scoreAuto += pts;
    signaux.push({
      code: "echecs_login_1h",
      label: `${agg.echecs1h} échecs de connexion en 1 h`,
      severite: "critique",
      points: pts,
      axe: "automatisation",
      value: agg.echecs1h,
    });
  } else if (agg.echecs24h >= (T.echecsLogin24h || 10)) {
    const pts = 18;
    scoreAuto += pts;
    signaux.push({
      code: "echecs_login_24h",
      label: `${agg.echecs24h} échecs de connexion en 24 h`,
      severite: "important",
      points: pts,
      axe: "automatisation",
      value: agg.echecs24h,
    });
  }

  if (agg.echecsFenetreCourte >= (T.autoTentativesFenetreMin || 15)) {
    const pts = Math.min(35, 18 + Math.floor(agg.echecsFenetreCourte / 2));
    scoreAuto += pts;
    signaux.push({
      code: "rafale_tentatives",
      label: `${agg.echecsFenetreCourte} tentatives en fenêtre courte`,
      severite: "critique",
      points: pts,
      axe: "automatisation",
      value: agg.echecsFenetreCourte,
    });
  }

  if ((agg.regulariteScore || 0) >= 0.7 && (agg.echecs24h || 0) >= 8) {
    const pts = Math.round(agg.regulariteScore * 25);
    scoreAuto += pts;
    signaux.push({
      code: "intervalles_reguliers",
      label: `Régularité élevée des tentatives (${Math.round(agg.regulariteScore * 100)} %)`,
      severite: "important",
      points: pts,
      axe: "automatisation",
      value: Math.round((agg.regulariteScore || 0) * 100),
    });
  }

  // Même IP → plusieurs comptes (sessions réussies + échecs)
  // Réseau partagé légitime (univ, famille) : beaucoup de comptes MAIS
  // peu d'échecs et activité espacée → signal faible ou nul.
  const multiAcc = Number(ipContext.multiAccountsSameIp || 0);
  const successAcc = Number(ipContext.successfulAccountsByIp || multiAcc);
  const failedAcc = Number(ipContext.failedAccountsByIp || 0);
  const ipEchecs = Number(ipContext.failedAttemptsByIp || 0);
  const ipSessionsRapides = Number(ipContext.rapidSessionsByIp || 0);

  if (multiAcc >= 5) {
    const dense =
      ipEchecs >= 15 ||
      failedAcc >= 5 ||
      (multiAcc >= 12 && ipSessionsRapides >= 8) ||
      (multiAcc >= 20 && ipEchecs >= 5);

    if (dense) {
      const pts = Math.min(
        40,
        10 + Math.floor(multiAcc / 2) + Math.min(15, Math.floor(ipEchecs / 3)),
      );
      scoreAuto += pts;
      signaux.push({
        code: "multi_accounts_same_ip",
        label: `IP partagée : ${multiAcc} comptes (${successAcc} sessions, ${failedAcc} en échec)`,
        severite: multiAcc >= 15 || ipEchecs >= 30 ? "critique" : "important",
        points: pts,
        axe: "automatisation",
        value: multiAcc,
        meta: {
          successfulAccountsByIp: successAcc,
          failedAccountsByIp: failedAcc,
          failedAttemptsByIp: ipEchecs,
        },
      });
    } else if (multiAcc >= 25) {
      const pts = 8;
      scoreAuto += pts;
      signaux.push({
        code: "multi_accounts_same_ip",
        label: `IP très partagée : ${multiAcc} comptes (activité peu suspecte)`,
        severite: "attention",
        points: pts,
        axe: "automatisation",
        value: multiAcc,
      });
    }
  }

  // —— AUTH / CONFORMITÉ (n'alimente PAS le score partage) ——
  if (profil?.statutCompte === "suspendu") {
    scoreAuth += 15;
    signaux.push({
      code: "compte_suspendu",
      label: "Compte suspendu",
      severite: "important",
      points: 15,
      axe: "authentification",
    });
  }
  if (profil?.emailVerifie === false && (agg.sessionsActives || 0) > 0) {
    scoreAuth += 8;
    signaux.push({
      code: "email_non_verifie",
      label: "Email non vérifié avec session active",
      severite: "attention",
      points: 8,
      axe: "authentification",
    });
  }

  scorePartage = Math.min(100, scorePartage);
  scoreAuto = Math.min(100, scoreAuto);
  scoreAuth = Math.min(100, scoreAuth);

  // Global : comportement (partage/auto) dominant ; auth en faible poids
  const scoreGlobal = Math.min(
    100,
    Math.round(scorePartage * 0.5 + scoreAuto * 0.45 + scoreAuth * 0.05),
  );

  // Classification : ne pas classer "partage" sur de seuls échecs login
  let niveau = "normal";
  if (scoreGlobal >= 85 && (scoreAuto >= 70 || scorePartage >= 70)) {
    niveau = "critique";
  } else if (scoreAuto >= 55 && scoreAuto > scorePartage + 10) {
    niveau = (multiAcc >= 12 && ipEchecs >= 15) || (agg.echecs1h || 0) >= 15
      ? "attaque_probable"
      : "automatisation_probable";
  } else if (scorePartage >= 50 && scorePartage > scoreAuto) {
    // Exige au moins 2 signaux partage pour "partage_probable"
    const partageSignals = signaux.filter((s) => s.axe === "partage").length;
    niveau = partageSignals >= 2 ? "partage_probable" : "suspect";
  } else if (scoreGlobal >= 40) {
    niveau = "suspect";
  } else if (scoreGlobal >= 18 || signaux.length > 0) {
    niveau = "inhabituel";
  }

  const niveauLegacy =
    scoreGlobal >= (T.scoreCritique || 60)
      ? "critique"
      : scoreGlobal >= (T.scoreAttention || 30)
        ? "important"
        : "attention";

  // Confiance selon diversité des axes et nombre de signaux
  const axes = new Set(signaux.map((s) => s.axe));
  let confiance = "faible";
  if (signaux.length >= 3 && axes.size >= 2) confiance = "elevee";
  else if (signaux.length >= 2 || (signaux.length >= 1 && scoreGlobal >= 40))
    confiance = "moyenne";

  return {
    score: scoreGlobal,
    scoreGlobal,
    scorePartageCompte: scorePartage,
    scoreAutomatisation: scoreAuto,
    scoreAuthentification: scoreAuth,
    niveau,
    niveauLegacy,
    confiance,
    signaux,
  };
}
