// === SECTION 0: Analytics & Auth Integration ===

// Import analytics service, auth service, and crypto service
importScripts('src/services/analytics.js');
importScripts('src/services/auth-service.js');
importScripts('src/services/crypto-service.js');

// Track installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🐻 Background: Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('🐻 Background: First install - opening welcome page');
    // Track installation
    self.Analytics.trackInstall();
    
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  } else if (details.reason === 'update') {
    console.log('🐻 Background: Extension updated from', details.previousVersion);
    // Track update
    self.Analytics.trackUpdate(details.previousVersion);
  }
});

// === SECTION 1: Core Message Handler ===

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🐻 Background: Received message:', request.action);

  switch (request.action) {
    case 'download':
      handleDownload(request, sendResponse);
      return true;
    
    case 'saveConversation':
      handleSaveConversation(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'openAndInject':
      handleOpenAndInject(request.url, request.prompt)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'storeContinuationData':
      handleStoreContinuationData(request, sender, sendResponse);
      return false;
    
    case 'getContinuationData':
      handleGetContinuationData(sender, sendResponse);
      return true;
    
    case 'getAuthToken':
      handleGetAuthToken(sendResponse);
      return true;

    case 'storeAuthToken':
      handleStoreAuthToken(request, sendResponse);
      return true;

    case 'getStoredAuthToken':
      handleGetStoredAuthToken(sendResponse);
      return true;

    case 'validateAuthToken':
      handleValidateAuthToken(sendResponse);
      return true;

    case 'authLogout':
      handleAuthLogout(sendResponse);
      return true;

    case 'trackEvent':
      handleTrackEvent(request, sendResponse);
      return false;
    
    case 'exportComplete':
      console.log('🐻 Background: Export completed notification received');
      break;
    
    case 'buttonStatusChanged':
      console.log('🐻 Background: Button status changed:', request.visible);
      break;
    
    default:
      console.log('🐻 Background: Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// === SECTION 1.5: Analytics Event Handler ===

function handleTrackEvent(request, sendResponse) {
  try {
    const { eventType, data } = request;
    
    console.log('🐻 Background: Tracking event:', eventType);
    
    switch (eventType) {
      case 'tag_created':
        self.Analytics.trackTagCreated(data);
        break;
      
      case 'anchor_created':
        self.Analytics.trackAnchorCreated(data);
        break;
      
      case 'conversation_exported':
        self.Analytics.trackExport(data.format, data.conversation);
        break;
      
      case 'side_panel_opened':
        self.Analytics.trackSidePanelOpened(data.platform);
        break;
      
      case 'platform_detected':
        self.Analytics.trackPlatformDetected(data.platform);
        break;
      
      case 'conversation_extracted':
        self.Analytics.trackConversationExtracted(data);
        break;
      
      case 'floating_button_clicked':
        self.Analytics.trackFloatingButtonClicked(data.platform);
        break;
      
      case 'continuation_started':
        self.Analytics.trackContinuationStarted(data.platform);
        break;
      
      case 'length_prompt_shown':
        // Track when the 10+ message modal is shown
        console.log('📊 Analytics: Length prompt shown', data);
        if (self.Analytics.trackEvent) {
          self.Analytics.trackEvent('length_prompt_shown', data);
        }
        break;
      
      case 'length_prompt_download_clicked':
        // Track when user clicks Download in the modal
        console.log('📊 Analytics: Length prompt download clicked', data);
        if (self.Analytics.trackEvent) {
          self.Analytics.trackEvent('length_prompt_download_clicked', data);
        }
        break;
      
      case 'length_prompt_continue_clicked':
        // Track when user clicks Continue Chat in the modal
        console.log('📊 Analytics: Length prompt continue clicked', data);
        if (self.Analytics.trackEvent) {
          self.Analytics.trackEvent('length_prompt_continue_clicked', data);
        }
        break;
      
      case 'length_prompt_dismissed':
        // Track when user dismisses the modal
        console.log('📊 Analytics: Length prompt dismissed', data);
        if (self.Analytics.trackEvent) {
          self.Analytics.trackEvent('length_prompt_dismissed', data);
        }
        break;
      
      case 'error':
        self.Analytics.trackError(data.errorType, data.errorMessage);
        break;
      
      default:
        console.log('🐻 Background: Unknown tracking event:', eventType);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('🐻 Background: Error tracking event:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// === SECTION 2: Download Handler ===

function handleDownload(request, sendResponse) {
  console.log('🐻 Background: Starting download process');
  console.log('🐻 Background: Data received:', request.data);
  console.log('🐻 Background: Filename:', request.filename);

  try {
    // Validate the data
    if (!request.data) {
      console.error('🐻 Background: No data provided for download');
      setTimeout(() => sendResponse({ success: false, error: 'No data provided' }), 0);
      return;
    }

    if (!request.filename) {
      console.error('🐻 Background: No filename provided for download');
      setTimeout(() => sendResponse({ success: false, error: 'No filename provided' }), 0);
      return;
    }

    // Create the JSON string
    const jsonString = JSON.stringify(request.data, null, 2);
    console.log('🐻 Background: JSON string length:', jsonString.length);

    // Convert to base64 data URL
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
    const dataUrl = `data:application/json;charset=utf-8;base64,${base64Data}`;
    console.log('🐻 Background: Created data URL, length:', dataUrl.length);

    // Start the download
    chrome.downloads.download({
      url: dataUrl,
      filename: request.filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('🐻 Background: Download failed:', chrome.runtime.lastError);
        setTimeout(() => sendResponse({ success: false, error: chrome.runtime.lastError.message }), 0);
      } else {
        console.log('🐻 Background: Download started with ID:', downloadId);
        setTimeout(() => sendResponse({ success: true, downloadId: downloadId }), 0);
      }
    });

  } catch (error) {
    console.error('🐻 Background: Error during download:', error);
    setTimeout(() => sendResponse({ success: false, error: error.message }), 0);
  }
}

// === SECTION 3: API Handler ===

async function handleSaveConversation(data) {
  try {
    console.log('🐻 Background: Making API call to ThreadCub with data:', data);
    console.log('🐻 Background: API URL:', 'https://threadcub.com/api/conversations/save');

    // -----------------------------------------------------------------
    // Encryption step: encrypt the full payload before sending
    // Uses self.CryptoService which is loaded via importScripts
    // -----------------------------------------------------------------
    let payloadToSend;
    try {
      if (self.CryptoService) {
        console.log('🔒 Background.handleSaveConversation: Encrypting payload before send...');
        const encryptedBase64 = await self.CryptoService.encryptPayload(data);

        // Build encrypted payload structure
        // platform and title remain in cleartext for server-side routing/display
        payloadToSend = {
          encrypted_payload: encryptedBase64,
          platform: data.platform || 'unknown',
          title: data.title || 'Untitled',
          timestamp: new Date().toISOString()
        };

        console.log('🔒 Background.handleSaveConversation: Payload encrypted successfully');
      } else {
        console.warn('🔒 Background.handleSaveConversation: CryptoService not available, sending unencrypted');
        payloadToSend = data;
      }
    } catch (encryptError) {
      console.error('🔒 Background.handleSaveConversation: Encryption failed, aborting send:', encryptError.message);
      throw new Error(`Encryption failed: ${encryptError.message}`);
    }

    // Get auth token from storage for Bearer auth
    const authToken = await self.AuthService.getToken();
    console.log('🐻 Background: Auth token available:', !!authToken);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add Bearer token if available
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('🐻 Background: Added Authorization header');
    }

    const response = await fetch('https://threadcub.com/api/conversations/save', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payloadToSend)
    });

    console.log('🐻 Background: POST response status:', response.status);
    console.log('🐻 Background: POST response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🐻 Background: API error response:', errorText);

      if (response.status === 401) {
        console.log('🐻 Background: Auth token expired, clearing...');
        await self.AuthService.clearToken();
        throw new Error('Authentication expired. Please log in again.');
      }

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
    console.error('🐻 Background: Error in handleSaveConversation:', error);
    throw error;
  }
}

// === SECTION 4: Cross-Tab Continuation System ===

function handleStoreContinuationData(request, sender, sendResponse) {
  console.log('🔄 Background: Storing continuation data for cross-tab communication');
  
  // FIXED: Use the same key name that content.js expects
  chrome.storage.local.set({
    threadcubContinuationData: {
      prompt: request.prompt,
      shareUrl: request.shareUrl,
      platform: request.platform,
      timestamp: Date.now(),
      sourceTabId: sender.tab.id,
      messages: request.messages || [],
      totalMessages: request.totalMessages || request.messages?.length || 0
    }
  });
  
  sendResponse({ success: true });
}

function handleGetContinuationData(sender, sendResponse) {
  console.log('🔄 Background: Getting continuation data for new tab');
  
  // FIXED: Use the same key name that content.js expects
  chrome.storage.local.get(['threadcubContinuationData'], (result) => {
    const data = result.threadcubContinuationData;
    
    // Check if data exists, is recent (within 5 minutes), and from different tab
    if (data && 
        Date.now() - data.timestamp < 300000 && 
        data.sourceTabId !== sender.tab.id) {
      
      console.log('🔄 Background: Found valid continuation data, sending to tab');
      // Clear the data after retrieving it (one-time use)
      chrome.storage.local.remove(['threadcubContinuationData']);
      sendResponse({ data });
    } else {
      console.log('🔄 Background: No valid continuation data found');
      sendResponse({ data: null });
    }
  });
}

// Handler for initiating conversation continuation from the length detector modal
// === SECTION 5: Tab Management & Prompt Injection ===

// Platform configurations for prompt injection
const PLATFORM_INJECTORS = {
  'chat.openai.com': {
    name: 'ChatGPT',
    selectors: ['textarea[data-testid="prompt-textarea"]', '#prompt-textarea', 'textarea']
  },
  'chatgpt.com': {
    name: 'ChatGPT', 
    selectors: ['textarea[data-testid="prompt-textarea"]', '#prompt-textarea', 'textarea']
  },
  'claude.ai': {
    name: 'Claude',
    selectors: ['textarea[data-testid="chat-input"]', 'div[contenteditable="true"]']
  },
  'gemini.google.com': {
    name: 'Gemini',
    selectors: ['rich-textarea[data-test-id="input-field"] div[contenteditable="true"]', 'textarea']
  },
  'copilot.microsoft.com': {
    name: 'Copilot',
    selectors: ['textarea[data-testid="chat-input"]', 'textarea']
  }
};

async function handleOpenAndInject(url, prompt) {
  try {
    console.log(`🔄 Background: Opening new tab: ${url}`);
    
    // Create new tab
    const tab = await chrome.tabs.create({ url, active: false });
    console.log(`🔄 Background: Created tab ${tab.id}`);
    
    // Wait for tab to be ready
    await waitForTabReady(tab.id);
    console.log('🔄 Background: Tab ready, attempting injection');
    
    // Get platform-specific selectors
    const domain = new URL(url).hostname;
    const platformConfig = PLATFORM_INJECTORS[domain];
    
    if (!platformConfig) {
      throw new Error(`Platform ${domain} not supported for injection`);
    }
    
    // Inject the prompt
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectPromptFunction,
      args: [prompt, platformConfig.selectors]
    });
    
    if (results && results[0] && results[0].result.success) {
      console.log('🔄 Background: Prompt injection successful, activating tab');
      await chrome.tabs.update(tab.id, { active: true });
      return { success: true, tabId: tab.id };
    } else {
      throw new Error(results[0].result.error || 'Injection failed');
    }
    
  } catch (error) {
    console.error('🔄 Background: Error in handleOpenAndInject:', error);
    return { success: false, error: error.message };
  }
}

async function waitForTabReady(tabId, maxWaitTime = 8000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      throw new Error('Tab no longer exists');
    }
  }
  
  throw new Error('Timeout waiting for tab');
}

