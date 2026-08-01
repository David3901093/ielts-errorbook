/* ============================================================
   tts.js — Pure client-side sentence TTS via MeSpeak.js (eSpeak).
   This synthesizes FLUENT whole-sentence speech entirely in the browser,
   using the Web Audio API (AudioContext). It does NOT depend on the OS
   speechSynthesis voices — so it works on HarmonyOS where the system
   TTS engine is empty (voiceCount:0, synthesis-failed).

   MeSpeak.js is loaded from a CDN; config + voice are fetched once and
   cached. Playback requires a user gesture on mobile (AudioContext).
   ============================================================ */

const MS_BASE = 'https://cdn.jsdelivr.net/npm/mespeak@1.9.6';

const TTS = {
  _state: 'idle',     // idle | loading | ready | error
  _ready: false,
  _loadPromise: null,

  /* Load the MeSpeak engine + config + English voice. Idempotent.
     Returns a promise that resolves to true/false. */
  ensureLoaded() {
    if (this._loadPromise) return this._loadPromise;
    this._loadPromise = this._load();
    return this._loadPromise;
  },

  _load() {
    return new Promise(resolve => {
      Diag.log('tts', 'loading MeSpeak engine');
      this._state = 'loading';
      // load the engine script
      const s = document.createElement('script');
      s.src = MS_BASE + '/mespeak.full.min.js';
      s.onload = () => {
        if (typeof meSpeak === 'undefined') {
          Diag.log('tts', 'MeSpeak script loaded but meSpeak undefined');
          this._state = 'error';
          return resolve(false);
        }
        Diag.log('tts', 'MeSpeak engine script loaded, loading config');
        meSpeak.loadConfig(MS_BASE + '/mespeak_config.json', (ok, msg) => {
          if (!ok) {
            Diag.log('tts', 'MeSpeak config failed', String(msg));
            this._state = 'error';
            return resolve(false);
          }
          Diag.log('tts', 'MeSpeak config loaded, loading voice en-us');
          meSpeak.loadVoice(MS_BASE + '/voices/en/en-us.json', (vok, vmsg) => {
            if (!vok) {
              Diag.log('tts', 'MeSpeak voice failed', String(vmsg));
              this._state = 'error';
              return resolve(false);
            }
            Diag.log('tts', 'MeSpeak ready (en-us voice loaded)');
            this._state = 'ready';
            this._ready = true;
            resolve(true);
          });
        });
      };
      s.onerror = (e) => {
        Diag.log('tts', 'MeSpeak script failed to load (CDN blocked?)');
        this._state = 'error';
        resolve(false);
      };
      document.head.appendChild(s);
    });
  },

  isReady() { return this._ready; },

  /* Synthesize and play a sentence. Returns true if playback started.
     MUST be called from a user gesture on mobile (AudioContext policy). */
  async speak(text) {
    if (!text) return false;
    const ok = await this.ensureLoaded();
    if (!ok) {
      Diag.log('tts', 'speak() aborted — MeSpeak not ready');
      return false;
    }
    try {
      Diag.log('tts', 'MeSpeak.speak()', { text: text.slice(0, 50) });
      // meSpeak.speak returns the generated audio object (plays via AudioContext)
      const result = meSpeak.speak(text, {
        amplitude: 100,
        pitch: 50,
        speed: 175,
        wordgap: 0
      });
      Diag.log('tts', 'MeSpeak.speak() returned', { hasResult: !!result });
      return !!result;
    } catch (e) {
      Diag.log('tts', 'MeSpeak.speak() threw', String(e));
      return false;
    }
  }
};

window.TTS = TTS;
