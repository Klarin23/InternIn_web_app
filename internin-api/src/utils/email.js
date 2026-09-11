import { Resend } from "resend";
import { db } from "../db/index.js";
import { parametresPlateforme } from "../db/schema.js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM || "InternIn <onboarding@resend.dev>";

/** Cache court pour éviter une requête DB à chaque e-mail */
let emailPrefCache = { at: 0, enabled: true };
const EMAIL_PREF_TTL_MS = 15_000;

/**
 * Lit le paramètre admin notificationsEmail (défaut: true).
 * En cas d'erreur DB, on laisse passer l'envoi pour ne pas bloquer auth/invitations.
 */
async function areTransactionalEmailsEnabled() {
  const now = Date.now();
  if (now - emailPrefCache.at < EMAIL_PREF_TTL_MS) {
    return emailPrefCache.enabled;
  }
  try {
    const [row] = await db
      .select({ enabled: parametresPlateforme.notificationsEmail })
      .from(parametresPlateforme)
      .limit(1);
    const enabled = row?.enabled !== false;
    emailPrefCache = { at: now, enabled };
    return enabled;
  } catch {
    emailPrefCache = { at: now, enabled: true };
    return true;
  }
}

/** Invalide le cache (appelable après PATCH paramètres admin). */
export function invalidateEmailPreferenceCache() {
  emailPrefCache = { at: 0, enabled: true };
}

async function sendMail({ to, subject, text, html }) {
  const allowed = await areTransactionalEmailsEnabled();
  if (!allowed) {
    console.warn(
      "📧 E-mails transactionnels désactivés (paramètre admin notificationsEmail=false) — envoi ignoré",
    );
    console.log("────────────────────────────────────────");
    console.log("📧 À      :", to);
    console.log("📌 Sujet  :", subject);
    console.log("📄 Contenu (non envoyé):\n", text);
    console.log("────────────────────────────────────────");
    return { skipped: true, reason: "notifications_email_disabled" };
  }

  // En local sans Resend (ou si l'envoi échoue) → afficher dans le terminal
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY absente — e-mail non envoyé");
    console.log("────────────────────────────────────────");
    console.log("📧 À      :", to);
    console.log("📌 Sujet  :", subject);
    console.log("📄 Contenu:\n", text);
    console.log("────────────────────────────────────────");
    return { skipped: true, reason: "no_resend_key" };
  }

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("❌ Erreur Resend:", err.message || err);
    console.log("────────────────────────────────────────");
    console.log("📧 Lien de secours (terminal):\n", text);
    console.log("────────────────────────────────────────");
    return { skipped: true, reason: "resend_error" };
  }
}

export async function sendVerificationEmail({ email, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationUrl = `${frontendUrl}/verification-email?token=${encodeURIComponent(token)}`;

  // Toujours logguer le lien en développement pour faciliter les tests locaux
  if (process.env.NODE_ENV !== "production") {
    console.log("────────────────────────────────────────");
    console.log("✅ LIEN DE VÉRIFICATION (dev) :");
    console.log(verificationUrl);
    console.log("────────────────────────────────────────");
  }

  return sendMail({
    to: email,
    subject: "Vérifiez votre adresse e-mail — InternIn",
    text: `Bienvenue sur InternIn !\n\nConfirmez votre e-mail :\n${verificationUrl}\n\nLien valable 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Bienvenue sur InternIn</h1>
        <p>Cliquez sur le bouton pour confirmer votre adresse e-mail.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}"
             style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Vérifier mon e-mail
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Ce lien est valable 5 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({ email, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV !== "production") {
    console.log("────────────────────────────────────────");
    console.log("🔑 LIEN RESET MDP (dev) :");
    console.log(resetUrl);
    console.log("────────────────────────────────────────");
  }

  return sendMail({
    to: email,
    subject: "Réinitialisation du mot de passe — InternIn",
    text: `Réinitialisez votre mot de passe :\n${resetUrl}\n\nLien valable 1 heure.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Réinitialisation du mot de passe</h1>
        <p>Cliquez sur le bouton pour choisir un nouveau mot de passe.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Ce lien est valable 1 heure.</p>
      </div>
    `,
  });
}

export async function sendInvitationEmail({
  email,
  nomEntreprise,
  roleEquipe,
  invitationUrl,
}) {
  const roleLabel = roleEquipe || "membre";

  return sendMail({
    to: email,
    subject: `Invitation à rejoindre ${nomEntreprise || "une équipe"} — InternIn`,
    text: `
Vous êtes invité(e) à rejoindre ${nomEntreprise || "une entreprise"} sur InternIn
en tant que ${roleLabel}.

Acceptez l'invitation en cliquant sur ce lien :
${invitationUrl}

Si vous n'êtes pas à l'origine de cette invitation, ignorez cet e-mail.

L'équipe InternIn
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Invitation à rejoindre une équipe</h1>
        <p>
          Vous êtes invité(e) à rejoindre
          <strong>${nomEntreprise || "une entreprise"}</strong>
          sur InternIn en tant que <strong>${roleLabel}</strong>.
        </p>
        <p style="margin: 24px 0;">
          <a href="${invitationUrl}"
             style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Accepter l'invitation
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          Si vous n'êtes pas à l'origine de cette invitation, ignorez cet e-mail.
        </p>
      </div>
    `,
  });
}
