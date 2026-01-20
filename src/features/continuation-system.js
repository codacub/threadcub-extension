
// === SECTION 2A: Streamlined Continuation System (NO MODAL) ===

// ===== STREAMLINED: Check for continuation data and auto-execute =====
function checkForContinuationData() {
  console.log('🐻 ThreadCub: Checking for continuation data using Chrome storage');
  
  // Check if chrome storage is available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      chrome.storage.local.get(['threadcubContinuationData'], (result) => {
        if (chrome.runtime.lastError) {
          console.log('🐻 ThreadCub: Chrome storage error:', chrome.runtime.lastError);
          console.log('🐻 ThreadCub: Falling back to localStorage...');
          checkLocalStorageFallback(); // ✅ Add this fallback call
          return;
        }
        
        const data = result.threadcubContinuationData;
        if (data) {
          console.log('🐻 ThreadCub: Found continuation data:', data);
          
          // Check if data is recent (less than 5 minutes old)
          const isRecent = (Date.now() - data.timestamp) < 5 * 60 * 1000;
          
          if (isRecent) {
            // Clear the data so it's only used once
            chrome.storage.local.remove(['threadcubContinuationData'], () => {
              console.log('🐻 ThreadCub: Cleared used continuation data');
            });
            
            // STREAMLINED: Execute continuation immediately (no modal)
            setTimeout(() => {
              executeStreamlinedContinuation(data.prompt, data.shareUrl, data);
            }, 800); // Quick delay for page load
          } else {
            console.log('🐻 ThreadCub: Continuation data too old, ignoring');
            chrome.storage.local.remove(['threadcubContinuationData']);
          }
        } else {
          console.log('🐻 ThreadCub: No continuation data found in Chrome storage');
          console.log('🐻 ThreadCub: Checking localStorage as fallback...');
          checkLocalStorageFallback(); // ✅ Add this fallback call
        }
      });
    } catch (error) {
      console.log('🐻 ThreadCub: Error checking continuation data:', error);
      console.log('🐻 ThreadCub: Falling back to localStorage...');
      checkLocalStorageFallback(); // ✅ Add this fallback call
    }
  } else {
    checkLocalStorageFallback(); // This part is already correct
  }

  // Extract the localStorage logic into a separate function
  function checkLocalStorageFallback() {
    try {
      const storedData = localStorage.getItem('threadcubContinuationData');
      if (storedData) {
        const data = JSON.parse(storedData);
        console.log('🐻 ThreadCub: Found continuation data in localStorage:', data);
        
        // Check if data is recent
        const isRecent = (Date.now() - data.timestamp) < 5 * 60 * 1000;
        
        if (isRecent) {
          // Clear the data
          localStorage.removeItem('threadcubContinuationData');
          
          // STREAMLINED: Execute continuation immediately
          setTimeout(() => {
            executeStreamlinedContinuation(data.prompt, data.shareUrl, data);
          }, 800);
        } else {
          console.log('🐻 ThreadCub: Continuation data too old, clearing');
          localStorage.removeItem('threadcubContinuationData');
        }
      } else {
        console.log('🐻 ThreadCub: No continuation data found in localStorage');
      }
    } catch (error) {
      console.log('🐻 ThreadCub: Error with localStorage:', error);
    }
  }
}

// ===== STREAMLINED: Execute continuation without modal =====
function executeStreamlinedContinuation(fullPrompt, shareUrl, continuationData) {
  console.log('🚀 ThreadCub: Executing streamlined continuation');
  console.log('🚀 Platform:', continuationData.platform);
  console.log('🚀 ChatGPT Flow:', continuationData.chatGPTFlow);
  
  const platform = window.PlatformDetector.detectPlatform();
  
  // STEP 1: Auto-populate the input field
  console.log('🔧 Auto-populating input field...');
  const populateSuccess = fillInputFieldWithPrompt(fullPrompt);
  
  console.log('🔧 Population result:', populateSuccess);
  
  // FIXED: Always show notification and continue (don't rely on populateSuccess return)
  // Show subtle success notification
  showStreamlinedNotification(continuationData);
  
  // Auto-start the conversation after brief delay
  setTimeout(() => {
    console.log('🔧 Auto-starting conversation...');
    attemptAutoStart(platform);
  }, 1500); // Give user moment to see the populated input
}

