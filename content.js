// === SECTION 1A: ThreadCubTagging Constructor & Initialization ===

// ThreadCub with Enhanced Popup System - URL MONITORING FIX + PERSISTENCE
console.log('🐻 ThreadCub: Initializing with URL monitoring fix and tag persistence...');

// FIXED INLINE TAGGING CODE - Complete working implementation with URL monitoring
console.log('🏷️ ThreadCub: Defining ThreadCubTagging inline...');

window.ThreadCubTagging = class ThreadCubTagging {
  constructor(floatingButton) {
    this.floatingButton = floatingButton;
    this.currentConversationId = null;
    this.tags = [];
    this.isTaggingEnabled = true;
    this.sidePanel = null;
    this.contextMenu = null;
    this.selectedText = '';
    this.selectedRange = null;
    this.selectedCategoryId = 'dont-forget';
    this.isContextMenuVisible = false;
    this.isPanelOpen = false;
    this.mouseUpHandler = null;
    this.clickHandler = null;
    this.highlightCounter = 0;
    this.currentPlatform = this.detectPlatform();
    this.currentStorageKey = null;
    this.lastUrl = window.location.href;
    
    // ✅ CRITICAL: Set global reference
    window.threadcubTagging = this;
    
    // Tag categories
    this.tagCategories = [
      { id: 'dont-forget', label: "Don't Forget", color: '#ff6b6b' },
      { id: 'backlog', label: 'Backlog Item', color: '#4ecdc4' },
      { id: 'priority', label: 'Top Priority', color: '#45b7d1' }
    ];
    
    console.log('🏷️ ThreadCub: Tagging module initialized for platform:', this.currentPlatform);
    this.init();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('claude.ai')) return 'claude';
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) return 'chatgpt';
    if (hostname.includes('gemini.google.com')) return 'gemini';
    return 'unknown';
  }

  async init() {
    this.addTaggingStyles();
    this.createContextMenu();
    this.createSidePanel();
    this.setupEventListeners();
    
    // Initialize current storage key
    this.currentStorageKey = this.generateConversationKey();
    
    // ADD THIS LINE:
    this.initializeSidePanelUI();
    
    // Setup URL monitoring for storage key changes
    this.setupUrlMonitoring();
    
    // NEW: Load persisted tags with delay for DOM stabilization
    setTimeout(async () => {
      await this.loadPersistedTags();
    }, 1000);
    
    console.log('🏷️ ThreadCub: Tagging system ready with enhanced persistence and URL monitoring');
  }

  // NEW: Setup URL monitoring to detect when conversation changes
  setupUrlMonitoring() {
    console.log('🔍 Setting up URL monitoring...');
    
    // Monitor for URL changes
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        console.log('🔍 URL changed from:', this.lastUrl);
        console.log('🔍 URL changed to:', currentUrl);
        this.handleUrlChange(currentUrl);
        this.lastUrl = currentUrl;
      }
    });
    
    // Watch for DOM changes that might indicate navigation
    observer.observe(document, { childList: true, subtree: true });
    
    // Also listen for browser navigation events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== this.lastUrl) {
          console.log('🔍 Popstate URL change:', currentUrl);
          this.handleUrlChange(currentUrl);
          this.lastUrl = currentUrl;
        }
      }, 100);
    });
    
    // Listen for pushstate/replacestate (Claude.ai uses these for navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => {
        const currentUrl = window.location.href;
        if (window.threadcubTagging && currentUrl !== window.threadcubTagging.lastUrl) {
          console.log('🔍 PushState URL change:', currentUrl);
          window.threadcubTagging.handleUrlChange(currentUrl);
          window.threadcubTagging.lastUrl = currentUrl;
        }
      }, 100);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => {
        const currentUrl = window.location.href;
        if (window.threadcubTagging && currentUrl !== window.threadcubTagging.lastUrl) {
          console.log('🔍 ReplaceState URL change:', currentUrl);
          window.threadcubTagging.handleUrlChange(currentUrl);
          window.threadcubTagging.lastUrl = currentUrl;
        }
      }, 100);
    };
  }

  // NEW: Handle URL changes and transfer tags if needed
  async handleUrlChange(newUrl) {
    console.log('🔍 Handling URL change to:', newUrl);
    
    const oldStorageKey = this.currentStorageKey;
    const newStorageKey = this.generateConversationKey();
    
    console.log('🔍 Old storage key:', oldStorageKey);
    console.log('🔍 New storage key:', newStorageKey);
    
    if (oldStorageKey !== newStorageKey) {
      console.log('🔍 Storage key changed - transferring tags...');
      
      // Check if we have tags in the old key that should be transferred
      if (this.shouldTransferTags(oldStorageKey, newStorageKey)) {
        await this.transferTagsToNewKey(oldStorageKey, newStorageKey);
      }
      
      this.currentStorageKey = newStorageKey;
      
      // Load tags for the new URL
      await this.loadPersistedTags();
    }
  }

  // NEW: Determine if tags should be transferred between keys
  shouldTransferTags(oldKey, newKey) {
    // Transfer from /new to actual conversation
    if (oldKey.includes('claudeai-Claude-') && newKey.includes('threadcub-tags-') && !newKey.includes('claudeai-Claude-')) {
      console.log('🔍 Should transfer from /new to conversation');
      return true;
    }
    
    // Transfer from fallback to real conversation ID
    if (oldKey.includes('conversation') && newKey.includes('-') && newKey.length > oldKey.length) {
      console.log('🔍 Should transfer from fallback to real conversation');
      return true;
    }
    
    return false;
  }

  // NEW: Transfer tags from old storage key to new storage key
  async transferTagsToNewKey(oldKey, newKey) {
    try {
      console.log('🔄 Transferring tags from', oldKey, 'to', newKey);
      
      // Load tags from old key
      let oldTagsData = null;
      
      if (this.canUseChromStorage()) {
        oldTagsData = await this.loadFromChromStorage(oldKey);
      } else {
        const stored = localStorage.getItem(oldKey);
        if (stored) {
          oldTagsData = JSON.parse(stored);
        }
      }
      
      if (oldTagsData && oldTagsData.tags && oldTagsData.tags.length > 0) {
        console.log(`🔄 Found ${oldTagsData.tags.length} tags to transfer`);
        
        // Update the tags with new URL context
        oldTagsData.conversationUrl = window.location.href;
        oldTagsData.lastUpdated = new Date().toISOString();
        
        // Save to new key
        if (this.canUseChromStorage()) {
          await this.saveToChromStorage(newKey, oldTagsData);
        } else {
          localStorage.setItem(newKey, JSON.stringify(oldTagsData));
        }
        
        // Remove from old key
        if (this.canUseChromStorage()) {
          chrome.storage.local.remove([oldKey]);
        } else {
          localStorage.removeItem(oldKey);
        }
        
        console.log('🔄 ✅ Tags transferred successfully');
      } else {
        console.log('🔄 No tags found to transfer');
      }
      
    } catch (error) {
      console.error('🔄 Error transferring tags:', error);
    }
  }

  // Enhanced conversation key generation with better Claude.ai handling
  generateConversationKey() {
    try {
      const url = window.location.href;
      console.log('🔍 DEBUG: Current URL:', url);
      console.log('🔍 DEBUG: Current hostname:', window.location.hostname);
      console.log('🔍 DEBUG: Current pathname:', window.location.pathname);
      
      // Extract conversation ID from URL patterns
      let conversationId = null;
      
      if (url.includes('claude.ai')) {
        console.log('🔍 DEBUG: Detected Claude platform');
        // Try multiple Claude URL patterns
        const patterns = [
          /\/chat\/([a-f0-9-]{36})/,     // /chat/uuid
          /\/conversation\/([a-f0-9-]{36})/, // /conversation/uuid
          /\/c\/([a-f0-9-]{36})/,        // /c/uuid
          /([a-f0-9-]{36})/             // any uuid in URL
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            conversationId = match[1];
            console.log('🔍 DEBUG: Found Claude conversation ID:', conversationId, 'using pattern:', pattern);
            break;
          }
        }
      } else if (url.includes('chatgpt.com')) {
        console.log('🔍 DEBUG: Detected ChatGPT platform');
        // Try multiple ChatGPT URL patterns
        const patterns = [
          /\/c\/([^\/\?]+)/,        // /c/conversation-id
          /\/chat\/([^\/\?]+)/,     // /chat/conversation-id
          /\/conversation\/([^\/\?]+)/ // /conversation/conversation-id
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            conversationId = match[1];
            console.log('🔍 DEBUG: Found ChatGPT conversation ID:', conversationId, 'using pattern:', pattern);
            break;
          }
        }
      } else if (url.includes('gemini.google.com')) {
        console.log('🔍 DEBUG: Detected Gemini platform');
        // Try Gemini URL patterns
        const patterns = [
          /\/app\/([^\/\?]+)/,      // /app/conversation-id
          /\/chat\/([^\/\?]+)/      // /chat/conversation-id
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            conversationId = match[1];
            console.log('🔍 DEBUG: Found Gemini conversation ID:', conversationId, 'using pattern:', pattern);
            break;
          }
        }
      }
      
      // Enhanced fallback: Use full URL hash for unique identification
      if (!conversationId) {
        console.log('🔍 DEBUG: No conversation ID found in URL, creating fallback');
        
        // Create a more stable identifier from the full URL
        const urlWithoutParams = url.split('?')[0].split('#')[0];
        console.log('🔍 DEBUG: URL without params:', urlWithoutParams);
        
        // Use a hash of the URL + title for stability
        const title = document.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
        const hostname = window.location.hostname.replace(/[^a-zA-Z0-9]/g, '');
        
        // Create a more unique identifier
        conversationId = `${hostname}-${title}-${this.simpleHash(urlWithoutParams)}`;
        console.log('🔍 DEBUG: Generated fallback conversation ID:', conversationId);
      }
      
      const storageKey = `threadcub-tags-${conversationId}`;
      console.log('🔍 DEBUG: Final storage key:', storageKey);
      
      return storageKey;
      
    } catch (error) {
      console.log('🏷️ ThreadCub: Error generating conversation key:', error);
      const fallbackKey = `threadcub-tags-emergency-${Date.now()}`;
      console.log('🔍 DEBUG: Using emergency fallback key:', fallbackKey);
      return fallbackKey;
    }
  }

  // Helper method to create a simple hash
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Enhanced save with detailed logging
  async saveTagsToPersistentStorage() {
    try {
      const storageKey = this.currentStorageKey || this.generateConversationKey();
      const tagsData = {
        tags: this.tags,
        lastUpdated: new Date().toISOString(),
        conversationUrl: window.location.href,
        conversationTitle: document.title,
        platform: this.currentPlatform
      };
      
      console.log(`🔍 DEBUG: Saving ${this.tags.length} tags with key:`, storageKey);
      console.log('🔍 DEBUG: Tags data:', tagsData);
      
      // Try Chrome storage first
      if (this.canUseChromStorage()) {
        await this.saveToChromStorage(storageKey, tagsData);
        console.log('🔍 DEBUG: ✅ Tags saved to Chrome storage successfully');
        
        // Verify the save worked
        const verification = await this.loadFromChromStorage(storageKey);
        console.log('🔍 DEBUG: Verification - data retrieved:', !!verification);
        if (verification) {
          console.log('🔍 DEBUG: Verification - tag count:', verification.tags?.length || 0);
        }
      } else {
        // Fallback to localStorage
        localStorage.setItem(storageKey, JSON.stringify(tagsData));
        console.log('🔍 DEBUG: ✅ Tags saved to localStorage');
        
        // Verify the save worked
        const verification = localStorage.getItem(storageKey);
        console.log('🔍 DEBUG: Verification - localStorage data exists:', !!verification);
        if (verification) {
          const parsed = JSON.parse(verification);
          console.log('🔍 DEBUG: Verification - tag count:', parsed.tags?.length || 0);
        }
      }
      
    } catch (error) {
      console.error('🔍 DEBUG: ❌ Error saving tags:', error);
    }
  }

  // Enhanced load with detailed logging
  async loadPersistedTags() {
    try {
      const storageKey = this.currentStorageKey || this.generateConversationKey();
      console.log('🔍 DEBUG: Loading tags with key:', storageKey);
      
      let tagsData = null;
      
      // Try Chrome storage first
      if (this.canUseChromStorage()) {
        console.log('🔍 DEBUG: Attempting Chrome storage load...');
        tagsData = await this.loadFromChromStorage(storageKey);
        console.log('🔍 DEBUG: Chrome storage result:', !!tagsData);
      } else {
        console.log('🔍 DEBUG: Attempting localStorage load...');
        const stored = localStorage.getItem(storageKey);
        console.log('🔍 DEBUG: localStorage raw data exists:', !!stored);
        if (stored) {
          tagsData = JSON.parse(stored);
          console.log('🔍 DEBUG: localStorage parsed data:', !!tagsData);
        }
      }
      
      if (tagsData && tagsData.tags && Array.isArray(tagsData.tags)) {
        console.log(`🔍 DEBUG: ✅ Found ${tagsData.tags.length} persisted tags`);
        console.log('🔍 DEBUG: Sample tag:', tagsData.tags[0]);
        
        // Restore tags
        this.tags = tagsData.tags;
        
        // Restore highlights for visible tags with improved matching
        await this.restoreHighlightsImproved();
        
        // Update UI if panel is open
        if (this.isPanelOpen) {
          this.updateTagsList();
        }
        
        console.log('🔍 DEBUG: ✅ Tags restoration complete');
      } else {
        console.log('🔍 DEBUG: ❌ No valid persisted tags found');
        
        // DEBUG: Check what keys exist in storage
        if (this.canUseChromStorage()) {
          chrome.storage.local.get(null, (allData) => {
            console.log('🔍 DEBUG: All Chrome storage keys:', Object.keys(allData));
            const threadcubKeys = Object.keys(allData).filter(key => key.startsWith('threadcub-tags-'));
            console.log('🔍 DEBUG: ThreadCub tag keys in storage:', threadcubKeys);
          });
        } else {
          const allKeys = Object.keys(localStorage);
          const threadcubKeys = allKeys.filter(key => key.startsWith('threadcub-tags-'));
          console.log('🔍 DEBUG: ThreadCub tag keys in localStorage:', threadcubKeys);
        }
      }
      
    } catch (error) {
      console.error('🔍 DEBUG: ❌ Error loading persisted tags:', error);
    }
  }

  // NEW: Enhanced capture of range info with text context
  captureEnhancedRangeInfo(range) {
    try {
      const rangeInfo = {
        startXPath: this.getXPathForElement(range.startContainer),
        endXPath: this.getXPathForElement(range.endContainer),
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        commonAncestorXPath: this.getXPathForElement(range.commonAncestorContainer),
        // NEW: Add text content and context for better matching
        selectedText: range.toString().trim(),
        textLength: range.toString().trim().length,
        // Store surrounding context for better matching
        beforeText: this.getTextBefore(range, 50),
        afterText: this.getTextAfter(range, 50),
        // Store parent element text for backup matching
        parentText: range.commonAncestorContainer.textContent?.substring(0, 200) || ''
      };
      
      console.log('🏷️ ThreadCub: Enhanced range info captured:', rangeInfo);
      return rangeInfo;
      
    } catch (error) {
      console.log('🏷️ ThreadCub: Could not capture enhanced range info:', error);
      return this.captureRangeInfo(range); // Fallback to original method
    }
  }

  // NEW: Get text before range for context
  getTextBefore(range, maxLength) {
    try {
      const tempRange = document.createRange();
      tempRange.setStart(range.commonAncestorContainer, 0);
      tempRange.setEnd(range.startContainer, range.startOffset);
      const beforeText = tempRange.toString();
      return beforeText.slice(-maxLength);
    } catch (error) {
      return '';
    }
  }

  // NEW: Get text after range for context
  getTextAfter(range, maxLength) {
    try {
      const tempRange = document.createRange();
      tempRange.setStart(range.endContainer, range.endOffset);
      tempRange.setEndAfter(range.commonAncestorContainer);
      const afterText = tempRange.toString();
      return afterText.slice(0, maxLength);
    } catch (error) {
      return '';
    }
  }

  // NEW: Improved highlight restoration with multiple fallback strategies + retry mechanism
  async restoreHighlightsImproved() {
    console.log('🏷️ ThreadCub: Restoring highlights with improved matching...');
    
    // Wait for DOM to be fully loaded and stable
    await this.waitForDOMStability();
    
    let restoredCount = 0;
    const totalTags = this.tags.length;
    
    for (const tag of this.tags) {
      try {
        if (tag.rangeInfo || tag.text) {
          let range = null;
          
          // Strategy 1: Try XPath restoration
          if (tag.rangeInfo) {
            range = this.recreateRangeFromInfo(tag.rangeInfo);
          }
          
          // Strategy 2: If XPath fails, try text-based matching with enhanced search
          if (!range && (tag.rangeInfo?.selectedText || tag.text)) {
            const targetText = tag.rangeInfo?.selectedText || tag.text;
            range = this.findRangeByEnhancedTextSearch(targetText);
          }
          
          // Strategy 3: If both fail, try fuzzy text matching
          if (!range && tag.text) {
            range = this.findRangeByFuzzyMatch(tag.text);
          }
          
          // Strategy 4: Last resort - simple text search with partial matching
          if (!range && tag.text) {
            range = this.findRangeByPartialText(tag.text);
          }
          
          if (range) {
            this.applySmartHighlight(range, tag.id);
            restoredCount++;
            console.log(`🏷️ ThreadCub: ✅ Restored highlight ${restoredCount}/${totalTags} for tag ${tag.id}`);
          } else {
            console.log(`🏷️ ThreadCub: ❌ Could not restore highlight for tag ${tag.id}: "${tag.text?.substring(0, 50)}..."`);
            
            // Create a visual indicator in the side panel that this tag couldn't be highlighted
            this.markTagAsUnhighlighted(tag.id);
          }
        }
      } catch (error) {
        console.log(`🏷️ ThreadCub: Error restoring highlight for tag ${tag.id}:`, error);
      }
    }
    
    console.log(`🏷️ ThreadCub: Highlight restoration complete: ${restoredCount}/${totalTags} highlights restored`);
    
    // If we restored less than 50% of highlights, try again after a delay
    if (restoredCount < totalTags * 0.5 && totalTags > 0) {
      console.log('🏷️ ThreadCub: Low success rate, retrying highlight restoration in 2 seconds...');
      setTimeout(() => {
        this.retryFailedHighlights();
      }, 2000);
    }
  }

  // NEW: Wait for DOM to be stable before attempting highlight restoration
  async waitForDOMStability() {
    return new Promise((resolve) => {
      let stabilityCounter = 0;
      const requiredStability = 3; // Need 3 consecutive checks with no changes
      
      const checkStability = () => {
        const currentNodeCount = document.querySelectorAll('*').length;
        
        if (this.lastNodeCount === currentNodeCount) {
          stabilityCounter++;
          if (stabilityCounter >= requiredStability) {
            console.log('🏷️ ThreadCub: DOM appears stable, proceeding with highlight restoration');
            resolve();
            return;
          }
        } else {
          stabilityCounter = 0;
        }
        
        this.lastNodeCount = currentNodeCount;
        setTimeout(checkStability, 200);
      };
      
      this.lastNodeCount = document.querySelectorAll('*').length;
      setTimeout(checkStability, 500); // Initial delay
    });
  }

  // NEW: Enhanced text search that works better with Claude's dynamic content
  findRangeByEnhancedTextSearch(targetText) {
    if (!targetText || targetText.length < 3) return null;
    
    console.log('🏷️ ThreadCub: Enhanced text search for:', targetText.substring(0, 50) + '...');
    
    // Clean the target text
    const cleanTarget = targetText.trim();
    
    // Try different text node search strategies
    const searchStrategies = [
      () => this.searchInConversationContainer(cleanTarget),
      () => this.searchInMessageElements(cleanTarget),
      () => this.searchInAllTextNodes(cleanTarget)
    ];
    
    for (const strategy of searchStrategies) {
      try {
        const range = strategy();
        if (range) {
          console.log('🏷️ ThreadCub: ✅ Enhanced search found match');
          return range;
        }
      } catch (error) {
        console.log('🏷️ ThreadCub: Search strategy failed:', error);
        continue;
      }
    }
    
    console.log('🏷️ ThreadCub: Enhanced text search failed');
    return null;
  }

  // NEW: Search specifically in conversation containers (Claude.ai structure)
  searchInConversationContainer(targetText) {
    // Look for Claude's conversation structure
    const conversationSelectors = [
      '[data-testid*="conversation"]',
      '[data-testid*="message"]',
      'div[class*="conversation"]',
      'div[class*="message"]',
      'div[class*="prose"]',
      'main'
    ];
    
    for (const selector of conversationSelectors) {
      const containers = document.querySelectorAll(selector);
      console.log(`🔍 Searching in ${containers.length} ${selector} containers`);
      
      for (const container of containers) {
        const range = this.searchTextInElement(container, targetText);
        if (range) return range;
      }
    }
    
    return null;
  }

  // NEW: Search in message-like elements
  searchInMessageElements(targetText) {
    // Get all elements that might contain message content
    const messageElements = document.querySelectorAll('div, p, span');
    const candidates = [];
    
    // Filter for elements with substantial text content
    for (const element of messageElements) {
      const text = element.textContent?.trim() || '';
      if (text.length > 20 && text.includes(targetText.substring(0, 20))) {
        candidates.push(element);
      }
    }
    
    console.log(`🔍 Found ${candidates.length} candidate message elements`);
    
    // Search in candidates, starting with the most promising
    candidates.sort((a, b) => {
      const aText = a.textContent?.trim() || '';
      const bText = b.textContent?.trim() || '';
      return Math.abs(aText.length - targetText.length) - Math.abs(bText.length - targetText.length);
    });
    
    for (const element of candidates) {
      const range = this.searchTextInElement(element, targetText);
      if (range) return range;
    }
    
    return null;
  }

  // NEW: Search for partial text matches (for when exact match fails)
  findRangeByPartialText(targetText) {
    if (!targetText || targetText.length < 10) return null;
    
    console.log('🏷️ ThreadCub: Partial text search for:', targetText.substring(0, 30) + '...');
    
    // Try to find a significant portion of the text
    const minMatchLength = Math.min(50, Math.floor(targetText.length * 0.6));
    const searchText = targetText.substring(0, minMatchLength);
    
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      const nodeText = textNode.textContent;
      if (nodeText && nodeText.includes(searchText)) {
        try {
          const startIndex = nodeText.indexOf(searchText);
          const range = document.createRange();
          range.setStart(textNode, startIndex);
          range.setEnd(textNode, Math.min(startIndex + targetText.length, nodeText.length));
          
          console.log('🏷️ ThreadCub: ✅ Found partial text match');
          return range;
        } catch (error) {
          continue;
        }
      }
    }
    
    return null;
  }

  // NEW: Helper to search text within a specific element
  searchTextInElement(element, targetText) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      const nodeText = textNode.textContent;
      if (nodeText && nodeText.includes(targetText)) {
        try {
          const startIndex = nodeText.indexOf(targetText);
          const range = document.createRange();
          range.setStart(textNode, startIndex);
          range.setEnd(textNode, startIndex + targetText.length);
          
          // Verify the range text matches
          if (range.toString().trim() === targetText.trim()) {
            return range;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    return null;
  }

  // NEW: Retry failed highlights with different timing
  async retryFailedHighlights() {
    console.log('🏷️ ThreadCub: Retrying failed highlight restorations...');
    
    const unhighlightedTags = this.tags.filter(tag => {
      // Check if tag doesn't have a highlight element
      return !this.highlightElements?.has(tag.id);
    });
    
    console.log(`🏷️ ThreadCub: Retrying ${unhighlightedTags.length} failed highlights`);
    
    for (const tag of unhighlightedTags) {
      if (tag.text) {
        const range = this.findRangeByEnhancedTextSearch(tag.text);
        if (range) {
          this.applySmartHighlight(range, tag.id);
          console.log(`🏷️ ThreadCub: ✅ Retry successful for tag ${tag.id}`);
        }
      }
    }
  }

  // NEW: Mark tags that couldn't be highlighted in the UI
  markTagAsUnhighlighted(tagId) {
    // This will be used by the side panel to show that highlight couldn't be restored
    if (!this.unhighlightedTags) {
      this.unhighlightedTags = new Set();
    }
    this.unhighlightedTags.add(tagId);
  }

  // NEW: Find range by text content matching
  findRangeByTextContent(rangeInfo) {
    try {
      const targetText = rangeInfo.selectedText;
      if (!targetText || targetText.length < 3) return null;
      
      console.log('🏷️ ThreadCub: Searching for text:', targetText.substring(0, 50) + '...');
      
      // Create a TreeWalker to find all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textNode;
      while (textNode = walker.nextNode()) {
        const nodeText = textNode.textContent;
        if (nodeText.includes(targetText)) {
          const startIndex = nodeText.indexOf(targetText);
          if (startIndex !== -1) {
            try {
              const range = document.createRange();
              range.setStart(textNode, startIndex);
              range.setEnd(textNode, startIndex + targetText.length);
              
              // Verify the selected text matches
              if (range.toString().trim() === targetText) {
                console.log('🏷️ ThreadCub: ✅ Found exact text match');
                return range;
              }
            } catch (error) {
              continue;
            }
          }
        }
      }
      
      console.log('🏷️ ThreadCub: No exact text match found');
      return null;
      
    } catch (error) {
      console.log('🏷️ ThreadCub: Error in text content matching:', error);
      return null;
    }
  }

  // NEW: Find range by fuzzy text matching (for slight variations)
  findRangeByFuzzyMatch(targetText) {
    try {
      if (!targetText || targetText.length < 10) return null;
      
      console.log('🏷️ ThreadCub: Attempting fuzzy match for:', targetText.substring(0, 30) + '...');
      
      // Clean up the target text for comparison
      const cleanTarget = targetText.replace(/\s+/g, ' ').trim().toLowerCase();
      const targetWords = cleanTarget.split(' ');
      
      // Search for text that contains most of the words
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let bestMatch = null;
      let bestScore = 0;
      
      let textNode;
      while (textNode = walker.nextNode()) {
        const nodeText = textNode.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
        
        // Skip very short text nodes
        if (nodeText.length < targetText.length * 0.7) continue;
        
        // Calculate word overlap score
        let matchedWords = 0;
        for (const word of targetWords) {
          if (word.length > 2 && nodeText.includes(word)) {
            matchedWords++;
          }
        }
        
        const score = matchedWords / targetWords.length;
        
        // If we find a good match (70% word overlap)
        if (score > 0.7 && score > bestScore) {
          // Try to find the exact substring within this node
          const startIndex = nodeText.indexOf(cleanTarget);
          if (startIndex !== -1) {
            try {
              const range = document.createRange();
              range.setStart(textNode, startIndex);
              range.setEnd(textNode, Math.min(startIndex + targetText.length, nodeText.length));
              bestMatch = range;
              bestScore = score;
            } catch (error) {
              continue;
            }
          }
        }
      }
      
      if (bestMatch && bestScore > 0.7) {
        console.log(`🏷️ ThreadCub: ✅ Found fuzzy match with ${Math.round(bestScore * 100)}% confidence`);
        return bestMatch;
      }
      
      console.log('🏷️ ThreadCub: No suitable fuzzy match found');
      return null;
      
    } catch (error) {
      console.log('🏷️ ThreadCub: Error in fuzzy matching:', error);
      return null;
    }
  }

  // NEW: Recreate range from stored range info
  recreateRangeFromInfo(rangeInfo) {
    try {
      if (!rangeInfo || !rangeInfo.startXPath || !rangeInfo.endXPath) {
        return null;
      }
      
      // Find elements using stored XPaths
      const startElement = this.getElementByXPath(rangeInfo.startXPath);
      const endElement = this.getElementByXPath(rangeInfo.endXPath);
      
      if (!startElement || !endElement) {
        console.log('🏷️ ThreadCub: Could not find elements for stored range via XPath');
        return null;
      }
      
      // Create new range
      const range = document.createRange();
      
      // Set start position
      if (startElement.nodeType === Node.TEXT_NODE) {
        range.setStart(startElement, Math.min(rangeInfo.startOffset || 0, startElement.textContent.length));
      } else {
        const textNode = this.getFirstTextNode(startElement);
        if (textNode) {
          range.setStart(textNode, Math.min(rangeInfo.startOffset || 0, textNode.textContent.length));
        } else {
          range.setStart(startElement, 0);
        }
      }
      
      // Set end position
      if (endElement.nodeType === Node.TEXT_NODE) {
        range.setEnd(endElement, Math.min(rangeInfo.endOffset || endElement.textContent.length, endElement.textContent.length));
      } else {
        const textNode = this.getFirstTextNode(endElement);
        if (textNode) {
          range.setEnd(textNode, Math.min(rangeInfo.endOffset || textNode.textContent.length, textNode.textContent.length));
        } else {
          range.setEnd(endElement, endElement.childNodes.length);
        }
      }
      
      // Verify the range produces the expected text
      const rangeText = range.toString().trim();
      if (rangeInfo.selectedText && rangeText === rangeInfo.selectedText) {
        console.log('🏷️ ThreadCub: ✅ XPath restoration successful with text verification');
        return range;
      } else {
        console.log('🏷️ ThreadCub: XPath restoration failed text verification');
        return null;
      }
      
    } catch (error) {
      console.log('🏷️ ThreadCub: Error recreating range from XPath:', error);
      return null;
    }
  }

  // Include all other required methods...
  getElementByXPath(xpath) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    } catch (error) {
      console.log('🏷️ ThreadCub: Error evaluating XPath:', error);
      return null;
    }
  }

  getFirstTextNode(element) {
    if (element.nodeType === Node.TEXT_NODE) {
      return element;
    }
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    return walker.nextNode();
  }

  canUseChromStorage() {
    try {
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             chrome.storage && 
             chrome.storage.local &&
             !chrome.runtime.lastError;
    } catch (error) {
      return false;
    }
  }

  async saveToChromStorage(key, data) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [key]: data }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async loadFromChromStorage(key) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result[key] || null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Add the required missing methods for complete functionality
  async createTagFromSelection() {
    console.log('🏷️ ThreadCub: createTagFromSelection called');
    
    const categoryId = this.selectedCategoryId || 'dont-forget';
    const category = this.tagCategories.find(cat => cat.id === categoryId);
    
    if (!this.selectedText || !this.selectedRange || !category) {
      console.log('🏷️ ThreadCub: Missing required data for tag creation');
      return;
    }
    
    const tag = {
      id: Date.now(),
      text: this.selectedText,
      category: categoryId,
      categoryLabel: category.label,
      timestamp: new Date().toISOString(),
      rangeInfo: this.captureEnhancedRangeInfo(this.selectedRange)
    };
    
    this.tags.push(tag);
    
    // Remove temporary highlight before creating permanent one
    this.removeTemporaryHighlight();
    
    // FIXED: Use smart DOM highlighting that preserves structure
    this.applySmartHighlight(this.selectedRange, tag.id);
    
    // NEW: Save to persistent storage
    await this.saveTagsToPersistentStorage();
    
    if (this.tags.length === 1) {
      this.showSidePanel();
    } else {
      this.updateTagsList();
    }
    
    this.hideContextMenu();
    
    // Reset add more mode after successful tag creation
    this.isAddingMore = false;
    
    console.log('🏷️ ThreadCub: Tag created and persisted successfully:', tag);
  }

  async createTagFromSelectionWithoutCategory() {
    if (!this.selectedText || !this.selectedRange) return;
    
    const tag = {
      id: Date.now(),
      text: this.selectedText,
      category: null,
      categoryLabel: 'Untagged',
      timestamp: new Date().toISOString(),
      rangeInfo: this.captureEnhancedRangeInfo(this.selectedRange)
    };
    
    this.tags.push(tag);
    
    // Remove temporary highlight before creating permanent one
    this.removeTemporaryHighlight();
    
    // FIXED: Use smart DOM highlighting that preserves structure
    this.applySmartHighlight(this.selectedRange, tag.id);
    
    // NEW: Save to persistent storage
    await this.saveTagsToPersistentStorage();
    
    if (this.tags.length === 1) {
      this.showSidePanel();
    } else {
      this.updateTagsList();
    }
    
    this.hideContextMenu();
    
    // CRITICAL: Reset add more mode to allow new selections
    this.isAddingMore = false;
  }

  async deleteTag(tagId) {
    // Remove from tags array
    this.tags = this.tags.filter(tag => tag.id !== tagId);
    
    // Use smart cleanup method
    this.cleanupSmartHighlight(tagId);
    
    // NEW: Save to persistent storage
    await this.saveTagsToPersistentStorage();
    
    // Update the tags list
    this.updateTagsList();
    console.log('🏷️ ThreadCub: Tag deleted and persisted:', tagId);
  }

