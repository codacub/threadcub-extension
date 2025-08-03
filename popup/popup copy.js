// =============================================================================
// ThreadCub Popup - Built from Scratch with Working Features
// =============================================================================

// State management
let currentTab = null;
let isSupported = false;
let exportStats = { total: 0, today: 0 };

// =============================================================================
// MAIN INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🐻 ThreadCub Popup: Starting initialization...');
    
    try {
        await initializeLogo();
        await initializePopup();
        setupControlsPageEventListeners();
        setupPromptsPageEventListeners(); // ADD THIS LINE
        
        console.log('🎉 ThreadCub Popup: Initialization complete!');
        
    } catch (error) {
        console.error('❌ ThreadCub Popup: Initialization error:', error);
    }
});

// =============================================================================
// LOGO INITIALIZATION
// =============================================================================

async function initializeLogo() {
    const logos = document.querySelectorAll('.logo');
    
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        console.log('Extension context detected, loading icon...');
        
        const iconPath = 'icons/icon128.png';
        const fullPath = chrome.runtime.getURL(iconPath);
        console.log('Loading icon from:', fullPath);
        
        const img = new Image();
        img.onload = function() {
            console.log('✅ SUCCESS! Loaded icon from:', iconPath);
            logos.forEach(logo => {
                logo.style.backgroundImage = `url('${fullPath}')`;
                logo.style.backgroundColor = 'transparent';
            });
        };
        img.onerror = function() {
            console.log('❌ Failed to load icon, using emoji fallback');
            logos.forEach(logo => {
                logo.innerHTML = '🐻';
                logo.style.fontSize = '48px';
                logo.style.backgroundColor = 'transparent';
            });
        };
        img.src = fullPath;
        
    } else {
        console.log('🐻 No extension context, using emoji');
        logos.forEach(logo => {
            logo.innerHTML = '🐻';
            logo.style.fontSize = '48px';
            logo.style.backgroundColor = 'transparent';
        });
    }
}

// =============================================================================
// POPUP INITIALIZATION
// =============================================================================

async function initializePopup() {
    try {
        // Get current tab
        [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if current site is supported
        isSupported = checkSupportedSite(currentTab.url);
        
        // Check floating button status if supported
        if (isSupported) {
            await checkFloatingButtonStatus();
        }
        
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
}

// =============================================================================
// CONTROLS PAGE EVENT LISTENERS
// =============================================================================

function setupControlsPageEventListeners() {
    console.log('Controls page listeners setup');
    
    setTimeout(() => {
        const buttonToggle = document.getElementById('buttonToggle');
        const toggleStatus = document.getElementById('toggleStatus');
        const positionControls = document.getElementById('positionControls');
        
        if (buttonToggle) {
            buttonToggle.addEventListener('click', async function() {
                console.log('🐻 Toggle clicked!');
                const isActive = buttonToggle.classList.contains('active');
                
                try {
                    if (isActive) {
                        // Hide the floating button
                        const response = await chrome.tabs.sendMessage(currentTab.id, {
                            action: 'hideFloatingButton'
                        });
                        
                        if (response && response.success) {
                            buttonToggle.classList.remove('active');
                            toggleStatus.textContent = 'Hidden';
                            positionControls.classList.add('hidden');
                            showNotification('Floating button hidden');
                        }
                        
                    } else {
                        // Show the floating button
                        const response = await chrome.tabs.sendMessage(currentTab.id, {
                            action: 'showFloatingButton'
                        });
                        
                        if (response && response.success) {
                            buttonToggle.classList.add('active');
                            toggleStatus.textContent = 'Show';
                            positionControls.classList.remove('hidden');
                            showNotification('Floating button shown');
                        }
                    }
                    
                    // Save the setting
                    await chrome.storage.local.set({ 
                        showFloatingButton: !isActive 
                    });
                    
                } catch (error) {
                    console.error('Error toggling floating button:', error);
                    showNotification('Could not toggle floating button');
                }
            });
            
            // Load initial state
            loadFloatingButtonState();
        }
    }, 100);
}

function setupPromptsPageEventListeners() {
    console.log('Setting up prompts page listeners...');
    
    setTimeout(() => {
        const copyButton = document.getElementById('copyWaysOfWorking');
        if (copyButton) {
            copyButton.addEventListener('click', async function() {
                console.log('🐻 Copy Ways of Working clicked!');
                
                const shareUrl = this.getAttribute('data-link');
                
                try {
                    // Fetch the guidelines content
                    const response = await fetch(shareUrl);
                    const data = await response.json();
                    
                    // Get the content from the first message
                    const content = data.messages[0].content;
                    
                    // Copy to clipboard
                    await navigator.clipboard.writeText(content);
                    
                    // Show success notification
                    showNotification('Ways of Working copied to clipboard! 🎉');
                    console.log('✅ Guidelines copied successfully');
                    
                } catch (error) {
                    console.error('❌ Error copying guidelines:', error);
                    showNotification('Failed to copy guidelines');
                }
            });
        }
    }, 100);
}

async function loadFloatingButtonState() {
    try {
        const result = await chrome.storage.local.get(['showFloatingButton']);
        const showButton = result.showFloatingButton !== false; // default to true
        
        const buttonToggle = document.getElementById('buttonToggle');
        const toggleStatus = document.getElementById('toggleStatus');
        const positionControls = document.getElementById('positionControls');
        
        if (buttonToggle) {
            if (showButton) {
                buttonToggle.classList.add('active');
                toggleStatus.textContent = 'Show';
                positionControls.classList.remove('hidden');
            } else {
                buttonToggle.classList.remove('active');
                toggleStatus.textContent = 'Hidden';
                positionControls.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading floating button state:', error);
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function checkSupportedSite(url) {
    if (!url) return false;
    
    const supportedSites = [
        'claude.ai',
        'chat.openai.com',
        'chatgpt.com',
        'gemini.google.com',
        'copilot.microsoft.com'
    ];
    
    return supportedSites.some(site => url.includes(site));
}

async function checkFloatingButtonStatus() {
    if (!isSupported || !currentTab) return;
    
    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'checkButtonStatus'
        });
        
        const toggle = document.getElementById('buttonToggle');
        if (toggle) {
            if (response && response.exists) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    } catch (error) {
        console.log('Could not check button status:', error);
    }
}

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

function showNotification(message, type = 'info') {
    showBottomToast(message);
}

function showBottomToast(message) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'showBottomToast',
                    message: message
                }).catch(error => {
                    console.log('Could not show toast in browser window:', error);
                    showPopupToast(message);
                });
            } else {
                showPopupToast(message);
            }
        });
    } else {
        showPopupToast(message);
    }
}

function showPopupToast(message) {
    const existingToasts = document.querySelectorAll('.threadcub-popup-toast');
    existingToasts.forEach(toast => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
    
    const toast = document.createElement('div');
    toast.className = 'threadcub-popup-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        z-index: 10000000;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 300px;
        text-align: center;
    `;

    toast.innerHTML = `
        <span style="font-size: 18px;">🐻</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 3500);
}

console.log('🐻 ThreadCub Popup: Clean JavaScript loaded');