// ===== STREAMLINED: Subtle success notification =====
function showStreamlinedNotification(continuationData) {
  const isChatGPTFlow = continuationData.chatGPTFlow === true;
  const isGeminiFlow = continuationData.geminiFlow === true;
  const messageCount = continuationData.totalMessages || 'multiple';
  
  // Create small, non-intrusive notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, ${isChatGPTFlow ? '#10a37f' : '#667eea'} 0%, ${isChatGPTFlow ? '#0d8f6f' : '#764ba2'} 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 10000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 320px;
  `;
  
  const title = continuationData.title || 'Previous Conversation';
  const platformName = isChatGPTFlow ? 'ChatGPT' : (continuationData.platform || 'AI Platform');
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="font-size: 18px;">${isChatGPTFlow ? '💬' : '🐻'}</div>
      <div>
        <div style="font-weight: 700; margin-bottom: 2px;">ThreadCub Continuation</div>
        <div style="font-size: 12px; opacity: 0.9;">${platformName} • ${messageCount} messages</div>
        ${isChatGPTFlow ? 
          '<div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">📁 File downloaded, upload when ready</div>' : 
          '<div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">✨ Conversation context loaded</div>'
        }
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-hide after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
  
  console.log('✅ Streamlined notification shown');
}

// ===== Fill input field with prompt =====
function fillInputFieldWithPrompt(prompt) {
  const platform = window.PlatformDetector.detectPlatform();
  console.log('🔧 Filling input field with continuation prompt for:', platform);

  // Get platform-specific selectors from centralized module
  const platformSelectors = window.PlatformDetector.getInputSelectors(platform);
  console.log('🔍 Using selectors:', platformSelectors);

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
    console.log('🔧 Found input field:', inputField.tagName, inputField.className);

    inputField.focus();

    // Fill based on input type
    if (inputField.tagName === 'TEXTAREA') {
      inputField.value = prompt;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (inputField.contentEditable === 'true') {
      inputField.textContent = prompt;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    console.log('✅ Input field auto-populated successfully');
    return true;
  } else {
    console.error('❌ Could not find input field for platform:', platform);
    return false;
  }
}

// ===== Auto-start conversation =====
function attemptAutoStart(platform) {
  console.log('🔧 Attempting auto-start for platform:', platform);

  if (platform === window.PlatformDetector.PLATFORMS.CLAUDE || platform === 'claude.ai') {
    attemptClaudeAutoStart();
  } else if (platform === window.PlatformDetector.PLATFORMS.CHATGPT || platform === 'chatgpt') {
    attemptChatGPTAutoStart();
  } else if (platform === window.PlatformDetector.PLATFORMS.GEMINI || platform === 'gemini') {
    attemptGeminiAutoStart();
  }
}

function attemptClaudeAutoStart() {
  try {
    const sendSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'button:has(svg[data-testid="send-icon"])'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🔧 Found Claude send button, clicking...');
        sendButton.click();
        return;
      }
    }
    
    console.log('🔧 No Claude send button found or all disabled');
    
  } catch (error) {
    console.log('🔧 Claude auto-start failed:', error);
  }
}

function attemptChatGPTAutoStart() {
  try {
    const sendSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'button:has(svg[data-testid="send-icon"])'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🔧 Found ChatGPT send button, clicking...');
        sendButton.click();
        return;
      }
    }
    
    console.log('🔧 No ChatGPT send button found or all disabled');
    
  } catch (error) {
    console.log('🔧 ChatGPT auto-start failed:', error);
  }
}

function attemptGeminiAutoStart() {
  try {
    const sendSelectors = [
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ];
    
    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🔧 Found Gemini send button, clicking...');
        sendButton.click();
        return;
      }
    }
    
    console.log('🔧 No Gemini send button found or all disabled');
    
  } catch (error) {
    console.log('🔧 Gemini auto-start failed:', error);
  }
}

// ===== Platform detection (now using centralized module) =====
// Removed - now using window.PlatformDetector.detectPlatform()

// === END SECTION 2A ===

// Export continuation system to window for global access
window.ContinuationSystem = {
  checkForContinuationData,
  executeStreamlinedContinuation,
  fillInputFieldWithPrompt,
  attemptAutoStart
};

console.log('🐻 ThreadCub: Continuation system module loaded');
