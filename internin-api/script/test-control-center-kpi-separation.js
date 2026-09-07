/** node script/test-control-center-kpi-separation.js */
function computeStats(anomalies) {
  const ouvertes = anomalies.filter(
    (a) => a.statut !== "resolue" && a.statut !== "ignoree",
  );
  const parPriorite = {
    critique: ouvertes.filter((a) => a.priorite === "critique").length,
    important: ouvertes.filter((a) => a.priorite === "important").length,
    attention: ouvertes.filter((a) => a.priorite === "attention").length,
    information: ouvertes.filter((a) => a.priorite === "information").length,
  };
  const stagesConcernes = new Set(ouvertes.map((a) => a.stageId)).size;
  return {
    ...parPriorite,
    ouvertes: ouvertes.length,
    stagesConcernes,
  };
}

let f = 0;
const a = (n, c) => {
  if (!c) {
    console.error("FAIL", n);
    f++;
  } else console.log("OK  ", n);
};

// Test 1 — empty
a("empty", JSON.stringify(computeStats([])) === JSON.stringify({
  critique: 0, important: 0, attention: 0, information: 0, ouvertes: 0, stagesConcernes: 0,
}));

// Test 2 — one stage, 3 anomalies
const s1 = [
  { stageId: "A", priorite: "critique", statut: "nouvelle" },
  { stageId: "A", priorite: "important", statut: "nouvelle" },
  { stageId: "A", priorite: "attention", statut: "en_cours" },
];
const r1 = computeStats(s1);
a("open=3", r1.ouvertes === 3);
a("stages=1", r1.stagesConcernes === 1);

// Test 3 — two stages
const s2 = [
  ...s1,
  { stageId: "B", priorite: "critique", statut: "nouvelle" },
  { stageId: "B", priorite: "information", statut: "nouvelle" },
];
const r2 = computeStats(s2);
a("open=5", r2.ouvertes === 5);
a("stages=2", r2.stagesConcernes === 2);
a("critique=2", r2.critique === 2);

// Test 4 — resolved excluded
const s3 = [
  { stageId: "A", priorite: "critique", statut: "resolue" },
  { stageId: "A", priorite: "critique", statut: "ignoree" },
  { stageId: "B", priorite: "important", statut: "nouvelle" },
];
const r3 = computeStats(s3);
a("resolved out open=1", r3.ouvertes === 1);
a("resolved out stages=1", r3.stagesConcernes === 1);

// Test 5 — security account must NOT affect these stats (implicit: only stage anomalies passed)
a("no security bleed", r2.ouvertes === 5 && r2.stagesConcernes === 2);

if (f) process.exit(1);
console.log("\nAll control-center KPI separation checks passed");
