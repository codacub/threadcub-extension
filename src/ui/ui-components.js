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
