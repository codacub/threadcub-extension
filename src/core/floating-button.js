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
    this.showToast(message, 'success');
  }

  showErrorToast(message = '❌ Error occurred') {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `threadcub-toast threadcub-toast-${type}`; // Use classes for styling

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

    // Animate in using class
    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    // Animate out and remove using class
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300); // Match transition duration
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

  // Session ID management for anonymous conversation tracking
  async getOrCreateSessionId() {
    let sessionId = null;
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(['threadcubSessionId'], resolve);
        });
        
        sessionId = result.threadcubSessionId;
        
        if (!sessionId) {
          sessionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          await new Promise((resolve) => {
            chrome.storage.local.set({ threadcubSessionId: sessionId }, resolve);
          });
          console.log('🔑 Generated new ThreadCub session ID:', sessionId);
        } else {
          console.log('🔑 Using existing ThreadCub session ID:', sessionId);
        }
      } else {
        sessionId = localStorage.getItem('threadcubSessionId');
        if (!sessionId) {
          sessionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('threadcubSessionId', sessionId);
          console.log('🔑 Generated new ThreadCub session ID (localStorage):', sessionId);
        } else {
          console.log('🔑 Using existing ThreadCub session ID (localStorage):', sessionId);
        }
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error managing session ID:', error);
      const fallbackId = 'tc_fallback_' + Date.now();
      console.log('🔑 Using fallback session ID:', fallbackId);
      return fallbackId;
    }
  }

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
    console.log('🐻 ThreadCub: Extracting conversation data...');

    let conversationData;
    const hostname = window.location.hostname;

    if (hostname.includes('claude.ai')) {
      conversationData = await this.extractClaudeConversation();
    } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      conversationData = this.extractChatGPTConversation();
    } else if (hostname.includes('gemini.google.com')) { 
      conversationData = this.extractGeminiConversation();
    } else {
      conversationData = this.extractGenericConversation();
    }

    console.log('🔍 DEBUG: Current hostname:', window.location.hostname);
    const targetPlatform = this.getTargetPlatformFromCurrentUrl();
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
    const sessionId = await this.getOrCreateSessionId();
    console.log('🔍 Session ID for API call:', sessionId);

    const apiData = {
      conversationData: conversationData,
      source: conversationData.platform?.toLowerCase() || 'unknown',
      title: conversationData.title || 'Untitled Conversation',
      userAuthToken: userAuthToken,
      sessionId: sessionId
    };

    console.log('🔍 API Data includes sessionId:', !!apiData.sessionId);

    // Direct fetch call
    let response;
    try {
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

      // Generate continuation prompt and handle platform-specific flow
      const summary = data.summary || this.generateQuickSummary(conversationData.messages);
      const shareUrl = data.shareableUrl || `https://threadcub.com/api/share/${data.conversationId}`;

      // Generate minimal continuation prompt
      const minimalPrompt = this.generateContinuationPrompt(summary, shareUrl, conversationData.platform, conversationData);

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

      let conversationData;
      const hostname = window.location.hostname;

      if (hostname.includes('claude.ai')) {
        conversationData = await this.extractClaudeConversation();
      } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
        conversationData = this.extractChatGPTConversation();
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

  // ===== CONVERSATION EXTRACTION METHODS =====
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

  simpleCleanContent(content) {
    return content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*Copy\s*$/gm, '')
      .replace(/^\s*Edit\s*$/gm, '')
      .replace(/^\s*Retry\s*$/gm, '')
      .trim();
  }

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
}

  // ===== CONTINUATION & HELPER METHODS =====
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

  Please access the conversation history and let me know when you're ready to continue from where we left off.`;
      
      console.log('🐻 ThreadCub: Generated Claude-specific continuation prompt:', claudePrompt.length, 'characters');
      return claudePrompt;
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
    const canUseChrome = this.canUseChromStorage();

    if (canUseChrome) {
      console.log('🤖 ThreadCub: Using Chrome storage for ChatGPT modal...');
      this.storeWithChrome(continuationData)
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
        summary: this.generateQuickSummary(conversationData.messages)
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
      summary: this.generateQuickSummary(conversationData.messages)
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

    const canUseChrome = this.canUseChromStorage();

    if (canUseChrome) {
      console.log('🤖 ThreadCub: Using Chrome storage for Claude...');
      this.storeWithChrome(continuationData)
        .then(() => {
          console.log('🐻 ThreadCub: Claude data stored successfully');
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
  const canUseChrome = this.canUseChromStorage();
  
  if (canUseChrome) {
    console.log('🟣 ThreadCub: Using Chrome storage for Gemini modal...');
    this.storeWithChrome(continuationData)
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

  handleDirectContinuation(conversationData) {
    console.log('🐻 ThreadCub: Handling direct continuation without API save...');

    // Create a fallback share URL
    const fallbackShareUrl = `https://threadcub.com/fallback/${Date.now()}`;

    // Generate a simple continuation prompt
    const summary = this.generateQuickSummary(conversationData.messages);
    const minimalPrompt = this.generateContinuationPrompt(summary, fallbackShareUrl, conversationData.platform, conversationData);

    // Route to appropriate platform flow
    const targetPlatform = this.getTargetPlatformFromCurrentUrl();

    // ADD DEBUG LINES HERE
    console.log('🔍 DEBUG LOCATION 1: Current hostname:', window.location.hostname);
    console.log('🔍 DEBUG LOCATION 1: targetPlatform detected as:', targetPlatform);
    console.log('🔍 DEBUG LOCATION 1: About to route to platform...');

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

    this.showSuccessToast('Continuing conversation (offline mode)');
  }

  // ===== STORAGE & FALLBACK METHODS =====
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

  handleClaudeFlowFallback(continuationData) {
    console.log('🤖 ThreadCub: Using localStorage fallback for Claude...');

    try {
      localStorage.setItem('threadcubContinuationData', JSON.stringify(continuationData));
      console.log('🔧 Claude Fallback: Data stored in localStorage');

      const claudeUrl = 'https://claude.ai/';
      window.open(claudeUrl, '_blank');
      this.showSuccessToast('Opening Claude with conversation context...');

    } catch (error) {
      console.error('🔧 Claude Fallback: localStorage failed:', error);
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

      const filename = this.generateSmartFilename(tagsData); // Use tagsData for filename
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

  generateSmartFilename(conversationData) {
    try {
      const platform = conversationData.platform?.toLowerCase() || 'chat';

      let conversationIdentifier = '';

      if (conversationData.title && conversationData.title !== 'ThreadCub Conversation' && conversationData.title.trim().length > 0) {
        conversationIdentifier = this.sanitizeFilename(conversationData.title);
      } else if (conversationData.messages && conversationData.messages.length > 0) {
        const firstUserMessage = conversationData.messages.find(msg =>
          msg.role === 'user' || msg.role === 'human'
        );

        if (firstUserMessage && firstUserMessage.content) {
          const content = firstUserMessage.content.trim();
          conversationIdentifier = this.sanitizeFilename(content.substring(0, 50));
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

  sanitizeFilename(text) {
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