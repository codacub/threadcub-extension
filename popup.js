// === SECTION 1A: Header & State Management ===

// Enhanced popup script for ThreadCub - Floating Button Control Center

// State management
let currentTab = null;
let isSupported = false;
let exportStats = { total: 0, today: 0 };

// Lucide SVG icons as constants
const LUCIDE_ICONS = {
    loader: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader">
        <path d="M12 2v4"/>
        <path d="m16.2 7.8 2.9-2.9"/>
        <path d="M18 12h4"/>
        <path d="m16.2 16.2 2.9 2.9"/>
        <path d="M12 18v4"/>
        <path d="m4.9 19.1 2.9-2.9"/>
        <path d="M2 12h4"/>
        <path d="m4.9 4.9 2.9 2.9"/>
    </svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
        <path d="M16 16h5v5"/>
    </svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check">
        <path d="M20 6 9 17l-5-5"/>
    </svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
    </svg>`,
    messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>`
};

// === END SECTION 1A ===

// === SECTION 1B: Initialization & Logo Setup ===

document.addEventListener('DOMContentLoaded', async () => {
    await initializeLogo();
    await initializePopup(); // This now includes loadUserSettings
    setupEventListeners();
    loadExportStats();
});

async function initializeLogo() {
    const logos = document.querySelectorAll('.logo'); // Get ALL logo elements
    
    // Set logo image using chrome extension API
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        console.log('Extension context detected, loading icon...');
        
        // Load your specific icon
        const iconPath = 'icons/icon128.png';
        const fullPath = chrome.runtime.getURL(iconPath);
        console.log('Loading icon from:', fullPath);
        
        // Create image to test if it loads
        const img = new Image();
        img.onload = function() {
            console.log('✅ SUCCESS! Loaded icon from:', iconPath);
            // Apply to ALL logo elements
            logos.forEach(logo => {
                logo.style.backgroundImage = `url('${fullPath}')`;
                logo.style.backgroundColor = 'transparent';
            });
        };
        img.onerror = function() {
            console.log('❌ Failed to load icon, using emoji fallback');
            // Apply fallback to ALL logo elements
            logos.forEach(logo => {
                logo.innerHTML = '🐻';
                logo.style.fontSize = '48px';
                logo.style.backgroundColor = 'transparent';
            });
        };
        img.src = fullPath;
        
    } else {
        console.log('🐻 No extension context, using emoji');
        // Apply fallback to ALL logo elements
        logos.forEach(logo => {
            logo.innerHTML = '🐻';
            logo.style.fontSize = '48px';
            logo.style.backgroundColor = 'transparent';
        });
    }
}

