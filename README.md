# ThreadCub Chrome Extension (v1.0.2)

ThreadCub helps you stay in control of long AI conversations.

It adds a small floating button to supported AI chat sites so you can:
- **Save** a full conversation as a structured **JSON** file
- **Highlight + tag** key parts of a chat (“Pawmarks”) and manage them in a side panel
- **Continue** a conversation into another AI platform by carrying context forward

> Local-first by default. No required login.

---

## What’s included

### ✅ Core features
- **Conversation export (JSON)**
  - Downloads a JSON file containing title, URL, platform, timestamp, and messages
- **Pawmarks (highlight + tagging)**
  - Select text → tag it (Don’t Forget / Backlog / Priority)
  - Highlights persist across reloads via Chrome storage + XPath range restoration
  - Side panel to browse, filter, jump-to-highlight, and delete tags
- **Continue Chat (cross-tab continuation)**
  - Stores continuation data in Chrome storage
  - Opens the next platform and auto-fills the prompt
  - Auto-submit supported on some platforms (see below)

### 🔐 Authentication / accounts (optional)
ThreadCub does **not** use a full auth system in the extension popup.
It uses an **anonymous session ID** by default, and can optionally read an auth token
from a ThreadCub dashboard tab (if present) for account linking. :contentReference[oaicite:1]{index=1}

---

## Platform support

| Platform | Status | Notes |
|---|---:|---|
| Claude.ai | ✅ Fully implemented | Strongest extraction + enhanced role detection |
| ChatGPT (chatgpt.com) | ✅ Fully implemented | Alternating role detection |
| Gemini | ✅ Fully implemented | Class-based role detection |
| Copilot | ⚠️ Partial | More generic selectors / fallbacks |
| Grok | 🚧 Placeholder | Framework exists — needs real DOM selectors |
| DeepSeek | 🚧 Placeholder | Framework exists — needs real DOM selectors |

Continuation behaviour:
- **Claude / Grok:** direct flow, can auto-submit
- **ChatGPT / Gemini / DeepSeek:** file-based flow, requires manual upload step before submitting :contentReference[oaicite:2]{index=2}

---

## Project structure (high level)

- `manifest.json` — Manifest V3, content scripts load order
- `background.js` — service worker (downloads, API calls, auth token lookup)
- `content.js` — entry point
- `src/`
  - `core/` — app initializer, conversation extractor, floating button UI
  - `features/` — continuation, tagging, downloads, platform autostart
  - `services/` — API + storage wrappers
  - `ui/` — side panel + UI utilities
  - `utils/` — platform detection + helpers
- `assets/` — CSS + images/icons
- `popup/` — minimal popup (feedback form + Discord webhook)
- `docs/` — audits, quick start, testing guides :contentReference[oaicite:3]{index=3}

---

## Install (local development)

1. Clone this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the repo folder (the one containing `manifest.json`)

---

## How to use

1. Visit a supported platform (e.g. Claude / ChatGPT / Gemini)
2. The **floating ThreadCub button** appears
3. Use it to:
   - **Save Later** → export the conversation JSON
   - **Pawmarks** → highlight + tag key text and open the side panel
   - **Continue Chat** → carry the conversation into another platform

---

## Export format

JSON includes:
- `title`, `url`, `platform`, `timestamp`
- `messages[]` with `role`, `content`, timestamps
- Smart filename generation (platform + date/time) :contentReference[oaicite:4]{index=4}

> Note: **Markdown export is not implemented** in this release (only JSON). :contentReference[oaicite:5]{index=5}

---

## Docs

- `docs/PROJECT-AUDIT.md` — deep codebase audit
- `docs/development/QUICK-START.md` — install + troubleshooting notes
- `docs/development/GROK_DEEPSEEK_TESTING.md` — how to finish Grok/DeepSeek selectors :contentReference[oaicite:6]{index=6}


---

## License

MIT License. :contentReference[oaicite:7]{index=7}
