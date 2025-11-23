// Metadata scraper for AI chat platforms
// Extracts chat IDs, titles, platform info, and message roles from various AI chat interfaces

/**
 * Metadata scraper utility
 */
export const metadataScraper = {
  /**
   * Get current platform from URL
   * @returns {string} Platform identifier (claude, chatgpt, gemini, copilot, other)
   */
  getPlatform() {
    const url = window.location.href;
    if (url.includes('claude.ai')) return 'claude';
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
    if (url.includes('gemini.google.com')) return 'gemini';
    if (url.includes('copilot.microsoft.com')) return 'copilot';
    return 'other';
  },

  /**
   * Extract chat ID from URL
   * @returns {string|null} Chat ID or null if not found
   */
  getChatId() {
    const url = window.location.href;
    const platform = this.getPlatform();

    if (platform === 'claude') {
      // https://claude.ai/chat/[UUID]
      const match = url.match(/claude\.ai\/chat\/([a-f0-9-]+)/i);
      return match ? match[1] : null;
    }

    if (platform === 'chatgpt') {
      // https://chatgpt.com/c/[ID] or https://chat.openai.com/c/[ID]
      const match = url.match(/\/c\/([a-zA-Z0-9-]+)/);
      return match ? match[1] : null;
    }

    if (platform === 'gemini') {
      // https://gemini.google.com/app/[ID]
      const match = url.match(/gemini\.google\.com\/app\/([a-zA-Z0-9-]+)/);
      return match ? match[1] : null;
    }

    if (platform === 'copilot') {
      // Various Copilot URL patterns
      const match = url.match(/copilot\.microsoft\.com\/[^/]*\/([a-zA-Z0-9-]+)/);
      return match ? match[1] : null;
    }

    return null;
  },

  /**
   * Get chat title from page
   * @returns {string} Chat title
   */
  getChatTitle() {
    const platform = this.getPlatform();

    if (platform === 'claude') {
      // Try multiple selectors for Claude
      const selectors = [
        '[data-testid="chat-title"]',
        '.chat-title',
        '[class*="ChatTitle"]',
        'h1[class*="title"]'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      }

      // Fallback to document title
      const docTitle = document.title;
      if (docTitle && !docTitle.includes('Claude') && docTitle.trim() !== '') {
        return docTitle.trim();
      }

      return 'Untitled Chat';
    }

    if (platform === 'chatgpt') {
      // Try active nav item or conversation title
      const selectors = [
        'nav [class*="active"]',
        '[data-testid="conversation-title"]',
        '.text-token-text-primary',
        'h1'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          const text = element.textContent.trim();
          // Filter out obvious non-title text
          if (text.length > 0 && text.length < 200 && !text.includes('\n')) {
            return text;
          }
        }
      }

      // Fallback to document title
      const docTitle = document.title;
      if (docTitle && !docTitle.includes('ChatGPT') && docTitle.trim() !== '') {
        return docTitle.trim();
      }

      return 'Untitled Chat';
    }

    if (platform === 'gemini') {
      // Try Gemini selectors
      const titleElement = document.querySelector('[data-test-id="chat-title"]') ||
                          document.querySelector('h1');
      if (titleElement && titleElement.textContent.trim()) {
        return titleElement.textContent.trim();
      }
      return 'Untitled Chat';
    }

    if (platform === 'copilot') {
      // Try Copilot selectors
      const titleElement = document.querySelector('[data-testid="conversation-title"]') ||
                          document.querySelector('h1');
      if (titleElement && titleElement.textContent.trim()) {
        return titleElement.textContent.trim();
      }
      return 'Untitled Chat';
    }

    // Generic fallback
    return document.title || 'Untitled';
  },

  /**
   * Detect if highlighted text is from user or assistant
   * @param {Selection} selection - Browser selection object
   * @returns {string|null} Message role (user, assistant) or null
   */
  getMessageRole(selection) {
    if (!selection || selection.isCollapsed) return null;

    const platform = this.getPlatform();
    const anchorNode = selection.anchorNode;

    if (!anchorNode) return null;

    // Walk up the DOM to find message container
    let element = anchorNode.nodeType === Node.TEXT_NODE
      ? anchorNode.parentElement
      : anchorNode;

    let maxDepth = 20; // Prevent infinite loops
    let depth = 0;

    while (element && element !== document.body && depth < maxDepth) {
      depth++;

      if (platform === 'claude') {
        // Claude-specific selectors
        // Check for streaming indicator or assistant class
        if (element.hasAttribute && element.hasAttribute('data-is-streaming')) {
          return 'assistant';
        }

        // Check for class names
        const className = element.className || '';
        if (typeof className === 'string') {
          if (className.includes('assistant') || className.includes('Assistant')) {
            return 'assistant';
          }
          if (className.includes('human') || className.includes('Human') ||
              className.includes('user') || className.includes('User')) {
            return 'user';
          }
        }

        // Check for role attributes
        if (element.hasAttribute && element.hasAttribute('data-role')) {
          const role = element.getAttribute('data-role');
          if (role === 'assistant' || role === 'ai') return 'assistant';
          if (role === 'user' || role === 'human') return 'user';
        }
      }

      if (platform === 'chatgpt') {
        // ChatGPT-specific selectors
        // Check for data-message-author-role attribute
        if (element.hasAttribute && element.hasAttribute('data-message-author-role')) {
          return element.getAttribute('data-message-author-role');
        }

        // Check parent for message wrapper
        const wrapper = element.closest('[data-message-author-role]');
        if (wrapper) {
          return wrapper.getAttribute('data-message-author-role');
        }

        // Check for class indicators
        const className = element.className || '';
        if (typeof className === 'string') {
          if (className.includes('agent') || className.includes('assistant')) {
            return 'assistant';
          }
          if (className.includes('user')) {
            return 'user';
          }
        }
      }

      if (platform === 'gemini') {
        // Gemini-specific selectors
        const className = element.className || '';
        if (typeof className === 'string') {
          if (className.includes('model-response') || className.includes('assistant')) {
            return 'assistant';
          }
          if (className.includes('user-query') || className.includes('user')) {
            return 'user';
          }
        }
      }

      if (platform === 'copilot') {
        // Copilot-specific selectors
        if (element.hasAttribute && element.hasAttribute('data-author')) {
          const author = element.getAttribute('data-author');
          if (author === 'bot' || author === 'assistant') return 'assistant';
          if (author === 'user') return 'user';
        }
      }

      element = element.parentElement;
    }

    return null;
  },

  /**
   * Get surrounding context around selected text
   * @param {Selection} selection - Browser selection object
   * @param {number} charsBefore - Characters to include before selection
   * @param {number} charsAfter - Characters to include after selection
   * @returns {string|null} Surrounding context or null
   */
  getSurroundingContext(selection, charsBefore = 100, charsAfter = 100) {
    if (!selection || selection.isCollapsed) return null;

    try {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;

      // Get the full text of the container
      let fullText = '';

      // If container is a text node, use parent element
      const textContainer = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

      // Get text content
      fullText = textContainer.textContent || '';

      const selectedText = selection.toString();
      const startIndex = fullText.indexOf(selectedText);

      if (startIndex === -1) return null;

      const contextStart = Math.max(0, startIndex - charsBefore);
      const contextEnd = Math.min(fullText.length, startIndex + selectedText.length + charsAfter);

      let context = fullText.slice(contextStart, contextEnd);

      // Add ellipsis if truncated
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < fullText.length) context = context + '...';

      return context;
    } catch (error) {
      console.error('Error getting surrounding context:', error);
      return null;
    }
  },

  /**
   * Gather all metadata for a highlight
   * @param {Selection} selection - Browser selection object
   * @returns {Object} Metadata object
   */
  gatherHighlightMetadata(selection) {
    const highlightedText = selection.toString().trim();

    return {
      source_url: window.location.href,
      source_chat_id: this.getChatId(),
      source_title: this.getChatTitle(),
      source_platform: this.getPlatform(),
      highlighted_text: highlightedText,
      message_role: this.getMessageRole(selection),
      surrounding_context: this.getSurroundingContext(selection)
    };
  }
};
