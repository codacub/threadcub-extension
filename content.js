// === SECTION 1A: ThreadCubTagging Constructor & Initialization ===

// ThreadCub with Enhanced Popup System - FIXED VERSION
console.log('🐻 ThreadCub: Initializing with enhanced popup system...');

// FIXED INLINE TAGGING CODE - Complete working implementation
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

  init() {
    this.addTaggingStyles();
    this.createContextMenu();
    this.createSidePanel();
    this.setupEventListeners();
    console.log('🏷️ ThreadCub: Tagging system ready');
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

// === SECTION 1C: Context Menu Creation (Smart Progressive Disclosure) ===

createContextMenu() {
  this.contextMenu = document.createElement('div');
  this.contextMenu.className = 'threadcub-context-menu';
  
  // SMART: Dynamic button layout based on user experience
  this.contextMenu.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- SMART SWIPE Button (changes based on experience) -->
      <div id="threadcub-swipe-selector" style="
        background: #4C596E;
        border: 1px solid #000000;
        border-radius: 4px;
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #FFFFFF;
        height: 32px;
        box-sizing: border-box;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <div id="swipe-text" style="
          flex: 1;
          padding: 0 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 32px;
        ">
          <svg id="swipe-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
            <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/>
          </svg>
          <span id="swipe-button-text">SWIPE THIS!</span>
        </div>
      </div>
      
      <!-- SELECT MORE Button (renamed from SWIPE MORE) -->
      <div id="threadcub-select-more" style="
        background: #000000;
        border: 1px solid #000000;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #FFFFFF;
        height: 32px;
        box-sizing: border-box;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
          <path d="M5 3a2 2 0 0 0-2 2"/>
          <path d="M19 3a2 2 0 0 1 2 2"/>
          <path d="M5 21a2 2 0 0 1-2-2"/>
          <path d="M9 3h1"/>
          <path d="M9 21h2"/>
          <path d="M14 3h1"/>
          <path d="M3 9v1"/>
          <path d="M21 9v2"/>
          <path d="M3 14v1"/>
        </svg>
        SWIPE MORE
      </div>
      
      <!-- SMART: Open Panel Button (shows after first tag) -->
      <div id="threadcub-open-panel" style="
        background: #8B5CF6;
        border: 1px solid #8B5CF6;
        border-radius: 4px;
        display: none;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #FFFFFF;
        height: 32px;
        box-sizing: border-box;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M9 8h6"/>
          <path d="M9 12h6"/>
          <path d="M9 16h6"/>
        </svg>
        OPEN PANEL
      </div>
    </div>
  `;
  
  document.body.appendChild(this.contextMenu);
  this.setupSmartContextMenuListeners();
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

setupSmartContextMenuListeners() {
  const swipeText = this.contextMenu.querySelector('#swipe-text');
  const swipeButton = this.contextMenu.querySelector('#threadcub-swipe-selector');
  const selectMoreButton = this.contextMenu.querySelector('#threadcub-select-more');
  const openPanelButton = this.contextMenu.querySelector('#threadcub-open-panel');
  
  // SMART SWIPE button click - behavior changes based on experience
  if (swipeText) {
    swipeText.addEventListener('mousedown', (e) => {
      e.preventDefault(); // CRITICAL: Prevents selection from being cleared
    });
    
    swipeText.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.handleSmartSwipeClick();
    });
  }
  
  // Also make the entire swipe button clickable
  if (swipeButton) {
    swipeButton.addEventListener('mousedown', (e) => {
      if (e.target.closest('#swipe-text')) return; // Let the inner handler deal with it
      e.preventDefault();
    });
    
    swipeButton.addEventListener('click', (e) => {
      if (e.target.closest('#swipe-text')) return; // Let the inner handler deal with it
      e.stopPropagation();
      e.preventDefault();
      this.handleSmartSwipeClick();
    });
    
    // Hover effects for the entire button
    swipeButton.addEventListener('mouseenter', () => {
      swipeButton.style.background = '#5A6B7D';
      swipeButton.style.transform = 'scale(1.02)';
    });
    swipeButton.addEventListener('mouseleave', () => {
      swipeButton.style.background = '#4C596E';
      swipeButton.style.transform = 'scale(1)';
    });
  }
  
  // SELECT MORE button (unchanged)
  if (selectMoreButton) {
    selectMoreButton.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevents selection clearing
      console.log('🏷️ ThreadCub: SELECT MORE mousedown - prevented default');
    });
    
    selectMoreButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.handleSelectMoreClick();
    });
    
    // Hover effects
    selectMoreButton.addEventListener('mouseenter', () => {
      selectMoreButton.style.background = '#333333';
      selectMoreButton.style.transform = 'scale(1.02)';
    });
    selectMoreButton.addEventListener('mouseleave', () => {
      selectMoreButton.style.background = '#000000';
      selectMoreButton.style.transform = 'scale(1)';
    });
  }
  
  // NEW: Open Panel button
  if (openPanelButton) {
    openPanelButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    openPanelButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showSidePanel();
      this.hideContextMenu();
    });
    
    // Hover effects
    openPanelButton.addEventListener('mouseenter', () => {
      openPanelButton.style.background = '#7C3AED';
      openPanelButton.style.transform = 'scale(1.02)';
    });
    openPanelButton.addEventListener('mouseleave', () => {
      openPanelButton.style.background = '#8B5CF6';
      openPanelButton.style.transform = 'scale(1)';
    });
  }
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!this.contextMenu.contains(e.target)) {
      this.hideContextMenu();
    }
  });
}

// NEW: Smart swipe click handler that adapts based on user experience
handleSmartSwipeClick() {
  console.log('🏷️ ThreadCub: Smart swipe clicked - creating tag and offering note option');
  
  if (!this.selectedText || !this.selectedRange) {
    console.log('🏷️ ThreadCub: No selection available');
    return;
  }
  
  // Create tag immediately
  const tag = {
    id: Date.now(),
    text: this.selectedText,
    category: null,
    categoryLabel: 'Tagged',
    note: '', // Empty note field for user to fill
    timestamp: new Date().toISOString(),
    rangeInfo: this.captureRangeInfo(this.selectedRange)
  };
  
  this.tags.push(tag);
  
  // Remove temporary highlight before creating permanent one
  this.removeTemporaryHighlight();
  
  // Apply smart highlight
  this.applySmartHighlight(this.selectedRange, tag.id);
  
  // SMART DECISION: First tag opens panel, subsequent tags show choice
  if (this.tags.length === 1) {
    console.log('🏷️ ThreadCub: First tag - auto-opening side panel');
    this.showSidePanel();
    this.hideContextMenu();
  } else {
    console.log('🏷️ ThreadCub: Subsequent tag - transforming to ADD NOTE with choice');
    this.transformToAddNoteMode(tag.id);
  }
  
  // Reset selection mode
  this.isSelectingMore = false;
  
  console.log('🏷️ ThreadCub: Smart tag created:', tag);
}

// NEW: Transform context menu to ADD NOTE mode with dismiss option
transformToAddNoteMode(tagId) {
  const swipeButton = this.contextMenu.querySelector('#threadcub-swipe-selector');
  const selectMoreButton = this.contextMenu.querySelector('#threadcub-select-more');
  
  if (!swipeButton || !selectMoreButton) return;
  
  // Store the tag ID for the ADD NOTE action
  this.pendingNoteTagId = tagId;
  
  // Transform the swipe button to ADD NOTE
  swipeButton.style.background = '#8B5CF6';
  swipeButton.style.borderColor = '#8B5CF6';
  swipeButton.innerHTML = `
    <div id="swipe-text" style="
      flex: 1;
      padding: 0 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      height: 32px;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
      <span>ADD NOTE</span>
    </div>
  `;
  
  // Transform SELECT MORE button to DISMISS
  selectMoreButton.style.background = '#64748b';
  selectMoreButton.style.borderColor = '#64748b';
  selectMoreButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
    DISMISS
  `;
  
  // Update click handlers for the transformed buttons
  this.setupTransformedButtonListeners();
  
  console.log('🏷️ ThreadCub: Context menu transformed to ADD NOTE mode');
}

// NEW: Setup listeners for transformed buttons
setupTransformedButtonListeners() {
  // Remove old listeners by cloning elements
  const swipeButton = this.contextMenu.querySelector('#threadcub-swipe-selector');
  const selectMoreButton = this.contextMenu.querySelector('#threadcub-select-more');
  
  if (swipeButton) {
    const newSwipeButton = swipeButton.cloneNode(true);
    swipeButton.parentNode.replaceChild(newSwipeButton, swipeButton);
    
    // ADD NOTE click handler
    newSwipeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('🏷️ ThreadCub: ADD NOTE clicked - opening panel for tag:', this.pendingNoteTagId);
      
      // Store the tag ID for auto-opening note input
      const tagIdForNote = this.pendingNoteTagId;
      
      this.showSidePanel();
      
      // SMART: Auto-activate note input for the pending tag with proper timing
      if (tagIdForNote) {
        // Wait for panel to open and tags list to render
        setTimeout(() => {
          console.log('🏷️ ThreadCub: Auto-opening note input for tag:', tagIdForNote);
          this.showNoteInput(tagIdForNote);
        }, 500); // Increased delay to ensure rendering is complete
      }
      
      this.hideContextMenu();
      // Clear pending state
      this.pendingNoteTagId = null;
    });
    
    // Hover effects
    newSwipeButton.addEventListener('mouseenter', () => {
      newSwipeButton.style.background = '#7C3AED';
      newSwipeButton.style.transform = 'scale(1.02)';
    });
    newSwipeButton.addEventListener('mouseleave', () => {
      newSwipeButton.style.background = '#8B5CF6';
      newSwipeButton.style.transform = 'scale(1)';
    });
  }
  
  if (selectMoreButton) {
    const newSelectMoreButton = selectMoreButton.cloneNode(true);
    selectMoreButton.parentNode.replaceChild(newSelectMoreButton, selectMoreButton);
    
    // DISMISS click handler
    newSelectMoreButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('🏷️ ThreadCub: DISMISS clicked - hiding menu');
      this.hideContextMenu();
      // Clear pending state
      this.pendingNoteTagId = null;
    });
    
    // Hover effects
    newSelectMoreButton.addEventListener('mouseenter', () => {
      newSelectMoreButton.style.background = '#475569';
      newSelectMoreButton.style.transform = 'scale(1.02)';
    });
    newSelectMoreButton.addEventListener('mouseleave', () => {
      newSelectMoreButton.style.background = '#64748b';
      newSelectMoreButton.style.transform = 'scale(1)';
    });
  }
}

// NEW: Update context menu appearance based on user experience
updateContextMenuForExperience() {
  // CRITICAL: Always recreate the menu HTML to ensure clean state
  this.contextMenu.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- SWIPE Button (always starts as SWIPE THIS!) -->
      <div id="threadcub-swipe-selector" style="
        background: #4C596E;
        border: 1px solid #000000;
        border-radius: 4px;
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #FFFFFF;
        height: 32px;
        box-sizing: border-box;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <div id="swipe-text" style="
          flex: 1;
          padding: 0 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 32px;
        ">
          <svg id="swipe-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
            <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/>
          </svg>
          <span id="swipe-button-text">SWIPE THIS!</span>
        </div>
      </div>
      
      <!-- SWIPE MORE Button (always starts as SWIPE MORE) -->
      <div id="threadcub-select-more" style="
        background: #000000;
        border: 1px solid #000000;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: #FFFFFF;
        height: 32px;
        box-sizing: border-box;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
          <path d="M5 3a2 2 0 0 0-2 2"/>
          <path d="M19 3a2 2 0 0 1 2 2"/>
          <path d="M5 21a2 2 0 0 1-2-2"/>
          <path d="M9 3h1"/>
          <path d="M9 21h2"/>
          <path d="M14 3h1"/>
          <path d="M3 9v1"/>
          <path d="M21 9v2"/>
          <path d="M3 14v1"/>
        </svg>
        SWIPE MORE
      </div>
    </div>
  `;
  
  // Re-setup listeners for the fresh HTML
  this.setupSmartContextMenuListeners();
}

// NEW: Show quick tagged feedback for subsequent tags
showQuickTaggedFeedback() {
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    font-weight: 600;
    z-index: 10000000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  `;
  
  feedback.innerHTML = `
    <span>📝</span>
    <span>Tagged! Click to add note</span>
  `;
  
  // Click to open side panel
  feedback.addEventListener('click', () => {
    this.showSidePanel();
    feedback.remove();
  });
  
  document.body.appendChild(feedback);
  
  // Animate in
  setTimeout(() => {
    feedback.style.opacity = '1';
    feedback.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-hide
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 300);
  }, 3000);
}

// Keep existing handleSelectMoreClick method (unchanged)
handleSelectMoreClick() {
  console.log('🏷️ ThreadCub: SELECT MORE clicked - preserving selection and enabling multi-select mode');
  
  // CRITICAL: Capture selection data BEFORE any DOM changes
  const currentSelection = window.getSelection();
  let preservedRange = null;
  let preservedText = '';
  
  if (currentSelection.rangeCount > 0) {
    preservedRange = currentSelection.getRangeAt(0).cloneRange();
    preservedText = currentSelection.toString();
    console.log('🏷️ ThreadCub: Captured selection:', preservedText.length, 'characters');
  }
  
  // Store in multiple places for safety
  this.preservedRange = preservedRange;
  this.preservedText = preservedText;
  this.selectedText = preservedText;
  this.selectedRange = preservedRange;
  
  // Set flag to indicate we're in "select more" mode
  this.isSelectingMore = true;
  
  // Hide the context menu immediately
  this.contextMenu.style.display = 'none';
  this.contextMenu.classList.remove('visible');
  this.isContextMenuVisible = false;
  
  // CRITICAL: Restore the selection after a tiny delay (browser may have cleared it)
  setTimeout(() => {
    if (preservedRange) {
      try {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(preservedRange);
        console.log('🏷️ ThreadCub: Selection restored after menu hide');
      } catch (error) {
        console.log('🏷️ ThreadCub: Could not restore selection:', error);
      }
    }
  }, 10);
  
  console.log('🏷️ ThreadCub: Multi-select mode enabled');
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
  
  // CRITICAL: Reset transformation state for every new selection
  this.isTransformed = false;
  this.pendingNoteTagId = null;
  
  // SMART: Update menu appearance based on user experience
  this.updateContextMenuForExperience();
  
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
  
  // Context menu dimensions (approximate)
  const menuWidth = 220; // Keep consistent width
  const menuHeight = 120;
  
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
  
  console.log('🏷️ ThreadCub: Smart context menu positioned to follow scroll');
}

