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

  /* Speak arbitrary text via Web Speech TTS. Returns true if attempted. */
  speak(text) {
    if (!text || !this.enabled() || !this._ttsAvailable) {
      Diag.log('audio', 'speak() skipped', { reason: !text ? 'empty' : !this.enabled() ? 'disabled' : 'no TTS' });
      return false;
    }
    if (!('speechSynthesis' in window)) {
      Diag.log('audio', 'speak() no speechSynthesis');
      return false;
    }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = 0.92; u.pitch = 1;
      if (this._voice) u.voice = this._voice;
      u.onstart = () => Diag.log('audio', 'TTS started', { text: text.slice(0, 40) });
      u.onend = () => Diag.log('audio', 'TTS ended', { text: text.slice(0, 40) });
      u.onerror = (ev) => Diag.log('audio', 'TTS error event', { error: ev.error || 'unknown', text: text.slice(0, 40) });
      speechSynthesis.speak(u);
      Diag.log('audio', 'speak() queued', { text: text.slice(0, 40), hasVoice: !!this._voice });
      return true;
    } catch (e) {
      Diag.log('audio', 'speak() threw', String(e));
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
  _playUrl(url, word, source) {
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
        setTimeout(() => done(false, { event: 'timeout' }), 5000);
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
