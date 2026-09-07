// Génère et télécharge un CSV côté client — pas besoin de backend pour ça.
//
// Sécurité : neutralise l'injection de formule CSV. Les champs ci-dessous
// (prénom, nom, ville, URL de CV/LinkedIn...) sont saisis librement par les
// candidats. Si un champ commence par =, +, -, @ (ou une tabulation/retour
// chariot), Excel/Google Sheets peut l'interpréter comme une formule à
// l'ouverture du fichier (ex: nom = "=CMD|'/c calc'!A1"). On préfixe ces
// valeurs d'une apostrophe pour forcer une interprétation en texte brut,
// avant l'échappement CSV existant (qui gère déjà les guillemets).
const CARACTERES_FORMULE = ["=", "+", "-", "@", "\t", "\r"];

function neutraliserFormuleCsv(valeur) {
  const s = String(valeur ?? "");
  if (s.length > 0 && CARACTERES_FORMULE.includes(s[0])) {
    return `'${s}`;
  }
  return s;
}

export function exporterCandidaturesCsv(offre, candidats) {
  const entetes = [
    "Prénom",
    "Nom",
    "Ville",
    "Pays",
    "Statut",
    "Date de candidature",
    "CV",
    "LinkedIn",
  ];

  const lignes = candidats.map((c) => [
    c.prenom,
    c.nom,
    c.ville || "",
    c.pays || "",
    c.statut,
    c.dateCandidature
      ? new Date(c.dateCandidature).toLocaleDateString("fr-FR")
      : "",
    c.cvUrl || "",
    c.linkedinUrl || "",
  ]);

  const echapper = (valeur) =>
    `"${neutraliserFormuleCsv(valeur).replace(/"/g, '""')}"`;
  const csv = [entetes, ...lignes]
    .map((ligne) => ligne.map(echapper).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidatures-${offre.titre.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
