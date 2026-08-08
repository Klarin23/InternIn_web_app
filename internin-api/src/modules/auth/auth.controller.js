import {
  registerUser,
  loginUser,
  verifyEmail,
  resendEmailVerification,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logoutUser,
} from "./auth.service.js";

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body, req);

    res.cookie("internin_refresh", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    const { refreshToken, ...safeResult } = result;
    res.status(201).json(safeResult);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body, req);

    // Refresh token en cookie HttpOnly
    res.cookie("internin_refresh", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: "/",
    });

    // On ne renvoie plus le refreshToken dans le body (optionnel mais plus sûr)
    const { refreshToken, ...safeResult } = result;
    res.status(200).json(safeResult);
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req, res, next) {
  try {
    // Priorité au body, fallback cookie HttpOnly
    const refreshToken = req.body.refreshToken || req.cookies?.internin_refresh;

    const result = await refreshAccessToken(refreshToken, req);

    // Rotation : poser le NOUVEAU refresh token en cookie
    res.cookie("internin_refresh", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    const { refreshToken: _, ...safeResult } = result;
    res.status(200).json(safeResult);
  } catch (err) {
    next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    // On peut lire le cookie si le body n'a pas le token
    const refreshToken = req.body.refreshToken || req.cookies?.internin_refresh;

    await logoutUser(refreshToken);

    res.clearCookie("internin_refresh", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({ message: "Déconnecté avec succès" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.status(200).json({
    user: req.user,
  });
}

/**
 * GET /auth/verifier-email?token=...
 */
export async function verifyEmailController(req, res, next) {
  try {
    const result = await verifyEmail(req.query.token);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/renvoyer-verification
 *
 * Cette route nécessite une session.
 */
export async function resendEmailVerificationController(req, res, next) {
  try {
    const result = await resendEmailVerification(req.user.idUtilisateur);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/mot-de-passe-oublie
 *
 * Route publique : envoie un lien de réinitialisation si l'adresse existe.
 */
export async function forgotPasswordController(req, res, next) {
  try {
    const result = await requestPasswordReset(req.body.email);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/reinitialiser-mot-de-passe
 *
 * Route publique : consomme le token reçu par e-mail
 * et enregistre le nouveau mot de passe.
 */
export async function resetPasswordController(req, res, next) {
  try {
    const result = await resetPassword(req.body.token, req.body.password);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
