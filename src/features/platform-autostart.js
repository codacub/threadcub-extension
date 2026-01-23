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
    } else if (platform === window.PlatformDetector.PLATFORMS.GROK || platform === 'grok') {
      attemptGrokAutoStart();
    } else if (platform === window.PlatformDetector.PLATFORMS.DEEPSEEK || platform === 'deepseek') {
      attemptDeepSeekAutoStart();
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

// ===== Grok auto-start =====
// Grok supports web_fetch just like Claude! Auto-submit to let it work.
function attemptGrokAutoStart() {
  console.log('🤖 ThreadCub: Attempting Grok auto-start (web_fetch enabled)');

  try {
    // Grok's send button selectors (similar to other platforms)
    const sendSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
      'button[type="submit"]',
      'button[class*="send"]'
    ];

    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🤖 ThreadCub: Found Grok send button, auto-submitting (like Claude)...');
        sendButton.click();
        return true;
      }
    }

    console.warn('⚠️ ThreadCub: Could not find Grok send button');
    return false;

  } catch (error) {
    console.log('🤖 ThreadCub: Grok auto-start failed:', error);
    return false;
  }
}

// ===== DeepSeek auto-start =====
// DeepSeek now uses direct JSON embedding, so no need for Search button - just auto-submit!
function attemptDeepSeekAutoStart() {
  console.log('🔵 ThreadCub: Attempting DeepSeek auto-start (direct JSON, no Search button needed)');

  try {
    // Find and click the Send button (JSON is already embedded in prompt)
    const sendSelectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
      'button[type="submit"]',
      'button[class*="send"]',
      'button[class*="submit"]'
    ];

    for (const selector of sendSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log('🔵 ThreadCub: Found DeepSeek send button, auto-submitting...');
        sendButton.click();
        return true;
      }
    }

    console.warn('⚠️ ThreadCub: Could not find DeepSeek send button');
    return false;

  } catch (error) {
    console.log('🔵 ThreadCub: DeepSeek auto-start failed:', error);
    return false;
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

// Export platform autostart functions to window for global access
window.PlatformAutostart = {
  generateConversationSummary,
  attemptAutoStart,
  attemptClaudeAutoStart,
  attemptChatGPTAutoStart,
  attemptGeminiAutoStart,
  attemptGrokAutoStart,
  attemptDeepSeekAutoStart,
  fillInputFieldWithPrompt,
  showContinuationSuccess,
  showDownloadSuccessMessage
};

console.log('🐻 ThreadCub: Platform autostart module loaded');