import crypto from "crypto";
import { eq, and } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
  utilisateurs,
  verificationsEmail,
  sessionsUtilisateur,
} from "../../db/schema.js";

import { hashPassword, comparePassword } from "../../utils/password.js";

import {
  signToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "../../utils/jwt.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../utils/email.js";

const VERIFICATION_TOKEN_DURATION_MS = 24 * 60 * 60 * 1000;
const RESET_PASSWORD_TOKEN_DURATION_MS = 60 * 60 * 1000;

/**
 * Génère un token cryptographiquement sécurisé.
 *
 * Le token brut est envoyé par e-mail.
 * Seul son hash est enregistré en base.
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashVerificationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Crée une demande de vérification d'e-mail
 * et envoie le lien à l'utilisateur.
 */
async function createEmailVerification(idUtilisateur, email) {
  // Invalider les anciens tokens encore en attente.
  await db
    .update(verificationsEmail)
    .set({
      statut: "expire",
    })
    .where(
      and(
        eq(verificationsEmail.idUtilisateur, idUtilisateur),
        eq(verificationsEmail.type, "verification_email"),
        eq(verificationsEmail.statut, "en_attente"),
      ),
    );

  const rawToken = generateVerificationToken();

  const hashedToken = hashVerificationToken(rawToken);

  const dateExpiration = new Date(Date.now() + VERIFICATION_TOKEN_DURATION_MS);

  await db.insert(verificationsEmail).values({
    idUtilisateur,
    type: "verification_email",
    codeJeton: hashedToken,
    statut: "en_attente",
    dateExpiration,
  });

  await sendVerificationEmail({
    email,
    token: rawToken,
  });
}

/**
 * Inscription d'un nouvel utilisateur.
 */
/**
 * Inscription d'un nouvel utilisateur.
 */

/** Normalise une adresse e-mail avant comparaison / stockage. */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function registerUser({ email, password, typeUtilisateur }, req) {
  email = normalizeEmail(email);
  const existing = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, email));

  if (existing.length > 0) {
    const err = new Error("Un compte existe déjà avec cette adresse e-mail");
    err.status = 409;
    throw err;
  }

  const motDePasseHash = await hashPassword(password);

    const skipEmail =
      process.env.SKIP_EMAIL_VERIFICATION === "true" ||
      process.env.NODE_ENV === "development";

    const [nouvelUtilisateur] = await db
      .insert(utilisateurs)
      .values({
        email,
        motDePasseHash,
        typeUtilisateur,
        methodeConnexion: "email",
        emailVerifie: skipEmail, // true en local, false en prod
      })
      .returning();

    if (!skipEmail) {
      try {
        await createEmailVerification(
          nouvelUtilisateur.idUtilisateur,
          nouvelUtilisateur.email,
        );
      } catch (emailError) {
        console.error(
          "Erreur lors de l'envoi de l'e-mail de vérification :",
          emailError,
        );
      }
    } else {
      console.log(
        "✅ [DEV] E-mail auto-vérifié (SKIP_EMAIL_VERIFICATION / development) →",
        email,
      );
    }

  const token = signToken({
    idUtilisateur: nouvelUtilisateur.idUtilisateur,
    typeUtilisateur: nouvelUtilisateur.typeUtilisateur,
  });

  const refreshToken = await createSession(
    nouvelUtilisateur.idUtilisateur,
    req,
  );

  return {
    user: sanitizeUser(nouvelUtilisateur),
    token,
    refreshToken,
  };
}


/**
 * Vérifie réellement un token de confirmation d'e-mail.
 */
