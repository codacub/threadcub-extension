console.log('Loading: platform-adapters.js');

/**
 * Platform Adapters Module
 *
 * Provides platform-specific DOM selectors and utilities for anchor creation
 * and jump-to functionality. Each adapter implements a common interface.
 *
 * Interface:
 * - matchesUrl(url): boolean - Check if this adapter handles the given URL
 * - getMessageElements(): NodeList - Get all message container elements
 * - getMessageText(element): string - Extract text content from a message element
 * - getStableMessageSelector(element): string - Generate a stable CSS selector for an element
 * - getMessageIndex(element): number - Get the index of a message in the conversation
 */

// ============================================================================
// DOM Selector Constants - Centralized for easy updates
// ============================================================================

const CHATGPT_SELECTORS = {
  // Message containers
  messageContainers: [
    '[data-message-author-role]',                    // Primary message container
    'div[data-testid^="conversation-turn-"]',        // Turn-based messages
    '.agent-turn',                                   // Agent responses
    '.user-turn'                                     // User messages
  ],
  // Conversation wrapper
  conversationWrapper: [
    'main [class*="react-scroll-to-bottom"]',
    'main div[class*="overflow-y-auto"]',
    '[data-testid="conversation-panel"]'
  ],
  // Message content selectors
  messageContent: [
    '.markdown',
    '[data-message-content]',
    '.prose'
  ]
};

const CLAUDE_SELECTORS = {
  messageContainers: [
    '[data-testid*="message"]',
    'div[class*="Message"]',
    '.font-claude-message',
    '[class*="prose"]'
  ],
  conversationWrapper: [
    'main',
    '[class*="conversation"]',
    '[data-testid="conversation"]'
  ],
  messageContent: [
    '.prose',
    '[class*="markdown"]',
    'p'
  ]
};

const PERPLEXITY_SELECTORS = {
  messageContainers: [
    '[class*="prose"]',
    '[class*="answer"]',
    '[class*="response"]'
  ],
  conversationWrapper: [
    'main',
    '[class*="thread"]'
  ],
  messageContent: [
    '.prose',
    'p'
  ]
};

const GEMINI_SELECTORS = {
  messageContainers: [
    'message-content',
    '[class*="model-response"]',
    '[class*="user-query"]'
  ],
  conversationWrapper: [
    'main',
    '[class*="conversation"]'
  ],
  messageContent: [
    'p',
    '.markdown-content'
  ]
};

const GROK_SELECTORS = {
  messageContainers: [
    '[class*="message"]',
    '[data-testid*="message"]'
  ],
  conversationWrapper: [
    'main',
    '[class*="chat"]'
  ],
  messageContent: [
    'p',
    '.prose'
  ]
};

// ============================================================================
// Base Adapter Class
// ============================================================================

class BasePlatformAdapter {
  constructor(name, selectors) {
    this.name = name;
    this.selectors = selectors;
  }

  /**
   * Check if this adapter handles the given URL
   * @param {string} url - The URL to check
   * @returns {boolean}
   */
  matchesUrl(url) {
    throw new Error('matchesUrl must be implemented by subclass');
  }