async function initializePopup() {
    try {
        // Get current tab
        [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if current site is supported
        isSupported = checkSupportedSite(currentTab.url);
        
        // Update UI based on current page
        updatePageStatus(isSupported, currentTab.url);
        
        // Update platform indicators
        updatePlatformTags(currentTab.url);
        
        // Load user settings first
        await loadUserSettings();
        
        // Check floating button status only if supported
        if (isSupported) {
            await checkFloatingButtonStatus();
        }
        
    } catch (error) {
        console.error('Error initializing popup:', error);
        updatePageStatus(false, null, 'Error checking current page');
    }
}

function updatePlatformTags(url) {
    const tags = {
        claude: document.getElementById('claudeTag'),
        chatgpt: document.getElementById('chatgptTag'),
        gemini: document.getElementById('geminiTag'),
        copilot: document.getElementById('copilotTag')
    };
    
    // Reset all tags
    Object.values(tags).forEach(tag => {
        if (tag) tag.classList.remove('active');
    });
    
    // Activate current platform
    if (url && url.includes('claude.ai')) {
        tags.claude?.classList.add('active');
    } else if (url && (url.includes('chat.openai.com') || url.includes('chatgpt.com'))) {
        tags.chatgpt?.classList.add('active');
    } else if (url && url.includes('gemini.google.com')) {
        tags.gemini?.classList.add('active');
    } else if (url && url.includes('copilot.microsoft.com')) {
        tags.copilot?.classList.add('active');
    }
}

async function checkFloatingButtonStatus() {
    if (!isSupported || !currentTab) return;
    
    try {
        // Check if floating button exists on the page
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

// === END SECTION 1B ===

// === SECTION 1C: Stats Management ===

// Stats functions
async function loadExportStats() {
    try {
        // Get stats from chrome storage
        const result = await chrome.storage.local.get(['exportStats']);
        const stats = result.exportStats || { total: 0, today: 0, lastDate: null };
        
        // Check if we need to reset today's count
        const today = new Date().toDateString();
        if (stats.lastDate !== today) {
            stats.today = 0;
            stats.lastDate = today;
            await chrome.storage.local.set({ exportStats: stats });
        }
        
        // Update UI
        const totalExports = document.getElementById('totalExports');
        const todayExports = document.getElementById('todayExports');
        
        if (totalExports) totalExports.textContent = stats.total;
        if (todayExports) todayExports.textContent = stats.today;
        
        exportStats = stats;
        
    } catch (error) {
        console.error('Error loading export stats:', error);
        // Keep default values
    }
}

async function incrementExportStats() {
    try {
        exportStats.total += 1;
        exportStats.today += 1;
        exportStats.lastDate = new Date().toDateString();
        
        await chrome.storage.local.set({ exportStats });
        
        // Update UI
        const totalExports = document.getElementById('totalExports');
        const todayExports = document.getElementById('todayExports');
        
        if (totalExports) totalExports.textContent = exportStats.total;
        if (todayExports) todayExports.textContent = exportStats.today;
        
        // Add to history
        addToExportHistory();
        
    } catch (error) {
        console.error('Error updating export stats:', error);
    }
}

async function addToExportHistory() {
    try {
        const result = await chrome.storage.local.get(['exportHistory']);
        const history = result.exportHistory || [];
        
        // Determine platform from current URL
        let platform = 'Unknown';
        if (currentTab && currentTab.url) {
            if (currentTab.url.includes('claude.ai')) platform = 'Claude.ai';
            else if (currentTab.url.includes('chat.openai.com') || currentTab.url.includes('chatgpt.com')) platform = 'ChatGPT';
            else if (currentTab.url.includes('gemini.google.com')) platform = 'Google Gemini';
            else if (currentTab.url.includes('copilot.microsoft.com')) platform = 'Microsoft Copilot';
        }
        
        // Add new entry
        history.push({
            platform: platform,
            timestamp: Date.now(),
            url: currentTab?.url || ''
        });
        
        // Keep only last 50 entries
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        await chrome.storage.local.set({ exportHistory: history });
        
    } catch (error) {
        console.error('Error adding to export history:', error);
    }
}

// === END SECTION 1C ===

// === SECTION 1D: FIXED Toast System (Single Bottom Toast Only) ===

// FIXED: Only bottom toast, completely removed all other notification systems
function showNotification(message, type = 'info') {
    // Route ALL notifications through bottom toast ONLY
    showBottomToast(message);
}

// Bottom toast function - positioned in browser window (primary toast system)
function showBottomToast(message) {
    // Send message to content script to show toast in main browser window
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'showBottomToast',
                    message: message
                }).catch(error => {
                    console.log('Could not show toast in browser window:', error);
                    // Fallback to popup toast only if browser toast fails
                    showPopupToast(message);
                });
            } else {
                // Fallback to popup toast if no active tab
                showPopupToast(message);
            }
        });
    } else {
        // Fallback for non-extension context
        showPopupToast(message);
    }
}

// Fallback toast in popup window (only used when browser toast fails)
function showPopupToast(message) {
    // Prevent duplicate toasts - remove any existing popup toasts first
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
    
    // Animate in from bottom
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 3500);
}

// === END SECTION 1D ===

// === SECTION 1E: FIXED Button Event Listeners ===

