/* ============================================================
   store.js — localStorage data layer
   Keys: errorBank, phraseBank, customSentences, progress, settings
   ============================================================ */

const KEY = {
  errorBank:      'ieb_errorBank',
  phraseBank:     'ieb_phraseBank',
  customSentences:'ieb_customSentences',  // student-added example sentences
  progress:       'ieb_progress',         // { totalScore, days: { YYYY-MM-DD: {...} }, lastVisit }
  settings:       'ieb_settings'          // { sound: true, seeded: false }
};

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('store read failed', key, e);
    return fallback;
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn('store write failed', key, e); }
}

const Store = {
  /* ---------- Error Bank ---------- */
  getErrors() { return read(KEY.errorBank, []); },
  saveErrors(arr) { write(KEY.errorBank, arr); },
  addError(entry) {
    // entry: { en, cn, misspelled?, added, correctCount, wrongCount, mastered }
    const arr = Store.getErrors();
    const key = entry.en.toLowerCase();
    if (arr.some(w => w.en.toLowerCase() === key)) return false; // duplicate
    arr.push({ correctCount: 0, wrongCount: 0, mastered: false, added: todayKey(), ...entry });
    Store.saveErrors(arr);
    return true;
  },
  removeError(en) {
    Store.saveErrors(Store.getErrors().filter(w => w.en.toLowerCase() !== en.toLowerCase()));
  },
  setErrorField(en, patch) {
    const arr = Store.getErrors();
    const i = arr.findIndex(w => w.en.toLowerCase() === en.toLowerCase());
    if (i >= 0) { arr[i] = { ...arr[i], ...patch }; Store.saveErrors(arr); }
  },

  /* ---------- Phrase Bank (CN→EN) ---------- */
  getPhrases() {
    const custom = read(KEY.phraseBank, []);
    // built-in + custom
    return [...window.IELTS.PHRASES, ...custom];
  },
  getCustomPhrases() { return read(KEY.phraseBank, []); },
  addPhrase(entry) {
    const arr = read(KEY.phraseBank, []);
    const key = entry.en.toLowerCase();
    if (arr.some(p => p.en.toLowerCase() === key)) return false;
    arr.push({ ...entry, added: todayKey() });
    write(KEY.phraseBank, arr);
    return true;
  },
  removePhrase(en) {
    write(KEY.phraseBank, Store.getCustomPhrases().filter(p => p.en.toLowerCase() !== en.toLowerCase()));
  },

  /* ---------- Custom example sentences ---------- */
  getSentences(word) {
    const all = read(KEY.customSentences, {});
    return all[word.toLowerCase()] || [];
  },
  addSentence(word, sentence) {
    const all = read(KEY.customSentences, {});
    const key = word.toLowerCase();
    if (!all[key]) all[key] = [];
    if (!all[key].includes(sentence)) all[key].push(sentence);
    write(KEY.customSentences, all);
  },

  /* ---------- Progress / Scoring ---------- */
  getProgress() {
    const def = { totalScore: 0, days: {}, lastVisit: null, streak: 0, longestStreak: 0 };
    return read(KEY.progress, def);
  },
  saveProgress(p) { write(KEY.progress, p); },

  getDay(dateKey = todayKey()) {
    const p = Store.getProgress();
    if (!p.days[dateKey]) {
      p.days[dateKey] = {
        score: 0, correct: 0, wrong: 0,
        wordsAdded: 0, wordsReviewed: 0,
        reviewDone: false, dictationDone: 0, cnEnDone: 0,
        failed: false
      };
      Store.saveProgress(p);
    }
    return p.days[dateKey];
  },

  /* Apply a scoring event (+1 / -3) to today and total. */
  recordAnswer(correct, today = todayKey()) {
    const p = Store.getProgress();
    if (!p.days[today]) p.days[today] = Store.getDay(today);
    const d = p.days[today];
    const delta = correct ? 1 : -3;
    d.score += delta;
    p.totalScore += delta;
    if (correct) d.correct++; else d.wrong++;
    if (d.score < 0) d.failed = true;
    Store.saveProgress(p);
    return { delta, dayScore: d.score, totalScore: p.totalScore };
  },

  /* Increment counters for today (no score). */
  bump(field, n = 1, today = todayKey()) {
    const p = Store.getProgress();
    if (!p.days[today]) p.days[today] = Store.getDay(today);
    p.days[today][field] = (p.days[today][field] || 0) + n;
    Store.saveProgress(p);
  },

  setDayField(field, value, today = todayKey()) {
    const p = Store.getProgress();
    if (!p.days[today]) p.days[today] = Store.getDay(today);
    p.days[today][field] = value;
    Store.saveProgress(p);
  },

  /* Streak: increments on first visit of a new calendar day. */
  touchVisit() {
    const p = Store.getProgress();
    const today = todayKey();
    Store.getDay(today); // ensure day exists
    if (p.lastVisit !== today) {
      const yesterday = todayKey(new Date(Date.now() - 86400000));
      p.streak = (p.lastVisit === yesterday) ? (p.streak || 0) + 1 : 1;
      p.longestStreak = Math.max(p.longestStreak || 0, p.streak);
      p.lastVisit = today;
      Store.saveProgress(p);
    }
    return p;
  },

  /* All days as sorted array of [dateKey, dayData] */
  getDayList() {
    const p = Store.getProgress();
    return Object.entries(p.days).sort((a, b) => a[0].localeCompare(b[0]));
  },

  /* ---------- Settings ---------- */
  getSettings() { return read(KEY.settings, { sound: true, seeded: false }); },
  saveSettings(s) { write(KEY.settings, s); },

  /* ---------- Seed error bank (idempotent merge) ----------
     Always ensures every built-in red-word seed exists, without
     duplicating or overwriting student-added data. New seeds added in
     later versions are back-filled for existing users too. */
  seedIfFirstRun() {
    const existing = Store.getErrors();
    let added = false;
    window.IELTS.SEED_ERRORS.forEach(e => {
      if (!existing.some(w => w.en.toLowerCase() === e.en.toLowerCase())) {
        existing.push({
          en: e.en, cn: e.cn, misspelled: e.misspelled,
          correctCount: 0, wrongCount: 0, mastered: false,
          added: todayKey(), seeded: true
        });
        added = true;
      }
    });
    if (added) Store.saveErrors(existing);
    const s = Store.getSettings();
    if (!s.seeded) { s.seeded = true; Store.saveSettings(s); }
  },

  /* ---------- Export / import / reset ---------- */
  exportAll() {
    return {
      errorBank: Store.getErrors(),
      phraseBank: Store.getCustomPhrases(),
      customSentences: read(KEY.customSentences, {}),
      progress: Store.getProgress(),
      settings: Store.getSettings(),
      exportedAt: new Date().toISOString()
    };
  },
  resetAll() {
    Object.values(KEY).forEach(k => localStorage.removeItem(k));
  }
};

window.Store = Store;
window.todayKey = todayKey;