function injectPromptFunction(prompt, selectors) {
  return new Promise((resolve) => {
    console.log('🔄 Injecting prompt into page');
    
    let attempts = 0;
    const maxAttempts = 15;
    
    function tryInject() {
      attempts++;
      
      let inputField = null;
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const style = window.getComputedStyle(element);
          if (style.display !== 'none' && element.offsetHeight > 0) {
            inputField = element;
            break;
          }
        }
        if (inputField) break;
      }
      
      if (inputField) {
        console.log('🔄 Found input field, injecting prompt');
        
        inputField.focus();
        
        if (inputField.tagName === 'TEXTAREA') {
          inputField.value = prompt;
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (inputField.contentEditable === 'true') {
          inputField.textContent = prompt;
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        resolve({ success: true });
        
      } else if (attempts < maxAttempts) {
        setTimeout(tryInject, 400);
      } else {
        console.log('🔄 Could not find input field');
        resolve({ success: false, error: 'Input field not found' });
      }
    }
    
    tryInject();
  });
}

// === SECTION 6: Extension Lifecycle (MOVED TO TOP FOR ANALYTICS) ===
// This section was moved to SECTION 0 for analytics integration

chrome.runtime.onStartup.addListener(() => {
  console.log('🐻 Background: Extension started');
});

