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

  // ===== PLACEHOLDER METHODS =====
  // These will be moved to separate extractor modules
  saveAndOpenConversation(source = 'floating') {
    console.log('🐻 ThreadCub: saveAndOpenConversation called from:', source);
    // This method will be implemented in the continuation module
    this.showSuccessToast('Feature coming soon!');
  }

  downloadConversationJSON() {
    console.log('🐻 ThreadCub: downloadConversationJSON called');
    // This method will be implemented in the extractor modules
    this.showSuccessToast('Download feature coming soon!');
  }
}

// Make the class globally available
window.ThreadCubFloatingButton = ThreadCubFloatingButton;