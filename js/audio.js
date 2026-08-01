/* ============================================================
   audio.js — pronunciation with broad mobile compatibility + logging.
   Every playback attempt is logged via Diag so on-device failures
   (e.g. HarmonyOS) can be diagnosed from the exported log.

   Strategy:
     1. Dictionary API real-human audio via <audio> (mobile-friendly)
     2. Web Speech API (speechSynthesis) fallback
     3. Silent graceful degradation (logs the reason, never throws)
   ============================================================ */

const Audio2 = {
  _voice: null,
  _unlocked: false,
  _ttsAvailable: true,
  _audioCache: new Map(),

  init() {
    const hasSS = ('speechSynthesis' in window);
    Diag.log('audio', 'init() called', { hasSpeechSynthesis: hasSS });
    if (!hasSS) {
      this._ttsAvailable = false;
      Diag.log('audio', 'speechSynthesis NOT available — TTS disabled');
      return;
    }
    const pick = () => {
      let voices = [];
      try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
      Diag.log('audio', 'voices available', { count: voices.length, sample: voices.slice(0, 5).map(v => v.name + '/' + v.lang) });
      if (!voices.length) return;
      this._voice =
        voices.find(v => /en-GB/i.test(v.lang) && /female|natural|samantha/i.test(v.name)) ||
        voices.find(v => /en-GB/i.test(v.lang)) ||
        voices.find(v => /en-US/i.test(v.lang)) ||
        voices.find(v => /^en/i.test(v.lang)) || voices[0];
      Diag.log('audio', 'selected voice', this._voice ? { name: this._voice.name, lang: this._voice.lang } : 'none');
    };
    pick();
    try {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = pick;
      }
    } catch (e) { Diag.log('audio', 'onvoiceschanged setup error', String(e)); }
    this._setupUnlock();
    // if no system voices (e.g. HarmonyOS), warm up MeSpeak in the background
    // so it's ready when the user first taps a sentence.
    let vc = 0; try { vc = (speechSynthesis.getVoices() || []).length; } catch (e) {}
    if (vc === 0 && window.TTS) {
      Diag.log('audio', 'no system voices — preloading MeSpeak in background');
      window.TTS.ensureLoaded();
    }
  },

  /* Prime audio context on first user gesture (mobile autoplay policy). */
  _setupUnlock() {
    if (this._unlocked) return;
    const unlock = () => {
      this._unlocked = true;
      Diag.log('audio', 'context unlocked by user gesture', { event: 'touch/click' });
      try {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(' ');
          u.volume = 0; u.rate = 9;
          speechSynthesis.speak(u);
        }
      } catch (e) { Diag.log('audio', 'unlock speak error', String(e)); }
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { once: false, passive: true });
    document.addEventListener('click', unlock, { once: false, passive: true });
  },

  enabled() { return window.Store.getSettings().sound !== false; },

  toggle() {
    const s = window.Store.getSettings();
    s.sound = s.sound === false;
    window.Store.saveSettings(s);
    Diag.log('audio', 'sound toggled', { enabled: s.sound });
    return s.sound;
  },

  /* Speak arbitrary text (a sentence). Smart routing:
     - If the OS has TTS voices → use system speechSynthesis (fast, natural)
     - If no voices (HarmonyOS) → MeSpeak in-browser synthesis (fluent, robotic)
     - Then online TTS, then word-by-word as further fallbacks */
  async speak(text) {
    if (!text || !this.enabled()) {
      Diag.log('audio', 'speak() skipped', { reason: !text ? 'empty' : 'disabled' });
      return false;
    }
    // detect whether the OS provides any TTS voices
    let voiceCount = 0;
    try { voiceCount = (speechSynthesis.getVoices() || []).length; } catch (e) { voiceCount = 0; }
    Diag.log('audio', 'speak() routing', { text: text.slice(0, 30), systemVoices: voiceCount });

    // 1) system speechSynthesis when voices exist (Windows/Mac/Android — fast & natural)
    if (voiceCount > 0 && this._systemTts(text)) return true;

    // 2) MeSpeak in-browser TTS (HarmonyOS — no system voices, fluent synthesis)
    if (voiceCount === 0 && window.TTS) {
      const ok = await this._ttsWithTimeout(text, 6000);
      if (ok) return true;
    }
    // 3) whole-sentence online TTS (StreamElements → Google)
    if (await this._playSentence(text)) return true;
    // 4) word-by-word audio (howjsay → Youdao)
    Diag.log('audio', 'fluent TTS unavailable, trying word-by-word audio', { text: text.slice(0, 40) });
    if (await this._playWordByWord(text)) return true;
    // 5) system speechSynthesis last resort (in case voiceCount detection was wrong)
    Diag.log('audio', 'all methods failed, trying system speechSynthesis', { text: text.slice(0, 40) });
    return this._systemTts(text);
  },

  /* Call MeSpeak.speak() but give up after timeoutMs (config/voice load can hang
     on slow networks like HarmonyOS mobile). Returns true if it spoke. */
  async _ttsWithTimeout(text, timeoutMs) {
    try {
      const result = await Promise.race([
        window.TTS.speak(text),
        new Promise(resolve => setTimeout(() => resolve('__timeout__'), timeoutMs))
      ]);
      if (result === '__timeout__') {
        Diag.log('audio', 'MeSpeak timed out (config/voice load too slow)', { ms: timeoutMs });
        return false;
      }
      return !!result;
    } catch (e) {
      Diag.log('audio', 'MeSpeak error', String(e));
      return false;
    }
  },

  /* Last-resort sentence reader for HarmonyOS: split the sentence into words
     and play each word's audio (howjsay → Youdao) sequentially. Skips
     punctuation. Works because single-word CDN audio plays fine there. */
  async _playWordByWord(text) {
    const words = (text.match(/[a-zA-Z'-]+/g) || []).filter(w => w.length > 1);
    if (!words.length) return false;
    Diag.log('audio', 'word-by-word: starting', { count: words.length, words: words.slice(0, 8).join(' ') });
    let playedAny = false;
    for (const w of words) {
      // try howjsay first, then youdao
      const urls = [
        'https://d1qx7pbj0dvboc.cloudfront.net/' + encodeURIComponent(w.toLowerCase()) + '.mp3',
        'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(w.toLowerCase()) + '&type=2'
      ];
      let wordOk = false;
      for (const url of urls) {
        if (await this._playUrl(url, w, 'wordconcat', 2500)) { wordOk = true; break; }
      }
      if (wordOk) playedAny = true;
      // brief gap between words for clarity
      await new Promise(r => setTimeout(r, 120));
    }
    Diag.log('audio', 'word-by-word: done', { playedAny });
    return playedAny;
  },

  /* Build TTS URLs for a sentence (no key needed, played via <audio src>). */
  _sentenceTtsUrls(text) {
    const enc = encodeURIComponent(text);
    return [
      // StreamElements (Polly voice "Brian" UK male) — primary
      'https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=' + enc,
      // Google Translate TTS — fallback (needs client=tw-ob; 200-char limit)
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(text.slice(0, 200))
    ];
  },

  /* Try each sentence-TTS URL via <audio src> until one plays. Cached in localStorage. */
  async _playSentence(text) {
    const cacheKey = 'ieb_tts_' + text.slice(0, 60);
    // if we previously found a working URL for this text, try it first
    const cached = (() => { try { return localStorage.getItem(cacheKey); } catch (e) { return null; } })();
    const urls = cached ? [cached] : this._sentenceTtsUrls(text);
    for (const url of urls) {
      Diag.log('audio', 'trying sentence TTS', { source: url.includes('streamelements') ? 'StreamElements' : 'Google', text: text.slice(0, 40) });
      const ok = await this._playUrl(url, text.slice(0, 40), 'sentence');
      if (ok) {
        // cache the winning URL for next time (SE has rate limits)
        if (!cached) { try { localStorage.setItem(cacheKey, url); } catch (e) { /* quota */ } }
        return true;
      }
    }
    return false;
  },

  /* Browser built-in speechSynthesis (last resort — fails on HarmonyOS). */
  _systemTts(text) {
    if (!this._ttsAvailable || !('speechSynthesis' in window)) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB'; u.rate = 0.92; u.pitch = 1;
      if (this._voice) u.voice = this._voice;
      u.onstart = () => Diag.log('audio', 'system TTS started', { text: text.slice(0, 40) });
      u.onend = () => Diag.log('audio', 'system TTS ended', { text: text.slice(0, 40) });
      u.onerror = (ev) => Diag.log('audio', 'system TTS error event', { error: ev.error || 'unknown', text: text.slice(0, 40) });
      speechSynthesis.speak(u);
      Diag.log('audio', 'system TTS queued', { text: text.slice(0, 40), hasVoice: !!this._voice });
      return true;
    } catch (e) {
      Diag.log('audio', 'system TTS threw', String(e));
      return false;
    }
  },

  /* Speak a single word. Order of attempts (most reliable on HarmonyOS first):
     1. howjsay CloudFront CDN  (plain <audio src>, 99% coverage, no CORS/fetch needed)
     2. dictionaryapi.dev audio (fixed: scans all phonetics entries)
     3. Web Speech TTS           (last resort — fails on HarmonyOS, but works elsewhere) */
  async speakWord(word) {
    Diag.log('audio', 'speakWord() requested', { word, enabled: this.enabled(), unlocked: this._unlocked });
    if (!word || !this.enabled()) {
      Diag.log('audio', 'speakWord aborted', { reason: !word ? 'empty word' : 'sound disabled' });
      return;
    }

    // 1) howjsay CDN — direct mp3, lowercase, multi-word → %20
    const howjsay = 'https://d1qx7pbj0dvboc.cloudfront.net/' +
      encodeURIComponent(word.toLowerCase().trim()) + '.mp3';
    Diag.log('audio', 'trying howjsay CDN', { word, url: howjsay });
    if (await this._playUrl(howjsay, word, 'howjsay')) return;

    // 2) dictionaryapi.dev (fixed parse)
    Diag.log('audio', 'trying dictionaryapi.dev', { word });
    if (await this._playApiAudio(word)) return;

    // 3) TTS fallback
    Diag.log('audio', 'falling back to TTS', { word });
    if (this.speak(word)) return;
    Diag.log('audio', 'ALL play methods failed', { word });
  },

  /* Play a direct audio URL via <audio> element. Resolves true if it played. */
  _playUrl(url, word, source, timeoutMs) {
    return new Promise(resolve => {
      try {
        const a = new Audio(url);
        let settled = false;
        const done = (ok, info) => {
          if (settled) return; settled = true;
          Diag.log('audio', `<audio:${source}> outcome`, { word, ok, ...info });
          resolve(ok);
        };
        a.onended = () => done(true, { event: 'ended' });
        a.onerror = () => done(false, { event: 'error', code: a.error ? a.error.code : 'n/a' });
        setTimeout(() => done(false, { event: 'timeout' }), timeoutMs || 5000);
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => Diag.log('audio', `<audio:${source}> play() resolved`, { word }))
           .catch(err => done(false, { event: 'play() rejected', message: String(err && err.message || err), name: String(err && err.name || '') }));
        }
      } catch (e) {
        Diag.log('audio', `<audio:${source}> threw`, { word, error: String(e) });
        resolve(false);
      }
    });
  },

  /* Fetch + play the dictionary API audio via <audio>. */
  async _playApiAudio(word) {
    const key = word.toLowerCase().trim();
    if (!key) return false;
    let entry = this._audioCache.get(key);
    if (entry === undefined) {
      Diag.log('audio', 'fetching dictionaryapi.dev audio url', { word });
      try {
        const data = await window.DictAPI.fetch(word);
        entry = (data && data.audio) ? data.audio : null;
        Diag.log('audio', 'dictionaryapi.dev audio url', { word, found: !!entry, url: entry || '' });
      } catch (e) {
        Diag.log('audio', 'dictionaryapi.dev fetch error', { word, error: String(e) });
        entry = null;
      }
      this._audioCache.set(key, entry);
    }
    const url = entry;
    if (!url) return false;
    const full = url.startsWith('//') ? 'https:' + url : url;
    return this._playUrl(full, word, 'dictapi');
  }
};

window.Audio2 = Audio2;
