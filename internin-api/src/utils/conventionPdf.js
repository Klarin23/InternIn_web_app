// Génère un PDF simple récapitulant une convention de stage — pour les
// besoins de suivi administratif de l'université (téléchargement/archivage).
// Même approche que utils/certificatPdf.js : rendu simple avec PDFKit,
// enregistré sur disque, servi statiquement via /uploads.

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.resolve("uploads", "conventions");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function ligne(doc, label, valeur) {
  doc
    .fontSize(10)
    .fillColor("#6B7280")
    .text(label, { continued: true })
    .fillColor("#111827")
    .text(`  ${valeur ?? "—"}`);
  doc.moveDown(0.4);
}

export function genererConventionPdf({
  idConvention,
  numero,
  nomStagiaire,
  nomEntreprise,
  intitulePoste,
  dureeStage,
  volumeHoraireHebdo,
  dateDebut,
  accepteeParEntreprise,
  accepteeParStagiaire,
  approuveeParPlateforme,
  valideeParUniversite,
}) {
  ensureDir(UPLOAD_ROOT);
  const filename = `${idConvention}.pdf`;
  const filepath = path.join(UPLOAD_ROOT, filename);

  const doc = new PDFDocument({ size: "A4", margin: 60 });
  doc.pipe(fs.createWriteStream(filepath));

  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke("#14B8A6");

  doc.moveDown(2);
  doc
    .fontSize(12)
    .fillColor("#5B3DF5")
    .text("CONVENTION DE STAGE", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(24).fillColor("#111827").text("InternIn", { align: "center" });
  if (numero) {
    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .text(`Référence n° ${numero}`, { align: "center" });
  }

  doc.moveDown(2.5);
  doc.fontSize(13).fillColor("#111827").text("Parties concernées");
  doc.moveDown(0.5);
  ligne(doc, "Stagiaire :", nomStagiaire);
  ligne(doc, "Entreprise d'accueil :", nomEntreprise);

  doc.moveDown(1);
  doc.fontSize(13).fillColor("#111827").text("Objet du stage");
  doc.moveDown(0.5);
  ligne(doc, "Intitulé du poste :", intitulePoste);
  ligne(doc, "Durée :", dureeStage?.replace("_", " "));
  ligne(
    doc,
    "Volume horaire hebdomadaire :",
    volumeHoraireHebdo ? `${volumeHoraireHebdo} h` : null,
  );
  ligne(doc, "Date de début :", dateDebut);

  doc.moveDown(1);
  doc.fontSize(13).fillColor("#111827").text("État des accords");
  doc.moveDown(0.5);
  ligne(
    doc,
    "Accord entreprise :",
    accepteeParEntreprise ? "Oui" : "En attente",
  );
  ligne(doc, "Accord stagiaire :", accepteeParStagiaire ? "Oui" : "En attente");
  ligne(
    doc,
    "Validation plateforme :",
    approuveeParPlateforme ? "Oui" : "En attente",
  );
  ligne(
    doc,
    "Validation université :",
    valideeParUniversite ? "Oui" : "Non renseignée",
  );

  doc.moveDown(3);
  doc
    .fontSize(9)
    .fillColor("#6B7280")
    .text(
      "Document généré automatiquement à des fins de suivi administratif — ne remplace pas la convention signée entre les parties.",
      { align: "center" },
    );

  doc.end();

  return `conventions/${filename}`;
}