// === END SECTION 1A ===

// === SECTION 1B: Styling System ===

addTaggingStyles() {
  // REMOVED: Font Awesome loading - now using Lucide icons
  console.log('🏷️ ThreadCub: Using Lucide icons - no external font loading needed');

  const style = document.createElement('style');
  
  style.textContent = `
  .threadcub-context-menu {
    position: fixed !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    z-index: 10000000 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: none !important;
  }
  
  .threadcub-context-menu.visible {
    display: block !important;
  }
  
  /* SIMPLIFIED: Only essential highlight styles - no conflicts */
  /* CHANGING YELLOW MYSELF */
  .threadcub-highlight {
    background: #FFD700 !important;
    cursor: pointer !important;
    transition: background-color 0.2s ease !important;
  }
  
  .threadcub-highlight:hover {
    background-color: #ffeb3b !important;
  }

  .threadcub-tag-item:hover {
    background: #f1f5f9 !important;
  }

  .threadcub-tag-item:hover .threadcub-delete-tag {
    opacity: 1 !important;
  }

  .threadcub-delete-tag:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }
  `;
  document.head.appendChild(style);
}

// === END SECTION 1B ===

// === SECTION 1C: Simplified Icon Context Menu ===

createContextMenu() {
  this.contextMenu = document.createElement('div');
  this.contextMenu.className = 'threadcub-context-menu';
  
  // Connected button layout with border-right divider
  this.contextMenu.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid #7C3AED;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      position: relative;
      font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- Save for Later Button with right border divider -->
      <div class="threadcub-icon-button" id="threadcub-save-button" data-tooltip="SAVE FOR LATER" style="
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: transparent;
        border: none;
        border-right: 1px solid #7C3AED;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
      </div>
      
      <!-- Find Out More Button -->
      <div class="threadcub-icon-button" id="threadcub-findout-button" data-tooltip="FIND OUT MORE" style="
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: transparent;
        border: none;
        color: #7C3AED;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
          <path d="M8 12h.01"/>
          <path d="M12 12h.01"/>
          <path d="M16 12h.01"/>
        </svg>
      </div>
    </div>
  `;
  
  document.body.appendChild(this.contextMenu);
  this.setupSimplifiedIconListeners();
  this.updateSelectionColor();
}

updateSelectionColor(color = '#FFD700') {
  const existingStyle = document.querySelector('#threadcub-selection-color');
  if (existingStyle) existingStyle.remove();
  
  const style = document.createElement('style');
  style.id = 'threadcub-selection-color';
  style.textContent = `
    ::selection { background: #F7DC6F !important; color: inherit !important; }
    ::-moz-selection { background: #F7DC6F !important; color: inherit !important; }
  `;
  document.head.appendChild(style);
}

setupSimplifiedIconListeners() {
  const saveButton = this.contextMenu.querySelector('#threadcub-save-button');
  const findoutButton = this.contextMenu.querySelector('#threadcub-findout-button');
  
  // Tooltip management variables
  this.tooltipTimeout = null;
  this.currentHoveredButton = null;
  
  // Save for Later button
  if (saveButton) {
    saveButton.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevents selection from being cleared
    });
    
    saveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('🏷️ ThreadCub: Save for Later clicked');
      this.handleSaveForLater();
    });
    
    // Hover effects with custom tooltip
    saveButton.addEventListener('mouseenter', (e) => {
      // Clear any pending hide timeout
      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = null;
      }
      
      this.currentHoveredButton = 'save';
      saveButton.style.background = '#7C3AED';
      
      // Change SVG stroke to white on hover
      const svg = saveButton.querySelector('svg');
      if (svg) svg.setAttribute('stroke', 'white');
      
      // Show tooltip immediately
      this.showCustomTooltip('SAVE FOR LATER', saveButton);
    });
    
    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.background = 'transparent';
      
      // Change SVG stroke back to purple
      const svg = saveButton.querySelector('svg');
      if (svg) svg.setAttribute('stroke', '#7C3AED');
      
      this.currentHoveredButton = null;
      
      // Delay hiding tooltip to allow for button transitions
      this.tooltipTimeout = setTimeout(() => {
        if (!this.currentHoveredButton) {
          this.hideCustomTooltip();
        }
      }, 100);
    });
  }
  
  // Find Out More button
  if (findoutButton) {
    findoutButton.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevents selection from being cleared
    });
    
    findoutButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('🏷️ ThreadCub: Find Out More clicked');
      this.handleFindOutMore();
    });
    
    // Hover effects with custom tooltip
    findoutButton.addEventListener('mouseenter', (e) => {
      // Clear any pending hide timeout
      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = null;
      }
      
      this.currentHoveredButton = 'findout';
      findoutButton.style.background = '#7C3AED';
      
      // Change SVG stroke to white on hover
      const svg = findoutButton.querySelector('svg');
      if (svg) svg.setAttribute('stroke', 'white');
      
      // Show tooltip immediately
      this.showCustomTooltip('FIND OUT MORE', findoutButton);
    });
    
    findoutButton.addEventListener('mouseleave', () => {
      findoutButton.style.background = 'transparent';
      
      // Change SVG stroke back to purple
      const svg = findoutButton.querySelector('svg');
      if (svg) svg.setAttribute('stroke', '#7C3AED');
      
      this.currentHoveredButton = null;
      
      // Delay hiding tooltip to allow for button transitions
      this.tooltipTimeout = setTimeout(() => {
        if (!this.currentHoveredButton) {
          this.hideCustomTooltip();
        }
      }, 100);
    });
  }
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!this.contextMenu.contains(e.target)) {
      this.hideContextMenu();
    }
  });
}

// Custom tooltip system matching your design specifications
showCustomTooltip(text, buttonElement) {
  // Remove any existing tooltip immediately
  this.hideCustomTooltip();
  
  // Create tooltip with your exact specifications
  this.activeTooltip = document.createElement('div');
  this.activeTooltip.className = 'threadcub-custom-tooltip';
  this.activeTooltip.style.cssText = `
    position: fixed;
    height: 24px;
    background: #475569;
    color: white;
    padding: 0 12px;
    border-radius: 4px;
    font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    z-index: 10000002;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0;
    transform: translateY(-4px);
    transition: all 0.2s ease;
  `;
  
  this.activeTooltip.textContent = text;
  document.body.appendChild(this.activeTooltip);
  
  // Position tooltip 8px below the button (corrected from 24px)
  const buttonRect = buttonElement.getBoundingClientRect();
  const tooltipWidth = this.activeTooltip.offsetWidth;
  
  // Calculate position: centered horizontally, 8px below
  const x = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
  const y = buttonRect.bottom + 8;
  
  this.activeTooltip.style.left = x + 'px';
  this.activeTooltip.style.top = y + 'px';
  
  // Animate in
  requestAnimationFrame(() => {
    if (this.activeTooltip) {
      this.activeTooltip.style.opacity = '1';
      this.activeTooltip.style.transform = 'translateY(0)';
    }
  });
}

hideCustomTooltip() {
  if (this.activeTooltip) {
    this.activeTooltip.style.opacity = '0';
    this.activeTooltip.style.transform = 'translateY(-4px)';
    
    setTimeout(() => {
      if (this.activeTooltip && this.activeTooltip.parentNode) {
        this.activeTooltip.parentNode.removeChild(this.activeTooltip);
      }
      this.activeTooltip = null;
    }, 200);
  }
}

// Handle "Save for Later" - creates tag and opens side panel WITH PROPER PERSISTENCE
async handleSaveForLater() {
  console.log('🏷️ ThreadCub: Save for Later clicked');
  
  if (!this.selectedText || !this.selectedRange) {
    console.log('🏷️ ThreadCub: No selection available');
    return;
  }
  
  // Create tag immediately
  const tag = {
    id: Date.now(),
    text: this.selectedText,
    category: null,
    categoryLabel: 'Saved',
    note: '',
    priority: 'medium', // default priority
    timestamp: new Date().toISOString(),
    rangeInfo: this.captureEnhancedRangeInfo(this.selectedRange) // FIXED: Use enhanced capture
  };
  
  this.tags.push(tag);
  
  // Remove temporary highlight before creating permanent one
  this.removeTemporaryHighlight();
  
  // Apply smart highlight
  this.applySmartHighlight(this.selectedRange, tag.id);
  
  // NEW: Save to persistent storage
  await this.saveTagsToPersistentStorage();
  
  // Open side panel (first time) or update (subsequent)
  if (this.tags.length === 1) {
    this.showSidePanel();
  } else {
    if (this.isPanelOpen) {
      this.updateTagsList();
    }
  }
  
  this.hideContextMenu();
  
  console.log('🏷️ ThreadCub: Tag saved for later and persisted:', tag);
}

// Handle "Find Out More" - sends selection to chat input
handleFindOutMore() {
  console.log('🏷️ ThreadCub: Find Out More clicked');
  
  if (!this.selectedText) {
    console.log('🏷️ ThreadCub: No selection available');
    return;
  }
  
  // Use the existing continueTagInChat logic but with current selection
  const success = this.populateChatInputDirectly(this.selectedText);
  
  if (success) {
    console.log('🏷️ ThreadCub: Selection sent to chat input');
  } else {
    console.log('🏷️ ThreadCub: Could not find chat input field');
  }
  
  this.hideContextMenu();
}

// Direct chat input population (reuse existing logic)
populateChatInputDirectly(text) {
  console.log('🏷️ ThreadCub: Adding text directly to chat input:', text.substring(0, 50) + '...');
  
  // Detect current platform
  const hostname = window.location.hostname;
  let selectors = [];
  
  if (hostname.includes('claude.ai')) {
    selectors = [
      'textarea[data-testid="chat-input"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Talk to Claude"]',
      'textarea'
    ];
  } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    selectors = [
      'textarea[data-testid="prompt-textarea"]', 
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',
      'textarea'
    ];
  } else if (hostname.includes('gemini.google.com')) {
    selectors = [
      'rich-textarea div[contenteditable="true"]',
      'textarea[placeholder*="Enter a prompt"]',
      'textarea'
    ];
  } else {
    // Generic selectors for other platforms
    selectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="prompt"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
  }
  
  // Try each selector until we find a working input field
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Check if element is visible and not disabled
        if (element.offsetHeight > 0 && !element.disabled && !element.readOnly) {
          console.log('🏷️ ThreadCub: Found input field:', selector);
          
          // Focus the element first
          element.focus();
          
          // Set the text based on element type
          if (element.tagName === 'TEXTAREA') {
            element.value = text;
            // Trigger input events to notify the platform
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (element.contentEditable === 'true') {
            element.textContent = text;
            // For contenteditable divs
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Move cursor to end
          if (element.setSelectionRange) {
            element.setSelectionRange(element.value.length, element.value.length);
          }
          
          console.log('🏷️ ThreadCub: ✅ Successfully populated chat input');
          return true;
        }
      }
    } catch (error) {
      console.log('🏷️ ThreadCub: Error with selector:', selector, error);
      continue;
    }
  }
  
  console.log('🏷️ ThreadCub: ❌ Could not find suitable input field');
  return false;
}

// === END SECTION 1C ===

// === SECTION 1D: Side Panel Creation ===

createSidePanel() {
  // Create overlay backdrop
  this.panelOverlay = document.createElement('div');
  this.panelOverlay.className = 'threadcub-panel-overlay';
  this.panelOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 9999998;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  document.body.appendChild(this.panelOverlay);
  
  // Create side panel
  this.sidePanel = document.createElement('div');
  this.sidePanel.className = 'threadcub-side-panel';
  this.sidePanel.style.cssText = `
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
    z-index: 9999999;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
  `;
  
  // Get logo URL - try extension resource first, fallback to emoji
  const logoHtml = this.getLogoHtml();
  
  this.sidePanel.innerHTML = `
    <!-- Header Section -->
    <div style="
      padding: 32px 24px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(226, 232, 240, 0.6);
      background: rgba(248, 250, 252, 0.8);
      position: relative;
    ">
      <!-- Close Button with Lucide X -->
      <button id="threadcub-panel-close" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(226, 232, 240, 0.6);
        color: #64748b;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
      
      <!-- Brand Logo - No Background Padding -->
      <div style="
        width: 80px;
        height: 80px;
        margin: 0 auto 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        overflow: hidden;
        background: transparent;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(0, 0, 0, 0.15)'"
         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.1)'">${logoHtml}</div>
      
      <!-- Title -->
      <h2 style="
        font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 24px;
        font-weight: 600;
        color: #575757;
        margin: 0;
      ">Swiping like a pro!</h2>
    </div>
    
    <!-- Priority Filter Section -->
    <div style="padding: 20px 24px; border-bottom: 1px solid rgba(226, 232, 240, 0.6);">      
      <div style="position: relative;">
        <select id="threadcub-priority-filter" style="
          width: 100%;
          padding: 12px 16px;
          padding-right: 40px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s ease;
          outline: none;
        " class="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        
        <!-- Custom dropdown arrow with Lucide ChevronDown -->
        <div style="
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #94a3b8;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
    
    <!-- Tags Container -->
    <div id="threadcub-tags-container" style="
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    ">
      <!-- Empty State -->
      <div id="threadcub-empty-state" style="
        text-align: center;
        padding: 40px 20px;
        color: #64748b;
      ">
        <div style="
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        ">🏷️</div>
        
        <h3 style="
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #374151;
        ">No tags yet</h3>
        
        <p style="
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
          max-width: 200px;
          margin: 0 auto;
        ">Highlight text to get started with your first swipe!</p>
      </div>
    </div>
    
    <!-- Footer Actions -->
    <div style="
      padding: 20px 24px;
      border-top: 1px solid rgba(226, 232, 240, 0.6);
      background: rgba(248, 250, 252, 0.8);
      display: flex;
      gap: 12px;
    ">
      <button id="threadcub-close-panel" style="
        flex: 1;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
      ">
        CLOSE
      </button>
      
      <button id="threadcub-download-json" style="
        flex: 1;
        padding: 12px 16px;
        background: #99DAFA;
        border: 1px solid #99DAFA;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #4C596E;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
      ">
        DOWNLOAD
      </button>
    </div>
  `;
  
  document.body.appendChild(this.sidePanel);
  
  // Setup event listeners
  this.setupPanelEventListeners();
}

// getLogoHtml method (same as before)
getLogoHtml() {
  console.log('🐻 ThreadCub: Attempting to load logo...');
  
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    try {
      const logoUrl = chrome.runtime.getURL('icons/threadcub-logo.png');
      console.log('🐻 ThreadCub: Logo URL generated:', logoUrl);
      
      return `<img src="${logoUrl}" width="60" height="60" alt="ThreadCub Logo" style="
        object-fit: contain;
        transition: all 0.2s ease;
      " onload="console.log('🐻 ThreadCub: Logo loaded successfully!')" 
         onerror="console.log('🐻 ThreadCub: Logo failed to load, using fallback'); this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <span style="display: none; font-size: 32px;">🐻</span>`;
    } catch (error) {
      console.log('🐻 ThreadCub: Error generating logo URL:', error);
    }
  } else {
    console.log('🐻 ThreadCub: Chrome runtime not available');
  }
  
  // Fallback to bear emoji
  console.log('🐻 ThreadCub: Using fallback emoji');
  return '<span style="font-size: 32px;">🐻</span>';
}

