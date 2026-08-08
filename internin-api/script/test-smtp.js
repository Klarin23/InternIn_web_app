// Script de test SMTP — vérifie la connexion et envoie un email de test
// Usage : node scripts/test-smtp.js ton-email-destination@example.com

import "dotenv/config";
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM || smtpUser;

const destinataire = process.argv[2];

console.log("=== Configuration SMTP détectée ===");
console.log("HOST:", smtpHost);
console.log("PORT:", smtpPort);
console.log("USER:", smtpUser);
console.log("SECURE (TLS direct):", smtpPort === 465);
console.log("FROM:", from);
console.log("");

if (!smtpHost || !smtpUser || !smtpPass) {
  console.error(
    "❌ Variables SMTP manquantes dans .env (SMTP_HOST, SMTP_USER, SMTP_PASS)",
  );
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

try {
  console.log("→ Vérification de la connexion SMTP...");
  await transporter.verify();
  console.log(
    "✅ Connexion SMTP réussie ! Le serveur accepte les identifiants.\n",
  );
} catch (err) {
  console.error("❌ Échec de la connexion SMTP :");
  console.error(err.message);
  process.exit(1);
}

if (destinataire) {
  try {
    console.log(`→ Envoi d'un email de test à ${destinataire}...`);
    const info = await transporter.sendMail({
      from: `"InternIn (test)" <${from}>`,
      to: destinataire,
      subject: "Test SMTP InternIn",
      text: "Ceci est un email de test pour vérifier la configuration SMTP.",
      html: "<p>Ceci est un email de test pour vérifier la configuration SMTP.</p>",
    });
    console.log("✅ Email envoyé ! messageId:", info.messageId);
  } catch (err) {
    console.error("❌ Échec de l'envoi de l'email :");
    console.error(err.message);
    process.exit(1);
  }
} else {
  console.log("ℹ️  Aucun destinataire fourni — connexion vérifiée seulement.");
  console.log(
    "   Pour envoyer un vrai email de test : node scripts/test-smtp.js ton-email@example.com",
  );
}
