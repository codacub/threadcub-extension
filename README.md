# ThreadCub Chrome Extension (v1.0.4)

ThreadCub helps you stay in control of long AI conversations.

It adds a small floating button to supported AI chat sites so you can:
- **Save** a full conversation as a structured **JSON, Markdown, or PDF** file
- **Highlight + tag** key parts of a chat ("Pawmarks") with **anchors** and manage them in a side panel
- **Continue** a conversation into another AI platform by carrying context forward

> Local-first by default. No required login.

---

## What's included

### ✅ Core features
- **Multi-format conversation export**
  - **JSON** - Structured data with title, URL, platform, timestamp, and messages
  - **Markdown** - Clean, readable format for documentation
  - **PDF** - Professional export with ThreadCub branding
  - Export menu with three-dot dropdown for easy format selection
  
- **Pawmarks (highlight + tagging)**
  - Select text → tag it (Don't Forget / Backlog / Priority)
  - Create **anchors** for quick navigation to important sections
  - Highlights **persist across sessions** via Chrome storage + XPath range restoration
  - **Side panel** with separate tabs for Tags and Anchors
  - Copy tagged text to clipboard with one click
  - Jump-to-highlight functionality
  - Individual delete controls for tags and anchors
  - Tooltips on all action buttons for better discoverability
  
- **Continue Chat (cross-tab continuation)**
  - Stores continuation data in Chrome storage
  - Opens the next platform and auto-fills the prompt
  - Auto-submit supported on some platforms (see below)

### 🔐 Authentication / accounts (optional)
ThreadCub does **not** use a full auth system in the extension popup.
It uses an **anonymous session ID** by default, and can optionally read an auth token
from a ThreadCub dashboard tab (if present) for account linking.

---

## Platform support

| Platform | Status | Notes |
|---|---:|---|
| Claude.ai | Fully implemented | Strongest extraction + enhanced role detection |
| ChatGPT (chatgpt.com) | Fully implemented | Alternating role detection |
| Gemini | Fully implemented | Class-based role detection |
| Copilot | Fully implemented | More generic selectors / fallbacks |
| Grok | ⚠️ Partial | Framework exists — needs real DOM selectors |
| X.com/i/grok | ⚠️ Partial | Framework exists — needs real DOM selectors |
| DeepSeek | ⚠️ Partial | Framework exists — needs real DOM selectors |
| Perplexity | ⚠️ Partial | Framework exists — needs real DOM selectors |

Continuation behaviour:
- **Claude / X.omc/i/grok / Grok.com:** direct flow, can auto-submit
- **ChatGPT / Gemini / CoPilot/ DeepSeek / Perplexity:** file-based flow, requires manual upload step before submitting

---

## Project structure (high level)

- `manifest.json` — Manifest V4, content scripts load order
- `background.js` — service worker (downloads, API calls, auth token lookup)
- `content.js` — entry point
- `src/`
  - `core/` — app initializer, conversation extractor, floating button UI
  - `features/` — continuation, tagging (tags + anchors), downloads, platform autostart
  - `services/` — API + storage wrappers
  - `ui/` — side panel with tabs + UI utilities
  - `adapters/` — platform-specific adapters for chat extraction
  - `utils/` — platform detection + helpers
- `assets/` — CSS + images/icons
- `popup/` — minimal popup (feedback form + Discord webhook)
- `docs/` — audits, quick start, testing guides

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
   - **Tag** → highlight text and create tags or anchors
   - **Anchor** → create quick-jump anchors for important sections
   - **Side Panel** → view all your tags and anchors with filtering and navigation
   - **Export** → choose JSON, Markdown, or PDF format from the dropdown menu
   - **Continue Chat** → carry the conversation into another platform

---

## Export formats

### JSON
Structured data including:
- `title`, `url`, `platform`, `timestamp`
- `messages[]` with `role`, `content`, timestamps
- Smart filename generation (platform + date/time)

### Markdown
Clean, readable format perfect for:
- Documentation
- Sharing conversations
- Archiving discussions

### PDF
Professional export featuring:
- ThreadCub branding
- Formatted conversation layout
- Platform and metadata information
- Tagged sections highlighted

---

## What's New in v1.0.4

### Side Panel Enhancements
- Fixed tab switching - anchors open to Anchors tab, tags to Tags tab
- Standardized icon styling across all buttons
- Added tooltips to all icon buttons
- Copy-to-clipboard on tag cards
- Improved visual consistency

### Export Improvements
- Multi-format export (JSON, Markdown, PDF)
- Three-dot menu for format selection
- ThreadCub logo on PDF exports
- Direct download without opening new tabs

### Data Persistence
- Tags and anchors persist across sessions
- Survives browser cache clearing
- Manual deletion only

---

## Docs

- `docs/PROJECT-AUDIT.md` — deep codebase audit
- `docs/development/QUICK-START.md` — install + troubleshooting notes
- `docs/development/GROK_DEEPSEEK_TESTING.md` — how to finish Grok/DeepSeek selectors

---


## Links

- **Chrome Web Store**: [Coming soon - v1.0.4 pending review]
- **Website**: [https://threadcub.com](https://threadcub.com)
- **Discord Community**: Join for support and updates

---

## License

MIT License.