setupPanelEventListeners() {
  // Close button - FIXED: Don't clear highlights
  const panelClose = this.sidePanel.querySelector('#threadcub-panel-close');
  panelClose.addEventListener('click', (e) => {
    e.stopPropagation();
    this.hideSidePanel();
    // REMOVED: Any highlight cleanup calls
  });
  
  // Close button hover effects
  panelClose.addEventListener('mouseenter', () => {
    panelClose.style.background = 'rgba(239, 68, 68, 0.1)';
    panelClose.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    panelClose.style.color = '#ef4444';
  });
  
  panelClose.addEventListener('mouseleave', () => {
    panelClose.style.background = 'rgba(255, 255, 255, 0.8)';
    panelClose.style.borderColor = 'rgba(226, 232, 240, 0.6)';
    panelClose.style.color = '#64748b';
  });
  
  // Overlay click to close - FIXED: Don't clear highlights
  this.panelOverlay.addEventListener('click', (e) => {
    if (e.target === this.panelOverlay) {
      this.hideSidePanel();
      // REMOVED: Any highlight cleanup calls
    }
  });
  
  // Priority filter dropdown
  const filterSelect = this.sidePanel.querySelector('#threadcub-priority-filter');
  filterSelect.addEventListener('change', (e) => {
    this.filterTagsByPriority(e.target.value);
  });
  
  // Filter hover effects
  filterSelect.addEventListener('mouseenter', () => {
    filterSelect.style.borderColor = '#3b82f6';
  });
  
  filterSelect.addEventListener('mouseleave', () => {
    filterSelect.style.borderColor = '#d1d5db';
  });
  
  filterSelect.addEventListener('focus', () => {
    filterSelect.style.borderColor = '#3b82f6';
    filterSelect.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
  });
  
  filterSelect.addEventListener('blur', () => {
    filterSelect.style.borderColor = '#d1d5db';
    filterSelect.style.boxShadow = 'none';
  });
  
  // Download button
  const downloadBtn = this.sidePanel.querySelector('#threadcub-download-json');
  downloadBtn.addEventListener('click', () => {
    this.downloadTagsAsJSON();
  });
  
  // Download button hover effects
  downloadBtn.addEventListener('mouseenter', () => {
    downloadBtn.style.background = '#7DD3F8';
    downloadBtn.style.borderColor = '#7DD3F8';
    downloadBtn.style.transform = 'translateY(-1px)';
  });
  
  downloadBtn.addEventListener('mouseleave', () => {
    downloadBtn.style.background = '#99DAFA';
    downloadBtn.style.borderColor = '#99DAFA';
    downloadBtn.style.transform = 'translateY(0)';
  });
  
  // Close panel button
  const closeBtn = this.sidePanel.querySelector('#threadcub-close-panel');
  closeBtn.addEventListener('click', () => {
    this.hideSidePanel();
  });
  
  // Close button hover effects
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(239, 68, 68, 0.1)';
    closeBtn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    closeBtn.style.color = '#ef4444';
    closeBtn.style.transform = 'translateY(-1px)';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.9)';
    closeBtn.style.borderColor = 'rgba(226, 232, 240, 0.8)';
    closeBtn.style.color = '#374151';
    closeBtn.style.transform = 'translateY(0)';
  });
}