console.log('🐻 ThreadCub background script loaded and ready');

// === SECTION 7: Auth Token Handler (FIXED - Proper Cookie Parsing) ===

async function handleGetAuthToken(sendResponse) {
  console.log('🔧 Background: Getting auth token from ThreadCub tab via localStorage...');
  
  try {
    // Find ThreadCub tab
    const tabs = await chrome.tabs.query({ url: "*://threadcub.com/*" });
    
    if (tabs.length === 0) {
      console.log('🔧 Background: No ThreadCub tab found');
      sendResponse({ success: false, error: 'No ThreadCub tab open - make sure you have ThreadCub open' });
      return;
    }
    
    console.log('🔧 Background: Found ThreadCub tab, extracting auth token from localStorage...');
    
    // Execute script in ThreadCub tab to get auth token from localStorage
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: extractSupabaseAuthToken
    });
    
    if (results && results[0] && results[0].result) {
      const { success, authToken, error } = results[0].result;
      
      if (success && authToken) {
        console.log('🔧 Background: ✅ Auth token extracted successfully!');
        sendResponse({ success: true, authToken: authToken });
      } else {
        console.log('🔧 Background: ❌ Failed to extract auth token:', error);
        sendResponse({ success: false, error: error || 'No auth token found' });
      }
    } else {
      console.log('🔧 Background: ❌ Script execution failed');
      sendResponse({ success: false, error: 'Failed to execute auth extraction script' });
    }
    
  } catch (error) {
    console.error('🔧 Background: Error in handleGetAuthToken:', error);
    sendResponse({ 
      success: false, 
      error: `Error extracting auth token: ${error.message}` 
    });
  }
}

