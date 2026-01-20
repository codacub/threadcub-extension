
// === SECTION 3A: Platform Auto-start Functions ===

// ===== Generate intelligent conversation summary =====
function generateConversationSummary(fullPrompt) {
  try {
    // Extract all messages for analysis
    const messageMatches = fullPrompt.match(/\*\*You:\*\*[^*]+|\*\*Assistant:\*\*[^*]+/g);
    
    if (!messageMatches || messageMatches.length === 0) {
      return '📝 No conversation content available for summary.';
    }
    
    return `📋 Previous conversation with ${messageMatches.length} messages ready to continue.`;
    
  } catch (error) {
    console.log('🐻 ThreadCub: Error generating summary:', error);
    return '📝 Conversation summary unavailable - full context will be provided when continuing.';
  }
}

// ===== Attempt to auto-start the chat =====
function attemptAutoStart() {
  const platform = window.PlatformDetector.detectPlatform();
  console.log('🐻 ThreadCub: Attempting auto-start for platform:', platform);

  // Wait a moment for the input to be filled
  setTimeout(() => {
    // Platform-specific auto-start attempts
    if (platform === window.PlatformDetector.PLATFORMS.CLAUDE || platform === 'claude.ai') {
      attemptClaudeAutoStart();
    } else if (platform === window.PlatformDetector.PLATFORMS.CHATGPT || platform === 'chatgpt') {
      attemptChatGPTAutoStart();
    } else if (platform === window.PlatformDetector.PLATFORMS.GEMINI || platform === 'gemini') {
      attemptGeminiAutoStart();
    }
  }, 1000);
}

// ===== Claude.ai auto-start =====
function attemptClaudeAutoStart() {
  try {
    // Look for Claude's send button
    const sendSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🐻 ThreadCub: Found Claude send button, clicking...');
        sendButton.click();
        return;
      }
    }
    
  } catch (error) {
    console.log('🐻 ThreadCub: Claude auto-start failed:', error);
  }
}

// ===== ChatGPT auto-start =====
function attemptChatGPTAutoStart() {
  try {
    // Look for ChatGPT's send button
    const sendSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🐻 ThreadCub: Found ChatGPT send button, clicking...');
        sendButton.click();
        return;
      }
    }
    
  } catch (error) {
    console.log('🐻 ThreadCub: ChatGPT auto-start failed:', error);
  }
}

// ===== Gemini auto-start =====
function attemptGeminiAutoStart() {
  try {
    // Look for Gemini's send button
    const sendSelectors = [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🐻 ThreadCub: Found Gemini send button, clicking...');
        sendButton.click();
        return;
      }
    }
    
  } catch (error) {
    console.log('🐻 ThreadCub: Gemini auto-start failed:', error);
  }
}

// ===== Fill input field with prompt =====
function fillInputFieldWithPrompt(prompt) {
  const platform = window.PlatformDetector.detectPlatform();
  console.log('🐻 ThreadCub: Filling input field with continuation prompt for:', platform);

  setTimeout(() => {
    // Get platform-specific selectors from centralized module
    const platformSelectors = window.PlatformDetector.getInputSelectors(platform);
    console.log('🔍 Platform detected:', platform, 'Using selectors:', platformSelectors);
    console.log('🔍 About to loop through selectors. Count:', platformSelectors.length);

    // Find input field
    let inputField = null;
    for (const selector of platformSelectors) {
      const elements = document.querySelectorAll(selector);
      console.log('🔍 Checked selector:', selector, 'Found elements:', elements.length);
      for (const element of elements) {
        if (element.offsetHeight > 0 && !element.disabled) {
          inputField = element;
          break;
        }
      }
      if (inputField) break;
    }

    if (inputField) {
      inputField.focus();

      // Fill based on input type
      if (inputField.tagName === 'TEXTAREA') {
        inputField.value = prompt;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (inputField.contentEditable === 'true') {
        inputField.textContent = prompt;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
      }

      console.log('✅ ThreadCub: Input field populated successfully');
      return true;
    } else {
      console.log('❌ ThreadCub: Could not find input field');
      return false;
    }
  }, 2000); // Wait 2 seconds
}

// ===== Show continuation success message =====
function showContinuationSuccess() {
  // Use centralized toast system
  ThreadCubFloatingButton.showGlobalSuccessToast();
}

// ===== Show download success message =====
function showDownloadSuccessMessage() {
  // Use centralized toast system
  ThreadCubFloatingButton.showGlobalSuccessToast();
}

// ===== Platform detection helper function (now using centralized module) =====
// Removed - now using window.PlatformDetector.detectPlatform()

// === END SECTION 3A ===

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
    URL.revokeObjectURL(url);
    
    console.log('🐻 ThreadCub: JSON download completed with filename:', filename);
  } catch (error) {
    console.error('🐻 ThreadCub: Error in createDownloadFromData:', error);
    throw error;
  }
}


