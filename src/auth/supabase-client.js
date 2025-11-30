// Supabase client for Chrome extension
// Provides authentication and API interaction with ThreadCub backend

const SUPABASE_URL = 'https://evbkoulaaityzztyutox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YmtvdWxhYWl0eXp6dHl1dG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTEwMDUsImV4cCI6MjA2ODE4NzAwNX0.OP6_JmlZwxo9p2ZpWSQMdE-wGVSqowB9kkT08A0c92Q';
/**
 * Authentication management for Supabase
 */
export const supabaseAuth = {
  /**
   * Get current session from chrome.storage
   * @returns {Promise<Object|null>} Session object or null
   */
  async getSession() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['supabase_session'], (result) => {
        resolve(result.supabase_session || null);
      });
    });
  },

  /**
   * Store session in chrome.storage
   * @param {Object} session - Session object from Supabase
   * @returns {Promise<void>}
   */
  async setSession(session) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ supabase_session: session }, resolve);
    });
  },

  /**
   * Clear session from chrome.storage
   * @returns {Promise<void>}
   */
  async clearSession() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['supabase_session'], resolve);
    });
  },

  /**
   * Check if user is authenticated and token is valid
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    console.log('🔐 [SupabaseAuth] Checking authentication...');
    const session = await this.getSession();
    console.log('🔐 [SupabaseAuth] Session retrieved:', session ? 'exists' : 'null');

    if (!session) {
      console.log('❌ [SupabaseAuth] No session found');
      return false;
    }

    if (!session.access_token) {
      console.log('❌ [SupabaseAuth] No access token in session');
      return false;
    }

    const expired = this.isExpired(session);
    console.log('🔐 [SupabaseAuth] Token expired:', expired);

    const authenticated = session && session.access_token && !expired;
    console.log('🔐 [SupabaseAuth] Is authenticated:', authenticated);

    return authenticated;
  },

  /**
   * Check if token is expired
   * @param {Object} session - Session object
   * @returns {boolean}
   */
  isExpired(session) {
    if (!session || !session.expires_at) return true;
    return Date.now() >= session.expires_at * 1000;
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object|null>} New session or null if failed
   */
  async refreshSession() {
    const session = await this.getSession();
    if (!session || !session.refresh_token) return null;

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const newSession = await response.json();
      await this.setSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return null;
    }
  }
};

/**
 * API interactions with Supabase
 */
export const supabaseApi = {
  /**
   * Insert a highlight into the database
   * @param {Object} highlightData - Highlight data to insert
   * @returns {Promise<Object>} Inserted highlight record
   */
  async insertHighlight(highlightData) {
    console.log('🚀 [SupabaseAPI] insertHighlight called with data:', highlightData);

    const session = await supabaseAuth.getSession();
    if (!session) {
      console.log('❌ [SupabaseAPI] No session found');
      throw new Error('Not authenticated');
    }

    console.log('🔐 [SupabaseAPI] Session found, user:', session.user?.email);

    // Refresh token if expired
    if (supabaseAuth.isExpired(session)) {
      console.log('⚠️ [SupabaseAPI] Token expired, refreshing...');
      const refreshed = await supabaseAuth.refreshSession();
      if (!refreshed) {
        console.log('❌ [SupabaseAPI] Failed to refresh token');
        throw new Error('Session expired');
      }
      console.log('✅ [SupabaseAPI] Token refreshed successfully');
    }

    const currentSession = await supabaseAuth.getSession();

    const payload = {
      user_id: currentSession.user.id,
      ...highlightData
    };

    console.log('📦 [SupabaseAPI] Request payload:', payload);
    console.log('🌐 [SupabaseAPI] Sending POST to:', `${SUPABASE_URL}/rest/v1/highlights`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/highlights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${currentSession.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 [SupabaseAPI] Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ [SupabaseAPI] Error response:', error);
      throw new Error(`Failed to save highlight: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✅ [SupabaseAPI] Successfully saved highlight:', result);
    return result;
  },

  /**
   * Get user's highlights
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of highlights
   */
  async getHighlights({ limit = 50, offset = 0 } = {}) {
    const session = await supabaseAuth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Refresh token if expired
    if (supabaseAuth.isExpired(session)) {
      const refreshed = await supabaseAuth.refreshSession();
      if (!refreshed) throw new Error('Session expired');
    }

    const currentSession = await supabaseAuth.getSession();

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/highlights?order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch highlights: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Delete a highlight
   * @param {string} highlightId - UUID of highlight to delete
   * @returns {Promise<void>}
   */
  async deleteHighlight(highlightId) {
    const session = await supabaseAuth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Refresh token if expired
    if (supabaseAuth.isExpired(session)) {
      const refreshed = await supabaseAuth.refreshSession();
      if (!refreshed) throw new Error('Session expired');
    }

    const currentSession = await supabaseAuth.getSession();

    const response = await fetch(`${SUPABASE_URL}/rest/v1/highlights?id=eq.${highlightId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${currentSession.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete highlight: ${response.status}`);
    }
  },

  /**
   * Update a highlight
   * @param {string} highlightId - UUID of highlight to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated highlight
   */
  async updateHighlight(highlightId, updates) {
    const session = await supabaseAuth.getSession();
    if (!session) throw new Error('Not authenticated');

    // Refresh token if expired
    if (supabaseAuth.isExpired(session)) {
      const refreshed = await supabaseAuth.refreshSession();
      if (!refreshed) throw new Error('Session expired');
    }

    const currentSession = await supabaseAuth.getSession();

    const response = await fetch(`${SUPABASE_URL}/rest/v1/highlights?id=eq.${highlightId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${currentSession.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update highlight: ${response.status}`);
    }

    return response.json();
  }
};
