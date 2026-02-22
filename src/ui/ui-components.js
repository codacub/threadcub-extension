// =============================================================================
// ThreadCub UI Components
// Reusable UI elements and utilities
// =============================================================================

const UIComponents = {

  // =============================================================================
  // TOAST/NOTIFICATION SYSTEM
  // Consolidated from floating-button.js, tagging.js
  // =============================================================================

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
  },

  showSuccessToast(message = '✅ Success!') {
    this.showToast(message, 'success');
  },

  showUndoToast(message, onUndo) {
  // Remove any existing undo toast first
  const existing = document.querySelector('.threadcub-toast-undo');
  if (existing) existing.parentNode.removeChild(existing);

  const toast = document.createElement('div');
  toast.className = 'threadcub-toast threadcub-toast-success threadcub-toast-undo';
  toast.style.cssText = 'pointer-events: auto; min-width: 320px; white-space: nowrap;';

  const btn = document.createElement('button');
  btn.textContent = 'Undo';
  btn.style.cssText = `
    margin-left: 12px;
    background: rgba(255,255,255,0.3);
    border: 1px solid rgba(255,255,255,0.6);
    color: inherit;
    font-size: 13px;
    font-weight: 700;
    padding: 3px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    flex-shrink: 0;
  `;
  btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.5)';
  btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.3)';

  const icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
  const textWrapper = document.createElement('span');
  textWrapper.innerHTML = icon + ' ' + message;
  textWrapper.style.display = 'flex';
  textWrapper.style.alignItems = 'center';
  textWrapper.style.gap = '6px';

  toast.appendChild(textWrapper);
  toast.appendChild(btn);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    margin-left: 6px;
    background: none;
    border: none;
    color: inherit;
    font-size: 14px;
    font-weight: 700;
    padding: 3px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    opacity: 0.7;
    flex-shrink: 0;
  `;
  closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
  closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';

  toast.appendChild(closeBtn);
  document.body.appendChild(toast);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.remove('show');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  };

  btn.addEventListener('click', () => {
    dismiss();
    if (typeof onUndo === 'function') onUndo();
  });

  closeBtn.addEventListener('click', dismiss);

  setTimeout(() => toast.classList.add('show'), 50);
  // No auto-dismiss — stays until user clicks Undo, ✕, or navigates away
},

  showErrorToast(message = '❌ Error occurred') {
    this.showToast(message, 'error');
  },

  // Alternative notification style (from tagging.js)
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000001;
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);

    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  },

  // Static method for global access (from floating-button.js)
  showGlobalSuccessToast(message = 'Operation completed successfully!') {
    if (window.threadcubButton && typeof window.threadcubButton.showSuccessToast === 'function') {
      window.threadcubButton.showSuccessToast(message);
    } else {
      // Fallback to UIComponents method
      this.showSuccessToast(message);
    }
  }

};

// Export to global window object
window.UIComponents = UIComponents;
console.log('🔌 ThreadCub: UIComponents module loaded');