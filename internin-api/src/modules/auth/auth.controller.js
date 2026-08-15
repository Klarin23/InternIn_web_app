import {
  registerUser,
  loginUser,
  verifyEmail,
  resendEmailVerification,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logoutUser,
  loginWithGoogle,
} from "./auth.service.js";

/**
 * Options du cookie refresh token.
 *
 * PRODUCTION (frontend et API souvent sur des domaines différents) :
 *   sameSite: "none" + secure: true  → le navigateur envoie le cookie
 *   lors des requêtes cross-site (indispensable pour /auth/refresh).
 *
 * DÉVELOPPEMENT (localhost) :
 *   sameSite: "lax" + secure: false → fonctionne en HTTP local.
 *
 * Avec sameSite: "lax" ou "strict" en prod cross-domaine, le cookie
 * n'est JAMAIS envoyé → chaque clic qui déclenche une API 401
 * provoque une déconnexion.
 */
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd, // obligatoire si sameSite=none
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: "/",
  };
}

function clearRefreshCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("internin_refresh", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body, req);

    res.cookie("internin_refresh", result.refreshToken, refreshCookieOptions());

    const { refreshToken, ...safeResult } = result;
    res.status(201).json(safeResult);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body, req);

    res.cookie("internin_refresh", result.refreshToken, refreshCookieOptions());

    const { refreshToken, ...safeResult } = result;
    res.status(200).json(safeResult);
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req, res, next) {
  try {
    const refreshToken = req.cookies?.internin_refresh;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Session expirée. Veuillez vous reconnecter." });
    }

    const result = await refreshAccessToken(refreshToken, req);

    res.cookie("internin_refresh", result.refreshToken, refreshCookieOptions());

    const { refreshToken: _, ...safeResult } = result;
    res.status(200).json(safeResult);
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    const refreshToken = req.cookies?.internin_refresh;

    await logoutUser(refreshToken);

    clearRefreshCookie(res);

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

export async function resendEmailVerificationController(req, res, next) {
  try {
    const result = await resendEmailVerification(req.user.idUtilisateur);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordController(req, res, next) {
  try {
    const result = await requestPasswordReset(req.body.email);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    const result = await resetPassword(req.body.token, req.body.password);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const result = await loginWithGoogle(req.body, req);

    res.cookie("internin_refresh", result.refreshToken, refreshCookieOptions());

    const { refreshToken, ...safeResult } = result;
    res.status(result.isNewUser ? 201 : 200).json(safeResult);
  } catch (err) {
    next(err);
  }
}
