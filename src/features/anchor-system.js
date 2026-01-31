console.log('Loading: anchor-system.js');

/**
 * ThreadCub Anchor System
 *
 * Implements robust TextQuote-style anchoring for jump-to functionality.
 * Anchors are saved items that include:
 * - exact: The selected text
 * - prefix: ~60 chars before selection within message container
 * - suffix: ~60 chars after selection
 * - messageSelector: CSS selector for the message container
 * - messageIndex: Fallback index of the message
 */

const ANCHOR_CONFIG = {
  PREFIX_LENGTH: 60,
  SUFFIX_LENGTH: 60,
  MIN_EXACT_LENGTH: 3,
  MATCH_THRESHOLD: 0.7, // 70% similarity required for fuzzy match
  FLASH_DURATION: 2000  // Duration of flash highlight in ms
};

class AnchorSystem {
  constructor() {
    this.adapter = null;
  }

  /**
   * Initialize the anchor system
   */
  init() {
    this.adapter = window.PlatformAdapters?.getAdapter() || null;
    console.log('Anchor system initialized with adapter:', this.adapter?.name || 'none');
  }

  /**
   * Create an anchor from the current text selection
   * @param {Selection} selection - The browser selection object
   * @returns {Object|null} - The anchor object or null if creation failed
   */
  createAnchorFromSelection(selection) {
    if (!selection || selection.isCollapsed) {
      console.log('No valid selection for anchor creation');
      return null;
    }

    const range = selection.getRangeAt(0);
    const exact = range.toString().trim();

    if (exact.length < ANCHOR_CONFIG.MIN_EXACT_LENGTH) {
      console.log('Selection too short for anchor');
      return null;
    }

    // Ensure we have an adapter
    if (!this.adapter) {
      this.adapter = window.PlatformAdapters?.getAdapter() || null;
    }

    // Find the message container
    const messageContainer = this.adapter
      ? this.adapter.findMessageContainer(range.startContainer)
      : this.findGenericContainer(range.startContainer);

    // Capture context
    const { prefix, suffix } = this.captureContext(range, messageContainer);

    // Generate selectors and index
    const messageSelector = this.adapter
      ? this.adapter.getStableMessageSelector(messageContainer)
      : this.generateGenericSelector(messageContainer);

    const messageIndex = this.adapter
      ? this.adapter.getMessageIndex(messageContainer)
      : -1;

    const anchor = {
      exact,
      prefix,
      suffix,
      messageSelector,
      messageIndex,
      url: window.location.href,
      platform: this.adapter?.name || 'unknown'
    };

    console.log('Anchor created:', anchor);
    return anchor;
  }

  /**
   * Capture prefix and suffix context around the selection
   * @param {Range} range - The selection range
   * @param {Element} container - The message container
   * @returns {{prefix: string, suffix: string}}
   */
  captureContext(range, container) {
    let prefix = '';
    let suffix = '';

    try {
      // Get text before the selection within the container
      const beforeRange = document.createRange();
      beforeRange.setStart(container, 0);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const beforeText = beforeRange.toString();
      prefix = this.normalizeWhitespace(beforeText).slice(-ANCHOR_CONFIG.PREFIX_LENGTH);

      // Get text after the selection within the container
      const afterRange = document.createRange();
      afterRange.setStart(range.endContainer, range.endOffset);
      afterRange.setEndAfter(container);
      const afterText = afterRange.toString();
      suffix = this.normalizeWhitespace(afterText).slice(0, ANCHOR_CONFIG.SUFFIX_LENGTH);

    } catch (error) {
      console.log('Error capturing context:', error);

      // Fallback: use the container's text content
      try {
        const containerText = container?.textContent || '';
        const exact = range.toString().trim();
        const exactIndex = containerText.indexOf(exact);

        if (exactIndex !== -1) {
          prefix = this.normalizeWhitespace(containerText.slice(0, exactIndex)).slice(-ANCHOR_CONFIG.PREFIX_LENGTH);
          suffix = this.normalizeWhitespace(containerText.slice(exactIndex + exact.length)).slice(0, ANCHOR_CONFIG.SUFFIX_LENGTH);
        }
      } catch (e) {
        console.log('Fallback context capture failed:', e);
      }
    }

    return { prefix, suffix };
  }

