const TIME_ZONE = "Africa/Douala";

function partsInTimeZone(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function getDateLimiteParts(value) {
  const parts = partsInTimeZone(value);
  if (!parts) return { date: "", time: "" };
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function todayInDouala() {
  const parts = partsInTimeZone(new Date());
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : new Date().toISOString().slice(0, 10);
}

export function formatDateHeureLimite(value, locale = "fr") {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(String(locale).toLowerCase().startsWith("en") ? "en-GB" : "fr-FR", {
    timeZone: TIME_ZONE, day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
}

export function formatDateHeureSaisie(dateValue, timeValue, locale = "fr") {
  if (!dateValue || !timeValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  const tag = String(locale).toLowerCase().startsWith("en") ? "en-GB" : "fr-FR";
  const formattedDate = new Intl.DateTimeFormat(tag, { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }).format(date);
  return `${formattedDate} · ${timeValue} (Africa/Douala)`;
}

export function dateHeureDoualaToInstant(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const clock = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeValue);
  if (!match || !clock) return null;
  const [, y, m, d] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  const hour = Number(clock[1]), minute = Number(clock[2]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(wallClockUtc));
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const zonedAsUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
  let instant = wallClockUtc - (zonedAsUtc - wallClockUtc);
  const correctedParts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
  const corrected = Object.fromEntries(correctedParts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  if (corrected.year !== year || corrected.month !== month || corrected.day !== day || corrected.hour !== hour || corrected.minute !== minute) return null;
  return new Date(instant);
}
