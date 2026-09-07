/**
 * Validation calendrier centralisée — InternIn
 * Fuseau métier de référence : Africa/Douala (cf. stageLifecycle.js)
 *
 * Dates civiles (YYYY-MM-DD) ≠ datetimes (ISO avec heure).
 * Ne laisse JAMAIS JavaScript normaliser silencieusement 2026-02-31 → mars.
 */

/** Fuseau métier (aligné stageLifecycle). */
export const STAGE_TZ = "Africa/Douala";

/** @returns {string} YYYY-MM-DD dans le fuseau Africa/Douala */
export function todayYmdInAppTz(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STAGE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Années acceptables pour dates métier (stage, offre, entretien…). */
export const YEAR_MIN_METIER = 2020;
export const YEAR_MAX_METIER = 2035;

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Retourne le décalage du fuseau IANA par rapport à UTC pour un instant.
 * Aucun recours au fuseau horaire du processus Node.
 */
function getTimeZoneOffsetMs(date, timeZone = STAGE_TZ) {
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

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
    0,
  );
  return asUtc - date.getTime();
}

/**
 * Convertit des composants civils saisis dans `timeZone` vers un instant UTC.
 * Exemple Africa/Douala: 2026-09-05 14:00 => 2026-09-05T13:00:00.000Z.
 */