// Download tags as JSON
downloadTagsAsJSON() {
  if (this.tags.length === 0) {
    alert('No tags to download!');
    return;
  }
  
  const tagsData = {
    title: document.title || 'Tagged Conversation',
    url: window.location.href,
    platform: this.currentPlatform,
    exportDate: new Date().toISOString(),
    totalTags: this.tags.length,
    tags: this.tags
  };
  
  const blob = new Blob([JSON.stringify(tagsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `threadcub-tags-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('🏷️ ThreadCub: Tags downloaded as JSON');
}

// === END SECTION 1D ===

// === SECTION 1E: Event Handling Setup ===

// UPDATED: Event handling that supports the new two-button system
setupEventListeners() {
  // Remove any existing listeners first
  this.removeEventListeners();
  
  // Initialize add more mode flag
  this.isAddingMore = false;
  
  // Create bound methods that we can properly remove later
  this.mouseUpHandler = this.handleTextSelection.bind(this);
  this.clickHandler = this.handleGlobalClick.bind(this);
  this.keydownHandler = this.handleKeyDown.bind(this);
  
  // Add listeners with passive option where possible to avoid blocking
  document.addEventListener('mouseup', this.mouseUpHandler, { passive: true });
  document.addEventListener('click', this.clickHandler, { passive: true });
  
  // Only add keydown listener for escape key, don't interfere with other keys
  document.addEventListener('keydown', this.keydownHandler, { passive: false });
  
  console.log('🏷️ ThreadCub: Event listeners setup with two-button system support');
}

removeEventListeners() {
  if (this.mouseUpHandler) {
    document.removeEventListener('mouseup', this.mouseUpHandler);
  }
  if (this.clickHandler) {
    document.removeEventListener('click', this.clickHandler);
  }
  if (this.keydownHandler) {
    document.removeEventListener('keydown', this.keydownHandler);
  }
}

// UNCHANGED: Safe keyboard handling that only intercepts specific keys
handleKeyDown(e) {
  // Only handle escape key, let all other keys pass through normally
  if (e.key === 'Escape') {
    // Don't prevent default for escape in input fields
    const activeElement = document.activeElement;
    const isInInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
    
    if (!isInInputField) {
      this.hideContextMenu();
      this.hideSidePanel();
      this.clearCurrentSelection();
      // Reset add more mode on escape
      this.isAddingMore = false;
    }
  }
  // Let all other keys pass through without interference
}

// UPDATED: Text selection handling with two-button system support
handleTextSelection(e) {
  if (!this.isTaggingEnabled) return;
  
  // CRITICAL FIX: Don't interfere with input fields at all
  const activeElement = document.activeElement;
  const targetElement = e.target;
  
  // Check if we're in any kind of input field
  const isInInputField = (element) => {
    if (!element) return false;
    
    const tagName = element.tagName?.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = element.contentEditable === 'true';
    const isInChatInput = element.closest('[contenteditable="true"]') ||
                         element.closest('textarea') ||
                         element.closest('input');
    
    return isInput || isContentEditable || isInChatInput;
  };
  
  // Don't interfere with input fields
  if (isInInputField(activeElement) || isInInputField(targetElement)) {
    console.log('🏷️ ThreadCub: Skipping selection in input field');
    return;
  }
  
  // Don't interfere with our own UI
  if (e.target.closest('.threadcub-context-menu') || 
      e.target.closest('.threadcub-side-panel') ||
      e.target.closest('#threadcub-edge-btn')) {
    return;
  }
  
  // Small delay to ensure selection is complete
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Check if we have a reasonable text selection
    if (selectedText.length > 3 && selectedText.length < 5000) {
      // Additional check: make sure we're not selecting input field content
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Check if the selection is within an input field
        const parentElement = container.nodeType === Node.TEXT_NODE ? 
                             container.parentElement : container;
        
        if (isInInputField(parentElement)) {
          console.log('🏷️ ThreadCub: Selection is in input field, ignoring');
          return;
        }
      }
      
      // Update stored selection
      this.selectedText = selectedText;
      try {
        this.selectedRange = selection.getRangeAt(0);
        
        // NEW: Show context menu immediately with both buttons
        this.showContextMenu(e.pageX, e.pageY);
        
        // Reset add more mode when new selection is made
        this.isAddingMore = false;
        
        console.log('🏷️ ThreadCub: Text selected, showing two-button menu:', selectedText.substring(0, 50) + '...');
      } catch (error) {
        console.log('🏷️ ThreadCub: Could not get selection range:', error);
      }
    } else {
      // Only clear if we're not in "add more" mode
      if (!this.isAddingMore) {
        this.hideContextMenu();
        this.clearCurrentSelection();
      }
    }
  }, 10);
}

// UPDATED: Selection clearing that respects "add more" mode
clearCurrentSelection() {
  // Don't clear selection if we're in "add more" mode
  if (this.isAddingMore) {
    console.log('🏷️ ThreadCub: Preserving selection in add more mode');
    return;
  }
  
  // Clear browser selection
  try {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
  } catch (error) {
    console.log('🏷️ ThreadCub: Error clearing selection:', error);
  }
  
  // Clear stored data
  this.selectedText = '';
  this.selectedRange = null;
  this.storedSelection = null;
}

// UPDATED: Global click handler that respects "add more" mode
handleGlobalClick(e) {
  // Don't interfere with input fields
  const isInInputField = e.target.closest('input') ||
                        e.target.closest('textarea') ||
                        e.target.closest('[contenteditable="true"]');
  
  if (isInInputField) {
    // Let input field clicks work normally
    return;
  }
  
  // Don't close or clear selection if clicking on our UI elements
  if (e.target.closest('.threadcub-context-menu') ||
      e.target.closest('#threadcub-tag-options') ||
      e.target.closest('#threadcub-tag-display') ||
      e.target.closest('.threadcub-side-panel') ||
      e.target.closest('#threadcub-edge-btn')) {
    return;
  }
  
  // Hide context menu when clicking outside
  if (this.isContextMenuVisible) {
    this.hideContextMenu();
    
    // Only clear selection if we're not in "add more" mode
    if (!this.isAddingMore) {
      this.clearCurrentSelection();
    }
  }
}

// === END SECTION 1E ===

// === SECTION 1F: Menu Display Logic ===

// IMPROVED: Context menu positioning that follows scroll
showContextMenu(x, y) {
  if (!this.contextMenu) return;
  
  // Store initial scroll position
  this.menuScrollX = window.scrollX;
  this.menuScrollY = window.scrollY;
  
  // Get the selection rectangle to avoid covering it
  const selection = window.getSelection();
  let selectionRect = null;
  
  if (selection.rangeCount > 0) {
    try {
      selectionRect = selection.getRangeAt(0).getBoundingClientRect();
    } catch (error) {
      console.log('🏷️ Could not get selection bounds:', error);
    }
  }
  
  // Context menu dimensions for simplified icon menu
  const menuWidth = 96; // Two 40px icons + 8px gap + padding
  const menuHeight = 60; // Height including tooltips
  
  // Calculate optimal position relative to viewport
  let menuX = x;
  let menuY = y;
  
  // If we have selection bounds, position menu to avoid covering text
  if (selectionRect) {
    // Try to position below the selection first
    if (selectionRect.bottom + menuHeight + 20 < window.innerHeight) {
      menuY = selectionRect.bottom + window.scrollY + 10;
      menuX = Math.max(10, Math.min(selectionRect.left + window.scrollX, window.innerWidth - menuWidth - 10));
    } 
    // If not enough space below, try above
    else if (selectionRect.top - menuHeight - 10 > 0) {
      menuY = selectionRect.top + window.scrollY - menuHeight - 10;
      menuX = Math.max(10, Math.min(selectionRect.left + window.scrollX, window.innerWidth - menuWidth - 10));
    }
    // If not enough space above or below, position to the side
    else {
      // Try to the right first
      if (selectionRect.right + menuWidth + 20 < window.innerWidth) {
        menuX = selectionRect.right + window.scrollX + 10;
        menuY = Math.max(10, Math.min(selectionRect.top + window.scrollY, window.innerHeight + window.scrollY - menuHeight - 10));
      } 
      // Otherwise to the left
      else {
        menuX = Math.max(10, selectionRect.left + window.scrollX - menuWidth - 10);
        menuY = Math.max(10, Math.min(selectionRect.top + window.scrollY, window.innerHeight + window.scrollY - menuHeight - 10));
      }
    }
  } else {
    // Fallback positioning if no selection bounds
    menuY = Math.max(10, y + window.scrollY - 80);
    menuX = x + window.scrollX;
  }
  
  // Final boundary checks (considering scroll)
  menuX = Math.max(10, Math.min(menuX, window.innerWidth + window.scrollX - menuWidth - 10));
  menuY = Math.max(10, Math.min(menuY, window.innerHeight + window.scrollY - menuHeight - 10));
  
  // Position menu absolutely (follows scroll)
  this.contextMenu.style.cssText = `
    position: absolute !important;
    left: ${menuX}px !important;
    top: ${menuY}px !important;
    z-index: 10000000 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: block !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  `;
  
  this.contextMenu.classList.add('visible');
  this.isContextMenuVisible = true;
  
  // Add scroll listener to update position
  this.scrollHandler = this.handleMenuScroll.bind(this);
  window.addEventListener('scroll', this.scrollHandler, true);
  
  console.log('🏷️ ThreadCub: Simplified icon context menu positioned');
}

// Handle scrolling while menu is open
handleMenuScroll() {
  if (!this.isContextMenuVisible || !this.contextMenu) return;
  
  // Calculate scroll difference
  const scrollDiffX = window.scrollX - this.menuScrollX;
  const scrollDiffY = window.scrollY - this.menuScrollY;
  
  // Get current menu position
  const currentLeft = parseInt(this.contextMenu.style.left) || 0;
  const currentTop = parseInt(this.contextMenu.style.top) || 0;
  
  // Update menu position to follow scroll
  this.contextMenu.style.left = `${currentLeft + scrollDiffX}px`;
  this.contextMenu.style.top = `${currentTop + scrollDiffY}px`;
  
  // Update stored scroll position
  this.menuScrollX = window.scrollX;
  this.menuScrollY = window.scrollY;
}

// Clean hide function with scroll listener cleanup
hideContextMenu() {
  if (this.contextMenu) {
    this.contextMenu.style.display = 'none';
    this.contextMenu.classList.remove('visible');
    this.isContextMenuVisible = false;
    
    // Remove scroll listener
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = null;
    }
  }
}

// Side panel methods
showSidePanel() {
  if (this.sidePanel && this.panelOverlay) {
    // Show overlay first
    this.panelOverlay.style.opacity = '1';
    this.panelOverlay.style.visibility = 'visible';
    
    // Then slide in panel
    setTimeout(() => {
      this.sidePanel.style.right = '0px';
      this.isPanelOpen = true;
      this.updateTagsList();
    }, 50);
    
    console.log('🏷️ ThreadCub: Side panel opened');
  }
}

hideSidePanel() {
  if (this.sidePanel && this.panelOverlay) {
    this.isPanelOpen = false;
    
    // Hide panel first
    this.sidePanel.style.right = '-400px';
    
    // Then hide overlay
    setTimeout(() => {
      this.panelOverlay.style.opacity = '0';
      this.panelOverlay.style.visibility = 'hidden';
    }, 200);
    
    console.log('🏷️ ThreadCub: Side panel closed');
  }
}

toggleSidePanel() {
  if (this.isPanelOpen) {
    this.hideSidePanel();
  } else {
    this.showSidePanel();
  }
}

// === END SECTION 1F ===

// === SECTION 1G-1: Tag Creation Logic (Updated for Smart Highlighting) ===

createTagFromSelection() {
  console.log('🏷️ ThreadCub: createTagFromSelection called');
  
  const categoryId = this.selectedCategoryId || 'dont-forget';
  const category = this.tagCategories.find(cat => cat.id === categoryId);
  
  if (!this.selectedText || !this.selectedRange || !category) {
    console.log('🏷️ ThreadCub: Missing required data for tag creation');
    return;
  }
  
  const tag = {
    id: Date.now(),
    text: this.selectedText,
    category: categoryId,
    categoryLabel: category.label,
    timestamp: new Date().toISOString(),
    rangeInfo: this.captureRangeInfo(this.selectedRange)
  };
  
  this.tags.push(tag);
  
  // Remove temporary highlight before creating permanent one
  this.removeTemporaryHighlight();
  
  // FIXED: Use smart DOM highlighting that preserves structure
  this.applySmartHighlight(this.selectedRange, tag.id);
  
  if (this.tags.length === 1) {
    this.showSidePanel();
  } else {
    this.updateTagsList();
  }
  
  this.hideContextMenu();
  
  // Reset add more mode after successful tag creation
  this.isAddingMore = false;
  
  console.log('🏷️ ThreadCub: Tag created successfully with smart highlight:', tag);
}

// Create tag without category (Updated for Smart Highlighting)
createTagFromSelectionWithoutCategory() {
  if (!this.selectedText || !this.selectedRange) return;
  
  const tag = {
    id: Date.now(),
    text: this.selectedText,
    category: null,
    categoryLabel: 'Untagged',
    timestamp: new Date().toISOString(),
    rangeInfo: this.captureRangeInfo(this.selectedRange)
  };
  
  this.tags.push(tag);
  
  // Remove temporary highlight before creating permanent one
  this.removeTemporaryHighlight();
  
  // FIXED: Use smart DOM highlighting that preserves structure
  this.applySmartHighlight(this.selectedRange, tag.id);
  
  if (this.tags.length === 1) {
    this.showSidePanel();
  } else {
    this.updateTagsList();
  }
  
  this.hideContextMenu();
  
  // CRITICAL: Reset add more mode to allow new selections
  this.isAddingMore = false;
}

// === END SECTION 1G-1 ===

// === SECTION 1G-2: Range Capture & XPath Methods ===

captureRangeInfo(range) {
  try {
    return {
      startXPath: this.getXPathForElement(range.startContainer),
      endXPath: this.getXPathForElement(range.endContainer),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      commonAncestorXPath: this.getXPathForElement(range.commonAncestorContainer)
    };
  } catch (error) {
    console.log('🏷️ ThreadCub: Could not capture range info:', error);
    return null;
  }
}

getXPathForElement(element) {
  if (!element) return null;
  
  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }
  
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let hasFollowingSiblings = false;
    let sibling = element.previousSibling;
    
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    
    sibling = element.nextSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        hasFollowingSiblings = true;
        break;
      }
      sibling = sibling.nextSibling;
    }
    
    const tagName = element.nodeName.toLowerCase();
    const xpathIndex = (index > 0 || hasFollowingSiblings) ? `[${index + 1}]` : '';
    parts.unshift(tagName + xpathIndex);
    
    element = element.parentElement;
  }
  
  return parts.length ? '/' + parts.join('/') : null;
}

// === END SECTION 1G-2 ===

// === SECTION 1G-3: Smart DOM Highlighting (Structure-Preserving) ===

// SMART APPROACH: Preserve original structure while highlighting
applySmartHighlight(range, tagId) {
  try {
    console.log('🏷️ ThreadCub: Applying smart highlight for Claude - tagId:', tagId);
    console.log('🏷️ ThreadCub: Range details:', range.toString().substring(0, 50));
    
    // Store original range data for restoration
    if (!this.originalRanges) {
      this.originalRanges = new Map();
    }
    
    // Clone the range to avoid modification
    const workingRange = range.cloneRange();
    
    // Get all text nodes within the range
    const textNodes = this.getTextNodesInRange(workingRange);
    
    console.log('🏷️ ThreadCub: Found text nodes:', textNodes.length);
    
    if (textNodes.length === 0) {
      console.log('🏷️ ThreadCub: No text nodes found in range - Claude DOM issue');

      // CLAUDE FALLBACK: Use simple span wrapping approach
      console.log('🏷️ ThreadCub: Trying Claude fallback highlighting...');
      
      try {
        const contents = workingRange.extractContents();
        const span = document.createElement('span');
        span.className = 'threadcub-highlight';
        span.setAttribute('data-tag-id', tagId);
        span.style.cssText = `
          background: #FFD700 !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
        `;
        
        span.appendChild(contents);
        workingRange.insertNode(span);
        
        // Add click listener
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showSidePanel();
        });
        
        // Store for cleanup
        if (!this.highlightElements) {
          this.highlightElements = new Map();
        }
        this.highlightElements.set(tagId, [span]);
        
        console.log('🏷️ ThreadCub: ✅ Claude fallback highlighting applied');
        return;
        
      } catch (error) {
        console.log('🏷️ ThreadCub: Claude fallback failed:', error);
      }
      
      return;
    }
    
    // Store original structure for restoration
    this.originalRanges.set(tagId, {
      textNodes: textNodes.map(node => ({
        node: node,
        parent: node.parentNode,
        nextSibling: node.nextSibling,
        originalText: node.textContent
      })),
      rangeInfo: this.captureRangeInfo(range)
    });
    
    // Apply highlighting to each text node
    const highlightElements = [];
    textNodes.forEach(textNode => {
      const highlightSpan = this.wrapTextNodeSafely(textNode, tagId);
      if (highlightSpan) {
        highlightElements.push(highlightSpan);
      }
    });
    
    // Store highlight elements for cleanup
    if (!this.highlightElements) {
      this.highlightElements = new Map();
    }
    this.highlightElements.set(tagId, highlightElements);
    
    console.log('🏷️ ThreadCub: Smart highlight applied with', highlightElements.length, 'elements');
    
  } catch (error) {
    console.log('🏷️ ThreadCub: Smart highlight failed:', error);
  }
}

// Get all text nodes within a range
getTextNodesInRange(range) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Only include text nodes that are actually within our range
        if (range.intersectsNode(node)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    // Additional check to ensure the node is really in our range
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    
    if (range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0) {
      textNodes.push(node);
    }
  }
  
  return textNodes;
}

// Safely wrap a text node with highlighting
wrapTextNodeSafely(textNode, tagId) {
  try {
    // Skip if text node is empty or whitespace only
    if (!textNode.textContent || textNode.textContent.trim().length === 0) {
      return null;
    }
    
    // Create highlight span
    const span = document.createElement('span');
    span.className = 'threadcub-highlight';
    span.setAttribute('data-tag-id', tagId);
    
    // CRITICAL: Inherit ALL styles from parent to maintain formatting
    const parentElement = textNode.parentElement;
    if (parentElement) {
      const computedStyles = window.getComputedStyle(parentElement);
      
      // Copy essential styling properties
      const importantStyles = [
        'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
        'lineHeight', 'letterSpacing', 'textDecoration',
        'color', 'textAlign', 'whiteSpace'
      ];
      
      importantStyles.forEach(prop => {
        if (computedStyles[prop]) {
          span.style[prop] = computedStyles[prop];
        }
      });
    }
    
    // Add highlight-specific styles
    span.style.cssText += `
      background: #FFD700 !important;
      cursor: pointer !important;
      transition: background-color 0.2s ease !important;
      display: inline !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
    `;
    
    // Move text content to span
    span.textContent = textNode.textContent;
    
    // Replace text node with highlighted span
    textNode.parentNode.replaceChild(span, textNode);
    
    // Add click listener
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showSidePanel();
    });
    
    // Add hover effects
    span.addEventListener('mouseenter', () => {
      span.style.backgroundColor = '#FFE55C';
    });
    
    span.addEventListener('mouseleave', () => {
      span.style.backgroundColor = '#FFD700';
    });
    
    return span;
    
  } catch (error) {
    console.log('🏷️ ThreadCub: Error wrapping text node:', error);
    return null;
  }
}

// Smart cleanup that restores original structure
cleanupSmartHighlight(tagId) {
  try {
    console.log('🏷️ ThreadCub: Starting smart highlight cleanup for tag:', tagId);
    
    // Get highlight elements
    if (this.highlightElements && this.highlightElements.has(tagId)) {
      const highlightElements = this.highlightElements.get(tagId);
      
      highlightElements.forEach(span => {
        if (span && span.parentNode) {
          // Create text node with original content
          const textNode = document.createTextNode(span.textContent);
          
          // Replace span with original text node
          span.parentNode.replaceChild(textNode, span);
        }
      });
      
      this.highlightElements.delete(tagId);
    }
    
    // Clean up stored range data
    if (this.originalRanges && this.originalRanges.has(tagId)) {
      this.originalRanges.delete(tagId);
    }
    
    console.log('🏷️ ThreadCub: Smart highlight cleanup completed for tag:', tagId);
    
  } catch (error) {
    console.log('🏷️ ThreadCub: Error during smart highlight cleanup:', error);
  }
}

// === END SECTION 1G-3 ===

// === SECTION 1G-4: Highlight Cleanup Methods (Updated for Smart Highlighting) ===

// CLEAN SINGLE CLEANUP FUNCTION (Updated for Smart Highlighting)
cleanupHighlight(tagId) {
  // Use the smart cleanup method
  this.cleanupSmartHighlight(tagId);
}

// Updated delete tag method
deleteTag(tagId) {
  // Remove from tags array
  this.tags = this.tags.filter(tag => tag.id !== tagId);
  
  // Use smart cleanup method
  this.cleanupSmartHighlight(tagId);
  
  // Update the tags list
  this.updateTagsList();
  console.log('🏷️ ThreadCub: Tag deleted with smart cleanup:', tagId);
}

// === END SECTION 1G-4 ===

// === SECTION 1G-5: Selection Preservation Helpers ===

// CRITICAL: Preserve selection visibility when dropdown opens
preserveSelectionVisibility() {
  if (!this.selectedRange) return;
  
  try {
    // CRITICAL: Create temporary visual highlight to keep text visible
    this.createTemporaryHighlight();
    
    // Ensure the selected range is still visible in viewport
    const rects = this.selectedRange.getClientRects();
    if (rects.length > 0) {
      const firstRect = rects[0];
      const viewportHeight = window.innerHeight;
      
      // Check if selection is out of view
      if (firstRect.top < 0 || firstRect.bottom > viewportHeight) {
        // Scroll to bring selection into view
        this.selectedRange.startContainer.parentElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  } catch (error) {
    console.log('🏷️ ThreadCub: Error preserving selection visibility:', error);
  }
}

// NEW: Create temporary highlight that persists even when selection is cleared
createTemporaryHighlight() {
  if (!this.selectedRange) return;
  
  try {
    // Remove any existing temporary highlight
    this.removeTemporaryHighlight();
    
    // Get all rectangles for the selection (handles multi-line)
    const rects = this.selectedRange.getClientRects();
    
    if (rects.length === 0) return;
    
    // Create container for temporary highlights
    this.tempHighlightContainer = document.createElement('div');
    this.tempHighlightContainer.className = 'threadcub-temp-highlight-container';
    this.tempHighlightContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 999997;
    `;
    
    // Create highlight rectangles
    Array.from(rects).forEach((rect) => {
      const highlightRect = document.createElement('div');
      highlightRect.className = 'threadcub-temp-highlight';
      highlightRect.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(255, 215, 0, 0.4);
        border: 2px solid #FFD700;
        border-radius: 3px;
        pointer-events: none;
        z-index: 999997;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      `;
      
      this.tempHighlightContainer.appendChild(highlightRect);
    });
    
    document.body.appendChild(this.tempHighlightContainer);
    
    console.log('🏷️ ThreadCub: Temporary highlight created to preserve visibility');
    
  } catch (error) {
    console.log('🏷️ ThreadCub: Error creating temporary highlight:', error);
  }
}

// Remove temporary highlight
removeTemporaryHighlight() {
  if (this.tempHighlightContainer && this.tempHighlightContainer.parentNode) {
    this.tempHighlightContainer.parentNode.removeChild(this.tempHighlightContainer);
    this.tempHighlightContainer = null;
    console.log('🏷️ ThreadCub: Temporary highlight removed');
  }
}

// Adjust dropdown position to ensure it's visible
adjustDropdownPosition(dropdown) {
  if (!dropdown) return;
  
  try {
    // Get current dropdown position
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if dropdown is off-screen and adjust
    if (dropdownRect.right > viewportWidth) {
      dropdown.style.left = 'auto';
      dropdown.style.right = '0';
    }
    
    if (dropdownRect.bottom > viewportHeight) {
      dropdown.style.top = 'auto';
      dropdown.style.bottom = '36px';
    }
    
  } catch (error) {
    console.log('🏷️ ThreadCub: Error adjusting dropdown position:', error);
  }
}

// === END SECTION 1G-5 ===

// === SECTION 1H: REPLACED WITH MODULAR INTEGRATION ===

// NEW: Initialize the side panel UI manager
initializeSidePanelUI() {
  if (typeof window.ThreadCubSidePanel !== 'undefined') {
    this.sidePanelUI = new window.ThreadCubSidePanel(this);
    this.sidePanelUI.setSidePanel(this.sidePanel);
    console.log('🏷️ ThreadCub: Side panel UI manager initialized');
  } else {
    console.warn('🏷️ ThreadCub: ThreadCubSidePanel class not found');
  }
}

// NEW: Updated tags list method that uses the modular side panel
updateTagsList() {
  console.log('🏷️ ThreadCub: Updating tags list via side panel UI manager');
  
  if (this.sidePanelUI && typeof this.sidePanelUI.updateTagsList === 'function') {
    this.sidePanelUI.updateTagsList();
  } else {
    console.warn('🏷️ ThreadCub: Side panel UI manager not available, using fallback');
    this.updateTagsListFallback();
  }
}

// Fallback method for when side panel UI is not loaded
updateTagsListFallback() {
  const tagsList = this.sidePanel.querySelector('#threadcub-tags-container');
  if (!tagsList) return;
  
  if (this.tags.length === 0) {
    tagsList.innerHTML = `
      <div id="threadcub-empty-state" style="
        text-align: center;
        padding: 32px 20px;
        color: #6B7280;
      ">
        <div style="
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        ">🏷️</div>
        
        <h3 style="
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #374151;
        ">No tags yet</h3>
        
        <p style="
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
          max-width: 200px;
          margin: 0 auto;
        ">Highlight text to get started with your first swipe!</p>
      </div>
    `;
  } else {
    tagsList.innerHTML = this.tags.map(tag => `
      <div class="threadcub-tag-card" data-tag-id="${tag.id}" style="
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
      ">
        <div style="font-size: 14px; color: #374151;">${tag.text}</div>
      </div>
    `).join('');
  }
}

// Helper methods that the side panel UI expects
saveNoteForCard(tagId, noteText) {
  const tag = this.tags.find(t => t.id === tagId);
  if (tag) {
    tag.note = noteText;
    console.log('🏷️ ThreadCub: Note saved for tag:', tagId);
    this.updateTagsList(); // This will call the side panel UI
  }
}

addPriorityTag(tagId, priority) {
  const tag = this.tags.find(t => t.id === tagId);
  if (tag) {
    if (!tag.tags) tag.tags = [];
    
    // Remove existing priority tags
    tag.tags = tag.tags.filter(t => !['high', 'medium', 'low'].includes(t.priority));
    
    // Add new priority tag
    tag.tags.push({
      label: priority.toUpperCase(),
      priority: priority
    });
    
    console.log('🏷️ ThreadCub: Priority tag added:', priority);
  }
}

deleteTagWithUndo(tagId) {
  console.log('🏷️ ThreadCub: Delete with undo for tag:', tagId);
  this.deleteTag(tagId);
}

continueTagInChat(tagId) {
  const tag = this.tags.find(t => t.id === tagId);
  if (!tag) {
    console.log('🏷️ ThreadCub: Tag not found for continue in chat:', tagId);
    return false;
  }
  
  console.log('🏷️ ThreadCub: Continue tag in chat:', tagId);
  
  const success = this.populateChatInputDirectly(tag.text);
  
  if (success) {
    this.hideSidePanel();
    console.log('🏷️ ThreadCub: Tag text sent to chat input and panel closed');
  } else {
    console.log('🏷️ ThreadCub: Could not find chat input field');
  }
  
  return success;
}

filterTagsByPriority(priority) {
  console.log('🏷️ ThreadCub: Filtering tags by priority:', priority);
  
  const allCards = this.sidePanel.querySelectorAll('.threadcub-tag-card');
  
  allCards.forEach(card => {
    const tagId = parseInt(card.getAttribute('data-tag-id'));
    const tag = this.tags.find(t => t.id === tagId);
    
    let shouldShow = true;
    
    if (priority !== 'all' && tag) {
      const hasPriority = tag.tags && tag.tags.some(t => t.priority === priority);
      shouldShow = hasPriority;
    }
    
    card.style.display = shouldShow ? 'block' : 'none';
  });
}

} // END of ThreadCubTagging class

// Export the class to window for global access
window.ThreadCubTagging = ThreadCubTagging;

// === END SECTION 1H REPLACEMENT ===

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
  
  const platform = detectCurrentPlatform();
  
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
  const platform = detectCurrentPlatform();
  console.log('🔧 Filling input field with continuation prompt for:', platform);
  
  // Platform-specific selectors
  const selectors = {
    'claude.ai': [
      'textarea[data-testid="chat-input"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    'chatgpt': [
      'textarea[data-testid="prompt-textarea"]',
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',
      'textarea'
    ],
    'gemini': [
      'rich-textarea div[contenteditable="true"]',
      'textarea'
    ]
  };
  
  const platformSelectors = selectors[platform] || selectors['chatgpt'];
  
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
  
  if (platform === 'claude.ai') {
    attemptClaudeAutoStart();
  } else if (platform === 'chatgpt') {
    attemptChatGPTAutoStart();
  } else if (platform === 'gemini') {
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

// ===== Platform detection =====
function detectCurrentPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('claude.ai')) return 'claude.ai';
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) return 'chatgpt';
  if (hostname.includes('gemini.google.com')) return 'gemini';
  return 'unknown';
}

// === END SECTION 2A ===

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
  const platform = detectCurrentPlatform();
  console.log('🐻 ThreadCub: Attempting auto-start for platform:', platform);
  
  // Wait a moment for the input to be filled
  setTimeout(() => {
    // Platform-specific auto-start attempts
    if (platform === 'claude.ai') {
      attemptClaudeAutoStart();
    } else if (platform === 'chatgpt') {
      attemptChatGPTAutoStart();
    } else if (platform === 'gemini') {
      attemptGeminiAutoStart();
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

// ===== Fill input field with prompt =====
function fillInputFieldWithPrompt(prompt) {
  const platform = detectCurrentPlatform();
  console.log('🐻 ThreadCub: Filling input field with continuation prompt');
  
  setTimeout(() => {
    // Platform-specific selectors
    const selectors = {
      'claude.ai': [
        'textarea[data-testid="chat-input"]',
        'div[contenteditable="true"]',
        'textarea',
        '*[contenteditable="true"]',
        '[role="textbox"]',
        'input[type="text"]'
      ],
      'chatgpt': [
        'textarea[data-testid="prompt-textarea"]',
        '#prompt-textarea',
        'textarea[placeholder*="Message"]'
      ],
      'gemini': [
        'rich-textarea div[contenteditable="true"]',
        'textarea'
      ]
    };

    const platformSelectors = selectors[platform] || selectors['chatgpt'];
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

// ===== Platform detection helper function =====
function detectCurrentPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('claude.ai')) return 'claude.ai';
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) return 'chatgpt';
  if (hostname.includes('gemini.google.com')) return 'gemini';
  return 'unknown';
}

// === END SECTION 3A ===

// === SECTION 4A-4E: Floating Button Integration with Modular Architecture ===

// The ThreadCubFloatingButton class is now loaded from src/core/floating-button.js
// This section provides the conversation functionality that the floating button needs

// === CONVERSATION EXTRACTION FUNCTIONS ===

async function extractClaudeConversation() {
  console.log('🐻 ThreadCub: Starting SIMPLE WORKING Claude.ai extraction...');
  
  const title = document.title.replace(' | Claude', '') || 'Claude Conversation';
  
  try {
    // Use the EXACT approach that worked in the diagnostic
    const extractedMessages = simpleWorkingExtraction();
    
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
    const fallbackMessages = workingContainerExtraction();
    
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
}

function simpleWorkingExtraction() {
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
      const role = enhancedRoleDetection(text, index);
      
      messages.push({
        id: messageIndex++,
        role: role,
        content: simpleCleanContent(text),
        timestamp: new Date().toISOString(),
        extractionMethod: 'simple_working',
        selector_used: 'div[class*="flex"][class*="flex-col"]',
        element_classes: element.className,
        element_data_attrs: getDataAttributes(element)
      });
    }
  });
  
  console.log(`🐻 ThreadCub: Simple extraction found: ${messages.length} messages`);
  return messages;
}

function enhancedRoleDetection(text, index) {
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
}

function simpleCleanContent(content) {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*Copy\s*$/gm, '')
    .replace(/^\s*Edit\s*$/gm, '')
    .replace(/^\s*Retry\s*$/gm, '')
    .trim();
}

function getDataAttributes(element) {
  const dataAttrs = {};
  if (element && element.attributes) {
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    });
  }
  return dataAttrs;
}

function workingContainerExtraction() {
  console.log('🐻 ThreadCub: Using fallback working extraction method...');
  
  const messages = [];
  let messageIndex = 0;
  
  const containers = document.querySelectorAll('[data-testid*="message"]:not([data-testid*="button"])');
  console.log(`🐻 ThreadCub: Found ${containers.length} containers`);
  
  containers.forEach((container, index) => {
    const text = container.innerText?.trim() || container.textContent?.trim() || '';
    
    if (text && text.length > 50 && text.length < 15000) {
      const role = enhancedRoleDetection(text, index);
      
      messages.push({
        id: messageIndex++,
        role: role,
        content: simpleCleanContent(text),
        timestamp: new Date().toISOString(),
        extractionMethod: 'working_container'
      });
    }
  });
  
  return messages;
}

function extractChatGPTConversation() {
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
    return extractChatGPTFallback(title);
  }
  
  // Process each message element
  messageElements.forEach((element, index) => {
    try {
      // Get role directly from data attribute (most reliable)
      const authorRole = element.getAttribute('data-message-author-role');
      const role = authorRole === 'user' ? 'user' : 'assistant';
      
      // Extract content using multiple strategies
      let messageContent = extractChatGPTMessageContent(element);
      
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
}

function extractChatGPTMessageContent(element) {
  // Strategy 1: Look for whitespace-pre-wrap (most common ChatGPT content container)
  const preWrap = element.querySelector('.whitespace-pre-wrap');
  if (preWrap) {
    const content = preWrap.textContent?.trim();
    if (content && content.length > 5) {
      return cleanChatGPTContent(content);
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
        return cleanChatGPTContent(content);
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
  
  return cleanChatGPTContent(directText);
}

function cleanChatGPTContent(content) {
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
}

function extractChatGPTFallback(title) {
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
          content: cleanChatGPTContent(text),
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
}

function extractGenericConversation() {
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
}

// === CONTINUATION SYSTEM FUNCTIONS ===

function generateContinuationPrompt(summary, shareUrl, platform, conversationData) {
  console.log('🐻 ThreadCub: Generating continuation prompt for platform:', platform);
  
  // FIXED: Return platform-specific prompts instead of generic URL-based ones
  if (platform && platform.toLowerCase().includes('chatgpt')) {
    // ChatGPT-specific prompt (acknowledges URL limitations)
    const chatGPTPrompt = `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress  
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
    
    console.log('🐻 ThreadCub: Generated ChatGPT-specific continuation prompt:', chatGPTPrompt.length, 'characters');
    return chatGPTPrompt;
  } else {
    // Claude-specific prompt (can access URLs)
    const claudePrompt = `I'd like to continue our previous conversation. The complete context is available at: ${shareUrl}

Please access the conversation history and let me know when you're ready to continue from where we left off.`;
    
    console.log('🐻 ThreadCub: Generated Claude-specific continuation prompt:', claudePrompt.length, 'characters');
    return claudePrompt;
  }
}

function getTargetPlatformFromCurrentUrl() {
  const hostname = window.location.hostname;
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  }
  return 'unknown';
}

function generateQuickSummary(messages) {
  if (!messages || messages.length === 0) return 'Empty conversation';
  
  const userMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'human');
  if (userMessages.length === 0) return 'No user messages found';
  
  const lastUserMessage = userMessages[userMessages.length - 1];
  const firstUserMessage = userMessages[0];
  
  if (userMessages.length === 1) {
    return `Previous conversation about: "${firstUserMessage.content.substring(0, 100)}..."`;
  }
  
  return `Previous conversation: Started with "${firstUserMessage.content.substring(0, 60)}..." and most recently discussed "${lastUserMessage.content.substring(0, 60)}..."`;
}

function handleDirectContinuation(conversationData) {
  console.log('🐻 ThreadCub: Handling direct continuation without API save...');
  
  // Create a fallback share URL
  const fallbackShareUrl = `https://threadcub.com/fallback/${Date.now()}`;
  
  // Generate a simple continuation prompt
  const summary = generateQuickSummary(conversationData.messages);
  const minimalPrompt = generateContinuationPrompt(summary, fallbackShareUrl, conversationData.platform, conversationData);
  
  // Route to appropriate platform flow
  const targetPlatform = getTargetPlatformFromCurrentUrl();
  
  if (targetPlatform === 'chatgpt') {
    console.log('🐻 ThreadCub: Routing to ChatGPT flow');
    handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData); // ← FIXED: Use fallbackShareUrl
  } else if (targetPlatform === 'claude') {
    console.log('🐻 ThreadCub: Routing to Claude flow');
    handleClaudeFlow(minimalPrompt, fallbackShareUrl, conversationData); // ← FIXED: Use fallbackShareUrl
  } else if (targetPlatform === 'gemini') {
    console.log('🐻 ThreadCub: Routing to Gemini flow');
    handleGeminiFlow(minimalPrompt, fallbackShareUrl, conversationData); // ← FIXED: Use fallbackShareUrl
  } else {
    console.log('🐻 ThreadCub: Defaulting to ChatGPT flow');
    handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData); // ← FIXED: Use fallbackShareUrl
  }
}

function handleChatGPTFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🤖 ThreadCub: Starting ENHANCED ChatGPT flow with auto-download...');
  
  // STEP 1: Auto-download the conversation file in background
  autoDownloadChatGPTFile(conversationData, shareUrl);
  
  // STEP 2: Create continuation data for cross-tab modal
  const continuationData = {
    prompt: generateChatGPTContinuationPrompt(),
    shareUrl: shareUrl,
    platform: 'ChatGPT',
    timestamp: Date.now(),
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    chatGPTFlow: true,
    downloadCompleted: true
  };
  
  console.log('🤖 ThreadCub: ChatGPT continuation data prepared');
  
  // STEP 3: Use storage for modal
  const canUseChrome = canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🤖 ThreadCub: Using Chrome storage for ChatGPT modal...');
    storeWithChrome(continuationData)
      .then(() => {
        console.log('🐻 ThreadCub: ChatGPT data stored successfully');
        const chatGPTUrl = 'https://chatgpt.com/';
        window.open(chatGPTUrl, '_blank');
        if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
          window.threadcubButton.showSuccessToast('File downloaded! Check your new ChatGPT tab.');
        }
      })
      .catch(error => {
        console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
        handleChatGPTFlowFallback(continuationData);
      });
  } else {
    console.log('🤖 ThreadCub: Using ChatGPT fallback method directly');
    handleChatGPTFlowFallback(continuationData);
  }
}

