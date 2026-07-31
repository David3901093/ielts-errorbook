# 📘 IELTS Error Book

An offline-friendly **IELTS vocabulary trainer** built as a single static web app.
Turn your frequently misspelled words into a personal error bank, drill them with
dictation, build a daily review habit, and expand your vocabulary with flip cards
and a word encyclopedia — all in your browser, no backend required.

> 100% client-side. All progress is stored in **localStorage**. Deploy free on GitHub Pages.

---

## ✨ Features

| Module | What it does |
|---|---|
| **Dashboard** | Yesterday's recap, today's review prompt, score & streak, quick actions, recommended cards |
| **Dictation** | Type the English for a random error word. **+1** correct, **−3** wrong |
| **Error Bank** | Add words you got wrong; fuzzy-matching suggests the correct spelling for you to confirm |
| **CN → EN** | Daily phrase dictation (Chinese → English); add your own phrases |
| **Encyclopedia** | Flip cards: phonetics, definitions, examples, synonyms, etymology. Built-in + online (dictionaryapi.dev) + your own sentences |
| **Cards** | Confusable word pairs & random words as flip cards for contrast memory |
| **Stats** | Canvas charts: daily score, questions answered, accuracy |
| **Vocabulary** | Search/filter everything; export a JSON backup; reset |
| **Calendar** | Monthly check-in grid — qualified vs. unqualified days |

**Daily rule:** if a day's score drops **below 0**, that day is marked **Unqualified**.

---

## 🎨 Design

- Blue-cyan vibrant gradient (`#0ea5e9 → #2563eb`) with soft glows and glassmorphism cards.
- Card-based modern stream/grid layout, flat buttons, micro-animations for feedback.
- English-first UI (the **CN → EN** module is the only Chinese section, for exam realism).
- Pronunciation via the browser **Web Speech API**, with real-audio fallback from the dictionary API.

---

## 🗂️ Project structure

```
ielts-errorbook/
├── index.html          # SPA shell + top tab bar
├── css/style.css       # Blue-cyan theme, cards, animations
├── js/
│   ├── data.js         # Built-in IELTS words + phrases + examples + etymology
│   ├── store.js        # localStorage layer (errors, phrases, progress, settings)
│   ├── fuzzy.js        # Levenshtein distance → spelling suggestions
│   ├── api.js          # dictionaryapi.dev wrapper (silent degradation)
│   ├── audio.js        # Web Speech API pronunciation + audio fallback
│   ├── charts.js       # Native-canvas line/bar charts (no library)
│   └── app.js          # Router + page renderers + interactions
├── README.md
└── .gitignore
```

---

## 🚀 Run locally

No build step. Just open `index.html` in a modern browser:

```bash
# Option A: double-click index.html

# Option B: serve locally (recommended, avoids file:// quirks)
python -m http.server 8000
# then visit http://localhost:8000
```

---

## 🌐 Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo: **Settings → Pages → Source → Deploy from a branch → `main` / `(root)`**.
3. Save. Your site goes live at `https://<your-username>.github.io/<repo-name>/` in ~1 minute.

---

## 🔌 Data sources

- **Built-in vocabulary** was extracted from IELTS worksheets (the red/high-error words seed the error bank).
- **Online enrichment** (phonetics, extra examples, synonyms) comes from the free
  [dictionaryapi.dev](https://dictionaryapi.dev) — no API key, CORS-friendly.
- If offline or the API is rate-limited, the app **silently degrades** to built-in data and never blocks learning.

---

## 💾 Backup & reset

Open **Vocabulary → Export JSON** to download all your local data (error bank, phrases,
progress) as a backup. Use **Reset** on the same page to clear everything and re-seed.

---

Built for focused, exam-ready IELTS practice. Good luck! 🎯
