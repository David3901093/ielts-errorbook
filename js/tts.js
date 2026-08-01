/* ============================================================
   tts.js - Pure client-side sentence TTS via MeSpeak.js (eSpeak).
   Synthesizes fluent whole-sentence speech in the browser using Web Audio
   API. Does NOT depend on OS speechSynthesis voices - works on HarmonyOS.
   Logs to console only (no external logging dependency).
   ============================================================ */

const MS_BASE = 'https://cdn.jsdelivr.net/npm/mespeak@1.9.6';

const TTS = {
  _state: 'idle',
  _ready: false,
  _loadPromise: null,

  ensureLoaded() {
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = this._load();
    return this._loadPromise;
  },

  _load() {
    return new Promise(resolve => {
      console.log('[tts] loading MeSpeak engine');
      this._state = 'loading';
      const s = document.createElement('script');
      s.src = MS_BASE + '/mespeak.full.min.js';
      s.onload = () => {
        if (typeof meSpeak === 'undefined') {
          console.warn('[tts] meSpeak undefined after load');
          this._state = 'error';
          return resolve(false);
        }
        console.log('[tts] engine loaded, loading config');
        let cfgDone = false;
        const cfgTimer = setTimeout(() => {
          if (!cfgDone) {
            console.warn('[tts] config load timed out');
            this._state = 'error';
            resolve(false);
          }
        }, 8000);
        meSpeak.loadConfig(MS_BASE + '/mespeak_config.json', (ok, msg) => {
          if (cfgDone) return;
          cfgDone = true;
          clearTimeout(cfgTimer);
          if (!ok) { console.warn('[tts] config failed', msg); this._state = 'error'; return resolve(false); }
          console.log('[tts] config loaded, loading voice');
          meSpeak.loadVoice(MS_BASE + '/voices/en/en-us.json', (vok, vmsg) => {
            if (!vok) { console.warn('[tts] voice failed', vmsg); this._state = 'error'; return resolve(false); }
            console.log('[tts] ready');
            this._state = 'ready';
            this._ready = true;
            resolve(true);
          });
        });
      };
      s.onerror = () => { console.warn('[tts] script load failed'); this._state = 'error'; resolve(false); };
      document.head.appendChild(s);
    });
  },

  isReady() { return this._ready; },

  stop() {
    try { if (this._ready && typeof meSpeak !== 'undefined' && meSpeak.stop) meSpeak.stop(); } catch (e) { /* ignore */ }
  },

  async speak(text) {
    if (!text) return false;
    const ok = await this.ensureLoaded();
    if (!ok) return false;
    try {
      const result = meSpeak.speak(text, { amplitude: 100, pitch: 50, speed: 175, wordgap: 0 });
      return !!result;
    } catch (e) {
      console.warn('[tts] speak error', e);
      return false;
    }
  }
};

window.TTS = TTS;
