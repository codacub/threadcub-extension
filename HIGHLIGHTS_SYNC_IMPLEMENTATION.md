# Highlights Sync Implementation Guide

## Overview

This document describes the implementation of highlights sync functionality for the ThreadCub Chrome extension. This feature allows users to save highlighted text from AI chat interfaces (Claude.ai, ChatGPT, etc.) to their ThreadCub account via Supabase.

## What's Been Implemented

### ✅ Chrome Extension Changes (Part C - COMPLETED)

#### 1. **Authentication Module** (`src/auth/`)
- **`supabase-client.js`** - Supabase client for the extension
  - Session management (get, set, clear)
  - Token refresh functionality
  - API methods for highlights CRUD operations
  - ⚠️ **REQUIRES**: Update `SUPABASE_ANON_KEY` with actual key from web app

- **`auth-manager.js`** - Authentication flow management
  - Login popup handling
  - Session callbacks
  - Disconnect functionality
  - Cross-extension auth state sync

#### 2. **Metadata Scraper** (`src/utils/metadata-scraper.js`)
- Platform detection (Claude, ChatGPT, Gemini, Copilot)
- Chat ID extraction from URLs
- Chat title scraping
- Message role detection (user vs assistant)
- Surrounding context extraction
- Full metadata gathering for highlights

#### 3. **Highlight Sync Service** (`src/services/highlight-sync-service.js`)
- Save highlights with automatic Supabase sync
- Local storage backup (offline support)
- Pending sync queue management
- Sync retry logic
- Highlight deletion (local and remote)

#### 4. **Integration with Existing Tagging System** (`tagging.js`)
- Updated `createTagFromSelection()` to sync highlights
- Added import for `highlightSyncService`
- Automatic sync on tag creation
- User notifications for sync status

#### 5. **Popup UI Updates**
- **`popup/popup.html`** - Added auth section with:
  - Connected state (shows email, sync status)
  - Disconnected state (Connect button)
  - Disconnect button

- **`popup/popup.css`** - Styled auth section

- **`popup/popup.js`** - Auth management:
  - `setupAuthSection()` - Initialize auth UI
  - `updateAuthUI()` - Update based on auth state
  - `handleConnect()` - Open login popup
  - `handleDisconnect()` - Disconnect account
  - Real-time sync status display

#### 6. **Manifest Updates** (`manifest.json`)
- Added Supabase host permission
- Added `externally_connectable` for web app communication

## What Still Needs to Be Done

### ⚠️ Required Actions

#### 1. **Update Supabase Anon Key**
- **File**: `src/auth/supabase-client.js`
- **Line**: 6
- **Action**: Replace placeholder with actual `NEXT_PUBLIC_SUPABASE_ANON_KEY` from web app

```javascript
// Current (REPLACE THIS):
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // TODO: Replace with actual anon key

// Get the real key from:
// - Web app .env file: NEXT_PUBLIC_SUPABASE_ANON_KEY
// - OR Supabase dashboard: Settings > API > anon/public key
```

### 📋 Web App Changes (Parts A & B - NOT YET IMPLEMENTED)

These need to be done in the **ThreadCub web app repository**:

#### Part A: Database Changes

**File**: Create `supabase/migrations/008_add_highlights.sql` (or next available number)