// This function runs in the context of the ThreadCub dashboard tab
function extractSupabaseAuthToken() {
  try {
    console.log('🔧 Dashboard: Extracting Supabase auth token...');
    
    // Method 1: Try to get session from Supabase client directly
    if (typeof window !== 'undefined') {
      // Check if Supabase client is available globally
      if (window.supabase && window.supabase.auth) {
        try {
          // Try to get the current session
          window.supabase.auth.getSession().then(({ data, error }) => {
            if (data.session && data.session.access_token) {
              console.log('🔧 Dashboard: Found token via Supabase client');
              return { success: true, authToken: data.session.access_token };
            }
          });
        } catch (e) {
          console.log('🔧 Dashboard: Supabase client method failed:', e);
        }
      }
    }
    
    // Method 2: Search localStorage for Supabase auth data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Look for Supabase auth keys (common patterns)
      if (key && (key.includes('supabase.auth.token') || key.startsWith('sb-') || key.includes('-auth-token'))) {
        console.log('🔧 Dashboard: Found potential auth key:', key);
        
        try {
          const authData = localStorage.getItem(key);
          if (authData) {
            // Try to parse as JSON
            const parsed = JSON.parse(authData);
            
            // Check for access_token in various formats
            if (parsed.access_token) {
              console.log('🔧 Dashboard: Found access_token in localStorage');
              return { success: true, authToken: parsed.access_token };
            }
            
            // Check if it's an array with access token as first element
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
              console.log('🔧 Dashboard: Found token in array format');
              return { success: true, authToken: parsed[0] };
            }
            
            // Check for nested session data
            if (parsed.session && parsed.session.access_token) {
              console.log('🔧 Dashboard: Found token in session object');
              return { success: true, authToken: parsed.session.access_token };
            }
          }
        } catch (parseError) {
          console.log('🔧 Dashboard: Failed to parse auth data for key:', key, parseError);
          continue;
        }
      }
    }
    
    // Method 3: Try common Supabase localStorage key patterns
    const commonKeys = [
      'supabase.auth.token',
      'sb-localhost-auth-token',
      'sb-threadcub-auth-token',
      'sb-auth-token'
    ];
    
    for (const key of commonKeys) {
      const authData = localStorage.getItem(key);
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.access_token) {
            console.log('🔧 Dashboard: Found token with common key pattern:', key);
            return { success: true, authToken: parsed.access_token };
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    console.log('🔧 Dashboard: No auth token found in localStorage');
    return { success: false, error: 'No auth token found - make sure you are logged in to ThreadCub' };

  } catch (error) {
    console.error('🔧 Dashboard: Error extracting auth token:', error);
    return { success: false, error: `Error: ${error.message}` };
  }
}