function setupEventListeners() {
    // Handle navigation clicks - Updated to handle data-view attributes
    const dataViewLinks = document.querySelectorAll('[data-view]');
    dataViewLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetView = this.getAttribute('data-view');
            console.log('Navigate to view:', targetView);
            showView(targetView);
        });
    });

    // Handle save button (BLUE - Simple JSON download) - FIXED: No duplicate toasts
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const button = this;
            const originalContent = button.innerHTML;
            
            console.log('🐻 Popup: Save button clicked');
            
            // Check if we're on a supported site first
            if (!isSupported || !currentTab) {
                console.log('🐻 Popup: Not on supported site');
                showNotification('Please navigate to a supported AI platform first');
                return;
            }
            
            try {
                // Update button state with loading icon
                button.innerHTML = `${LUCIDE_ICONS.loader} Saving...`;
                button.disabled = true;
                
                // First, try to check if content script is available
                let contentScriptAvailable = false;
                try {
                    const pingResponse = await chrome.tabs.sendMessage(currentTab.id, {
                        action: 'ping'
                    });
                    contentScriptAvailable = true;
                    console.log('🐻 Popup: Content script is available');
                } catch (pingError) {
                    console.log('🐻 Popup: Content script not available:', pingError.message);
                }
                
                if (!contentScriptAvailable) {
                    button.innerHTML = `${LUCIDE_ICONS.refresh} Refresh Page`;
                    showNotification('Please refresh the page and try again.');
                    
                    setTimeout(() => {
                        button.innerHTML = originalContent;
                        button.disabled = false;
                    }, 3000);
                    return;
                }
                
                // FIXED: Send message to content script to trigger download (content script will handle toast)
                const response = await chrome.tabs.sendMessage(currentTab.id, {
                    action: 'downloadJSON',
                    source: 'popup'
                });
                
                if (response && response.success) {
                    button.innerHTML = `${LUCIDE_ICONS.check} Saved!`;
                    await incrementExportStats();
                    
                    // Let content script handle the toast (no duplicate popup toast)
                    
                    // Auto-close popup after brief delay
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    throw new Error(response?.error || 'Export failed');
                }
                
            } catch (error) {
                console.error('🐻 Popup: Export error:', error);
                
                if (error.message.includes('Could not establish connection')) {
                    button.innerHTML = `${LUCIDE_ICONS.refresh} Refresh Page`;
                    showNotification('Please refresh the page and try again');
                } else {
                    button.innerHTML = `${LUCIDE_ICONS.x} Failed`;
                    showNotification('Export failed. Try again.');
                }
                
                setTimeout(() => {
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }, 3000);
            }
        });
    }

    // FIXED: Handle continue chat button (PURPLE - Opens new tab, doesn't close popup)
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', async function() {
            const button = this;
            const originalContent = button.innerHTML;
            
            console.log('🔄 Popup: Continue chat button clicked');
            
            if (!isSupported || !currentTab) {
                showNotification('Please navigate to a supported AI platform first');
                return;
            }
            
            try {
                button.innerHTML = `${LUCIDE_ICONS.loader} Opening...`;
                button.disabled = true;
                
                // Check if content script is available
                let contentScriptAvailable = false;
                try {
                    const pingResponse = await chrome.tabs.sendMessage(currentTab.id, {
                        action: 'ping'
                    });
                    contentScriptAvailable = true;
                } catch (pingError) {
                    console.log('🔄 Popup: Content script not available:', pingError.message);
                }
                
                if (!contentScriptAvailable) {
                    button.innerHTML = `${LUCIDE_ICONS.refresh} Refresh Page`;
                    showNotification('Please refresh the page and try again.');
                    
                    setTimeout(() => {
                        button.innerHTML = originalContent;
                        button.disabled = false;
                    }, 3000);
                    return;
                }
                
                // FIXED: Send message to content script for continue (content script will handle toast)
                const response = await chrome.tabs.sendMessage(currentTab.id, {
                    action: 'continueConversation',
                    source: 'popup'
                });
                
                if (response && response.success) {
                    // Show success state with centered tick
                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
                    button.style.justifyContent = 'center';
                    
                    // Let content script handle the toast (no duplicate popup toast)
                    
                    // Auto-close popup after brief delay
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    throw new Error(response?.error || 'Continue failed');
                }
                
            } catch (error) {
                console.error('🔄 Popup: Continue chat error:', error);
                
                button.innerHTML = `${LUCIDE_ICONS.x} Failed`;
                showNotification('Failed to open continuation modal.');
                
                setTimeout(() => {
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }, 3000);
            }
        });
    }
    
    // Handle back navigation
    const backLinks = document.querySelectorAll('[data-back]');
    backLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetView = this.getAttribute('data-back');
            showView(targetView);
        });
    });

    // Handle settings controls on controls page
    setupControlsPageEventListeners();

    // Handle chat actions on saved page
    setupSavedPageEventListeners();
    
    // Handle Quick Links functionality
    setupQuickLinksEventListeners();
}

