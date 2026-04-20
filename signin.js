// signin.js — handles state transition from sign-in to success

const stateSignin  = document.getElementById('stateSignin');
const stateSuccess = document.getElementById('stateSuccess');

function showSuccess() {
  stateSignin.hidden  = true;
  stateSuccess.hidden = false;
}

// If auth token is already present when the tab opens, go straight to success
chrome.storage.local.get(['threadcub_auth_token'], (stored) => {
  if (stored.threadcub_auth_token) showSuccess();
});

// Watch for the token being written (i.e. user just signed in)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.threadcub_auth_token?.newValue) {
    showSuccess();
  }
});