  /**
   * Jump to an anchor location
   * @param {Object} anchor - The anchor object
   * @returns {Promise<{success: boolean, method: string, approximate: boolean}>}
   */
  async jumpToAnchor(anchor) {
    console.log('Jumping to anchor:', anchor);

    // Ensure we have an adapter
    if (!this.adapter) {
      this.adapter = window.PlatformAdapters?.getAdapter() || null;
    }

    // Strategy A: Use messageSelector (fast path)
    let result = await this.jumpViaSelector(anchor);
    if (result.success) return result;

    // Strategy B: Search all message containers
    result = await this.jumpViaMessageSearch(anchor);
    if (result.success) return result;

    // Strategy C: Fallback to messageIndex
    result = await this.jumpViaMessageIndex(anchor);
    if (result.success) return result;

    // Strategy D: Failure
    console.log('All anchor resolution strategies failed');
    return { success: false, method: 'none', approximate: false };
  }

  /**
   * Strategy A: Jump using the stored selector
   */
  async jumpViaSelector(anchor) {
    if (!anchor.messageSelector) {
      return { success: false, method: 'selector', approximate: false };
    }

    try {
      const element = document.querySelector(anchor.messageSelector);
      if (!element) {
        console.log('Selector did not resolve:', anchor.messageSelector);
        return { success: false, method: 'selector', approximate: false };
      }

      // Search for exact text within this element
      const match = this.findBestMatch(element, anchor);
      if (match) {
        this.scrollAndFlash(match.range, match.element);
        return { success: true, method: 'selector', approximate: false };
      }

      // Element exists but text not found exactly - scroll to element anyway
      this.scrollToElement(element);
      this.flashElement(element);
      return { success: true, method: 'selector', approximate: true };

    } catch (error) {
      console.log('Selector strategy failed:', error);
      return { success: false, method: 'selector', approximate: false };
    }
  }

  /**
   * Strategy B: Search all message containers
   */
  async jumpViaMessageSearch(anchor) {
    const messages = this.adapter
      ? this.adapter.getMessageElements()
      : document.querySelectorAll('div, p, article');

    let bestMatch = null;
    let bestScore = 0;

    for (const message of messages) {
      const messageText = this.adapter
        ? this.adapter.getMessageText(message)
        : this.normalizeWhitespace(message.textContent || '');

      // Check if exact text appears in this message
      if (!messageText.includes(anchor.exact)) continue;

      // Score based on prefix/suffix overlap
      const score = this.scoreMatch(message, anchor);
      if (score > bestScore && score >= ANCHOR_CONFIG.MATCH_THRESHOLD) {
        bestScore = score;
        bestMatch = message;
      }
    }

    if (bestMatch) {
      const match = this.findBestMatch(bestMatch, anchor);
      if (match) {
        this.scrollAndFlash(match.range, match.element);
        return { success: true, method: 'message-search', approximate: false };
      }

      // Fallback: scroll to the best matching message
      this.scrollToElement(bestMatch);
      this.flashElement(bestMatch);
      return { success: true, method: 'message-search', approximate: true };
    }

    return { success: false, method: 'message-search', approximate: false };
  }

  /**
   * Strategy C: Jump using message index
   */
  async jumpViaMessageIndex(anchor) {
    if (anchor.messageIndex < 0) {
      return { success: false, method: 'index', approximate: false };
    }

    const messages = this.adapter
      ? this.adapter.getMessageElements()
      : [];

    if (anchor.messageIndex >= messages.length) {
      return { success: false, method: 'index', approximate: false };
    }

    const message = messages[anchor.messageIndex];
    if (message) {
      this.scrollToElement(message);
      this.flashElement(message);
      this.showApproximateHint();
      return { success: true, method: 'index', approximate: true };
    }

    return { success: false, method: 'index', approximate: false };
  }

