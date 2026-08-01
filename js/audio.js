/* ============================================================
   audio.js - pronunciation with mobile compatibility.
   Word pronunciation: howjsay CDN -> dictionaryapi.dev -> system TTS.
   Sentence pronunciation: system TTS (if voices) -> MeSpeak (in-browser)
     -> online TTS -> toast notice (HarmonyOS has no TTS engine).
   Single-stream: any new playback stops the previous one first.
   ============================================================ */

const Audio2 = {
  _voice: null,
  _unlocked: false,
  _ttsAvailable: true,
  _audioCache: new Map(),
  _currentAudio: null,

  init() {
    const hasSS = ('speechSynthesis' in window);
    if (!hasSS) { this._ttsAvailable = false; return; }
    const pick = () => {
      let voices = [];
      try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
      if (!voices.length) return;
      this._voice =
        voices.find(v => /en-GB/i.test(v.lang) && /female|natural|samantha/i.test(v.name)) ||
        voices.find(v => /en-GB/i.test(v.lang)) ||
        voices.find(v => /en-US/i.test(v.lang)) ||
        voices.find(v => /^en/i.test(v.lang)) || voices[0];
    };
    pick();
    try { if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = pick; } catch (e) { /* ignore */ }
    this._setupUnlock();
    // warm up MeSpeak if no system voices (HarmonyOS)
    let vc = 0; try { vc = (speechSynthesis.getVoices() || []).length; } catch (e) {}
    if (vc === 0 && window.TTS) window.TTS.ensureLoaded();
  },

  _setupUnlock() {
    if (this._unlocked) return;
    const unlock = () => {
      this._unlocked = true;
      try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.rate = 9; speechSynthesis.speak(u); } } catch (e) { /* ignore */ }
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
    return s.sound;
  },

  _stopCurrent() {
    if (this._currentAudio) {
      try { this._currentAudio.pause(); this._currentAudio.src = ''; } catch (e) { /* ignore */ }
      this._currentAudio = null;
    }
    if (window.TTS) window.TTS.stop();
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  },

  /* ---- Sentence speech ---- */
  async speak(text) {
    if (!text || !this.enabled()) return false;
    this._stopCurrent();
    let voiceCount = 0;
    try { voiceCount = (speechSynthesis.getVoices() || []).length; } catch (e) { voiceCount = 0; }

    // 1) system speechSynthesis (Windows/Mac/Android)
    if (voiceCount > 0 && this._systemTts(text)) return true;
    // 2) MeSpeak in-browser TTS (no system voices needed)
    if (voiceCount === 0 && window.TTS) {
      const ok = await this._ttsWithTimeout(text, 6000);
      if (ok) return true;
    }
    // 3) online sentence TTS (StreamElements -> Google)
    if (await this._playSentence(text)) return true;
    // 4) no fluent TTS available -> toast notice
    window._showAudioToast && window._showAudioToast();
    return false;
  },

  async _ttsWithTimeout(text, timeoutMs) {
    try {
      const r = await Promise.race([
        window.TTS.speak(text),
        new Promise(resolve => setTimeout(() => resolve('__timeout__'), timeoutMs))
      ]);
      return r !== '__timeout__' && !!r;
    } catch (e) { return false; }
  },

  _sentenceTtsUrls(text) {
    const enc = encodeURIComponent(text);
    return [
      'https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=' + enc,
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(text.slice(0, 200))
    ];
  },

  async _playSentence(text) {
    const cacheKey = 'ieb_tts_' + text.slice(0, 60);
    const cached = (() => { try { return localStorage.getItem(cacheKey); } catch (e) { return null; } })();
    const urls = cached ? [cached] : this._sentenceTtsUrls(text);
    for (const url of urls) {
      if (await this._playUrl(url, text.slice(0, 40), 'sentence')) {
        if (!cached) { try { localStorage.setItem(cacheKey, url); } catch (e) { /* quota */ } }
        return true;
      }
    }
    return false;
  },

  _systemTts(text) {
    if (!this._ttsAvailable || !('speechSynthesis' in window)) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB'; u.rate = 0.92; u.pitch = 1;
      if (this._voice) u.voice = this._voice;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  },

  /* ---- Single word speech ---- */
  async speakWord(word) {
    if (!word || !this.enabled()) return;
    this._stopCurrent();
    // 1) howjsay CDN
    const howjsay = 'https://d1qx7pbj0dvboc.cloudfront.net/' + encodeURIComponent(word.toLowerCase().trim()) + '.mp3';
    if (await this._playUrl(howjsay, word, 'howjsay')) return;
    // 2) dictionaryapi.dev
    if (await this._playApiAudio(word)) return;
    // 3) system TTS
    this._systemTts(word);
  },

  /* Play a direct audio URL. Strict single-stream: stops previous, cleans up on failure. */
  _playUrl(url, word, source, timeoutMs) {
    return new Promise(resolve => {
      try {
        this._stopCurrent();
        const a = new Audio(url);
        this._currentAudio = a;
        let settled = false, timer = null;
        const done = (ok) => {
          if (settled) return; settled = true;
          if (timer) clearTimeout(timer);
          if (!ok) { try { a.pause(); a.src = ''; } catch (e) { /* ignore */ } }
          if (this._currentAudio === a) this._currentAudio = null;
          resolve(ok);
        };
        a.onended = () => done(true);
        a.onerror = () => done(false);
        timer = setTimeout(() => done(false), timeoutMs || 5000);
        const p = a.play();
        if (p && typeof p.then === 'function') p.catch(() => done(false));
      } catch (e) { resolve(false); }
    });
  },

  async _playApiAudio(word) {
    const key = word.toLowerCase().trim();
    if (!key) return false;
    let entry = this._audioCache.get(key);
    if (entry === undefined) {
      try {
        const data = await window.DictAPI.fetch(word);
        entry = (data && data.audio) ? data.audio : null;
      } catch (e) { entry = null; }
      this._audioCache.set(key, entry);
    }
    if (!entry) return false;
    const full = entry.startsWith('//') ? 'https:' + entry : entry;
    return this._playUrl(full, word, 'dictapi');
  }
};

window.Audio2 = Audio2;