export async function verifyEmail(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    const err = new Error("Lien de vérification invalide");

    err.status = 400;
    throw err;
  }

  const hashedToken = hashVerificationToken(rawToken);

  const [verification] = await db
    .select()
    .from(verificationsEmail)
    .where(
      and(
        eq(verificationsEmail.codeJeton, hashedToken),
        eq(verificationsEmail.type, "verification_email"),
      ),
    );

  if (!verification) {
    const err = new Error("Lien de vérification invalide ou expiré");

    err.status = 400;
    throw err;
  }

  if (verification.statut !== "en_attente") {
    const err = new Error(
      "Ce lien de vérification a déjà été utilisé ou n'est plus valide",
    );

    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(verification.dateExpiration)) {
    await db
      .update(verificationsEmail)
      .set({
        statut: "expire",
      })
      .where(
        eq(verificationsEmail.idVerification, verification.idVerification),
      );

    const err = new Error("Ce lien de vérification a expiré");

    err.status = 400;
    throw err;
  }

  const [utilisateur] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, verification.idUtilisateur));

  if (!utilisateur) {
    const err = new Error("Utilisateur introuvable");

    err.status = 404;
    throw err;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(utilisateurs)
      .set({
        emailVerifie: true,
      })
      .where(eq(utilisateurs.idUtilisateur, utilisateur.idUtilisateur));

    await tx
      .update(verificationsEmail)
      .set({
        statut: "utilise",
      })
      .where(
        eq(verificationsEmail.idVerification, verification.idVerification),
      );
  });

  const [utilisateurMisAJour] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, utilisateur.idUtilisateur));

  return {
    user: sanitizeUser(utilisateurMisAJour),
  };
}

/**
 * Renvoie un nouveau lien de vérification
 * à l'utilisateur actuellement connecté.
 */
export async function resendEmailVerification(idUtilisateur) {
  const [utilisateur] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

  if (!utilisateur) {
    const err = new Error("Utilisateur introuvable");

    err.status = 404;
    throw err;
  }

  if (utilisateur.emailVerifie) {
    const err = new Error("Cette adresse e-mail est déjà vérifiée");

    err.status = 400;
    throw err;
  }

  await createEmailVerification(utilisateur.idUtilisateur, utilisateur.email);

  return {
    message: "Un nouvel e-mail de vérification a été envoyé",
  };
}

/**
 * Demande de réinitialisation de mot de passe.
 *
 * Ne révèle jamais si l'adresse e-mail existe ou non en base
 * (bonne pratique standard, cf. commentaire dans ForgotPasswordForm) :
 * on renvoie toujours le même message, que l'utilisateur soit trouvé ou non.
 */
export async function requestPasswordReset(email) {
  email = normalizeEmail(email);
  const [utilisateur] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, email));

  if (utilisateur) {
    // Invalider les anciennes demandes encore en attente.
    await db
      .update(verificationsEmail)
      .set({
        statut: "expire",
      })
      .where(
        and(
          eq(verificationsEmail.idUtilisateur, utilisateur.idUtilisateur),
          eq(verificationsEmail.type, "reinitialisation_mdp"),
          eq(verificationsEmail.statut, "en_attente"),
        ),
      );

    const rawToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(rawToken);

    const dateExpiration = new Date(
      Date.now() + RESET_PASSWORD_TOKEN_DURATION_MS,
    );

    await db.insert(verificationsEmail).values({
      idUtilisateur: utilisateur.idUtilisateur,
      type: "reinitialisation_mdp",
      codeJeton: hashedToken,
      statut: "en_attente",
      dateExpiration,
    });

    try {
      await sendPasswordResetEmail({
        email: utilisateur.email,
        token: rawToken,
      });
    } catch (emailError) {
      console.error(
        "Erreur lors de l'envoi de l'e-mail de réinitialisation :",
        emailError,
      );
    }
  }

  return {
    message:
      "Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé.",
  };
}

/**
 * Réinitialise réellement le mot de passe à partir du token reçu par e-mail.
 */
export async function resetPassword(rawToken, newPassword) {
  if (!rawToken || typeof rawToken !== "string") {
    const err = new Error("Lien de réinitialisation invalide");

    err.status = 400;
    throw err;
  }

  const hashedToken = hashVerificationToken(rawToken);

  const [verification] = await db
    .select()
    .from(verificationsEmail)
    .where(
      and(
        eq(verificationsEmail.codeJeton, hashedToken),
        eq(verificationsEmail.type, "reinitialisation_mdp"),
      ),
    );

  if (!verification) {
    const err = new Error("Lien de réinitialisation invalide ou expiré");

    err.status = 400;
    throw err;
  }

  if (verification.statut !== "en_attente") {
    const err = new Error(
      "Ce lien de réinitialisation a déjà été utilisé ou n'est plus valide",
    );

    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(verification.dateExpiration)) {
    await db
      .update(verificationsEmail)
      .set({
        statut: "expire",
      })
      .where(
        eq(verificationsEmail.idVerification, verification.idVerification),
      );

    const err = new Error("Ce lien de réinitialisation a expiré");

    err.status = 400;
    throw err;
  }

  const motDePasseHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(utilisateurs)
      .set({
        motDePasseHash,
      })
      .where(eq(utilisateurs.idUtilisateur, verification.idUtilisateur));

    await tx
      .update(verificationsEmail)
      .set({
        statut: "utilise",
      })
      .where(
        eq(verificationsEmail.idVerification, verification.idVerification),
      );

    // Invalider les autres demandes de réinitialisation encore en attente
    // pour cet utilisateur (un ancien lien ne doit plus fonctionner).
    await tx
      .update(verificationsEmail)
      .set({
        statut: "expire",
      })
      .where(
        and(
          eq(verificationsEmail.idUtilisateur, verification.idUtilisateur),
          eq(verificationsEmail.type, "reinitialisation_mdp"),
          eq(verificationsEmail.statut, "en_attente"),
        ),
      );
  });

  // Révoquer toutes les sessions existantes (sécurité)
  await revokeAllSessions(verification.idUtilisateur);

  return {
    message: "Votre mot de passe a été réinitialisé avec succès",
  };
}


