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
    
    const response = await fetch('https://threadcub.com/api/conversations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log('🐻 Background: API response status:', response.status);
    console.log('🐻 Background: API response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🐻 Background: API error response:', errorText);
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
  
  chrome.storage.local.set({
    threadcubContinuation: {
      prompt: request.prompt,
      shareUrl: request.shareUrl,
      platform: request.platform,
      timestamp: Date.now(),
      sourceTabId: sender.tab.id
    }
  });
  
  sendResponse({ success: true });
}

function handleGetContinuationData(sender, sendResponse) {
  console.log('🔄 Background: Getting continuation data for new tab');
  
  chrome.storage.local.get(['threadcubContinuation'], (result) => {
    const data = result.threadcubContinuation;
    
    // Check if data exists, is recent (within 2 minutes), and from different tab
    if (data && 
        Date.now() - data.timestamp < 120000 && 
        data.sourceTabId !== sender.tab.id) {
      
      console.log('🔄 Background: Found valid continuation data, sending to tab');
      // Clear the data after retrieving it (one-time use)
      chrome.storage.local.remove(['threadcubContinuation']);
      sendResponse({ data });
    } else {
      console.log('🔄 Background: No valid continuation data found');
      sendResponse({ data: null });
    }
  });
}

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
    const tab = await chrome.tabs.create({ url: url });
    
    // Wait for tab to load
    await waitForTabReady(tab.id);
    
    // Get platform config
    const hostname = new URL(url).hostname;
    const platformConfig = PLATFORM_INJECTORS[hostname];
    
    if (!platformConfig) {
      console.log('🔄 Background: Unsupported platform, tab opened but no injection');
      return { success: true, tabId: tab.id, platform: 'Unknown', injected: false };
    }
    
    // Inject the prompt
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectPromptFunction,
      args: [prompt, platformConfig.selectors]
    });
    
    console.log('🔄 Background: Injection result:', result);
    
    return { success: true, tabId: tab.id, platform: platformConfig.name, injected: true };
    
  } catch (error) {
    console.error('🔄 Background: Error:', error);
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

// === SECTION 6: Extension Lifecycle ===

chrome.runtime.onInstalled.addListener((details) => {
  console.log('🐻 Background: Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    console.log('🐻 Background: First install - opening welcome page');
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🐻 Background: Extension started');
});

console.log('🐻 ThreadCub background script loaded and ready');