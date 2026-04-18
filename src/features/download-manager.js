// === SECTION 4A-4E: Floating Button Integration with Modular Architecture ===

// The ThreadCubFloatingButton class is now loaded from src/core/floating-button.js
// This section provides the conversation functionality that the floating button needs

// === DOWNLOAD FUNCTIONS ===

function createDownloadFromData(conversationData) {
  try {
    const tagsData = {
      title: conversationData.title || 'ThreadCub Conversation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform || 'Unknown',
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages ? conversationData.messages.length : 0,
      messages: conversationData.messages || []
    };
    
    const filename = window.Utilities.generateSmartFilename(conversationData);
    
    const blob = new Blob([JSON.stringify(tagsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Add tagging below this line

    // 🐻 Track JSON export
    chrome.runtime.sendMessage({
      action: 'trackEvent',
      eventType: 'conversation_exported',
      data: {
        format: 'json',
        conversation: {
          tags: conversationData.tags || [],
          anchors: conversationData.anchors || [],
          messages: conversationData.messages || [],
          platform: conversationData.platform || 'unknown'
        }
      }
    });
    
    console.log('🐻 ThreadCub: JSON download completed with filename:', filename);
  } catch (error) {
    console.error('🐻 ThreadCub: Error in createDownloadFromData:', error);
    throw error;
  }
}


// === SECTION 4A-4E: Floating Button Integration with Modular Architecture ===

function enhanceFloatingButtonWithConversationFeatures() {
  console.log('[DM] enhance called — window.threadcubButton:', typeof window.threadcubButton, window.threadcubButton);
  if (window.threadcubButton && typeof window.threadcubButton === 'object') {
    console.log('🔍 [DM] enhanceFloatingButtonWithConversationFeatures — installing override on window.threadcubButton:', window.threadcubButton?.constructor?.name);
    
    // Override with DIRECT API CALLS + AuthService token
    window.threadcubButton.saveAndOpenConversation = async function(source = 'floating') {
      console.log('🔍 [DM] saveAndOpenConversation OVERRIDE running, source:', source);

      // ===== GET USER AUTH TOKEN VIA AuthService =====
      console.log('🔐 Getting user auth token via AuthService...');
      let userAuthToken = null;
      let extensionContextInvalid = false;

      try {
        if (window.AuthService) {
          userAuthToken = await window.AuthService.getToken();
          console.log('🔐 Auth token from AuthService:', !!userAuthToken);
        }
        // Fallback to background message if AuthService token not available
        if (!userAuthToken) {
          const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
          if (response && response.success) {
            userAuthToken = response.authToken;
            console.log('🔐 Auth token retrieved from ThreadCub tab (fallback):', !!userAuthToken);
          }
        }
      } catch (error) {
        const msg = error?.message || '';
        if (msg.includes('Extension context invalidated') || msg.includes('Extension context')) {
          extensionContextInvalid = true;
          console.warn('🔐 Extension context invalidated — falling back to localStorage for auth token');
        } else {
          console.log('🔐 Auth token retrieval failed:', error);
        }
      }

      // Final localStorage fallback — works even when extension context is dead
      if (!userAuthToken) {
        try {
          userAuthToken = localStorage.getItem('threadcub_auth_token');
          if (userAuthToken) console.log('🔐 Auth token recovered from localStorage:', !!userAuthToken);
        } catch (e) { /* ignore */ }
      }

      if (extensionContextInvalid) {
        this.showErrorToast('ThreadCub was updated — please reload this page to continue saving.');
        this.isExporting = false;
        return;
      }

      const now = Date.now();
      if (this.isExporting || (now - this.lastExportTime) < 2000) {
        console.log('🐻 ThreadCub: Export already in progress');
        return;
      }
      
      this.isExporting = true;
      this.lastExportTime = now;
      
      try {
        console.log('🐻 ThreadCub: Extracting conversation data...');
        
        // Extract conversation using centralized module
        conversationData = await window.ConversationExtractor.extractConversation();
                
        if (!conversationData || !conversationData.messages || conversationData.messages.length === 0) {
          console.error('🐻 ThreadCub: No conversation data found');
          this.showErrorToast('No conversation found to save');
          this.isExporting = false;
          return;
        }
        
        console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages`);
        
        this.lastConversationData = conversationData;

        // Get session ID for anonymous conversation tracking
        const sessionId = await window.StorageService.getOrCreateSessionId();

        // Resolve parent_conversation_id — in-memory first, then chrome.storage fallback
        let parentConversationId = this.lastSavedConversationId || null;
        console.log('🔍 [DM] parent lookup — in-memory lastSavedConversationId:', this.lastSavedConversationId);
        if (!parentConversationId && conversationData.url) {
          const stored = await chrome.storage.local.get([`tc_parent_${conversationData.url}`, 'tc_last_saved_id']);
          console.log('🔍 [DM] parent lookup — tc_parent_<url>:', stored[`tc_parent_${conversationData.url}`]);
          console.log('🔍 [DM] parent lookup — tc_last_saved_id:', stored['tc_last_saved_id']);
          parentConversationId = stored[`tc_parent_${conversationData.url}`] || stored['tc_last_saved_id'] || null;
        }
        console.log('🔍 [DM] parent lookup — resolved parentConversationId:', parentConversationId);

        // FIXED: Use DIRECT fetch() call to API (same as working main branch) + AUTH TOKEN
        const apiData = {
            conversationData: conversationData,
            source: conversationData.platform?.toLowerCase() || 'unknown',
            title: conversationData.title || 'Untitled Conversation',
            userAuthToken: userAuthToken,
            session_id: sessionId,
            capture_method: 'continue',
            parent_conversation_id: parentConversationId,
            source_chat_url: conversationData.url || null
        };
        
        console.log('🔍 [DM] apiData pre-call — keys:', Object.keys(apiData));
        console.log('🔍 [DM] apiData pre-call — capture_method:', apiData.capture_method);
        console.log('🔍 [DM] apiData pre-call — parent_conversation_id:', apiData.parent_conversation_id);
        console.log('🔍 [DM] apiData pre-call — session_id:', apiData.session_id);
        console.log('🔍 [DM] apiData pre-call — source:', apiData.source);
        console.log('🔍 [DM] apiData pre-call — source_chat_url:', apiData.source_chat_url);

        try {
          // API call via ApiService
          const data = await window.ApiService.saveConversation(apiData);

          // Extract and persist conversation ID so the next Continue knows its parent
          const rawId = data.conversationId ?? data.id ?? data.conversation?.id ?? data.data?.id ?? null;
          const conversationId = (rawId && typeof rawId === 'string' && rawId !== 'undefined') ? rawId : null;
          console.log('🔍 [DM] post-save — rawId:', rawId, '| conversationId:', conversationId);
          this.lastSavedConversationId = conversationId;
          console.log('🔍 [DM] post-save — set this.lastSavedConversationId:', this.lastSavedConversationId);
          if (conversationId && conversationData.url) {
            chrome.storage.local.set({ [`tc_parent_${conversationData.url}`]: conversationId });
            console.log('🔍 [DM] post-save — wrote tc_parent_' + conversationData.url + ':', conversationId);
            chrome.storage.local.set({ 'tc_last_saved_id': conversationId });
            console.log('🔍 [DM] post-save — wrote tc_last_saved_id:', conversationId);
            chrome.runtime.sendMessage({ action: 'setPendingParent', conversationId: conversationId });
            console.log('🔍 [DM] post-save — sent setPendingParent:', conversationId);
          } else {
            console.warn('🔍 [DM] post-save — skipped storage write. conversationId:', conversationId, '| url:', conversationData.url);
          }

          // Generate continuation prompt with real API data
          const summary = data.summary || window.ConversationExtractor.generateQuickSummary(conversationData.messages);
          const shareUrl = data.shareableUrl || (conversationId ? `https://threadcub.com/api/share/${conversationId}` : null);

          const minimalPrompt = window.ConversationExtractor.generateContinuationPrompt(summary, shareUrl, conversationData.platform, conversationData);
          
          const targetPlatform = window.PlatformDetector.detectPlatform();
          
          if (targetPlatform === 'chatgpt') {
            console.log('🤖 ThreadCub: Routing to ChatGPT flow (with file download)');
            this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'claude') {
            console.log('🤖 ThreadCub: Routing to Claude flow (no file download)');
            this.handleClaudeFlow(minimalPrompt, shareUrl, conversationData, data.conversationId || null);
          } else if (targetPlatform === 'gemini') {
            console.log('🤖 ThreadCub: Routing to Gemini flow (with file download)');
            this.handleGeminiFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'grok') {
            console.log('🤖 ThreadCub: Routing to Grok flow (with file download)');
            this.handleGrokFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'deepseek') {
            console.log('🔵 ThreadCub: Routing to DeepSeek flow (with file download)');
            this.handleDeepSeekFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'perplexity') {
            console.log('🔮 ThreadCub: Routing to Perplexity flow (URL-based)');
            this.handlePerplexityFlow(minimalPrompt, shareUrl, conversationData);
          } else {
            console.log('🤖 ThreadCub: Unknown platform, defaulting to ChatGPT flow');
            this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
          }

          this.setBearExpression('happy');
          setTimeout(() => {
            if (this.currentBearState !== 'default') {
              this.setBearExpression('default');
            }
          }, 2000);

          this.isExporting = false;
          
        } catch (apiError) {
          console.error('🐻 ThreadCub: Direct API call failed:', apiError);
          console.log('🐻 ThreadCub: Falling back to direct continuation without API save...');
          
          // FALLBACK: Skip API save and go straight to continuation
          this.handleDirectContinuation(conversationData);
          this.isExporting = false;
          return;
        }

      } catch (error) {
        console.error('🐻 ThreadCub: Export error:', error);
        this.showErrorToast('Export failed: ' + error.message);
        this.isExporting = false;
      }
    };
    
    // UNCHANGED: Download function is fine as-is
    window.threadcubButton.downloadConversationJSON = async function() {
      console.log('🐻 ThreadCub: Starting JSON download...');
      
      try {
        console.log('🐻 ThreadCub: Extracting conversation data for download...');
        
        // Extract conversation using centralized module
        conversationData = await window.ConversationExtractor.extractConversation();
        const platform = window.PlatformDetector.detectPlatform();

        if (!conversationData || !conversationData.messages || conversationData.messages.length === 0) {
          console.error('🐻 ThreadCub: No conversation data found');

          const fallbackData = {
            title: document.title || 'AI Conversation',
            url: window.location.href,
            platform: window.PlatformDetector.getPlatformName(platform),
            exportDate: new Date().toISOString(),
            totalMessages: 0,
            messages: [],
            note: 'No conversation messages could be extracted from this page'
          };
          
          createDownloadFromData(fallbackData);
          this.showSuccessToast('Downloaded basic page info');
          return;
        }
        
        console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages for download`);
        
        createDownloadFromData(conversationData);
        this.showSuccessToast('Conversation downloaded successfully!');
        
      } catch (error) {
        console.error('🐻 ThreadCub: Download error:', error);
        
        const emergencyData = {
          title: 'ThreadCub Emergency Download',
          url: window.location.href,
          platform: 'Unknown',
          exportDate: new Date().toISOString(),
          totalMessages: 0,
          messages: [],
          error: error.message,
          note: 'An error occurred during conversation extraction'
        };
        
        createDownloadFromData(emergencyData);
        this.showErrorToast('Download completed with errors');
      }
    };
    
    console.log('🐻 ThreadCub: ✅ Floating button enhanced with DIRECT API calls + AuthService token');

    // Debug alias — call window._tcBtn.saveAndOpenConversation('floating') from DevTools
    window._tcBtn = window.threadcubButton;
    console.log('🐻 ThreadCub: [debug] window._tcBtn set:', typeof window._tcBtn);
  }
}

window.addEventListener('message', (event) => {
  // Handle continuation data from dashboard
  if (event.data.type === 'THREADCUB_DASHBOARD_MESSAGE' && event.data.action === 'storeContinuationData') {
    console.log('🔗 Content script received dashboard message:', event.data.data)

    // Send to background script using chrome.runtime
    chrome.runtime.sendMessage({
      action: 'storeContinuationData',
      ...event.data.data
    }, (response) => {
      console.log('📤 Background script response:', response)
    })
  }

  // Handle auth callback token from threadcub.com callback page
  if (event.data.type === 'THREADCUB_AUTH_CALLBACK' && event.data.token) {
    console.log('🔐 Content script received auth callback token');
    console.log('🔐 Content script received encryptionKey:', !!event.data.encryptionKey);

    chrome.runtime.sendMessage({
      action: 'storeAuthToken',
      token: event.data.token,
      encryptionKey: event.data.encryptionKey || null
    }, (response) => {
      console.log('🔐 Auth token stored via background:', response);
    });
  }
})

// === END SECTION 4A-4E ===

// Export download manager functions to window for global access
window.DownloadManager = {
  createDownloadFromData,
  enhanceFloatingButtonWithConversationFeatures
};

console.log('🐻 ThreadCub: Download manager module loaded');