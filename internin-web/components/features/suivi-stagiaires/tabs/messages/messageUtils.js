/** Utilitaires messagerie suivi-stagiaires — dates localisées côté UI */

export function formatMessageTime(date, locale) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const loc = locale === "en" || locale === "en-GB" ? "en-GB" : "fr-FR";
  return d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Label de jour pour groupement — retourne { type, date?, params? }
 * type: 'today' | 'yesterday' | 'date'
 * Le composant React applique t() / formatDate.
 */
export function dayLabelMeta(date) {
  if (!date) return { type: "date", date: null };
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return { type: "date", date: null };
  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - startMsg) / 86400000);
  if (diffDays === 0) return { type: "today" };
  if (diffDays === 1) return { type: "yesterday" };
  return { type: "date", date: d };
}

export function formatDayLabel(meta, locale, t) {
  if (!meta) return "";
  if (meta.type === "today") return t("suivi.rel.today");
  if (meta.type === "yesterday") return t("suivi.rel.yesterday");
  if (!meta.date) return "";
  const loc = locale === "en" || locale === "en-GB" ? "en-GB" : "fr-FR";
  return meta.date.toLocaleDateString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(debut, fin, locale) {
  const loc = locale === "en" || locale === "en-GB" ? "en-GB" : "fr-FR";
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const d1 = debut ? new Date(debut).toLocaleDateString(loc, opts) : null;
  const d2 = fin ? new Date(fin).toLocaleDateString(loc, opts) : null;
  if (d1 && d2) return `${d1} → ${d2}`;
  return d1 || d2 || "";
}

/**
 * Groupe les messages par jour calendaire.
 * labelMeta permet la traduction dans le composant React.
 */
export function groupMessagesByDay(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const map = new Map();
  for (const msg of messages) {
    const d = msg.dateEnvoi ? new Date(msg.dateEnvoi) : null;
    const key =
      d && !Number.isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "unknown";
    if (!map.has(key)) {
      map.set(key, {
        key,
        labelMeta: dayLabelMeta(msg.dateEnvoi),
        items: [],
      });
    }
    map.get(key).items.push(msg);
  }
  return Array.from(map.values());
}

export function getInitials(prenom, nom) {
  const a = (prenom || "").trim().charAt(0);
  const b = (nom || "").trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

export function avatarColor(seed) {
  const colors = [
    "#14B8A6",
    "#5B3DF5",
    "#F59E0B",
    "#3B82F6",
    "#EC4899",
    "#10B981",
    "#F97316",
  ];
  const str = String(seed || "");
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i) * 17) % 7;
  return colors[h] || colors[0];
}
