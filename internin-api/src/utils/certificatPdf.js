// Génère un certificat PDF (paysage, design "diplôme premium") à partir
// des infos du stage. Enregistré sur disque comme les autres documents
// (uploads/certificats/), servi statiquement de la même façon.
//
// Design aligné sur la charte InternIn :
//   primaire  #14B8A6 (turquoise) — secondaire #5B3DF5 (violet)
//   accent    #F5B301 (doré)

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const UPLOAD_ROOT = path.resolve("uploads", "certificats");

const PRIMARY = "#14B8A6";
const SECONDARY = "#5B3DF5";
const SECONDARY_LIGHT = "#EFEBFF";
const ACCENT = "#F5B301";
const INK = "#111827";
const BODY = "#374151";
const GREY = "#6B7280";
const GREY_LIGHT = "#D1D5DB";
const PAPER_TINT = "#FBFAFF";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cornerOrnament(doc, x, y, size, flipX, flipY, color) {
  doc.save();
  doc.translate(x, y).scale(flipX, flipY);
  doc.lineWidth(1.4).strokeColor(color);
  doc.moveTo(0, 0).lineTo(size, 0).stroke();
  doc.moveTo(0, 0).lineTo(0, size).stroke();
  doc.lineWidth(0.7);
  doc.moveTo(10, 10).lineTo(size - 10, 10).stroke();
  doc.moveTo(10, 10).lineTo(10, size - 10).stroke();
  doc.circle(6, 6, 2.2).fillColor(color).fill();
  doc.restore();
}

function drawWordmark(doc, cx, cy) {
  const r = 13;
  doc.save();
  doc.lineWidth(3.2);
  doc.circle(cx - 8, cy, r).strokeColor(PRIMARY).stroke();
  doc.circle(cx + 8, cy, r).strokeColor(SECONDARY).stroke();
  doc.restore();
  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(INK)
    .text("InternIn", cx + 12, cy - 10, { lineBreak: false });
}

function seal(doc, cx, cy) {
  doc.save();
  // rubans
  [
    { dx: -7, rot: 12, color: SECONDARY },
    { dx: 7, rot: -12, color: PRIMARY },
  ].forEach(({ dx, rot, color }) => {
    doc.save();
    doc.translate(cx + dx, cy + 34).rotate(rot);
    doc.rect(-7, 0, 14, 34).fillColor(color).fill();
    doc
      .moveTo(-7, 34)
      .lineTo(0, 42)
      .lineTo(7, 34)
      .closePath()
      .fillColor("white")
      .fill();
    doc.restore();
  });

  // disque extérieur "dents de médaille"
  const outerR = 30;
  const n = 16;
  doc.save();
  doc.moveTo(cx + outerR, cy);
  for (let i = 1; i <= n * 2; i += 1) {
    const ang = (Math.PI * i) / n;
    const rr = i % 2 === 0 ? outerR : outerR - 4;
    doc.lineTo(cx + rr * Math.cos(ang), cy + rr * Math.sin(ang));
  }
  doc.closePath().fillColor(ACCENT).fill();
  doc.restore();

  // disque intérieur + anneau
  doc.circle(cx, cy, 22).fillColor(PRIMARY).fill();
  doc.circle(cx, cy, 18).lineWidth(1.1).strokeColor("white").stroke();

  // check
  doc.lineWidth(2.6).strokeColor("white");
  doc.moveTo(cx - 8, cy + 1).lineTo(cx - 2, cy + 7).stroke();
  doc.moveTo(cx - 2, cy + 7).lineTo(cx + 10, cy - 8).stroke();
  doc.restore();
}

function chip(doc, x, y, text) {
  const w = doc.widthOfString(text, { font: "Helvetica-Bold", size: 8.6 }) + 26;
  doc.roundedRect(x, y, w, 20, 10).fillColor(SECONDARY_LIGHT).fill();
  doc
    .font("Helvetica-Bold")
    .fontSize(8.6)
    .fillColor(SECONDARY)
    .text(text, x, y + 6, { width: w, align: "center" });
  return w;
}

