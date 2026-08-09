"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { googleAuthRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/useAuthStore";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("SSR"));
      return;
    }
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-gsi");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Impossible de charger Google")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger Google"));
    document.head.appendChild(script);
  });
}

/**
 * @param {{ role?: string, onError?: (msg: string | null) => void }} props
 */
export default function GoogleButton({ role, onError }) {
  const { t } = useTranslation();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!GOOGLE_CLIENT_ID) {
      onError?.(
        "Google n'est pas configuré (NEXT_PUBLIC_GOOGLE_CLIENT_ID manquant).",
      );
      return;
    }

    onError?.(null);

    try {
      await loadGoogleScript();

      if (!window.google?.accounts?.oauth2) {
        onError?.("Google Sign-In indisponible. Réessaie dans un instant.");
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async (tokenResponse) => {
          if (tokenResponse?.error) {
            onError?.(
              tokenResponse.error_description || "Connexion Google annulée",
            );
            return;
          }

          if (!tokenResponse?.access_token) {
            onError?.("Connexion Google annulée ou invalide");
            return;
          }

          setLoading(true);
          try {
            const { user, token } = await googleAuthRequest({
              accessToken: tokenResponse.access_token,
              typeUtilisateur: role || undefined,
            });

            setSession(user, token);

            if (!user.emailVerifie) {
              router.push("/verification-email");
              return;
            }
            if (user.statutCompte === "inactif") {
              router.push("/onboarding/1");
              return;
            }
            router.push("/tableau-de-bord");
          } catch (err) {
            if (err.code === "GOOGLE_ACCOUNT_NOT_FOUND" || err.status === 404) {
              onError?.(
                err.message ||
                  "Aucun compte avec cet e-mail. Inscrivez-vous d'abord en choisissant un profil.",
              );
            } else {
              onError?.(err.message || "Connexion Google échouée");
            }
          } finally {
            setLoading(false);
          }
        },
      });

      // Popup Google classique — sans One Tap / FedCM
      client.requestAccessToken({ prompt: "consent" });
    } catch (err) {
      onError?.(err.message || "Impossible de démarrer Google Sign-In");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full rounded-sm"
      onClick={handleClick}
      disabled={loading || !GOOGLE_CLIENT_ID}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      {loading
        ? t("auth.shared.loading") || "Chargement…"
        : t("auth.shared.continueWithGoogle")}
    </Button>
  );
}
