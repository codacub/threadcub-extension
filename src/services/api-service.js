// =============================================================================
// ThreadCub API Service
// Consolidates all API calls to ThreadCub backend
// All authenticated endpoints use Authorization: Bearer <token> headers
// =============================================================================

// Temp flag: set to false to skip encryption entirely (for quick testing)
const USE_ENCRYPTION = true;

const ApiService = {
  // Base URL for all API calls
  BASE_URL: 'https://threadcub.com',

  // =============================================================================
  // HELPER: Build headers with optional Bearer auth
  // =============================================================================

  async _buildHeaders(extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders
    };

    // Get auth token from AuthService if available
    try {
      if (typeof window !== 'undefined' && window.AuthService) {
        const token = await window.AuthService.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔐 ApiService: Added Bearer auth header');
        }
      }
    } catch (error) {
      console.log('🔐 ApiService: Could not get auth token:', error.message);
    }

    return headers;
  },

  // =============================================================================
  // HELPER: Handle 401 responses (expired token)
  // =============================================================================

  async _handleUnauthorized() {
    console.log('🔐 ApiService: Received 401, clearing expired token...');
    try {
      if (typeof window !== 'undefined' && window.AuthService) {
        await window.AuthService.clearToken();
      }
    } catch (error) {
      console.log('🔐 ApiService: Error clearing token:', error.message);
    }
  },

  // =============================================================================
  // HELPER: Notify user of persistent save failure via chrome.notifications
  // Requires "notifications" permission in manifest.json.
  // Falls back to console.error if notifications API unavailable.
  // =============================================================================

  _notifySaveFailure(errorMsg) {
    const message = `Save failed: ${errorMsg}`;
    try {
      if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create('threadcub-save-error', {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'ThreadCub — Save Failed',
          message: message,
          priority: 2
        }, (notifId) => {
          if (chrome.runtime.lastError) {
            console.warn('🔔 ApiService: Notification failed:', chrome.runtime.lastError.message);
          }
        });
      } else {
        console.warn('🔔 ApiService: chrome.notifications not available — save error:', message);
      }
    } catch (e) {
      console.warn('🔔 ApiService: Notification error:', e.message);
    }
  },

  // =============================================================================
  // SAVE CONVERSATION
  // Extracted from: content.js, floating-button.js, background.js
  // =============================================================================

  async saveConversation(apiData) {
    try {
      console.log('🔍 ApiService.saveConversation: apiData keys:', Object.keys(apiData));

      const headers = await this._buildHeaders();
      let didAttemptEncrypted = false;

      // -----------------------------------------------------------------
      // Step 1: Try sending encrypted payload (if encryption is enabled)
      // Backend expects: { encrypted_payload: "base64...", title?, source? }
      // -----------------------------------------------------------------
      if (USE_ENCRYPTION) {
        try {
          const CryptoSvc = (typeof window !== 'undefined' && window.CryptoService) ||
                             (typeof self !== 'undefined' && self.CryptoService);

          if (CryptoSvc) {
            console.log('🔒 ApiService.saveConversation: Encrypting payload before send...');
            const encryptedBase64 = await CryptoSvc.encryptPayload(apiData);

            // Match backend schema: encrypted_payload + cleartext title/source for routing
            const encryptedPayload = {
              encrypted_payload: encryptedBase64,
              source: apiData.source || apiData.conversationData?.platform?.toLowerCase() || 'unknown',
              title: apiData.title || apiData.conversationData?.title || 'Untitled'
            };

            console.log('🔒 ApiService.saveConversation: Payload encrypted. Sending:', JSON.stringify({
              encrypted_payload: encryptedBase64.substring(0, 60) + '...[' + encryptedBase64.length + ' chars total]',
              source: encryptedPayload.source,
              title: encryptedPayload.title
            }));

            didAttemptEncrypted = true;
            const encResponse = await fetch('https://threadcub.com/api/conversations/save', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(encryptedPayload)
            });

            console.log('🔒 ApiService.saveConversation: Encrypted POST response status:', encResponse.status);

            if (encResponse.status === 401) {
              await this._handleUnauthorized();
              throw new Error('Authentication expired. Please log in again.');
            }

            if (encResponse.ok) {
              const data = await encResponse.json();
              console.log('✅ ThreadCub: Encrypted API call successful:', data);
              return data;
            }

            // Encrypted send rejected — log details and fall through to unencrypted
            const errBody = await encResponse.text();
            console.warn(
              `🔒 ApiService.saveConversation: Encrypted send failed (status ${encResponse.status}) — falling back to unencrypted payload.`,
              '\n  Response body:', errBody
            );
            // Fall through to unencrypted send below
          } else {
            console.warn('🔒 ApiService.saveConversation: CryptoService not available, skipping encryption');
          }
        } catch (encryptError) {
          if (encryptError.message.includes('Authentication expired')) {
            throw encryptError;
          }
          console.warn('🔒 ApiService.saveConversation: Encryption/send error, falling back to unencrypted:', encryptError.message);
        }
      } else {
        console.log('🔒 ApiService.saveConversation: USE_ENCRYPTION=false, sending unencrypted');
      }

      // -----------------------------------------------------------------
      // Step 2: Send original unencrypted payload (primary path or fallback)
      // Server expects: { conversationData: { messages, title?, source? }, title?, source? }
      // apiData may arrive as { conversationData: {...}, ... } from some callers
      // or as raw { messages: [...], ... } from others — normalise here.
      // -----------------------------------------------------------------
      if (didAttemptEncrypted) {
        console.log('🔒 ApiService.saveConversation: Retrying with original unencrypted payload...');
      }

      // Extract the inner conversation object regardless of how the caller shaped apiData
      const convData = apiData.conversationData || apiData;
      const source = apiData.source || convData.source || convData.platform?.toLowerCase() || 'unknown';
      const title  = apiData.title  || convData.title  || 'Untitled';

      const unencryptedPayload = {
        conversationData: {
          messages: convData.messages || [],
          title: title,
          source: source
        },
        title: title,
        source: source
      };

      console.log('🔍 ApiService.saveConversation: Unencrypted payload:', JSON.stringify(unencryptedPayload, null, 2));

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(unencryptedPayload)
      });

      console.log('🔍 ApiService.saveConversation: Unencrypted POST response status:', response.status);

      if (response.status === 401) {
        await this._handleUnauthorized();
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🐻 ApiService.saveConversation: Unencrypted send also failed!',
                       'Status:', response.status, '| Body:', errorText);
        this._notifySaveFailure(`Server returned ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ ThreadCub: API call successful (unencrypted fallback):', data);

      return data;

    } catch (error) {
      console.error('🐻 ThreadCub: API call failed:', error);
      this._notifySaveFailure(error.message);
      throw error;
    }
  },

  // =============================================================================
  // SAVE CONVERSATION (Background Script Version)
  // Extracted from: background.js
  // =============================================================================

  async handleSaveConversation(data) {
    try {
      console.log('🐻 ApiService.handleSaveConversation: data keys:', Object.keys(data));
      console.log('🐻 ApiService.handleSaveConversation: API URL:', 'https://threadcub.com/api/conversations/save');

      const headers = await this._buildHeaders({ 'Accept': 'application/json' });
      let didAttemptEncrypted = false;

      // -----------------------------------------------------------------
      // Step 1: Try sending encrypted payload (if encryption is enabled)
      // -----------------------------------------------------------------
      if (USE_ENCRYPTION) {
        try {
          const CryptoSvc = (typeof window !== 'undefined' && window.CryptoService) ||
                             (typeof self !== 'undefined' && self.CryptoService);

          if (CryptoSvc) {
            console.log('🔒 ApiService.handleSaveConversation: Encrypting payload before send...');
            const encryptedBase64 = await CryptoSvc.encryptPayload(data);

            const encryptedPayload = {
              encrypted_payload: encryptedBase64,
              source: data.source || data.conversationData?.platform?.toLowerCase() || 'unknown',
              title: data.title || data.conversationData?.title || 'Untitled'
            };

            console.log('🔒 ApiService.handleSaveConversation: Sending encrypted:', JSON.stringify({
              encrypted_payload: encryptedBase64.substring(0, 60) + '...[' + encryptedBase64.length + ' chars total]',
              source: encryptedPayload.source,
              title: encryptedPayload.title
            }));

            didAttemptEncrypted = true;
            const encResponse = await fetch('https://threadcub.com/api/conversations/save', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(encryptedPayload)
            });

            console.log('🔒 ApiService.handleSaveConversation: Encrypted POST status:', encResponse.status);

            if (encResponse.status === 401) {
              await this._handleUnauthorized();
              throw new Error('Authentication expired. Please log in again.');
            }

            if (encResponse.ok) {
              const result = await encResponse.json();
              console.log('✅ ApiService.handleSaveConversation: Encrypted call successful:', result);
              return result;
            }

            const errBody = await encResponse.text();
            console.warn(
              `🔒 ApiService.handleSaveConversation: Encrypted send failed (status ${encResponse.status}) — falling back.`,
              '\n  Response body:', errBody
            );
          } else {
            console.warn('🔒 ApiService.handleSaveConversation: CryptoService not available, skipping encryption');
          }
        } catch (encryptError) {
          if (encryptError.message.includes('Authentication expired')) {
            throw encryptError;
          }
          console.warn('🔒 ApiService.handleSaveConversation: Encryption/send error, falling back:', encryptError.message);
        }
      } else {
        console.log('🔒 ApiService.handleSaveConversation: USE_ENCRYPTION=false, sending unencrypted');
      }

      // -----------------------------------------------------------------
      // Step 2: Send original unencrypted payload (primary path or fallback)
      // Server expects: { conversationData: { messages, title?, source? }, title?, source? }
      // -----------------------------------------------------------------
      if (didAttemptEncrypted) {
        console.log('🔒 ApiService.handleSaveConversation: Retrying with original unencrypted payload...');
      }

      const convData = data.conversationData || data;
      const source = data.source || convData.source || convData.platform?.toLowerCase() || 'unknown';
      const title  = data.title  || convData.title  || 'Untitled';

      const unencryptedPayload = {
        conversationData: {
          messages: convData.messages || [],
          title: title,
          source: source
        },
        title: title,
        source: source
      };

      console.log('🔍 ApiService.handleSaveConversation: Unencrypted payload:', JSON.stringify(unencryptedPayload, null, 2));

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(unencryptedPayload)
      });

      console.log('🔍 ApiService.handleSaveConversation: Unencrypted POST status:', response.status);

      if (response.status === 401) {
        await this._handleUnauthorized();
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🐻 ApiService.handleSaveConversation: Unencrypted send also failed!',
                       'Status:', response.status, '| Body:', errorText);

        if (response.status === 405) {
          const allowedMethods = response.headers.get('Allow');
          console.error('🐻 Background: Allowed methods:', allowedMethods);
          throw new Error(`Method not allowed. Allowed methods: ${allowedMethods || 'unknown'}`);
        }

        this._notifySaveFailure(`Server returned ${response.status}`);
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ ApiService.handleSaveConversation: Unencrypted call successful:', result);

      return result;

    } catch (error) {
      console.error('🐻 ApiService.handleSaveConversation: API error:', error);
      this._notifySaveFailure(error.message);
      throw error;
    }
  },

  // =============================================================================
  // CREATE CONVERSATION WITH TAGS
  // Extracted from: tagging.js
  // =============================================================================

  async createConversationWithTags(conversationData, tags) {
    const headers = await this._buildHeaders();

    const response = await fetch('https://threadcub.com/api/conversations/tags/create', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        conversationData: conversationData,
        tags: tags,
        source: conversationData.platform?.toLowerCase() || 'unknown',
        title: conversationData.title
      })
    });

    if (response.status === 401) {
      await this._handleUnauthorized();
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error('Failed to create conversation with tags');
    }

    const data = await response.json();
    console.log('🏷️ ThreadCub: Conversation created with tags:', data);
    return data;
  },

  // =============================================================================
  // ADD TAGS TO EXISTING CONVERSATION
  // Extracted from: tagging.js
  // =============================================================================

  async addTagsToExistingConversation(conversationId, tags) {
    const headers = await this._buildHeaders();

    const response = await fetch(`https://threadcub.com/api/conversations/${conversationId}/tags`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        tags: tags
      })
    });

    if (response.status === 401) {
      await this._handleUnauthorized();
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error('Failed to add tags to conversation');
    }

    const data = await response.json();
    console.log('🏷️ ThreadCub: Tags added to conversation:', data);
    return data;
  },

  // =============================================================================
  // FETCH PROMPTS
  // Extracted from: popup/popup.js
  // =============================================================================

  async fetchPrompts() {
    const response = await fetch('https://threadcub.com/api/prompts');
    const prompts = await response.json();
    console.log('📋 Loaded prompts:', prompts);
    return prompts;
  }

};

// Export to global window object
window.ApiService = ApiService;
console.log('🔌 ThreadCub: ApiService module loaded');
