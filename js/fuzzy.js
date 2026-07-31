/* ============================================================
   fuzzy.js — Levenshtein distance + spelling suggestions
   Used by Error Bank: student types misspelled word → suggest
   closest correct word from IELTS bank → student confirms.
   ============================================================ */

/* Classic Levenshtein edit distance (insert/delete/substitute). */
function levenshtein(a, b) {
  a = (a || '').toLowerCase();
  b = (b || '').toLowerCase();
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/* Similarity ratio 0..1. */
function similarity(a, b) {
  const d = levenshtein(a, b);
  const max = Math.max((a || '').length, (b || '').length, 1);
  return 1 - d / max;
}

const Fuzzy = {
  levenshtein,
  similarity,

  /* Returns best candidate from a list of words, or null if none close enough.
     threshold = max edit distance to accept (default scales with length). */
  suggest(typed, candidates, opts = {}) {
    if (!typed) return null;
    const list = candidates || [];
    let best = null;
    let bestDist = Infinity;
    const len = typed.length;
    const maxDist = opts.maxDist ?? (len <= 4 ? 1 : len <= 7 ? 2 : 3);
    for (const c of list) {
      const d = levenshtein(typed, c);
      if (d < bestDist && d <= maxDist) {
        bestDist = d;
        best = c;
      }
    }
    return best ? { word: best, distance: bestDist, ratio: similarity(typed, best) } : null;
  },

  /* Suggestions from built-in bank (correct spellings). */
  suggestFromBank(typed) {
    const candidates = window.IELTS.BANK.map(w => w.en);
    return Fuzzy.suggest(typed, candidates);
  }
};

window.Fuzzy = Fuzzy;
