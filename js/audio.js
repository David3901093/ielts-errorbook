/* ============================================================
   audio.js — pronunciation via Web Speech API (speechSynthesis),
   with a fallback to Dictionary API audio clips.
   Respects the global sound setting from Store.
   ============================================================ */

const Audio2 = {
  _voice: null,

  /* Pick a good English voice once voices load. */
  init() {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return;
      // prefer en-GB / en-US natural voices
      Audio2._voice =
        voices.find(v => /en-GB/i.test(v.lang) && /female|natural|samantha/i.test(v.name)) ||
        voices.find(v => /en-GB/i.test(v.lang)) ||
        voices.find(v => /en-US/i.test(v.lang)) ||
        voices.find(v => /^en/i.test(v.lang)) || voices[0];
    };
    pick();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = pick;
    }
  },

  enabled() {
    return window.Store.getSettings().sound !== false;
  },

  /* Speak a word/phrase using the browser TTS. */
  speak(text) {
    if (!text || !this.enabled() || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = 0.92;
      u.pitch = 1;
      if (this._voice) u.voice = this._voice;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  },

  /* Try API audio clip first, fall back to TTS. */
  async speakWord(word) {
    if (!this.enabled()) return;
    // Attempt real-audio from Dictionary API
    try {
      const data = await window.DictAPI.fetch(word);
      if (data && data.audio) {
        const a = new Audio(data.audio.startsWith('//') ? 'https:' + data.audio : data.audio);
        a.onerror = () => this.speak(word);
        a.oncanplaythrough = () => a.play().catch(() => this.speak(word));
        // safety: if it neither loads nor errors, TTS after 1.2s
        setTimeout(() => { if (a.readyState === 0) this.speak(word); }, 1200);
        return;
      }
    } catch (e) { /* fall through */ }
    this.speak(word);
  },

  toggle() {
    const s = window.Store.getSettings();
    s.sound = s.sound === false;
    window.Store.saveSettings(s);
    return s.sound;
  }
};

window.Audio2 = Audio2;
