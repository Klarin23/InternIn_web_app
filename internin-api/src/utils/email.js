import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM || "InternIn <onboarding@resend.dev>";

async function sendMail({ to, subject, text, html }) {
  if (!resend) {
    console.warn(
      "⚠️ RESEND_API_KEY absente — e-mail non envoyé:",
      subject,
      "→",
      to,
    );
    return;
  }

  await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationEmail({ email, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationUrl = `${frontendUrl}/verification-email?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: email,
    subject: "Vérifiez votre adresse e-mail — InternIn",
    text: `Bienvenue sur InternIn !\n\nConfirmez votre e-mail :\n${verificationUrl}\n\nLien valable 24 h.`,
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
        <p style="color:#666;font-size:13px;">Ce lien est valable 24 heures.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({ email, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  await sendMail({
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