// NEW: Handle scrolling while menu is open
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

// IMPROVED: Clean hide function with scroll listener cleanup
hideContextMenu() {
  if (this.contextMenu) {
    this.contextMenu.style.display = 'none';
    this.contextMenu.classList.remove('visible');
    this.isContextMenuVisible = false;
    
    // CRITICAL: Reset transformation state when hiding
    this.isTransformed = false;
    this.pendingNoteTagId = null;
    
    // Remove scroll listener
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    
    // Hide dropdown too
    const dropdown = this.contextMenu.querySelector('#threadcub-tag-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }
}

// Side panel methods with auto-note support
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
      
      // SMART: If there's a pending note tag, auto-open it after tags list renders
      if (this.pendingNoteTagId) {
        console.log('🏷️ ThreadCub: Panel opened, auto-opening note for tag:', this.pendingNoteTagId);
        setTimeout(() => {
          this.showNoteInput(this.pendingNoteTagId);
          this.pendingNoteTagId = null; // Clear after use
        }, 200);
      }
    }, 50);
    
    console.log('🏷️ ThreadCub: Side panel opened with overlay');
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
    
    // REMOVED: Don't clear highlights when panel closes
    // Tags should persist until manually deleted
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

// === SECTION 1H: Simplified Tag Cards with Priority ===

updateTagsList() {
  const tagsList = this.sidePanel.querySelector('#threadcub-tags-container');
  if (!tagsList) return;
  
  if (this.tags.length === 0) {
    tagsList.innerHTML = `
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
    `;
  } else {
    tagsList.innerHTML = this.tags.map(tag => {
      const hasNote = tag.note && tag.note.trim().length > 0;
      const priority = tag.priority || 'medium'; // default to medium
      const priorityColors = {
        high: '#86EFAC',   // light green
        medium: '#FDE68A', // light yellow/orange
        low: '#FECACA'     // light pink/red
      };
      
      return `
        <div class="threadcub-tag-card" data-tag-id="${tag.id}" style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
        ">
          <!-- REMOVED: Purple Square Indicator -->
          
          <!-- Priority Selector and Action Icons Row -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          ">
            <!-- Priority Dropdown -->
            <div class="priority-selector" data-tag-id="${tag.id}" style="
              position: relative;
              cursor: pointer;
            ">
              <div class="priority-button" style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 8px;
                border-radius: 4px;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  background: ${priorityColors[priority]};
                  border-radius: 2px;
                "></div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
              
              <!-- Priority Dropdown Menu (hidden by default) -->
              <div class="priority-menu" style="
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                min-width: 120px;
                margin-top: 4px;
              ">
                <div class="priority-option" data-priority="high" style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 12px;
                  cursor: pointer;
                  border-bottom: 1px solid #f3f4f6;
                ">
                  <div style="
                    width: 12px;
                    height: 12px;
                    background: #86EFAC;
                    border-radius: 2px;
                  "></div>
                  <span style="font-size: 14px; color: #374151;">High</span>
                </div>
                
                <div class="priority-option" data-priority="medium" style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 12px;
                  cursor: pointer;
                  border-bottom: 1px solid #f3f4f6;
                ">
                  <div style="
                    width: 12px;
                    height: 12px;
                    background: #FDE68A;
                    border-radius: 2px;
                  "></div>
                  <span style="font-size: 14px; color: #374151;">Medium</span>
                </div>
                
                <div class="priority-option" data-priority="low" style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 12px;
                  cursor: pointer;
                ">
                  <div style="
                    width: 12px;
                    height: 12px;
                    background: #FECACA;
                    border-radius: 2px;
                  "></div>
                  <span style="font-size: 14px; color: #374151;">Low</span>
                </div>
              </div>
            </div>
            
            <!-- Action Icons with hover states -->
            <div style="display: flex; gap: 8px; align-items: center;">
              ${hasNote ? `
                <!-- Edit Note Icon - Updated to square-pen -->
                <button class="edit-note-btn" data-tag-id="${tag.id}" style="
                  background: transparent;
                  border: none;
                  cursor: pointer;
                  color: #6b7280;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 32px;
                  height: 32px;
                  border-radius: 4px;
                  transition: all 0.2s ease;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
                  </svg>
                </button>
              ` : ''}
              
              <!-- Continue in Chat Icon - Updated to corner-down-left -->
              <button class="undo-btn" data-tag-id="${tag.id}" style="
                background: transparent;
                border: none;
                cursor: pointer;
                color: #6b7280;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                transition: all 0.2s ease;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                  <path d="m9 10-5 5 5 5"/>
                </svg>
              </button>
              
              <!-- Delete Icon -->
              <button class="delete-tag-btn" data-tag-id="${tag.id}" style="
                background: transparent;
                border: none;
                cursor: pointer;
                color: #ef4444;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                transition: all 0.2s ease;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" x2="10" y1="11" y2="17"/>
                  <line x1="14" x2="14" y1="11" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Tag Text -->
          <div style="
            font-size: 14px;
            line-height: 1.4;
            color: #374151;
            margin-bottom: ${hasNote ? '12px' : '16px'};
          ">${tag.text}</div>
          
          <!-- Note Section -->
          ${hasNote ? `
            <!-- Show existing note with design styling -->
            <div class="note-display" data-tag-id="${tag.id}" style="
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 0;
              font-size: 13px;
              line-height: 1.4;
              color: #475569;
            ">${tag.note}</div>
          ` : `
            <!-- Add Note Button with updated styling to match design -->
            <button class="add-note-btn" data-tag-id="${tag.id}" style="
              background: transparent;
              border: 1px solid #10b981;
              color: #10b981;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              ADD NOTE
            </button>
          `}
          
          <!-- Note Input Area (hidden by default) -->
          <div class="note-input-area" data-tag-id="${tag.id}" style="display: none;">
            <textarea class="note-textarea" placeholder="Add your note..." style="
              width: 100%;
              min-height: 80px;
              padding: 12px;
              border: 2px solid #8B5CF6;
              border-radius: 6px;
              font-size: 13px;
              line-height: 1.4;
              color: #374151;
              resize: vertical;
              font-family: inherit;
              margin-bottom: 12px;
              box-sizing: border-box;
            ">${tag.note || ''}</textarea>
            
            <div style="display: flex; gap: 8px;">
              <button class="save-note-btn" data-tag-id="${tag.id}" style="
                background: #8B5CF6;
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                text-transform: uppercase;
                transition: all 0.2s ease;
              ">SAVE</button>
              
              <button class="cancel-note-btn" data-tag-id="${tag.id}" style="
                background: transparent;
                border: none;
                color: #6b7280;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                text-transform: uppercase;
                transition: all 0.2s ease;
              ">CANCEL</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    this.setupSimplifiedListeners();
  }
}

setupSimplifiedListeners() {
  // Priority dropdown listeners
  const prioritySelectors = this.sidePanel.querySelectorAll('.priority-selector');
  prioritySelectors.forEach(selector => {
    const button = selector.querySelector('.priority-button');
    const menu = selector.querySelector('.priority-menu');
    const tagId = parseInt(selector.getAttribute('data-tag-id'));
    
    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Close other dropdowns
      this.sidePanel.querySelectorAll('.priority-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
      });
      
      // Toggle this dropdown
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    
    // Priority option clicks
    menu.querySelectorAll('.priority-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const priority = option.getAttribute('data-priority');
        this.setPriority(tagId, priority);
        menu.style.display = 'none';
      });
      
      // Hover effect
      option.addEventListener('mouseenter', () => {
        option.style.background = '#f3f4f6';
      });
      option.addEventListener('mouseleave', () => {
        option.style.background = 'transparent';
      });
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    this.sidePanel.querySelectorAll('.priority-menu').forEach(menu => {
      menu.style.display = 'none';
    });
  });
  
  // Add Note buttons
  const addNoteButtons = this.sidePanel.querySelectorAll('.add-note-btn');
  addNoteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.getAttribute('data-tag-id'));
      this.showNoteInput(tagId);
    });
    
    // Hover effects to match design
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#10b981';
      btn.style.color = 'white';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = '#10b981';
    });
  });
  
  // Edit Note buttons with hover effects
  const editNoteButtons = this.sidePanel.querySelectorAll('.edit-note-btn');
  editNoteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.getAttribute('data-tag-id'));
      this.showNoteInput(tagId);
    });
    
    // Hover effects to match design
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f3f4f6';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
  });
  
  // Delete buttons with hover effects
  const deleteButtons = this.sidePanel.querySelectorAll('.delete-tag-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.getAttribute('data-tag-id'));
      this.deleteTag(tagId);
    });
    
    // Hover effects to match design
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#fef2f2';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
  });
  
  // Undo buttons (now "Continue in Chat") with hover effects
  const undoButtons = this.sidePanel.querySelectorAll('.undo-btn');
  undoButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.getAttribute('data-tag-id'));
      console.log('🏷️ ThreadCub: Continue in chat clicked for tag:', tagId);
      this.continueTagInChat(tagId);
    });
    
    // Hover effects to match design
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f3f4f6';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
  });
  
  // Save Note buttons
  const saveNoteButtons = this.sidePanel.querySelectorAll('.save-note-btn');
  saveNoteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.getAttribute('data-tag-id'));
      this.saveNote(tagId);
    });
  });
  
  // Cancel Note buttons
  const cancelNoteButtons = this.sidePanel.querySelectorAll('.cancel-note-btn');
  cancelNoteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = parseInt(btn.getAttribute('data-tag-id'));
      this.hideNoteInput(tagId);
    });
  });
}

// NEW: Set priority for a tag
setPriority(tagId, priority) {
  const tag = this.tags.find(t => t.id === tagId);
  if (tag) {
    tag.priority = priority;
    console.log('🏷️ ThreadCub: Priority set for tag:', tagId, priority);
    this.updateTagsList(); // Refresh to show new priority color
  }
}

// Show note input area
showNoteInput(tagId) {
  const noteInputArea = this.sidePanel.querySelector(`.note-input-area[data-tag-id="${tagId}"]`);
  const noteDisplay = this.sidePanel.querySelector(`.note-display[data-tag-id="${tagId}"]`);
  const addNoteBtn = this.sidePanel.querySelector(`.add-note-btn[data-tag-id="${tagId}"]`);
  
  if (noteInputArea) {
    // Hide note display and add button
    if (noteDisplay) noteDisplay.style.display = 'none';
    if (addNoteBtn) addNoteBtn.style.display = 'none';
    
    // Show input area
    noteInputArea.style.display = 'block';
    
    // Focus textarea
    const textarea = noteInputArea.querySelector('.note-textarea');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }
}

// Hide note input area
hideNoteInput(tagId) {
  const noteInputArea = this.sidePanel.querySelector(`.note-input-area[data-tag-id="${tagId}"]`);
  const noteDisplay = this.sidePanel.querySelector(`.note-display[data-tag-id="${tagId}"]`);
  const addNoteBtn = this.sidePanel.querySelector(`.add-note-btn[data-tag-id="${tagId}"]`);
  
  if (noteInputArea) {
    // Hide input area
    noteInputArea.style.display = 'none';
    
    // Show appropriate display
    if (noteDisplay) {
      noteDisplay.style.display = 'block';
    } else if (addNoteBtn) {
      addNoteBtn.style.display = 'block';
    }
  }
}

// Save note
saveNote(tagId) {
  const noteInputArea = this.sidePanel.querySelector(`.note-input-area[data-tag-id="${tagId}"]`);
  const textarea = noteInputArea?.querySelector('.note-textarea');
  
  if (textarea) {
    const noteText = textarea.value.trim();
    
    const tag = this.tags.find(t => t.id === tagId);
    if (tag) {
      tag.note = noteText;
      console.log('🏷️ ThreadCub: Note saved for tag:', tagId, noteText);
      this.updateTagsList();
    }
  }
}

// Remove note
removeNote(tagId) {
  const tag = this.tags.find(t => t.id === tagId);
  if (tag) {
    tag.note = '';
    console.log('🏷️ ThreadCub: Note removed for tag:', tagId);
    this.updateTagsList();
  }
}

// NEW: Filter tags by priority
filterTagsByPriority(filterValue) {
  console.log('🏷️ ThreadCub: Filtering tags by priority:', filterValue);
  
  const tagCards = this.sidePanel.querySelectorAll('.threadcub-tag-card');
  
  tagCards.forEach(card => {
    const tagId = parseInt(card.getAttribute('data-tag-id'));
    const tag = this.tags.find(t => t.id === tagId);
    
    if (!tag) {
      card.style.display = 'none';
      return;
    }
    
    const tagPriority = tag.priority || 'medium'; // default to medium if no priority set
    
    if (filterValue === 'all') {
      card.style.display = 'block';
    } else if (filterValue === tagPriority) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
  
  // Update empty state if needed
  const visibleCards = Array.from(tagCards).filter(card => card.style.display !== 'none');
  const emptyState = this.sidePanel.querySelector('#threadcub-empty-state');
  
  if (visibleCards.length === 0 && this.tags.length > 0) {
    // Show "no matches" message
    const tagsContainer = this.sidePanel.querySelector('#threadcub-tags-container');
    if (tagsContainer && !tagsContainer.querySelector('#no-matches-state')) {
      const noMatchesDiv = document.createElement('div');
      noMatchesDiv.id = 'no-matches-state';
      noMatchesDiv.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #64748b;
      `;
      noMatchesDiv.innerHTML = `
        <div style="
          width: 60px;
          height: 60px;
          margin: 0 auto 16px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        ">🔍</div>
        <h3 style="
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #374151;
        ">No tags match this filter</h3>
        <p style="
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        ">Try selecting a different priority level</p>
      `;
      tagsContainer.appendChild(noMatchesDiv);
    }
  } else {
    // Remove "no matches" message if it exists
    const noMatchesState = this.sidePanel.querySelector('#no-matches-state');
    if (noMatchesState) {
      noMatchesState.remove();
    }
  }
}

// NEW: Continue tag in chat input field
continueTagInChat(tagId) {
  const tag = this.tags.find(t => t.id === tagId);
  if (!tag) {
    console.log('🏷️ ThreadCub: Tag not found for continue in chat:', tagId);
    return;
  }
  
  // Just use the tagged text content - no priority or notes
  const promptText = tag.text;
  
  console.log('🏷️ ThreadCub: Adding tagged text to chat input:', promptText);
  
  // Find and populate the chat input field
  const success = this.populateChatInput(promptText);
  
  if (success) {
    // Optional: Close the side panel after a delay
    setTimeout(() => {
      this.hideSidePanel();
    }, 1500);
  }
}

// NEW: Populate chat input field (platform-specific)
populateChatInput(text) {
  console.log('🏷️ ThreadCub: Attempting to populate chat input with text:', text.substring(0, 50) + '...');
  
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

// NEW: Show success toast for continue in chat
showContinueSuccessToast() {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
    z-index: 10000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
    <span>Added to chat input!</span>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// NEW: Show error toast for continue in chat
showContinueErrorToast() {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
    z-index: 10000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M15 9l-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
    <span>Could not find chat input</span>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

deleteTag(tagId) {
  this.tags = this.tags.filter(tag => tag.id !== tagId);
  this.cleanupSmartHighlight(tagId);
  this.updateTagsList();
  console.log('🏷️ ThreadCub: Tag deleted:', tagId);
}

} // END of ThreadCubTagging class

// === END SECTION 1H ===

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
          console.log('🐻 ThreadCub: No continuation data found');
        }
      });
    } catch (error) {
      console.log('🐻 ThreadCub: Error checking continuation data:', error);
    }
  } else {
    // Fallback to localStorage
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

// ===== Manual instructions fallback =====
function showManualInstructions(prompt, continuationData) {
  console.log('🔧 Showing manual instructions as fallback');
  
  const isChatGPTFlow = continuationData.chatGPTFlow === true;
  
  const instructionPopup = document.createElement('div');
  instructionPopup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 520px; width: 90%; z-index: 10000001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    opacity: 0; transition: all 0.3s ease;
  `;
  
  const platformColor = isChatGPTFlow ? '#10a37f' : '#667eea';
  const platformIcon = isChatGPTFlow ? '💬' : '🐻';
  
  instructionPopup.innerHTML = `
    <div style="padding: 32px; text-align: center;">
      <div style="background: ${platformColor}; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px;">${platformIcon}</div>
      <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px;">Manual Setup Required</h2>
      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">Auto-setup didn't work, but we can do this manually!</p>
      
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: left;">
        <h3 style="margin: 0 0 8px; color: #374151; font-size: 14px;">Copy and paste this message:</h3>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 120px; overflow-y: auto;">${prompt}</div>
      </div>
      
      <button id="threadcub-manual-close" style="padding: 12px 24px; background: ${platformColor}; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Got It</button>
    </div>
  `;
  
  document.body.appendChild(instructionPopup);
  setTimeout(() => instructionPopup.style.opacity = '1', 50);
  
  // FIXED: Proper event listener instead of inline onclick
  const closeButton = instructionPopup.querySelector('#threadcub-manual-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      console.log('🔧 Manual popup close button clicked');
      instructionPopup.style.opacity = '0';
      setTimeout(() => {
        if (instructionPopup.parentNode) {
          instructionPopup.parentNode.removeChild(instructionPopup);
        }
      }, 300);
    });
  }
  
  // Also allow clicking outside to close
  instructionPopup.addEventListener('click', (e) => {
    if (e.target === instructionPopup) {
      console.log('🔧 Manual popup overlay clicked');
      instructionPopup.style.opacity = '0';
      setTimeout(() => {
        if (instructionPopup.parentNode) {
          instructionPopup.parentNode.removeChild(instructionPopup);
        }
      }, 300);
    }
  });
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

// === SECTION 2B: Popup Event Setup ===
// removed since we don't need popup event listeners anymore
// === END SECTION 2B ===

// === SECTION 2B-4: Support Functions ===
// removed since we're eliminating the modal system entirely, we don't need any of the popup-related support functions. The new streamlined system handles success messages differently with the subtle notification approach.
// === END SECTION 2B-4 ===

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
      'textarea[placeholder*="Message"]'
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
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    console.log('✅ ThreadCub: Input field filled with continuation prompt');
  } else {
    console.log('❌ ThreadCub: Could not find input field');
  }
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

// === SECTION 4A: ThreadCubFloatingButton Core ===

class ThreadCubFloatingButton {
  constructor() {
    this.button = null;
    this.shadowButton = null;
    this.borderOverlay = null;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentEdge = 'right';
    this.currentPosition = 0.5;
    this.edgeMargin = 25;
    this.buttonSize = 60;
    this.currentBearState = 'default';
    this.isExporting = false;
    this.lastExportTime = 0;
    
    console.log('🐻 ThreadCub: Starting floating button...');
    
    this.init();
  }

  init() {
    this.createButton();
    this.createBorderOverlay();
    this.addStyles();
    this.setupEventListeners();
    this.loadPosition();
    
    console.log('🐻 ThreadCub: Floating button ready!');
  }

  createButton() {
    this.button = document.createElement('div');
    this.button.id = 'threadcub-edge-btn';
    
    // Try to get bear images first
    const bearImages = this.getBearImages();
    
    this.button.innerHTML = `
  <div class="threadcub-btn-content">
    <div class="threadcub-bear-face" id="bear-face">
      ${bearImages.default}
    </div>
  </div>
  <div class="threadcub-action-buttons">
    <div class="threadcub-new-btn" data-action="new">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>
        <path d="m21 3-9 9"/>
        <path d="M15 3h6v6"/>
      </svg>
    </div>
    <div class="threadcub-download-btn" data-action="download">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 15V3"/>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <path d="m7 10 5 5 5-5"/>
      </svg>
    </div>
    <div class="threadcub-tag-btn" data-action="tag">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/>
        <path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/>
        <circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/>
      </svg>
    </div>
    <div class="threadcub-close-btn" data-action="close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>
    </div>
  </div>
  <div class="threadcub-grip-icon">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="12" r="1"/>
      <circle cx="9" cy="5" r="1"/>
      <circle cx="9" cy="19" r="1"/>
      <circle cx="15" cy="12" r="1"/>
      <circle cx="15" cy="5" r="1"/>
      <circle cx="15" cy="19" r="1"/>
    </svg>
  </div>
`;

    // Store the bear image URLs for later use
    this.bearImages = bearImages;

    // Apply base styles
    this.button.style.cssText = `
      position: fixed;
      width: ${this.buttonSize}px;
      height: ${this.buttonSize}px;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid rgba(226, 232, 240, 0.8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: all 0.2s ease;
      user-select: none;
      color: #94a3b8;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
      backdrop-filter: blur(10px);
    `;

    // Set initial position
    this.setEdgePosition('right', 0.5);
    
    // Add to page
    document.body.appendChild(this.button);
    console.log('🐻 ThreadCub: Button added to page');
  }

  getBearImages() {
    console.log('🐻 ThreadCub: Getting bear images with fallback handling...');
    
    // FIXED: More robust extension context checking
    let useExtensionImages = false;
    
    try {
      // Check if we're in a proper extension context
      if (typeof chrome !== 'undefined' && 
          chrome.runtime && 
          chrome.runtime.getURL && 
          chrome.runtime.id) {
        
        // Test if we can actually generate a URL
        const testUrl = chrome.runtime.getURL('icons/icon-48.png');
        if (testUrl && testUrl.startsWith('chrome-extension://')) {
          useExtensionImages = true;
          console.log('🐻 ThreadCub: Extension context available, using extension images');
        }
      }
    } catch (error) {
      console.log('🐻 ThreadCub: Extension context not available:', error);
      useExtensionImages = false;
    }
    
    if (useExtensionImages) {
      try {
        const defaultIcon = chrome.runtime.getURL('icons/icon-48.png');
        const happyIcon = chrome.runtime.getURL('icons/icon-happy.png');
        const sadIcon = chrome.runtime.getURL('icons/icon-sad.png');
        const taggingIcon = chrome.runtime.getURL('icons/icon-happier.png');
        
        return {
          default: `<img src="${defaultIcon}" width="48" height="48" alt="ThreadCub" style="transition: all 0.2s ease;" onerror="console.log('🐻 Image load failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <span style="display: none; font-size: 32px;">🐻</span>`,
          happy: `<img src="${happyIcon}" width="48" height="48" alt="Happy ThreadCub" style="transition: all 0.2s ease;" onerror="console.log('🐻 Happy image failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                  <span style="display: none; font-size: 32px;">😊</span>`,
          sad: `<img src="${sadIcon}" width="48" height="48" alt="Sad ThreadCub" style="transition: all 0.2s ease;" onerror="console.log('🐻 Sad image failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <span style="display: none; font-size: 32px;">😢</span>`,
          tagging: `<img src="${taggingIcon}" width="48" height="48" alt="Tagging ThreadCub" style="transition: all 0.2s ease;" onerror="console.log('🐻 Tagging image failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <span style="display: none; font-size: 32px;">🏷️</span>`
        };
      } catch (error) {
        console.log('🐻 ThreadCub: Error generating extension image URLs:', error);
      }
    }
    
    // Fallback to emojis (always works)
    console.log('🐻 ThreadCub: Using emoji fallbacks for maximum compatibility');
    return {
      default: '<span style="font-size: 32px;">🐻</span>',
      happy: '<span style="font-size: 32px;">😊</span>',
      sad: '<span style="font-size: 32px;">😢</span>',
      tagging: '<span style="font-size: 32px;">🏷️</span>'
    };
  }

  createBorderOverlay() {
    this.borderOverlay = document.createElement('div');
    this.borderOverlay.id = 'threadcub-border-overlay';
    this.borderOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 4px solid #4F46E5;
      pointer-events: none;
      z-index: 999998;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    document.body.appendChild(this.borderOverlay);
  }