  /**
   * Find the best matching text range within an element
   */
  findBestMatch(element, anchor) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    // First pass: look for exact match
    let textNode;
    while ((textNode = walker.nextNode())) {
      const nodeText = textNode.textContent;
      const exactIndex = nodeText.indexOf(anchor.exact);

      if (exactIndex !== -1) {
        // Validate with prefix/suffix if available
        const score = this.scoreNodeMatch(textNode, exactIndex, anchor);
        if (score >= ANCHOR_CONFIG.MATCH_THRESHOLD) {
          try {
            const range = document.createRange();
            range.setStart(textNode, exactIndex);
            range.setEnd(textNode, exactIndex + anchor.exact.length);
            return { range, element: textNode.parentElement, score };
          } catch (e) {
            console.log('Error creating range:', e);
          }
        }
      }
    }

    // Second pass: try normalized matching
    const normalizedExact = this.normalizeWhitespace(anchor.exact);
    walker.currentNode = element;

    while ((textNode = walker.nextNode())) {
      const normalizedNode = this.normalizeWhitespace(textNode.textContent);
      const exactIndex = normalizedNode.indexOf(normalizedExact);

      if (exactIndex !== -1) {
        try {
          // Find approximate position in original text
          const originalText = textNode.textContent;
          let charCount = 0;
          let startIndex = 0;

          for (let i = 0; i < originalText.length && charCount < exactIndex; i++) {
            if (!/\s/.test(originalText[i]) || (i > 0 && !/\s/.test(originalText[i-1]))) {
              charCount++;
            }
            startIndex = i + 1;
          }

          const range = document.createRange();
          range.setStart(textNode, Math.min(startIndex, originalText.length));
          range.setEnd(textNode, Math.min(startIndex + anchor.exact.length, originalText.length));
          return { range, element: textNode.parentElement, score: 0.8 };
        } catch (e) {
          console.log('Error creating normalized range:', e);
        }
      }
    }

