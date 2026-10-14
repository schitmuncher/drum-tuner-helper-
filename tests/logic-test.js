const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || require("path").join(__dirname, "..", "index.html"), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];

// 1. Syntax check of the whole script (DOM calls are not executed here)
try { new Function(script); console.log('syntax: ok'); } catch (e) { console.log('syntax: FAIL', e.message); process.exit(1); }

// Extract a top-level function or const by brace matching
function extract(name) {
  let start = script.indexOf(`function ${name}(`);
  if (start < 0) start = script.indexOf(`const ${name} =`);
  if (start < 0) throw new Error('missing ' + name);
  const open = script.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < script.length; i++) {
    if (script[i] === '{') depth++;
    else if (script[i] === '}') { depth--; if (depth === 0) break; }
  }
  return script.slice(start, i + 1) + ';';
}
const names = ['EVEN_PAIR_ORDER', 'buildStarSequence', 'detectPitch', 'median', 'updateReadings', 'doneStatus'];
const src = names.map(n => n === 'EVEN_PAIR_ORDER' ? extract(n).replace(/^const EVEN_PAIR_ORDER =/, 'const EVEN_PAIR_ORDER =') : extract(n)).join('\n');
const SPREAD_GOOD_CENTS = 5, SPREAD_OK_CENTS = 12;
let lugs = [], tuningSequence = [];
const api = new Function('SPREAD_GOOD_CENTS', 'lugs', 'tuningSequence', src +
  '; return { buildStarSequence, detectPitch, updateReadings, doneStatus, setState: (l, t) => { lugs = l; tuningSequence = t; } };')(SPREAD_GOOD_CENTS, lugs, tuningSequence);

let failures = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log((ok ? 'PASS ' : 'FAIL ') + msg); };

// 2. Pitch detection on synthetic drum-like tones (decaying fundamental + harmonics)
const SR = 48000, N = 2048;
function tone(f, noise = 0) {
  const b = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 6);
    b[i] = env * (0.6 * Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * 2 * f * t) + 0.1 * Math.sin(2 * Math.PI * 3 * f * t))
      + noise * (Math.random() * 2 - 1);
  }
  return b;
}
for (const f of [110, 147, 196, 262, 330]) {
  const hz = api.detectPitch(tone(f, 0.01), SR);
  check(hz && Math.abs(hz - f) / f < 0.01, `pitch ${f} Hz -> ${hz ? hz.toFixed(1) : null}`);
}
check(api.detectPitch(new Float32Array(N), SR) === null, 'silence returns null');
check(api.detectPitch(tone(20), SR) === null || true, 'sub-audible input does not crash');

// 3. Cents and evenness
const mk = (hz) => ({ u: 0, v: 0, hz });
let L = [mk(180), mk(180), mk(180), mk(180)];
let T = [0, 1, 2, 3];
api.setState(L, T);
api.updateReadings();
check(L.every(l => Math.abs(l.cents) < 1e-9), 'identical pitches -> 0 cents');
check(api.doneStatus().startsWith('Evenly tuned'), 'even ring reports evenly tuned: ' + api.doneStatus());

L = [mk(180), mk(180), mk(170), mk(180)];
api.setState(L, [0, 1, 2, 3]);
api.updateReadings();
const sc = L[2].cents;
check(Math.abs(sc - 1200 * Math.log2(170 / 180)) < 1e-6, `cents for 170 vs 180 Hz: ${sc.toFixed(1)}`);
const ds = api.doneStatus();
check(ds.includes('tighten lug 3') && ds.includes('170 Hz'), 'flags the lowest lug (step 3): ' + ds);

// Lowest lug reported by its star step number, not its array index
L = [mk(170), mk(180), mk(180), mk(180)];
api.setState(L, [2, 0, 3, 1]);   // lug index 0 is step 2
api.updateReadings();
check(api.doneStatus().includes('tighten lug 2'), 'step number used for hint: ' + api.doneStatus());

// Incomplete readings -> generic done message, no crash
L = [mk(180), {}, {}, {}];
api.setState(L, [0, 1, 2, 3]);
api.updateReadings();
check(api.doneStatus() === 'All lugs tightened evenly! 🥁', 'incomplete readings fall back to generic message');

// 4. Star order still correct for all even sizes
for (const n of [4, 6, 8, 10, 12]) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2 + 0.2; // rotated ring, shuffled below
    return { u: 0.34 * Math.cos(a), v: 0.34 * Math.sin(a) };
  }).sort(() => Math.random() - 0.5);
  const seq = api.buildStarSequence(pts);
  const ord = pts.map((p, i) => ({ i, a: Math.atan2(p.v, p.u) })).sort((a, b) => b.a - a.a);
  const rank = {}; ord.forEach((o, r) => rank[o.i] = r);
  const steps = seq.map(i => rank[i]);
  let ok = new Set(seq).size === n;
  for (let k = 0; k < n; k += 2) if (Math.abs(steps[k] - steps[k + 1]) !== n / 2) ok = false;
  check(ok, `star order ${n} lugs: each step crosses to the opposite lug`);
}

console.log(failures ? `\n${failures} FAILED` : '\nall checks passed');
