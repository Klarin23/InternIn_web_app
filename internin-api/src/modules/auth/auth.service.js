import crypto from "crypto";
import { eq, and, gt, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
  utilisateurs,
  verificationsEmail,
  sessionsUtilisateur,
  tentativesConnexion,
} from "../../db/schema.js";

import { hashPassword, comparePassword } from "../../utils/password.js";

import {
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "../../utils/jwt.js";
import { signAccessToken, incrementerVersionJeton } from "../../utils/versionJeton.js";
import { resolveGeoFromIp } from "../../utils/geoIp.js";
import {
   sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../utils/email.js";

import {
  assertLoginAllowed,
  recordLoginFailure,
  clearLoginAccountLimit,
} from "./loginRateLimit.service.js";
 

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

  const token = signAccessToken(nouvelUtilisateur);

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

  // La consommation du token et la validation du compte doivent être une
  // seule opération transactionnelle. Le UPDATE conditionnel joue le rôle
  // de "claim" atomique : une seule requête concurrente peut obtenir la ligne.
  const utilisateurMisAJour = await db.transaction(async (tx) => {
    const maintenant = new Date();

    const [verification] = await tx
      .update(verificationsEmail)
      .set({
        statut: "utilise",
      })
      .where(
        and(
          eq(verificationsEmail.codeJeton, hashedToken),
          eq(verificationsEmail.type, "verification_email"),
          eq(verificationsEmail.statut, "en_attente"),
          gt(verificationsEmail.dateExpiration, maintenant),
        ),
      )
      .returning();

    if (!verification) {
      const [tokenExistant] = await tx
        .select({
          idVerification: verificationsEmail.idVerification,
          statut: verificationsEmail.statut,
          dateExpiration: verificationsEmail.dateExpiration,
        })
        .from(verificationsEmail)
        .where(
          and(
            eq(verificationsEmail.codeJeton, hashedToken),
            eq(verificationsEmail.type, "verification_email"),
          ),
        )
        .limit(1);

      if (!tokenExistant) {
        const err = new Error("Lien de vérification invalide ou expiré");
        err.status = 400;
        throw err;
      }

      if (
        tokenExistant.statut === "en_attente" &&
        new Date(tokenExistant.dateExpiration) <= maintenant
      ) {
        await tx
          .update(verificationsEmail)
          .set({ statut: "expire" })
          .where(eq(verificationsEmail.idVerification, tokenExistant.idVerification));

        const err = new Error("Ce lien de vérification a expiré");
        err.status = 400;
        throw err;
      }

      const err = new Error(
        "Ce lien de vérification a déjà été utilisé ou n'est plus valide",
      );
      err.status = 400;
      throw err;
    }

    const [utilisateur] = await tx
      .select()
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, verification.idUtilisateur));

    if (!utilisateur) {
      // Le rollback remet automatiquement le token à "en_attente".
      const err = new Error("Utilisateur introuvable");
      err.status = 404;
      throw err;
    }

    const [userUpdated] = await tx
      .update(utilisateurs)
      .set({
        emailVerifie: true,
      })
      .where(eq(utilisateurs.idUtilisateur, utilisateur.idUtilisateur))
      .returning();

    if (!userUpdated) {
      // Le rollback remet également le token à "en_attente".
      const err = new Error("Impossible de vérifier l'adresse e-mail");
      err.status = 500;
      throw err;
    }

    return userUpdated;
  });

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
  // Hash hors transaction (coûteux) — la consommation atomique du token
  // reste le point critique contre les courses.
  const motDePasseHash = await hashPassword(newPassword);

  // Consommation atomique du token (anti race / TOCTOU) :
  // UPDATE ... WHERE statut = 'en_attente' AND non expiré RETURNING
  // Une seule requête concurrente peut obtenir rowsAffected = 1.
  let idUtilisateur = null;

  await db.transaction(async (tx) => {
    const now = new Date();
    const [consumed] = await tx
      .update(verificationsEmail)
      .set({
        statut: "utilise",
      })
      .where(
        and(
          eq(verificationsEmail.codeJeton, hashedToken),
          eq(verificationsEmail.type, "reinitialisation_mdp"),
          eq(verificationsEmail.statut, "en_attente"),
          gt(verificationsEmail.dateExpiration, now),
        ),
      )
      .returning({
        idVerification: verificationsEmail.idVerification,
        idUtilisateur: verificationsEmail.idUtilisateur,
      });

    if (!consumed) {
      // Distinguer expiré / déjà utilisé / inconnu sans fuite d'info utile
      // pour un attaquant : message générique cohérent avec l'API existante.
      const [existing] = await tx
        .select({
          statut: verificationsEmail.statut,
          dateExpiration: verificationsEmail.dateExpiration,
        })
        .from(verificationsEmail)
        .where(
          and(
            eq(verificationsEmail.codeJeton, hashedToken),
            eq(verificationsEmail.type, "reinitialisation_mdp"),
          ),
        )
        .limit(1);

      if (existing && existing.statut === "en_attente") {
        // encore en_attente mais expiration dépassée — marquer expiré
        await tx
          .update(verificationsEmail)
          .set({ statut: "expire" })
          .where(
            and(
              eq(verificationsEmail.codeJeton, hashedToken),
              eq(verificationsEmail.type, "reinitialisation_mdp"),
              eq(verificationsEmail.statut, "en_attente"),
            ),
          );
        const err = new Error("Ce lien de réinitialisation a expiré");
        err.status = 400;
        throw err;
      }

      if (existing && existing.statut !== "en_attente") {
        const err = new Error(
          "Ce lien de réinitialisation a déjà été utilisé ou n'est plus valide",
        );
        err.status = 400;
        throw err;
      }

      const err = new Error("Lien de réinitialisation invalide ou expiré");
      err.status = 400;
      throw err;
    }

    idUtilisateur = consumed.idUtilisateur;

    await tx
      .update(utilisateurs)
      .set({
        motDePasseHash,
      })
      .where(eq(utilisateurs.idUtilisateur, consumed.idUtilisateur));

    // Révoque immédiatement tous les access JWT en cours
    await incrementerVersionJeton(consumed.idUtilisateur, tx);

    // Invalider les autres demandes de réinitialisation encore en attente
    // pour cet utilisateur (un ancien lien ne doit plus fonctionner).
    await tx
      .update(verificationsEmail)
      .set({
        statut: "expire",
      })
      .where(
        and(
          eq(verificationsEmail.idUtilisateur, consumed.idUtilisateur),
          eq(verificationsEmail.type, "reinitialisation_mdp"),
          eq(verificationsEmail.statut, "en_attente"),
        ),
      );
  });

  // Révoquer toutes les sessions refresh existantes (sécurité)
  if (idUtilisateur) {
    await revokeAllSessions(idUtilisateur);
  }

  return {
    message: "Votre mot de passe a été réinitialisé avec succès",
  };
}


