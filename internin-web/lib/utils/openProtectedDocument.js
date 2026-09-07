import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Convertit une URL stockée (uploads ou download) vers le chemin API protégé
 * /documents/download/:type/:filename
 */
export function toProtectedDocumentPath(fileUrl, defaultType = "cv") {
  if (!fileUrl || typeof fileUrl !== "string") return null;
  const cleaned = fileUrl.trim();

  const downloadMatch = cleaned.match(
    /\/documents\/download\/([a-zA-Z0-9_-]+)\/([^/?#]+)/,
  );
  if (downloadMatch) {
    return `/documents/download/${downloadMatch[1]}/${decodeURIComponent(downloadMatch[2])}`;
  }

  const uploadsMatch = cleaned.match(
    /\/uploads\/([a-zA-Z0-9_-]+)\/([^/?#]+)/,
  );
  if (uploadsMatch) {
    return `/documents/download/${uploadsMatch[1]}/${decodeURIComponent(uploadsMatch[2])}`;
  }

  if (!cleaned.includes("/") && cleaned.includes(".")) {
    return `/documents/download/${defaultType}/${encodeURIComponent(cleaned)}`;
  }

  return null;
}

/**
 * Ouvre un document sensible via fetch authentifié (Bearer + cookies).
 * Les liens directs vers /uploads/... ne fonctionnent plus (fichiers non publics).
 *
 * @param {string} fileUrl
 * @param {{ download?: boolean, defaultType?: string, idStagiaire?: string }} options
 *   - download: true → Content-Disposition attachment
 *   - idStagiaire: si fourni, utilise la route dédiée anti-IDOR /documents/cv/stagiaire/:id
 */
export async function openProtectedDocument(
  fileUrl,
  { download = false, defaultType = "cv", idStagiaire = null } = {},
) {
  const disposition = download ? "attachment" : "inline";
  let relative;

  if (idStagiaire && defaultType === "cv") {
    relative = `/documents/cv/stagiaire/${encodeURIComponent(idStagiaire)}?disposition=${disposition}`;
  } else {
    const path = toProtectedDocumentPath(fileUrl, defaultType);
    if (!path) {
      if (/^https?:\/\//i.test(fileUrl) && !fileUrl.includes("/uploads/")) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
        return;
      }
      throw new Error("URL de document non reconnue");
    }
    relative = `${path}?disposition=${disposition}`;
  }

  const token = useAuthStore.getState().token;
  const url = `/api${relative}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let message = "Impossible d'ouvrir le document";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  // Prefer Content-Disposition filename when available
  let filename = "document.pdf";
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    const m = cd.match(/filename="?([^";]+)"?/i);
    if (m) filename = m[1];
  } else if (relative.includes("/")) {
    filename = relative.split("/").pop()?.split("?")[0] || filename;
  }

  if (download) {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function openProtectedCv(cvUrl, options = {}) {
  return openProtectedDocument(cvUrl, { defaultType: "cv", ...options });
}
