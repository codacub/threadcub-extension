// =============================================================================
// ThreadCub Popup - Launch Version (Simplified)
// =============================================================================

// =============================================================================
// MAIN INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🐻 ThreadCub Popup: Starting initialization...');
    
    try {
        await initializeLogo();
        setupFeedbackForm();
        setupDiscordLink();
        
        console.log('🎉 ThreadCub Popup: Initialization complete!');
        
    } catch (error) {
        console.error('❌ ThreadCub Popup: Initialization error:', error);
    }
});

// =============================================================================
// LOGO INITIALIZATION
// =============================================================================

async function initializeLogo() {
    const logo = document.querySelector('.logo');
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        console.log('Extension context detected, loading icon...');
        
        const iconPath = 'icons/icon128.png';
        const fullPath = chrome.runtime.getURL(iconPath);
        console.log('Loading icon from:', fullPath);
        
        const img = new Image();
        img.onload = function() {
            console.log('✅ SUCCESS! Loaded icon from:', iconPath);
            logo.style.backgroundImage = `url('${fullPath}')`;
            logo.style.backgroundColor = 'transparent';
        };
        img.onerror = function() {
            console.log('❌ Failed to load icon, using emoji fallback');
            logo.innerHTML = '🐻';
            logo.style.fontSize = '48px';
            logo.style.backgroundColor = 'transparent';
        };
        img.src = fullPath;
        
    } else {
        console.log('🐻 No extension context, using emoji');
        logo.innerHTML = '🐻';
        logo.style.fontSize = '48px';
        logo.style.backgroundColor = 'transparent';
    }
}

// =============================================================================
// FEEDBACK FORM SETUP
// =============================================================================

function setupFeedbackForm() {
    const feedbackInput = document.getElementById('feedbackInput');
    const submitButton = document.getElementById('submitFeedback');
    
    if (!feedbackInput || !submitButton) {
        console.error('Feedback form elements not found');
        return;
    }
    
    submitButton.addEventListener('click', async () => {
        const feedback = feedbackInput.value.trim();
        
        if (!feedback) {
            showNotification('Please enter some feedback first!', 'warning');
            feedbackInput.focus();
            return;
        }
        
        // Disable button while submitting
        submitButton.disabled = true;
        submitButton.innerHTML = `<span>Sending...</span>`;
        
        try {
            // Send to Discord webhook
            // Get your webhook from: Server Settings > Integrations > Webhooks > New Webhook
            const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1464360984431824937/Eq6oVXOY8bYhydSrlXMXl3wR-t8uMnneQQudf4_orXns6vANV0KJxsxEsnJJE2EupH3n';
            
            if (DISCORD_WEBHOOK === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
                // No webhook configured yet - just log and show success
                console.log('📝 Feedback received:', feedback);
                showNotification('Thank you! Your feedback has been noted.', 'success');
                feedbackInput.value = '';
            } else {
                // Send to Discord
                const response = await fetch(DISCORD_WEBHOOK, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: `**New Feedback from Extension**\n\`\`\`${feedback}\`\`\`\n*v1.0.1*`
                    })
                });
                
                if (response.ok || response.status === 204) {
                    showNotification('Thank you! Your feedback has been received!', 'success');
                    feedbackInput.value = '';
                } else {
                    throw new Error('Failed to send feedback');
                }
            }
            
        } catch (error) {
            console.error('Error sending feedback:', error);
            showNotification('Could not send feedback. Please try Discord instead!', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = `<span>Send now</span>`;
        }
    });
    
    // Also allow submission with Enter (Ctrl/Cmd + Enter for multiline)
    feedbackInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            submitButton.click();
        }
    });
}

// =============================================================================
// DISCORD LINK SETUP
// =============================================================================

function setupDiscordLink() {
    const discordLink = document.getElementById('discordLink');
    
    if (!discordLink) {
        console.error('Discord link not found');
        return;
    }
    
    discordLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Your Discord invite link - never expires!
        const DISCORD_INVITE = 'https://discord.gg/9TDEMxWZ';
        
        console.log('🐻 Opening Discord:', DISCORD_INVITE);
        
        // Open Discord in new tab
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url: DISCORD_INVITE });
        } else {
            window.open(DISCORD_INVITE, '_blank');
        }
        
        showNotification('Opening Discord... See you there!', 'info');
    });
}

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

function showNotification(message, type = 'info') {
    // Try to show in browser window first
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'showBottomToast',
                    message: message,
                    type: type
                }).catch(error => {
                    console.log('Could not show toast in browser window:', error);
                    showPopupToast(message, type);
                });
            } else {
                showPopupToast(message, type);
            }
        });
    } else {
        showPopupToast(message, type);
    }
}

function showPopupToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.threadcub-popup-toast');
    existingToasts.forEach(toast => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
    
    // Determine color based on type
    let backgroundColor;
    switch(type) {
        case 'success':
            backgroundColor = 'linear-gradient(135deg, #10b981, #059669)';
            break;
        case 'error':
            backgroundColor = 'linear-gradient(135deg, #ef4444, #dc2626)';
            break;
        case 'warning':
            backgroundColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
            break;
        default:
            backgroundColor = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    }
    
    const toast = document.createElement('div');
    toast.className = 'threadcub-popup-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 72px;
        left: 0;
        right: 0;
        width: 100%;
        transform: translateY(100px);
        background: ${backgroundColor};
        color: white;
        padding: 14px 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000000;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        line-height: 1.4;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
    `;

    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Slide up
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    // Slide down and remove
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

console.log('🐻 ThreadCub Popup: Launch version JavaScript loaded');