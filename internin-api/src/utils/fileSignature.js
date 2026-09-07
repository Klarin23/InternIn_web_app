// Validation du contenu réel des fichiers uploadés.
// Le MIME et le nom du fichier restent des données fournies par le client.
import fs from "node:fs";

const SIGNATURES = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF + WEBP vérifié ci-dessous
};

export const EXTENSION_BY_MIME = Object.freeze({
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "text/plain": ".txt",
});

export const ALLOWED_LITIGE_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

export const ALLOWED_LITIGE_EXTENSIONS = Object.freeze({
  "application/pdf": new Set([".pdf"]),
  "image/png": new Set([".png"]),
  "image/jpeg": new Set([".jpg", ".jpeg"]),
  "image/webp": new Set([".webp"]),
  "text/plain": new Set([".txt"]),
});

function matchSignature(buffer, signature) {
  return signature.every((byte, i) => buffer[i] === byte);
}

function isValidUtf8Text(buffer) {
  if (buffer.includes(0x00)) return false;
  try {
    // TextDecoder fatal évite d'accepter un flux binaire arbitraire comme UTF-8.
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

/** Vérifie que le contenu réel correspond au MIME déclaré. */
export function matchesDeclaredType(filePath, mimetype) {
  if (mimetype === "text/plain") {
    const buffer = fs.readFileSync(filePath);
    return buffer.length > 0 && isValidUtf8Text(buffer);
  }

  const signatures = SIGNATURES[mimetype];
  if (!signatures) return false;

  const fd = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(12);
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    if (bytesRead < 4) return false;

    if (mimetype === "image/webp") {
      return (
        bytesRead >= 12 &&
        matchSignature(buffer, [0x52, 0x49, 0x46, 0x46]) &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      );
    }

    return signatures.some((sig) => bytesRead >= sig.length && matchSignature(buffer, sig));
  } finally {
    fs.closeSync(fd);
  }
}