// === END SECTION 1E ===

// === SECTION 1F: View Management Functions ===

// View Management Functions
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show target view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
}

// === END SECTION 1F ===

// === SECTION 1G: Controls Page Event Listeners ===

// Controls page event listeners
function setupControlsPageEventListeners() {
    console.log('🔧 Setting up controls page event listeners...');
    
    // Floating button toggle functionality (SPECIFIC)
    const buttonToggle = document.getElementById('buttonToggle');
    const toggleStatus = document.getElementById('toggleStatus');
    const positionControls = document.getElementById('positionControls');

    console.log('🔧 buttonToggle:', buttonToggle);
    console.log('🔧 toggleStatus:', toggleStatus);
    console.log('🔧 positionControls:', positionControls);

    if (buttonToggle && toggleStatus && positionControls) {
        console.log('✅ All toggle elements found, adding click listener...');
        
        buttonToggle.addEventListener('click', function() {
            console.log('🔧 Toggle clicked!');
            
            // Toggle the switch state
            this.classList.toggle('active');
            console.log('🔧 Toggle classes:', this.classList.toString());
            
            // Update the text
            if (this.classList.contains('active')) {
                console.log('🔧 Setting to Hide');
                toggleStatus.textContent = 'Hide';
                positionControls.classList.remove('hidden');
            } else {
                console.log('🔧 Setting to Show');
                toggleStatus.textContent = 'Show';
                positionControls.classList.add('hidden');
            }
            
            // Save the setting
            const isActive = this.classList.contains('active');
            saveUserSetting('showButton', isActive);
            
            console.log('Toggle changed to:', isActive ? 'Hide' : 'Show');
        });
    } else {
        console.log('❌ Missing toggle elements!');
        if (!buttonToggle) console.log('❌ buttonToggle not found');
        if (!toggleStatus) console.log('❌ toggleStatus not found');
        if (!positionControls) console.log('❌ positionControls not found');
    }

    // Handle position dropdown
    const positionDropdown = document.getElementById('positionDropdown');
    if (positionDropdown) {
        positionDropdown.addEventListener('change', function() {
            const selectedPosition = this.value;
            console.log('Position changed to:', selectedPosition);
            saveUserSetting('buttonPosition', selectedPosition);
            
            // Send message to content script to update position
            if (currentTab && isSupported) {
                chrome.tabs.sendMessage(currentTab.id, {
                    action: 'updateButtonPosition',
                    position: selectedPosition
                }).catch(error => {
                    console.log('Could not update button position:', error);
                });
            }
        });
    }

    // Other toggle switches (GENERAL - excluding buttonToggle)
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        // Skip the buttonToggle since we handle it specifically above
        if (toggle.id === 'buttonToggle') return;
        
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            const setting = this.getAttribute('data-setting');
            const isActive = this.classList.contains('active');
            console.log(`Setting ${setting} changed to:`, isActive);
            
            // Save setting to chrome storage
            if (setting) {
                saveUserSetting(setting, isActive);
            }
        });
    });

    // Format selection
    document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const format = this.getAttribute('data-format');
            console.log('Selected format:', format);
            
            // Save format preference
            saveUserSetting('defaultFormat', format);
        });
    });

    // Save settings button
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            // Collect all settings
            const settings = {};
            
            // Get toggle states
            document.querySelectorAll('.toggle-switch').forEach(toggle => {
                const setting = toggle.getAttribute('data-setting');
                if (setting) {
                    settings[setting] = toggle.classList.contains('active');
                }
            });
            
            // Get selected format
            const selectedFormat = document.querySelector('.format-option.selected');
            if (selectedFormat) {
                settings.defaultFormat = selectedFormat.getAttribute('data-format');
            }
            
            console.log('Saving settings:', settings);
            
            // Save all settings
            saveAllUserSettings(settings);
            
            // Show feedback
            this.textContent = 'Saved!';
            setTimeout(() => {
                this.textContent = 'Save Settings';
            }, 1500);
        });
    }
}

