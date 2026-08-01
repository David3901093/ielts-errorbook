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

  /* Normalise the API response into a compact shape.
     Scan ALL entries (not just entries[0]) for audio — e.g. "ferry" stores
     its audio URL in the 3rd phonetics entry of a later entry. */
  parse(entries) {
    if (!Array.isArray(entries) || !entries.length) return null;
    const e = entries[0];

    // audio: search every entry's every phonetics for the first non-empty URL
    let audio = '';
    for (const ent of entries) {
      const found = (ent.phonetics || []).map(p => p.audio).filter(Boolean)[0];
      if (found) { audio = found; break; }
    }

    const phonetics = (e.phonetics || []).filter(p => p.text);
    const phon = phonetics.length ? phonetics[0].text : (e.phonetic || '');

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
  },

  /* Search for phrases/collocations containing a word.
     Uses the pre-built local phrase bank (window.__PHRASES, ~18000 entries
     from ECDICT with Chinese translations). Falls back to API only if the
     local bank is empty. Results are cached. */
  async searchPhrases(word) {
    const key = (word || '').toLowerCase().trim();
    if (!key) return [];
    const cached = window.Store.getPhraseCache(key);
    if (cached && cached.phrases) return cached.phrases;

    let phrases = [];
    // 1) local pre-built phrase bank (primary — has Chinese translations)
    const localBank = window.__PHRASES || [];
    if (localBank.length) {
      phrases = localBank
        .filter(p => p.en.toLowerCase().includes(key))
        .slice(0, 12);
    }
    // 2) if local bank has no matches, try dictionary API as fallback
    if (!phrases.length) {
      try {
        const data = await DictAPI.fetch(key);
        if (data && data.examples && data.examples.length) {
          data.examples.forEach(ex => {
            const words = ex.toLowerCase().match(/[a-z]+/g) || [];
            for (let i = 0; i < words.length - 1; i++) {
              if (words[i] === key || words[i + 1] === key) {
                const phrase = words.slice(i, i + 3).join(' ');
                if (phrase.split(' ').length >= 2 && !phrases.some(p => p.en === phrase)) {
                  phrases.push({ en: phrase, cn: '' });
                }
              }
            }
          });
        }
      } catch (e) { /* silent */ }
    }
    const result = phrases.slice(0, 12);
    window.Store.setPhraseCache(key, result);
    return result;
  }
};

window.DictAPI = DictAPI;
