// =============================================================================
// ThreadCub API Service
// Consolidates all API calls to ThreadCub backend
// =============================================================================

const ApiService = {
  // Base URL for all API calls
  BASE_URL: 'https://threadcub.com',

  // =============================================================================
  // SAVE CONVERSATION
  // Extracted from: content.js, floating-button.js, background.js
  // =============================================================================

  async saveConversation(apiData) {
    try {
      console.log('🔍 userAuthToken before API call:', !!apiData.userAuthToken);
      console.log('🔍 userAuthToken length:', apiData.userAuthToken?.length || 'null');
      console.log('🔍 API Data being sent:', JSON.stringify(apiData, null, 2));

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

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

      // TEMPORARY: Test if endpoint exists with GET first
      console.log('🐻 Background: Testing endpoint accessibility...');
      try {
        const testResponse = await fetch('https://threadcub.com/api/conversations/save', {
          method: 'GET'
        });
        console.log('🐻 Background: GET test response:', testResponse.status);
        console.log('🐻 Background: GET allowed methods:', testResponse.headers.get('Allow'));
      } catch (error) {
        console.log('🐻 Background: GET test failed:', error);
      }

      const response = await fetch('https://threadcub.com/api/conversations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('🐻 Background: POST response status:', response.status);
      console.log('🐻 Background: POST response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🐻 Background: API error response:', errorText);

        // If 405, try to get more info about allowed methods
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
    const response = await fetch('https://threadcub.com/api/conversations/tags/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationData: conversationData,
        tags: tags,
        source: conversationData.platform?.toLowerCase() || 'unknown',
        title: conversationData.title
      })
    });

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
    const response = await fetch(`https://threadcub.com/api/conversations/${conversationId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: tags
      })
    });

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
