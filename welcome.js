// welcome.js — marks the welcome page as seen when the user leaves
// Kept as an external file to comply with Chrome extension CSP (no inline scripts)

function markWelcomeSeen() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ threadcub_welcome_seen: true });
    }
  } catch (e) {
    // Extension context may not be available — silently ignore
  }
}

// pagehide fires on tab close AND navigation, more reliable than beforeunload
window.addEventListener('pagehide', markWelcomeSeen);

// Fallback
window.addEventListener('beforeunload', markWelcomeSeen);