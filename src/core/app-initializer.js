// === SECTION 5A: Main Application Initialization ===
console.log('[DEBUG] app-initializer.js loaded, readyState:', document.readyState);

// Main initialization when DOM is ready
function initializeThreadCub() {
  console.log('🧵 ThreadCub: Initializing main application...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startThreadCub);
  } else {
    startThreadCub();
  }
}

function startThreadCub() {
  console.log('🧵 ThreadCub: Starting ThreadCub application...');
  console.log('🧵 ThreadCub: Checking modular classes...');
  console.log('🧵 ThreadCub: ThreadCubFloatingButton available:', typeof window.ThreadCubFloatingButton);
  console.log('🧵 ThreadCub: ThreadCubTagging available:', typeof window.ThreadCubTagging);
  console.log('🧵 ThreadCub: DownloadManager available:', typeof window.DownloadManager);

  // Initialize the floating button (now from external module)
  if (typeof window.ThreadCubFloatingButton !== 'undefined') {
    console.log('🧵 ThreadCub: ✅ Initializing floating button from module...');

    try {
      // Only create button if it doesn't exist (for Copilot re-initialization)
      if (!window.threadcubButton) {
        window.threadcubButton = new window.ThreadCubFloatingButton();
        console.log('🧵 ThreadCub: ✅ Floating button instance created:', typeof window.threadcubButton);
      } else {
        console.log('🧵 ThreadCub: ℹ️ Floating button already exists, keeping existing instance');
      }

      // CRITICAL: Enhance the modular floating button with all conversation functionality
      if (typeof window.DownloadManager !== 'undefined' && typeof window.DownloadManager.enhanceFloatingButtonWithConversationFeatures === 'function') {
        console.log('🧵 ThreadCub: ✅ Enhancing floating button with conversation features...');
        window.DownloadManager.enhanceFloatingButtonWithConversationFeatures();
        console.log('🧵 ThreadCub: ✅ Floating button enhanced successfully');
      } else {
        console.error('🧵 ThreadCub: ❌ DownloadManager.enhanceFloatingButtonWithConversationFeatures function not found');
      }
      
      // Initialize tagging system
      if (typeof window.ThreadCubTagging !== 'undefined') {
        // Only initialize if not already initialized (prevent Copilot navigation from destroying instance)
        if (!window.threadcubTagging || typeof window.threadcubTagging.tags === 'undefined') {
          console.log('🧵 ThreadCub: ✅ Initializing tagging system...');
          try {
            window.threadcubTagging = new window.ThreadCubTagging(window.threadcubButton);
            console.log('🧵 ThreadCub: ✅ Tagging system initialized:', typeof window.threadcubTagging);
          } catch (taggingError) {
            console.error('🧵 ThreadCub: ❌ Error initializing tagging system:', taggingError);
          }
        } else {
          console.log('🧵 ThreadCub: ℹ️ Tagging system already initialized, keeping existing instance');
        }
      } else {
        console.log('🧵 ThreadCub: ⚠️ ThreadCubTagging not available, will initialize on demand');
      }
      
      // Check for continuation data
      if (typeof window.ContinuationSystem !== 'undefined') {
        try {
          window.ContinuationSystem.checkForContinuationData();
          console.log('🧵 ThreadCub: ✅ Continuation data check completed');
        } catch (continuationError) {
          console.error('🧵 ThreadCub: ❌ Error checking continuation data:', continuationError);
        }
      }

      console.log('🧵 ThreadCub: ✅ Application fully initialized with all features!');

      // Final verification (only on first initialization, not re-initialization)
      if (!window._threadcubInitialized) {
        setTimeout(() => {
          const buttonElement = document.querySelector('#threadcub-edge-btn');
          console.log('🧵 ThreadCub: Final verification - Button in DOM:', !!buttonElement);
          if (buttonElement) {
            console.log('🧵 ThreadCub: 🎉 SUCCESS! Floating button is visible on the page!');
            window._threadcubInitialized = true;
          } else {
            console.error('🧵 ThreadCub: ❌ FAILED! Button not found in DOM after initialization');
          }
        }, 1000);
      }

    } catch (buttonError) {
      console.error('🧵 ThreadCub: ❌ Error creating floating button instance:', buttonError);
    }

  } else {
    console.error('🧵 ThreadCub: ❌ ThreadCubFloatingButton class not found - module may not have loaded');

    // Retry after a short delay
    setTimeout(() => {
      if (typeof window.ThreadCubFloatingButton !== 'undefined') {
        console.log('🧵 ThreadCub: 🔄 Retrying initialization...');
        startThreadCub();
      } else {
        console.error('🧵 ThreadCub: ❌ Failed to load floating button module after retry');
      }
    }, 1000);
  }

  // Initialize conversation length detector independently of the floating button.
  // This runs outside the button's try/catch so an error above cannot prevent it.
  console.log('[DEBUG] About to init ConversationLengthDetector, typeof:', typeof window.ConversationLengthDetector);
  console.log('[DEBUG] ConversationLengthDetector keys:', window.ConversationLengthDetector ? Object.keys(window.ConversationLengthDetector) : 'N/A');
  try {
    if (typeof window.ConversationLengthDetector !== 'undefined') {
      console.log('[DEBUG] Calling ConversationLengthDetector.init() now');
      window.ConversationLengthDetector.init();
      console.log('[DEBUG] ConversationLengthDetector.init() returned');
      console.log('[DEBUG] _initialized:', window.ConversationLengthDetector._initialized);
      console.log('[DEBUG] _platform:', window.ConversationLengthDetector._platform);
      console.log('[DEBUG] _messageCount:', window.ConversationLengthDetector._messageCount);
    } else {
      console.error('[DEBUG] ConversationLengthDetector is NOT defined on window');
    }
  } catch (detectorError) {
    console.error('[DEBUG] ConversationLengthDetector.init() threw:', detectorError);
  }

  // Initialize Copilot onboarding (shows one-time notice on Copilot about highlighting limitations)
  try {
    if (typeof window.CopilotOnboarding !== 'undefined') {
      console.log('🧵 ThreadCub: Initializing Copilot onboarding...');
      window.CopilotOnboarding.init();
      console.log('🧵 ThreadCub: ✅ Copilot onboarding initialized');
    } else {
      console.log('🧵 ThreadCub: ℹ️ CopilotOnboarding class not found (expected on non-Copilot platforms)');
    }
  } catch (onboardingError) {
    console.error('🧵 ThreadCub: ⚠️ Error initializing Copilot onboarding:', onboardingError);
  }
}

