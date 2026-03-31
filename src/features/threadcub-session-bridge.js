// Runs on threadcub.com - bridges chrome.storage session ID into localStorage
(function() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  chrome.storage.local.get(['threadcubSessionId'], function(result) {
    if (chrome.runtime.lastError) return;
    if (result.threadcubSessionId) {
      localStorage.setItem('threadcub_session_id', result.threadcubSessionId);
    }
  });
})();

// Pick up pending auth token written by extension-callback page
(function() {
  if (typeof chrome === 'undefined' || !chrome.runtime) return;
  function tryForwardAuth() {
    var pending = localStorage.getItem('threadcub_pending_auth');
    if (!pending) return false;
    try {
      var data = JSON.parse(pending);
      if (!data.token || Date.now() - data.ts > 120000) {
        localStorage.removeItem('threadcub_pending_auth');
        return false;
      }
      chrome.runtime.sendMessage({ action: 'storeAuthToken', token: data.token, encryptionKey: data.encryptionKey }, function() {
        localStorage.removeItem('threadcub_pending_auth');
      });
      return true;
    } catch(e) { return false; }
  }
  if (!tryForwardAuth()) {
    var attempts = 0;
    var iv = setInterval(function() {
      attempts++;
      if (tryForwardAuth() || attempts >= 20) clearInterval(iv);
    }, 500);
  }
})();