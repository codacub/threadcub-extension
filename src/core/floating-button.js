console.log('🔧 LOADING: floating-button.js');

// ThreadCub Floating Button Module
// Extracted from Section 4A-4F of content.js

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
    this.edgeMargin = 18; // CHANGE THIS LINE from 25 to 18
    this.buttonSize = 60; // Keep buttonSize as it's used for calculations
    this.currentBearState = 'default';
    this.isExporting = false;
    this.lastExportTime = 0;

    console.log('🐻 ThreadCub: Starting floating button...');

    this.init();
  }

  init() {
    this.createButton();
    this.createBorderOverlay();
    // Removed addStyles() as it will be loaded via external CSS file
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

    // Set initial position (dynamic style, remains in JS)
    this.setEdgePosition('right', 0.5);

    // Add to page
    document.body.appendChild(this.button);
    console.log('🐻 ThreadCub: Button added to page');
  }

  getBearImages() {
    console.log('🐻 ThreadCub: Getting bear images with fallback handling...');

    // More robust extension context checking
    let useExtensionImages = false;

    try {
      if (typeof chrome !== 'undefined' &&
          chrome.runtime &&
          chrome.runtime.getURL &&
          chrome.runtime.id) {

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

        // Apply a class for styling and let CSS manage transition
        return {
          default: `<img src="${defaultIcon}" class="bear-img" alt="ThreadCub" onerror="console.log('🐻 Image load failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <span class="bear-emoji">🐻</span>`,
          happy: `<img src="${happyIcon}" class="bear-img" alt="Happy ThreadCub" onerror="console.log('🐻 Happy image failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                  <span class="bear-emoji">😊</span>`,
          sad: `<img src="${sadIcon}" class="bear-img" alt="Sad ThreadCub" onerror="console.log('🐻 Sad image failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <span class="bear-emoji">😢</span>`,
          tagging: `<img src="${taggingIcon}" class="bear-img" alt="Tagging ThreadCub" onerror="console.log('🐻 Tagging image failed, using emoji'); this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <span class="bear-emoji">🏷️</span>`
        };
      } catch (error) {
        console.log('🐻 ThreadCub: Error generating extension image URLs:', error);
      }
    }

    // Fallback to emojis (always works)
    console.log('🐻 ThreadCub: Using emoji fallbacks for maximum compatibility');
    return {
      default: '<span class="bear-emoji">🐻</span>',
      happy: '<span class="bear-emoji">😊</span>',
      sad: '<span class="bear-emoji">😢</span>',
      tagging: '<span class="bear-emoji">🏷️</span>'
    };
  }

  createBorderOverlay() {
    this.borderOverlay = document.createElement('div');
    this.borderOverlay.id = 'threadcub-border-overlay';
    // Opacity and transition remain in JS for dynamic control
    this.borderOverlay.style.opacity = '0';
    document.body.appendChild(this.borderOverlay);
  }

  // Removed addStyles() method as styles will be in floating-button.css

  // ===== EVENT HANDLING =====
  setupEventListeners() {
    // Mouse events
    this.button.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Touch events
    this.button.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Click events for action buttons (using event delegation on button)
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
      'threadcub-download-btn': 'SAVE FOR LATER',
      'threadcub-tag-btn': 'YOUR TAGS',
      'threadcub-close-btn': 'BYE FOR NOW'
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
          tooltip.className = 'threadcub-tooltip'; // Apply class
          tooltip.textContent = text;

          // Set initial styles for positioning (these remain inline for dynamic placement)
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

          // Show with animation (using class for opacity/transform transition)
          requestAnimationFrame(() => {
            tooltip.classList.add('show');
          });

        }, 150);
      };

      const hideTooltip = () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);

        if (tooltip) {
          tooltip.classList.remove('show'); // Remove class to hide
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

    // These listeners change the bear image, which is HTML content, not CSS
    // The images themselves have a class for CSS transitions
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

  // ===== ACTION HANDLERS =====
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

  ensureTaggingAvailable() {
    if (!window.threadcubTagging) {
      this.initializeTagging();
    }
    return !!window.threadcubTagging;
  }

  // ===== MOUSE/TOUCH EVENT HANDLERS =====
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
    // Prevent click if it was part of a drag operation
    if (this.isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    // Handle specific click logic if needed, but not for drag
    // No default action here if it was a drag,
    // otherwise, let action buttons handle their own clicks via handleMouseDown
  }

  handleResize() {
    // Add small delay to allow window to fully resize before repositioning
    setTimeout(() => {
      this.setEdgePosition(this.currentEdge, this.currentPosition);
    }, 100);
  }

  // ===== DRAG FUNCTIONALITY =====
  startDrag(clientX, clientY) {
    this.isDragging = true;
    this.button.classList.add('dragging'); // Add class for dragging styles
    this.startX = clientX;
    this.startY = clientY;

    this.borderOverlay.style.opacity = '1'; // Direct style as it's dynamic
    this.createShadowButton();
  }

  createShadowButton() {
    if (this.shadowButton) this.shadowButton.remove();

    this.shadowButton = document.createElement('div');
    this.shadowButton.className = 'threadcub-shadow-button'; // Apply class
    document.body.appendChild(this.shadowButton);
    this.updateShadowPosition();
  }

  updateShadowPosition() {
    if (!this.shadowButton) return;

    const snapPosition = this.calculateSnapPosition(this.currentEdge, this.currentPosition);
    // Adjusted shadow position for visual offset
    this.shadowButton.style.left = `${snapPosition.x + 6}px`;
    this.shadowButton.style.top = `${snapPosition.y + 6}px`;
    this.shadowButton.classList.add('active'); // Add active class to show shadow
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
      default: // Fallback
        x = width - this.buttonSize - this.edgeMargin; // Default to right
        y = position * (height - this.buttonSize);
    }

    // Clamp values to ensure button stays within viewport
    x = Math.max(this.edgeMargin, Math.min(width - this.buttonSize - this.edgeMargin, x));
    y = Math.max(this.edgeMargin, Math.min(height - this.buttonSize - this.edgeMargin, y));

    return { x, y };
  }

  updateDragPosition(clientX, clientY) {
    // Update button position dynamically during drag
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
    this.button.classList.remove('dragging'); // Remove dragging class
    this.borderOverlay.style.opacity = '0'; // Hide border overlay

    if (this.shadowButton) {
      this.shadowButton.classList.remove('active'); // Hide shadow button
      // Delay removal to allow fade out transition
      setTimeout(() => {
        if (this.shadowButton) {
          this.shadowButton.remove();
          this.shadowButton = null;
        }
      }, 200);
    }

    // Only animate to new position if significant movement occurred
    if (moveDistance >= 10) {
      this.animateToEdgePosition();
      this.savePosition();
    }
  }

  animateToEdgePosition() {
    this.button.style.transition = 'all var(--transition-drag-snap)'; // Use CSS variable for snap transition
    this.setEdgePosition(this.currentEdge, this.currentPosition);

    // Reset transition after animation to allow regular hover transitions
    setTimeout(() => {
      this.button.style.transition = 'all var(--transition-base)'; // Use CSS variable for base transition
    }, 300);
  }

  // ===== POSITION MANAGEMENT =====
  setEdgePosition(edge, position) {
    const snapPosition = this.calculateSnapPosition(edge, position);

    this.button.style.left = `${snapPosition.x}px`;
    this.button.style.top = `${snapPosition.y}px`;

    // Update class for edge-specific styling (action button layout)
    this.button.className = this.button.className.replace(/edge-\w+/g, ''); // Clear existing edge classes
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

  // ===== TOAST NOTIFICATIONS =====
  showSuccessToast(message = '✅ Success!') {
    window.UIComponents.showSuccessToast(message);
  }

  showErrorToast(message = '❌ Error occurred') {
    window.UIComponents.showErrorToast(message);
  }

  showToast(message, type = 'success') {
    window.UIComponents.showToast(message, type);
  }

  // Static method for global access
  static showGlobalSuccessToast(message = 'Operation completed successfully!') {
    window.UIComponents.showGlobalSuccessToast(message);
  }

  // ===== UTILITY METHODS =====
  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    if (this.borderOverlay && this.borderOverlay.parentNode) {
      this.borderOverlay.parentNode.removeChild(this.borderOverlay);
    }
    // Also remove any active tooltips
    document.querySelectorAll('.threadcub-tooltip').forEach(t => t.remove());
    console.log('🐻 ThreadCub: Button destroyed');
  }

  // Session ID management removed - now using window.StorageService.getOrCreateSessionId()

  // ===== REAL WORKING METHODS (MOVED FROM CONTENT.JS) =====
  async saveAndOpenConversation(source = 'floating') {
  console.log('🐻 ThreadCub: Starting conversation save and open from:', source);

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
    conversationData = await window.ConversationExtractor.extractConversation();

    console.log('🔍 DEBUG: Current hostname:', window.location.hostname);
    const targetPlatform = window.ConversationExtractor.getTargetPlatformFromCurrentUrl();
    console.log('🔍 DEBUG: targetPlatform detected as:', targetPlatform);

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

    // Store conversation data globally for later use
    this.lastConversationData = conversationData;

    // Format data to match API route expectations (WITH AUTH TOKEN)
    // Get session ID for anonymous conversation tracking
    const sessionId = await window.StorageService.getOrCreateSessionId();
    console.log('🔍 Session ID for API call:', sessionId);

    const apiData = {
      conversationData: conversationData,
      source: conversationData.platform?.toLowerCase() || 'unknown',
      title: conversationData.title || 'Untitled Conversation',
      userAuthToken: userAuthToken,
      sessionId: sessionId
    };

    console.log('🔍 API Data includes sessionId:', !!apiData.sessionId);

    // API call via ApiService
    try {
      const data = await window.ApiService.saveConversation(apiData);

      // Generate continuation prompt and handle platform-specific flow
      const summary = data.summary || window.ConversationExtractor.generateQuickSummary(conversationData.messages);
      const shareUrl = data.shareableUrl || `https://threadcub.com/api/share/${data.conversationId}`;

      // Generate minimal continuation prompt
      const minimalPrompt = window.ConversationExtractor.generateContinuationPrompt(summary, shareUrl, conversationData.platform, conversationData);

      console.log('🔍 DEBUG: About to route to platform:', targetPlatform);

      if (targetPlatform === 'chatgpt') {
        console.log('🤖 ThreadCub: Routing to ChatGPT flow (with file download)');
        this.handleChatGPTFlow(minimalPrompt, shareUrl, conversationData);
      } else if (targetPlatform === 'claude') {
        console.log('🤖 ThreadCub: Routing to Claude flow (no file download)');
        this.handleClaudeFlow(minimalPrompt, shareUrl, conversationData);
      } else if (targetPlatform === 'gemini') {
        console.log('🤖 ThreadCub: Routing to Gemini flow (with file download)');
        this.handleGeminiFlow(minimalPrompt, shareUrl, conversationData);
      } else if (targetPlatform === 'grok') {
        console.log('🤖 ThreadCub: Routing to Grok flow (with file download)');
        this.handleGrokFlow(minimalPrompt, shareUrl, conversationData);
      } else if (targetPlatform === 'deepseek') {
        console.log('🔵 ThreadCub: Routing to DeepSeek flow (with file download)');
        this.handleDeepSeekFlow(minimalPrompt, shareUrl, conversationData);
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
      this.handleDirectContinuation(conversationData);
      this.isExporting = false;
      return;
    }

  } catch (error) {
    console.error('🐻 ThreadCub: Export error:', error);
    this.showErrorToast('Export failed: ' + error.message);
    this.isExporting = false;
  }
  }

  async downloadConversationJSON() {
    console.log('🐻 ThreadCub: Starting JSON download...');

    try {
      // Extract conversation data from the current AI platform
      console.log('🐻 ThreadCub: Extracting conversation data for download...');

      conversationData = await window.ConversationExtractor.extractConversation();

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
        this.showSuccessToast('Conversation saved as JSON and Markdown!');
        return;
      }

      console.log(`🐻 ThreadCub: Successfully extracted ${conversationData.messages.length} messages for download`);

      // Create and download the conversation data
      this.createDownloadFromData(conversationData);
      this.showSuccessToast('Conversation saved as JSON and Markdown!');

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

  handleChatGPTFlow(continuationPrompt, shareUrl, conversationData) {
    console.log('🤖 ThreadCub: Starting ENHANCED ChatGPT flow with auto-download...');

    // STEP 1: Auto-download the conversation file in background
    this.autoDownloadChatGPTFile(conversationData, shareUrl);

    // STEP 2: Create continuation data for cross-tab modal
    const continuationData = {
      prompt: this.generateChatGPTContinuationPrompt(),
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
    const canUseChrome = window.StorageService.canUseChromStorage();

    if (canUseChrome) {
      console.log('🤖 ThreadCub: Using Chrome storage for ChatGPT modal...');
      window.StorageService.storeWithChrome(continuationData)
        .then(() => {
          console.log('🐻 ThreadCub: ChatGPT data stored successfully');
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

  autoDownloadChatGPTFile(conversationData, shareUrl) {
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
        summary: window.ConversationExtractor.generateQuickSummary(conversationData.messages)
      };

      const filename = `threadcub-continuation-${new Date().toISOString().split('T')[0]}.json`;

      const blob = new Blob([JSON.stringify(conversationJSON, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none'; // Keep this inline as it's a utility style
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('🤖 ThreadCub: ✅ ChatGPT file auto-downloaded:', filename);

    } catch (error) {
      console.error('🤖 ThreadCub: Error auto-downloading ChatGPT file:', error);
    }
  }

  autoDownloadGeminiFile(conversationData, shareUrl) {
  try {
    console.log('🟣 ThreadCub: Auto-downloading conversation file for Gemini...');
    
    const conversationJSON = {
      title: conversationData.title || 'ThreadCub Conversation Continuation',
      url: conversationData.url || window.location.href,
      platform: conversationData.platform,
      exportDate: new Date().toISOString(),
      totalMessages: conversationData.messages.length,
      source: 'ThreadCub Browser Extension - Gemini Continuation',
      shareUrl: shareUrl,
      instructions: 'This file contains our previous conversation. Please review it and continue from where we left off.',
      messages: conversationData.messages,
      summary: window.ConversationExtractor.generateQuickSummary(conversationData.messages)
    };
    
    const filename = `threadcub-gemini-continuation-${new Date().toISOString().split('T')[0]}.json`;
    
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
    
    console.log('🟣 ThreadCub: ✅ Gemini file auto-downloaded:', filename);
    
  } catch (error) {
    console.error('🟣 ThreadCub: Error auto-downloading Gemini file:', error);
  }
}

  generateChatGPTContinuationPrompt() {
    return `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
  }

  generateGeminiContinuationPrompt() {
  return `I'd like to continue our previous conversation. I have our complete conversation history as a file that I'll upload now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
}

  handleClaudeFlow(continuationPrompt, shareUrl, conversationData) {
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

    const canUseChrome = window.StorageService.canUseChromStorage();

    if (canUseChrome) {
      console.log('🤖 ThreadCub: Using Chrome storage for Claude...');
      window.StorageService.storeWithChrome(continuationData)
        .then(() => {
          console.log('🐻 ThreadCub: Claude data stored successfully');
          const claudeUrl = 'https://claude.ai/';
          window.open(claudeUrl, '_blank');
          this.showSuccessToast('Opening Claude with conversation context...');
        })
        .catch(error => {
          console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
          window.StorageService.handleClaudeFlowFallback(continuationData);
        });
    } else {
      console.log('🤖 ThreadCub: Using Claude fallback method directly');
      window.StorageService.handleClaudeFlowFallback(continuationData);
    }
  }

  handleGeminiFlow(continuationPrompt, shareUrl, conversationData) {
  console.log('🟣 ThreadCub: Starting Gemini flow with auto-download...');
  
  // STEP 1: Auto-download the conversation file (same as ChatGPT)
  this.autoDownloadGeminiFile(conversationData, shareUrl);
  
  // STEP 2: Create continuation data for cross-tab modal
  const continuationData = {
    prompt: this.generateGeminiContinuationPrompt(),
    shareUrl: shareUrl,
    platform: 'Gemini',
    timestamp: Date.now(),
    messages: conversationData.messages || [],
    totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
    title: conversationData.title || 'Previous Conversation',
    conversationData: conversationData,
    geminiFlow: true,
    downloadCompleted: true
  };
  
  console.log('🟣 ThreadCub: Gemini continuation data prepared');
  
  // STEP 3: Use storage for modal
  const canUseChrome = window.StorageService.canUseChromStorage();

  if (canUseChrome) {
    console.log('🟣 ThreadCub: Using Chrome storage for Gemini modal...');
    window.StorageService.storeWithChrome(continuationData)
      .then(() => {
        console.log('🟣 ThreadCub: Gemini data stored successfully');
        const geminiUrl = 'https://gemini.google.com/app';
        window.open(geminiUrl, '_blank');
        this.showSuccessToast('File downloaded! Upload it in your new Gemini tab.');
      })
      .catch(error => {
        console.log('🟣 ThreadCub: Chrome storage failed, using fallback:', error);
        this.handleGeminiFlowFallback(continuationData);
      });
  } else {
    console.log('🟣 ThreadCub: Using Gemini fallback method directly');
    this.handleGeminiFlowFallback(continuationData);
  }
}

  // =============================================================================
  // GROK FLOW (similar to ChatGPT - with file download)
  // =============================================================================

  handleGrokFlow(continuationPrompt, shareUrl, conversationData) {
    console.log('🤖 ThreadCub: Starting Grok flow (URL-based, no downloads - like Claude)...');

    // Create continuation data with URL-based prompt (NO FILE DOWNLOAD!)
    const continuationData = {
      prompt: continuationPrompt,  // URL-based prompt from conversation-extractor
      shareUrl: shareUrl,
      platform: 'Grok',
      timestamp: Date.now(),
      messages: conversationData.messages || [],
      totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
      title: conversationData.title || 'Previous Conversation',
      conversationData: conversationData,
      grokFlow: true,
      downloadCompleted: false  // No file download needed!
    };

    console.log('🤖 ThreadCub: Grok continuation data prepared (URL-based, no file)');

    // Use storage to pass data to new tab
    const canUseChrome = window.StorageService.canUseChromStorage();

    if (canUseChrome) {
      console.log('🤖 ThreadCub: Using Chrome storage for Grok...');
      window.StorageService.storeWithChrome(continuationData)
        .then(() => {
          console.log('🐻 ThreadCub: Grok data stored successfully');
          const grokUrl = 'https://grok.com/';
          window.open(grokUrl, '_blank');
          this.showSuccessToast('Opening Grok with conversation context...');
        })
        .catch(error => {
          console.log('🤖 ThreadCub: Chrome storage failed, using fallback:', error);
          this.handleGrokFlowFallback(continuationData);
        });
    } else {
      console.log('🤖 ThreadCub: Using Grok fallback method directly');
      this.handleGrokFlowFallback(continuationData);
    }
  }

  autoDownloadGrokFile(conversationData, shareUrl) {
    try {
      console.log('🤖 ThreadCub: Auto-downloading conversation file for Grok...');

      const conversationJSON = {
        title: conversationData.title || 'ThreadCub Conversation Continuation',
        url: conversationData.url || window.location.href,
        platform: conversationData.platform,
        exportDate: new Date().toISOString(),
        totalMessages: conversationData.messages.length,
        shareUrl: shareUrl,
        messages: conversationData.messages,
        summary: window.ConversationExtractor.generateQuickSummary(conversationData.messages)
      };

      const filename = `threadcub-grok-continuation-${new Date().toISOString().split('T')[0]}.json`;

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

      console.log('🤖 ThreadCub: ✅ Grok file auto-downloaded:', filename);

    } catch (error) {
      console.error('🤖 ThreadCub: Error auto-downloading Grok file:', error);
    }
  }

  generateGrokContinuationPrompt() {
    return `I'd like to continue our previous conversation. I have our complete conversation history as a file that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
  }

  handleGrokFlowFallback(continuationData) {
    console.log('🤖 ThreadCub: Using localStorage fallback for Grok...');

    try {
      localStorage.setItem('threadcub_continuation', JSON.stringify(continuationData));
      const grokUrl = 'https://grok.com/';
      window.open(grokUrl, '_blank');
      this.showSuccessToast('File downloaded! Check your new Grok tab.');
    } catch (error) {
      console.error('🤖 ThreadCub: localStorage fallback failed:', error);
      this.showErrorToast('Failed to prepare continuation data');
    }
  }

  // =============================================================================
  // DEEPSEEK FLOW (similar to ChatGPT - with file download)
  // =============================================================================

  handleDeepSeekFlow(continuationPrompt, shareUrl, conversationData) {
    console.log('🔵 ThreadCub: Starting DeepSeek flow with auto-download...');
    
    // STEP 1: Auto-download the conversation file (same as ChatGPT/Gemini)
    this.autoDownloadDeepSeekFile(conversationData, shareUrl);
    
    // STEP 2: Create continuation data for cross-tab modal
    const continuationData = {
      prompt: continuationPrompt,  // File-based prompt from conversation-extractor
      shareUrl: shareUrl,
      platform: 'DeepSeek',
      timestamp: Date.now(),
      messages: conversationData.messages || [],
      totalMessages: conversationData.total_messages || conversationData.messages?.length || 0,
      title: conversationData.title || 'Previous Conversation',
      conversationData: conversationData,
      deepseekFlow: true,
      downloadCompleted: true  // File was downloaded!
    };
    
    console.log('🔵 ThreadCub: DeepSeek continuation data prepared');
    
    // STEP 3: Use storage for modal
    const canUseChrome = window.StorageService.canUseChromStorage();

    if (canUseChrome) {
      console.log('🔵 ThreadCub: Using Chrome storage for DeepSeek modal...');
      window.StorageService.storeWithChrome(continuationData)
        .then(() => {
          console.log('🐻 ThreadCub: DeepSeek data stored successfully');
          const deepseekUrl = 'https://chat.deepseek.com/';
          window.open(deepseekUrl, '_blank');
          this.showSuccessToast('File downloaded! Upload it in your new DeepSeek tab.');
        })
        .catch(error => {
          console.log('🔵 ThreadCub: Chrome storage failed, using fallback:', error);
          this.handleDeepSeekFlowFallback(continuationData);
        });
    } else {
      console.log('🔵 ThreadCub: Using DeepSeek fallback method directly');
      this.handleDeepSeekFlowFallback(continuationData);
    }
  }

  autoDownloadDeepSeekFile(conversationData, shareUrl) {
    try {
      console.log('🔵 ThreadCub: Auto-downloading conversation file for DeepSeek...');

      const conversationJSON = {
        title: conversationData.title || 'ThreadCub Conversation Continuation',
        url: conversationData.url || window.location.href,
        platform: conversationData.platform,
        exportDate: new Date().toISOString(),
        totalMessages: conversationData.messages.length,
        shareUrl: shareUrl,
        messages: conversationData.messages,
        summary: window.ConversationExtractor.generateQuickSummary(conversationData.messages)
      };

      const filename = `threadcub-deepseek-continuation-${new Date().toISOString().split('T')[0]}.json`;

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

      console.log('🔵 ThreadCub: ✅ DeepSeek file auto-downloaded:', filename);

    } catch (error) {
      console.error('🔵 ThreadCub: Error auto-downloading DeepSeek file:', error);
    }
  }

  generateDeepSeekContinuationPrompt() {
    return `I'd like to continue our previous conversation. I have our complete conversation history as a file that I'll share now.

Please read through the attached conversation file and provide your assessment of:
- What we were working on
- The current status/progress
- Any next steps or tasks mentioned

Once you've reviewed it, let me know you're ready to continue from where we left off.`;
  }

  handleDeepSeekFlowFallback(continuationData) {
    console.log('🔵 ThreadCub: Using localStorage fallback for DeepSeek...');

    try {
      localStorage.setItem('threadcub_continuation', JSON.stringify(continuationData));
      const deepseekUrl = 'https://chat.deepseek.com/';
      window.open(deepseekUrl, '_blank');
      this.showSuccessToast('File downloaded! Check your new DeepSeek tab.');
    } catch (error) {
      console.error('🔵 ThreadCub: localStorage fallback failed:', error);
      this.showErrorToast('Failed to prepare continuation data');
    }
  }

  handleDirectContinuation(conversationData) {
    console.log('🐻 ThreadCub: Handling direct continuation without API save...');

    // Create a fallback share URL
    const fallbackShareUrl = `https://threadcub.com/fallback/${Date.now()}`;

    // Generate a simple continuation prompt
    const summary = window.ConversationExtractor.generateQuickSummary(conversationData.messages);
    const minimalPrompt = window.ConversationExtractor.generateContinuationPrompt(summary, fallbackShareUrl, conversationData.platform, conversationData);

    // Route to appropriate platform flow
    const targetPlatform = window.ConversationExtractor.getTargetPlatformFromCurrentUrl();

    // ADD DEBUG LINES HERE
    console.log('🔍 DEBUG LOCATION 1: Current hostname:', window.location.hostname);
    console.log('🔍 DEBUG LOCATION 1: targetPlatform detected as:', targetPlatform);
    console.log('🔍 DEBUG LOCATION 1: About to route to platform...');

    if (targetPlatform === 'chatgpt') {
      console.log('🤖 ThreadCub: Routing to ChatGPT flow (with file download)');
      this.handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData);
    } else if (targetPlatform === 'claude') {
      console.log('🤖 ThreadCub: Routing to Claude flow (no file download)');
      this.handleClaudeFlow(minimalPrompt, fallbackShareUrl, conversationData);
    } else if (targetPlatform === 'gemini') {
      console.log('🤖 ThreadCub: Routing to Gemini flow (with file download)');
      this.handleGeminiFlow(minimalPrompt, fallbackShareUrl, conversationData);
    } else if (targetPlatform === 'grok') {
      console.log('🤖 ThreadCub: Routing to Grok flow (with file download)');
      this.handleGrokFlow(minimalPrompt, fallbackShareUrl, conversationData);
    } else if (targetPlatform === 'deepseek') {
      console.log('🔵 ThreadCub: Routing to DeepSeek flow (with file download)');
      this.handleDeepSeekFlow(minimalPrompt, fallbackShareUrl, conversationData);
    } else {
      console.log('🤖 ThreadCub: Unknown platform, defaulting to ChatGPT flow');
      this.handleChatGPTFlow(minimalPrompt, fallbackShareUrl, conversationData);
    }

    this.showSuccessToast('Continuing conversation (offline mode)');
  }

  // ===== STORAGE & FALLBACK METHODS =====
  // canUseChromStorage() removed - now using window.StorageService.canUseChromStorage()
  // storeWithChrome() removed - now using window.StorageService.storeWithChrome()
  // handleClaudeFlowFallback() removed - now using window.StorageService.handleClaudeFlowFallback()

  // Platform-specific fallback methods (kept - not in StorageService)
  handleChatGPTFlowFallback(continuationData) {
    console.log('🤖 ThreadCub: Using localStorage fallback for ChatGPT...');

    try {
      localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
      console.log('🔧 ChatGPT Fallback: Data stored in localStorage');

      const chatGPTUrl = 'https://chatgpt.com/';
      window.open(chatGPTUrl, '_blank');
      this.showSuccessToast('File downloaded! Check your new ChatGPT tab.');

    } catch (error) {
      console.error('🔧 ChatGPT Fallback: localStorage failed:', error);
    }
  }

  handleGeminiFlowFallback(continuationData) {
  console.log('🟣 ThreadCub: Using localStorage fallback for Gemini...');
  
  try {
    localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
    console.log('🔧 Gemini Fallback: Data stored in localStorage');
    
    const geminiUrl = 'https://gemini.google.com/app';
    window.open(geminiUrl, '_blank');
    this.showSuccessToast('File downloaded! Upload it in your new Gemini tab.');
    
  } catch (error) {
    console.error('🔧 Gemini Fallback: localStorage failed:', error);
  }
}

  // ===== DOWNLOAD METHODS =====
  createDownloadFromData(conversationData) {
    try {
      const tagsData = {
        title: conversationData.title || 'ThreadCub Conversation',
        url: conversationData.url || window.location.href,
        platform: conversationData.platform || 'Unknown',
        exportDate: new Date().toISOString(),
        totalMessages: conversationData.messages ? conversationData.messages.length : 0,
        messages: conversationData.messages || []
      };

      const filename = window.Utilities.generateSmartFilename(tagsData); // Use tagsData for filename
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

      // Download Markdown after a brief delay for browser compatibility
      setTimeout(() => this.downloadMarkdown(tagsData), 200);

    } catch (error) {
      console.error('🐻 ThreadCub: Error in createDownloadFromData:', error);
      throw error;
    }
  }

}

// Make the class globally available
window.ThreadCubFloatingButton = ThreadCubFloatingButton;

console.log('✅ ThreadCubFloatingButton defined:', typeof window.ThreadCubFloatingButton);

// Add message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🐻 ThreadCub: Received message:', request);

    try {
        if (request.action === 'checkButtonStatus') {
            sendResponse({ success: true, exists: !!window.threadcubButton });
            return;
        }

        if (request.action === 'hideFloatingButton') {
            if (window.threadcubButton && window.threadcubButton.button) {
                window.threadcubButton.button.style.display = 'none';
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'Button not found' });
            }
            return;
        }

        if (request.action === 'showFloatingButton') {
            if (window.threadcubButton && window.threadcubButton.button) {
                window.threadcubButton.button.style.display = 'flex';
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'Button not found' });
            }
            return;
        }

        sendResponse({ success: false, error: 'Unknown action' });

    } catch (error) {
        console.error('🐻 ThreadCub: Message handler error:', error);
        sendResponse({ success: false, error: error.message });
    }
});