/**
 * Crée une session (refresh token) en base.
 */
async function createSession(idUtilisateur, req) {
  const { raw, hashed } = generateRefreshToken();
  const dateExpiration = getRefreshTokenExpiry();

  await db.insert(sessionsUtilisateur).values({
    idUtilisateur,
    jeton: hashed,
    adresseIp: req?.ip || null,
    dateExpiration,
  });

  return raw; // on renvoie le token brut au client
}

/**
 * Login / Register : renvoie accessToken + refreshToken
 */
export async function loginUser({ email, password }, req) {
  email = normalizeEmail(email);
  const [utilisateur] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, email));

  if (!utilisateur || !utilisateur.motDePasseHash) {
    const err = new Error("Identifiants invalides");
    err.status = 401;
    throw err;
  }

  const motDePasseValide = await comparePassword(
    password,
    utilisateur.motDePasseHash,
  );

  if (!motDePasseValide) {
    const err = new Error("Identifiants invalides");
    err.status = 401;
    throw err;
  }

  if (utilisateur.statutCompte === "suspendu") {
    const err = new Error(
      "Ce compte a été suspendu. Contacter le support InternIn pour plus d'informations.",
    );
    err.status = 403;
    throw err;
  }

  await db
    .update(utilisateurs)
    .set({ derniereConnexion: new Date() })
    .where(eq(utilisateurs.idUtilisateur, utilisateur.idUtilisateur));

  const accessToken = signToken({
    idUtilisateur: utilisateur.idUtilisateur,
    typeUtilisateur: utilisateur.typeUtilisateur,
  });

  const refreshToken = await createSession(utilisateur.idUtilisateur, req);

  return {
    user: sanitizeUser(utilisateur),
    token: accessToken,
    refreshToken,
  };
}

/**
 * Rafraîchit l'access token à partir d'un refresh token valide.
 */
/**
 * Rafraîchit l'access token + rotation du refresh token.
 * L'ancien refresh token est immédiatement invalidé.
 */
export async function refreshAccessToken(rawRefreshToken, req) {
  if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
    const err = new Error("Refresh token manquant");
    err.status = 401;
    throw err;
  }

  const hashed = hashRefreshToken(rawRefreshToken);

  const [session] = await db
    .select()
    .from(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.jeton, hashed));

  if (!session) {
    const err = new Error("Session invalide ou expirée");
    err.status = 401;
    throw err;
  }

  if (new Date() > new Date(session.dateExpiration)) {
    await db
      .delete(sessionsUtilisateur)
      .where(eq(sessionsUtilisateur.idSession, session.idSession));

    const err = new Error("Session expirée");
    err.status = 401;
    throw err;
  }

  const [utilisateur] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, session.idUtilisateur));

  if (!utilisateur || utilisateur.statutCompte === "suspendu") {
    // On supprime la session même en cas de compte suspendu
    await db
      .delete(sessionsUtilisateur)
      .where(eq(sessionsUtilisateur.idSession, session.idSession));

    const err = new Error("Compte invalide ou suspendu");
    err.status = 403;
    throw err;
  }

  // === ROTATION ===
  // 1. Supprimer l'ancien refresh token
  await db
    .delete(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.idSession, session.idSession));

  // 2. Créer un nouveau refresh token
  const newRefreshToken = await createSession(utilisateur.idUtilisateur, req);

  // 3. Nouvel access token
  const accessToken = signToken({
    idUtilisateur: utilisateur.idUtilisateur,
    typeUtilisateur: utilisateur.typeUtilisateur,
  });

  return {
    token: accessToken,
    refreshToken: newRefreshToken,
    user: sanitizeUser(utilisateur),
  };
}

