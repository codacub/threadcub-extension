// =============================================================================
// ThreadCub API Service
// Consolidates all API calls to ThreadCub backend
// All authenticated endpoints use Authorization: Bearer <token> headers
// =============================================================================

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

      // -----------------------------------------------------------------
      // Encryption step: encrypt the full payload before sending
      // If CryptoService is available, encrypt and wrap the payload.
      // If not available (e.g., loaded before crypto-service.js), send raw.
      // -----------------------------------------------------------------
      let payloadToSend;
      try {
        const CryptoSvc = (typeof window !== 'undefined' && window.CryptoService) ||
                           (typeof self !== 'undefined' && self.CryptoService);

        if (CryptoSvc) {
          console.log('🔒 ApiService.saveConversation: Encrypting payload before send...');
          const encryptedBase64 = await CryptoSvc.encryptPayload(apiData);

          // Build encrypted payload structure
          // platform and title remain in cleartext for server-side routing/display
          payloadToSend = {
            encrypted_payload: encryptedBase64,
            platform: apiData.platform || 'unknown',
            title: apiData.title || 'Untitled',
            timestamp: new Date().toISOString()
          };

          console.log('🔒 ApiService.saveConversation: Payload encrypted successfully');
        } else {
          console.warn('🔒 ApiService.saveConversation: CryptoService not available, sending unencrypted');
          payloadToSend = apiData;
        }
      } catch (encryptError) {
        // If encryption fails, abort the send rather than leaking plaintext
        console.error('🔒 ApiService.saveConversation: Encryption failed, aborting send:', encryptError.message);
        throw new Error(`Encryption failed: ${encryptError.message}`);
      }

      const headers = await this._buildHeaders();

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payloadToSend)
      });

      if (response.status === 401) {
        await this._handleUnauthorized();
        throw new Error('Authentication expired. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ThreadCub: Direct API call successful:', data);

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

      // -----------------------------------------------------------------
      // Encryption step: encrypt the full payload before sending
      // Same logic as saveConversation() — checks for CryptoService availability
      // -----------------------------------------------------------------
      let payloadToSend;
      try {
        const CryptoSvc = (typeof window !== 'undefined' && window.CryptoService) ||
                           (typeof self !== 'undefined' && self.CryptoService);

        if (CryptoSvc) {
          console.log('🔒 ApiService.handleSaveConversation: Encrypting payload before send...');
          const encryptedBase64 = await CryptoSvc.encryptPayload(data);

          payloadToSend = {
            encrypted_payload: encryptedBase64,
            platform: data.platform || 'unknown',
            title: data.title || 'Untitled',
            timestamp: new Date().toISOString()
          };

          console.log('🔒 ApiService.handleSaveConversation: Payload encrypted successfully');
        } else {
          console.warn('🔒 ApiService.handleSaveConversation: CryptoService not available, sending unencrypted');
          payloadToSend = data;
        }
      } catch (encryptError) {
        console.error('🔒 ApiService.handleSaveConversation: Encryption failed, aborting send:', encryptError.message);
        throw new Error(`Encryption failed: ${encryptError.message}`);
      }

      const headers = await this._buildHeaders({ 'Accept': 'application/json' });

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payloadToSend)
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
      console.log('🐻 Background: API call successful:', result);

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