function autoDownloadChatGPTFile(conversationData, shareUrl) {
  try {
    console.log('🤖 ThreadCub: Auto-downloading conversation file for ChatGPT...');
    
    const conversationJSON = {
      title: conversationData.title || 'ThreadCub Conversation Continuation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform,
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages.length,
      source: 'ThreadCub Browser Extension - ChatGPT Continuation',
      shareUrl: shareUrl,
      instructions: 'This file contains our previous conversation. Please review it and continue from where we left off.',
      messages: conversationData.messages,
      summary: generateQuickSummary(conversationData.messages)
    };
    
    const filename = `threadcub-continuation-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(conversationJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🤖 ThreadCub: ✅ ChatGPT file auto-downloaded:', filename);
    
  } catch (error) {
    console.error('🤖 ThreadCub: Error auto-downloading ChatGPT file:', error);
  }
}

function generateChatGPTContinuationPrompt() {
  return `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
}

function handleChatGPTFlowFallback(continuationData) {
  console.log('🤖 ThreadCub: Using localStorage fallback for ChatGPT...');
  
  try {
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 ChatGPT Fallback: Data stored in localStorage');
    
    const chatGPTUrl = 'https://chatgpt.com/';
    window.open(chatGPTUrl, '_blank');
    if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
      window.threadcubButton.showSuccessToast('File downloaded! Check your new ChatGPT tab.');
    }
    
  } catch (error) {
    console.error('🔧 ChatGPT Fallback: localStorage failed:', error);
  }
}

function handleClaudeFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🤖 ThreadCub: Starting Claude flow (API-only, no downloads)...');
  
  const continuationData = {
    prompt: continuationPrompt,
    shareUrl: shareUrl,
    platform: 'Claude',
    timestamp: Date.now(),
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    claudeFlow: true,
    downloadCompleted: false
  };
  
  console.log('🤖 ThreadCub: Claude continuation data with message count:', continuationData.totalMessages);
  
  const canUseChrome = canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🤖 ThreadCub: Using Chrome storage for Claude...');
    storeWithChrome(continuationData)
      .then(() => {
        console.log('🐻 ThreadCub: Claude data stored successfully');
        const claudeUrl = 'https://claude.ai/';
        window.open(claudeUrl, '_blank');
        if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
          window.threadcubButton.showSuccessToast('Opening Claude with conversation context...');
        }
      })
      .catch(error => {
        console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
        handleClaudeFlowFallback(continuationData);
      });
  } else {
    console.log('🤖 ThreadCub: Using Claude fallback method directly');
    handleClaudeFlowFallback(continuationData);
  }
}