// === END SECTION 1G ===

// === SECTION 1H: Saved Page Event Listeners ===

// Saved page event listeners
function setupSavedPageEventListeners() {
    // Chat item clicks
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.action-btn')) {
                const chatTitle = this.querySelector('.chat-title').textContent;
                console.log('Open chat:', chatTitle);
                // Add your chat opening logic here
            }
        });
    });

    // Export buttons
    document.querySelectorAll('.action-btn.export').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const chatTitle = this.closest('.chat-item').querySelector('.chat-title').textContent;
            console.log('Export chat:', chatTitle);
            // Add your export logic here
            showNotification('Export feature coming soon!');
        });
    });

    // Delete buttons
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const chatTitle = this.closest('.chat-item').querySelector('.chat-title').textContent;
            if (confirm('Are you sure you want to delete this chat?')) {
                console.log('Delete chat:', chatTitle);
                this.closest('.chat-item').remove();
                
                // Update chat count
                const remainingChats = document.querySelectorAll('.chat-item').length;
                const chatCountEl = document.querySelector('.chat-count');
                if (chatCountEl) {
                    chatCountEl.textContent = `${remainingChats} chat${remainingChats !== 1 ? 's' : ''}`;
                }
                
                // Show empty state if no chats left
                if (remainingChats === 0) {
                    const chatListEl = document.querySelector('.chat-list');
                    if (chatListEl) {
                        chatListEl.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">
                                    ${LUCIDE_ICONS.messageCircle}
                                </div>
                                <div class="empty-title">No saved chats yet</div>
                                <div class="empty-description">
                                    Start a conversation in ChatGPT and click "Save this Chat" to see your conversations here.
                                </div>
                            </div>
                        `;
                    }
                }
                
                showNotification('Chat deleted');
            }
        });
    });
}

// === END SECTION 1H ===

// === SECTION 1I: Settings Functions ===

// Settings functions
async function saveUserSetting(key, value) {
    try {
        const settingsKey = 'threadcubSettings';
        const result = await chrome.storage.local.get([settingsKey]);
        const settings = result[settingsKey] || {};
        
        settings[key] = value;
        
        await chrome.storage.local.set({ [settingsKey]: settings });
        console.log(`Setting ${key} saved:`, value);
    } catch (error) {
        console.error('Error saving setting:', error);
    }
}

async function saveAllUserSettings(settings) {
    try {
        const settingsKey = 'threadcubSettings';
        await chrome.storage.local.set({ [settingsKey]: settings });
        console.log('All settings saved:', settings);
        showNotification('Settings saved successfully!');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings');
    }
}

async function loadUserSettings() {
    try {
        const settingsKey = 'threadcubSettings';
        const result = await chrome.storage.local.get([settingsKey]);
        const settings = result[settingsKey] || {};
        
        // Apply toggle settings
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
                const toggle = document.querySelector(`[data-setting="${key}"]`);
                if (toggle) {
                    if (value) {
                        toggle.classList.add('active');
                    } else {
                        toggle.classList.remove('active');
                    }
                }
            }
        });
        
        // Apply format setting
        if (settings.defaultFormat) {
            const formatOption = document.querySelector(`[data-format="${settings.defaultFormat}"]`);
            if (formatOption) {
                document.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
                formatOption.classList.add('selected');
            }
        }
        
        // Apply position setting
        if (settings.buttonPosition) {
            const positionDropdown = document.getElementById('positionDropdown');
            if (positionDropdown) {
                positionDropdown.value = settings.buttonPosition;
            }
        }
        
        console.log('Settings loaded:', settings);
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// === END SECTION 1I ===

// === SECTION 1J: Utility Functions ===

// Utility functions
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

function updatePageStatus(supported, url, customError = null) {
    const statusTitle = document.getElementById('statusTitle');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusDetails = document.getElementById('statusDetails');
    const floatingGuide = document.getElementById('floatingGuide');
    
    if (customError) {
        if (statusTitle) statusTitle.textContent = '❌ Error Detected';
        if (statusIndicator) statusIndicator.classList.remove('active');
        if (statusDetails) statusDetails.textContent = customError;
        if (floatingGuide) floatingGuide.style.display = 'none';
        return;
    }
    
    if (supported) {
        if (statusIndicator) statusIndicator.classList.add('active');
        if (floatingGuide) floatingGuide.style.display = 'block';
        
        if (url.includes('claude.ai')) {
            if (statusTitle) statusTitle.textContent = '✅ Claude.ai - Button Active';
            if (statusDetails) statusDetails.textContent = 'Your floating bear export button is ready! Look for it on the right edge of the screen.';
        } else if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
            if (statusTitle) statusTitle.textContent = '✅ ChatGPT - Button Active';
            if (statusDetails) statusDetails.textContent = 'Export button available for ChatGPT conversations. Drag to reposition as needed.';
        } else if (url.includes('gemini.google.com')) {
            if (statusTitle) statusTitle.textContent = '✅ Gemini - Button Active';
            if (statusDetails) statusDetails.textContent = 'Ready to export Google Gemini conversations with our floating button.';
        } else if (url.includes('copilot.microsoft.com')) {
            if (statusTitle) statusTitle.textContent = '✅ Copilot - Button Active';
            if (statusDetails) statusDetails.textContent = 'Microsoft Copilot export functionality is active and ready to use.';
        }
    } else {
        if (statusTitle) statusTitle.textContent = '❌ Unsupported Page';
        if (statusIndicator) statusIndicator.classList.remove('active');
        if (statusDetails) statusDetails.textContent = 'Navigate to Claude.ai, ChatGPT, Google Gemini, or Microsoft Copilot to use the floating export button.';
        if (floatingGuide) floatingGuide.style.display = 'none';
    }
}

// === END SECTION 1J ===

// === SECTION 1K: Quick Links Event Listeners ===

// Quick Links event listeners
function setupQuickLinksEventListeners() {
    console.log('🔗 Setting up Quick Links event listeners...');
    
    // Ways of Working copy button
    const copyWaysOfWorking = document.getElementById('copyWaysOfWorking');
    if (copyWaysOfWorking) {
        console.log('✅ Found copyWaysOfWorking button');
        
        copyWaysOfWorking.addEventListener('click', async function() {
            const link = this.getAttribute('data-link');
            console.log('🔗 Ways of Working button clicked, link:', link);
            
            try {
                // Copy to clipboard
                await navigator.clipboard.writeText(link);
                console.log('✅ Link copied to clipboard successfully');
                
                // Show success feedback
                this.classList.add('copied');
                const titleEl = this.querySelector('.quick-link-title');
                const originalText = titleEl.textContent;
                titleEl.textContent = 'Link Copied!';
                
                // Show success toast
                showNotification('Ways of Working link copied! Paste it in your AI chat.');
                
                // Reset after 2 seconds
                setTimeout(() => {
                    this.classList.remove('copied');
                    titleEl.textContent = originalText;
                }, 2000);
                
            } catch (error) {
                console.error('❌ Failed to copy link:', error);
                
                // Fallback: show link in prompt for manual copy
                const userCopy = prompt('Copy this Ways of Working link:', link);
                if (userCopy !== null) {
                    showNotification('Link ready to paste in your AI chat!');
                }
            }
        });
    } else {
        console.log('❌ copyWaysOfWorking button not found');
    }
}

// === END SECTION 1K ===

// === END OF ALL SECTIONS ===