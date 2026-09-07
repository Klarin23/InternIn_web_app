/**
 * Tests de sécurité IDOR — réponse offre finale (stagiaire).
 * Usage (API démarrée, variables d'env OK) :
 *   node script/test-idor-offre-finale-reponse.js
 *
 * Nécessite deux comptes stagiaire + une offre finale de B connue.
 * Sans données, le script documente les cas et sort en skip.
 */
import "dotenv/config";

const API = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `login failed ${res.status}`);
  return data.token || data.accessToken;
}

async function repondre(token, idOffreFinale, statut) {
  return fetch(`${API}/offres-finales/${idOffreFinale}/reponse`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      statutReponseStagiaire: statut,
      // Tentative d'élévation (doit être ignorée)
      idStagiaire: "00000000-0000-0000-0000-000000000099",
      idEntreprise: "00000000-0000-0000-0000-000000000088",
    }),
  });
}

async function main() {
  const emailA = process.env.TEST_STAGIAIRE_A_EMAIL;
  const passA = process.env.TEST_STAGIAIRE_A_PASSWORD;
  const emailB = process.env.TEST_STAGIAIRE_B_EMAIL;
  const passB = process.env.TEST_STAGIAIRE_B_PASSWORD;
  const offreB = process.env.TEST_OFFRE_FINALE_B_ID; // appartient à B, statut en_attente + approuvée

  console.log("=== IDOR offre finale — repondre ===");
  console.log("API:", API);

  // Test 4 — non authentifié
  {
    const res = await fetch(`${API}/offres-finales/00000000-0000-0000-0000-000000000001/reponse`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statutReponseStagiaire: "acceptee" }),
    });
    console.log("T4 non auth:", res.status, res.status === 401 ? "OK" : "ATTENTION");
  }

  // Test 5 — offre inexistante (avec token A si dispo)
  if (emailA && passA) {
    const tokenA = await login(emailA, passA);
    const res = await repondre(
      tokenA,
      "00000000-0000-0000-0000-000000000001",
      "acceptee",
    );
    console.log("T5 offre inexistante:", res.status, [404, 403].includes(res.status) ? "OK" : "ATTENTION");

    // Test 11 — rôle : si token entreprise fourni
    // Test 2 — IDOR
    if (offreB) {
      const resIdor = await repondre(tokenA, offreB, "acceptee");
      const body = await resIdor.json().catch(() => ({}));
      console.log(
        "T2 IDOR A→offre B:",
        resIdor.status,
        body.error || "",
        [403, 404].includes(resIdor.status) ? "OK" : "FAIL",
      );
      const resIdorRefus = await repondre(tokenA, offreB, "refusee");
      console.log(
        "T3 IDOR refus A→offre B:",
        resIdorRefus.status,
        [403, 404].includes(resIdorRefus.status) ? "OK" : "FAIL",
      );
    } else {
      console.log("T2/T3 skip — définir TEST_OFFRE_FINALE_B_ID");
    }
  } else {
    console.log("T2/T5 skip — définir TEST_STAGIAIRE_A_EMAIL / PASSWORD");
  }

  console.log("Terminé. Vérifiez manuellement T1/T6/T10 avec des données réelles.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