```sql
-- Create highlights table
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Source information
  source_url TEXT NOT NULL,
  source_chat_id TEXT,
  source_title TEXT,
  source_platform TEXT NOT NULL,

  -- Highlight content
  highlighted_text TEXT NOT NULL,
  surrounding_context TEXT,
  message_role TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Future features
  tags TEXT[],
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX highlights_user_id_idx ON highlights(user_id);
CREATE INDEX highlights_conversation_id_idx ON highlights(conversation_id);
CREATE INDEX highlights_source_chat_id_idx ON highlights(source_chat_id);
CREATE INDEX highlights_created_at_idx ON highlights(created_at DESC);

-- RLS policies
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own highlights"
  ON highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights"
  ON highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
  ON highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON highlights FOR DELETE
  USING (auth.uid() = user_id);

-- Function to link highlights when conversation is imported
CREATE OR REPLACE FUNCTION link_highlights_to_conversation(
  p_conversation_id UUID,
  p_source_chat_id TEXT,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE highlights
  SET
    conversation_id = p_conversation_id,
    updated_at = NOW()
  WHERE
    user_id = p_user_id
    AND conversation_id IS NULL
    AND source_chat_id = p_source_chat_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Part B: Web App Auth Pages

**1. Extension Login Page**

**File**: `app/auth/extension-login/page.tsx`

- Simple email/password login form
- Minimal UI (no full navigation)
- Redirect to `/auth/extension-callback` on success

**2. Extension Callback Page**

**File**: `app/auth/extension-callback/page.tsx`

- Display "Connected successfully!" message
- Send auth session back to extension via `chrome.runtime.sendMessage`
- Include script to communicate with extension

Example script:
```javascript
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Get session from Supabase
  const session = await supabase.auth.getSession();

  // Send to extension
  chrome.runtime.sendMessage(
    EXTENSION_ID,
    {
      type: 'THREADCUB_AUTH_SUCCESS',
      session: session.data.session
    }
  );
}
```

**3. Extension Session API**

**File**: `app/api/auth/extension-session/route.ts`

- POST: Accepts refresh token, returns new access token
- GET: Validates current session, returns user info

## How It Works

### User Flow

1. **User opens extension popup**
   - Sees "Connect to ThreadCub" button if not authenticated
   - Sees email and sync status if authenticated

2. **User clicks "Connect to ThreadCub"**
   - Opens login popup (threadcub.com/auth/extension-login)
   - User logs in with email/password
   - Redirected to callback page
   - Session sent back to extension
   - Extension stores session in chrome.storage.local
   - Popup UI updates to show connected state

3. **User highlights text and tags it**
   - Extension saves highlight locally (backup)
   - If authenticated, syncs to Supabase
   - Shows success notification

4. **Sync Status**
   - Shows "All synced ✓" when up to date
   - Shows "X pending sync" when offline or sync failed
   - Auto-retries failed syncs when user connects

### Data Flow

```
User highlights text
        ↓
metadataScraper.gatherHighlightMetadata()
        ↓
highlightSyncService.saveHighlight()
        ↓
    ┌───────┴────────┐
    ↓                ↓
Save locally    Sync to Supabase (if authenticated)
    ↓                ↓
chrome.storage  supabaseApi.insertHighlight()
```

## Testing Checklist

Before testing, ensure:
- [ ] Supabase anon key is updated
- [ ] Database migration is run
- [ ] Web app auth pages are created
- [ ] Extension is reloaded in Chrome

### Test Scenarios

1. **Authentication Flow**
   - [ ] Click "Connect to ThreadCub" opens login popup
   - [ ] Login successful updates extension UI
   - [ ] User email displays correctly
   - [ ] Disconnect button works

2. **Highlight Saving (Authenticated)**
   - [ ] Highlight text on Claude.ai
   - [ ] Add tag
   - [ ] Check Supabase highlights table for new record
   - [ ] Verify metadata (source_url, source_chat_id, source_title, etc.)
   - [ ] Check local storage backup

3. **Highlight Saving (Not Authenticated)**
   - [ ] Disconnect from ThreadCub
   - [ ] Highlight and tag text
   - [ ] Verify saved to local storage only
   - [ ] Reconnect
   - [ ] Verify pending highlights sync

4. **Sync Status**
   - [ ] Check "All synced" shows when up to date
   - [ ] Go offline, add highlight
   - [ ] Check "1 pending sync" shows
   - [ ] Go online
   - [ ] Auto-sync works

## File Structure

```
threadcub-extension/
├── manifest.json (updated)
├── tagging.js (updated)
├── popup/
│   ├── popup.html (updated)
│   ├── popup.css (updated)
│   └── popup.js (updated)
└── src/
    ├── auth/
    │   ├── supabase-client.js (new)
    │   └── auth-manager.js (new)
    ├── services/
    │   └── highlight-sync-service.js (new)
    └── utils/
        └── metadata-scraper.js (new)
```

## Next Steps

1. **Update Supabase anon key** in `src/auth/supabase-client.js`
2. **Create database migration** in web app (Part A)
3. **Create auth pages** in web app (Part B)
4. **Test end-to-end flow**
5. **Create highlights display UI** in web app (future)

## Notes

- All highlights are saved locally as backup
- Sync happens automatically when authenticated
- Failed syncs are queued and retried
- Local storage can be cleared of synced highlights
- Metadata includes platform, URL, chat ID, title, role
- Tags from tagging system are included in highlight data
