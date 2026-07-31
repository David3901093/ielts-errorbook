/* ============================================================
   log.js — diagnostic logger for on-device troubleshooting.
   Since this is a static site with no server, logs are collected
   in localStorage + memory and can be downloaded as a .txt file
   for the developer to inspect (e.g. HarmonyOS TTS issues).

   Usage:  Diag.log('audio', 'playing word', { word: 'poisonous' });
   Export: Diag.download()  →  saves ielb-diag-<timestamp>.txt
   ============================================================ */

const KEY_LOG = 'ieb_diagLog';
const MAX_ENTRIES = 800; // cap to avoid localStorage overflow

const Diag = {
  _mem: [],
  _envCaptured: false,

  /* Append a log entry. category: 'audio'|'nav'|'api'|'error'|'env'|... */
  log(category, message, data) {
    const entry = {
      t: new Date().toISOString(),
      tLocal: new Date().toLocaleString(),
      cat: category || 'info',
      msg: String(message == null ? '' : message),
      data: data === undefined ? null : (typeof data === 'string' ? data : safeJson(data))
    };
    this._mem.push(entry);
    // mirror to console for live debugging
    try {
      const c = console[category === 'error' ? 'error' : 'log'];
      c.call(console, `[${entry.cat}] ${entry.msg}`, data == null ? '' : data);
    } catch (e) { /* ignore */ }
    this._persist();
  },

  _persist() {
    try {
      const trimmed = this._mem.slice(-MAX_ENTRIES);
      localStorage.setItem(KEY_LOG, JSON.stringify(trimmed));
    } catch (e) { /* localStorage may be full; keep in-memory only */ }
  },

  load() {
    try {
      const raw = localStorage.getItem(KEY_LOG);
      if (raw) this._mem = JSON.parse(raw) || [];
    } catch (e) { this._mem = []; }
    return this._mem;
  },

  all() { return this.load(); },

  clear() {
    this._mem = [];
    try { localStorage.removeItem(KEY_LOG); } catch (e) { /* ignore */ }
  },

  /* Capture browser environment once — critical for diagnosing
     why TTS fails on HarmonyOS. */
  captureEnv() {
    if (this._envCaptured) return;
    this._envCaptured = true;
    const ua = navigator.userAgent;
    const env = {
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      hasSpeechSynthesis: ('speechSynthesis' in window),
      hasSpeechSynthesisUtterance: ('SpeechSynthesisUtterance' in window),
      voiceCount: 0,
      voices: [],
      hasAudio: ('Audio' in window),
      canPlayMp3: (function () {
        try { const a = document.createElement('audio'); return !!(a.canPlayType && a.canPlayType('audio/mpeg')); } catch (e) { return 'err'; }
      })(),
      viewport: window.innerWidth + 'x' + window.innerHeight,
      dpr: window.devicePixelRatio,
      cookieEnabled: navigator.cookieEnabled
    };
    // try to read voices (may be async/empty on HarmonyOS)
    try {
      if ('speechSynthesis' in window) {
        const v = speechSynthesis.getVoices() || [];
        env.voiceCount = v.length;
        env.voices = v.slice(0, 20).map(x => ({ name: x.name, lang: x.lang, voiceURI: x.voiceURI }));
      }
    } catch (e) { env.voiceReadError = String(e); }
    // detect HarmonyOS
    env.isHarmonyOS = /harmony|harmonyos|ohos|arkweb/i.test(ua);
    env.uaHints = {
      webkit: /webkit/i.test(ua), chrome: /chrome|crios/i.test(ua),
      mobile: /mobile|android|iphone|harmony/i.test(ua)
    };
    this.log('env', 'Browser environment captured', env);
  },

  /* Build a human-readable text report of all logs. */
  report() {
    const entries = this.all();
    const lines = [];
    lines.push('=================================================');
    lines.push('IELTS Error Book — Diagnostic Report');
    lines.push('Generated: ' + new Date().toLocaleString());
    lines.push('Total log entries: ' + entries.length);
    lines.push('=================================================');
    lines.push('');
    entries.forEach(e => {
      lines.push(`[${e.tLocal}] (${e.cat}) ${e.msg}`);
      if (e.data && e.data !== 'null') {
        lines.push('    ' + (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)));
      }
    });
    lines.push('');
    lines.push('=================================================');
    lines.push('END OF REPORT');
    return lines.join('\n');
  },

  /* Download the report as a .txt file. Returns entry count. */
  download() {
    const count = this.all().length;
    this.log('user', 'Diagnostic report downloaded');
    const text = this.report();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `ielb-diag-${ts}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return count;
  }
};

/* safe JSON stringify that won't throw on circular refs / DOM nodes */
function safeJson(obj) {
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, (k, v) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return '[Circular]';
        // skip large/DOM objects
        if (v.nodeType !== undefined) return '[DOMNode:' + (v.tagName || v.nodeName) + ']';
        if (v instanceof Error) return { name: v.name, message: v.message, stack: (v.stack||'').slice(0,200) };
        seen.add(v);
      }
      if (typeof v === 'function') return '[function]';
      return v;
    });
  } catch (e) {
    return '[unserializable: ' + String(e) + ']';
  }
}

window.Diag = Diag;