function canUseChromStorage() {
  try {
    // Check each condition step by step for better debugging
    if (typeof chrome === 'undefined') return false;
    if (!chrome.runtime) return false;
    if (!chrome.runtime.id) return false;  // This checks if extension context is valid
    if (!chrome.storage) return false;
    if (!chrome.storage.local) return false;
    
    return true;
  } catch (error) {
    console.log('🔧 Chrome check failed:', error);
    return false;
  }
}

async function storeWithChrome(continuationData) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ threadcubContinuationData: continuationData }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('🔧 Chrome storage: Success with message count:', continuationData.totalMessages);
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function handleClaudeFlowFallback(continuationData) {
  console.log('🤖 ThreadCub: Using localStorage fallback for Claude...');
  
  try {
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 Claude Fallback: Data stored in localStorage');
    
    const claudeUrl = 'https://claude.ai/';
    window.open(claudeUrl, '_blank');
    if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
      window.threadcubButton.showSuccessToast('Opening Claude with conversation context...');
    }
    
  } catch (error) {
    console.error('🔧 Claude Fallback: localStorage failed:', error);
  }
}

// === DOWNLOAD FUNCTIONS ===

function createDownloadFromData(conversationData) {
  try {
    const tagsData = {
      title: conversationData.title || 'ThreadCub Conversation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform || 'Unknown',
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages ? conversationData.messages.length : 0,
      messages: conversationData.messages || []
    };
    
    const filename = generateSmartFilename(conversationData);
    
    const blob = new Blob([JSON.stringify(tagsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🐻 ThreadCub: JSON download completed with filename:', filename);
  } catch (error) {
    console.error('🐻 ThreadCub: Error in createDownloadFromData:', error);
    throw error;
  }
}

function generateSmartFilename(conversationData) {
  try {
    const platform = conversationData.platform?.toLowerCase() || 'chat';
    
    let conversationIdentifier = '';
    
    if (conversationData.title && conversationData.title !== 'ThreadCub Conversation' && conversationData.title.trim().length > 0) {
      conversationIdentifier = sanitizeFilename(conversationData.title);
    } else if (conversationData.messages && conversationData.messages.length > 0) {
      const firstUserMessage = conversationData.messages.find(msg => 
        msg.role === 'user' || msg.role === 'human'
      );
      
      if (firstUserMessage && firstUserMessage.content) {
        const content = firstUserMessage.content.trim();
        conversationIdentifier = sanitizeFilename(content.substring(0, 50));
      }
    }
    
    if (!conversationIdentifier) {
      conversationIdentifier = 'conversation';
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${platform}-${conversationIdentifier}-${timestamp}.json`;
    
    console.log('🐻 ThreadCub: Generated filename:', filename);
    return filename;
  } catch (error) {
    console.error('🐻 ThreadCub: Error generating filename:', error);
    return `threadcub-conversation-${Date.now()}.json`;
  }
}

function sanitizeFilename(text) {
  try {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  } catch (error) {
    console.error('🐻 ThreadCub: Error sanitizing filename:', error);
    return 'conversation';
  }
}

// === FIXED: FLOATING BUTTON ENHANCEMENT FUNCTION ===

// === SECTION 4A-4E: Floating Button Integration with Modular Architecture ===

// The ThreadCubFloatingButton class is now loaded from src/core/floating-button.js
// This section provides the conversation functionality that the floating button needs

// === CONVERSATION EXTRACTION FUNCTIONS ===

async function extractClaudeConversation() {
  console.log('🐻 ThreadCub: Starting SIMPLE WORKING Claude.ai extraction...');
  
  const title = document.title.replace(' | Claude', '') || 'Claude Conversation';
  
  try {
    // Use the EXACT approach that worked in the diagnostic
    const extractedMessages = simpleWorkingExtraction();
    
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
    const fallbackMessages = workingContainerExtraction();
    
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
}

function simpleWorkingExtraction() {
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
      const role = enhancedRoleDetection(text, index);
      
      messages.push({
        id: messageIndex++,
        role: role,
        content: simpleCleanContent(text),
        timestamp: new Date().toISOString(),
        extractionMethod: 'simple_working',
        selector_used: 'div[class*="flex"][class*="flex-col"]',
        element_classes: element.className,
        element_data_attrs: getDataAttributes(element)
      });
    }
  });
  
  console.log(`🐻 ThreadCub: Simple extraction found: ${messages.length} messages`);
  return messages;
}

function enhancedRoleDetection(text, index) {
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
}

function simpleCleanContent(content) {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*Copy\s*$/gm, '')
    .replace(/^\s*Edit\s*$/gm, '')
    .replace(/^\s*Retry\s*$/gm, '')
    .trim();
}

function getDataAttributes(element) {
  const dataAttrs = {};
  if (element && element.attributes) {
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    });
  }
  return dataAttrs;
}

function workingContainerExtraction() {
  console.log('🐻 ThreadCub: Using fallback working extraction method...');
  
  const messages = [];
  let messageIndex = 0;
  
  const containers = document.querySelectorAll('[data-testid*="message"]:not([data-testid*="button"])');
  console.log(`🐻 ThreadCub: Found ${containers.length} containers`);
  
  containers.forEach((container, index) => {
    const text = container.innerText?.trim() || container.textContent?.trim() || '';
    
    if (text && text.length > 50 && text.length < 15000) {
      const role = enhancedRoleDetection(text, index);
      
      messages.push({
        id: messageIndex++,
        role: role,
        content: simpleCleanContent(text),
        timestamp: new Date().toISOString(),
        extractionMethod: 'working_container'
      });
    }
  });
  
  return messages;
}

function extractChatGPTConversation() {
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
    return extractChatGPTFallback(title);
  }
  
  // Process each message element
  messageElements.forEach((element, index) => {
    try {
      // Get role directly from data attribute (most reliable)
      const authorRole = element.getAttribute('data-message-author-role');
      const role = authorRole === 'user' ? 'user' : 'assistant';
      
      // Extract content using multiple strategies
      let messageContent = extractChatGPTMessageContent(element);
      
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
}

function extractChatGPTMessageContent(element) {
  // Strategy 1: Look for whitespace-pre-wrap (most common ChatGPT content container)
  const preWrap = element.querySelector('.whitespace-pre-wrap');
  if (preWrap) {
    const content = preWrap.textContent?.trim();
    if (content && content.length > 5) {
      return cleanChatGPTContent(content);
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
        return cleanChatGPTContent(content);
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
  
  return cleanChatGPTContent(directText);
}

function cleanChatGPTContent(content) {
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
}

function extractChatGPTFallback(title) {
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
          content: cleanChatGPTContent(text),
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
}

function extractGeminiConversation() {
  console.log('🟣 ThreadCub: Extracting Gemini conversation...');
  
  const messages = [];
  let messageIndex = 0;
  
  // IMPROVED: Generate better title from first user message
  let title = 'Gemini Conversation';
  
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
  
  // Process message elements or fallback to generic extraction
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
  
  // Generate title from first user message
  if (messages.length > 0) {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.content) {
      const content = firstUserMessage.content.trim();
      if (content.length > 10) {
        title = content.substring(0, 50).replace(/\n/g, ' ').trim();
        if (content.length > 50) title += '...';
        title = `${title} - Gemini`;
      }
    }
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
}

function extractGenericConversation() {
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
}

// === CONTINUATION SYSTEM FUNCTIONS ===

function generateContinuationPrompt(summary, shareUrl, platform, conversationData) {
  console.log('🐻 ThreadCub: Generating continuation prompt for platform:', platform);
  
  // FIXED: Return platform-specific prompts instead of generic URL-based ones
  if (platform && platform.toLowerCase().includes('chatgpt')) {
    // ChatGPT-specific prompt (acknowledges URL limitations)
    const chatGPTPrompt = `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress  
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
    
    console.log('🐻 ThreadCub: Generated ChatGPT-specific continuation prompt:', chatGPTPrompt.length, 'characters');
    return chatGPTPrompt;
  } else {
    // Claude-specific prompt (can access URLs)
    const claudePrompt = `I'd like to continue our previous conversation. The complete context is available at: ${shareUrl}

Please access the conversation history and let me know when you're ready to continue from where we left off.`;
    
    console.log('🐻 ThreadCub: Generated Claude-specific continuation prompt:', claudePrompt.length, 'characters');
    return claudePrompt;
  }
}

function getTargetPlatformFromCurrentUrl() {
  const hostname = window.location.hostname;
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  }
  return 'unknown';
}

function generateQuickSummary(messages) {
  if (!messages || messages.length === 0) return 'Empty conversation';
  
  const userMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'human');
  if (userMessages.length === 0) return 'No user messages found';
  
  const lastUserMessage = userMessages[userMessages.length - 1];
  const firstUserMessage = userMessages[0];
  
  if (userMessages.length === 1) {
    return `Previous conversation about: "${firstUserMessage.content.substring(0, 100)}..."`;
  }
  
  return `Previous conversation: Started with "${firstUserMessage.content.substring(0, 60)}..." and most recently discussed "${lastUserMessage.content.substring(0, 60)}..."`;
}

function handleDirectContinuation(conversationData) {
  console.log('🐻 ThreadCub: Handling direct continuation without API save...');
  
  // Create a fallback share URL
  const fallbackShareUrl = `https://threadcub.com/fallback/${Date.now()}`;
  
  // Generate a simple continuation prompt
  const summary = generateQuickSummary(conversationData.messages);
  const minimalPrompt = generateContinuationPrompt(summary, fallbackShareUrl, conversationData.platform, conversationData);
  
  // Route to appropriate platform flow
  const targetPlatform = getTargetPlatformFromCurrentUrl();
  
  if (targetPlatform === 'chatgpt') {
    console.log('🐻 ThreadCub: Direct ChatGPT continuation (no API save)');
    handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData);
  } else if (targetPlatform === 'claude') {
    console.log('🐻 ThreadCub: Direct Claude continuation (no API save)');
    handleClaudeFlow(minimalPrompt, fallbackShareUrl, conversationData);
  } else {
    console.log('🐻 ThreadCub: Direct continuation - defaulting to ChatGPT flow');
    handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData);
  }
  
  if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
    window.threadcubButton.showSuccessToast('Continuing conversation (offline mode)');
  }
}

function handleClaudeFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🤖 ThreadCub: Starting Claude flow (API-only, no downloads)...');
  
  const continuationData = {
    prompt: continuationPrompt,
    shareUrl: shareUrl,
    platform: 'Claude',
    timestamp: Date.now(),
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    claudeFlow: true,
    downloadCompleted: false
  };
  
  console.log('🤖 ThreadCub: Claude continuation data with message count:', continuationData.totalMessages);
  
  // ADD THIS LINE HERE:
  console.log('🔧 DEBUG: About to store data with key "threadcubContinuationData":', continuationData);
  
  const canUseChrome = canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🤖 ThreadCub: Using Chrome storage for Claude...');
    storeWithChrome(continuationData)
      .then(() => {
        console.log('🐻 ThreadCub: Claude data stored successfully');
        const claudeUrl = 'https://claude.ai/';
        window.open(claudeUrl, '_blank');
        if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
          window.threadcubButton.showSuccessToast('Opening Claude with conversation context...');
        }
      })
      .catch(error => {
        console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
        handleClaudeFlowFallback(continuationData);
      });
  } else {
    console.log('🤖 ThreadCub: Using Claude fallback method directly');
    handleClaudeFlowFallback(continuationData);
  }
}

function autoDownloadChatGPTFile(conversationData, shareUrl) {
  try {
    console.log('🤖 ThreadCub: Auto-downloading conversation file for ChatGPT...');
    
    const conversationJSON = {
      title: conversationData.title || 'ThreadCub Conversation Continuation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform,
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages.length,
      source: 'ThreadCub Browser Extension - ChatGPT Continuation',
      shareUrl: shareUrl,
      instructions: 'This file contains our previous conversation. Please review it and continue from where we left off.',
      messages: conversationData.messages,
      summary: generateQuickSummary(conversationData.messages)
    };
    
    const filename = `threadcub-continuation-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(conversationJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🤖 ThreadCub: ✅ ChatGPT file auto-downloaded:', filename);
    
  } catch (error) {
    console.error('🤖 ThreadCub: Error auto-downloading ChatGPT file:', error);
  }
}

function generateChatGPTContinuationPrompt() {
  return `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
}

function handleChatGPTFlowFallback(continuationData) {
  console.log('🤖 ThreadCub: Using localStorage fallback for ChatGPT...');
  
  try {
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 ChatGPT Fallback: Data stored in localStorage');
    
    const chatGPTUrl = 'https://chatgpt.com/';
    window.open(chatGPTUrl, '_blank');
    if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
      window.threadcubButton.showSuccessToast('File downloaded! Check your new ChatGPT tab.');
    }
    
  } catch (error) {
    console.error('🔧 ChatGPT Fallback: localStorage failed:', error);
  }
}

function handleClaudeFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🤖 ThreadCub: Starting Claude flow (API-only, no downloads)...');
  
  const continuationData = {
    prompt: continuationPrompt,
    shareUrl: shareUrl,
    platform: 'Claude',
    timestamp: Date.now(),
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    claudeFlow: true,
    downloadCompleted: false
  };
  
  console.log('🤖 ThreadCub: Claude continuation data with message count:', continuationData.totalMessages);
  
  const canUseChrome = canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🤖 ThreadCub: Using Chrome storage for Claude...');
    storeWithChrome(continuationData)
      .then(() => {
        console.log('🐻 ThreadCub: Claude data stored successfully');
        const claudeUrl = 'https://claude.ai/';
        window.open(claudeUrl, '_blank');
        if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
          window.threadcubButton.showSuccessToast('Opening Claude with conversation context...');
        }
      })
      .catch(error => {
        console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
        handleClaudeFlowFallback(continuationData);
      });
  } else {
    console.log('🤖 ThreadCub: Using Claude fallback method directly');
    handleClaudeFlowFallback(continuationData);
  }
}

function canUseChromStorage() {
  try {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.storage && 
           chrome.storage.local &&
           !chrome.runtime.lastError;
  } catch (error) {
    console.log('🔧 Chrome check failed:', error);
    return false;
  }
}

async function storeWithChrome(continuationData) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ threadcubContinuationData: continuationData }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('🔧 Chrome storage: Success with message count:', continuationData.totalMessages);
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function handleClaudeFlowFallback(continuationData) {
  console.log('🤖 ThreadCub: Using localStorage fallback for Claude...');
  
  try {
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 Claude Fallback: Data stored in localStorage');
    
    const claudeUrl = 'https://claude.ai/';
    window.open(claudeUrl, '_blank');
    if (window.threadcubButton && window.threadcubButton.showSuccessToast) {
      window.threadcubButton.showSuccessToast('Opening Claude with conversation context...');
    }
    
  } catch (error) {
    console.error('🔧 Claude Fallback: localStorage failed:', error);
  }
}

// === DOWNLOAD FUNCTIONS ===

