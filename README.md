# ThreadCub Chrome Extension (v1.0.8)

ThreadCub helps you stay in control of long AI conversations.

It adds a small floating button to supported AI chat sites so you can:
- **Save** a full conversation as a structured **JSON, Markdown, or PDF** file
- **Highlight + tag** key parts of a chat ("Pawmarks") with **anchors** and manage them in a side panel
- **Continue** a conversation into another AI platform by carrying context forward
- **Archive** conversations to ThreadCub with a shareable link — works for both logged-in and guest users

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

- **Send to ThreadCub**
  - Archives the full conversation to threadcub.com and generates a shareable link
  - Works for both **logged-in users** (linked to account) and **guests** (anonymous session)
  - Guest session ID persisted in `chrome.storage.local` — no login required

### 🔐 Authentication / accounts (optional)
ThreadCub does **not** require login. It uses an **anonymous session ID** by default, and can optionally authenticate via a ThreadCub account tab for account linking. Login is handled via OAuth in a new tab — the popup updates to show your email and a logout button when authenticated.

### 📊 Usage Analytics (v1.0.5+)
ThreadCub includes privacy-first analytics to help improve the extension:
- **What we track:** Feature usage (tags created, exports, continuations), platform detection, extension installs/updates
- **What we DON'T track:** Conversation content, personal information, or any identifiable data
- **How it works:** Anonymous tracking via Google Analytics 4 Measurement Protocol
- **Privacy:** All tracking uses anonymous client IDs with no personal data collection

---

## Platform support

| Platform | Status | Notes |
|---|---:|---|
| Claude.ai | Fully implemented | Strongest extraction + enhanced role detection |
| ChatGPT (chatgpt.com) | Fully implemented | Alternating role detection |
| Gemini | Fully implemented | Enhanced conversation detection |
| Grok (grok.com / x.com/i/grok) | Fully implemented | Full extraction, download, continue, tagging |
| DeepSeek (chat.deepseek.com) | Fully implemented | Full extraction, download, continue, tagging |
| Perplexity (perplexity.ai) | Fully implemented | Full support |
| Microsoft Copilot | Partial | Tagging/download/continue work; highlights don't persist across chats |

Continuation behaviour:
- **Claude / Grok / X.com/i/grok:** direct flow, can auto-submit
- **ChatGPT / Gemini / Copilot / DeepSeek / Perplexity:** file-based flow, requires manual upload step before submitting

---

## Project structure (high level)

- `manifest.json` — Manifest V3, content scripts load order
- `background.js` — service worker (downloads, API calls, auth token lookup, analytics)
- `content.js` — entry point
- `src/`
  - `core/` — app initializer, conversation extractor, floating button UI
  - `features/` — continuation, tagging (tags + anchors), downloads, platform autostart
  - `services/` — API + storage wrappers, **analytics service**
  - `ui/` — side panel with tabs + UI utilities
  - `adapters/` — platform-specific adapters for chat extraction
  - `utils/` — platform detection + helpers
- `assets/` — CSS + images/icons
- `popup/` — minimal popup (auth state, feedback form + Discord webhook)
- `docs/` — audits, quick start, testing guides

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
   - **Send to ThreadCub** → archive to threadcub.com and get a shareable link

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

## What's New in v1.0.8

### Guest Saving & Share Links 🐾
- **Guest saving now fully works** — no login required to save a conversation to ThreadCub and get a real share URL
- Guest session ID generated and persisted in `chrome.storage.local` so the same guest identity is reused across saves
- Fixed: extension was generating timestamp-based fallback URLs (`/fallback/[timestamp]`) instead of real UUIDs — now produces `https://threadcub.com/api/share/[uuid]` for both guests and authenticated users
- Fixed: stale auth tokens no longer block guest saves — on 401, the extension clears the token and retries as a guest automatically
- Fixed: guest users no longer trigger a wasted encrypted-payload round trip; encryption is skipped entirely when no auth token is present

### Reliability Improvements
- **Service worker retry** — `sendMessage` calls now automatically retry once after 500ms if the background service worker has gone idle, reducing the need to manually reload the extension
- **Duplicate save prevention** — a 60-second soft dedup check prevents the same conversation being saved multiple times if the button is clicked twice in quick succession

### Backend
- Fixed Postgres error 42P10 (`ON CONFLICT` upsert was referencing columns with no unique constraint) — replaced with plain `INSERT`

---

## Previous Updates

### v1.0.7 - Authentication, Enhanced Saving & Download Improvements

**New Features:**
- **User Authentication** — Log in to ThreadCub directly from the extension popup. OAuth flow opens in a new tab; popup updates to show authenticated state with email and logout button
- **Send to ThreadCub button** — 5th action button on the floating stack. Saves the conversation to ThreadCub without opening a new tab
- **Download format selection** — Download button now shows a flyout menu on hover with [JSON] and [MD] options. Markdown export formats the conversation with a title header, metadata block, and alternating User/Assistant sections

**Bug Fixes:**
- **Claude.ai title extraction** — Conversations were being saved with the title "Claude" instead of the actual conversation name. Fixed with a 3-tier fallback: regex stripping of " - Claude" suffix, sidebar link matching, then "Untitled Conversation"
- **Download flyout UX** — Fixed tooltip overlapping flyout menu, button stack collapsing when moving mouse to flyout, and button size shifting on flyout hover

---

### v1.0.6 - Cross Platform Updates

**New Platform Support:**
- **Grok (grok.com / x.com/i/grok)** — Full conversation extraction, download, continue chat, tagging and anchors, side panel
- **DeepSeek (chat.deepseek.com)** — Full extraction, download, tagging, continuation
- **Gemini** — Enhanced conversation detection and length monitoring

**New Features:**
- **Microsoft Copilot support** — Tagging, anchoring, side panel, download and continue chat. Highlights don't persist across Copilot chat navigation (documented in onboarding modal)
- **Onboarding modal for Copilot** — First-time users see a friendly explanation of current limitations

**Bug Fixes:**
- Fixed conversation isolation on DeepSeek (tags/anchors no longer persist across different conversations)
- Fixed conversation length detector across all platforms
- Fixed Claude.ai anchor highlighting CSS selector
- Fixed "Continue Chat" button regressions
- Fixed Grok download modal
- Removed 5000 character selection cap for tagging
- Fixed Copilot "Continue Chat" routing (was defaulting to ChatGPT)
- Removed 310 lines of non-working experimental Copilot persistence code

---

### v1.0.5 - Google Analytics Integration

- Added Google Analytics 4 tracking for usage insights
- Privacy-first approach: no conversation content or personal data tracked
- Track feature usage (tags, anchors, exports, continuations)
- Track extension installs and updates
- Track platform detection (Claude, ChatGPT, Gemini, etc.)
- Anonymous client IDs only

---

### v1.0.4 - Side Panel & Export Enhancements

**Side Panel Improvements:**
- Fixed tab switching — anchors open to Anchors tab, tags to Tags tab
- Standardised icon styling across all buttons
- Added tooltips to all icon buttons
- Copy-to-clipboard on tag cards
- Improved visual consistency

**Export Features:**
- Multi-format export (JSON, Markdown, PDF)
- Three-dot menu for format selection
- ThreadCub logo on PDF exports
- Direct download without opening new tabs

**Data Persistence:**
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

- **Chrome Web Store**: [threadcub.com](https://threadcub.com) (pending v1.0.8 review)
- **Website**: [https://threadcub.com](https://threadcub.com)
- **Discord Community**: Join for support and updates

---

## License

MIT License.