/* ============================================================
   api.js — free Dictionary API (dictionaryapi.dev) wrapper.
   Free, no key, CORS-friendly. Silent degradation on failure.
   ============================================================ */

const DICT_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

/* In-memory cache to avoid repeat lookups / rate limits. */
const _apiCache = new Map();

const DictAPI = {
  /* Fetch a word's full entry. Returns null on any failure (silent). */
  async fetch(word) {
    const key = (word || '').toLowerCase().trim();
    if (!key) return null;
    if (_apiCache.has(key)) return _apiCache.get(key);

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(DICT_ENDPOINT + encodeURIComponent(key), { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        _apiCache.set(key, null);
        return null;
      }
      const data = await res.json();
      const parsed = DictAPI.parse(data);
      _apiCache.set(key, parsed);
      return parsed;
    } catch (e) {
      // network error / timeout / abort → silent degrade
      _apiCache.set(key, null);
      return null;
    }
  },

  /* Normalise the API response into a compact shape. */
  parse(entries) {
    if (!Array.isArray(entries) || !entries.length) return null;
    const e = entries[0];
    const phonetics = (e.phonetics || []).filter(p => p.text);
    const phon = phonetics.length ? phonetics[0].text : (e.phonetic || '');
    const audio = (e.phonetics || []).map(p => p.audio).filter(Boolean)[0] || '';

    const meanings = (e.meanings || []).map(m => ({
      partOfSpeech: m.partOfSpeech || '',
      definitions: (m.definitions || []).map(d => ({
        definition: d.definition || '',
        example: d.example || ''
      })),
      synonyms: m.synonyms || [],
      antonyms: m.antonyms || []
    }));

    const definitions = meanings.flatMap(m =>
      m.definitions.map(d => ({ pos: m.partOfSpeech, ...d }))
    );
    const examples = definitions.map(d => d.example).filter(Boolean);
    const synonyms = [...new Set(meanings.flatMap(m => m.synonyms))].slice(0, 8);
    const antonyms = [...new Set(meanings.flatMap(m => m.antonyms))].slice(0, 8);
    const origin = e.origin || '';

    return { word: e.word, phon, audio, definitions, examples, synonyms, antonyms, origin };
  }
};

window.DictAPI = DictAPI;
