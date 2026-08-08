// Génère un certificat PDF simple à partir des infos du stage.
// Enregistré sur disque comme les autres documents (uploads/certificats/),
// servi statiquement de la même façon.

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.resolve("uploads", "certificats");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function genererCertificatPdf({
  idStage,
  prenom,
  nom,
  nomEntreprise,
  intitulePoste,
  dateDebut,
  dateFin,
  codeVerification,
}) {
  ensureDir(UPLOAD_ROOT);
  const filename = `${idStage}.pdf`;
  const filepath = path.join(UPLOAD_ROOT, filename);

  const doc = new PDFDocument({ size: "A4", margin: 60 });
  doc.pipe(fs.createWriteStream(filepath));

  // Cadre décoratif simple
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke("#14B8A6");

  doc.moveDown(4);
  doc
    .fontSize(12)
    .fillColor("#5B3DF5")
    .text("CERTIFICAT DE STAGE", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(28).fillColor("#111827").text("InternIn", { align: "center" });

  doc.moveDown(2);
  doc
    .fontSize(14)
    .fillColor("#374151")
    .text("Ce certificat atteste que", { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(22)
    .fillColor("#14B8A6")
    .text(`${prenom} ${nom}`, { align: "center" });

  doc.moveDown(1);
  doc
    .fontSize(13)
    .fillColor("#374151")
    .text(`a complété avec succès un stage de "${intitulePoste}"`, {
      align: "center",
    })
    .text(`au sein de ${nomEntreprise}`, { align: "center" })
    .text(`du ${dateDebut} au ${dateFin}`, { align: "center" });

  doc.moveDown(3);
  doc
    .fontSize(10)
    .fillColor("#6B7280")
    .text(`Code de vérification : ${codeVerification}`, { align: "center" });
  doc.text("Vérifiable sur internin.com/verification", { align: "center" });

  doc.end();

  return `certificats/${filename}`;
}