export async function genererCertificatPdf({
  idStage,
  prenom,
  nom,
  nomEntreprise,
  intitulePoste,
  dateDebut,
  dateFin,
  codeVerification,
  dateEmission,
}) {
  ensureDir(UPLOAD_ROOT);
  const filename = `${idStage}.pdf`;
  const filepath = path.join(UPLOAD_ROOT, filename);

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  doc.pipe(fs.createWriteStream(filepath));

  const W = doc.page.width;
  const H = doc.page.height;
  const margin = 26;

  // Fond + bandeau léger en haut
  doc.rect(0, 0, W, H).fillColor("#FFFFFF").fill();
  doc.rect(0, 0, W, 150).fillColor(PAPER_TINT).fill();

  // Cadre extérieur + intérieur
  doc
    .roundedRect(margin, margin, W - 2 * margin, H - 2 * margin, 10)
    .lineWidth(1.6)
    .strokeColor(PRIMARY)
    .stroke();
  doc
    .roundedRect(margin + 8, margin + 8, W - 2 * margin - 16, H - 2 * margin - 16, 6)
    .lineWidth(0.7)
    .strokeColor(GREY_LIGHT)
    .stroke();

  // Ornements d'angle
  const o = 46;
  cornerOrnament(doc, margin + 22, margin + 22, o, 1, 1, SECONDARY);
  cornerOrnament(doc, W - margin - 22, margin + 22, o, -1, 1, PRIMARY);
  cornerOrnament(doc, margin + 22, H - margin - 22, o, 1, -1, PRIMARY);
  cornerOrnament(doc, W - margin - 22, H - margin - 22, o, -1, -1, SECONDARY);

  // En-tête
  drawWordmark(doc, W / 2 - 78, 68);
  doc
    .font("Helvetica-Bold")
    .fontSize(11.5)
    .fillColor(SECONDARY)
    .text("C E R T I F I C A T   D E   F I N   D E   S T A G E", 0, 98, {
      width: W,
      align: "center",
    });

  const ySep = 118;
  doc.lineWidth(0.8).strokeColor(GREY_LIGHT);
  doc.moveTo(W / 2 - 170, ySep).lineTo(W / 2 - 14, ySep).stroke();
  doc.moveTo(W / 2 + 14, ySep).lineTo(W / 2 + 170, ySep).stroke();
  doc.save();
  doc.translate(W / 2, ySep).rotate(45);
  doc.rect(-4, -4, 8, 8).fillColor(ACCENT).fill();
  doc.restore();

  // Corps
  doc
    .font("Helvetica-Oblique")
    .fontSize(12.5)
    .fillColor(GREY)
    .text("Ce certificat est décerné à", 0, 150, { width: W, align: "center" });

  const fullName = `${prenom} ${nom}`;
  doc
    .font("Helvetica-Bold")
    .fontSize(34)
    .fillColor(INK)
    .text(fullName, 0, 180, { width: W, align: "center" });

  const nameWidth = doc.widthOfString(fullName, { font: "Helvetica-Bold", size: 34 });
  const nameY = 224;
  doc.lineWidth(2);
  doc
    .strokeColor(PRIMARY)
    .moveTo(W / 2 - nameWidth / 2, nameY)
    .lineTo(W / 2, nameY)
    .stroke();
  doc
    .strokeColor(SECONDARY)
    .moveTo(W / 2, nameY)
    .lineTo(W / 2 + nameWidth / 2, nameY)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(12.5)
    .fillColor(BODY)
    .text(
      `a complété avec succès son stage au poste de « ${intitulePoste} »`,
      0,
      248,
      { width: W, align: "center" },
    )
    .text(`au sein de ${nomEntreprise}, du ${dateDebut} au ${dateFin}.`, 0, 266, {
      width: W,
      align: "center",
    });

  // Chips
  const chipTexts = ["Stage validé", "Évaluation complétée", "Badge InternIn débloqué"];
  const widths = chipTexts.map((t) =>
    doc.widthOfString(t, { font: "Helvetica-Bold", size: 8.6 }) + 26,
  );
  const totalW = widths.reduce((a, b) => a + b, 0) + 10 * (widths.length - 1);
  let cx = W / 2 - totalW / 2;
  const chipY = 300;
  chipTexts.forEach((t, i) => {
    const w = chip(doc, cx, chipY, t);
    cx += w + 10;
  });

  // Zone signature / date / sceau
  const baseY = H - margin - 100;
  const lineW = 175;

  const lx = margin + 130;
  doc.lineWidth(0.9).strokeColor(GREY_LIGHT);
  doc.moveTo(lx, baseY).lineTo(lx + lineW, baseY).stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(INK)
    .text(dateEmission || dateFin, lx, baseY - 20, { width: lineW, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(GREY)
    .text("Date de délivrance", lx, baseY + 6, { width: lineW, align: "center" });

  const rx = W - margin - 100 - lineW;
  doc.moveTo(rx, baseY).lineTo(rx + lineW, baseY).stroke();
  doc
    .font("Helvetica-Oblique")
    .fontSize(15)
    .fillColor(SECONDARY)
    .text("InternIn", rx, baseY - 22, { width: lineW, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(GREY)
    .text("Signature autorisée", rx, baseY + 6, { width: lineW, align: "center" });

  seal(doc, W / 2, baseY - 22);

  // Pied de page : QR Code local + code de vérification (sans URL complète)
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const verificationUrl = `${frontendUrl}/verification/certificat/${codeVerification}`;

  // QR en bas à gauche, hors signatures / sceau / ornements
  const qrSize = 58;
  const qrX = margin + 40;
  const qrY = H - margin - 86;

  try {
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      type: "png",
      width: 180,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#111827", light: "#FFFFFF" },
    });
    // Fond blanc (quiet zone) pour scannabilité
    doc
      .roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4)
      .fillColor("#FFFFFF")
      .fill();
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc
      .font("Helvetica")
      .fontSize(7.2)
      .fillColor(GREY)
      .text("Scannez pour vérifier", qrX - 4, qrY + qrSize + 6, {
        width: qrSize + 8,
        align: "center",
      });
    doc
      .font("Helvetica")
      .fontSize(7.2)
      .fillColor(GREY)
      .text("l'authenticité", qrX - 4, qrY + qrSize + 15, {
        width: qrSize + 8,
        align: "center",
      });
  } catch (err) {
    // Ne pas bloquer la génération du certificat : le code texte reste affiché
    console.error(
      "[certificatPdf] Échec génération QR Code:",
      err?.message || err,
    );
  }

  // Code de vérification centré en bas (sans URL)
  doc
    .font("Helvetica")
    .fontSize(8.3)
    .fillColor(GREY)
    .text(`Code de vérification : ${codeVerification}`, 0, H - margin - 18, {
      width: W,
      align: "center",
    });

  doc.end();

  return `certificats/${filename}`;
}
