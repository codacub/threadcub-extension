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
  // SAVE CONVERSATION
  // Extracted from: content.js, floating-button.js, background.js
  // =============================================================================

  async saveConversation(apiData) {
    try {
      console.log('🔍 API Data being sent:', JSON.stringify(apiData, null, 2));

      const headers = await this._buildHeaders();
      let didAttemptEncrypted = false;

      // -----------------------------------------------------------------
      // Step 1: Try sending encrypted payload (if encryption is enabled)
      // -----------------------------------------------------------------
      if (USE_ENCRYPTION) {
        try {
          const CryptoSvc = (typeof window !== 'undefined' && window.CryptoService) ||
                             (typeof self !== 'undefined' && self.CryptoService);

          if (CryptoSvc) {
            console.log('🔒 ApiService.saveConversation: Encrypting payload before send...');
            const encryptedBase64 = await CryptoSvc.encryptPayload(apiData);

            const encryptedPayload = {
              encrypted_payload: encryptedBase64,
              platform: apiData.platform || 'unknown',
              title: apiData.title || 'Untitled',
              timestamp: new Date().toISOString()
            };

            console.log('🔒 ApiService.saveConversation: Payload encrypted successfully');
            console.log('🔒 ApiService.saveConversation: Sending encrypted payload:', JSON.stringify({
              encrypted_payload: encryptedBase64.substring(0, 40) + '...[truncated]',
              platform: encryptedPayload.platform,
              title: encryptedPayload.title,
              timestamp: encryptedPayload.timestamp
            }));

            didAttemptEncrypted = true;
            const encResponse = await fetch('https://threadcub.com/api/conversations/save', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(encryptedPayload)
            });

            if (encResponse.status === 401) {
              await this._handleUnauthorized();
              throw new Error('Authentication expired. Please log in again.');
            }

            if (encResponse.ok) {
              const data = await encResponse.json();
              console.log('✅ ThreadCub: Encrypted API call successful:', data);
              return data;
            }

            // Encrypted send failed (likely 400 from backend not understanding format)
            const errBody = await encResponse.text();
            console.warn(
              `🔒 ApiService.saveConversation: Encrypted send failed (status ${encResponse.status}) — falling back to unencrypted payload. Response body:`,
              errBody
            );
            // Fall through to unencrypted send below
          } else {
            console.warn('🔒 ApiService.saveConversation: CryptoService not available, skipping encryption');
          }
        } catch (encryptError) {
          // Encryption or encrypted-fetch failed — fall back to unencrypted
          // (unless it was a 401, which we re-throw above)
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
      // -----------------------------------------------------------------
      if (didAttemptEncrypted) {
        console.log('🔒 ApiService.saveConversation: Retrying with original unencrypted payload...');
      }

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(apiData)
      });

      if (response.status === 401) {
        await this._handleUnauthorized();
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ThreadCub: Direct API call successful (unencrypted):', data);

      return data;

    } catch (error) {
      console.error('🐻 ThreadCub: API call failed:', error);
      throw error;
    }
  },

  // =============================================================================
  // SAVE CONVERSATION (Background Script Version)
  // Extracted from: background.js
  // =============================================================================

  async handleSaveConversation(data) {
    try {
      console.log('🐻 Background: Making API call to ThreadCub with data:', data);
      console.log('🐻 Background: API URL:', 'https://threadcub.com/api/conversations/save');

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
              platform: data.platform || 'unknown',
              title: data.title || 'Untitled',
              timestamp: new Date().toISOString()
            };

            console.log('🔒 ApiService.handleSaveConversation: Payload encrypted successfully');
            console.log('🔒 ApiService.handleSaveConversation: Sending encrypted payload:', JSON.stringify({
              encrypted_payload: encryptedBase64.substring(0, 40) + '...[truncated]',
              platform: encryptedPayload.platform,
              title: encryptedPayload.title,
              timestamp: encryptedPayload.timestamp
            }));

            didAttemptEncrypted = true;
            const encResponse = await fetch('https://threadcub.com/api/conversations/save', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(encryptedPayload)
            });

            console.log('🐻 Background: Encrypted POST response status:', encResponse.status);

            if (encResponse.status === 401) {
              await this._handleUnauthorized();
              throw new Error('Authentication expired. Please log in again.');
            }

            if (encResponse.ok) {
              const result = await encResponse.json();
              console.log('✅ Background: Encrypted API call successful:', result);
              return result;
            }

            const errBody = await encResponse.text();
            console.warn(
              `🔒 ApiService.handleSaveConversation: Encrypted send failed (status ${encResponse.status}) — falling back to unencrypted payload. Response body:`,
              errBody
            );
          } else {
            console.warn('🔒 ApiService.handleSaveConversation: CryptoService not available, skipping encryption');
          }
        } catch (encryptError) {
          if (encryptError.message.includes('Authentication expired')) {
            throw encryptError;
          }
          console.warn('🔒 ApiService.handleSaveConversation: Encryption/send error, falling back to unencrypted:', encryptError.message);
        }
      } else {
        console.log('🔒 ApiService.handleSaveConversation: USE_ENCRYPTION=false, sending unencrypted');
      }

      // -----------------------------------------------------------------
      // Step 2: Send original unencrypted payload (primary path or fallback)
      // -----------------------------------------------------------------
      if (didAttemptEncrypted) {
        console.log('🔒 ApiService.handleSaveConversation: Retrying with original unencrypted payload...');
      }

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      console.log('🐻 Background: POST response status:', response.status);
      console.log('🐻 Background: POST response ok:', response.ok);

      if (response.status === 401) {
        await this._handleUnauthorized();
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🐻 Background: API error response:', errorText);

        if (response.status === 405) {
          const allowedMethods = response.headers.get('Allow');
          console.error('🐻 Background: Allowed methods:', allowedMethods);
          throw new Error(`Method not allowed. Allowed methods: ${allowedMethods || 'unknown'}`);
        }

        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🐻 Background: API call successful (unencrypted):', result);

      return result;

    } catch (error) {
      console.error('🐻 Background: API error:', error);
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
