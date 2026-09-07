// Chemin : internin-web/lib/entretiens/planification.js
//
// Configuration partagée pour la planification/l'affichage du mode d'un
// entretien (vidéo / téléphone / présentiel).
//
// IMPORTANT : le champ backend reste "lienGoogleMeet" quel que soit le mode
// (lien vidéo, adresse, ou numéro de téléphone).

import { FiVideo, FiPhone, FiMapPin } from "react-icons/fi";

export const MODES_ENTRETIEN = [
  {
    valeur: "video",
    label: "Visioconférence",
    description: "Google Meet, Zoom, Teams...",
    Icon: FiVideo,
  },
  {
    valeur: "telephone",
    label: "Téléphone",
    description: "Appel téléphonique",
    Icon: FiPhone,
  },
  {
    valeur: "presentiel",
    label: "Présentiel",
    description: "Rencontre sur place",
    Icon: FiMapPin,
  },
];

export const MODE_ICONS = Object.fromEntries(
  MODES_ENTRETIEN.map((m) => [m.valeur, m.Icon]),
);
export const MODE_LABELS = Object.fromEntries(
  MODES_ENTRETIEN.map((m) => [m.valeur, m.label]),
);

export function champLienConfig(mode) {
  if (mode === "video") {
    return {
      label: "Lien de visioconférence",
      Icon: FiVideo,
      placeholder: "https://meet.google.com/... ou https://zoom.us/j/...",
      aide: "Obligatoire. Collez le lien Google Meet, Zoom, Microsoft Teams ou une autre plateforme.",
      type: "url",
      obligatoire: true,
    };
  }
  if (mode === "telephone") {
    return {
      label: "Numéro de téléphone",
      Icon: FiPhone,
      placeholder: "+237 6XX XX XX XX",
      aide: "Optionnel. Numéro sur lequel le candidat pourra être appelé.",
      type: "tel",
      obligatoire: false,
    };
  }
  return {
    label: "Adresse / localisation",
    Icon: FiMapPin,
    placeholder: "Ex. : Rue de la Joie, Akwa, Douala — ou lien Google Maps",
    aide: "Obligatoire. Indiquez l'adresse exacte ou un lien Google Maps pour que le candidat sache où se rendre.",
    type: "text",
    obligatoire: true,
  };
}

export function validerChampLien(mode, valeur) {
  const v = (valeur || "").trim();

  if (mode === "video") {
    if (!v) {
      return {
        valide: false,
        message:
          "Le lien de visioconférence (Google Meet, Zoom, Teams...) est obligatoire",
      };
    }
    try {
      const url = new URL(v);
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          valide: false,
          message: "Le lien doit être une URL valide[](https://...)",
        };
      }
      return { valide: true, message: "" };
    } catch {
      return {
        valide: false,
        message: "Le lien doit être une URL valide[](https://...)",
      };
    }
  }

  if (mode === "telephone") {
    if (!v) return { valide: true, message: "" };
    const chiffres = v.replace(/[^\d]/g, "");
    if (chiffres.length < 8 || !/^[\d+\s().-]+$/.test(v)) {
      return { valide: false, message: "Ce numéro ne semble pas valide" };
    }
    return { valide: true, message: "" };
  }

  // presentiel
  if (!v || v.length < 5) {
    return {
      valide: false,
      message:
        "L'adresse ou la localisation de l'entretien en présentiel est obligatoire",
    };
  }
  return { valide: true, message: "" };
}

export const APP_TIME_ZONE = "Africa/Douala";

const DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/;
const FR_DATE_TIME_RE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function isValidCalendar(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function isValidClock(h, min, sec) {
  return (
    Number.isInteger(h) &&
    Number.isInteger(min) &&
    Number.isInteger(sec) &&
    h >= 0 &&
    h <= 23 &&
    min >= 0 &&
    min <= 59 &&
    sec >= 0 &&
    sec <= 59
  );
}

function getTimeZoneOffsetMs(date, timeZone = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );

  return (
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    ) - date.getTime()
  );
}

/**
 * Convertit une heure civile Africa/Douala vers un instant UTC.
 */
export function zonedDateTimeToUtc(
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  timeZone = APP_TIME_ZONE,
) {
  const wallClockUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  const initialOffset = getTimeZoneOffsetMs(new Date(wallClockUtc), timeZone);
  let instant = wallClockUtc - initialOffset;

  const correctedOffset = getTimeZoneOffsetMs(new Date(instant), timeZone);
  if (correctedOffset !== initialOffset) {
    instant = wallClockUtc - correctedOffset;
  }

  const result = new Date(instant);
  return Number.isNaN(result.getTime()) ? null : result;
}

/**
 * Extrait les composants d'un instant dans le fuseau métier.
 */
export function getZonedDateParts(input, timeZone = APP_TIME_ZONE) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const values = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

