// =============================================================================
// ThreadCub Conversation Length Detector
// Detects long conversations and prompts users to save & continue with ThreadCub
// =============================================================================

const ConversationLengthDetector = {

  // =========================================================================
  // CONFIGURATION
  // =========================================================================

  CONFIG: {
    EXCHANGE_THRESHOLD: 2,           // 25 user-assistant pairs = 50 total messages
    OBSERVER_DEBOUNCE_MS: 1000,       // Debounce DOM mutations before counting
    STORAGE_PREFIX: 'threadcub-clp-', // conversation-length-prompt dismissal keys
    DISMISSAL_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours before dismissal expires
    URL_POLL_MS: 1000,                // Poll for SPA navigation every 1s
    OBSERVER_RETRY_MS: 2000,          // Retry observer setup if container not found
  },

  // Lightweight message-counting selectors per platform.
  // These are intentionally simpler than the full extraction selectors —
  // we only need a count, not content.
  MESSAGE_SELECTORS: {
    claude: {
      turns: '[data-testid^="conversation-turn"]',
      fallback: 'div.font-claude-message',
      container: 'main',
    },
    chatgpt: {
      turns: '[data-testid^="conversation-turn-"]',
      fallback: '[data-message-author-role]',
      container: 'main',
    },
    gemini: {
      turns: 'message-content',
      fallback: '.model-response-text, .user-query',
      container: 'main',
    },
    copilot: {
      turns: '.ac-container .ac-textBlock',
      fallback: '[data-author]',
      container: 'main',
    },
    grok: {
      userTurns: 'div[data-testid*="message"]',
      assistantTurns: 'div[aria-label="Grok"]',
      fallback: 'span[class*="css-1jxf684"]',
      container: 'main',
    },
    perplexity: {
      userTurns: 'h1[class*="group/query"]',
      assistantTurns: 'div[id^="markdown-content"]',
      container: 'main',
    },
    deepseek: {
      turns: '[data-testid*="message"]',
      fallback: '[data-role]',
      container: 'main',
    },
  },

  // =========================================================================
  // STATE
  // =========================================================================

  _observer: null,
  _currentConversationId: null,
  _messageCount: 0,
  _promptShown: false,
  _toastElement: null,
  _lastUrl: null,
  _urlPollInterval: null,
  _platform: null,
  _initialized: false,

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Initialize the detector. Safe to call multiple times — will no-op if
   * already running.
   */
  init() {
    if (this._initialized) return;

    this._platform = window.PlatformDetector.detectPlatform();
    if (this._platform === 'unknown') return;

    this._lastUrl = window.location.href;
    this._currentConversationId = this._getConversationId();

    // Restore dismissal state for this conversation
    this._loadDismissalState();

    // Start observing the DOM for new messages
    this._setupObserver();

    // Poll for SPA navigation (URL changes without reload)
    this._startUrlMonitor();

    // Run an initial count in case the page already has messages
    this._countMessages();

    this._initialized = true;
    console.log('ThreadCub: ConversationLengthDetector initialized for', this._platform);
  },

  /**
   * Tear down the detector. Disconnects observer, stops polling, removes toast.
   */
  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this._urlPollInterval) {
      clearInterval(this._urlPollInterval);
      this._urlPollInterval = null;
    }
    this._removeToast();
    this._initialized = false;
  },

  // =========================================================================
  // DOM OBSERVATION
  // =========================================================================

  /**
   * Attach a MutationObserver to the conversation container. The observer
   * fires on childList changes in the subtree and debounces before counting
   * to avoid measuring during streaming responses.
   */
  _setupObserver() {
    const selectors = this.MESSAGE_SELECTORS[this._platform];
    if (!selectors) return;

    const containerSelector = selectors.container || 'main';
    const container = document.querySelector(containerSelector);

    if (!container) {
      // Container may not exist yet (SPA still rendering). Retry once.
      setTimeout(() => {
        const retryContainer = document.querySelector(containerSelector);
        if (retryContainer) {
          this._attachObserver(retryContainer);
        }
      }, this.CONFIG.OBSERVER_RETRY_MS);
      return;
    }

    this._attachObserver(container);
  },

  _attachObserver(container) {
    // Disconnect any previous observer
    if (this._observer) {
      this._observer.disconnect();
    }

    let debounceTimer = null;

    this._observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this._countMessages();
      }, this.CONFIG.OBSERVER_DEBOUNCE_MS);
    });

    this._observer.observe(container, {
      childList: true,
      subtree: true,
    });
  },

  // =========================================================================
  // MESSAGE COUNTING
  // =========================================================================

  /**
   * Count messages using fast, platform-specific selectors. Only runs
   * querySelectorAll().length — never reads text content.
   */
  _countMessages() {
    // Already shown for this conversation — skip the work
    if (this._promptShown) return;

    const selectors = this.MESSAGE_SELECTORS[this._platform];
    if (!selectors) return;

    let count = 0;

    // Strategy 1: Single "turns" selector that captures both roles
    if (selectors.turns) {
      count = document.querySelectorAll(selectors.turns).length;
    }

    // Strategy 2: Separate user/assistant selectors
    if (count === 0 && selectors.userTurns && selectors.assistantTurns) {
      const userCount = document.querySelectorAll(selectors.userTurns).length;
      const assistantCount = document.querySelectorAll(selectors.assistantTurns).length;
      count = userCount + assistantCount;
    }

    // Strategy 3: Fallback selector
    if (count === 0 && selectors.fallback) {
      count = document.querySelectorAll(selectors.fallback).length;
    }

    this._messageCount = count;

    // Threshold is in exchange pairs; each pair is 2 messages
    const exchanges = Math.floor(count / 2);
    if (exchanges >= this.CONFIG.EXCHANGE_THRESHOLD) {
      this._showPromptToast();
    }
  },

  // =========================================================================
  // SPA NAVIGATION
  // =========================================================================

  _startUrlMonitor() {
    this._urlPollInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this._lastUrl) {
        this._lastUrl = currentUrl;
        this._handleConversationChange();
      }
    }, this.CONFIG.URL_POLL_MS);
  },

  /**
   * When the user navigates to a different conversation, reset everything.
   */
  _handleConversationChange() {
    this._currentConversationId = this._getConversationId();
    this._messageCount = 0;
    this._promptShown = false;
    this._removeToast();

    // Check if this new conversation was already dismissed
    this._loadDismissalState();

    // Re-attach observer to the (potentially new) DOM tree
    if (this._observer) {
      this._observer.disconnect();
    }
    setTimeout(() => this._setupObserver(), this.CONFIG.URL_POLL_MS);
  },

  // =========================================================================
  // TOAST UI
  // =========================================================================

  /**
   * Display the conversation-length prompt toast. Modeled after the existing
   * UIComponents.showToast() pattern — bottom-center, same animation, same
   * z-index layer — but interactive (clickable + dismissible).
   */
  _showPromptToast() {
    if (this._promptShown) return;
    this._promptShown = true;

    // Analytics
    this._trackEvent('conversation_length_prompt_shown', {
      message_count: this._messageCount,
      platform: this._platform,
    });

    const toast = document.createElement('div');
    toast.id = 'threadcub-length-prompt';
    toast.className = 'threadcub-toast threadcub-toast-success threadcub-length-prompt';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const platformName = window.PlatformDetector.getPlatformName(this._platform);
    const exchangeCount = Math.floor(this._messageCount / 2);

    // Lucide "Sparkles" icon (inline SVG)
    const sparklesIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>`;

    toast.innerHTML = `
      <div class="threadcub-length-prompt-body">
        ${sparklesIcon}
        <span class="threadcub-length-prompt-text">${exchangeCount} exchanges on ${platformName} — save & continue with ThreadCub</span>
      </div>
      <button class="threadcub-length-prompt-dismiss" aria-label="Dismiss">&times;</button>
    `;

    document.body.appendChild(toast);
    this._toastElement = toast;

    // Animate in (matches showToast pattern: add .show after brief delay)
    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    // Click handler — trigger the existing continuation workflow
    const body = toast.querySelector('.threadcub-length-prompt-body');
    body.addEventListener('click', () => {
      this._handleContinueClick();
    });

    // Dismiss handler
    const dismissBtn = toast.querySelector('.threadcub-length-prompt-dismiss');
    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._handleDismiss();
    });
  },

  /**
   * User clicked the toast body — start the save & continue flow.
   */
  _handleContinueClick() {
    this._trackEvent('conversation_length_prompt_clicked', {
      message_count: this._messageCount,
      platform: this._platform,
    });

    this._removeToast();
    this._saveDismissalState();

    // Invoke the same method the floating button's "continue" action calls
    if (window.threadcubButton && typeof window.threadcubButton.saveAndOpenConversation === 'function') {
      window.threadcubButton.saveAndOpenConversation('length_prompt');
    }
  },

  /**
   * User clicked the dismiss X.
   */
  _handleDismiss() {
    this._trackEvent('conversation_length_prompt_dismissed', {
      message_count: this._messageCount,
      platform: this._platform,
    });

    this._removeToast();
    this._saveDismissalState();
  },

  /**
   * Animate out and remove toast from DOM.
   */
  _removeToast() {
    if (!this._toastElement) return;

    this._toastElement.classList.remove('show');
    const el = this._toastElement;
    this._toastElement = null;

    setTimeout(() => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 300); // Match --transition-toast duration
  },

  // =========================================================================
  // PERSISTENCE
  // =========================================================================

  _getConversationId() {
    return window.PlatformDetector.extractConversationId()
      || window.location.pathname
      || 'unknown';
  },

  /**
   * Record that the toast was shown/dismissed for this conversation so it
   * doesn't re-trigger on page refresh or re-navigation.
   */
  _saveDismissalState() {
    const key = this.CONFIG.STORAGE_PREFIX + this._currentConversationId;
    try {
      localStorage.setItem(key, JSON.stringify({
        dismissed: true,
        timestamp: Date.now(),
        messageCount: this._messageCount,
      }));
    } catch (e) {
      // localStorage full or unavailable — fail silently
    }
  },

  /**
   * Check if the toast was already dismissed for the current conversation
   * (within the TTL window).
   */
  _loadDismissalState() {
    const key = this.CONFIG.STORAGE_PREFIX + this._currentConversationId;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.dismissed && (Date.now() - data.timestamp) < this.CONFIG.DISMISSAL_TTL_MS) {
          this._promptShown = true;
        }
      }
    } catch (e) {
      // Fail silently
    }
  },

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  _trackEvent(eventName, data) {
    try {
      chrome.runtime.sendMessage({
        action: 'trackEvent',
        eventType: eventName,
        data: data,
      });
    } catch (e) {
      // Extension context may be invalid — fail silently
    }
  },
};

// Export to window
window.ConversationLengthDetector = ConversationLengthDetector;
console.log('ThreadCub: ConversationLengthDetector module loaded');