  /**
   * Get all message container elements in the conversation
   * @returns {Element[]}
   */
  getMessageElements() {
    const elements = [];
    for (const selector of this.selectors.messageContainers) {
      try {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          elements.push(...found);
          break; // Use first working selector
        }
      } catch (e) {
        console.log(`Selector ${selector} failed:`, e);
      }
    }
    return elements;
  }

  /**
   * Get the conversation wrapper element
   * @returns {Element|null}
   */
  getConversationWrapper() {
    for (const selector of this.selectors.conversationWrapper) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (e) {
        continue;
      }
    }
    return document.body;
  }

  /**
   * Extract text content from a message element
   * @param {Element} element - The message container element
   * @returns {string}
   */
  getMessageText(element) {
    if (!element) return '';

    // Try to get content from content-specific selectors first
    for (const selector of this.selectors.messageContent) {
      try {
        const contentEl = element.querySelector(selector);
        if (contentEl) {
          return this.normalizeWhitespace(contentEl.textContent || '');
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback to full element text
    return this.normalizeWhitespace(element.textContent || '');
  }

  /**
   * Generate a stable CSS selector for an element
   * @param {Element} element - The element to generate a selector for
   * @returns {string}
   */
  getStableMessageSelector(element) {
    if (!element) return '';

    // Try data attributes first (most stable)
    if (element.dataset.messageAuthorRole) {
      const role = element.dataset.messageAuthorRole;
      const index = this.getMessageIndex(element);
      return `[data-message-author-role="${role}"]:nth-of-type(${index + 1})`;
    }

    if (element.dataset.testid) {
      return `[data-testid="${element.dataset.testid}"]`;
    }

    // Try ID
    if (element.id) {
      return `#${element.id}`;
    }

    // Generate path-based selector
    return this.generatePathSelector(element);
  }

  /**
   * Get the index of a message in the conversation
   * @param {Element} element - The message element
   * @returns {number}
   */
  getMessageIndex(element) {
    const messages = this.getMessageElements();
    return Array.from(messages).indexOf(element);
  }

  /**
   * Find the message container for a given text node or element
   * @param {Node} node - The node to find the container for
   * @returns {Element|null}
   */
  findMessageContainer(node) {
    let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    while (current && current !== document.body) {
      // Check if current matches any message selector
      for (const selector of this.selectors.messageContainers) {
        try {
          if (current.matches && current.matches(selector)) {
            return current;
          }
        } catch (e) {
          continue;
        }
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Generate a path-based CSS selector
   * @param {Element} element
   * @returns {string}
   */
  generatePathSelector(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c =>
          c && !c.includes('hover') && !c.includes('active') && c.length < 30
        );
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }

      // Add nth-child for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(el =>
          el.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Normalize whitespace in text
   * @param {string} text
   * @returns {string}
   */
  normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  }
}

// ============================================================================
// ChatGPT Adapter
// ============================================================================

class ChatGPTAdapter extends BasePlatformAdapter {
  constructor() {
    super('ChatGPT', CHATGPT_SELECTORS);
  }

  matchesUrl(url) {
    return url.includes('chat.openai.com') || url.includes('chatgpt.com');
  }

  getMessageElements() {
    // ChatGPT has a specific structure with data-message-author-role
    let elements = document.querySelectorAll('[data-message-author-role]');
    if (elements.length > 0) return Array.from(elements);

    // Fallback to turn-based structure
    elements = document.querySelectorAll('div[data-testid^="conversation-turn-"]');
    if (elements.length > 0) return Array.from(elements);

    // Generic fallback
    return super.getMessageElements();
  }

  getStableMessageSelector(element) {
    // ChatGPT specific: use data-message-id if available
    if (element.dataset.messageId) {
      return `[data-message-id="${element.dataset.messageId}"]`;
    }

    // Use conversation turn testid
    if (element.dataset.testid && element.dataset.testid.startsWith('conversation-turn-')) {
      return `[data-testid="${element.dataset.testid}"]`;
    }

    return super.getStableMessageSelector(element);
  }
}

// ============================================================================
// Claude Adapter
// ============================================================================

class ClaudeAdapter extends BasePlatformAdapter {
  constructor() {
    super('Claude', CLAUDE_SELECTORS);
  }

  matchesUrl(url) {
    return url.includes('claude.ai');
  }
}

// ============================================================================
// Perplexity Adapter
// ============================================================================

class PerplexityAdapter extends BasePlatformAdapter {
  constructor() {
    super('Perplexity', PERPLEXITY_SELECTORS);
  }

  matchesUrl(url) {
    return url.includes('perplexity.ai');
  }
}

// ============================================================================
// Gemini Adapter
// ============================================================================

class GeminiAdapter extends BasePlatformAdapter {
  constructor() {
    super('Gemini', GEMINI_SELECTORS);
  }

  matchesUrl(url) {
    return url.includes('gemini.google.com');
  }
}

// ============================================================================
// Grok Adapter
// ============================================================================

class GrokAdapter extends BasePlatformAdapter {
  constructor() {
    super('Grok', GROK_SELECTORS);
  }

  matchesUrl(url) {
    return url.includes('grok.x.ai') || url.includes('grok.com') ||
           (url.includes('x.com') && url.includes('/i/grok'));
  }
}

// ============================================================================
// Platform Adapter Manager
// ============================================================================

const PlatformAdapters = {
  adapters: [
    new ChatGPTAdapter(),
    new ClaudeAdapter(),
    new PerplexityAdapter(),
    new GeminiAdapter(),
    new GrokAdapter()
  ],

  /**
   * Get the appropriate adapter for the current URL
   * @param {string} url - Optional URL, defaults to current location
   * @returns {BasePlatformAdapter|null}
   */
  getAdapter(url = window.location.href) {
    for (const adapter of this.adapters) {
      if (adapter.matchesUrl(url)) {
        return adapter;
      }
    }
    return null;
  },

  /**
   * Get adapter by platform name
   * @param {string} platform - Platform name (chatgpt, claude, etc.)
   * @returns {BasePlatformAdapter|null}
   */
  getAdapterByName(platform) {
    const name = platform.toLowerCase();
    return this.adapters.find(a => a.name.toLowerCase() === name) || null;
  },

  /**
   * Check if current URL is a supported platform
   * @returns {boolean}
   */
  isSupported() {
    return this.getAdapter() !== null;
  }
};

// Export to global scope
window.PlatformAdapters = PlatformAdapters;
window.CHATGPT_SELECTORS = CHATGPT_SELECTORS;
window.CLAUDE_SELECTORS = CLAUDE_SELECTORS;

console.log('Platform adapters loaded. Current adapter:', PlatformAdapters.getAdapter()?.name || 'none');