// === END SECTION 4A ===

// === SECTION 4B: Button Styles & Layout ===

  addStyles() {
    if (document.getElementById('threadcub-styles')) return;
   
    const style = document.createElement('style');
    style.id = 'threadcub-styles';
    style.textContent = `
      #threadcub-edge-btn {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #threadcub-edge-btn:hover {
        transform: scale(1.05);
        filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.2));
        background: rgba(255, 255, 255, 1);
        border-color: #4F46E5;
      }
      
      #threadcub-edge-btn.dragging {
        transform: scale(1.1);
        filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.25));
        cursor: grabbing;
        transition: none;
      }
      
      .threadcub-btn-content {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .threadcub-bear-face {
        font-size: 32px;
        transition: all 0.2s ease;
        user-select: none;
        cursor: grab;
      }
      
      .threadcub-bear-face:active {
        cursor: grabbing;
      }
      
      .threadcub-action-buttons {
        position: absolute;
        display: flex;
        gap: 6px;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        flex-direction: column;
      }
      
      .threadcub-grip-icon {
        position: absolute;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: #94a3b8;
        pointer-events: none;
        transform: scale(0.8);
      }
      
      .threadcub-shadow-button {
        position: fixed;
        width: 48px;
        height: 48px;
        background: rgba(79, 70, 229, 0.3);
        border: 2px dashed rgba(79, 70, 229, 0.6);
        border-radius: 50%;
        pointer-events: none;
        z-index: 999997;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .threadcub-shadow-button.active {
        opacity: 1;
      }

      .threadcub-new-btn,
      .threadcub-download-btn,
      .threadcub-tag-btn,
      .threadcub-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transform: scale(0.7);
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.95);
        color: #64748b;
      }
      
      .threadcub-new-btn:hover {
        background: #925FE2 !important;
        color: white !important;
        transform: scale(1.1) !important;
        box-shadow: 0 4px 12px rgba(146, 95, 226, 0.4) !important;
      }
      
      .threadcub-download-btn:hover {
        background: #99DAFA !important;
        color: #4C596E !important;
        transform: scale(1.1) !important;
        box-shadow: 0 4px 12px rgba(153, 218, 250, 0.4) !important;
      }
      
      .threadcub-tag-btn:hover {
        background: #FFD700 !important;
        color: #4C596E !important;
        transform: scale(1.1) !important;
        box-shadow: 0 4px 12px rgba(254, 239, 144, 0.4) !important;
      }
   
      .threadcub-close-btn:hover {
        background: #ef4444 !important;
        color: white !important;
        transform: scale(1.1) !important;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
      }

      #threadcub-edge-btn.edge-right .threadcub-action-buttons,
      #threadcub-edge-btn.edge-left .threadcub-action-buttons {
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: column;
      }
      
      #threadcub-edge-btn.edge-top .threadcub-action-buttons {
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: column;
      }
      
      #threadcub-edge-btn.edge-bottom .threadcub-action-buttons {
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: column;
      }

      #threadcub-edge-btn:hover .threadcub-action-buttons,
      #threadcub-edge-btn .threadcub-action-buttons:hover {
        opacity: 1;
        pointer-events: auto;
      }
      
      #threadcub-edge-btn:hover .threadcub-new-btn,
      #threadcub-edge-btn:hover .threadcub-download-btn,
      #threadcub-edge-btn:hover .threadcub-tag-btn,
      #threadcub-edge-btn:hover .threadcub-close-btn {
        transform: scale(1);
      }
      
      #threadcub-edge-btn:hover .threadcub-grip-icon {
        opacity: 1;
      }
      
      #threadcub-edge-btn.dragging .threadcub-action-buttons {
        opacity: 0;
        pointer-events: none;
      }
      
      #threadcub-edge-btn.dragging .threadcub-grip-icon {
        opacity: 1;
        left: 50% !important;
        right: auto !important;
        top: 50% !important;
        bottom: auto !important;
        transform: translate(-50%, -50%) scale(1) !important;
      }

      .threadcub-tooltip {
        position: fixed !important;
        background: #4C596E !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 6px !important;
        font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        white-space: nowrap !important;
        z-index: 10000001 !important;
        opacity: 0 !important;
        transform: scale(0.8) !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        pointer-events: none !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      
      .threadcub-tooltip.show {
        opacity: 1 !important;
        transform: scale(1) !important;
      }
    `;
    
    document.head.appendChild(style);
  }

