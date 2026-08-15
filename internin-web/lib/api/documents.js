// Upload de fichiers : cas particulier du client API, car il envoie du
// FormData (pas du JSON) — on ne réutilise donc pas apiFetch ici.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

async function resolveToken(token) {
  if (token) return token;
  try {
    const { useAuthStore } = await import("@/lib/store/useAuthStore");
    return useAuthStore.getState().token || null;
  } catch {
    return null;
  }
}

export async function uploadDocumentRequest(file, type, token) {
  const resolved = await resolveToken(token);
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  if (resolved) headers.Authorization = `Bearer ${resolved}`;

  const response = await fetch(`${API_URL}/documents/upload/${type}`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  // 401 → refresh puis retry une fois
  if (response.status === 401) {
    try {
      const { refreshTokenRequest } = await import("@/lib/api/auth");
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      const data = await refreshTokenRequest();
      const newToken = data.token || data.accessToken;
      if (newToken) {
        useAuthStore.getState().setAccessToken(newToken);
        const retry = await fetch(`${API_URL}/documents/upload/${type}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${newToken}` },
          body: formData,
          credentials: "include",
        });
        const retryData = await retry.json().catch(() => ({}));
        if (!retry.ok) {
          throw new Error(retryData.error || "Échec de l'envoi du fichier");
        }
        return retryData;
      }
    } catch {
      // fall through
    }
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      useAuthStore.getState().clearSession();
    } catch {
      /* ignore */
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Échec de l'envoi du fichier");
  }

  return data;
}
