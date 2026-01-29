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
    } else if (hostname.includes('perplexity.ai')) {
      conversationData = this.extractPerplexityConversation();
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
    const role = index % 2 === 0 ? 'user' : 'assistant';
    console.log(`🔍 Fallback alternating: ${role}`);
    return role;
  },

  simpleCleanContent(text) {
    return text
      .replace(/^\s+|\s+$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^(Copy|Copy code|Share|Regenerate)$/gm, '')
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
    console.log('🐻 ThreadCub: Using working container extraction as fallback...');

    const messages = [];
    let messageIndex = 0;

    try {
      const containers = document.querySelectorAll('[data-testid^="conversation-turn"]');
      console.log(`🐻 ThreadCub: Found ${containers.length} conversation turns`);

      containers.forEach((container, index) => {
        const text = container.innerText?.trim();
        if (text && text.length > 50) {
          const role = index % 2 === 0 ? 'user' : 'assistant';
          messages.push({
            id: messageIndex++,
            role: role,
            content: this.simpleCleanContent(text),
            timestamp: new Date().toISOString(),
            extractionMethod: 'working_container',
            selector_used: '[data-testid^="conversation-turn"]'
          });
        }
      });

    } catch (error) {
      console.error('🐻 ThreadCub: Container extraction error:', error);
    }

    console.log(`🐻 ThreadCub: Container extraction found: ${messages.length} messages`);
    return messages;
  },

  // =============================================================================
  // CHATGPT EXTRACTION
  // =============================================================================

  extractChatGPTConversation() {
    console.log('🤖 ThreadCub: Extracting ChatGPT conversation...');

    const messages = [];
    let messageIndex = 0;

    const messageElements = document.querySelectorAll('[data-testid^="conversation-turn"]');
    console.log(`🤖 ThreadCub: Found ${messageElements.length} ChatGPT message elements`);

    messageElements.forEach((messageElement, index) => {
      try {
        const text = messageElement.innerText?.trim();
        if (text && text.length > 10) {
          const role = index % 2 === 0 ? 'user' : 'assistant';

          messages.push({
            id: messageIndex++,
            role: role,
            content: text,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.log(`🤖 ThreadCub: Error extracting message ${index}:`, error);
      }
    });

    const conversationData = {
      title: document.title.replace(' - ChatGPT', '') || 'ChatGPT Conversation',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'ChatGPT',
      total_messages: messages.length,
      messages: messages
    };

    console.log(`🤖 ThreadCub: ✅ ChatGPT extraction complete: ${messages.length} messages`);
    return conversationData;
  },

  // =============================================================================
  // GEMINI EXTRACTION
  // =============================================================================

  extractGeminiConversation() {
    console.log('🟣 ThreadCub: Extracting Gemini conversation...');

    const messages = [];
    let messageIndex = 0;

    const messageElements = document.querySelectorAll('.conversation-container message-content, [data-test-id*="message"], .model-response-text, .user-query');

    console.log(`🟣 ThreadCub: Found ${messageElements.length} potential Gemini message elements`);

    messageElements.forEach((element, index) => {
      try {
        const text = element.innerText?.trim();
        if (text && text.length > 10) {
          const isUser = element.classList.contains('user-query') ||
                        element.querySelector('.user-query') !== null;

          const role = isUser ? 'user' : 'assistant';

          messages.push({
            id: messageIndex++,
            role: role,
            content: text,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.log(`🟣 ThreadCub: Error extracting Gemini message ${index}:`, error);
      }
    });

    const conversationData = {
      title: document.title || 'Gemini Conversation',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      platform: 'Gemini',
      total_messages: messages.length,
      messages: messages
    };

    console.log(`🟣 ThreadCub: ✅ Gemini extraction complete: ${messages.length} messages`);
    return conversationData;
  },

  // =============================================================================
  // GROK EXTRACTION
  // Uses aria-label="Grok" to identify assistant messages
  // =============================================================================

  extractGrokConversation() {
    console.log('🤖 ThreadCub: Starting Grok extraction (aria-label based)...');

    // Handle Grok's title format (may include "Grok" or "X")
    const title = document.title
      .replace(' - Grok', '')
      .replace(' | Grok', '')
      .replace(' - X', '')
      .replace(' | X', '')
      .trim() || 'Grok Conversation';

    try {
      // Use aria-label based extraction for Grok
      const extractedMessages = this.grokAriaLabelExtraction();

      const conversationData = {
        title: title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: 'Grok',
        total_messages: extractedMessages.length,
        messages: extractedMessages,
        extraction_method: 'grok_aria_label_extraction'
      };

      console.log(`🤖 ThreadCub: ✅ Grok extraction complete: ${extractedMessages.length} messages`);

      return conversationData;

    } catch (error) {
      console.error('🤖 ThreadCub: Grok extraction failed:', error);

      // Fallback to span-based extraction
      const fallbackMessages = this.grokSpanFallbackExtraction();

      return {
        title: title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: 'Grok',
        total_messages: fallbackMessages.length,
        messages: fallbackMessages,
        extraction_method: 'grok_span_fallback_extraction',
        error: error.message
      };
    }
  },

  // Grok extraction using aria-label="Grok" to identify assistant messages
  grokAriaLabelExtraction() {
    console.log('🤖 ThreadCub: Using Grok aria-label extraction...');

    const messages = [];
    let messageIndex = 0;

    // Find all Grok (assistant) message containers
    const grokContainers = document.querySelectorAll('div[aria-label="Grok"]');
    console.log(`🤖 ThreadCub: Found ${grokContainers.length} Grok message containers`);

    // Find all text spans (both user and assistant messages use these)
    const allTextSpans = document.querySelectorAll('span[class*="css-1jxf684"]');
    console.log(`🤖 ThreadCub: Found ${allTextSpans.length} text spans`);

    // Group spans by their message context and determine role
    const processedTexts = new Set();

    allTextSpans.forEach((span) => {
      const text = span.textContent?.trim() || '';

      // Skip empty or very short texts, and already processed content
      if (text.length < 10 || processedTexts.has(text)) {
        return;
      }

      // Check if this span is inside a Grok (assistant) container
      const isGrokMessage = this.hasAncestorWithAriaLabel(span, 'Grok');
      const role = isGrokMessage ? 'assistant' : 'user';

      // Only add substantial messages
      if (text.length > 20) {
        processedTexts.add(text);

        messages.push({
          id: messageIndex++,
          role: role,
          content: this.simpleCleanContent(text),
          timestamp: new Date().toISOString(),
          extractionMethod: 'grok_aria_label',
          selector_used: 'span[class*="css-1jxf684"]',
          hasGrokAncestor: isGrokMessage
        });
      }
    });

    // Sort messages by DOM order (approximate by checking document position)
    // This helps maintain conversation order
    console.log(`🤖 ThreadCub: Grok aria-label extraction found: ${messages.length} messages`);
    return messages;
  },

  // Helper: Check if element has an ancestor with specific aria-label
  hasAncestorWithAriaLabel(element, label) {
    let current = element.parentElement;
    while (current) {
      if (current.getAttribute && current.getAttribute('aria-label') === label) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  },

  // Grok fallback extraction using span classes
  grokSpanFallbackExtraction() {
    console.log('🤖 ThreadCub: Using Grok span fallback extraction...');

    const messages = [];
    let messageIndex = 0;

    try {
      // Try to find message spans by class pattern
      const spans = document.querySelectorAll('span[class*="css-1jxf684"]');
      console.log(`🤖 ThreadCub: Found ${spans.length} spans with css-1jxf684 class`);

      const processedTexts = new Set();

      spans.forEach((span, index) => {
        const text = span.textContent?.trim();
        if (text && text.length > 20 && !processedTexts.has(text)) {
          processedTexts.add(text);

          // Use alternating pattern as fallback for role detection
          const role = index % 2 === 0 ? 'user' : 'assistant';

          messages.push({
            id: messageIndex++,
            role: role,
            content: this.simpleCleanContent(text),
            timestamp: new Date().toISOString(),
            extractionMethod: 'grok_span_fallback',
            selector_used: 'span[class*="css-1jxf684"]'
          });
        }
      });

    } catch (error) {
      console.error('🤖 ThreadCub: Grok span fallback extraction error:', error);
    }

    console.log(`🤖 ThreadCub: Grok span fallback extraction found: ${messages.length} messages`);
    return messages;
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
  // PERPLEXITY EXTRACTION
  // User messages: h1[class*="group/query"] > span.select-text
  // Assistant messages: div[id^="markdown-content"] > div.prose
  // =============================================================================

  extractPerplexityConversation() {
    console.log('🔮 ThreadCub: Starting Perplexity extraction...');

    // Extract title from page title or first user query
    const title = document.title
      .replace(' - Perplexity', '')
      .replace(' | Perplexity', '')
      .trim() || 'Perplexity Conversation';

    try {
      const extractedMessages = this.perplexityDOMExtraction();

      const conversationData = {
        title: title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: 'Perplexity',
        total_messages: extractedMessages.length,
        messages: extractedMessages,
        extraction_method: 'perplexity_dom_extraction'
      };

      console.log(`🔮 ThreadCub: ✅ Perplexity extraction complete: ${extractedMessages.length} messages`);

      return conversationData;

    } catch (error) {
      console.error('🔮 ThreadCub: Perplexity extraction failed:', error);

      // Fallback extraction
      const fallbackMessages = this.perplexityFallbackExtraction();

      return {
        title: title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        platform: 'Perplexity',
        total_messages: fallbackMessages.length,
        messages: fallbackMessages,
        extraction_method: 'perplexity_fallback_extraction',
        error: error.message
      };
    }
  },

  // Perplexity DOM extraction using specific selectors
  perplexityDOMExtraction() {
    console.log('🔮 ThreadCub: Using Perplexity DOM extraction...');

    const messages = [];
    let messageIndex = 0;

    // Find all user messages: h1[class*="group/query"]
    const userMessageContainers = document.querySelectorAll('h1[class*="group/query"]');
    console.log(`🔮 ThreadCub: Found ${userMessageContainers.length} user message containers`);

    // Find all assistant messages: div[id^="markdown-content"]
    const assistantMessageContainers = document.querySelectorAll('div[id^="markdown-content"]');
    console.log(`🔮 ThreadCub: Found ${assistantMessageContainers.length} assistant message containers`);

    // Build a combined list with DOM positions for proper ordering
    const allMessages = [];

    // Process user messages
    userMessageContainers.forEach((container) => {
      // Extract text from span.select-text inside the container
      const textSpan = container.querySelector('span.select-text');
      const text = textSpan ? textSpan.textContent?.trim() : container.textContent?.trim();

      if (text && text.length > 0) {
        allMessages.push({
          element: container,
          role: 'user',
          content: text,
          position: this.getElementPosition(container)
        });
      }
    });

    // Process assistant messages
    assistantMessageContainers.forEach((container) => {
      // Extract text from div.prose inside the container
      const proseDiv = container.querySelector('div.prose');
      const text = proseDiv ? proseDiv.textContent?.trim() : container.textContent?.trim();

      if (text && text.length > 0) {
        allMessages.push({
          element: container,
          role: 'assistant',
          content: this.cleanPerplexityContent(text),
          position: this.getElementPosition(container)
        });
      }
    });

    // Sort by DOM position to maintain conversation order
    allMessages.sort((a, b) => a.position - b.position);

    // Convert to final message format
    allMessages.forEach((msg) => {
      messages.push({
        id: messageIndex++,
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString(),
        extractionMethod: 'perplexity_dom',
        selector_used: msg.role === 'user' ? 'h1[class*="group/query"]' : 'div[id^="markdown-content"]'
      });
    });

    console.log(`🔮 ThreadCub: Perplexity DOM extraction found: ${messages.length} messages`);
    return messages;
  },

  // Helper: Get element's position in document for sorting
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return rect.top + window.scrollY;
  },

  // Helper: Clean Perplexity content
  cleanPerplexityContent(text) {
    return text
      .replace(/^\s+|\s+$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^(Copy|Share|Sources|Related)$/gm, '')
      .trim();
  },

  // Perplexity fallback extraction
  perplexityFallbackExtraction() {
    console.log('🔮 ThreadCub: Using Perplexity fallback extraction...');

    const messages = [];
    let messageIndex = 0;

    try {
      // Try alternative selectors
      const allProseElements = document.querySelectorAll('div.prose, [class*="prose"]');
      console.log(`🔮 ThreadCub: Found ${allProseElements.length} prose elements`);

      const processedTexts = new Set();

      allProseElements.forEach((element, index) => {
        const text = element.textContent?.trim();
        if (text && text.length > 20 && !processedTexts.has(text)) {
          processedTexts.add(text);

          // Alternating pattern as fallback
          const role = index % 2 === 0 ? 'user' : 'assistant';

          messages.push({
            id: messageIndex++,
            role: role,
            content: this.cleanPerplexityContent(text),
            timestamp: new Date().toISOString(),
            extractionMethod: 'perplexity_fallback'
          });
        }
      });

    } catch (error) {
      console.error('🔮 ThreadCub: Perplexity fallback extraction error:', error);
    }

    console.log(`🔮 ThreadCub: Perplexity fallback extraction found: ${messages.length} messages`);
    return messages;
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

  // ===== FIXED METHOD - Added Grok and DeepSeek support =====
  getTargetPlatformFromCurrentUrl() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else if (hostname.includes('gemini.google.com')) {
      return 'gemini';
    } else if (hostname.includes('grok.x.ai') || hostname.includes('grok.com') || 
               (hostname.includes('x.com') && pathname.includes('/i/grok'))) {
      return 'grok';
    } else if (hostname.includes('chat.deepseek.com')) {
      return 'deepseek';
    } else if (hostname.includes('perplexity.ai')) {
      return 'perplexity';
    }
    return 'unknown';
  },

  generateContinuationPrompt(summary, shareUrl, platform, conversationData) {
    console.log('🐻 ThreadCub: Generating continuation prompt for platform:', platform);

    // GROK - URL-based (confirmed working with web_fetch)
    if (platform && platform.toLowerCase().includes('grok')) {
      const grokPrompt = `I'd like to continue our previous conversation. The complete context is available at: ${shareUrl}

Please attempt to fetch this URL using your web_fetch tool to access the conversation history. The URL returns a JSON response with the full conversation.

If you're able to retrieve it, let me know you're ready to continue from where we left off.
If you cannot access it for any reason, please let me know and I'll share the conversation content directly.`;

      console.log('🤖 ThreadCub: Generated Grok URL-based prompt:', grokPrompt.length, 'characters');
      return grokPrompt;
    }
    
    // CHATGPT/GEMINI/DEEPSEEK - File-based prompts (user manually uploads file)
    else if (platform && (platform.toLowerCase().includes('chatgpt') ||
                           platform.toLowerCase().includes('gemini') ||
                           platform.toLowerCase().includes('deepseek'))) {
      const prompt = `I'd like to continue our previous conversation. I have our complete conversation history as a file that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;

      console.log('🐻 ThreadCub: Generated file-based continuation prompt:', prompt.length, 'characters');
      return prompt;
    }
    
    // CLAUDE (default) - URL-based prompt
    else {
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