/**
 * Crée une session (refresh token) en base.
 * @param {string} idUtilisateur
 * @param {object} [req]
 * @param {object} [executor=db] — passer `tx` pour rester dans une transaction
 */
async function createSession(idUtilisateur, req, executor = db) {
  const { raw, hashed } = generateRefreshToken();
  const dateExpiration = getRefreshTokenExpiry();
  const adresseIp = req?.ip || null;

  // Géolocalisation best-effort (ne bloque pas le login si l'API géo échoue)
  let paysConnexion = null;
  let villeConnexion = null;
  try {
    const geo = await resolveGeoFromIp(adresseIp);
    paysConnexion = geo.pays;
    villeConnexion = geo.ville;
  } catch {
    /* ignore */
  }

  await executor.insert(sessionsUtilisateur).values({
    idUtilisateur,
    jeton: hashed,
    adresseIp,
    paysConnexion,
    villeConnexion,
    dateExpiration,
  });

  return raw; // on renvoie le token brut au client
}

/**
 * Login / Register : renvoie accessToken + refreshToken
 */

/** Enregistre une tentative de connexion échouée (activité suspecte). */
async function enregistrerTentativeEchouee({
  email,
  idUtilisateur = null,
  adresseIp = null,
  motif = "identifiants_invalides",
}) {
  try {
    await db.insert(tentativesConnexion).values({
      email: (email || "").toLowerCase().trim().slice(0, 255),
      idUtilisateur: idUtilisateur || null,
      adresseIp: adresseIp ? String(adresseIp).slice(0, 45) : null,
      motif: String(motif).slice(0, 80),
    });
  } catch {
    /* ne jamais faire échouer le login pour un problème de journalisation */
  }
}