// === END SECTION 4B ===

// === SECTION 4C: Event Handling & Interactions ===

setupEventListeners() {
  // Mouse events
  this.button.addEventListener('mousedown', this.handleMouseDown.bind(this));
  document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  
  // Touch events
  this.button.addEventListener('touchstart', this.handleTouchStart.bind(this));
  document.addEventListener('touchmove', this.handleTouchMove.bind(this));
  document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  
  // Click events for action buttons
  this.button.addEventListener('click', this.handleClick.bind(this));
  
  // Custom tooltip system
  this.setupTooltips();
  
  // Hover events for bear expressions
  this.setupBearExpressionListeners();
  
  // Window resize
  window.addEventListener('resize', this.handleResize.bind(this));
}

setupTooltips() {
  const tooltipData = {
    'threadcub-new-btn': 'CONTINUE YOUR CHAT',
    'threadcub-download-btn': 'QUICK STASH',
    'threadcub-tag-btn': 'REMEMBEAR TAGS',
    'threadcub-close-btn': 'OH REALLY?'
  };
  
  Object.entries(tooltipData).forEach(([className, text]) => {
    const button = this.button.querySelector(`.${className}`);
    if (!button) return;
    
    let tooltip = null;
    let showTimeout = null;
    let hideTimeout = null;
    
    const showTooltip = (e) => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      
      showTimeout = setTimeout(() => {
        // Remove any existing tooltips
        document.querySelectorAll('.threadcub-tooltip').forEach(t => t.remove());
        
        // Create new tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'threadcub-tooltip';
        tooltip.textContent = text;
        
        // Set initial styles to prevent flash
        tooltip.style.position = 'fixed';
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
        
        // Add to DOM
        document.body.appendChild(tooltip);
        
        // Get button position
        const buttonRect = button.getBoundingClientRect();
        
        // Force layout calculation by accessing offsetWidth
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // Simple positioning: 8px to the left, vertically centered
        const x = buttonRect.left - tooltipWidth - 8;
        const y = buttonRect.top + (buttonRect.height - tooltipHeight) / 2;
        
        // Apply position
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        
        // Show with animation
        requestAnimationFrame(() => {
          tooltip.classList.add('show');
        });
        
      }, 150);
    };
    
    const hideTooltip = () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      
      if (tooltip) {
        tooltip.classList.remove('show');
        hideTimeout = setTimeout(() => {
          if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
          tooltip = null;
        }, 200);
      }
    };
    
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideTooltip);
  });
}

setupBearExpressionListeners() {
  const newBtn = this.button.querySelector('.threadcub-new-btn');
  const downloadBtn = this.button.querySelector('.threadcub-download-btn');
  const tagBtn = this.button.querySelector('.threadcub-tag-btn');
  const closeBtn = this.button.querySelector('.threadcub-close-btn');
  
  if (newBtn) {
    newBtn.addEventListener('mouseenter', () => this.setBearExpression('happy'));
    newBtn.addEventListener('mouseleave', () => this.setBearExpression('happy'));
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('mouseenter', () => this.setBearExpression('happy'));
    downloadBtn.addEventListener('mouseleave', () => this.setBearExpression('happy'));
  }
  
  if (tagBtn) {
    tagBtn.addEventListener('mouseenter', () => this.setBearExpression('tagging'));
    tagBtn.addEventListener('mouseleave', () => this.setBearExpression('happy'));
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('mouseenter', () => this.setBearExpression('sad'));
    closeBtn.addEventListener('mouseleave', () => this.setBearExpression('happy'));
  }
  
  this.button.addEventListener('mouseenter', () => {
    if (this.currentBearState === 'default') {
      this.setBearExpression('happy');
      this.currentBearState = 'happy';
    }
  });
  
  this.button.addEventListener('mouseleave', () => {
    this.setBearExpression('default');
    this.currentBearState = 'default';
  });
}

setBearExpression(state) {
  const bearFace = this.button.querySelector('.threadcub-bear-face');
  if (!bearFace || !this.bearImages) return;
  
  let newContent;
  switch (state) {
    case 'happy':
      newContent = this.bearImages.happy;
      break;
    case 'sad':
      newContent = this.bearImages.sad;
      break;
    case 'tagging':
      newContent = this.bearImages.tagging;
      break;
    default:
      newContent = this.bearImages.default;
  }
  
  bearFace.innerHTML = newContent;
}

// Handle tag button click with proper error handling
handleTagButtonClick() {
  try {
    console.log('🏷️ ThreadCub: Handling tag button click...');
    console.log('🏷️ ThreadCub: window.threadcubTagging exists:', !!window.threadcubTagging);
    
    if (window.threadcubTagging && typeof window.threadcubTagging.toggleSidePanel === 'function') {
      console.log('🏷️ ThreadCub: Calling toggleSidePanel...');
      window.threadcubTagging.toggleSidePanel();
    } else {
      console.log('🏷️ ThreadCub: Tagging system not available, initializing...');
      this.initializeTagging();
    }
  } catch (error) {
    console.error('🏷️ ThreadCub: Error in handleTagButtonClick:', error);
    this.showErrorToast('Tagging system error');
  }
}

// Initialize tagging system if not already available
initializeTagging() {
  if (typeof window.ThreadCubTagging !== 'undefined' && !window.threadcubTagging) {
    try {
      window.threadcubTagging = new window.ThreadCubTagging(this);
      console.log('🏷️ ThreadCub: Tagging system initialized from button click');
      
      // Now try to toggle the panel
      if (window.threadcubTagging.toggleSidePanel) {
        window.threadcubTagging.toggleSidePanel();
      }
    } catch (error) {
      console.error('🏷️ ThreadCub: Failed to initialize tagging system:', error);
    }
  } else {
    console.log('🏷️ ThreadCub: ThreadCubTagging class not available');
  }
}

// Public method to ensure tagging is available
ensureTaggingAvailable() {
  if (!window.threadcubTagging) {
    this.initializeTagging();
  }
  return !!window.threadcubTagging;
}

// Event handlers
handleMouseDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  
  // Check for action button clicks
  const newBtn = e.target.closest('.threadcub-new-btn');
  const downloadBtn = e.target.closest('.threadcub-download-btn');
  const tagBtn = e.target.closest('.threadcub-tag-btn');
  const closeBtn = e.target.closest('.threadcub-close-btn');
  
  if (newBtn) {
    this.saveAndOpenConversation('floating');
    return;
  }
  
  if (downloadBtn) {
    console.log('🐻 ThreadCub: Download button clicked by user - manual download only');
    this.downloadConversationJSON();
    return;
  }
  
  if (tagBtn) {
    console.log('🏷️ ThreadCub: Tag button clicked');
    this.handleTagButtonClick();
    return;
  }
  
  if (closeBtn) {
    this.destroy();
    return;
  }
  
  // Start drag for bear head, grip icon, or main button (but not action buttons)
  if (!e.target.closest('.threadcub-action-buttons')) {
    this.startDrag(e.clientX, e.clientY);
  }
}

handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  this.startDrag(touch.clientX, touch.clientY);
}

handleMouseMove(e) {
  if (!this.isDragging) return;
  e.preventDefault();
  this.updateDragPosition(e.clientX, e.clientY);
}

handleTouchMove(e) {
  if (!this.isDragging) return;
  e.preventDefault();
  const touch = e.touches[0];
  this.updateDragPosition(touch.clientX, touch.clientY);
}

handleMouseUp(e) {
  if (!this.isDragging) return;
  this.endDrag(e.clientX, e.clientY);
}

handleTouchEnd(e) {
  if (!this.isDragging) return;
  const touch = e.changedTouches[0];
  this.endDrag(touch.clientX, touch.clientY);
}

handleClick(e) {
  if (this.isDragging) return;
  
  e.preventDefault();
  e.stopPropagation();
}

handleResize() {
  setTimeout(() => {
    this.setEdgePosition(this.currentEdge, this.currentPosition);
  }, 100);
}

// Toast notification methods
showSuccessToast(message = '✅ Success!') {
  this.showToast(message, 'success');
}

showErrorToast(message = '❌ Error occurred') {
  this.showToast(message, 'error');
}

showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    height: 40px;
    background: ${type === 'success' ? '#DDFCFC' : '#FAE1E1'};
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: ${type === 'success' ? '#4B84A3' : '#E32920'};
    z-index: 10000000;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    user-select: none;
    pointer-events: none;
  `;

  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${type === 'success' 
        ? '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>' 
        : '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="m9 9 6 6"/>'
      }
    </svg>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 50);

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Static method for global access
static showGlobalSuccessToast(message = 'Operation completed successfully!') {
  if (window.threadcubButton && typeof window.threadcubButton.showSuccessToast === 'function') {
    window.threadcubButton.showSuccessToast(message);
  } else {
    // Fallback toast creation
    console.log('🐻 ThreadCub:', message);
  }
}

// Add destroy method if missing
destroy() {
  if (this.button && this.button.parentNode) {
    this.button.parentNode.removeChild(this.button);
  }
  if (this.borderOverlay && this.borderOverlay.parentNode) {
    this.borderOverlay.parentNode.removeChild(this.borderOverlay);
  }
  console.log('🐻 ThreadCub: Button destroyed');
}

// === END SECTION 4C ===

// === SECTION 4D: Drag & Drop Functionality ===

  startDrag(clientX, clientY) {
    this.isDragging = true;
    this.button.classList.add('dragging');
    this.startX = clientX;
    this.startY = clientY;
    
    this.borderOverlay.style.opacity = '1';
    this.createShadowButton();
  }

  createShadowButton() {
    if (this.shadowButton) this.shadowButton.remove();
    
    this.shadowButton = document.createElement('div');
    this.shadowButton.className = 'threadcub-shadow-button';
    document.body.appendChild(this.shadowButton);
    this.updateShadowPosition();
  }

  updateShadowPosition() {
    if (!this.shadowButton) return;
    
    const snapPosition = this.calculateSnapPosition(this.currentEdge, this.currentPosition);
    const x = snapPosition.x + 6;
    const y = snapPosition.y + 6;
    
    this.shadowButton.style.left = `${x}px`;
    this.shadowButton.style.top = `${y}px`;
    this.shadowButton.classList.add('active');
  }

  calculateSnapPosition(edge, position) {
    const { innerWidth: width, innerHeight: height } = window;
    let x, y;
    
    switch (edge) {
      case 'left':
        x = this.edgeMargin;
        y = position * (height - this.buttonSize);
        break;
      case 'right':
        x = width - this.buttonSize - this.edgeMargin;
        y = position * (height - this.buttonSize);
        break;
      case 'top':
        x = position * (width - this.buttonSize);
        y = this.edgeMargin;
        break;
      case 'bottom':
        x = position * (width - this.buttonSize);
        y = height - this.buttonSize - this.edgeMargin;
        break;
    }
    
    x = Math.max(this.edgeMargin, Math.min(width - this.buttonSize - this.edgeMargin, x));
    y = Math.max(this.edgeMargin, Math.min(height - this.buttonSize - this.edgeMargin, y));
    
    return { x, y };
  }

  updateDragPosition(clientX, clientY) {
    // Update button position
    this.button.style.left = `${clientX - this.buttonSize/2}px`;
    this.button.style.top = `${clientY - this.buttonSize/2}px`;
    
    // Calculate nearest edge
    const { innerWidth: width, innerHeight: height } = window;
    const distances = {
      left: clientX,
      right: width - clientX,
      top: clientY,
      bottom: height - clientY
    };
    
    const nearestEdge = Object.keys(distances).reduce((a, b) => distances[a] < distances[b] ? a : b);
    
    let position;
    if (nearestEdge === 'left' || nearestEdge === 'right') {
      position = Math.max(0, Math.min(1, (clientY - this.buttonSize/2) / (height - this.buttonSize)));
    } else {
      position = Math.max(0, Math.min(1, (clientX - this.buttonSize/2) / (width - this.buttonSize)));
    }
    
    this.currentEdge = nearestEdge;
    this.currentPosition = position;
    this.updateShadowPosition();
  }

  endDrag(clientX, clientY) {
    const moveDistance = Math.sqrt(
      Math.pow(clientX - this.startX, 2) + Math.pow(clientY - this.startY, 2)
    );
    
    this.isDragging = false;
    this.button.classList.remove('dragging');
    this.borderOverlay.style.opacity = '0';
    
    if (this.shadowButton) {
      this.shadowButton.classList.remove('active');
      setTimeout(() => {
        if (this.shadowButton) {
          this.shadowButton.remove();
          this.shadowButton = null;
        }
      }, 200);
    }
    
    if (moveDistance >= 10) {
      this.animateToEdgePosition();
      this.savePosition();
    }
  }

  animateToEdgePosition() {
    this.button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.setEdgePosition(this.currentEdge, this.currentPosition);
    
    setTimeout(() => {
      this.button.style.transition = 'all 0.2s ease';
    }, 300);
  }

  // Position management
  setEdgePosition(edge, position) {
    const snapPosition = this.calculateSnapPosition(edge, position);
    
    this.button.style.left = `${snapPosition.x}px`;
    this.button.style.top = `${snapPosition.y}px`;
    
    this.button.className = this.button.className.replace(/edge-\w+/g, '');
    this.button.classList.add(`edge-${edge}`);
    
    this.currentEdge = edge;
    this.currentPosition = position;
  }

  savePosition() {
    const position = { edge: this.currentEdge, position: this.currentPosition };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ threadcubButtonPosition: position });
      } else {
        localStorage.setItem('threadcubButtonPosition', JSON.stringify(position));
      }
    } catch (error) {
      console.log('🐻 ThreadCub: Could not save position:', error);
    }
  }

  async loadPosition() {
    try {
      let savedPosition = null;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['threadcubButtonPosition']);
        savedPosition = result.threadcubButtonPosition;
      } else {
        const saved = localStorage.getItem('threadcubButtonPosition');
        savedPosition = saved ? JSON.parse(saved) : null;
      }
      
      if (savedPosition && savedPosition.edge && typeof savedPosition.position === 'number') {
        this.setEdgePosition(savedPosition.edge, savedPosition.position);
      }
    } catch (error) {
      console.log('🐻 ThreadCub: Could not load position:', error);
    }
  }

  handleResize() {
    setTimeout(() => {
      this.setEdgePosition(this.currentEdge, this.currentPosition);
    }, 100);
  }

// === END SECTION 4D ===

// === SECTION 4E-1: Core API Integration (FIXED Extension Context) ===

// ===== MAIN METHOD: saveAndOpenConversation (FIXED) =====
async saveAndOpenConversation(source = 'floating') {
  console.log('🐻 ThreadCub: Starting conversation save and open from:', source);
  
  // Prevent double exports with debounce
  const now = Date.now();
  if (this.isExporting || (now - this.lastExportTime) < 2000) {
    console.log('🐻 ThreadCub: Export already in progress or too soon after last export');
    return;
  }
  
  this.isExporting = true;
  this.lastExportTime = now;
  
  try {
    // Extract conversation data from the current AI platform
    console.log('🐻 ThreadCub: Extracting conversation data...');
    
    let conversationData;
    const hostname = window.location.hostname;
    
    if (hostname.includes('claude.ai')) {
      conversationData = await this.extractClaudeConversation();
    } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      conversationData = this.extractChatGPTMessages();
    } else {
      conversationData = this.extractGenericConversation();
    }
    
    // CRITICAL FIX: Validate conversation data before proceeding
    if (!conversationData) {
      console.error('🐻 ThreadCub: No conversation data returned from extraction');
      this.showErrorToast('No conversation found to save');
      this.isExporting = false;
      return;
    }
    
    if (!conversationData.messages || conversationData.messages.length === 0) {
      console.error('🐻 ThreadCub: No messages found in conversation data');
      this.showErrorToast('No messages found in conversation');
      this.isExporting = false;
      return;
    }
    
    console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages`);
    
    // FIXED: Store conversation data globally for later use
    this.lastConversationData = conversationData;
    
    // FIXED: Format data to match your API route expectations
    const apiData = {
      conversationData: conversationData,
      source: conversationData.platform?.toLowerCase() || 'unknown',
      title: conversationData.title || 'Untitled Conversation'
    };
    
    console.log('🐻 ThreadCub: Attempting to save via background script...');
    
    // FIXED: Better extension context handling
    let response;
    try {
      // Check if extension context is valid before attempting
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Extension context not available');
      }
      
      // Test if extension context is actually working
      if (chrome.runtime.lastError) {
        throw new Error('Extension context invalidated: ' + chrome.runtime.lastError.message);
      }
      
      response = await chrome.runtime.sendMessage({
        action: 'saveConversation',
        data: apiData
      });
      
      // Additional check for context invalidation after the call
      if (chrome.runtime.lastError) {
        throw new Error('Extension context invalidated during call: ' + chrome.runtime.lastError.message);
      }
      
    } catch (contextError) {
      console.log('🐻 ThreadCub: Extension context error:', contextError.message);
      console.log('🐻 ThreadCub: Falling back to direct continuation without API save...');
      
      // FALLBACK: Skip API save and go straight to continuation
      this.handleDirectContinuation(conversationData);
      this.isExporting = false;
      return;
    }

    if (!response || !response.success) {
      console.error('🐻 ThreadCub: Background script API call failed:', response?.error);
      console.log('🐻 ThreadCub: Falling back to direct continuation without API save...');
      
      // FALLBACK: Skip API save and go straight to continuation
      this.handleDirectContinuation(conversationData);
      this.isExporting = false;
      return;
    }

    const data = response.data;
    console.log('✅ ThreadCub: Conversation saved via background script:', data);

    // Generate continuation prompt and handle platform-specific flow
    const summary = data.summary || this.generateQuickSummary(conversationData.messages);
    const shareUrl = data.shareableUrl || `https://threadcub.com/api/share/${data.conversationId}`;
    
    // Generate minimal continuation prompt
    const minimalPrompt = this.generateContinuationPrompt(summary, shareUrl, conversationData.platform, conversationData);
    
    // FIXED: Detect target platform for smart routing
    const targetPlatform = this.getTargetPlatformFromCurrentUrl();
    
    if (targetPlatform === 'chatgpt') {
      // ChatGPT flow: Auto-download + cross-tab continuation
      console.log('🐻 ThreadCub: Routing to ChatGPT flow (with file download)');
      this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
    } else if (targetPlatform === 'claude') {
      // Claude flow: API-only + cross-tab continuation (no download)
      console.log('🐻 ThreadCub: Routing to Claude flow (no file download)');
      this.handleClaudeFlow(minimalPrompt, shareUrl, conversationData);
    } else {
      // Default to ChatGPT flow
      console.log('🐻 ThreadCub: Unknown platform, defaulting to ChatGPT flow');
      this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
    }

    this.setBearExpression('happy');
    setTimeout(() => {
      if (this.currentBearState !== 'default') {
        this.setBearExpression('default');
      }
    }, 2000);

    this.isExporting = false;

  } catch (error) {
    console.error('🐻 ThreadCub: Export error:', error);
    this.showErrorToast('Export failed: ' + error.message);
    this.isExporting = false;
  }
}

