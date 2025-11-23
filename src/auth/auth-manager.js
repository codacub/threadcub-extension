// Authentication manager for ThreadCub Chrome extension
// Handles login flow, session management, and auth state changes

import { supabaseAuth } from './supabase-client.js';

/**
 * Authentication manager
 */
export const authManager = {
  /**
   * Open login popup to ThreadCub web app
   */
  openLoginPopup() {
    const loginUrl = 'https://threadcub.com/auth/extension-login';
    const width = 450;
    const height = 600;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    const popup = window.open(
      loginUrl,
      'ThreadCub Login',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.error('Popup was blocked. Please allow popups for this site.');
      return null;
    }

    return popup;
  },

  /**
   * Handle auth callback (called from message listener)
   * @param {Object} session - Session object from Supabase
   * @returns {Promise<void>}
   */
  async handleAuthCallback(session) {
    try {
      await supabaseAuth.setSession(session);
      // Trigger UI update
      this.notifyAuthChanged();
      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('Failed to handle auth callback:', error);
      throw error;
    }
  },

  /**
   * Disconnect account (sign out)
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await supabaseAuth.clearSession();
      this.notifyAuthChanged();
      console.log('✅ Disconnected from ThreadCub');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  },

  /**
   * Get current user info
   * @returns {Promise<Object|null>} User object or null
   */
  async getCurrentUser() {
    const session = await supabaseAuth.getSession();
    return session?.user || null;
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    return await supabaseAuth.isAuthenticated();
  },

  /**
   * Notify all listeners that auth state has changed
   */
  notifyAuthChanged() {
    // Dispatch custom event for same-page listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('threadcub-auth-changed'));
    }

    // Send message to all tabs (for extension-wide sync)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'THREADCUB_AUTH_CHANGED'
      }).catch(() => {
        // Ignore errors if no listeners
      });
    }
  }
};

// Listen for auth messages from the callback page
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Message listener for cross-origin auth callback
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'THREADCUB_AUTH_SUCCESS' && message.session) {
      authManager.handleAuthCallback(message.session)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
    }

    if (message.type === 'THREADCUB_AUTH_ERROR') {
      console.error('Auth error:', message.error);
      sendResponse({ success: false, error: message.error });
    }
  });

  // Listen for messages from external sources (web app callback page)
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    // Verify sender is from threadcub.com
    if (!sender.url || !sender.url.includes('threadcub.com')) {
      console.warn('Ignoring auth message from unauthorized source:', sender.url);
      return;
    }

    if (message.type === 'THREADCUB_AUTH_SUCCESS' && message.session) {
      authManager.handleAuthCallback(message.session)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
    }
  });
}