export async function loginUser({ email, password }, req) {
  email = normalizeEmail(email);
  const ip = req?.ip || null;

  // Rate-limit IP + compte AVANT tout travail crypto / lookup coûteux
  await assertLoginAllowed({ emailNormalise: email, ip });

  const [utilisateur] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, email));

  if (!utilisateur || !utilisateur.motDePasseHash) {
    recordLoginFailure({ emailNormalise: email, ip });
    await enregistrerTentativeEchouee({
      email,
      idUtilisateur: utilisateur?.idUtilisateur || null,
      adresseIp: ip,
      motif: "identifiants_invalides",
    });
    const err = new Error("Identifiants invalides");
    err.status = 401;
    throw err;
  }

  const motDePasseValide = await comparePassword(
    password,
    utilisateur.motDePasseHash,
  );

  if (!motDePasseValide) {
    recordLoginFailure({ emailNormalise: email, ip });
    await enregistrerTentativeEchouee({
      email,
      idUtilisateur: utilisateur.idUtilisateur,
      adresseIp: ip,
      motif: "mot_de_passe_invalide",
    });
    const err = new Error("Identifiants invalides");
    err.status = 401;
    throw err;
  }

  if (utilisateur.statutCompte === "suspendu") {
    // Ne pas compter comme brute-force password, mais journaliser
    await enregistrerTentativeEchouee({
      email,
      idUtilisateur: utilisateur.idUtilisateur,
      adresseIp: ip,
      motif: "compte_suspendu",
    });
    const err = new Error(
      "Ce compte a été suspendu. Contacter le support InternIn pour plus d'informations.",
    );
    err.status = 403;
    throw err;
  }

  // Succès : reset compteur compte uniquement (pas le compteur IP global)
  clearLoginAccountLimit(email);

  await db
    .update(utilisateurs)
    .set({ derniereConnexion: new Date() })
    .where(eq(utilisateurs.idUtilisateur, utilisateur.idUtilisateur));

  const accessToken = signAccessToken(utilisateur);

  const refreshToken = await createSession(utilisateur.idUtilisateur, req);

  return {
    user: sanitizeUser(utilisateur),
    token: accessToken,
    refreshToken,
  };
}

/**
 * Rafraîchit l'access token + rotation du refresh token.
 *
 * Rotation atomique concurrent-safe :
 *   DELETE ... WHERE jeton = hash AND date_expiration > NOW() RETURNING *
 * Une seule requête concurrente peut consommer un refresh token donné.
 * L'INSERT du nouveau token se fait dans la MÊME transaction.
 */
export async function refreshAccessToken(rawRefreshToken, req) {
  if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
    const err = new Error("Session expirée, veuillez vous reconnecter");
    err.status = 401;
    throw err;
  }

  const hashed = hashRefreshToken(rawRefreshToken);

  let utilisateur = null;
  let newRefreshToken = null;

  try {
    await db.transaction(async (tx) => {
      // 1) Consommation atomique de l'ancien refresh token
      const [session] = await tx
        .delete(sessionsUtilisateur)
        .where(
          and(
            eq(sessionsUtilisateur.jeton, hashed),
            sql`${sessionsUtilisateur.dateExpiration} > NOW()`,
          ),
        )
        .returning();

      if (!session) {
        // Nettoyage best-effort des sessions expirées portant ce hash
        await tx
          .delete(sessionsUtilisateur)
          .where(eq(sessionsUtilisateur.jeton, hashed));

        const err = new Error("Session expirée, veuillez vous reconnecter");
        err.status = 401;
        err.code = "REFRESH_INVALID";
        throw err;
      }

      // 2) Vérifier le compte dans la même transaction
      const [user] = await tx
        .select()
        .from(utilisateurs)
        .where(eq(utilisateurs.idUtilisateur, session.idUtilisateur))
        .limit(1);

      if (!user || user.statutCompte === "suspendu") {
        // Session déjà consommée (supprimée) ; pas de nouveau token
        const err = new Error("Session expirée, veuillez vous reconnecter");
        err.status = 401;
        err.code = "REFRESH_ACCOUNT";
        throw err;
      }

      // 3) Nouveau refresh token (même transaction)
      newRefreshToken = await createSession(user.idUtilisateur, req, tx);
      utilisateur = user;
    });
  } catch (err) {
    if (err?.status === 401) throw err;
    throw err;
  }

  // Access token hors transaction (pas d'état DB)
  const accessToken = signAccessToken(utilisateur);

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

  const accessJwt = signAccessToken(utilisateur);

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

  // Sans GOOGLE_CLIENT_ID configuré, on ne peut pas vérifier l'audience
  // (aud) du id_token : il faut refuser plutôt que sauter la vérification,
  // sinon n'importe quel id_token Google valide (émis pour une AUTRE
  // application) serait accepté ici.
  if (!clientId) {
    const err = new Error(
      "Connexion Google indisponible (configuration serveur incomplète)",
    );
    err.status = 500;
    throw err;
  }

  if (idToken) {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = new Error("Jeton Google invalide ou expiré");
      err.status = 401;
      throw err;
    }
    const data = await res.json();
    if (data.aud !== clientId) {
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