// NEW: Handle direct continuation without API save (fallback)
handleDirectContinuation(conversationData) {
  console.log('🐻 ThreadCub: Handling direct continuation without API save...');
  
  // Create a fallback share URL
  const fallbackShareUrl = `https://threadcub.com/fallback/${Date.now()}`;
  
  // Generate a simple continuation prompt
  const summary = this.generateQuickSummary(conversationData.messages);
  const minimalPrompt = this.generateContinuationPrompt(summary, fallbackShareUrl, conversationData.platform, conversationData);
  
  // Route to appropriate platform flow
  const targetPlatform = this.getTargetPlatformFromCurrentUrl();
  
  if (targetPlatform === 'chatgpt') {
    console.log('🐻 ThreadCub: Direct ChatGPT continuation (no API save)');
    this.handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData);
  } else if (targetPlatform === 'claude') {
    console.log('🐻 ThreadCub: Direct Claude continuation (no API save)');
    this.handleClaudeFlow(minimalPrompt, fallbackShareUrl, conversationData);
  } else {
    console.log('🐻 ThreadCub: Direct continuation - defaulting to ChatGPT flow');
    this.handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData);
  }
  
  this.showSuccessToast('Continuing conversation (offline mode)');
}

// === HELPER METHODS (UNCHANGED) ===

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
}

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
}

// === END SECTION 4E-1 ===

// === SECTION 4E-2: ChatGPT Flow Handler (ENHANCED UX WITH AUTO-DOWNLOAD) ===

// ENHANCED: Same smooth UX as Claude but with auto-download + file upload approach
handleChatGPTFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🤖 ThreadCub: Starting ENHANCED ChatGPT flow with auto-download...');
  console.log('🤖 ThreadCub: Conversation data:', conversationData);
  console.log('🤖 ThreadCub: Message count:', conversationData.messages?.length || 0);
  
  // STEP 1: Auto-download the conversation file in background
  this.autoDownloadChatGPTFile(conversationData, shareUrl);
  
  // STEP 2: Create continuation data for cross-tab modal (same as Claude)
  const continuationData = {
    prompt: this.generateChatGPTContinuationPrompt(), // Generic upload prompt
    shareUrl: shareUrl,
    platform: 'ChatGPT',
    timestamp: Date.now(),
    // Include message count data for modal display
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    // Special flag for ChatGPT flow
    chatGPTFlow: true,
    downloadCompleted: true
  };
  
  console.log('🤖 ThreadCub: ChatGPT continuation data prepared');
  
  // STEP 3: Use same storage approach as Claude for modal
  const canUseChrome = this.canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🤖 ThreadCub: Using Chrome storage for ChatGPT modal...');
    this.storeWithChrome(continuationData)
      .then(() => {
        console.log('🐻 ThreadCub: ChatGPT data stored successfully');
        // Open ChatGPT tab (modal will show there)
        const chatGPTUrl = 'https://chatgpt.com/';
        window.open(chatGPTUrl, '_blank');
        this.showSuccessToast('File downloaded! Check your new ChatGPT tab.');
      })
      .catch(error => {
        console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
        this.handleChatGPTFlowFallback(continuationData);
      });
  } else {
    console.log('🤖 ThreadCub: Using ChatGPT fallback method directly');
    this.handleChatGPTFlowFallback(continuationData);
  }
}

// ENHANCED: Auto-download conversation file for ChatGPT
autoDownloadChatGPTFile(conversationData, shareUrl) {
  try {
    console.log('🤖 ThreadCub: Auto-downloading conversation file for ChatGPT...');
    
    // Create comprehensive conversation file
    const conversationJSON = {
      title: conversationData.title || 'ThreadCub Conversation Continuation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform,
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages.length,
      source: 'ThreadCub Browser Extension - ChatGPT Continuation',
      shareUrl: shareUrl,
      instructions: 'This file contains our previous conversation. Please review it and continue from where we left off.',
      
      // Include all the conversation messages
      messages: conversationData.messages,
      
      // Metadata for context
      summary: this.generateQuickSummary(conversationData.messages)
    };
    
    const filename = `threadcub-continuation-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
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

// ENHANCED: Generate specific continuation prompt for ChatGPT input field
generateChatGPTContinuationPrompt() {
  return `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
}

// Fallback method (same as before but with auto-download)
handleChatGPTFlowFallback(continuationData) {
  console.log('🤖 ThreadCub: Using localStorage fallback for ChatGPT...');
  
  try {
    // Store in localStorage as fallback
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 ChatGPT Fallback: Data stored in localStorage');
    
    // Open ChatGPT tab
    const chatGPTUrl = 'https://chatgpt.com/';
    window.open(chatGPTUrl, '_blank');
    this.showSuccessToast('File downloaded! Check your new ChatGPT tab.');
    
  } catch (error) {
    console.error('🔧 ChatGPT Fallback: localStorage failed:', error);
    this.showManualChatGPTInstructions(continuationData);
  }
}

// Manual instructions for ultimate fallback
showManualChatGPTInstructions(continuationData) {
  console.log('🤖 ThreadCub: Showing manual ChatGPT instructions');
  
  const instructionPopup = document.createElement('div');
  instructionPopup.className = 'threadcub-manual-instructions';
  instructionPopup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 520px; width: 90%; z-index: 10000001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    opacity: 0; transition: all 0.3s ease;
  `;
  
  instructionPopup.innerHTML = `
    <div style="padding: 32px; text-align: center;">
      <div style="background: linear-gradient(135deg, #10a37f 0%, #0d8f6f 100%); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px;">💬</div>
      <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px;">File Downloaded!</h2>
      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">Your conversation file is ready to upload to ChatGPT</p>
      
      <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
        <h3 style="margin: 0 0 12px; color: #16a34a; font-size: 16px;">📁 Next Steps:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.6;">
          <li><strong>Click "Open ChatGPT"</strong> below</li>
          <li><strong>Upload the downloaded JSON file</strong> (drag & drop or click + icon)</li>
          <li><strong>Ask ChatGPT to continue</strong> from where you left off</li>
        </ol>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="manual-open-chatgpt" style="padding: 16px 32px; background: #10a37f; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Open ChatGPT</button>
        <button id="close-manual-instructions" style="padding: 16px 32px; background: #e5e7eb; border: none; border-radius: 8px; color: #6b7280; cursor: pointer; font-weight: 600;">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(instructionPopup);
  setTimeout(() => instructionPopup.style.opacity = '1', 50);
  
  instructionPopup.querySelector('#manual-open-chatgpt').addEventListener('click', () => {
    window.open('https://chatgpt.com/', '_blank');
    instructionPopup.remove();
  });
  
  instructionPopup.querySelector('#close-manual-instructions').addEventListener('click', () => {
    instructionPopup.remove();
  });
}

// === END SECTION 4E-2 ===

// === SECTION 4E-3: Claude Flow Handler (NO DOWNLOADS) ===

// CLAUDE-ONLY: Handle Claude with API-based continuation (no file downloads)
handleClaudeFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🤖 ThreadCub: Starting Claude flow (API-only, no downloads)...');
  console.log('🤖 ThreadCub: Conversation data:', conversationData);
  
  // CLAUDE: Create continuation data for cross-tab modal (no downloads)
  const continuationData = {
    prompt: continuationPrompt, // URL-based prompt for Claude
    shareUrl: shareUrl,
    platform: 'Claude',
    timestamp: Date.now(),
    // Include message count data
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    // Claude-specific flag (no download needed)
    claudeFlow: true,
    downloadCompleted: false // Claude doesn't need downloads
  };
  
  console.log('🤖 ThreadCub: Claude continuation data with message count:', continuationData.totalMessages);
  
  // Use same storage approach for cross-tab continuation
  const canUseChrome = this.canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🤖 ThreadCub: Using Chrome storage for Claude...');
    this.storeWithChrome(continuationData)
      .then(() => {
        console.log('🐻 ThreadCub: Claude data stored successfully');
        // Open Claude tab (streamlined continuation will handle the rest)
        const claudeUrl = 'https://claude.ai/';
        window.open(claudeUrl, '_blank');
        this.showSuccessToast('Opening Claude with conversation context...');
      })
      .catch(error => {
        console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
        this.handleClaudeFlowFallback(continuationData);
      });
  } else {
    console.log('🤖 ThreadCub: Using Claude fallback method directly');
    this.handleClaudeFlowFallback(continuationData);
  }
}

