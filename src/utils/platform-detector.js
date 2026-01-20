console.log('🔧 LOADING: platform-detector.js');

/**
 * Platform Detection Module
 *
 * Consolidates all platform detection logic for AI chat platforms
 * Supports: Claude.ai, ChatGPT, Gemini, Copilot
 */

// Platform Detection Utility
const PlatformDetector = {
  // Platform constants
  PLATFORMS: {
    CLAUDE: 'claude',
    CHATGPT: 'chatgpt',
    GEMINI: 'gemini',
    COPILOT: 'copilot',
    UNKNOWN: 'unknown'
  },

  // Platform display names
  PLATFORM_NAMES: {
    claude: 'Claude.ai',
    chatgpt: 'ChatGPT',
    gemini: 'Gemini',
    copilot: 'Copilot',
    unknown: 'Unknown'
  },

  // Platform-specific input field selectors
  INPUT_SELECTORS: {
    claude: [
      'textarea[data-testid="chat-input"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Talk to Claude"]',
      'textarea'
    ],
    chatgpt: [
      'textarea[data-testid="prompt-textarea"]',
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',
      'textarea'
    ],
    gemini: [
      'rich-textarea div[contenteditable="true"]',
      'textarea[placeholder*="Enter a prompt"]',
      'textarea'
    ],
    copilot: [
      'textarea[placeholder*="Ask me anything"]',
      'textarea',
      'div[contenteditable="true"]'
    ],
    unknown: [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="prompt"]',
      'div[contenteditable="true"]',
      'textarea'
    ]
  },

  // Platform-specific conversation URL patterns
  CONVERSATION_PATTERNS: {
    claude: [
      /\/chat\/([a-f0-9-]{36})/,     // /chat/uuid
      /\/conversation\/([a-f0-9-]{36})/, // /conversation/uuid
      /\/c\/([a-f0-9-]{36})/,        // /c/uuid
      /([a-f0-9-]{36})/              // any uuid in URL
    ],
    chatgpt: [
      /\/c\/([^\/\?]+)/,        // /c/conversation-id
      /\/chat\/([^\/\?]+)/,     // /chat/conversation-id
      /\/conversation\/([^\/\?]+)/ // /conversation/conversation-id
    ],
    gemini: [
      /\/app\/([^\/\?]+)/,      // /app/conversation-id
      /\/chat\/([^\/\?]+)/      // /chat/conversation-id
    ]
  },

  /**
   * Detect the current AI platform based on hostname
   * @returns {string} Platform identifier (claude, chatgpt, etc.)
   */
  detectPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes('claude.ai')) {
      return this.PLATFORMS.CLAUDE;
    }

    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      return this.PLATFORMS.CHATGPT;
    }

    if (hostname.includes('gemini.google.com')) {
      return this.PLATFORMS.GEMINI;
    }

    if (hostname.includes('copilot.microsoft.com')) {
      return this.PLATFORMS.COPILOT;
    }

    return this.PLATFORMS.UNKNOWN;
  },

  /**
   * Get the display name for a platform
   * @param {string} platform - Platform identifier
   * @returns {string} Display name
   */
  getPlatformName(platform) {
    return this.PLATFORM_NAMES[platform] || this.PLATFORM_NAMES[this.PLATFORMS.UNKNOWN];
  },

  /**
   * Get input field selectors for the current platform
   * @param {string} platform - Platform identifier (optional, detects if not provided)
   * @returns {Array<string>} Array of CSS selectors
   */
  getInputSelectors(platform) {
    const currentPlatform = platform || this.detectPlatform();
    return this.INPUT_SELECTORS[currentPlatform] || this.INPUT_SELECTORS[this.PLATFORMS.UNKNOWN];
  },

  /**
   * Get conversation URL patterns for the current platform
   * @param {string} platform - Platform identifier (optional, detects if not provided)
   * @returns {Array<RegExp>} Array of regex patterns
   */
  getConversationPatterns(platform) {
    const currentPlatform = platform || this.detectPlatform();
    return this.CONVERSATION_PATTERNS[currentPlatform] || [];
  },

  /**
   * Extract conversation ID from current URL
   * @returns {string|null} Conversation ID or null if not found
   */
  extractConversationId() {
    const platform = this.detectPlatform();
    const url = window.location.href;
    const patterns = this.getConversationPatterns(platform);

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  },

  /**
   * Check if current platform is supported
   * @returns {boolean} True if platform is supported
   */
  isPlatformSupported() {
    const platform = this.detectPlatform();
    return platform !== this.PLATFORMS.UNKNOWN;
  },

  /**
   * Get all supported platforms
   * @returns {Array<string>} Array of platform identifiers
   */
  getSupportedPlatforms() {
    return [
      this.PLATFORMS.CLAUDE,
      this.PLATFORMS.CHATGPT,
      this.PLATFORMS.GEMINI,
      this.PLATFORMS.COPILOT
    ];
  }
};

// Make the module globally available
window.PlatformDetector = PlatformDetector;

console.log('✅ PlatformDetector defined:', typeof window.PlatformDetector);
console.log('🔍 Current platform:', PlatformDetector.detectPlatform());
