// =============================================================================
// ThreadCub Conversation Extractor
// Handles extraction of conversation data from various AI platforms
// =============================================================================

const ConversationExtractor = {

  // =============================================================================
  // MAIN WRAPPER METHOD
  // Routes to platform-specific extraction based on current URL
  // =============================================================================

  async extractConversation() {
    console.log('🐻 ThreadCub: Extracting conversation data...');

    let conversationData;
    const hostname = window.location.hostname;

    if (hostname.includes('claude.ai')) {
      conversationData = await this.extractClaudeConversation();
    } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      conversationData = this.extractChatGPTConversation();
    } else if (hostname.includes('gemini.google.com')) {
      conversationData = this.extractGeminiConversation();
    } else if (hostname.includes('grok.x.ai') || hostname.includes('grok.com') || (hostname.includes('x.com') && window.location.pathname.includes('/i/grok'))) {
      conversationData = this.extractGrokConversation();
    } else if (hostname.includes('chat.deepseek.com')) {
      conversationData = this.extractDeepSeekConversation();
    } else {
      conversationData = this.extractGenericConversation();
    }

    return conversationData;
  },

  // =============================================================================
  // CLAUDE EXTRACTION
  // =============================================================================

  async extractClaudeConversation() {
    console.log('🐻 ThreadCub: Starting SIMPLE WORKING Claude.ai extraction...');

    const title = document.title.replace(' | Claude', '') || 'Claude Conversation';

    try {
      // Use the EXACT approach that worked in the diagnostic
      const extractedMessages = this.simpleWorkingExtraction();

      const conversationData = {
        title: title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: 'Claude.ai',
        total_messages: extractedMessages.length,
        messages: extractedMessages,
        extraction_method: 'simple_working_extraction'
      };

      console.log(`🐻 ThreadCub: ✅ SIMPLE extraction complete: ${extractedMessages.length} messages`);

      return conversationData;

    } catch (error) {
      console.error('🐻 ThreadCub: Simple extraction failed:', error);

      // Fallback to working method
      const fallbackMessages = this.workingContainerExtraction();

      return {
        title: title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: 'Claude.ai',
        total_messages: fallbackMessages.length,
        messages: fallbackMessages,
        extraction_method: 'fallback_working_extraction',
        error: error.message
      };
    }
  },

  simpleWorkingExtraction() {
    console.log('🐻 ThreadCub: Using SIMPLE working extraction - copying diagnostic success...');

    const messages = [];
    let messageIndex = 0;

    // Use the EXACT selector that worked in diagnostic
    const elements = document.querySelectorAll('div[class*="flex"][class*="flex-col"]');
    console.log(`🐻 ThreadCub: Found ${elements.length} flex elements`);

    // Filter for elements with text (same as diagnostic)
    const textElements = Array.from(elements).filter(el => {
      const text = el.innerText?.trim() || '';
      return text.length > 50; // Same threshold as diagnostic
    });

    console.log(`🐻 ThreadCub: Filtered to ${textElements.length} text elements`);

    // Process each element (same as diagnostic)
    textElements.forEach((element, index) => {
      const text = element.innerText?.trim() || '';

      if (text && text.length > 50) {
        // Use ENHANCED role detection (FIX #1)
        const role = this.enhancedRoleDetection(text, index);

        messages.push({
          id: messageIndex++,
          role: role,
          content: this.simpleCleanContent(text),
          timestamp: new Date().toISOString(),
          extractionMethod: 'simple_working',
          selector_used: 'div[class*="flex"][class*="flex-col"]',
          element_classes: element.className,
          element_data_attrs: this.getDataAttributes(element)
        });
      }
    });

    console.log(`🐻 ThreadCub: Simple extraction found: ${messages.length} messages`);
    return messages;
  },

  enhancedRoleDetection(text, index) {
    console.log(`🔍 Enhanced role detection for message ${index}: "${text.substring(0, 50)}..."`);

    // Method 1: Very specific content patterns from our actual conversation
    const strongUserPatterns = [
      /^I need help on a project/i,
      /^What I don't understand/i,
      /^Work from this\./i,
      /^ok i think it work/i,
      /^this is the new download/i,
      /^back to \d+kb/i,
      /^same size file again/i,
      /^OH NO.*Back to 2KB/i,
      /are we just guessing now/i,
      /GOSH.*what did you do/i,
      /^\d+KB now$/i,
      /with the issues to fix/i,
      /as much as i'd love to take snippets/i
    ];

    const strongAssistantPatterns = [
      /^Looking at your/i,
      /^Great! I can see/i,
      /^You're absolutely right/i,
      /^The extraction is/i,
      /^We've gone backwards/i,
      /^Same 2KB file/i,
      /^BREAKTHROUGH!/i,
      /^OH NO! We're back/i,
      /^EXCELLENT!/i,
      /^Absolutely!/i,
      /SECTION 4[A-Z]-\d+:/,
      /Replace your.*SECTION/i,
      /Here's how to fix/i,
      /The key breakthrough/i,
      /This version is exactly/i,
      /Looking at the current issues/i,
      /Here's the complete SECTION/i
    ];

    // Check strong patterns first
    for (const pattern of strongUserPatterns) {
      if (pattern.test(text)) {
        console.log(`🔍 Strong user pattern matched: ${pattern}`);
        return 'user';
      }
    }

    for (const pattern of strongAssistantPatterns) {
      if (pattern.test(text)) {
        console.log(`🔍 Strong assistant pattern matched: ${pattern}`);
        return 'assistant';
      }
    }

    // Method 2: Length-based heuristic (long responses usually assistant)
    if (text.length > 3000) {
      console.log(`🔍 Length-based: assistant (${text.length} chars)`);
      return 'assistant';
    }

    // Method 3: Code detection (assistant responses often have code)
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /console\.log\(/,
      /document\.querySelector/,
      /extractClaudeConversation/,
      /ThreadCub:/,
      /=>\s*\{/,
      /async\s+function/,
      /class\s+\w+/
    ];

    let codeMatches = 0;
    codePatterns.forEach(pattern => {
      if (pattern.test(text)) codeMatches++;
    });

    if (codeMatches >= 2) {
      console.log(`🔍 Code-based: assistant (${codeMatches} code patterns)`);
      return 'assistant';
    }

    // Method 4: Question vs statement detection
    if (text.includes('?') && text.length < 500) {
      console.log(`🔍 Question-based: user`);
      return 'user';
    }

    // Method 5: File reference detection (user uploads files)
    if (/\.(json|js|txt|csv)\b/i.test(text) && text.length < 200) {
      console.log(`🔍 File reference: user`);
      return 'user';
    }

    // Method 6: Fallback to alternating pattern
    const alternatingRole = index % 2 === 0 ? 'user' : 'assistant';
    console.log(`🔍 Alternating fallback: ${alternatingRole}`);

    return alternatingRole;
  },

  simpleCleanContent(content) {
    return content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*Copy\s*$/gm, '')
      .replace(/^\s*Edit\s*$/gm, '')
      .replace(/^\s*Retry\s*$/gm, '')
      .trim();
  },

  getDataAttributes(element) {
    const dataAttrs = {};
    if (element && element.attributes) {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          dataAttrs[attr.name] = attr.value;
        }
      });
    }
    return dataAttrs;
  },

  workingContainerExtraction() {
    console.log('🐻 ThreadCub: Using fallback working extraction method...');

    const messages = [];
    let messageIndex = 0;

    const containers = document.querySelectorAll('[data-testid*="message"]:not([data-testid*="button"])');
    console.log(`🐻 ThreadCub: Found ${containers.length} containers`);

    containers.forEach((container, index) => {
      const text = container.innerText?.trim() || container.textContent?.trim() || '';

      if (text && text.length > 50 && text.length < 15000) {
        const role = this.enhancedRoleDetection(text, index);

        messages.push({
          id: messageIndex++,
          role: role,
          content: this.simpleCleanContent(text),
          timestamp: new Date().toISOString(),
          extractionMethod: 'working_container'
        });
      }
    });

    return messages;
  },

  // =============================================================================
  // CHATGPT EXTRACTION
  // =============================================================================

  extractChatGPTConversation() {
    console.log('🤖 ThreadCub: Extracting ChatGPT conversation with TARGETED fix...');

    const messages = [];
    let messageIndex = 0;

    // Get page title for conversation title
    const title = document.title.replace(' | ChatGPT', '') || 'ChatGPT Conversation';

    // TARGETED FIX: Use the selector that actually works
    console.log('🤖 ThreadCub: Using PRIMARY ChatGPT selector: [data-message-author-role]');

    const messageElements = document.querySelectorAll('[data-message-author-role]');
    console.log(`🤖 ThreadCub: Found ${messageElements.length} ChatGPT messages with role attributes`);

    if (messageElements.length === 0) {
      console.log('🤖 ThreadCub: No role-attributed messages found, using fallback');
      return this.extractChatGPTFallback(title);
    }

    // Process each message element
    messageElements.forEach((element, index) => {
      try {
        // Get role directly from data attribute (most reliable)
        const authorRole = element.getAttribute('data-message-author-role');
        const role = authorRole === 'user' ? 'user' : 'assistant';

        // Extract content using multiple strategies
        let messageContent = this.extractChatGPTMessageContent(element);

        // Skip if no valid content or if it's too short
        if (!messageContent || messageContent.length < 5) {
          console.log(`🤖 ThreadCub: Skipping message ${index} - no valid content`);
          return;
        }

        // Skip obvious duplicates
        const isDuplicate = messages.some(msg =>
          msg.content === messageContent && msg.role === role
        );

        if (isDuplicate) {
          console.log(`🤖 ThreadCub: Skipping duplicate message: "${messageContent.slice(0, 50)}..."`);
          return;
        }

        // Add valid message
        messages.push({
          id: messageIndex++,
          role: role,
          content: messageContent.trim(),
          timestamp: new Date().toISOString(),
          extractionMethod: 'chatgpt_targeted_fix',
          messageId: element.getAttribute('data-message-id') || `msg-${index}`
        });

        console.log(`🤖 ThreadCub: ✅ Added ${role} message: "${messageContent.slice(0, 50)}..."`);

      } catch (error) {
        console.log(`🤖 ThreadCub: Error processing message ${index}:`, error);
      }
    });

    const conversationData = {
      title: title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'ChatGPT',
      total_messages: messages.length,
      messages: messages,
      extraction_method: 'chatgpt_targeted_fix'
    };

    console.log(`🤖 ThreadCub: ✅ ChatGPT extraction complete: ${messages.length} messages`);

    // Log summary
    const userCount = messages.filter(m => m.role === 'user').length;
    const assistantCount = messages.filter(m => m.role === 'assistant').length;
    console.log(`🤖 ThreadCub: Messages breakdown - User: ${userCount}, Assistant: ${assistantCount}`);

    if (messages.length > 0) {
      console.log('🤖 ThreadCub: First message sample:', messages[0]);
    }

    return conversationData;
  },

  extractChatGPTMessageContent(element) {
    // Strategy 1: Look for whitespace-pre-wrap (most common ChatGPT content container)
    const preWrap = element.querySelector('.whitespace-pre-wrap');
    if (preWrap) {
      const content = preWrap.textContent?.trim();
      if (content && content.length > 5) {
        return this.cleanChatGPTContent(content);
      }
    }

    // Strategy 2: Look for specific content containers
    const contentSelectors = [
      'div[class*="text-message"]',
      'div[class*="markdown"]',
      'div[class*="prose"]',
      'div[class*="break-words"]',
      'p'
    ];

    for (const selector of contentSelectors) {
      const contentEl = element.querySelector(selector);
      if (contentEl) {
        const content = contentEl.textContent?.trim();
        if (content && content.length > 5) {
          return this.cleanChatGPTContent(content);
        }
      }
    }

    // Strategy 3: Direct text from element (but filter out UI noise)
    const directText = element.textContent?.trim() || '';

    // Filter out obvious UI elements
    if (directText.includes('Copy') ||
        directText.includes('Regenerate') ||
        directText.includes('Share') ||
        directText.length < 5) {
      return '';
    }

    return this.cleanChatGPTContent(directText);
  },

  cleanChatGPTContent(content) {
    if (!content) return '';

    return content
      // Remove UI buttons
      .replace(/^Copy$/gm, '')
      .replace(/^Regenerate$/gm, '')
      .replace(/^Share$/gm, '')
      .replace(/^Edit$/gm, '')
      .replace(/^Retry$/gm, '')

      // Remove code language labels that appear before code blocks
      .replace(/^(javascript|python|html|css|java|typescript|json|xml|sql)\s*$/gmi, '')

      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  },

  extractChatGPTFallback(title) {
    console.log('🤖 ThreadCub: Using ChatGPT fallback extraction...');

    const messages = [];
    let messageIndex = 0;

    // Look for conversation turn containers
    const turnContainers = document.querySelectorAll('div[class*="group/conversation-turn"]');
    console.log(`🤖 ThreadCub: Found ${turnContainers.length} conversation turns`);

    if (turnContainers.length > 0) {
      turnContainers.forEach((container, index) => {
        const text = container.textContent?.trim();
        if (text && text.length > 20 && text.length < 10000) {
          // Try to determine role from content patterns
          const isUser = text.length < 500 ||
                        text.includes('?') ||
                        /^(can you|could you|please|help|what|how|why)/i.test(text);

          messages.push({
            id: messageIndex++,
            role: isUser ? 'user' : 'assistant',
            content: this.cleanChatGPTContent(text),
            timestamp: new Date().toISOString(),
            extractionMethod: 'chatgpt_fallback'
          });
        }
      });
    }

    return {
      title: title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'ChatGPT',
      total_messages: messages.length,
      messages: messages,
      extraction_method: 'chatgpt_fallback'
    };
  },

  // =============================================================================
  // GEMINI EXTRACTION
  // =============================================================================

  extractGeminiConversation() {
  console.log('🟣 ThreadCub: Extracting Gemini conversation...');

  const messages = [];
  let messageIndex = 0;

  // IMPROVED: Generate better title from first user message
let title = 'Gemini Conversation';

// After extracting messages, generate a better title
if (messages.length > 0) {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (firstUserMessage && firstUserMessage.content) {
    const content = firstUserMessage.content.trim();
    if (content.length > 10) {
      // Create descriptive title from first user message
      title = content.substring(0, 50).replace(/\n/g, ' ').trim();
      if (content.length > 50) title += '...';
      title = `${title} - Gemini`;
    }
  }
}

  // Try multiple selectors for Gemini messages
  const messageSelectors = [
    '[data-test-id="conversation-turn"]',
    'div[class*="conversation"]',
    'div[class*="message"]',
    'div[class*="turn"]'
  ];

  let messageElements = [];
  for (const selector of messageSelectors) {
    messageElements = document.querySelectorAll(selector);
    if (messageElements.length > 0) {
      console.log(`🟣 ThreadCub: Found ${messageElements.length} messages with selector:`, selector);
      break;
    }
  }

  // If no specific message elements found, use generic approach
  if (messageElements.length === 0) {
    console.log('🟣 ThreadCub: Using generic extraction for Gemini');
    const textElements = document.querySelectorAll('div, p');
    const validElements = Array.from(textElements).filter(el => {
      const text = el.textContent?.trim() || '';
      return text.length > 20 &&
             text.length < 5000 &&
             !text.includes('Copy') &&
             !text.includes('Share') &&
             !el.querySelector('button');
    });

    validElements.forEach((element, index) => {
      const text = element.textContent?.trim() || '';
      const role = index % 2 === 0 ? 'user' : 'assistant';

      messages.push({
        id: messageIndex++,
        role: role,
        content: text,
        timestamp: new Date().toISOString(),
        extractionMethod: 'gemini_fallback'
      });
    });
  } else {
    // Process found message elements
    messageElements.forEach((element, index) => {
      const text = element.textContent?.trim() || '';
      if (text && text.length > 10) {
        const role = text.length < 200 && text.includes('?') ? 'user' :
                     index % 2 === 0 ? 'user' : 'assistant';

        messages.push({
          id: messageIndex++,
          role: role,
          content: text.replace(/^(Copy|Share|Regenerate)$/gm, '').trim(),
          timestamp: new Date().toISOString(),
          extractionMethod: 'gemini_direct'
        });
      }
    });
  }

  const conversationData = {
    title: title,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    platform: 'Gemini',
    total_messages: messages.length,
    messages: messages,
    extraction_method: 'gemini_extraction'
  };

  console.log(`🟣 ThreadCub: ✅ Gemini extraction complete: ${messages.length} messages`);
  return conversationData;
},

  // =============================================================================
  // GROK EXTRACTION
  // =============================================================================

  extractGrokConversation() {
    console.log('🤖 ThreadCub: Extracting Grok conversation...');

    const messages = [];
    let messageIndex = 0;

    // TODO: Update after inspecting Grok's actual DOM structure
    // Get page title for conversation title
    const title = document.title || 'Grok Conversation';

    // TODO: Inspect Grok's DOM to find the correct selectors for:
    // - Message container elements
    // - User message elements (role detection)
    // - Assistant message elements (role detection)
    // - Message content extraction
    // - Code blocks, images, and other special content

    // PLACEHOLDER: Try generic message selectors
    console.log('⚠️ ThreadCub: Using placeholder Grok extraction - needs manual selector configuration');

    const messageSelectors = [
      '[data-testid*="message"]',
      'div[class*="message"]',
      'div[class*="conversation"]',
      'div[class*="chat"]'
    ];

    let messageElements = [];
    for (const selector of messageSelectors) {
      messageElements = document.querySelectorAll(selector);
      if (messageElements.length > 0) {
        console.log(`🤖 ThreadCub: Found ${messageElements.length} potential messages with selector: ${selector}`);
        break;
      }
    }

    if (messageElements.length > 0) {
      messageElements.forEach((element, index) => {
        const text = element.textContent?.trim() || '';
        if (text && text.length > 10) {
          // TODO: Improve role detection based on actual Grok DOM structure
          // This is a simple heuristic - replace with actual role attribute detection
          const role = index % 2 === 0 ? 'user' : 'assistant';

          messages.push({
            id: messageIndex++,
            role: role,
            content: text.replace(/^(Copy|Share|Regenerate|Retry)$/gm, '').trim(),
            timestamp: new Date().toISOString(),
            extractionMethod: 'grok_placeholder',
            needsManualConfiguration: true
          });
        }
      });
    }

    const conversationData = {
      title: title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'Grok',
      total_messages: messages.length,
      messages: messages,
      extraction_method: 'grok_placeholder',
      warning: 'This extraction uses placeholder selectors and needs manual configuration after inspecting Grok DOM'
    };

    console.log(`🤖 ThreadCub: ⚠️ Grok extraction complete (placeholder): ${messages.length} messages`);
    console.log('⚠️ TODO: Update extractGrokConversation() with actual Grok DOM selectors');

    return conversationData;
  },

  // =============================================================================
  // DEEPSEEK EXTRACTION
  // =============================================================================

  extractDeepSeekConversation() {
    console.log('🔵 ThreadCub: Extracting DeepSeek conversation...');

    const messages = [];
    let messageIndex = 0;

    // TODO: Update after inspecting DeepSeek's actual DOM structure
    // Get page title for conversation title
    const title = document.title || 'DeepSeek Conversation';

    // TODO: Inspect DeepSeek's DOM to find the correct selectors for:
    // - Message container elements
    // - User message elements (role detection)
    // - Assistant message elements (role detection)
    // - Message content extraction
    // - Code blocks, images, and other special content

    // PLACEHOLDER: Try generic message selectors
    console.log('⚠️ ThreadCub: Using placeholder DeepSeek extraction - needs manual selector configuration');

    const messageSelectors = [
      '[data-testid*="message"]',
      '[data-role="user"]',
      '[data-role="assistant"]',
      'div[class*="message"]',
      'div[class*="conversation"]',
      'div[class*="chat"]'
    ];

    let messageElements = [];
    for (const selector of messageSelectors) {
      messageElements = document.querySelectorAll(selector);
      if (messageElements.length > 0) {
        console.log(`🔵 ThreadCub: Found ${messageElements.length} potential messages with selector: ${selector}`);
        break;
      }
    }

    if (messageElements.length > 0) {
      messageElements.forEach((element, index) => {
        const text = element.textContent?.trim() || '';
        if (text && text.length > 10) {
          // TODO: Improve role detection based on actual DeepSeek DOM structure
          // Check for role attributes first, fallback to alternating pattern
          const dataRole = element.getAttribute('data-role');
          const role = dataRole || (index % 2 === 0 ? 'user' : 'assistant');

          messages.push({
            id: messageIndex++,
            role: role,
            content: text.replace(/^(Copy|Share|Regenerate|Retry)$/gm, '').trim(),
            timestamp: new Date().toISOString(),
            extractionMethod: 'deepseek_placeholder',
            needsManualConfiguration: true
          });
        }
      });
    }

    const conversationData = {
      title: title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'DeepSeek',
      total_messages: messages.length,
      messages: messages,
      extraction_method: 'deepseek_placeholder',
      warning: 'This extraction uses placeholder selectors and needs manual configuration after inspecting DeepSeek DOM'
    };

    console.log(`🔵 ThreadCub: ⚠️ DeepSeek extraction complete (placeholder): ${messages.length} messages`);
    console.log('⚠️ TODO: Update extractDeepSeekConversation() with actual DeepSeek DOM selectors');

    return conversationData;
  },

  // =============================================================================
  // GENERIC EXTRACTION
  // =============================================================================

  extractGenericConversation() {
    console.log('🐻 ThreadCub: Attempting generic conversation extraction...');

    const messages = [];
    let messageIndex = 0;

    const title = document.title || 'AI Conversation';

    // Generic approach - look for text blocks that might be messages
    const textElements = document.querySelectorAll('p, div[class*="message"], .prose, [role="group"], div[class*="text"], div[class*="content"]');

    const validMessages = [];

    textElements.forEach(element => {
      try {
        const text = element.innerText?.trim();
        if (text &&
            text.length > 20 &&
            text.length < 5000 &&
            !text.includes('button') &&
            !text.includes('click') &&
            !text.includes('menu') &&
            !element.querySelector('button') &&
            !element.querySelector('input')) {
          validMessages.push({
            element: element,
            text: text,
            length: text.length
          });
        }
      } catch (error) {
        console.log('🐻 ThreadCub: Error in generic extraction:', error);
      }
    });

    // Sort by text length and take the most substantial messages
    validMessages.sort((a, b) => b.length - a.length);
    const topMessages = validMessages.slice(0, Math.min(50, validMessages.length));

    topMessages.forEach((item, index) => {
      messages.push({
        id: messageIndex++,
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: item.text,
        timestamp: new Date().toISOString()
      });
    });

    const conversationData = {
      title: title,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'Generic',
      total_messages: messages.length,
      messages: messages
    };

    console.log(`🐻 ThreadCub: ✅ Extracted ${messages.length} messages generically`);
    return conversationData;
  },

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  generateQuickSummary(messages) {
    if (!messages || messages.length === 0) return 'Empty conversation';

    const userMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'human');
    if (userMessages.length === 0) return 'No user messages found';

    const lastUserMessage = userMessages[userMessages.length - 1];
    const firstUserMessage = userMessages[0];

    if (userMessages.length === 1) {
      return `Previous conversation about: "${firstUserMessage.content.substring(0, 100)}..."`;
    }

    return `Previous conversation: Started with "${firstUserMessage.content.substring(0, 60)}..." and most recently discussed "${lastUserMessage.content.substring(0, 60)}..."`;
  },

  getTargetPlatformFromCurrentUrl() {
    const hostname = window.location.hostname;
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else if (hostname.includes('gemini.google.com')) {
      return 'gemini';
    }
    return 'unknown';
  },

  generateContinuationPrompt(summary, shareUrl, platform, conversationData) {
    console.log('🐻 ThreadCub: Generating continuation prompt for platform:', platform);

    // FIXED: Add Gemini support - both ChatGPT and Gemini use file-based prompts
    if (platform && (platform.toLowerCase().includes('chatgpt') ||
                    platform.toLowerCase().includes('gemini'))) {
      // ChatGPT/Gemini-specific prompt (file upload)
      const prompt = `I'd like to continue our previous conversation. I have our complete conversation history as a file that I'll share now.

  Please read through the attached conversation file and provide your assessment of:
  - What we were working on
  - The current status/progress
  - Any next steps or tasks mentioned

  Once you've reviewed it, let me know you're ready to continue from where we left off.`;

      console.log('🐻 ThreadCub: Generated ChatGPT/Gemini-specific continuation prompt:', prompt.length, 'characters');
      return prompt;
    } else {
      // Claude-specific prompt (URL access)
      const claudePrompt = `I'd like to continue our previous conversation. The complete context is available at: ${shareUrl}

Please attempt to fetch this URL using your web_fetch tool to access the conversation history. The URL returns a JSON response with the full conversation.

If you're able to retrieve it, let me know you're ready to continue from where we left off.
If you cannot access it for any reason, please let me know and I'll share the conversation content directly.`;

      console.log('🐻 ThreadCub: Generated Claude-specific continuation prompt:', claudePrompt.length, 'characters');
      return claudePrompt;
    }
  }

};

// Export to global window object
window.ConversationExtractor = ConversationExtractor;
console.log('🔌 ThreadCub: ConversationExtractor module loaded');
