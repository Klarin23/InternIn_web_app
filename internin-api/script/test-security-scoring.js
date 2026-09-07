/**
 * Test logique scoring comportemental (helpers isolés).
 * node script/test-security-scoring.js
 */
function scoreRegulariteIntervalles(datesMs) {
  if (!datesMs || datesMs.length < 4) return 0;
  const sorted = [...datesMs].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = sorted[i] - sorted[i - 1];
    if (g > 0 && g < 30 * 60 * 1000) gaps.push(g);
  }
  if (gaps.length < 3) return 0;
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (mean <= 0) return 0;
  const variance = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv > 0.5) return 0;
  if (cv <= 0.15) return 1;
  return Math.max(0, 1 - cv / 0.5);
}

let failed = 0;
function assert(n, c) {
  if (!c) { console.error('FAIL', n); failed++; }
  else console.log('OK  ', n);
}

const base = Date.now();
const regular = [0,10,20,30,40,50].map((s) => base + s * 1000);
assert('regular intervals high', scoreRegulariteIntervalles(regular) >= 0.9);

const irregular = [0, 2, 40, 45, 200].map((s) => base + s * 1000);
assert('irregular lower', scoreRegulariteIntervalles(irregular) < scoreRegulariteIntervalles(regular));

assert('too few samples', scoreRegulariteIntervalles([1,2,3]) === 0);

if (failed) process.exit(1);
console.log('All security scoring unit checks passed');
