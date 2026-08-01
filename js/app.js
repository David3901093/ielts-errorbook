/* ============================================================
   app.js — SPA router + page renderers + interactions
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');
  let currentRoute = 'dashboard';

  /* ----------------------------- utils ----------------------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function toast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.className = 'toast'), 1800);
  }
  /* Toast shown when sentence TTS is unavailable (e.g. HarmonyOS has no TTS engine). */
  window._showAudioToast = function () {
    const t = $('#toast');
    t.innerHTML = '<span class="toast-ico">🔇</span><span>Sentence audio is not supported on this browser. Word pronunciation still works.</span>';
    t.className = 'toast show notice';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.className = 'toast'), 4500);
  };
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function getWordFromBank(en) {
    return window.IELTS.BANK.find(w => w.en.toLowerCase() === (en || '').toLowerCase());
  }

  /* ----------------------------- score header ----------------------------- */
  function refreshScore() {
    const p = window.Store.getProgress();
    const pill = $('#scorePill');
    $('#totalScore').textContent = p.totalScore;
    pill.classList.toggle('bad', p.totalScore < 0);
  }
  function animateScore(delta) {
    const pill = $('#scorePill');
    pill.classList.remove('pop');
    void pill.offsetWidth;
    pill.classList.add('pop');
    toast((delta > 0 ? '+' : '') + delta + (delta > 0 ? ' ✓' : ' ✗'), delta > 0 ? 'ok' : 'bad');
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  const ROUTES = {
    dashboard: renderDashboard,
    dictation: renderDictation,
    bank: renderBank,
    cnen: renderCnEn,
    encyclopedia: renderEncyclopedia,
    cards: renderCards,
    stats: renderStats,
    vocab: renderVocab,
    calendar: renderCalendar
  };

  function go(route) {
    if (!ROUTES[route]) route = 'dashboard';
    currentRoute = route;
    document.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('active', t.dataset.route === route));
    view.scrollTop = 0;
    ROUTES[route]();
    refreshScore();
    // hash for shareable state
    history.replaceState(null, '', '#' + route);
  }

  /* ============================================================
     DASHBOARD (home)
     ============================================================ */
  function renderDashboard() {
    const p = window.Store.touchVisit();
    const today = window.todayKey();
    const yKey = window.todayKey(new Date(Date.now() - 86400000));
    const y = p.days[yKey];
    const todayDay = p.days[today] || {};
    const errors = window.Store.getErrors();
    const reviewable = errors.filter(e => !e.mastered);

    let banner = '';
    if (todayDay.failed) {
      banner = `<div class="banner fail">⚠️ Today's score is below 0 — today is marked <b>Unqualified</b>. Keep practising to rebuild your score!</div>`;
    } else if (reviewable.length && !todayDay.reviewDone) {
      banner = `<div class="banner review">📌 You have <b>${reviewable.length}</b> error-word${reviewable.length > 1 ? 's' : ''} to review today. <button class="btn small" id="goReview">Start Review</button></div>`;
    } else if (todayDay.reviewDone) {
      banner = `<div class="banner ok">✅ Daily review complete! Great work. Come back tomorrow.</div>`;
    }

    // yesterday stats
    const yAdded = y ? y.wordsAdded : 0;
    const yAcc = y && (y.correct + y.wrong) > 0 ? Math.round((y.correct / (y.correct + y.wrong)) * 100) : '—';

    const TS = window.IELTS.TAG_STATS || {};
    const totalBank = window.IELTS.BANK.length;
    // exam tags with friendly labels + order
    const examTags = [
      { tag: 'ielts', label: 'IELTS 雅思',   count: TS.ielts || 0 },
      { tag: 'toefl', label: 'TOEFL 托福',   count: TS.toefl || 0 },
      { tag: 'cet6',  label: 'CET-6 六级',   count: TS.cet6  || 0 },
      { tag: 'cet4',  label: 'CET-4 四级',   count: TS.cet4  || 0 },
      { tag: 'ky',    label: '考研',          count: TS.ky    || 0 },
      { tag: 'gre',   label: 'GRE',          count: TS.gre   || 0 }
    ];

    view.innerHTML = `
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">Your daily IELTS training hub · ${today}</p>
      ${banner}

      <div class="card section vocab-banner">
        <div class="vocab-banner-top">
          <h3>📚 Vocabulary Bank</h3>
          <span class="vocab-total"><b>${totalBank.toLocaleString()}</b> words in total</span>
        </div>
        <div class="vocab-chips">
          ${examTags.map(e => `<span class="vocab-chip"><b>${e.count.toLocaleString()}</b> ${e.label}</span>`).join('')}
        </div>
        <div class="muted" style="margin-top:8px;font-size:.8rem;">Words are cross-tagged across exams — one word may belong to several lists.</div>
      </div>

      <div class="grid grid-4 section">
        <div class="card stat"><div class="num">${p.totalScore}</div><div class="lbl">TOTAL SCORE</div></div>
        <div class="card stat"><div class="num">${todayDay.score ?? 0}</div><div class="lbl">TODAY'S SCORE</div></div>
        <div class="card stat"><div class="num">${p.streak || 0} 🔥</div><div class="lbl">DAY STREAK</div></div>
        <div class="card stat"><div class="num">${errors.length}</div><div class="lbl">ERROR WORDS</div></div>
      </div>

      <div class="grid grid-2 section">
        <div class="card">
          <h3>📊 Yesterday Recap</h3>
          <div class="muted">${yKey}</div>
          <ul style="list-style:none;line-height:2;margin-top:8px;">
            <li>Words added: <b>${yAdded}</b></li>
            <li>Accuracy: <b>${yAcc}${yAcc !== '—' ? '%' : ''}</b></li>
            <li>Yesterday score: <b>${y ? y.score : 0}</b></li>
            <li>Review status: <b>${y ? (y.reviewDone ? '✓ Done' : 'Incomplete') : '—'}</b></li>
          </ul>
        </div>
        <div class="card">
          <h3>🚀 Quick Actions</h3>
          <div class="row" style="margin-top:6px;">
            <button class="btn" data-go="dictation">Start Dictation</button>
            <button class="btn secondary" data-go="cnen">CN → EN</button>
            <button class="btn secondary" data-go="cards">Flip Cards</button>
          </div>
          <div class="muted" style="margin-top:14px;">Daily review re-tests your error words so they stick in long-term memory.</div>
        </div>
      </div>

      <div class="card section">
        <h3>🎴 Today's Recommended Cards</h3>
        <div class="muted" style="margin-bottom:12px;">Tap a card to flip and reveal its meaning.</div>
        <div class="card-grid" id="homeCards"></div>
      </div>
    `;

    // quick action nav
    view.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    const gr = $('#goReview'); if (gr) gr.addEventListener('click', () => go('dictation'));

    // mini recommended cards (3 flip cards from bank)
    const pool = window.IELTS.BANK.filter(w => w.examples && w.examples.length);
    const picks = shuffle(pool).slice(0, 3);
    const wrap = $('#homeCards');
    picks.forEach(w => wrap.appendChild(buildFlipCard(w)));
  }

  /* ============================================================
     DICTATION (random error words) + daily review mode
     ============================================================ */
  function renderDictation() {
    showDictationPicker();
  }

  /* Word-list picker: choose a vocabulary level (or the error bank) to dictate. */
  function showDictationPicker() {
    const errors = window.Store.getErrors().filter(e => !e.mastered);
    const phrases = window.Store.getCustomPhrases();
    const mixCount = errors.length + phrases.length;
    const TS = window.IELTS.TAG_STATS || {};
    const lists = [
      { key: 'mix',     label: '🔀 Mixed Review',      count: mixCount,         desc: 'Error words + your phrases, shuffled together' },
      { key: 'errors',  label: '📕 Error Bank',        count: errors.length,    desc: 'Your personal misspelled words (auto-collected)' },
      { key: 'ielts',   label: '📘 IELTS 雅思',         count: TS.ielts || 0,    desc: 'IELTS core vocabulary' },
      { key: 'toefl',   label: '📗 TOEFL 托福',         count: TS.toefl || 0,    desc: 'TOEFL vocabulary' },
      { key: 'cet4',    label: '📙 CET-4 四级',         count: TS.cet4  || 0,    desc: 'College English Test Band 4' },
      { key: 'cet6',    label: '📓 CET-6 六级',         count: TS.cet6  || 0,    desc: 'College English Test Band 6' },
      { key: 'ky',      label: '📔 考研',               count: TS.ky    || 0,    desc: 'Postgraduate entrance exam' }
    ];
    view.innerHTML = `
      <h1 class="page-title">Dictation</h1>
      <p class="page-sub">Pick a word list to practise. Type the English for each meaning. <b>+1</b> correct, <b>−3</b> wrong.</p>
      <div class="grid grid-2 section">
        ${lists.map(l => `
          <div class="card list-pick ${l.count === 0 ? 'disabled' : ''}" data-list="${l.key}">
            <div class="row" style="justify-content:space-between;align-items:flex-start;">
              <div>
                <h3 style="margin:0;">${l.label}</h3>
                <div class="muted" style="margin-top:4px;">${esc(l.desc)}</div>
              </div>
              <span class="badge">${l.count.toLocaleString()} words</span>
            </div>
            <button class="btn small" style="margin-top:14px;" ${l.count === 0 ? 'disabled' : ''}>Start →</button>
          </div>`).join('')}
      </div>
    `;
    view.querySelectorAll('.list-pick').forEach(card => {
      if (card.classList.contains('disabled')) return;
      card.addEventListener('click', () => startDictation(card.dataset.list, errors));
    });
  }

  /* Build the word queue for the chosen list and run a session. */
  function startDictation(listKey, errors) {
    const errors2 = window.Store.getErrors().filter(e => !e.mastered);
    const phrases = window.Store.getCustomPhrases();
    let pool = [];
    let label = '';
    if (listKey === 'mix') {
      // combine error words + custom phrases into one shuffled pool
      pool = [...errors2.map(e => ({ en: e.en, cn: e.cn, type: 'word' })),
              ...phrases.map(p => ({ en: p.en, cn: p.cn, type: 'phrase' }))];
      label = 'Mixed Review';
    } else if (listKey === 'errors') {
      pool = errors2.map(e => ({ en: e.en, cn: e.cn, type: 'word' }));
      label = 'Error Bank';
    } else {
      pool = window.IELTS.BANK.filter(w => (w.tags || '').split(/\s+/).includes(listKey) && w.cn)
        .map(w => ({ en: w.en, cn: w.cn, type: 'word' }));
      const names = { ielts: 'IELTS', toefl: 'TOEFL', cet4: 'CET-4', cet6: 'CET-6', ky: '考研' };
      label = names[listKey] || listKey;
    }
    if (!pool.length) {
      toast('No words in this list', 'bad');
      showDictationPicker();
      return;
    }
    const queue = shuffle(pool).slice(0, Math.min(10, pool.length));
    runDictationSession(queue, label, listKey);
  }

  /* The actual per-word dictation loop (shared by all lists). */
  function runDictationSession(queue, label, listKey) {
    let idx = 0;
    let dots = queue.map(() => '');

    const draw = () => {
      const w = queue[idx];
      view.innerHTML = `
        <h1 class="page-title">Dictation · ${esc(label)}</h1>
        <p class="page-sub">Type the English word for the meaning shown. <b>+1</b> correct, <b>−3</b> wrong.</p>
        <div class="card dictate-box dictate-card slide-in" style="max-width:560px;margin-left:auto;margin-right:auto;">
          <div class="row card-top" style="justify-content:space-between;">
            <span class="badge">Word ${idx + 1} / ${queue.length}</span>
            <button class="icon-btn" id="sayBtn" title="Hear pronunciation">🔊</button>
          </div>
          <h2 class="word-cn">${esc(w.cn)}</h2>
          <div class="word-hint">${'• '.repeat((w.en || '').length)} ${w.en.length} letters</div>
          <input id="dInput" class="input dictate-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="type the word..." />
          <div class="feedback" id="fb"></div>
          <div class="row" style="justify-content:center;margin-top:18px;">
            <button class="btn" id="checkBtn">Check</button>
            <button class="btn secondary" id="skipBtn">Skip</button>
            <button class="btn ghost" id="backBtn">◂ Lists</button>
          </div>
          <div class="progress-track" id="dots"></div>
        </div>
      `;
      renderDots();
      const input = $('#dInput');
      input.focus();
      $('#sayBtn').addEventListener('click', () => window.Audio2.speakWord(w.en));
      $('#backBtn').addEventListener('click', () => showDictationPicker());
      const check = () => {
        const ans = input.value.trim();
        if (!ans) return;
        const correct = ans.toLowerCase() === w.en.toLowerCase();
        const r = window.Store.recordAnswer(correct);
        animateScore(r.delta);
        refreshScore();
        const fb = $('#fb');
        if (correct) {
          fb.className = 'feedback ok';
          fb.innerHTML = `✓ Correct! <b>${esc(w.en)}</b>`;
          window.Store.setErrorField(w.en, { correctCount: (w.correctCount || 0) + 1 });
          window.Store.bump('wordsReviewed');
          dots[idx] = 'ok';
          renderDots();
          input.disabled = true;
          // auto-advance after 1.2s
          setTimeout(() => { if (idx + 1 < queue.length) next(); else finishSession(); }, 1200);
        } else {
          // wrong: add word to error bank automatically (phrases excluded), show answer
          if (w.type !== 'phrase') {
            window.Store.addErrorIfNew({ en: w.en, cn: w.cn, source: 'dictation' });
            window.Store.setErrorField(w.en, { wrongCount: (w.wrongCount || 0) + 1 });
          }
          fb.className = 'feedback bad';
          fb.innerHTML = `✗ Correct answer: <button class="say-inline" data-say="${esc(w.en)}" title="Read aloud">🔊</button><b>${esc(w.en)}</b> (you wrote "${esc(ans)}")`;
          const sb = fb.querySelector('[data-say]');
          if (sb) sb.addEventListener('click', () => window.Audio2.speakWord(w.en));
          dots[idx] = 'bad';
          $('#dInput').classList.add('shake');
          renderDots();
          input.disabled = true;
          $('#checkBtn').textContent = idx + 1 < queue.length ? 'Next →' : 'Finish ✓';
          $('#checkBtn').onclick = next;
        }
      };
      const next = () => {
        idx++;
        if (idx >= queue.length) { finishSession(); return; }
        draw();
      };
      $('#checkBtn').addEventListener('click', check);
      $('#skipBtn').addEventListener('click', next);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          if (input.disabled) next(); else check();
        }
      });
    };
    const renderDots = () => {
      $('#dots').innerHTML = dots.map(d => `<span class="dot ${d}"></span>`).join('');
    };
    const finishSession = () => {
      if (label === 'Error Bank') window.Store.setDayField('reviewDone', true);
      const d = window.Store.getDay();
      view.innerHTML = `
        <h1 class="page-title">Session Complete 🎉</h1>
        <div class="card" style="max-width:560px;margin:0 auto;text-align:center;">
          <div class="badge" style="margin-bottom:10px;">${esc(label)} list</div>
          <div class="grid grid-3">
            <div class="stat"><div class="num">${d.correct}</div><div class="lbl">CORRECT</div></div>
            <div class="stat"><div class="num">${d.wrong}</div><div class="lbl">WRONG</div></div>
            <div class="stat"><div class="num" style="color:${d.score < 0 ? 'var(--fail)' : 'inherit'}">${d.score}</div><div class="lbl">TODAY'S SCORE</div></div>
          </div>
          <p class="muted" style="margin-top:14px;">${d.score < 0 ? '⚠️ Today is Unqualified (score below 0). Practise more!' : 'Nice job — keep the streak going!'}</p>
          <div class="row" style="justify-content:center;margin-top:14px;">
            <button class="btn" id="againBtn">Again</button>
            <button class="btn secondary" id="listsBtn">◂ Other Lists</button>
            <button class="btn secondary" data-go="dashboard">Home</button>
          </div>
        </div>`;
      $('#againBtn').addEventListener('click', () => startDictation(listKey, window.Store.getErrors().filter(e => !e.mastered)));
      $('#listsBtn').addEventListener('click', () => showDictationPicker());
      view.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    };
    draw();
  }

  /* ============================================================
     ERROR BANK (add words + fuzzy suggest → confirm)
     ============================================================ */
  function renderBank() {
    renderBankList();
  }
  function renderBankList(suggestMsg = '') {
    const errors = window.Store.getErrors();
    const list = errors.length
      ? `<ul class="word-list">${errors.map(w => `
          <li class="word-item ${w.mastered ? 'mastered' : ''}">
            <span class="w">${esc(w.en)}</span>
            ${w.misspelled ? `<span class="tag">was: ${esc(w.misspelled)}</span>` : ''}
            <span class="m">${esc(w.cn)}</span>
            ${w.seeded ? '<span class="badge">seed</span>' : ''}
            <button class="btn small ghost" data-say="${esc(w.en)}">🔊</button>
            <button class="btn small ghost" data-master="${esc(w.en)}">${w.mastered ? '↺' : '✓'}</button>
            <button class="icon-x" data-del="${esc(w.en)}" title="remove">✕</button>
          </li>`).join('')}</ul>`
      : emptyHTML('No error words', 'Add a word you often misspell below.');

    view.innerHTML = `
      <h1 class="page-title">Error Bank</h1>
      <p class="page-sub">Type a word you got wrong. We'll suggest the correct spelling for you to confirm.</p>

      <div class="card section">
        <h3>➕ Add a Word</h3>
        <div class="row">
          <input id="bkWord" class="input" placeholder="English word (misspelled is OK)" autocomplete="off" spellcheck="false" style="flex:2;" />
          <input id="bkCn" class="input" placeholder="中文意思 / meaning" style="flex:2;" />
          <button class="btn" id="bkAdd">Add</button>
        </div>
        <div id="suggestArea" style="margin-top:10px;">${suggestMsg}</div>
      </div>

      <div class="card section">
        <h3>📚 My Error Words (${errors.length})</h3>
        ${list}
      </div>
    `;
    view.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => window.Audio2.speakWord(b.dataset.say)));
    view.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      window.Store.removeError(b.dataset.del);
      renderBankList();
      toast('Removed', '');
    }));
    view.querySelectorAll('[data-master]').forEach(b => b.addEventListener('click', () => {
      const en = b.dataset.master;
      const w = window.Store.getErrors().find(x => x.en === en);
      window.Store.setErrorField(en, { mastered: !w.mastered });
      renderBankList();
    }));
    $('#bkAdd').addEventListener('click', handleAdd);
    $('#bkWord').addEventListener('keydown', e => { if (e.key === 'Enter') $('#bkCn').focus(); });
    $('#bkCn').addEventListener('keydown', e => { if (e.key === 'Enter') handleAdd(); });
  }

  function handleAdd() {
    const wordEl = $('#bkWord'), cnEl = $('#bkCn');
    const typed = wordEl.value.trim();
    const cn = cnEl.value.trim();
    if (!typed) { toast('Type a word first', 'bad'); return; }

    // exact match to a correct spelling in bank?
    const exact = window.IELTS.BANK.find(w => w.en.toLowerCase() === typed.toLowerCase());
    if (exact) {
      const ok = window.Store.addError({ en: exact.en, cn: cn || exact.cn });
      finishAdd(ok, wordEl, cnEl);
      return;
    }
    // fuzzy suggest
    const sugg = window.Fuzzy.suggestFromBank(typed);
    if (sugg) {
      const bankWord = getWordFromBank(sugg.word);
      const cnForSugg = cn || (bankWord ? bankWord.cn : '');
      const html = `
        <div class="banner review" style="margin:0;">
          <div>Did you mean <b>${esc(sugg.word)}</b>? (${esc(bankWord ? bankWord.cn : '')})
          <span class="muted" style="font-size:.8rem;">You typed "${esc(typed)}"</span></div>
          <div class="row">
            <button class="btn small" id="useSugg">Use "${esc(sugg.word)}"</button>
            <button class="btn small secondary" id="keepMine">Keep "${esc(typed)}"</button>
          </div>
        </div>`;
      const area = $('#suggestArea');
      area.innerHTML = html;
      $('#useSugg').addEventListener('click', () => {
        const ok = window.Store.addError({ en: sugg.word, cn: cnForSugg, misspelled: typed });
        finishAdd(ok, wordEl, cnEl);
      });
      $('#keepMine').addEventListener('click', () => {
        const ok = window.Store.addError({ en: typed, cn: cn, misspelled: null });
        finishAdd(ok, wordEl, cnEl);
      });
      return;
    }
    // no close match → keep as typed
    const ok = window.Store.addError({ en: typed, cn: cn });
    finishAdd(ok, wordEl, cnEl);
  }
  function finishAdd(ok, wordEl, cnEl) {
    if (ok) {
      window.Store.bump('wordsAdded');
      toast('Added to error bank ✓', 'ok');
      wordEl.value = ''; cnEl.value = ''; wordEl.focus();
      renderBankList();
    } else {
      toast('Already in your error bank', 'bad');
    }
  }

  /* ============================================================
     CN → EN (phrase dictation — only Chinese module)
     ============================================================ */
  function renderCnEn() {
    const phrases = window.Store.getPhrases();
    view.innerHTML = `
      <h1 class="page-title" style="color:var(--text);text-shadow:none;">中译英 · CN → EN</h1>
      <p class="page-sub" style="color:var(--text-soft);text-shadow:none;">看中文，默写英文词组。做对 +1，做错 −3。</p>

      <div class="card section">
        <h3>➕ 添加待默写词组</h3>
        <div class="row">
          <input id="phEn" class="input" placeholder="英文词组 English phrase" style="flex:2;" />
          <input id="phCn" class="input" placeholder="中文翻译 Chinese" style="flex:2;" />
          <button class="btn" id="phAdd">添加</button>
        </div>
      </div>

      <div class="card section dictate-card" style="max-width:620px;margin-left:auto;margin-right:auto;">
        <div class="row card-top" style="justify-content:space-between;">
          <span class="badge" id="phProg">Ready</span>
          <button class="icon-btn" id="phSay">🔊</button>
        </div>
        <h2 class="word-cn" id="phQ">点击下方按钮开始默写</h2>
        <input id="phInput" class="input dictate-input" placeholder="输入英文词组..." disabled autocomplete="off" spellcheck="false" />
        <div class="feedback" id="phFb"></div>
        <div class="row" style="justify-content:center;margin-top:18px;">
          <button class="btn" id="phStart">开始默写</button>
          <button class="btn secondary" id="phCheck" disabled>核对</button>
          <button class="btn ghost" id="phNext" disabled>下一个</button>
        </div>
      </div>

      <div class="card section">
        <h3>📚 我的词组库 (共 ${phrases.length})</h3>
        <ul class="word-list">
          ${phrases.map(p => `
            <li class="word-item">
              <span class="w">${esc(p.en)}</span>
              <span class="m">${esc(p.cn)}</span>
              ${p.added ? '<span class="tag">custom</span>' : '<span class="badge">built-in</span>'}
              ${p.added ? `<button class="icon-x" data-delph="${esc(p.en)}" title="删除">✕</button>` : ''}
            </li>`).join('')}
        </ul>
      </div>
    `;

    $('#phAdd').addEventListener('click', () => {
      const en = $('#phEn').value.trim();
      const cn = $('#phCn').value.trim();
      if (!en || !cn) { toast('词组和中文都要填', 'bad'); return; }
      const ok = window.Store.addPhrase({ en, cn });
      if (ok) { toast('已添加 ✓', 'ok'); renderCnEn(); }
      else toast('该词组已存在', 'bad');
    });
    view.querySelectorAll('[data-delph]').forEach(b => b.addEventListener('click', () => {
      window.Store.removePhrase(b.dataset.delph);
      renderCnEn();
    }));

    // dictation round
    let round = [];
    let i = 0;
    const start = () => {
      round = shuffle(phrases).slice(0, Math.min(10, phrases.length));
      i = 0;
      $('#phStart').textContent = '重新开始';
      ask();
    };
    const ask = () => {
      if (i >= round.length) { end(); return; }
      const p = round[i];
      $('#phProg').textContent = `${i + 1} / ${round.length}`;
      $('#phQ').textContent = p.cn;
      const inp = $('#phInput');
      inp.value = ''; inp.disabled = false; inp.focus();
      $('#phFb').textContent = ''; $('#phFb').className = 'feedback';
      $('#phCheck').disabled = false; $('#phNext').disabled = true;
      $('#phSay').onclick = () => window.Audio2.speakWord(p.en);
    };
    const check = () => {
      const p = round[i];
      const ans = $('#phInput').value.trim();
      if (!ans) return;
      const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
      const correct = norm(ans) === norm(p.en);
      const r = window.Store.recordAnswer(correct);
      animateScore(r.delta);
      refreshScore();
      const fb = $('#phFb');
      if (correct) {
        fb.className = 'feedback ok';
        fb.innerHTML = `✓ 正确！`;
        window.Store.bump('cnEnDone');
      } else {
        fb.className = 'feedback bad';
        fb.innerHTML = `✗ 正确答案：<button class="say-inline" data-say="${esc(p.en)}" title="Read aloud">🔊</button><b>${esc(p.en)}</b>`;
        const sb = fb.querySelector('[data-say]');
        if (sb) sb.addEventListener('click', () => window.Audio2.speakWord(p.en));
        $('#phInput').classList.add('shake');
      }
      $('#phInput').disabled = true;
      $('#phCheck').disabled = true;
      $('#phNext').disabled = false;
    };
    const end = () => {
      const d = window.Store.getDay();
      $('#phProg').textContent = '完成 ✓';
      $('#phQ').innerHTML = `本轮完成！今日中译英累计：<b>${d.cnEnDone}</b>，今日得分：<b style="color:${d.score < 0 ? 'var(--fail)' : 'var(--ok)'}">${d.score}</b>`;
      $('#phInput').value = ''; $('#phInput').disabled = true;
      $('#phCheck').disabled = true; $('#phNext').disabled = true;
    };
    $('#phStart').addEventListener('click', start);
    $('#phCheck').addEventListener('click', check);
    $('#phNext').addEventListener('click', () => { i++; ask(); });
    $('#phInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { if (!$('#phCheck').disabled) check(); else if (!$('#phNext').disabled) { i++; ask(); } }
    });
  }

  /* ============================================================
     ENCYCLOPEDIA (word flip cards + online fill + self-edit)
     ============================================================ */

  /* Fuzzy autocomplete: prefix matches first, then Levenshtein matches.
     Returns up to `limit` candidates ranked by relevance. */
  function suggestWords(query, limit = 10) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];
    const bank = window.IELTS.BANK;
    const starts = [];   // prefix matches (highest priority)
    const contains = []; // substring matches
    const close = [];    // fuzzy (edit-distance) matches
    for (const w of bank) {
      const en = w.en.toLowerCase();
      if (en.startsWith(q)) starts.push(w);
      else if (en.includes(q)) contains.push(w);
    }
    // only compute fuzzy if prefix/substring results are thin
    if (starts.length + contains.length < limit) {
      for (const w of bank) {
        const en = w.en.toLowerCase();
        if (en.startsWith(q) || en.includes(q)) continue;
        const dist = window.Fuzzy.levenshtein(q, en);
        const maxD = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
        if (dist <= maxD) close.push({ w, dist });
      }
      close.sort((a, b) => a.dist - b.dist);
    }
    return [...starts, ...contains, ...close.map(c => c.w)].slice(0, limit);
  }

  /* Highlight the matched portion of a word for display. */
  function highlightMatch(word, query) {
    const q = (query || '').toLowerCase().trim();
    const i = word.toLowerCase().indexOf(q);
    if (i < 0) return esc(word);
    return esc(word.slice(0, i)) + '<mark>' + esc(word.slice(i, i + q.length)) + '</mark>' + esc(word.slice(i + q.length));
  }

  function renderEncyclopedia() {
    view.innerHTML = `
      <h1 class="page-title">Word Encyclopedia</h1>
      <p class="page-sub">Flip a card for phonetics, definitions, examples, synonyms & etymology. Add your own examples.</p>
      <div class="row section">
        <div class="autocomplete-wrap">
          <input id="encSearch" class="input" placeholder="Search a word (e.g. poisonous)..." autocomplete="off" spellcheck="false" />
          <div class="autocomplete" id="encAuto"></div>
        </div>
        <button class="btn" id="encGo">Look Up</button>
        <button class="btn secondary" id="encRandom">🎲 Random</button>
      </div>
      <div id="encResult" class="section"></div>
    `;
    const show = async (raw) => {
      const word = (raw || '').trim();
      if (!word) return;
      const res = $('#encResult');
      res.innerHTML = `<div class="card"><div class="muted">Looking up “${esc(word)}”…</div></div>`;
      const local = getWordFromBank(word);
      const online = await window.DictAPI.fetch(word);
      const custom = window.Store.getSentences(word);

      let phon = (local && local.phon) || (online && online.phon) || '';
      let examples = [];
      if (local && local.examples) examples = examples.concat(local.examples);
      if (online && online.examples) examples = examples.concat(online.examples);
      if (custom && custom.length) examples = examples.concat(custom);
      examples = [...new Set(examples)];
      if (examples.length < 5) examples.push('—'); // pad
      const syn = [...new Set([...(local && local.synonyms || []), ...(online && online.synonyms || [])])].slice(0, 8);
      const ant = [...new Set([...(local && local.antonyms || []), ...(online && online.antonyms || [])])].slice(0, 8);
      const defs = (online && online.definitions) ? online.definitions.slice(0, 4) :
        (local ? [{ pos: '', definition: local.cn, example: '' }] : []);
      const etym = (local && local.etymology) || (online && online.origin) || '';
      const cn = local ? local.cn : '';

      res.innerHTML = `
        <div class="card">
          <div class="row" style="justify-content:space-between;">
            <div>
              <h2 style="font-size:1.8rem;">${esc(word)} ${phon ? `<span class="muted">${esc(phon)}</span>` : ''}</h2>
              ${cn ? `<div class="muted">${esc(cn)}</div>` : ''}
            </div>
            <div class="row">
              <button class="icon-btn" id="encSay">🔊</button>
            </div>
          </div>

          ${defs.length ? `<h4 style="margin-top:14px;">Definitions</h4>
            <ul style="margin:6px 0 6px 18px;line-height:1.6;">${defs.map(d =>
              `<li>${d.pos ? `<i>(${esc(d.pos)})</i> ` : ''}${esc(d.definition)}</li>`).join('')}</ul>` : ''}

          <h4 style="margin-top:10px;">Example Sentences <span class="muted" style="font-weight:400;font-size:.8rem;">(${examples.filter(e=>e&&e!=='—').length})</span></h4>
          <ul id="exList" style="margin:6px 0 6px 18px;line-height:1.7;">${examples.map(e =>
            e === '—'
              ? `<li><span class="ex-text muted">No example yet — add your own below.</span></li>`
              : `<li><button class="say-inline" data-say="${esc(e)}" title="Read aloud">🔊</button><span class="ex-text">${esc(e)}</span></li>`).join('')}</ul>
          <div class="row" style="margin-top:6px;">
            <input id="exInput" class="input" placeholder="Add your own example sentence..." style="flex:1;" />
            <button class="btn small" id="exAdd">Add</button>
          </div>

          ${syn.length ? `<h4 style="margin-top:12px;">Synonyms</h4><div>${syn.map(s => `<span class="badge">${esc(s)}</span>`).join(' ')}</div>` : ''}
          ${ant.length ? `<h4 style="margin-top:10px;">Antonyms</h4><div>${ant.map(s => `<span class="badge" style="background:var(--bad-bg);color:var(--bad);">${esc(s)}</span>`).join(' ')}</div>` : ''}
          ${etym ? `<div class="flip-back etym" style="position:static;transform:none;background:var(--grad-soft);color:var(--c3);margin-top:12px;"><b>Etymology:</b> ${esc(etym)}</div>` : ''}
          ${(!online) ? `<div class="muted" style="margin-top:10px;font-size:.8rem;">Offline or word not found — showing built-in data only.</div>` : ''}
        </div>`;
      $('#encSay').addEventListener('click', () => window.Audio2.speakWord(word));
      // read-aloud buttons for each example sentence
      view.querySelectorAll('[data-say]').forEach(b =>
        b.addEventListener('click', () => { window.Audio2.speak(b.dataset.say); }));
      $('#exAdd').addEventListener('click', () => {
        const v = $('#exInput').value.trim();
        if (!v) return;
        window.Store.addSentence(word, v);
        toast('Example added ✓', 'ok');
        show(word); // re-render
      });
      $('#exInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#exAdd').click(); });
    };
    $('#encGo').addEventListener('click', () => { closeAuto(); show($('#encSearch').value); });
    $('#encRandom').addEventListener('click', () => {
      const w = pick(window.IELTS.BANK);
      $('#encSearch').value = w.en;
      show(w.en);
    });

    /* ---- autocomplete wiring ---- */
    const autoBox = $('#encAuto');
    let acList = [];     // current candidate words
    let acActive = -1;   // highlighted index

    const closeAuto = () => { autoBox.classList.remove('open'); autoBox.innerHTML = ''; acActive = -1; };
    const markActive = () => {
      autoBox.querySelectorAll('.ac-item').forEach((it, i) =>
        it.classList.toggle('active', i === acActive));
      // scroll active item into view
      const el = autoBox.querySelector('.ac-item.active');
      if (el) el.scrollIntoView({ block: 'nearest' });
    };
    const choose = (w) => {
      $('#encSearch').value = w.en;
      closeAuto();
      show(w.en);
    };

    const refreshAuto = () => {
      const q = $('#encSearch').value;
      acList = suggestWords(q, 8);
      if (!q.trim()) { closeAuto(); return; }
      if (!acList.length) {
        autoBox.innerHTML = `<div class="ac-empty">No matches for “${esc(q)}”.</div>`;
        autoBox.classList.add('open');
        acActive = -1;
        return;
      }
      autoBox.innerHTML = acList.map((w, i) =>
        `<div class="ac-item" data-i="${i}">
           <span class="ac-word">${highlightMatch(w.en, q)}</span>
           <span class="ac-cn">${esc((w.cn || '').split(/[；;,]/)[0])}</span>
           <span class="ac-tag">${(w.tags || 'word').split(/\s+/)[0]}</span>
         </div>`).join('');
      acActive = -1;
      autoBox.classList.add('open');
      // async: fetch phrase suggestions and append below word matches
      if (q.trim().length >= 2 && window.DictAPI.searchPhrases) {
        window.DictAPI.searchPhrases(q.trim()).then(phrases => {
          if (!phrases.length || !autoBox.classList.contains('open')) return;
          const phraseHtml = phrases.map((p, i) =>
            `<div class="ac-item ac-phrase" data-phrase="${esc(p.en)}">
               <span class="ac-word">💬 ${esc(p.en)}</span>
               <span class="ac-cn">${esc(p.cn || 'phrase')}</span>
               <span class="ac-tag">phrase</span>
             </div>`).join('');
          autoBox.insertAdjacentHTML('beforeend', phraseHtml);
        });
      }
    };

    // typing → refresh suggestions (debounced)
    let acTimer = null;
    $('#encSearch').addEventListener('input', () => {
      clearTimeout(acTimer);
      acTimer = setTimeout(refreshAuto, 120);
    });
    // keyboard navigation
    $('#encSearch').addEventListener('keydown', e => {
      const open = autoBox.classList.contains('open');
      if (e.key === 'ArrowDown' && open) {
        e.preventDefault();
        acActive = Math.min(acActive + 1, acList.length - 1); markActive();
      } else if (e.key === 'ArrowUp' && open) {
        e.preventDefault();
        acActive = Math.max(acActive - 1, 0); markActive();
      } else if (e.key === 'Enter') {
        if (open && acActive >= 0 && acList[acActive]) { e.preventDefault(); choose(acList[acActive]); }
        else if (open && acList.length) { e.preventDefault(); choose(acList[0]); }
        else { closeAuto(); show($('#encSearch').value); }
      } else if (e.key === 'Escape') {
        closeAuto();
      }
    });
    // click a suggestion (word or phrase)
    autoBox.addEventListener('click', e => {
      const item = e.target.closest('.ac-item');
      if (!item) return;
      if (item.dataset.i != null && acList[+item.dataset.i]) {
        choose(acList[+item.dataset.i]);
      } else if (item.dataset.phrase) {
        // phrase suggestion: fill search box and look it up
        $('#encSearch').value = item.dataset.phrase;
        closeAuto();
        show(item.dataset.phrase);
      }
    });
    // close when clicking outside the search area
    if (window._encDocClick) document.removeEventListener('click', window._encDocClick);
    window._encDocClick = (e) => {
      if (!e.target.closest('.autocomplete-wrap')) closeAuto();
    };
    document.addEventListener('click', window._encDocClick);

    // auto-show a random one
    const w = pick(window.IELTS.BANK);
    $('#encSearch').value = w.en;
    show(w.en);
  }

  /* ============================================================
     CARDS — dynamically generated synonym / antonym / confusable pairs.
     No longer limited to a fixed 12; random sample each time, optionally
     enriched from the online dictionary API.
     ============================================================ */

  /* Build a list of synonym/antonym pairs from words that carry them
     in the bank (hand-written + any previously fetched). */
  function buildRelPairs(rel) {
    const out = [];
    window.IELTS.BANK.forEach(w => {
      const list = w[rel] || [];
      list.forEach(r => {
        // only keep pairs where the related word is also a real-looking word
        if (r && /^[a-zA-Z][a-zA-Z'\- ]*$/.test(r)) {
          out.push({ a: w.en, b: r, cnA: w.cn || '', rel });
        }
      });
    });
    return out;
  }

  /* Lazily enrich a random batch of bank words with synonyms/antonyms from
     the online dictionary API, then re-render. Silent on failure. */
  async function enrichAndShow(rel, grid, count, loadingMsg) {
    // 1) existing pairs first (instant)
    let pool = buildRelPairs(rel);
    // 2) if thin, fetch a few more from the API for random words
    if (pool.length < count) {
      grid.innerHTML = `<div class="card"><div class="muted">${loadingMsg}</div></div>`;
      const candidates = shuffle(window.IELTS.BANK).slice(0, 12);
      for (const w of candidates) {
        if (pool.length >= count * 2) break;
        try {
          const data = await window.DictAPI.fetch(w.en);
          if (data && data[rel] && data[rel].length) {
            // cache into the bank object so we don't refetch
            w[rel] = (w[rel] || []).concat(data[rel]);
            w[rel] = [...new Set(w[rel])].slice(0, 8);
            data[rel].slice(0, 3).forEach(r => {
              if (/^[a-zA-Z][a-zA-Z'\- ]*$/.test(r)) {
                pool.push({ a: w.en, b: r, cnA: w.cn || '', rel });
              }
            });
          }
        } catch (e) { /* silent */ }
      }
    }
    showRelCards(pool, grid, count);
  }

  function showRelCards(pool, grid, count) {
    grid.innerHTML = '';
    if (!pool.length) {
      grid.innerHTML = emptyHTML('No pairs yet', 'Try another mode, or check your connection to load more.');
      return;
    }
    const picks = shuffle(pool).slice(0, count);
    picks.forEach(p => {
      const wa = getWordFromBank(p.a) || { en: p.a, cn: p.cnA };
      const wb = getWordFromBank(p.b) || { en: p.b, cn: '' };
      const relLabel = p.rel === 'synonyms' ? 'synonym' : 'antonym';
      const relColor = p.rel === 'synonyms' ? 'var(--ok)' : 'var(--bad)';
      const card = el(`
        <div class="flip-wrap">
          <div class="flip-card">
            <div class="flip-face flip-front">
              <div class="big">${esc(p.a)} <span style="opacity:.5">·</span> ${esc(p.b)}</div>
              <div class="hint"><span class="badge" style="background:${relColor}22;color:${relColor};">${relLabel}</span> · tap to flip · 🔊</div>
            </div>
            <div class="flip-face flip-back">
              <h4>${esc(p.a)} / ${esc(p.b)}</h4>
              ${wa.cn || wb.cn ? `<div style="opacity:.9">${esc(wa.cn || '?')} · ${esc(wb.cn || '?')}</div>` : ''}
              ${p.note ? `<div class="ex" style="margin-top:8px;">${esc(p.note)}</div>` : ''}
              <div class="ex" style="margin-top:8px;opacity:.8;">${relLabel} pair — compare and contrast.</div>
            </div>
          </div>
        </div>`);
      bindFlip(card, p.a);
      grid.appendChild(card);
    });
  }

  function renderCards() {
    view.innerHTML = `
      <h1 class="page-title">Knowledge Cards</h1>
      <p class="page-sub">Synonyms, antonyms & confusable pairs — a fresh random set every click. Tap to flip.</p>
      <div class="row section" style="flex-wrap:wrap;">
        <button class="btn" id="cdSyn">🔀 Synonyms</button>
        <button class="btn secondary" id="cdAnt">⚡ Antonyms</button>
        <button class="btn secondary" id="cdConfuse">🤔 Confusable</button>
        <button class="btn ghost" id="cdWords">🎲 Random Words</button>
        <button class="btn ghost" id="cdShuffle">🔄 New Set</button>
      </div>
      <div class="card-grid section" id="cdGrid"></div>
    `;
    const grid = $('#cdGrid');
    const COUNT = 8;
    let currentMode = 'syn';

    const modes = {
      syn:    () => enrichAndShow('synonyms', grid, COUNT, 'Loading synonyms from the dictionary…'),
      ant:    () => enrichAndShow('antonyms', grid, COUNT, 'Loading antonyms from the dictionary…'),
      confuse:() => {
        // curated confusable pairs, but a RANDOM sample each time
        const pool = window.IELTS.PAIRS.map(p => ({
          a: p.a, b: p.b, cnA: (getWordFromBank(p.a)||{}).cn || '', note: p.note, rel: 'confusable'
        }));
        showRelCards(pool, grid, COUNT);
      },
      words:  () => {
        grid.innerHTML = '';
        shuffle(window.IELTS.BANK).slice(0, COUNT).forEach(w => grid.appendChild(buildFlipCard(w)));
      }
    };
    const setMode = (m) => {
      currentMode = m;
      // highlight active button
      [['cdSyn','syn'],['cdAnt','ant'],['cdConfuse','confuse'],['cdWords','words']].forEach(([id,mm]) => {
        const b = document.getElementById(id);
        if (b) { b.classList.toggle('secondary', mm === m); b.classList.toggle('ghost', false); }
      });
      modes[m]();
    };
    $('#cdSyn').addEventListener('click', () => setMode('syn'));
    $('#cdAnt').addEventListener('click', () => setMode('ant'));
    $('#cdConfuse').addEventListener('click', () => setMode('confuse'));
    $('#cdWords').addEventListener('click', () => setMode('words'));
    $('#cdShuffle').addEventListener('click', () => modes[currentMode]());
    setMode('syn');
  }

  function buildFlipCard(w) {
    const examples = (w.examples || []).slice(0, 2);
    // English definition may be long; show the first sense only, trimmed.
    const def = (w.def || '').split(/(?<=[.;])\s*/)[0] || '';
    const defShort = def.length > 110 ? def.slice(0, 107).trim() + '…' : def;
    const wrap = el(`
      <div class="flip-wrap">
        <div class="flip-card">
          <div class="flip-face flip-front">
            <div class="big">${esc(w.en)}</div>
            ${w.cn ? `<div class="cn-meaning">${esc(w.cn)}</div>` : ''}
            ${defShort ? `<div class="en-def">${esc(defShort)}</div>` : ''}
            <div class="hint">tap to flip · 🔊</div>
          </div>
          <div class="flip-face flip-back">
            <h4>${esc(w.en)} <span class="phon">${esc(w.phon || '')}</span></h4>
            ${examples.length ? examples.map(e => `<div class="ex"><button class="say-inline" data-say="${esc(e)}" title="Read aloud">🔊</button><span>${esc(e)}</span></div>`).join('') : '<div class="ex">No example.</div>'}
            ${w.etymology ? `<div class="etym"><b>Origin:</b> ${esc(w.etymology)}</div>` : ''}
          </div>
        </div>
      </div>`);
    bindFlip(wrap, w.en);
    return wrap;
  }
  function bindFlip(wrap, word) {
    const card = wrap.querySelector('.flip-card');
    card.addEventListener('click', e => {
      // clicking an inline read-aloud button should NOT flip the card
      if (e.target.closest('.say-inline')) return;
      card.classList.toggle('flipped');
      window.Audio2.speakWord(word);
    });
    // wire up per-example read-aloud buttons (on the back face)
    wrap.querySelectorAll('[data-say]').forEach(b =>
      b.addEventListener('click', e => {
        e.stopPropagation();
        window.Audio2.speak(b.dataset.say);
      }));
  }

  /* ============================================================
     STATS
     ============================================================ */
  function renderStats() {
    const days = window.Store.getDayList();
    const last = days.slice(-14);
    const lineData = last.map(([k, d]) => ({ label: k.slice(5), value: d.score }));
    const barData = last.slice(-7).map(([k, d]) => ({ label: k.slice(8), value: d.correct + d.wrong }));
    const accData = last.slice(-7).map(([k, d]) => {
      const tot = d.correct + d.wrong;
      return { label: k.slice(8), value: tot ? Math.round(d.correct / tot * 100) : 0, color: '#10b981' };
    });
    const p = window.Store.getProgress();
    const totalC = last.reduce((s, [, d]) => s + (d.correct || 0), 0);
    const totalW = last.reduce((s, [, d]) => s + (d.wrong || 0), 0);
    const acc = (totalC + totalW) ? Math.round(totalC / (totalC + totalW) * 100) : 0;

    view.innerHTML = `
      <h1 class="page-title">Statistics</h1>
      <p class="page-sub">Your learning trends over the last two weeks.</p>
      <div class="grid grid-4 section">
        <div class="card stat"><div class="num">${acc}%</div><div class="lbl">ACCURACY (14D)</div></div>
        <div class="card stat"><div class="num">${totalC}</div><div class="lbl">CORRECT (14D)</div></div>
        <div class="card stat"><div class="num">${totalW}</div><div class="lbl">WRONG (14D)</div></div>
        <div class="card stat"><div class="num">${p.longestStreak || 0} 🔥</div><div class="lbl">BEST STREAK</div></div>
      </div>
      <div class="card section"><h3>📈 Daily Score</h3><canvas id="cLine" height="220"></canvas></div>
      <div class="grid grid-2 section">
        <div class="card"><h3>🧩 Questions Answered (7D)</h3><canvas id="cBar" height="200"></canvas></div>
        <div class="card"><h3>🎯 Daily Accuracy (7D)</h3><canvas id="cAcc" height="200"></canvas></div>
      </div>
    `;
    setTimeout(() => {
      const l = $('#cLine'); if (l) window.Charts.line(l, lineData);
      const b = $('#cBar'); if (b) window.Charts.bar(b, barData);
      const a = $('#cAcc'); if (a) window.Charts.bar(a, accData);
    }, 30);
  }

  /* ============================================================
     VOCABULARY (overview, search, export)
     ============================================================ */
  function renderVocab() {
    const render = (q = '') => {
      const ql = q.toLowerCase();
      const bank = window.IELTS.BANK.filter(w =>
        !ql || w.en.toLowerCase().includes(ql) || (w.cn || '').includes(q));
      const errs = window.Store.getErrors().filter(w =>
        !ql || w.en.toLowerCase().includes(ql) || (w.cn || '').includes(q));
      const phrs = window.Store.getPhrases().filter(p =>
        !ql || p.en.toLowerCase().includes(ql) || (p.cn || '').includes(q));
      view.innerHTML = `
        <h1 class="page-title">Vocabulary</h1>
        <p class="page-sub">All built-in words, your error words and phrases in one place.</p>
        <div class="row section">
          <input id="vSearch" class="input" value="${esc(q)}" placeholder="Search English or 中文..." style="flex:1;" autocomplete="off" />
          <button class="btn secondary" id="vExport">⬇ Export JSON</button>
          <button class="btn ghost" id="vReset" title="Reset all local data">Reset</button>
        </div>
        <div class="grid grid-3 section">
          <div class="card"><h3>IETLS Bank</h3><div class="num" style="font-size:1.6rem;font-weight:700;color:var(--c2)">${bank.length}</div></div>
          <div class="card"><h3>Error Words</h3><div class="num" style="font-size:1.6rem;font-weight:700;color:var(--bad)">${errs.length}</div></div>
          <div class="card"><h3>Phrases</h3><div class="num" style="font-size:1.6rem;font-weight:700;color:var(--ok)">${phrs.length}</div></div>
        </div>
        <div class="grid grid-2 section">
          <div class="card">
            <h3>📚 Bank Words</h3>
            <div style="max-height:320px;overflow:auto;">
              <ul class="word-list">${bank.map(w => `
                <li class="word-item"><span class="w">${esc(w.en)}</span><span class="m">${esc(w.cn||'')}</span>
                  <button class="btn small ghost" data-say="${esc(w.en)}">🔊</button></li>`).join('') || '<li class="muted">No match.</li>'}
              </ul>
            </div>
          </div>
          <div class="card">
            <h3>📕 Error Bank</h3>
            <div style="max-height:160px;overflow:auto;">
              <ul class="word-list">${errs.map(w => `<li class="word-item"><span class="w">${esc(w.en)}</span><span class="m">${esc(w.cn||'')}</span></li>`).join('') || '<li class="muted">Empty.</li>'}</ul>
            </div>
            <h3 style="margin-top:12px;">💬 Phrases</h3>
            <div style="max-height:160px;overflow:auto;">
              <ul class="word-list">${phrs.map(p => `<li class="word-item"><span class="w">${esc(p.en)}</span><span class="m">${esc(p.cn||'')}</span></li>`).join('') || '<li class="muted">Empty.</li>'}</ul>
            </div>
          </div>
        </div>`;
      view.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => window.Audio2.speakWord(b.dataset.say)));
      $('#vSearch').addEventListener('input', e => render(e.target.value));
      $('#vExport').addEventListener('click', () => {
        const data = window.Store.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'ielts-errorbook-backup.json'; a.click();
        URL.revokeObjectURL(url);
        toast('Exported backup ✓', 'ok');
      });
      $('#vReset').addEventListener('click', () => {
        if (confirm('Reset ALL local data (error bank, phrases, scores)? This cannot be undone.')) {
          window.Store.resetAll();
          window.Store.seedIfFirstRun();
          toast('All data reset', '');
          go('dashboard');
        }
      });
    };
    render('');
  }

  /* ============================================================
     CALENDAR (check-in grid)
     ============================================================ */
  function renderCalendar() {
    const p = window.Store.getProgress();
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1);
    const startDow = first.getDay(); // 0 Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const tKey = window.todayKey();
    const heads = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    let cells = '';
    for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell" style="background:transparent;"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const day = p.days[dk];
      let cls = '';
      let pts = '';
      if (day) {
        cls = day.failed ? 'fail' : 'has';
        pts = `<span class="pts">${day.score >= 0 ? '+' : ''}${day.score}</span>`;
      }
      if (dk === tKey) cls += ' today';
      cells += `<div class="cal-cell ${cls}">${d}${pts}</div>`;
    }

    const qualified = Object.values(p.days).filter(d => d.score >= 0 && (d.correct + d.wrong) > 0).length;
    const failed = Object.values(p.days).filter(d => d.failed).length;

    view.innerHTML = `
      <h1 class="page-title">Check-in Calendar</h1>
      <p class="page-sub">${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })} · <span style="color:var(--ok);font-weight:600;">green = qualified</span>, <span style="color:var(--fail);font-weight:600;">yellow = unqualified</span> (score &lt; 0)</p>
      <div class="grid grid-3 section">
        <div class="card stat"><div class="num">${qualified}</div><div class="lbl">QUALIFIED DAYS</div></div>
        <div class="card stat"><div class="num" style="color:var(--fail)">${failed}</div><div class="lbl">UNQUALIFIED DAYS</div></div>
        <div class="card stat"><div class="num">${p.streak || 0} 🔥</div><div class="lbl">CURRENT STREAK</div></div>
      </div>
      <div class="card section">
        <div class="cal-grid">${heads.map(h => `<div class="cal-head">${h}</div>`).join('')}${cells}</div>
      </div>
    `;
  }

  /* ----------------------------- helpers ----------------------------- */
  function emptyHTML(title, msg) {
    return `<div class="empty"><span class="ico">📭</span><div>${esc(title)}</div><div class="muted" style="margin-top:4px;">${esc(msg)}</div></div>`;
  }
  function emptyState(title, msg, btnLabel, route) {
    return `<div class="card" style="max-width:560px;margin:40px auto;text-align:center;">
      <div class="empty"><span class="ico">📭</span><div>${esc(title)}</div><div class="muted" style="margin-top:4px;">${esc(msg)}</div></div>
      <button class="btn" style="margin-top:16px;" data-go="${route}">${esc(btnLabel)}</button>
    </div>`;
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    window.Store.seedIfFirstRun();
    window.Audio2.init();
    refreshScore();

    // tab clicks
    document.querySelectorAll('.tab').forEach(t => {
      if (t.dataset.route) t.addEventListener('click', () => go(t.dataset.route));
    });
    $('#brand') && $('#brand');
    document.querySelector('.brand').addEventListener('click', () => go('dashboard'));
    // sound toggle
    const sBtn = $('#soundToggle');
    const syncSound = () => {
      const on = window.Audio2.enabled();
      sBtn.classList.toggle('off', !on);
      sBtn.textContent = on ? '🔊' : '🔇';
    };
    syncSound();
    sBtn.addEventListener('click', () => { window.Audio2.toggle(); syncSound(); });

    // route from hash
    const hash = location.hash.replace('#', '');
    go(ROUTES[hash] ? hash : 'dashboard');
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