// MISSING FUNCTION: Check if Chrome storage is available
canUseChromStorage() {
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

// MISSING FUNCTION: Store with Chrome storage
async storeWithChrome(continuationData) {
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

// CLAUDE: Fallback method when Chrome storage fails
handleClaudeFlowFallback(continuationData) {
  console.log('🤖 ThreadCub: Using localStorage fallback for Claude...');
  
  try {
    // Store in localStorage as fallback
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 Claude Fallback: Data stored in localStorage');
    
    // Open Claude tab
    const claudeUrl = 'https://claude.ai/';
    window.open(claudeUrl, '_blank');
    this.showSuccessToast('Opening Claude with conversation context...');
    
  } catch (error) {
    console.error('🔧 Claude Fallback: localStorage failed:', error);
    this.showManualClaudeInstructions(continuationData);
  }
}

// CLAUDE: Manual instructions for ultimate fallback
showManualClaudeInstructions(continuationData) {
  console.log('🤖 ThreadCub: Showing manual Claude instructions');
  
  const instructionPopup = document.createElement('div');
  instructionPopup.className = 'threadcub-manual-instructions';
  instructionPopup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 520px; width: 90%; z-index: 10000001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    opacity: 0; transition: all 0.3s ease;
  `;
  
  instructionPopup.innerHTML = `
    <div style="padding: 32px; text-align: center;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px;">🐻</div>
      <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px;">Continue Manually</h2>
      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">The conversation context URL is ready to share!</p>
      
      <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left;">
        <h3 style="margin: 0 0 12px; color: #0369a1; font-size: 16px;">🔗 Simple Steps:</h3>
        <ol style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px; line-height: 1.6;">
          <li><strong>Click "Open Claude"</strong> below</li>
          <li><strong>Share the conversation URL</strong> with Claude</li>
          <li><strong>Continue your conversation</strong> (${continuationData.totalMessages} messages)</li>
        </ol>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="manual-open-claude" style="padding: 16px 32px; background: #667eea; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Open Claude</button>
        <button id="close-manual-instructions" style="padding: 16px 32px; background: #e5e7eb; border: none; border-radius: 8px; color: #6b7280; cursor: pointer; font-weight: 600;">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(instructionPopup);
  setTimeout(() => instructionPopup.style.opacity = '1', 50);
  
  instructionPopup.querySelector('#manual-open-claude').addEventListener('click', () => {
    window.open('https://claude.ai/', '_blank');
    instructionPopup.remove();
  });
  
  instructionPopup.querySelector('#close-manual-instructions').addEventListener('click', () => {
    instructionPopup.remove();
  });
}

// === END SECTION 4E-3 ===

// === SECTION 4E-4: Manual Download Function (IMPROVED NAMING) ===

// ===== Generate manual download with improved naming =====
downloadContinuationJSON(conversationData, shareUrl) {
  try {
    console.log('🐻 ThreadCub: Creating manual download JSON...');
    
    // Create comprehensive conversation file
    const conversationJSON = {
      title: conversationData.title || 'ThreadCub Conversation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform,
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages.length,
      source: 'ThreadCub Browser Extension - Manual Export',
      shareUrl: shareUrl,
      
      // Include all the conversation messages
      messages: conversationData.messages,
      
      // Metadata for context
      summary: this.generateQuickSummary(conversationData.messages)
    };
    
    // IMPROVED: Use same clean naming convention as ChatGPT auto-download
    const filename = `threadcub-continuation-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
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
    
    console.log('🐻 ThreadCub: ✅ Manual download completed:', filename);
    
  } catch (error) {
    console.error('🐻 ThreadCub: Error creating manual download:', error);
  }
}

// === END SECTION 4E-4 ===

// === SECTION 4E-5: Instruction Event Listeners ===

setupInstructionEventListeners(instructionPopup) {
  const showDownloadsBtn = instructionPopup.querySelector('#show-downloads');
  const openChatGPTBtn = instructionPopup.querySelector('#open-chatgpt');
  const closeInstructionsBtn = instructionPopup.querySelector('#close-instructions');
  
  // FIXED: Show downloads folder with multiple fallback methods
  showDownloadsBtn.addEventListener('click', () => {
    console.log('🐻 ThreadCub: Attempting to show downloads folder...');
    
    let downloadOpened = false;
    
    // Method 1: Try Chrome downloads API
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      try {
        chrome.downloads.showDefaultFolder();
        downloadOpened = true;
        console.log('🐻 ThreadCub: Downloads opened via Chrome API');
      } catch (error) {
        console.log('🐻 ThreadCub: Chrome downloads API failed:', error);
      }
    }
    
    // Method 2: Try opening downloads page
    if (!downloadOpened) {
      try {
        window.open('chrome://downloads/', '_blank');
        downloadOpened = true;
        console.log('🐻 ThreadCub: Downloads page opened');
      } catch (error) {
        console.log('🐻 ThreadCub: Chrome downloads page failed:', error);
      }
    }
    
    // Method 3: Fallback to file explorer for different OS
    if (!downloadOpened) {
      try {
        // Try to open file manager (works on some systems)
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) {
          window.open('file:///Users/' + (process.env.USER || process.env.USERNAME || 'user') + '/Downloads/', '_blank');
        } else if (userAgent.includes('win')) {
          window.open('file:///C:/Users/' + (process.env.USER || process.env.USERNAME || 'user') + '/Downloads/', '_blank');
        } else {
          // Linux or others
          window.open('file:///home/' + (process.env.USER || process.env.USERNAME || 'user') + '/Downloads/', '_blank');
        }
        downloadOpened = true;
        console.log('🐻 ThreadCub: File manager opened');
      } catch (error) {
        console.log('🐻 ThreadCub: File manager failed:', error);
      }
    }
    
    // Method 4: Show message if all else fails
    if (!downloadOpened) {
      alert('Please check your Downloads folder for:\nthreadcub-continuation-' + new Date().toISOString().split('T')[0] + '.json');
    }
    
    // Visual feedback regardless
    showDownloadsBtn.style.background = '#15803d';
    showDownloadsBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>
      Downloads Opened
    `;
  });
  
  openChatGPTBtn.addEventListener('click', () => {
    // Add loading state
    openChatGPTBtn.style.background = '#0d8f6f';
    openChatGPTBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
      </svg>
      Opening ChatGPT...
    `;
    
    setTimeout(() => {
      window.open('https://chatgpt.com/', '_blank');
      
      // Update button to show success
      openChatGPTBtn.style.background = '#16a34a';
      openChatGPTBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
        ChatGPT Opened
      `;
      
      // Change the close button text
      closeInstructionsBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
        Done! Close This
      `;
      closeInstructionsBtn.style.background = '#16a34a';
      closeInstructionsBtn.style.color = 'white';
    }, 500);
  });
  
  closeInstructionsBtn.addEventListener('click', () => {
    instructionPopup.style.opacity = '0';
    setTimeout(() => {
      if (instructionPopup.parentNode) {
        instructionPopup.parentNode.removeChild(instructionPopup);
      }
    }, 300);
  });
}

// === END SECTION 4E-5 ===

// === SECTION 4E-6: Regular Download Methods (COMPLETE WITH ALL METHODS) ===

// SIMPLIFIED: Enhanced download conversation as JSON functionality
async downloadConversationJSON() {
  console.log('🐻 ThreadCub: Starting JSON download...');
  
  try {
    // Extract conversation data
    console.log('🐻 ThreadCub: Extracting conversation data for download...');
    
    let conversationData;
    const hostname = window.location.hostname;
    
    if (hostname.includes('claude.ai')) {
      conversationData = await this.extractClaudeConversation();
    } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      conversationData = this.extractChatGPTMessages();
    } else {
      conversationData = this.extractGenericConversation();
    }
    
    if (!conversationData || !conversationData.messages || conversationData.messages.length === 0) {
      console.error('🐻 ThreadCub: No conversation data found');
      console.log('🐻 ThreadCub: Conversation data:', conversationData);
      
      // Create a fallback download with basic page info
      const fallbackData = {
        title: document.title || 'AI Conversation',
        url: window.location.href,
        platform: hostname.includes('claude.ai') ? 'Claude.ai' : 'Unknown',
        exportDate: new Date().toISOString(),
        totalMessages: 0,
        messages: [],
        note: 'No conversation messages could be extracted from this page'
      };
      
      this.createDownloadFromData(fallbackData);
      this.showSuccessToast();
      return;
    }
    
    console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages for download`);
    
    // Create and download the conversation data
    this.createDownloadFromData(conversationData);
    this.showSuccessToast();
    
  } catch (error) {
    console.error('🐻 ThreadCub: Download error:', error);
    
    // Create emergency fallback download
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
    
    this.createDownloadFromData(emergencyData);
    this.showErrorToast();
  }
}

// FIXED: Method to create download from data
createDownloadFromData(conversationData) {
  try {
    // Create JSON file
    const tagsData = {
      title: conversationData.title || 'ThreadCub Conversation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform || 'Unknown',
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages ? conversationData.messages.length : 0,
      messages: conversationData.messages || []
    };
    
    // Generate smart filename
    const filename = this.generateSmartFilename(conversationData);
    
    // Trigger download
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

// FIXED: Generate smart filename based on conversation content
generateSmartFilename(conversationData) {
  try {
    const platform = conversationData.platform?.toLowerCase() || 'chat';
    
    // Extract meaningful title or first user message
    let conversationIdentifier = '';
    
    if (conversationData.title && conversationData.title !== 'ThreadCub Conversation' && conversationData.title.trim().length > 0) {
      // Use page title if available and meaningful
      conversationIdentifier = this.sanitizeFilename(conversationData.title);
    } else if (conversationData.messages && conversationData.messages.length > 0) {
      // Find first user message and use it as identifier
      const firstUserMessage = conversationData.messages.find(msg => 
        msg.role === 'user' || msg.role === 'human'
      );
      
      if (firstUserMessage && firstUserMessage.content) {
        // Take first 50 characters of first user message
        const content = firstUserMessage.content.trim();
        conversationIdentifier = this.sanitizeFilename(content.substring(0, 50));
      }
    }
    
    // Fallback to generic identifier if nothing found
    if (!conversationIdentifier) {
      conversationIdentifier = 'conversation';
    }
    
    // Create timestamp for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Construct filename: platform-identifier-date-time.json
    const filename = `${platform}-${conversationIdentifier}-${timestamp}.json`;
    
    console.log('🐻 ThreadCub: Generated filename:', filename);
    return filename;
  } catch (error) {
    console.error('🐻 ThreadCub: Error generating filename:', error);
    return `threadcub-conversation-${Date.now()}.json`;
  }
}

// FIXED: Sanitize text for filename use
sanitizeFilename(text) {
  try {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .slice(0, 50); // Limit length
  } catch (error) {
    console.error('🐻 ThreadCub: Error sanitizing filename:', error);
    return 'conversation';
  }
}

// FIXED: Download conversation for continuation with FULL data
downloadContinuationJSON(fullPrompt, shareUrl, conversationData) {
  try {
    // Use the same structure as regular download but optimized for continuation
    const conversationJSON = {
      title: conversationData.title || 'ThreadCub Conversation Continuation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform,
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages.length,
      source: 'ThreadCub Browser Extension - Continuation',
      shareUrl: shareUrl,
      instructions: 'Upload this file to ChatGPT and ask: "Continue our conversation from where we left off"',
      
      // Include all the conversation messages
      messages: conversationData.messages,
      
      // Also include the formatted prompt for reference
      formattedPrompt: fullPrompt
    };
    
    const filename = `threadcub-continuation-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(conversationJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('🐻 ThreadCub: Full continuation JSON downloaded with', conversationData.messages.length, 'messages');
    
  } catch (error) {
    console.error('🐻 ThreadCub: Error downloading continuation JSON:', error);
  }
}

// === END SECTION 4E-6 ===

// === SECTION 4E-7: Continuation Prompt Generation (FIXED - PLATFORM-SPECIFIC PROMPTS) ===

// ===== FIXED: Generate platform-specific continuation prompts =====
generateContinuationPrompt(summary, shareUrl, platform, conversationData) {
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

// === END SECTION 4E-7 ===

// === SECTION 4E-8: Claude Conversation Extraction with Smart Scrolling (COMPLETE) ===

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
}

// === SIMPLE WORKING EXTRACTION (COPY DIAGNOSTIC SUCCESS) ===
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
}

// === ENHANCED ROLE DETECTION (FIX #1) ===
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
}

// === SIMPLE CONTENT CLEANING (UNCHANGED) ===
simpleCleanContent(content) {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*Copy\s*$/gm, '')
    .replace(/^\s*Edit\s*$/gm, '')
    .replace(/^\s*Retry\s*$/gm, '')
    .trim();
}

// === GET DATA ATTRIBUTES (UNCHANGED) ===
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
}

// === FALLBACK METHOD (UNCHANGED) ===
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
}

// === KEEP EXISTING HELPER METHODS (UNCHANGED) ===
improvedRoleDetection(text, index) {
  return this.enhancedRoleDetection(text, index);
}

isUIElement(text, element) {
  const uiPatterns = [
    'New Chat', 'Copy', 'Send', 'Regenerate', 'Share', 'Settings',
    'Sign in', 'Sign out', 'Claude', 'Anthropic'
  ];
  
  const hasUIPattern = uiPatterns.some(pattern => text.includes(pattern));
  const hasInteractiveElements = element && element.querySelector && element.querySelector('input, textarea, button, a');
  const isTooShort = text.length < 20;
  
  return hasUIPattern || hasInteractiveElements || isTooShort;
}

emergencyExtraction() {
  console.log('🐻 ThreadCub: Using emergency extraction...');
  
  const messages = [];
  const allText = document.body.innerText || '';
  
  const chunks = allText.split(/\n\s*\n\s*\n/);
  
  chunks.forEach((chunk, index) => {
    const trimmed = chunk.trim();
    if (trimmed.length > 50 && !this.isUIElement(trimmed, document.body)) {
      messages.push({
        id: index,
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: trimmed,
        timestamp: new Date().toISOString(),
        extractionMethod: 'emergency'
      });
    }
  });
  
  return messages.slice(0, 50);
}

// === END SECTION 4E-8 ===

// === SECTION 4E-8-PART2: Claude Message Processing ===

processClaudeMessageElements(messageElements, title, messageIndex) {
  const messages = [];
  
  // If no messages found with selectors, try a different approach
  if (messageElements.length === 0) {
    console.log('🐻 ThreadCub: No messages found with selectors, trying manual approach...');
    
    // Look for any text content that might be messages
    const allTextElements = document.querySelectorAll('p, div[class*="text"], div[class*="content"], span');
    const potentialMessages = Array.from(allTextElements).filter(el => {
      const text = el.textContent?.trim();
      return text && 
             text.length > 20 && 
             text.length < 5000 && 
             !el.querySelector('button') &&
             !el.querySelector('input') &&
             !text.includes('New Chat') &&
             !text.includes('Copy');
    });
    
    console.log(`🐻 ThreadCub: Found ${potentialMessages.length} potential messages manually`);
    
    if (potentialMessages.length > 0) {
      messageElements = potentialMessages.slice(0, 50); // Limit to 50 most likely messages
    }
  }
  
  // Process found message elements
  if (messageElements.length > 0) {
    // Group consecutive elements that might be part of the same message
    const groupedMessages = [];
    let currentGroup = [];
    let lastY = -1;
    
    messageElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const currentY = rect.top;
      
      // If elements are close vertically, group them
      if (Math.abs(currentY - lastY) < 100 && currentGroup.length > 0) {
        currentGroup.push(element);
      } else {
        if (currentGroup.length > 0) {
          groupedMessages.push(currentGroup);
        }
        currentGroup = [element];
      }
      lastY = currentY;
    });
    
    // Add the last group
    if (currentGroup.length > 0) {
      groupedMessages.push(currentGroup);
    }
    
    // Convert groups to messages
    groupedMessages.forEach((group, groupIndex) => {
      try {
        const combinedText = group.map(el => el.innerText?.trim()).filter(t => t).join(' ');
        
        if (combinedText && combinedText.length > 10) {
          // Alternate between user and assistant
          const role = groupIndex % 2 === 0 ? 'user' : 'assistant';
          
          messages.push({
            id: messageIndex++,
            role: role,
            content: combinedText,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.log('🐻 ThreadCub: Error processing message group:', error);
      }
    });
  }
  
  const conversationData = {
    title: title,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    platform: 'Claude.ai',
    total_messages: messages.length,
    messages: messages
  };
  
  console.log(`🐻 ThreadCub: ✅ Extracted ${messages.length} messages from Claude.ai`);
  if (messages.length > 0) {
    console.log('🐻 ThreadCub: Sample message:', messages[0]);
  }
  
  return conversationData;
}

// === END SECTION 4E-8-PART2 ===

// === SECTION 4E-8-PART3: Platform-Specific Warning System with Matching Style ===

// ===== PROACTIVE MESSAGE COUNT MONITORING =====

initializeMessageMonitoring() {
  console.log('🐻 ThreadCub: Initializing platform-specific message count monitoring...');
  
  // Session tracking to avoid repeat warnings
  this.warningSession = {
    shown150: false,
    shown180: false,
    shown200: false,
    lastCount: 0,
    monitoringActive: false
  };
  
  // CRITICAL: Initialize URL tracking for new conversation detection
  this.lastUrl = window.location.href;
  
  // Start monitoring after page is fully loaded
  setTimeout(() => {
    this.startMessageCountMonitoring();
  }, 3000);
}

startMessageCountMonitoring() {
  if (this.warningSession.monitoringActive) {
    console.log('🐻 ThreadCub: Monitoring already active');
    return;
  }
  
  this.warningSession.monitoringActive = true;
  console.log('🐻 ThreadCub: Starting platform-specific continuous message count monitoring...');
  
  // Check immediately
  this.checkCurrentMessageCount();
  
  // Then check every 30 seconds
  this.monitoringInterval = setInterval(() => {
    this.checkCurrentMessageCount();
  }, 30000);
  
  // Also check when user scrolls (for dynamic loading)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      this.checkCurrentMessageCount();
    }, 2000);
  });
}

stopMessageCountMonitoring() {
  if (this.monitoringInterval) {
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
  }
  this.warningSession.monitoringActive = false;
  console.log('🐻 ThreadCub: Message count monitoring stopped');
}

// NEW: Detect new conversations by URL changes
detectNewConversation() {
  // Store the current URL to detect navigation
  if (!this.lastUrl) {
    this.lastUrl = window.location.href;
    return false;
  }
  
  const currentUrl = window.location.href;
  const urlChanged = currentUrl !== this.lastUrl;
  
  if (urlChanged) {
    console.log('🐻 ThreadCub: New conversation detected - URL changed');
    console.log('🐻 ThreadCub: Old URL:', this.lastUrl);
    console.log('🐻 ThreadCub: New URL:', currentUrl);
    this.lastUrl = currentUrl;
    return true;
  }
  
  return false;
}

async checkCurrentMessageCount() {
  try {
    // CRITICAL: Check for new conversation first
    if (this.detectNewConversation()) {
      console.log('🐻 ThreadCub: New conversation detected - resetting warning session');
      this.resetWarningSession();
    }
    
    const hostname = window.location.hostname;
    let messageCount = 0;
    
    if (hostname.includes('claude.ai')) {
      messageCount = await this.countClaudeMessagesAccurately();
    } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      messageCount = this.countChatGPTMessages();
    } else {
      messageCount = this.countGenericMessages();
    }
    
    // Only process if count has changed significantly (avoid noise)
    if (Math.abs(messageCount - this.warningSession.lastCount) >= 2) {
      console.log(`🐻 ThreadCub: Platform-specific message count check: ${messageCount} (was ${this.warningSession.lastCount})`);
      this.warningSession.lastCount = messageCount;
      this.processPlatformSpecificWarnings(messageCount);
    }
    
  } catch (error) {
    console.log('🐻 ThreadCub: Error checking message count:', error);
  }
}

async countClaudeMessagesAccurately() {
  console.log('🐻 ThreadCub: Counting Claude messages using smart extraction...');
  
  try {
    let messages = [];
    
    // Try smart container extraction first
    messages = this.workingContainerExtraction();
    
    if (messages.length === 0) {
      messages = this.emergencyExtraction();
    }
    
    console.log(`🐻 ThreadCub: Smart counting found ${messages.length} Claude messages`);
    return messages.length;
    
  } catch (error) {
    console.log('🐻 ThreadCub: Error in smart counting, using fallback:', error);
    return this.countClaudeMessagesFallback();
  }
}

countClaudeMessagesFallback() {
  try {
    const messageSelectors = [
      '[data-testid*="message"]',
      '[class*="message-"]',
      '[class*="conversation-turn"]',
      'div[class*="group"]:has(div[class*="whitespace-pre-wrap"])',
      'div[class*="prose"]'
    ];
    
    let messageElements = [];
    
    for (const selector of messageSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          messageElements = Array.from(elements).filter(el => {
            const text = el.textContent?.trim() || '';
            return text.length >= 50 && 
                   text.length < 15000 &&
                   !text.includes('New Chat') &&
                   !text.includes('Copy') &&
                   !el.querySelector('input, textarea');
          });
          
          if (messageElements.length > 0) {
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    return Math.min(messageElements.length, 100);
    
  } catch (error) {
    console.log('🐻 ThreadCub: Error in fallback counting:', error);
    return 0;
  }
}

countChatGPTMessages() {
  try {
    const messageSelectors = [
      '[data-message-author-role]',
      '[data-message-id]',
      '[class*="group"][class*="w-full"]',
      'div[class*="markdown"]',
      '[role="presentation"] > div'
    ];
    
    let messageElements = [];
    
    for (const selector of messageSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          messageElements = Array.from(elements).filter(el => {
            const text = el.textContent?.trim() || '';
            return text.length >= 10 && 
                   text.length < 15000 &&
                   !text.includes('New chat') &&
                   !text.includes('Copy') &&
                   !el.querySelector('input, textarea');
          });
          
          if (messageElements.length > 0) {
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    return Math.min(messageElements.length, 500);
    
  } catch (error) {
    console.log('🐻 ThreadCub: Error counting ChatGPT messages:', error);
    return 0;
  }
}

countGenericMessages() {
  try {
    const textElements = document.querySelectorAll('p, div[class*="message"], .prose, div[class*="text"]');
    
    const validMessages = Array.from(textElements).filter(element => {
      try {
        const text = element.innerText?.trim();
        return text && 
               text.length > 20 && 
               text.length < 5000 &&
               !element.querySelector('button') &&
               !element.querySelector('input');
      } catch (error) {
        return false;
      }
    });
    
    return Math.min(validMessages.length, 500);
    
  } catch (error) {
    console.log('🐻 ThreadCub: Error counting generic messages:', error);
    return 0;
  }
}

processPlatformSpecificWarnings(messageCount) {
  const hostname = window.location.hostname;
  let thresholds;
  let platform;
  
  // Set platform-specific thresholds
  if (hostname.includes('claude.ai')) {
    thresholds = { info: 50, warning: 75, danger: 100 };
    platform = 'Claude';
  } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    thresholds = { info: 150, warning: 180, danger: 200 };
    platform = 'ChatGPT';
  } else {
    thresholds = { info: 100, warning: 150, danger: 200 };
    platform = 'Generic';
  }
  
  console.log(`🐻 ThreadCub: Processing ${platform} warning for ${messageCount} messages (thresholds: ${thresholds.info}/${thresholds.warning}/${thresholds.danger})`);
  
  // Check thresholds and show warnings only once per session
  if (messageCount >= thresholds.danger && !this.warningSession.shown200) {
    this.warningSession.shown200 = true;
    this.showMatchingStyleWarning('danger', messageCount, platform);
  } else if (messageCount >= thresholds.warning && !this.warningSession.shown180) {
    this.warningSession.shown180 = true;
    this.showMatchingStyleWarning('warning', messageCount, platform);
  } else if (messageCount >= thresholds.info && !this.warningSession.shown150) {
    this.warningSession.shown150 = true;
    this.showMatchingStyleWarning('info', messageCount, platform);
  }
}

showMatchingStyleWarning(severity, messageCount, platform) {
  console.log(`🐻 ThreadCub: Showing ${platform} ${severity} warning for ${messageCount} messages with matching style`);
  
  // Remove any existing message warnings first
  const existingWarnings = document.querySelectorAll('.threadcub-message-warning');
  existingWarnings.forEach(warning => warning.remove());
  
  // Create warning banner that matches your existing success banner style
  const toast = document.createElement('div');
  toast.className = 'threadcub-message-warning';
  
  // Your exact styling to match success banners
  const configs = {
    info: { 
      bg: '#DDFCFC', 
      text: '#4B84A3',
      message: `Psst... this thread's getting long (${messageCount} messages to be precise)`,
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
    },
    warning: { 
      bg: '#FBFCDD', 
      text: '#72765D',
      message: `Whoa bear! We're nearly at the limit (${messageCount} messages to be precise)`,
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>'
    },
    danger: { 
      bg: '#FAE1E1', 
      text: '#E32920',
      message: 'Time to wrap up. Tap the save or continue a new chat',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>'
    }
  };
  
  const config = configs[severity] || configs.info;
  
  // Match your exact success banner styling
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    height: 40px;
    background: ${config.bg};
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 800;
    font-size: 14px;
    color: ${config.text};
    z-index: 10000000;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    user-select: none;
    pointer-events: auto;
    cursor: pointer;
  `;
  
  // Build content with Lucide icon and your messaging style
  let content = `${config.icon}<span>${config.message}</span>`;
  
  // Add "OK, got it" button for danger level only (like your existing pattern)
  if (severity === 'danger') {
    content += `
      <div style="margin-left: 8px; background: #E32920; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 800; cursor: pointer;" 
           onclick="this.closest('.threadcub-message-warning').style.display='none'">
        OK, got it
      </div>
    `;
  }
  
  toast.innerHTML = content;
  document.body.appendChild(toast);
  
  // Click to dismiss functionality
  toast.addEventListener('click', (e) => {
    if (!e.target.textContent.includes('OK, got it')) {
      console.log(`🐻 ThreadCub: ${platform} warning dismissed`);
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  });
  
  // Animate in with your existing style
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 50);
  
  // Auto-hide for info and warning levels (danger persists like your existing banners)
  if (severity !== 'danger') {
    const hideDelay = severity === 'warning' ? 8000 : 6000;
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, hideDelay);
  }
  
  console.log(`🐻 ThreadCub: ${platform} ${severity} warning shown with matching style`);
}

// UPDATED: Reset warnings when page changes (for SPA navigation)
resetWarningSession() {
  console.log('🐻 ThreadCub: Resetting warning session for new conversation');
  this.warningSession = {
    shown150: false,
    shown180: false,
    shown200: false,
    lastCount: 0,
    monitoringActive: this.warningSession?.monitoringActive || false
  };
  
  // CRITICAL: Also remove any existing warning banners from previous conversation
  const existingWarnings = document.querySelectorAll('.threadcub-message-warning');
  existingWarnings.forEach(warning => warning.remove());
  
  console.log('🐻 ThreadCub: Warning session reset complete - banners cleared');
}

// === END SECTION 4E-8-PART3 ===

// === SECTION 4E-9: ChatGPT Conversation Extraction (TARGETED FIX) ===

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
}

// TARGETED: Extract content from ChatGPT message element
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
}

// Clean ChatGPT content
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
}

// Fallback extraction method for ChatGPT
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
}

// Also add the missing method that uses this one
extractChatGPTMessages() {
  return this.extractChatGPTConversation();
}

// === END SECTION 4E-9 ===

// === SECTION 4E-10: Generic & Gemini Conversation Extraction ===

extractGeminiConversation() {
  console.log('🐻 ThreadCub: Extracting Gemini conversation...');
  
  const messages = [];
  let messageIndex = 0;
  
  const title = document.title.replace(' - Gemini', '') || 'Gemini Conversation';
  
  // Gemini-specific selectors
  const messageSelectors = [
    '[data-test-id*="message"]',
    '.conversation-turn',
    '.model-response',
    '.user-input',
    '[class*="message-content"]',
    '[class*="response-container"]',
    'div[class*="markdown"]'
  ];
  
  let messageElements = [];
  
  for (const selector of messageSelectors) {
    try {
      messageElements = document.querySelectorAll(selector);
      console.log(`🐻 ThreadCub: Gemini selector "${selector}" found ${messageElements.length} elements`);
      if (messageElements.length > 0) {
        break;
      }
    } catch (error) {
      console.log(`🐻 ThreadCub: Error with Gemini selector "${selector}":`, error);
    }
  }

  messageElements.forEach((element, index) => {
    try {
      const text = element.innerText?.trim();
      if (text && text.length > 5) {
        const isUser = element.classList.contains('user') || 
                      element.querySelector('.user') ||
                      element.closest('[class*="user"]') ||
                      index % 2 === 0;
        
        messages.push({
          id: messageIndex++,
          role: isUser ? 'user' : 'assistant',
          content: text,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('🐻 ThreadCub: Error extracting Gemini message:', error);
    }
  });
  
  const conversationData = {
    title: title,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    platform: 'Gemini',
    total_messages: messages.length,
    messages: messages
  };
  
  console.log(`🐻 ThreadCub: ✅ Extracted ${messages.length} messages from Gemini`);
  return conversationData;
}

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
}

// === END SECTION 4E-10 ===

// === SECTION 4E-11: Conversation Extraction Router ===

extractConversation() {
  console.log('🐻 ThreadCub: Extracting conversation...');
  
  // Detect platform and use appropriate extraction method
  const hostname = window.location.hostname;
  
  if (hostname.includes('claude.ai')) {
    return this.extractClaudeConversation();
  } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return this.extractChatGPTMessages();
  } else if (hostname.includes('gemini.google.com')) {
    return this.extractGeminiConversation();
  } else {
    // Generic extraction attempt
    return this.extractGenericConversation();
  }
}

// === END SECTION 4E-11 ===

} // END of ThreadCubFloatingButton class

// Export the class to window for global access
window.ThreadCubFloatingButton = ThreadCubFloatingButton;

// === SECTION 4F: Initialization & Message Handling with Auto-Recovery (FIXED) ===

// ===== FORCE IMMEDIATE GLOBAL ASSIGNMENT =====
// This must happen immediately after class definition, not in a function
console.log('🐻 ThreadCub: Setting up DIRECT global persistence...');

// Force assignment immediately 
window.ThreadCubFloatingButton = ThreadCubFloatingButton;
window.ThreadCubTagging = ThreadCubTagging;

console.log('✅ Direct global assignment complete');
console.log('✅ window.ThreadCubFloatingButton:', typeof window.ThreadCubFloatingButton);
console.log('✅ window.ThreadCubTagging:', typeof window.ThreadCubTagging);

// Show toast at bottom center of browser window
function showBrowserToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    z-index: 10000000;
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 300px;
    text-align: center;
  `;

  toast.innerHTML = `
    <span style="font-size: 18px;">🐻</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in from bottom
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }, 3500);
}

// Add message listener for popup controls
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🐻 ThreadCub: Received message:', message);
    
    switch (message.action) {
      case 'ping':
        sendResponse({ success: true, status: 'Content script is ready' });
        break;
        
      case 'checkButtonStatus':
        const exists = !!window.threadcubButton && !!document.getElementById('threadcub-edge-btn');
        const isVisible = exists && window.threadcubButton.isVisible();
        sendResponse({ 
          exists: exists,
          visible: isVisible
        });
        break;
        
      case 'showButton':
        if (window.threadcubButton) {
          window.threadcubButton.show();
          sendResponse({ success: true });
        } else {
          window.threadcubButton = new window.ThreadCubFloatingButton();
          sendResponse({ success: true });
        }
        break;
        
      case 'hideButton':
        if (window.threadcubButton) {
          window.threadcubButton.hide();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Button does not exist' });
        }
        break;
        
      case 'resetPosition':
        if (window.threadcubButton) {
          window.threadcubButton.setEdgePosition('right', 0.5);
          window.threadcubButton.savePosition();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Button does not exist' });
        }
        break;
        
      case 'exportChat':
        if (window.threadcubButton) {
          const source = message.source || 'popup';
          window.threadcubButton.saveAndOpenConversation(source);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Floating button not available' });
        }
        break;
        
      case 'triggerDownload':
        if (window.threadcubButton) {
          window.threadcubButton.downloadConversationJSON();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Button not available' });
        }
        break;

      case 'triggerContinuation':
        if (window.threadcubButton) {
          window.threadcubButton.saveAndOpenConversation('popup');
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Button not available' });
        }
        break;
        
      case 'downloadJSON':
        if (window.threadcubButton) {
          window.threadcubButton.downloadConversationJSON();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Button not available' });
        }
        break;

      case 'continueConversation':
        if (window.threadcubButton) {
          window.threadcubButton.saveAndOpenConversation('popup');
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Button not available' });
        }
        break;
        
      case 'showBottomToast':
        showBrowserToast(message.message);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action: ' + message.action });
    }
  });
}

// Initialize when DOM is ready
function initThreadCub() {
  console.log('🐻 ThreadCub: ===== MAIN INITIALIZATION STARTING =====');
  console.log('🐻 ThreadCub: Document ready state:', document.readyState);
  console.log('🐻 ThreadCub: Current URL:', window.location.href);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        createButtonWithTagging();
        // Call continuation check after button is created
        setTimeout(() => {
          initializeContinuationCheck();
        }, 1000);
      }, 100);
    });
  } else {
    // Document already loaded
    setTimeout(() => {
      createButtonWithTagging();
      // Call continuation check after button is created
      setTimeout(() => {
        initializeContinuationCheck();
      }, 1000);
    }, 100);
  }
}

function createButtonWithTagging() {
  console.log('🏷️ ThreadCub: Creating button with DIRECT global persistence...');
  
  // Remove any existing buttons first to prevent duplicates
  try {
    const existingButtons = document.querySelectorAll('#threadcub-edge-btn, #threadcub-test-btn');
    console.log('🐻 ThreadCub: Removing existing buttons:', existingButtons.length);
    existingButtons.forEach(btn => btn.remove());
  } catch (error) {
    console.log('🐻 ThreadCub: Error removing existing buttons:', error);
  }
  
  // Verify classes are available and create button
  try {
    console.log('🐻 ThreadCub: Pre-creation class check:', typeof window.ThreadCubFloatingButton);
    
    if (typeof window.ThreadCubFloatingButton === 'undefined') {
      console.error('🐻 ThreadCub: ThreadCubFloatingButton class not found!');
      return;
    }
    
    // Create button instance using window reference
    window.threadcubButton = new window.ThreadCubFloatingButton();
    
    // IMMEDIATELY force multiple persistent references
    window.threadcubButtonInstance = window.threadcubButton;
    window.threadcubGlobal = window.threadcubButton;
    document.threadcubButton = window.threadcubButton;
    
    // Store in a way that prevents garbage collection
    if (!window.threadcubStore) {
      window.threadcubStore = {};
    }
    window.threadcubStore.buttonRef = window.threadcubButton;
    window.threadcubStore.buttonClass = window.ThreadCubFloatingButton;
    
    console.log('🏷️ ThreadCub: Button created with DIRECT persistence');
    
    // CRITICAL: Verify all references immediately
    console.log('🐻 ThreadCub: ✅ window.threadcubButton:', typeof window.threadcubButton);
    console.log('🐻 ThreadCub: ✅ window.threadcubButtonInstance:', typeof window.threadcubButtonInstance);
    console.log('🐻 ThreadCub: ✅ window.threadcubGlobal:', typeof window.threadcubGlobal);
    console.log('🐻 ThreadCub: ✅ document.threadcubButton:', typeof document.threadcubButton);
    
    // Verify extraction method exists
    if (typeof window.threadcubButton.extractChatGPTConversation === 'function') {
      console.log('🐻 ThreadCub: ✅ ChatGPT Extraction method confirmed');
    } else {
      console.error('🐻 ThreadCub: ❌ ChatGPT Extraction method missing!');
    }
    
    if (typeof window.threadcubButton.extractClaudeConversation === 'function') {
      console.log('🐻 ThreadCub: ✅ Claude Extraction method confirmed');
    } else {
      console.error('🐻 ThreadCub: ❌ Claude Extraction method missing!');
    }
    
  } catch (error) {
    console.error('🐻 ThreadCub: Error creating button:', error);
  }
  
  // DEBUGGING: Check if button was actually created and is visible
  setTimeout(() => {
    const buttonElement = document.getElementById('threadcub-edge-btn');
    if (buttonElement) {
      console.log('🐻 ThreadCub: ✅ Button element found in DOM');
      console.log('🐻 ThreadCub: Button display style:', buttonElement.style.display);
      
      // Force button to be visible if it's hidden
      if (buttonElement.style.display === 'none' || buttonElement.style.visibility === 'hidden') {
        console.log('🐻 ThreadCub: 🔧 Button was hidden, forcing it to be visible');
        buttonElement.style.display = 'flex';
        buttonElement.style.visibility = 'visible';
        buttonElement.style.opacity = '1';
      }
    } else {
      console.error('🐻 ThreadCub: ❌ Button element NOT found in DOM!');
    }
    
    // Final verification with detailed diagnostics
    console.log('🐻 ThreadCub: ===== FINAL VERIFICATION =====');
    console.log('🐻 ThreadCub: window.ThreadCubFloatingButton:', typeof window.ThreadCubFloatingButton);
    console.log('🐻 ThreadCub: window.threadcubButton:', typeof window.threadcubButton);
    console.log('🐻 ThreadCub: window.threadcubButtonInstance:', typeof window.threadcubButtonInstance);
    console.log('🐻 ThreadCub: window.threadcubStore.buttonRef:', typeof window.threadcubStore?.buttonRef);
    
    if (window.threadcubButton && typeof window.threadcubButton.downloadConversationJSON === 'function') {
      console.log('🐻 ThreadCub: 🎉 INITIALIZATION SUCCESSFUL - Button ready to use!');
    } else {
      console.error('🐻 ThreadCub: 💥 INITIALIZATION FAILED - Button not working');
    }
  }, 200);
  
  // ✅ Initialize tagging immediately so text selection works globally
  if (typeof window.ThreadCubTagging !== 'undefined') {
    try {
      window.threadcubTagging = new window.ThreadCubTagging(window.threadcubButton);
      console.log('🏷️ ThreadCub: Global tagging initialized - text selection now active');
    } catch (error) {
      console.error('🏷️ ThreadCub: Failed to initialize global tagging:', error);
    }
  }
  
  // ✅ SAFE: Initialize proactive message monitoring (NO download capability)
  if (window.threadcubButton && typeof window.threadcubButton.initializeMessageMonitoring === 'function') {
    try {
      window.threadcubButton.initializeMessageMonitoring();
      console.log('🐻 ThreadCub: SAFE Proactive message monitoring initialized - NO downloads possible');
    } catch (error) {
      console.error('🐻 ThreadCub: Failed to initialize SAFE message monitoring:', error);
    }
  }
}

// FIXED: Ensure continuation check is always called
function initializeContinuationCheck() {
  console.log('🐻 ThreadCub: ===== CALLING CONTINUATION CHECK FROM MAIN INIT =====');
  
  // Small delay to ensure everything is set up
  setTimeout(() => {
    try {
      if (typeof window.checkForContinuationData === 'function') {
        console.log('🐻 ThreadCub: checkForContinuationData function found (window), calling it...');
        window.checkForContinuationData();
      } else if (typeof checkForContinuationData === 'function') {
        console.log('🐻 ThreadCub: checkForContinuationData function found (global), calling it...');
        checkForContinuationData();
      } else {
        console.error('🐻 ThreadCub: checkForContinuationData function NOT found!');
        console.log('🐻 ThreadCub: Available functions:', Object.getOwnPropertyNames(window).filter(name => name.includes('check') || name.includes('continuation')));
      }
    } catch (error) {
      console.error('🐻 ThreadCub: Error calling checkForContinuationData:', error);
    }
  }, 1000); // Increased delay to ensure parsing is complete
}

// Simple test function that definitely gets defined
window.threadcubTest = function() {
  console.log('🧪 ThreadCub Simple Test:');
  console.log('Classes available:', typeof window.ThreadCubFloatingButton);
  console.log('Button instance:', typeof window.threadcubButton);
  console.log('Button instance (alt):', typeof window.threadcubButtonInstance);
  console.log('Store reference:', typeof window.threadcubStore?.buttonRef);
  console.log('DOM element:', !!document.getElementById('threadcub-edge-btn'));
  
  // Test download
  if (window.threadcubButton && window.threadcubButton.downloadConversationJSON) {
    console.log('✅ Ready to download - calling method...');
    window.threadcubButton.downloadConversationJSON();
    return true;
  } else {
    console.log('❌ Download not available');
    return false;
  }
};

// FIXED: Memory wipe auto-recovery system
setInterval(() => {
  const domButton = document.getElementById('threadcub-edge-btn');
  const hasMemoryRef = !!window.threadcubButton;
  const hasClass = !!window.ThreadCubFloatingButton;
  
  if (domButton && (!hasMemoryRef || !hasClass)) {
    console.log('🔧 ThreadCub: Memory wipe detected - auto-recovering...');
    
    // Remove orphaned DOM
    domButton.remove();
    
    // Clear any old references
    window.threadcubButton = null;
    window.ThreadCubFloatingButton = null;
    window.threadcubButtonInstance = null;
    window.threadcubGlobal = null;
    if (window.threadcubStore) {
      window.threadcubStore.buttonRef = null;
      window.threadcubStore.buttonClass = null;
    }
    
    // Reinitialize after short delay
    setTimeout(() => {
      console.log('🔧 ThreadCub: Re-initializing after memory wipe...');
      initThreadCub();
    }, 1000);
  } else {
    // Normal reference restoration for minor losses
    if (!window.threadcubButton && window.threadcubButtonInstance) {
      console.log('🔧 ThreadCub: Auto-restoring lost reference...');
      window.threadcubButton = window.threadcubButtonInstance;
    }
    if (!window.threadcubButton && window.threadcubStore?.buttonRef) {
      console.log('🔧 ThreadCub: Auto-restoring from store...');
      window.threadcubButton = window.threadcubStore.buttonRef;
    }
  }
}, 5000); // Check every 5 seconds

initThreadCub();

// === END SECTION 4F ===
// === END OF ALL SECTIONS ===