/**
 * Déconnexion : révoque le refresh token.
 */
export async function logoutUser(rawRefreshToken) {
  if (!rawRefreshToken) return { message: "Déconnecté" };

  const hashed = hashRefreshToken(rawRefreshToken);

  await db
    .delete(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.jeton, hashed));

  return { message: "Déconnecté avec succès" };
}

/**
 * Déconnexion de TOUTES les sessions d'un utilisateur
 * (utile après reset password ou suspension).
 */
export async function revokeAllSessions(idUtilisateur) {
  await db
    .delete(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.idUtilisateur, idUtilisateur));
}

/**
 * Connexion / inscription via Google (OAuth).
 */
export async function loginWithGoogle({ accessToken, idToken, typeUtilisateur }, req) {
  const profile = await fetchGoogleProfile({ accessToken, idToken });

  if (!profile.email) {
    const err = new Error("Impossible de récupérer l'e-mail Google");
    err.status = 400;
    throw err;
  }

  if (profile.emailVerified === false) {
    const err = new Error("L'adresse e-mail Google n'est pas vérifiée");
    err.status = 400;
    throw err;
  }

  const email = profile.email.toLowerCase().trim();

  const [existing] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, email));

  let utilisateur = existing;

  if (!utilisateur) {
    const rolesAutorises = ["stagiaire", "entreprise", "universite"];
    if (!typeUtilisateur || !rolesAutorises.includes(typeUtilisateur)) {
      const err = new Error(
        "Aucun compte associé à cet e-mail. Inscrivez-vous d'abord en choisissant un type de profil.",
      );
      err.status = 404;
      err.code = "GOOGLE_ACCOUNT_NOT_FOUND";
      throw err;
    }

    const [created] = await db
      .insert(utilisateurs)
      .values({
        email,
        motDePasseHash: null,
        typeUtilisateur,
        methodeConnexion: "google",
        emailVerifie: true,
        statutCompte: "inactif",
      })
      .returning();

    utilisateur = created;
  } else {
    if (utilisateur.statutCompte === "suspendu") {
      const err = new Error(
        "Ce compte a été suspendu. Contacter le support InternIn pour plus d'informations.",
      );
      err.status = 403;
      throw err;
    }

    const patch = { derniereConnexion: new Date() };
    if (!utilisateur.emailVerifie) patch.emailVerifie = true;

    const [updated] = await db
      .update(utilisateurs)
      .set({ ...patch, dateMaj: new Date() })
      .where(eq(utilisateurs.idUtilisateur, utilisateur.idUtilisateur))
      .returning();
    utilisateur = updated;
  }

  const accessJwt = signToken({
    idUtilisateur: utilisateur.idUtilisateur,
    typeUtilisateur: utilisateur.typeUtilisateur,
  });

  const refreshToken = await createSession(utilisateur.idUtilisateur, req);

  return {
    user: sanitizeUser(utilisateur),
    token: accessJwt,
    refreshToken,
    isNewUser: !existing,
  };
}

async function fetchGoogleProfile({ accessToken, idToken }) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (idToken) {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = new Error("Jeton Google invalide ou expiré");
      err.status = 401;
      throw err;
    }
    const data = await res.json();
    if (clientId && data.aud !== clientId) {
      const err = new Error("Jeton Google non reconnu (client_id)");
      err.status = 401;
      throw err;
    }
    return {
      email: data.email,
      emailVerified:
        data.email_verified === true || data.email_verified === "true",
      name: data.name,
      picture: data.picture,
      sub: data.sub,
    };
  }

  if (accessToken) {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = new Error("Jeton Google invalide ou expiré");
      err.status = 401;
      throw err;
    }
    const data = await res.json();
    return {
      email: data.email,
      emailVerified: data.email_verified === true,
      name: data.name,
      picture: data.picture,
      sub: data.sub,
    };
  }

  const err = new Error("Jeton Google manquant");
  err.status = 400;
  throw err;
}

/**
 * Ne jamais renvoyer le hash du mot de passe au client.
 */
function sanitizeUser(utilisateur) {
  const { motDePasseHash, ...safe } = utilisateur;

  return safe;
}
