// ===== ENHANCED THREADCUB POPUP SYSTEM =====
// This file shows the improved popup functions that are now integrated into content.js
// These are the key improvements made to the popup system:

// 1. ENHANCED VISUAL DESIGN
// - Modern gradient header with ThreadCub branding
// - Better spacing and typography
// - Improved color scheme and visual hierarchy
// - Professional card-style layout
// - Smooth animations and transitions

// 2. BETTER CONTENT PARSING
function extractConversationPreview(fullPrompt) {
    // Extract title and basic info with improved regex patterns
    const titleMatch = fullPrompt.match(/\*\*Conversation Title:\*\*\s*([^\n]+)/);
    const messagesMatch = fullPrompt.match(/\*\*Total Messages:\*\*\s*(\d+)/);
    const platformMatch = fullPrompt.match(/\*\*Platform:\*\*\s*([^\n]+)/);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Previous Conversation';
    const messageCount = messagesMatch ? messagesMatch[1] : 'Unknown';
    const platform = platformMatch ? platformMatch[1].trim() : 'AI Platform';
    
    // Enhanced summary with visual elements
    const summary = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="background: #e0e7ff; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          🗂️
        </div>
        <div>
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">${title}</div>
          <div style="font-size: 12px; color: #6b7280;">
            ${platform} • ${messageCount} messages • Ready to continue
          </div>
        </div>
      </div>
    `;
    
    // Enhanced message formatting with better visual design
    const messageMatches = fullPrompt.match(/\*\*You:\*\*[^*]+|\*\*Assistant:\*\*[^*]+/g);
    let recentMessages = '';
    
    if (messageMatches && messageMatches.length > 0) {
      const lastFew = messageMatches.slice(-3);
      recentMessages = lastFew.map(msg => {
        const isUser = msg.startsWith('**You:**');
        const content = msg.replace(/\*\*(You|Assistant):\*\*\s*/, '').trim();
        const truncated = content.length > 120 ? content.substring(0, 120) + '...' : content;
        
        return `
          <div style="
            background: ${isUser ? '#eff6ff' : '#f0fdf4'};
            border-left: 3px solid ${isUser ? '#3b82f6' : '#10b981'};
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.5;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="
                background: ${isUser ? '#3b82f6' : '#10b981'};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              ">
                ${isUser ? 'You' : 'Assistant'}
              </div>
            </div>
            <div style="color: #374151;">${truncated}</div>
          </div>
        `;
      }).join('');
    } else {
      recentMessages = `
        <div style="
          background: #f3f4f6;
          padding: 16px;
          border-radius: 6px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        ">
          💭 Recent messages will be available in the full context
        </div>
      `;
    }
    
    return { summary, recentMessages };
  }
  
  // 3. IMPROVED EVENT HANDLING
  function setupPopupEventListeners(overlay, fullPrompt, shareUrl) {
    const closeBtn = overlay.querySelector('#threadcub-close-popup');
    const viewDetailsBtn = overlay.querySelector('#threadcub-view-details');
    const continueBtn = overlay.querySelector('#threadcub-continue-chat');
    
    // Enhanced close functionality with escape key support
    const closePopup = () => {
      overlay.style.opacity = '0';
      overlay.querySelector('div').style.transform = 'scale(0.9) translateY(20px)';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    };
    
    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });
    
    // NEW: Escape key support
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Enhanced button interactions
    viewDetailsBtn.addEventListener('click', () => {
      if (shareUrl) {
        window.open(shareUrl, '_blank');
      }
    });
    
    continueBtn.addEventListener('click', () => {
      const platform = detectCurrentPlatform();
      const { summary: _s } = extractConversationPreview(fullPrompt);
      const titleMatch = fullPrompt.match(/\*\*Conversation Title:\*\*\s*([^\n]+)/);
      const conversationTitle = titleMatch ? titleMatch[1].trim() : null;
      const simplePrompt = createSimpleContinuationPrompt(shareUrl, platform, conversationTitle);
      
      fillInputFieldWithPrompt(simplePrompt);
      closePopup();
      showContinuationSuccess();
    });
    
    // Enhanced hover effects
    continueBtn.addEventListener('mouseenter', () => {
      continueBtn.style.transform = 'translateY(-1px)';
      continueBtn.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
    });
    
    continueBtn.addEventListener('mouseleave', () => {
      continueBtn.style.transform = 'translateY(0)';
      continueBtn.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
    });
    
    viewDetailsBtn.addEventListener('mouseenter', () => {
      viewDetailsBtn.style.background = '#f3f4f6';
      viewDetailsBtn.style.borderColor = '#9ca3af';
    });
    
    viewDetailsBtn.addEventListener('mouseleave', () => {
      viewDetailsBtn.style.background = 'white';
      viewDetailsBtn.style.borderColor = '#d1d5db';
    });
  
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
  }
  
  // 4. SIMPLIFIED CONTINUATION PROMPTS
  function createSimpleContinuationPrompt(shareUrl, platform, title) {
    const titlePrefix = title ? `Continuing from '${title}' — ` : '';
    const prompts = {
      'chatgpt': `${titlePrefix}Please continue our previous conversation. You can access the full context here: ${shareUrl}
  
  I'd like to pick up where we left off. Please review the conversation history and let me know you're ready to continue!`,
  
      'claude.ai': `${titlePrefix}I'd like to continue our previous conversation. The complete context is available at: ${shareUrl}
  
  Please access the conversation history and let me know when you're ready to continue from where we left off.`,
  
      'gemini': `${titlePrefix}Continuing our previous conversation. Full context: ${shareUrl}
  
  Please review our discussion history and continue helping me with the topic.`,
  
      'default': `${titlePrefix}Continue previous conversation. Full context: ${shareUrl}`
    };
    
    return prompts[platform] || prompts['default'];
  }
  
  // 5. ENHANCED SUCCESS MESSAGING
  function showContinuationSuccess() {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999999;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      opacity: 0;
      transition: all 0.4s ease;
      transform: translateY(-10px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
  
    popup.innerHTML = `
      <span style="font-size: 18px;">🐻</span>
      <span>✅ Ready to continue! The AI will access your full conversation context.</span>
    `;
    
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(() => {
      popup.style.opacity = '1';
      popup.style.transform = 'translateY(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 400);
    }, 4000);
  }
  
  // ===== KEY IMPROVEMENTS SUMMARY =====
  
  /* 
  1. VISUAL ENHANCEMENTS:
     ✅ Modern gradient header design
     ✅ Better color scheme and typography
     ✅ Professional card-based layout
     ✅ Improved spacing and visual hierarchy
     ✅ Enhanced button designs with hover effects
  
  2. FUNCTIONALITY IMPROVEMENTS:
     ✅ Escape key support for closing popup
     ✅ Better message parsing and display
     ✅ Enhanced error handling
     ✅ Improved accessibility
     ✅ Better responsive design
  
  3. CONTENT ORGANIZATION:
     ✅ Clear conversation summary with metadata
     ✅ Recent messages with role indicators
     ✅ Prominent URL access information
     ✅ Clear call-to-action buttons
  
  4. USER EXPERIENCE:
     ✅ Smooth animations and transitions
     ✅ Clear visual feedback
     ✅ Intuitive interaction patterns
     ✅ Professional branding consistency
  
  5. TECHNICAL IMPROVEMENTS:
     ✅ Better regex patterns for content extraction
     ✅ Improved event listener management
     ✅ Enhanced error handling
     ✅ More robust platform detection
  */
  
  // ===== USAGE NOTES =====
  
  /*
  This popup system is designed to:
  
  1. **Replace complex prompt formatting** - Instead of cramming formatted text into input fields, 
     we show a beautiful popup that lets users consciously choose to continue.
  
  2. **Leverage AI URL access** - Both ChatGPT and Claude can automatically read ThreadCub URLs 
     to get complete conversation context.
  
  3. **Provide professional UX** - The popup looks and feels like a modern web application, 
     enhancing the ThreadCub brand experience.
  
  4. **Work across platforms** - The design is platform-agnostic and works on ChatGPT, Claude, 
     Gemini, and any future AI platforms.
  
  5. **Be easily maintainable** - Clean, well-documented code that's easy to update and extend.
  
  The popup appears automatically when a new AI tab loads with ThreadCub continuation data, 
  giving users a clear preview of what they're continuing and a simple way to proceed.
  */