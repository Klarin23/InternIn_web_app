import { Resend } from "resend";
import { db } from "../db/index.js";
import { parametresPlateforme } from "../db/schema.js";
import { redactSensitiveText, redactSensitiveUrl } from "./redactUrl.js";
import { escapeHtml, stripControlChars } from "./htmlEscape.js";

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
    console.log("📄 Contenu (non envoyé):\n", redactSensitiveText(text));
    console.log("────────────────────────────────────────");
    return { skipped: true, reason: "notifications_email_disabled" };
  }

  // En local sans Resend (ou si l'envoi échoue) → afficher dans le terminal
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY absente — e-mail non envoyé");
    console.log("────────────────────────────────────────");
    console.log("📧 À      :", to);
    console.log("📌 Sujet  :", subject);
    console.log("📄 Contenu:\n", redactSensitiveText(text));
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
    console.log("📧 Lien de secours (terminal):\n", redactSensitiveText(text));
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
    console.log("✅ LIEN DE VÉRIFICATION (dev, token masqué) :");
    console.log(redactSensitiveUrl(verificationUrl));
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
    console.log("🔑 LIEN RESET MDP (dev, token masqué) :");
    console.log(redactSensitiveUrl(resetUrl));
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
  token,
}) {
  // L'URL d'invitation est construite ici, côté serveur, à partir d'un
  // token cryptographiquement aléatoire (crypto.randomBytes, généré dans
  // equipe.service.js) — jamais à partir d'une valeur fournie par
  // l'entreprise. Même construction que sendVerificationEmail /
  // sendPasswordResetEmail ci-dessus : aucune donnée non fiable ne peut
  // devenir une URL arbitraire.
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const invitationUrl = `${frontendUrl}/invitation/${encodeURIComponent(token)}`;

  const roleLabel = roleEquipe || "membre";

  // Sujet : pas un contexte HTML (pas besoin d'échappement HTML ici), mais
  // on neutralise les caractères de contrôle (retour à la ligne, etc.) par
  // précaution — uniquement pour le rendu du sujet, la donnée en base
  // (entreprise.nomEntreprise) n'est jamais modifiée.
  const nomEntrepriseSujet = stripControlChars(nomEntreprise) || "une équipe";

  // Contexte HTML : nomEntreprise (texte libre saisi par l'entreprise à
  // l'onboarding) et roleLabel sont échappés avant insertion dans le
  // template. La version texte brut ci-dessous n'est pas interprétée comme
  // du HTML et n'a donc pas besoin de cet échappement — elle garde les
  // valeurs telles quelles, exactement comme avant.
  const nomEntrepriseHtml = escapeHtml(nomEntreprise || "une entreprise");
  const roleLabelHtml = escapeHtml(roleLabel);

  return sendMail({
    to: email,
    subject: `Invitation à rejoindre ${nomEntrepriseSujet} — InternIn`,
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
          <strong>${nomEntrepriseHtml}</strong>
          sur InternIn en tant que <strong>${roleLabelHtml}</strong>.
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


export async function sendUniversiteStudentInvitationEmail({
  email,
  nomUniversite,
  token,
  dateExpiration,
}) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const invitationUrl = `${frontendUrl}/rejoindre/universite/${encodeURIComponent(token)}`;
  const universiteHtml = escapeHtml(nomUniversite || "votre établissement");
  const expiration = dateExpiration
    ? new Date(dateExpiration).toLocaleString("fr-FR")
    : "dans 48 heures";

  return sendMail({
    to: email,
    subject: `Invitation à rejoindre ${stripControlChars(nomUniversite || "votre établissement")} — InternIn`,
    text: `Votre établissement ${nomUniversite || "vous"} vous invite à rejoindre son espace étudiant sur InternIn.

Ouvrez ce lien pour consulter et accepter l'invitation :
${invitationUrl}

Cette invitation est personnelle, à usage unique et expire ${expiration}.
Si vous n'êtes pas concerné(e), ignorez cet e-mail.

L'équipe InternIn`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;color:#111827;">
        <h1>Invitation universitaire</h1>
        <p>
          <strong>${universiteHtml}</strong> vous invite à rejoindre son
          établissement sur InternIn.
        </p>
        <p style="margin:24px 0;">
          <a href="${invitationUrl}"
             style="background:#14B8A6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Consulter l'invitation
          </a>
        </p>
        <p style="color:#667085;font-size:13px;">
          Invitation personnelle, à usage unique. Elle expire ${escapeHtml(expiration)}.
        </p>
      </div>
    `,
  });
}