// Export app initializer to window for global access
// This MUST be defined BEFORE calling initializeThreadCub() so content.js can use it
window.AppInitializer = {
  // Main initialization function that can be called multiple times safely
  initialize: function() {
    console.log('🧵 ThreadCub: AppInitializer.initialize() called');
    startThreadCub();
  },
  // Legacy functions for backwards compatibility
  initializeThreadCub,
  startThreadCub
};

console.log('🧵 ThreadCub: App initializer module loaded');

// Start the application immediately on first load
console.log('🧵 ThreadCub: Starting initialization...');
initializeThreadCub();


// === X.com Dark Mode Toggle Watcher ===
// x.com modifies the html element's style when toggling dark/light mode,
// which destroys and rebuilds the React tree, removing the ThreadCub button.
// This observer detects that change and re-injects the button if it's gone.
if (window.location.hostname.includes('x.com') && window.location.pathname.includes('/i/grok')) {
  console.log('🧵 ThreadCub: x.com detected — starting dark mode toggle watcher');

  let _reinjectTimeout = null;

  const _xcomWatcher = new MutationObserver(() => {
    const buttonInDOM = !!document.querySelector('#threadcub-edge-btn');
    if (!buttonInDOM) {
      // Debounce — x.com fires multiple mutations during a theme switch
      clearTimeout(_reinjectTimeout);
      _reinjectTimeout = setTimeout(() => {
        console.log('🧵 ThreadCub: 🔄 Button removed by x.com theme switch — re-injecting...');
        // Reset instance so startThreadCub creates a fresh one
        window.threadcubButton = null;
        window.AppInitializer.initialize();
      }, 300);
    }
  });

  // Also watch for URL changes (x.com navigates client-side between conversations)
  let _lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== _lastUrl) {
      _lastUrl = window.location.href;
      console.log('🧵 ThreadCub: x.com URL changed — checking button...');
      setTimeout(() => {
        if (!document.querySelector('#threadcub-edge-btn')) {
          console.log('🧵 ThreadCub: 🔄 Button gone after navigation — re-injecting...');
          window.threadcubButton = null;
          window.AppInitializer.initialize();
        }
      }, 500);
    }
  }, 500);

  _xcomWatcher.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  console.log('🧵 ThreadCub: ✅ x.com dark mode watcher active');
}
// === END X.com Dark Mode Toggle Watcher ===

// === END SECTION 5A ===