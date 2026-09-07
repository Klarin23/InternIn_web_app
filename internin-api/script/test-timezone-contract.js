import {
  STAGE_TZ,
  parseStrictDateTime,
  zonedDateTimeToUtc,
} from "../src/utils/dateValidation.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(STAGE_TZ === "Africa/Douala", "Fuseau métier inattendu");

const local = parseStrictDateTime("2026-09-05T14:00:00");
assert(
  local?.toISOString() === "2026-09-05T13:00:00.000Z",
  `Local Douala incorrect: ${local?.toISOString()}`,
);

const fr = parseStrictDateTime("05/09/2026 14:00");
assert(
  fr?.toISOString() === "2026-09-05T13:00:00.000Z",
  `FR Douala incorrect: ${fr?.toISOString()}`,
);

const explicitUtc = parseStrictDateTime("2026-09-05T14:00:00Z");
assert(
  explicitUtc?.toISOString() === "2026-09-05T14:00:00.000Z",
  "Z doit rester un instant UTC explicite",
);

const explicitOffset = parseStrictDateTime("2026-09-05T14:00:00+02:00");
assert(
  explicitOffset?.toISOString() === "2026-09-05T12:00:00.000Z",
  "L'offset explicite doit être respecté",
);

assert(
  parseStrictDateTime("2026-02-31T14:00:00") === null,
  "Une date calendaire impossible doit être rejetée",
);

const converted = zonedDateTimeToUtc(2026, 9, 5, 14, 0, 0);
assert(
  converted?.toISOString() === "2026-09-05T13:00:00.000Z",
  "Conversion zonée incorrecte",
);

console.log("Timezone contract OK");
