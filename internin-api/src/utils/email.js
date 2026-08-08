import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    "⚠️ Configuration SMTP absente. Les e-mails InternIn ne pourront pas être envoyés.",
  );
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

export async function sendVerificationEmail({ email, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const verificationUrl = `${frontendUrl}/verification-email?token=${encodeURIComponent(token)}`;

  const from = process.env.EMAIL_FROM || smtpUser;

  await transporter.sendMail({
    from: `"InternIn" <${from}>`,
    to: email,
    subject: "Vérifiez votre adresse e-mail — InternIn",

    text: `
Bienvenue sur InternIn !

Merci d'avoir créé votre compte.

Pour confirmer votre adresse e-mail, cliquez sur le lien suivant :

${verificationUrl}

Ce lien est valable pendant 24 heures.

Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail.

L'équipe InternIn
    `.trim(),

    html: `
      <div style="
        font-family: Arial, sans-serif;
        background: #f5f7fb;
        padding: 40px 20px;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          border: 1px solid #e5e7eb;
        ">

          <h1 style="
            margin: 0 0 20px;
            color: #111827;
            font-size: 28px;
          ">
            Bienvenue sur InternIn 👋
          </h1>

          <p style="
            color: #4b5563;
            font-size: 16px;
            line-height: 1.6;
          ">
            Merci d'avoir créé votre compte InternIn.
            Pour commencer à utiliser votre compte,
            veuillez confirmer votre adresse e-mail.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                background: #111827;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Vérifier mon adresse e-mail
            </a>
          </div>

          <p style="
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
          ">
            Ce lien est valable pendant 24 heures.
          </p>

          <p style="
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
          ">
            Si vous n'êtes pas à l'origine de cette inscription,
            vous pouvez simplement ignorer cet e-mail.
          </p>

          <hr style="
            border: 0;
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
          ">

          <p style="
            color: #9ca3af;
            font-size: 12px;
            text-align: center;
          ">
            © InternIn — Plateforme de gestion des stages
          </p>

        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({ email, token }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  const from = process.env.EMAIL_FROM || smtpUser;

  await transporter.sendMail({
    from: `"InternIn" <${from}>`,
    to: email,
    subject: "Réinitialisation de votre mot de passe — InternIn",

    text: `
  Vous avez demandé la réinitialisation de votre mot de passe InternIn.

  Cliquez sur le lien suivant pour choisir un nouveau mot de passe :

  ${resetUrl}

  Ce lien est valable pendant 1 heure.

  Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail : votre mot de passe restera inchangé.

  L'équipe InternIn
      `.trim(),

      html: `
        <div style="
          font-family: Arial, sans-serif;
          background: #f5f7fb;
          padding: 40px 20px;
        ">
          <div style="
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          border: 1px solid #e5e7eb;
        ">

          <h1 style="
            margin: 0 0 20px;
            color: #111827;
            font-size: 28px;
          ">
            Réinitialisation du mot de passe 🔐
          </h1>

          <p style="
            color: #4b5563;
            font-size: 16px;
            line-height: 1.6;
          ">
            Vous avez demandé la réinitialisation de votre mot de passe
            InternIn. Cliquez sur le bouton ci-dessous pour en choisir un
            nouveau.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                background: #111827;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Réinitialiser mon mot de passe
            </a>
          </div>

          <p style="
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
          ">
            Ce lien est valable pendant 1 heure.
          </p>

          <p style="
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
          ">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez
            simplement ignorer cet e-mail : votre mot de passe restera
            inchangé.
          </p>

          <hr style="
            border: 0;
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
          ">

          <p style="
            color: #9ca3af;
            font-size: 12px;
            text-align: center;
          ">
            © InternIn — Plateforme de gestion des stages
          </p>

        </div>
      </div>
    `,
  });
}

/**
 * E-mail d'invitation à rejoindre l'équipe d'une entreprise
 * (superviseur, RH, etc.)
 */
export async function sendInvitationEmail({
  email,
  nom,
  token,
  nomEntreprise,
  roleEquipe,
  dateExpiration,
}) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const invitationUrl = `${frontendUrl}/invitation/${encodeURIComponent(token)}`;
  const from = process.env.EMAIL_FROM || smtpUser;

  const roleLabel =
    roleEquipe === "superviseur"
      ? "Superviseur"
      : roleEquipe === "administrateur_principal"
        ? "Administrateur"
        : roleEquipe || "Membre";

  const expirationText = dateExpiration
    ? new Date(dateExpiration).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  await transporter.sendMail({
    from: `"InternIn" <${from}>`,
    to: email,
    subject: `Invitation à rejoindre ${nomEntreprise || "une entreprise"} sur InternIn`,

    text: `
Bonjour ${nom || ""},

Vous êtes invité(e) à rejoindre l'équipe de ${nomEntreprise || "l'entreprise"} sur InternIn
en tant que ${roleLabel}.

Pour accepter l'invitation et créer votre compte, cliquez sur le lien suivant :

${invitationUrl}

${expirationText ? `Ce lien est valable jusqu'au ${expirationText}.` : ""}

Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail.

L'équipe InternIn
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; background: #f5f7fb; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb;">
          <h1 style="margin: 0 0 20px; color: #111827; font-size: 24px;">
            Invitation à rejoindre une équipe
          </h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Bonjour <strong>${nom || ""}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Vous êtes invité(e) à rejoindre l'équipe de
            <strong>${nomEntreprise || "l'entreprise"}</strong> sur InternIn
            en tant que <strong>${roleLabel}</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationUrl}"
               style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accepter l'invitation
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            Ou copiez ce lien dans votre navigateur :<br/>
            <a href="${invitationUrl}" style="color: #4f46e5; word-break: break-all;">${invitationUrl}</a>
          </p>
          ${
            expirationText
              ? `<p style="color: #9ca3af; font-size: 13px;">Ce lien est valable jusqu'au ${expirationText}.</p>`
              : ""
          }
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Si vous n'attendiez pas cette invitation, ignorez cet e-mail.
          </p>
        </div>
      </div>
    `.trim(),
  });
}