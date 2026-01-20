
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
  console.log('🐻 ThreadCub: DownloadManager available:', typeof window.DownloadManager);

  // Initialize the floating button (now from external module)
  if (typeof window.ThreadCubFloatingButton !== 'undefined') {
    console.log('🐻 ThreadCub: ✅ Initializing floating button from module...');

    try {
      window.threadcubButton = new window.ThreadCubFloatingButton();
      console.log('🐻 ThreadCub: ✅ Floating button instance created:', typeof window.threadcubButton);

      // CRITICAL: Enhance the modular floating button with all conversation functionality
      if (typeof window.DownloadManager !== 'undefined' && typeof window.DownloadManager.enhanceFloatingButtonWithConversationFeatures === 'function') {
        console.log('🐻 ThreadCub: ✅ Enhancing floating button with conversation features...');
        window.DownloadManager.enhanceFloatingButtonWithConversationFeatures();
        console.log('🐻 ThreadCub: ✅ Floating button enhanced successfully');
      } else {
        console.error('🐻 ThreadCub: ❌ DownloadManager.enhanceFloatingButtonWithConversationFeatures function not found');
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
        window.ContinuationSystem.checkForContinuationData();
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

// Export app initializer to window for global access
window.AppInitializer = {
  initializeThreadCub,
  startThreadCub
};

console.log('🐻 ThreadCub: App initializer module loaded');
