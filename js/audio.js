/* ============================================================
   audio.js — pronunciation with broad mobile compatibility.
   Strategy (most reliable first on HarmonyOS/移动端):
     1. Dictionary API real-human audio via <audio> element
        (mobile browsers play <audio> from a user gesture reliably)
     2. Web Speech API (speechSynthesis) as fallback
     3. Silent graceful degradation (never throw / never block learning)
   Also unlocks the Web Audio context on first user gesture so later
   speech calls are not blocked by mobile autoplay policies.
   ============================================================ */

const Audio2 = {
  _voice: null,
  _unlocked: false,
  _ttsAvailable: true,
  _audioCache: new Map(),   // word -> {url, status} to avoid refetching

  /* Pick a voice once voices load. Some mobile browsers (HarmonyOS) never
     fire onvoiceschanged and report no voices — we tolerate that and still
     try speechSynthesis (it may use a system default voice). */
  init() {
    if (!('speechSynthesis' in window)) {
      this._ttsAvailable = false;
      return;
    }
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
    try {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = pick;
      }
    } catch (e) { /* ignore */ }

    // unlock on first user interaction (mobile autoplay policy)
    this._setupUnlock();
  },

  /* Resume/unlock audio on the first tap anywhere. Mobile browsers require
     playback to originate from a user gesture; this primes the context. */
  _setupUnlock() {
    if (this._unlocked) return;
    const unlock = () => {
      this._unlocked = true;
      // a tiny no-op speech primes speechSynthesis on some mobile browsers
      try {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(' ');
          u.volume = 0; u.rate = 9;
          speechSynthesis.speak(u);
        }
      } catch (e) { /* ignore */ }
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { once: false, passive: true });
    document.addEventListener('click', unlock, { once: false, passive: true });
  },

  enabled() {
    return window.Store.getSettings().sound !== false;
  },

  toggle() {
    const s = window.Store.getSettings();
    s.sound = s.sound === false;
    window.Store.saveSettings(s);
    return s.sound;
  },

  /* Speak arbitrary text (a sentence/phrase) via Web Speech TTS. */
  speak(text) {
    if (!text || !this.enabled() || !this._ttsAvailable) return false;
    if (!('speechSynthesis' in window)) return false;
    try {
      // cancel anything queued (some mobile browsers stack utterances)
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = 0.92;
      u.pitch = 1;
      if (this._voice) u.voice = this._voice;
      speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  },

  /* Play a single word/phrase. Prefer the dictionary API's real-human audio
     (works well on HarmonyOS via <audio>), then fall back to TTS. */
  async speakWord(word) {
    if (!word || !this.enabled()) return;

    // 1) try real-human audio from the dictionary API
    const played = await this._playApiAudio(word);
    if (played) return;

    // 2) fall back to TTS
    if (this.speak(word)) return;

    // 3) nothing worked — silent. (Never alert/throw on mobile.)
  },

  /* Fetch the API audio URL (cached) and play via an <audio> element. */
  async _playApiAudio(word) {
    const key = word.toLowerCase().trim();
    if (!key) return false;
    let entry = this._audioCache.get(key);
    if (entry === undefined) {
      try {
        const data = await window.DictAPI.fetch(word);
        entry = (data && data.audio) ? data.audio : null;
      } catch (e) {
        entry = null;
      }
      this._audioCache.set(key, entry);
    }
    const url = entry;
    if (!url) return false;
    const full = url.startsWith('//') ? 'https:' + url : url;
    return new Promise(resolve => {
      try {
        const a = new Audio(full);
        let settled = false;
        const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
        a.onended = () => done(true);
        a.onerror = () => done(false);
        // safety timeout: if it neither plays nor errors, resolve false
        setTimeout(() => done(false), 4000);
        // some mobile browsers return a promise from play()
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {/* playing */}).catch(() => done(false));
        }
      } catch (e) {
        resolve(false);
      }
    });
  }
};

window.Audio2 = Audio2;