export function zonedDateTimeToUtc(
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
  timeZone = STAGE_TZ,
) {
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let instant = wallClockUtc - getTimeZoneOffsetMs(new Date(wallClockUtc), timeZone);

  // Recalcule l'offset sur l'instant corrigé (important pour les fuseaux à DST).
  const correctedOffset = getTimeZoneOffsetMs(new Date(instant), timeZone);
  if (correctedOffset !== getTimeZoneOffsetMs(new Date(wallClockUtc), timeZone)) {
    instant = wallClockUtc - correctedOffset;
  }

  const result = new Date(instant);
  if (Number.isNaN(result.getTime())) return null;
  return result;
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

/**
 * Vérifie qu'une date civile YYYY-MM-DD existe réellement (ex. rejette 2026-02-31).
 */
export function isValidCalendarYmd(ymd) {
  if (typeof ymd !== "string") return false;
  const m = YMD_RE.exec(ymd.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return false;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;

  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Parse strict d'une date civile. Retourne YYYY-MM-DD ou null.
 */
export function parseStrictYmd(value, opts = {}) {
  const yearMin = opts.yearMin ?? YEAR_MIN_METIER;
  const yearMax = opts.yearMax ?? YEAR_MAX_METIER;

  if (value == null || value === "") return null;

  let ymd = null;
  if (typeof value === "string") {
    const s = value.trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) ymd = m[1];
  } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
    ymd = value.toISOString().slice(0, 10);
  }

  if (!ymd || !isValidCalendarYmd(ymd)) return null;

  const y = Number(ymd.slice(0, 4));
  if (y < yearMin || y > yearMax) return null;

  return ymd;
}

/**
 * Parse strict datetime.
 *
 * Contrat:
 * - datetime sans offset (datetime-local / JJ/MM/AAAA HH:mm) = heure civile
 *   Africa/Douala, jamais le fuseau du serveur;
 * - ISO avec Z/offset = instant explicite, offset respecté;
 * - retourne toujours une Date représentant l'instant UTC.
 */
export function parseStrictDateTime(value) {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const s = String(value).trim();
  if (!s) return null;

  const iso = DATETIME_RE.exec(s);
  if (iso) {
    const y = Number(iso[1]);
    const mo = Number(iso[2]);
    const d = Number(iso[3]);
    const h = Number(iso[4]);
    const min = Number(iso[5]);
    const sec = Number(iso[6] || 0);
    const fraction = iso[7] || "";
    const zone = iso[8] || "";

    const ymd = `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!isValidCalendarYmd(ymd) || !isValidClock(h, min, sec)) return null;
    if (y < YEAR_MIN_METIER || y > YEAR_MAX_METIER) return null;

    // Offset/Z explicite: il s'agit déjà d'un instant; on respecte l'offset.
    if (zone) {
      const normalized = `${s.replace(/([+-]\d{2})(\d{2})$/, "$1:$2")}`;
      const date = new Date(normalized);
      if (Number.isNaN(date.getTime())) return null;

      // Vérification stricte des composants avant le parse natif.
      const ms = fraction ? Number(`0.${fraction}`) * 1000 : 0;
      if (Math.abs(ms - Math.trunc(ms)) > Number.EPSILON) return null;
      return date;
    }

    return zonedDateTimeToUtc(y, mo, d, h, min, sec, 0, STAGE_TZ);
  }

  // Date seule: civil, pas un instant à convertir.
  if (YMD_RE.test(s)) {
    return null;
  }

  const fr =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (fr) {
    const day = Number(fr[1]);
    const month = Number(fr[2]);
    const year = Number(fr[3]);
    const h = Number(fr[4]);
    const min = Number(fr[5]);
    const sec = Number(fr[6] ?? 0);
    const ymd = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (
      !isValidCalendarYmd(ymd) ||
      !isValidClock(h, min, sec) ||
      year < YEAR_MIN_METIER ||
      year > YEAR_MAX_METIER
    ) {
      return null;
    }

    return zonedDateTimeToUtc(year, month, day, h, min, sec, 0, STAGE_TZ);
  }

  return null;
}

export function assertStrictYmd(value, label = "date") {
  const ymd = parseStrictYmd(value);
  if (!ymd) {
    const err = new Error(
      `${label} invalide. Utilisez une date calendaire réelle au format AAAA-MM-JJ.`,
    );
    err.status = 400;
    throw err;
  }
  return ymd;
}

export function assertChronologicalYmd(start, end, {
  allowEqual = true,
  startLabel = "La date de début",
  endLabel = "la date de fin",
} = {}) {
  const a = parseStrictYmd(start);
  const b = parseStrictYmd(end);
  if (!a || !b) {
    const err = new Error("Dates invalides");
    err.status = 400;
    throw err;
  }
  if (allowEqual ? a > b : a >= b) {
    const err = new Error(
      allowEqual
        ? `${startLabel} doit être antérieure ou égale à ${endLabel}.`
        : `${startLabel} doit être antérieure à ${endLabel}.`,
    );
    err.status = 400;
    throw err;
  }
  return { start: a, end: b };
}

/**
 * Date civile non strictement dans le passé (aujourd'hui inclus), fuseau métier.
 */
export function assertYmdNotBeforeToday(value, label = "La date") {
  const ymd = assertStrictYmd(value, label);
  const today = todayYmdInAppTz();
  if (ymd < today) {
    const err = new Error(`${label} ne peut pas être dans le passé.`);
    err.status = 400;
    throw err;
  }
  return ymd;
}

/**
 * Datetime strictement dans le futur. L'input sans offset est interprété en Africa/Douala.
 */
export function assertDateTimeInFuture(value, label = "La date") {
  const d = parseStrictDateTime(value);
  if (!d) {
    const err = new Error(
      `${label} est invalide. Utilisez une date/heure réelle (AAAA-MM-JJTHH:mm ou JJ/MM/AAAA HH:mm).`,
    );
    err.status = 400;
    throw err;
  }
  if (d.getTime() <= Date.now()) {
    const err = new Error(`${label} doit être dans le futur.`);
    err.status = 400;
    throw err;
  }
  return d;
}

/** Helpers Zod (optionnels) */
export function zodYmd(message = "Date invalide (AAAA-MM-JJ)") {
  // Import dynamique évité : le caller passe z
  return {
    parse(z) {
      return z
        .string()
        .min(1, message)
        .refine((v) => parseStrictYmd(v) != null, { message });
    },
  };
}

