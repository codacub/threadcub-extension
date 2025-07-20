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
    if (this.isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
  }

  handleResize() {
    setTimeout(() => {
      this.setEdgePosition(this.currentEdge, this.currentPosition);
    }, 100);
  }

  // ===== DRAG FUNCTIONALITY =====
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

  // ===== POSITION MANAGEMENT =====
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

  // ===== TOAST NOTIFICATIONS =====
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

  // ===== UTILITY METHODS =====
  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    if (this.borderOverlay && this.borderOverlay.parentNode) {
      this.borderOverlay.parentNode.removeChild(this.borderOverlay);
    }
    console.log('🐻 ThreadCub: Button destroyed');
  }

  // ===== REAL WORKING METHODS (MOVED FROM CONTENT.JS) =====
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
        conversationData = this.extractChatGPTConversation();
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
      
      console.log('🐻 ThreadCub: Making DIRECT API call to ThreadCub...');
      
      // RESTORED: Direct fetch call (same as working main branch)
      let response;
      try {
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
    
    // Return platform-specific prompts
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

  generateChatGPTContinuationPrompt() {
    return `I'd like to continue our previous conversation. While you can't currently access external URLs, I have our complete conversation history as a file attachment that I'll share now.

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
      
      const filename = this.generateSmartFilename(conversationData);
      
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