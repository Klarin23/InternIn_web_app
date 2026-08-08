// Génère et télécharge un CSV côté client — pas besoin de backend pour ça.
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

  const echapper = (valeur) => `"${String(valeur ?? "").replace(/"/g, '""')}"`;
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