// === SECTION 8: Extension Auth Token Handlers ===

async function handleStoreAuthToken(request, sendResponse) {
  console.log('🔐 Background: Storing auth token from callback...');
  try {
    const { token } = request;
    if (!token) {
      sendResponse({ success: false, error: 'No token provided' });
      return;
    }

    await self.AuthService.storeToken(token);

    // Validate the token and store user data
    const userData = await self.AuthService.validateToken(token);
    if (userData) {
      await self.AuthService.storeUser(userData);
      console.log('🔐 Background: Token stored and validated, user:', userData.email || userData.user?.email);
    }

    sendResponse({ success: true, user: userData });
  } catch (error) {
    console.error('🔐 Background: Error storing auth token:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetStoredAuthToken(sendResponse) {
  console.log('🔐 Background: Getting stored auth token...');
  try {
    const token = await self.AuthService.getToken();
    const user = await self.AuthService.getUser();
    sendResponse({ success: true, token, user });
  } catch (error) {
    console.error('🔐 Background: Error getting stored token:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleValidateAuthToken(sendResponse) {
  console.log('🔐 Background: Validating stored auth token...');
  try {
    const result = await self.AuthService.getValidatedAuth();
    sendResponse({ success: true, ...result });
  } catch (error) {
    console.error('🔐 Background: Error validating token:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAuthLogout(sendResponse) {
  console.log('🔐 Background: Logging out...');
  try {
    await self.AuthService.logout();
    sendResponse({ success: true });
  } catch (error) {
    console.error('🔐 Background: Error during logout:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// === SECTION 9: External Message Listener for Auth Callback ===
// Listen for messages from the auth callback page (threadcub.com/auth/extension-callback)

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('🔐 Background: Received external message from:', sender.url);
  console.log('🔐 Background: External message action:', request.action);

  if (request.action === 'storeAuthToken' && request.token) {
    console.log('🔐 Background: Auth callback received with token');

    handleStoreAuthToken({ token: request.token }, sendResponse);
    return true;
  }

  sendResponse({ success: false, error: 'Unknown external action' });
});

// Also listen for internal messages from content scripts on threadcub.com
// that relay the auth token from the callback page
console.log('🔐 ThreadCub: Auth handlers registered in background script');