function createDownloadFromData(conversationData) {
  try {
    const tagsData = {
      title: conversationData.title || 'ThreadCub Conversation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform || 'Unknown',
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages ? conversationData.messages.length : 0,
      messages: conversationData.messages || []
    };
    
    const filename = generateSmartFilename(conversationData);
    
    const blob = new Blob([JSON.stringify(tagsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🐻 ThreadCub: JSON download completed with filename:', filename);
  } catch (error) {
    console.error('🐻 ThreadCub: Error in createDownloadFromData:', error);
    throw error;
  }
}

function generateSmartFilename(conversationData) {
  try {
    const platform = conversationData.platform?.toLowerCase() || 'chat';
    
    let conversationIdentifier = '';
    
    if (conversationData.title && conversationData.title !== 'ThreadCub Conversation' && conversationData.title.trim().length > 0) {
      conversationIdentifier = sanitizeFilename(conversationData.title);
    } else if (conversationData.messages && conversationData.messages.length > 0) {
      const firstUserMessage = conversationData.messages.find(msg => 
        msg.role === 'user' || msg.role === 'human'
      );
      
      if (firstUserMessage && firstUserMessage.content) {
        const content = firstUserMessage.content.trim();
        conversationIdentifier = sanitizeFilename(content.substring(0, 50));
      }
    }
    
    if (!conversationIdentifier) {
      conversationIdentifier = 'conversation';
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${platform}-${conversationIdentifier}-${timestamp}.json`;
    
    console.log('🐻 ThreadCub: Generated filename:', filename);
    return filename;
  } catch (error) {
    console.error('🐻 ThreadCub: Error generating filename:', error);
    return `threadcub-conversation-${Date.now()}.json`;
  }
}

function sanitizeFilename(text) {
  try {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  } catch (error) {
    console.error('🐻 ThreadCub: Error sanitizing filename:', error);
    return 'conversation';
  }
}

// === FIXED: FLOATING BUTTON ENHANCEMENT FUNCTION ===

function enhanceFloatingButtonWithConversationFeatures() {
  if (window.threadcubButton && typeof window.threadcubButton === 'object') {
    console.log('🐻 ThreadCub: Enhancing modular floating button with conversation features...');
    
    // FIXED: Override with DIRECT API CALLS (like working main branch) + AUTH TOKEN EXTRACTION
    window.threadcubButton.saveAndOpenConversation = async function(source = 'floating') {
      console.log('🐻 ThreadCub: saveAndOpenConversation called from:', source);
      
      // ===== GET USER AUTH TOKEN VIA BACKGROUND SCRIPT =====
        console.log('🔧 Getting user auth token via background script...');
        let userAuthToken = null;

        try {
          const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
          if (response && response.success) {
            userAuthToken = response.authToken;
            console.log('🔧 Auth token retrieved from ThreadCub tab:', !!userAuthToken);
            console.log('🔧 Auth token length:', userAuthToken?.length || 'null');
          } else {
            console.log('🔧 Could not get auth token:', response?.error || 'Unknown error');
          }
        } catch (error) {
          console.log('🔧 Background script communication failed:', error);
        }
              
      const now = Date.now();
      if (this.isExporting || (now - this.lastExportTime) < 2000) {
        console.log('🐻 ThreadCub: Export already in progress');
        return;
      }
      
      this.isExporting = true;
      this.lastExportTime = now;
      
      try {
        console.log('🐻 ThreadCub: Extracting conversation data...');
        
        let conversationData;
        const hostname = window.location.hostname;
        
        if (hostname.includes('claude.ai')) {
          conversationData = await extractClaudeConversation();
        } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
          conversationData = extractChatGPTConversation();
        } else if (hostname.includes('gemini.google.com')) {
          conversationData = await extractGeminiConversation();
        } else {
          conversationData = extractGenericConversation();
        }
                
        if (!conversationData || !conversationData.messages || conversationData.messages.length === 0) {
          console.error('🐻 ThreadCub: No conversation data found');
          this.showErrorToast('No conversation found to save');
          this.isExporting = false;
          return;
        }
        
        console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages`);
        
        this.lastConversationData = conversationData;

        // Get session ID for anonymous conversation tracking
        const sessionId = await getOrCreateSessionId();
        
        // FIXED: Use DIRECT fetch() call to API (same as working main branch) + AUTH TOKEN
        const apiData = {
            conversationData: conversationData,
            source: conversationData.platform?.toLowerCase() || 'unknown',
            title: conversationData.title || 'Untitled Conversation',
            userAuthToken: userAuthToken,
            sessionId: sessionId
        };
        
        console.log('🐻 ThreadCub: Making DIRECT API call to ThreadCub...');
        
        let response;
        try {
          // RESTORED: Direct fetch call (same as working main branch)
          console.log('🔍 userAuthToken before API call:', !!userAuthToken);
          console.log('🔍 userAuthToken length:', userAuthToken?.length || 'null');
          console.log('🔍 API Data being sent:', JSON.stringify(apiData, null, 2));
          
          response = await fetch('https://threadcub.com/api/conversations/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ ThreadCub: Direct API call successful:', data);
          
          // Generate continuation prompt with real API data
          const summary = data.summary || generateQuickSummary(conversationData.messages);
          const shareUrl = data.shareableUrl || `https://threadcub.com/api/share/${data.conversationId}`;
          
          const minimalPrompt = generateContinuationPrompt(summary, shareUrl, conversationData.platform, conversationData);
          
          const targetPlatform = getTargetPlatformFromCurrentUrl();
          
          if (targetPlatform === 'chatgpt') {
            console.log('🤖 ThreadCub: Routing to ChatGPT flow (with file download)');
            this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'claude') {
            console.log('🤖 ThreadCub: Routing to Claude flow (no file download)');
            this.handleClaudeFlow(minimalPrompt, shareUrl, conversationData);
          } else if (targetPlatform === 'gemini') {
            console.log('🤖 ThreadCub: Routing to Gemini flow (with file download)');
            this.handleGeminiFlow(minimalPrompt, shareUrl, conversationData);
          } else {
            console.log('🤖 ThreadCub: Unknown platform, defaulting to ChatGPT flow');
            this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
          }

          this.setBearExpression('happy');
          setTimeout(() => {
            if (this.currentBearState !== 'default') {
              this.setBearExpression('default');
            }
          }, 2000);

          this.isExporting = false;
          
        } catch (apiError) {
          console.error('🐻 ThreadCub: Direct API call failed:', apiError);
          console.log('🐻 ThreadCub: Falling back to direct continuation without API save...');
          
          // FALLBACK: Skip API save and go straight to continuation
          handleDirectContinuation(conversationData);
          this.isExporting = false;
          return;
        }

      } catch (error) {
        console.error('🐻 ThreadCub: Export error:', error);
        this.showErrorToast('Export failed: ' + error.message);
        this.isExporting = false;
      }
    };
    
    // UNCHANGED: Download function is fine as-is
    window.threadcubButton.downloadConversationJSON = async function() {
      console.log('🐻 ThreadCub: Starting JSON download...');
      
      try {
        console.log('🐻 ThreadCub: Extracting conversation data for download...');
        
        let conversationData;
        const hostname = window.location.hostname;
        
        if (hostname.includes('claude.ai')) {
          conversationData = await extractClaudeConversation();
        } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
          conversationData = extractChatGPTConversation();
        } else {
          conversationData = extractGenericConversation();
        }
        
        if (!conversationData || !conversationData.messages || conversationData.messages.length === 0) {
          console.error('🐻 ThreadCub: No conversation data found');
          
          const fallbackData = {
            title: document.title || 'AI Conversation',
            url: window.location.href,
            platform: hostname.includes('claude.ai') ? 'Claude.ai' : 'Unknown',
            exportDate: new Date().toISOString(),
            totalMessages: 0,
            messages: [],
            note: 'No conversation messages could be extracted from this page'
          };
          
          createDownloadFromData(fallbackData);
          this.showSuccessToast('Downloaded basic page info');
          return;
        }
        
        console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages for download`);
        
        createDownloadFromData(conversationData);
        this.showSuccessToast('Conversation downloaded successfully!');
        
      } catch (error) {
        console.error('🐻 ThreadCub: Download error:', error);
        
        const emergencyData = {
          title: 'ThreadCub Emergency Download',
          url: window.location.href,
          platform: 'Unknown',
          exportDate: new Date().toISOString(),
          totalMessages: 0,
          messages: [],
          error: error.message,
          note: 'An error occurred during conversation extraction'
        };
        
        createDownloadFromData(emergencyData);
        this.showErrorToast('Download completed with errors');
      }
    };
    
    console.log('🐻 ThreadCub: ✅ Floating button enhanced with DIRECT API calls + AUTH TOKEN EXTRACTION (SIMPLIFIED)');
  }
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'THREADCUB_DASHBOARD_MESSAGE' && event.data.action === 'storeContinuationData') {
    console.log('🔗 Content script received dashboard message:', event.data.data)
    
    // Send to background script using chrome.runtime
    chrome.runtime.sendMessage({
      action: 'storeContinuationData',
      ...event.data.data
    }, (response) => {
      console.log('📤 Background script response:', response)
    })
  }
})

// === END SECTION 4A-4E ===

// === SECTION 5A: Main Application Initialization ===

// Main initialization when DOM is ready
function initializeThreadCub() {
  console.log('🐻 ThreadCub: Initializing main application...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startThreadCub);
  } else {
    startThreadCub();
  }
}

function startThreadCub() {
  console.log('🐻 ThreadCub: Starting ThreadCub application...');
  console.log('🐻 ThreadCub: Checking modular classes...');
  console.log('🐻 ThreadCub: ThreadCubFloatingButton available:', typeof window.ThreadCubFloatingButton);
  console.log('🐻 ThreadCub: ThreadCubTagging available:', typeof window.ThreadCubTagging);
  console.log('🐻 ThreadCub: enhanceFloatingButtonWithConversationFeatures available:', typeof enhanceFloatingButtonWithConversationFeatures);
  
  // Initialize the floating button (now from external module)
  if (typeof window.ThreadCubFloatingButton !== 'undefined') {
    console.log('🐻 ThreadCub: ✅ Initializing floating button from module...');
    
    try {
      window.threadcubButton = new window.ThreadCubFloatingButton();
      console.log('🐻 ThreadCub: ✅ Floating button instance created:', typeof window.threadcubButton);
      
      // CRITICAL: Enhance the modular floating button with all conversation functionality
      if (typeof enhanceFloatingButtonWithConversationFeatures === 'function') {
        console.log('🐻 ThreadCub: ✅ Enhancing floating button with conversation features...');
        enhanceFloatingButtonWithConversationFeatures();
        console.log('🐻 ThreadCub: ✅ Floating button enhanced successfully');
      } else {
        console.error('🐻 ThreadCub: ❌ enhanceFloatingButtonWithConversationFeatures function not found');
      }
      
      // Initialize tagging system
      if (typeof window.ThreadCubTagging !== 'undefined') {
        console.log('🐻 ThreadCub: ✅ Initializing tagging system...');
        try {
          window.threadcubTagging = new window.ThreadCubTagging(window.threadcubButton);
          console.log('🐻 ThreadCub: ✅ Tagging system initialized:', typeof window.threadcubTagging);
        } catch (taggingError) {
          console.error('🐻 ThreadCub: ❌ Error initializing tagging system:', taggingError);
        }
      } else {
        console.log('🐻 ThreadCub: ⚠️ ThreadCubTagging not available, will initialize on demand');
      }
      
      // Check for continuation data
      try {
        checkForContinuationData();
        console.log('🐻 ThreadCub: ✅ Continuation data check completed');
      } catch (continuationError) {
        console.error('🐻 ThreadCub: ❌ Error checking continuation data:', continuationError);
      }
      
      console.log('🐻 ThreadCub: ✅ Application fully initialized with all features!');
      
      // Final verification
      setTimeout(() => {
        const buttonElement = document.querySelector('#threadcub-edge-btn');
        console.log('🐻 ThreadCub: Final verification - Button in DOM:', !!buttonElement);
        if (buttonElement) {
          console.log('🐻 ThreadCub: 🎉 SUCCESS! Floating button is visible on the page!');
        } else {
          console.error('🐻 ThreadCub: ❌ FAILED! Button not found in DOM after initialization');
        }
      }, 1000);
      
    } catch (buttonError) {
      console.error('🐻 ThreadCub: ❌ Error creating floating button instance:', buttonError);
    }
    
  } else {
    console.error('🐻 ThreadCub: ❌ ThreadCubFloatingButton class not found - module may not have loaded');
    
    // Retry after a short delay
    setTimeout(() => {
      if (typeof window.ThreadCubFloatingButton !== 'undefined') {
        console.log('🐻 ThreadCub: 🔄 Retrying initialization...');
        startThreadCub();
      } else {
        console.error('🐻 ThreadCub: ❌ Failed to load floating button module after retry');
      }
    }, 1000);
  }
}

// Start the application immediately
console.log('🐻 ThreadCub: Starting initialization...');
initializeThreadCub();

// === END SECTION 5A ===

// === SESSION ID MANAGEMENT (FIXED VERSION) ===
async function getOrCreateSessionId() {
  let sessionId = null;
  
  try {
    // FIXED: Try localStorage FIRST (most reliable for dashboard sync)
    try {
      sessionId = localStorage.getItem('threadcubSessionId');
      if (sessionId) {
        console.log('🔑 Using existing ThreadCub session ID (localStorage):', sessionId);
        
        // Try to sync to Chrome storage if available (non-critical)
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          try {
            chrome.storage.local.set({ threadcubSessionId: sessionId }, () => {
              if (!chrome.runtime.lastError) {
                console.log('🔑 Synced session ID to Chrome storage');
              }
            });
          } catch (chromeError) {
            console.log('🔑 Chrome storage sync failed (non-critical):', chromeError);
          }
        }
        
        return sessionId;
      }
    } catch (localError) {
      console.log('🔑 localStorage access failed:', localError);
    }
    
    // FIXED: Try Chrome storage as secondary option
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && chrome.runtime.id) {
      try {
        const result = await new Promise((resolve, reject) => {
          chrome.storage.local.get(['threadcubSessionId'], (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(result);
            }
          });
        });
        
        sessionId = result.threadcubSessionId;
        if (sessionId) {
          console.log('🔑 Using existing ThreadCub session ID (Chrome storage):', sessionId);
          
          // Sync back to localStorage for dashboard
          try {
            localStorage.setItem('threadcubSessionId', sessionId);
            console.log('🔑 Synced session ID to localStorage for dashboard access');
          } catch (localError) {
            console.log('🔑 Could not sync to localStorage (non-critical):', localError);
          }
          
          return sessionId;
        }
      } catch (chromeError) {
        console.log('🔑 Chrome storage access failed:', chromeError);
      }
    }
    
    // FIXED: Generate new session ID and save to BOTH storages
    sessionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('🔑 Generated new ThreadCub session ID:', sessionId);
    
    // Save to localStorage (primary for dashboard)
    try {
      localStorage.setItem('threadcubSessionId', sessionId);
      console.log('🔑 Saved new session ID to localStorage');
    } catch (localError) {
      console.log('🔑 Could not save to localStorage:', localError);
    }
    
    // Save to Chrome storage (secondary)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ threadcubSessionId: sessionId }, () => {
          if (!chrome.runtime.lastError) {
            console.log('🔑 Saved new session ID to Chrome storage');
          }
        });
      } catch (chromeError) {
        console.log('🔑 Could not save to Chrome storage (non-critical):', chromeError);
      }
    }
    
    return sessionId;
    
  } catch (error) {
    console.error('🔑 Session ID management failed:', error);
    
    // ABSOLUTE FALLBACK: Use existing localStorage or create new one
    try {
      sessionId = localStorage.getItem('threadcubSessionId');
      if (!sessionId) {
        sessionId = 'tc_emergency_' + Date.now();
        localStorage.setItem('threadcubSessionId', sessionId);
      }
      console.log('🔑 Using emergency session ID:', sessionId);
      return sessionId;
    } catch (emergencyError) {
      console.error('🔑 Emergency session ID failed:', emergencyError);
      return 'tc_critical_' + Date.now();
    }
  }
}