/**
 * Retourne la clé civile YYYY-MM-DD d'un instant dans le fuseau métier.
 */
export function zonedDateKey(input, timeZone = APP_TIME_ZONE) {
  const p = getZonedDateParts(input, timeZone);
  if (!p) return "";
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function dateHeureVersChamps(dateHeureIso) {
  const p = getZonedDateParts(dateHeureIso);
  if (!p) return { date: "", heure: "" };

  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    heure: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/**
 * Transforme les champs datetime-local (heure Africa/Douala) en ISO UTC.
 * Le contrat réseau est désormais explicite: YYYY-MM-DDTHH:mm:ss.sssZ.
 */
export function champsVersDateHeure(date, heure) {
  if (!date || !heure) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const h = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(heure);
  if (!m || !h) return "";

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(h[1]);
  const min = Number(h[2]);
  const sec = Number(h[3] || 0);

  if (!isValidCalendar(y, mo, d) || !isValidClock(hh, min, sec)) return "";

  const instant = zonedDateTimeToUtc(y, mo, d, hh, min, sec);
  return instant ? instant.toISOString() : "";
}

export function estDateHeurePassee(date, heure) {
  const iso = champsVersDateHeure(date, heure);
  return !!iso && new Date(iso).getTime() < Date.now();
}

export function formatDateLongue(date, heure, locale = "fr") {
  const iso = champsVersDateHeure(date, heure);
  if (!iso) return "";
  const d = new Date(iso);
  const jour = d.toLocaleDateString(localeBcp47(locale), {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return jour.charAt(0).toUpperCase() + jour.slice(1);
}

export function formatHeureCourte(heure) {
  return heure || "";
}

/**
 * Parse sans ambiguïté:
 * - local sans offset => Africa/Douala;
 * - Z/offset => instant explicite respecté;
 * - date seule => minuit civil Africa/Douala.
 */
export function parseDateHeureRobuste(input) {
  if (input == null || input === "") return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const s = String(input).trim();
  if (!s) return null;

  const iso = DATE_TIME_RE.exec(s);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const h = Number(iso[4]);
    const min = Number(iso[5]);
    const sec = Number(iso[6] || 0);
    const zone = iso[8] || "";

    if (!isValidCalendar(y, m, d) || !isValidClock(h, min, sec)) return null;

    if (zone) {
      const normalized = s.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
      const instant = new Date(normalized);
      return Number.isNaN(instant.getTime()) ? null : instant;
    }

    return zonedDateTimeToUtc(y, m, d, h, min, sec);
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    const y = Number(dateOnly[1]);
    const m = Number(dateOnly[2]);
    const d = Number(dateOnly[3]);
    if (!isValidCalendar(y, m, d)) return null;
    return zonedDateTimeToUtc(y, m, d, 0, 0, 0);
  }

  const fr = FR_DATE_TIME_RE.exec(s);
  if (fr) {
    const d = Number(fr[1]);
    const m = Number(fr[2]);
    const y = Number(fr[3]);
    const h = Number(fr[4] ?? 0);
    const min = Number(fr[5] ?? 0);
    const sec = Number(fr[6] ?? 0);
    if (!isValidCalendar(y, m, d) || !isValidClock(h, min, sec)) return null;
    return zonedDateTimeToUtc(y, m, d, h, min, sec);
  }

  return null;
}

/**
 * Normalise une date/heure vers le contrat API: instant ISO UTC avec Z.
 */
export function normaliserDateHeurePourApi(input) {
  const d = parseDateHeureRobuste(input);
  return d ? d.toISOString() : "";
}

/** Mappe le code i18n app ("fr" | "en") vers une locale BCP 47. */
export function localeBcp47(locale = "fr") {
  if (!locale) return "fr-FR";
  const l = String(locale).toLowerCase();
  if (l.startsWith("en")) return "en-US";
  if (l.startsWith("fr")) return "fr-FR";
  return locale.includes("-") ? locale : "fr-FR";
}

/**
 * Affichage d'un instant selon le fuseau métier, jamais celui du navigateur.
 */
export function formatDateHeureLocale(
  input,
  locale = "fr",
  { withTime = true } = {},
) {
  const d = parseDateHeureRobuste(input);
  if (!d) return "—";
  const loc = localeBcp47(locale);
  const opts = {
    timeZone: APP_TIME_ZONE,
    ...(withTime
      ? { dateStyle: "long", timeStyle: "short" }
      : { dateStyle: "long" }),
  };
  return d.toLocaleString(loc, opts);
}

/** @deprecated utiliser formatDateHeureLocale(input, locale) */
export function formatDateHeureFr(
  input,
  { withTime = true, locale = "fr" } = {},
) {
  return formatDateHeureLocale(input, locale, { withTime });
}