    return null;
  }

  /**
   * Score a message element based on how well it matches the anchor context
   */
  scoreMatch(message, anchor) {
    const messageText = this.normalizeWhitespace(message.textContent || '');
    const exactIndex = messageText.indexOf(anchor.exact);

    if (exactIndex === -1) return 0;

    let score = 0.5; // Base score for containing exact text

    // Check prefix match
    if (anchor.prefix) {
      const beforeText = messageText.slice(0, exactIndex);
      const prefixMatch = this.calculateOverlap(beforeText, anchor.prefix);
      score += prefixMatch * 0.25;
    }

    // Check suffix match
    if (anchor.suffix) {
      const afterText = messageText.slice(exactIndex + anchor.exact.length);
      const suffixMatch = this.calculateOverlap(afterText, anchor.suffix);
      score += suffixMatch * 0.25;
    }

    return score;
  }

  /**
   * Score a specific text node match based on surrounding context
   */
  scoreNodeMatch(textNode, exactIndex, anchor) {
    const nodeText = textNode.textContent;
    let score = 0.5;

    // Check prefix
    if (anchor.prefix) {
      const beforeText = nodeText.slice(0, exactIndex);
      // Also check parent/previous siblings
      let fullBefore = beforeText;
      try {
        const parent = textNode.parentElement;
        if (parent) {
          const parentText = this.getTextBeforeNode(parent, textNode);
          fullBefore = parentText + beforeText;
        }
      } catch (e) {}
      const prefixMatch = this.calculateOverlap(fullBefore, anchor.prefix);
      score += prefixMatch * 0.25;
    }

    // Check suffix
    if (anchor.suffix) {
      const afterText = nodeText.slice(exactIndex + anchor.exact.length);
      const suffixMatch = this.calculateOverlap(afterText, anchor.suffix);
      score += suffixMatch * 0.25;
    }

    return score;
  }

  /**
   * Calculate overlap between two strings
   */
  calculateOverlap(text, context) {
    if (!text || !context) return 0;

    const normalizedText = this.normalizeWhitespace(text);
    const normalizedContext = this.normalizeWhitespace(context);

    // Check if context is contained in text
    if (normalizedText.includes(normalizedContext)) return 1;
    if (normalizedContext.includes(normalizedText)) return 0.8;

    // Calculate character overlap
    let matches = 0;
    const shorter = normalizedContext.length < normalizedText.length ? normalizedContext : normalizedText;
    const longer = shorter === normalizedContext ? normalizedText : normalizedContext;

    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter.slice(i, i + 3))) {
        matches += 3;
        i += 2;
      }
    }

    return Math.min(1, matches / shorter.length);
  }

  /**
   * Scroll to an element and flash highlight a range
   */
  scrollAndFlash(range, element) {
    // Scroll the element into view
    this.scrollToElement(element || range.startContainer.parentElement);

    // Flash highlight the range
    this.flashRange(range);
  }

  /**
   * Scroll an element into view
   */
  scrollToElement(element) {
    if (!element) return;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  /**
   * Flash highlight a range
   */
  flashRange(range) {
    if (!range) return;

    try {
      // Create a highlight span
      const highlight = document.createElement('span');
      highlight.className = 'threadcub-anchor-flash';

      // Surround the range with the highlight
      range.surroundContents(highlight);

      // Remove after flash duration
      setTimeout(() => {
        const parent = highlight.parentNode;
        if (parent) {
          while (highlight.firstChild) {
            parent.insertBefore(highlight.firstChild, highlight);
          }
          parent.removeChild(highlight);
        }
      }, ANCHOR_CONFIG.FLASH_DURATION);
    } catch (error) {
      // Range may span multiple elements - fallback to element flash
      console.log('Could not flash range, falling back to element flash');
      const element = range.startContainer.parentElement;
      if (element) {
        this.flashElement(element);
      }
    }
  }

  /**
   * Flash highlight an element
   */
  flashElement(element) {
    if (!element) return;

    element.classList.add('threadcub-anchor-flash');
    setTimeout(() => {
      element.classList.remove('threadcub-anchor-flash');
    }, ANCHOR_CONFIG.FLASH_DURATION);
  }

  /**
   * Show a hint that the match is approximate
   */
  showApproximateHint() {
    const hint = document.createElement('div');
    hint.className = 'threadcub-approximate-hint';
    hint.textContent = 'Approximate match - original text may have changed';

    document.body.appendChild(hint);

    setTimeout(() => {
      hint.classList.add('threadcub-hint-fade');
      setTimeout(() => hint.remove(), 500);
    }, 3000);
  }

  /**
   * Normalize whitespace in text
   */
  normalizeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Get text before a specific node within parent
   */
  getTextBeforeNode(parent, targetNode) {
    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
    let text = '';
    let node;

    while ((node = walker.nextNode())) {
      if (node === targetNode) break;
      text += node.textContent;
    }

    return text;
  }

  /**
   * Find generic container for non-supported platforms
   */
  findGenericContainer(node) {
    let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    let depth = 0;

    while (current && current !== document.body && depth < 10) {
      // Look for common message container patterns
      const classes = current.className || '';
      const id = current.id || '';

      if (classes.includes('message') || classes.includes('content') ||
          id.includes('message') || current.tagName === 'ARTICLE') {
        return current;
      }

      current = current.parentElement;
      depth++;
    }

    return node.parentElement;
  }

  /**
   * Generate a generic CSS selector
   */
  generateGenericSelector(element) {
    if (!element) return '';

    if (element.id) {
      return `#${element.id}`;
    }

    const path = [];
    let current = element;

    while (current && current !== document.body && path.length < 4) {
      let selector = current.tagName.toLowerCase();

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ')
          .filter(c => c && c.length < 30 && !c.includes(':'))
          .slice(0, 2);
        if (classes.length) {
          selector += '.' + classes.join('.');
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }
}

// Create global instance
const anchorSystem = new AnchorSystem();

// Export to global scope
window.AnchorSystem = AnchorSystem;
window.anchorSystem = anchorSystem;
window.ANCHOR_CONFIG = ANCHOR_CONFIG;

console.log('Anchor system loaded');