// === SECTION 4A-4E: Floating Button Integration with Modular Architecture ===

function enhanceFloatingButtonWithConversationFeatures() {
  if (window.threadcubButton && typeof window.threadcubButton === 'object') {
    console.log('🐻 ThreadCub: Enhancing modular floating button with conversation features...');
    
    // FIXED: Override with DIRECT API CALLS (like working main branch) + AUTH TOKEN EXTRACTION
    window.threadcubButton.saveAndOpenConversation = async function(source = 'floating') {
      console.log('🐻 ThreadCub: saveAndOpenConversation called from:', source);
      
      // ===== GET USER AUTH TOKEN VIA BACKGROUND SCRIPT =====
        console.log('🔧 Getting user auth token via background script...');
        let userAuthToken = null;

        try {
          const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
          if (response && response.success) {
            userAuthToken = response.authToken;
            console.log('🔧 Auth token retrieved from ThreadCub tab:', !!userAuthToken);
            console.log('🔧 Auth token length:', userAuthToken?.length || 'null');
          } else {
            console.log('🔧 Could not get auth token:', response?.error || 'Unknown error');
          }
        } catch (error) {
          console.log('🔧 Background script communication failed:', error);
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
        
        // FIXED: Use DIRECT fetch() call to API (same as working main branch) + AUTH TOKEN
        const apiData = {
            conversationData: conversationData,
            source: conversationData.platform?.toLowerCase() || 'unknown',
            title: conversationData.title || 'Untitled Conversation',
            userAuthToken: userAuthToken,
            sessionId: sessionId
        };
        
        console.log('🐻 ThreadCub: Making DIRECT API call to ThreadCub...');
        
        try {
          // API call via ApiService
          const data = await window.ApiService.saveConversation(apiData);
          
          // Generate continuation prompt with real API data
          const summary = data.summary || window.ConversationExtractor.generateQuickSummary(conversationData.messages);
          const shareUrl = data.shareableUrl || `https://threadcub.com/api/share/${data.conversationId}`;

          const minimalPrompt = window.ConversationExtractor.generateContinuationPrompt(summary, shareUrl, conversationData.platform, conversationData);
          
          const targetPlatform = window.PlatformDetector.detectPlatform();
          
          if (targetPlatform === 'chatgpt') {
            console.log('🤖 ThreadCub: Routing to ChatGPT flow (with file download)');
            this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'claude') {
            console.log('🤖 ThreadCub: Routing to Claude flow (no file download)');
            this.handleClaudeFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'gemini') {
            console.log('🤖 ThreadCub: Routing to Gemini flow (with file download)');
            this.handleGeminiFlow(minimalPrompt, shareUrl, conversationData);
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
          handleDirectContinuation(conversationData);
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
    
    console.log('🐻 ThreadCub: ✅ Floating button enhanced with DIRECT API calls + AUTH TOKEN EXTRACTION (SIMPLIFIED)');
  }
}

window.addEventListener('message', (event) => {
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
})

// === END SECTION 4A-4E ===

// === SECTION 5A: Main Application Initialization ===

// Main initialization when DOM is ready
function initializeThreadCub() {
  console.log('🐻 ThreadCub: Initializing main application...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startThreadCub);
  } else {
    startThreadCub();
  }
}

function startThreadCub() {
  console.log('🐻 ThreadCub: Starting ThreadCub application...');
  console.log('🐻 ThreadCub: Checking modular classes...');
  console.log('🐻 ThreadCub: ThreadCubFloatingButton available:', typeof window.ThreadCubFloatingButton);
  console.log('🐻 ThreadCub: ThreadCubTagging available:', typeof window.ThreadCubTagging);
  console.log('🐻 ThreadCub: enhanceFloatingButtonWithConversationFeatures available:', typeof enhanceFloatingButtonWithConversationFeatures);
  
  // Initialize the floating button (now from external module)
  if (typeof window.ThreadCubFloatingButton !== 'undefined') {
    console.log('🐻 ThreadCub: ✅ Initializing floating button from module...');
    
    try {
      window.threadcubButton = new window.ThreadCubFloatingButton();
      console.log('🐻 ThreadCub: ✅ Floating button instance created:', typeof window.threadcubButton);
      
      // CRITICAL: Enhance the modular floating button with all conversation functionality
      if (typeof enhanceFloatingButtonWithConversationFeatures === 'function') {
        console.log('🐻 ThreadCub: ✅ Enhancing floating button with conversation features...');
        enhanceFloatingButtonWithConversationFeatures();
        console.log('🐻 ThreadCub: ✅ Floating button enhanced successfully');
      } else {
        console.error('🐻 ThreadCub: ❌ enhanceFloatingButtonWithConversationFeatures function not found');
      }
      
      // Initialize tagging system
      if (typeof window.ThreadCubTagging !== 'undefined') {
        console.log('🐻 ThreadCub: ✅ Initializing tagging system...');
        try {
          window.threadcubTagging = new window.ThreadCubTagging(window.threadcubButton);
          console.log('🐻 ThreadCub: ✅ Tagging system initialized:', typeof window.threadcubTagging);
        } catch (taggingError) {
          console.error('🐻 ThreadCub: ❌ Error initializing tagging system:', taggingError);
        }
      } else {
        console.log('🐻 ThreadCub: ⚠️ ThreadCubTagging not available, will initialize on demand');
      }
      
      // Check for continuation data
      try {
        window.ContinuationSystem.checkForContinuationData();
        console.log('🐻 ThreadCub: ✅ Continuation data check completed');
      } catch (continuationError) {
        console.error('🐻 ThreadCub: ❌ Error checking continuation data:', continuationError);
      }
      
      console.log('🐻 ThreadCub: ✅ Application fully initialized with all features!');
      
      // Final verification
      setTimeout(() => {
        const buttonElement = document.querySelector('#threadcub-edge-btn');
        console.log('🐻 ThreadCub: Final verification - Button in DOM:', !!buttonElement);
        if (buttonElement) {
          console.log('🐻 ThreadCub: 🎉 SUCCESS! Floating button is visible on the page!');
        } else {
          console.error('🐻 ThreadCub: ❌ FAILED! Button not found in DOM after initialization');
        }
      }, 1000);
      
    } catch (buttonError) {
      console.error('🐻 ThreadCub: ❌ Error creating floating button instance:', buttonError);
    }
    
  } else {
    console.error('🐻 ThreadCub: ❌ ThreadCubFloatingButton class not found - module may not have loaded');
    
    // Retry after a short delay
    setTimeout(() => {
      if (typeof window.ThreadCubFloatingButton !== 'undefined') {
        console.log('🐻 ThreadCub: 🔄 Retrying initialization...');
        startThreadCub();
      } else {
        console.error('🐻 ThreadCub: ❌ Failed to load floating button module after retry');
      }
    }, 1000);
  }
}

// Start the application immediately
console.log('🐻 ThreadCub: Starting initialization...');
initializeThreadCub();

// === END SECTION 5A ===

// === SESSION ID MANAGEMENT ===
// getOrCreateSessionId() removed - now using window.StorageService.getOrCreateSessionId()