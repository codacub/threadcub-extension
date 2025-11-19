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
        setupPromptsPageEventListeners();
        
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

// =============================================================================
// PROMPTS PAGE EVENT LISTENERS - DYNAMIC VERSION
// =============================================================================

function setupPromptsPageEventListeners() {
    console.log('Setting up prompts page listeners...');
    
    // Load prompts dynamically when the page loads
    loadPromptsFromAPI();
    
    // Set up the "Add New Prompt" button
    setTimeout(() => {
        const addButton = document.getElementById('addNewPrompt');
        if (addButton) {
            addButton.addEventListener('click', function() {
                console.log('🎯 Add New Prompt clicked!');
                showNotification('Create prompt feature coming soon! 🚧');
            });
        }
    }, 100);
}

async function loadPromptsFromAPI() {
    const container = document.getElementById('promptsContainer');
    if (!container) return;
    
    try {
        // Show loading state
        container.innerHTML = '<div class="loading-message">Loading your prompts...</div>';
        
        // Fetch all prompts from API
        const response = await fetch('https://threadcub.com/api/prompts');
        const prompts = await response.json();
        
        console.log('📋 Loaded prompts:', prompts);
        
        if (prompts.length === 0) {
            // No prompts yet - show welcome message
            container.innerHTML = `
                <div class="no-prompts-message">
                    <h3>✨ No prompts yet!</h3>
                    <p>Create your first reusable prompt to save time in your AI conversations.</p>
                </div>
            `;
        } else {
            // Render prompts dynamically with copy icon
            container.innerHTML = prompts.map(prompt => `
                <button class="quick-link-btn prompt-btn" data-prompt-id="${prompt.id}">
                    <div class="quick-link-content">
                        <div class="quick-link-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                        </div>
                        <div class="quick-link-text">
                            <span class="quick-link-title">${prompt.title}</span>
                            <span class="quick-link-description">${prompt.description || 'Click to copy this prompt'}</span>
                        </div>
                    </div>
                    <div class="quick-link-action">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                    </div>
                </button>
            `).join('');
            
            // Add click handlers for each prompt
            setupPromptClickHandlers(prompts);
        }
        
    } catch (error) {
        console.error('❌ Error loading prompts:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Failed to load prompts. Please try again.</p>
                <button onclick="loadPromptsFromAPI()" style="margin-top: 10px; padding: 8px 16px; background: #4A90E2; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}

function setupPromptClickHandlers(prompts) {
    const promptButtons = document.querySelectorAll('.prompt-btn');
    
    promptButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const promptId = this.getAttribute('data-prompt-id');
            const prompt = prompts.find(p => p.id === promptId);
            
            if (prompt) {
                try {
                    console.log(`🐻 Copying prompt: ${prompt.title}`);
                    
                    // Get the action icon element
                    const actionIcon = this.querySelector('.quick-link-action svg');
                    
                    // Change to check icon immediately
                    if (actionIcon) {
                        actionIcon.innerHTML = `<path d="M20 6 9 17l-5-5"/>`;
                        this.classList.add('copied');
                    }
                    
                    // Format content (convert \\n to actual line breaks)
                    let formattedContent = prompt.content.replace(/\\n/g, '\n');
                    
                    // Add better spacing for your Ways of Working (if it's that prompt)
                    if (prompt.title === 'Ways of Working') {
                        formattedContent = formattedContent
                            .replace(/### 1\. USER CONTEXT/g, '\n### 1. USER CONTEXT')
                            .replace(/### 2\. INFORMATION MANAGEMENT/g, '\n### 2. INFORMATION MANAGEMENT')
                            .replace(/### 3\. TECHNICAL PROBLEM SOLVING/g, '\n### 3. TECHNICAL PROBLEM SOLVING')
                            .replace(/### 4\. RESPONSE REQUIREMENTS/g, '\n### 4. RESPONSE REQUIREMENTS')
                            .replace(/### 5\. COMMUNICATION PROTOCOL/g, '\n### 5. COMMUNICATION PROTOCOL')
                            .replace(/### 6\. SECTION-BASED CODE WORK/g, '\n### 6. SECTION-BASED CODE WORK')
                            .replace(/### 7\. FORBIDDEN BEHAVIORS/g, '\n### 7. FORBIDDEN BEHAVIORS')
                            .replace(/### 8\. EMERGENCY PROTOCOL/g, '\n### 8. EMERGENCY PROTOCOL')
                            .replace(/### 9\. SUCCESS CRITERIA/g, '\n### 9. SUCCESS CRITERIA')
                            .replace(/### 10\. VALIDATION CHECKLIST/g, '\n### 10. VALIDATION CHECKLIST');
                    }
                    
                    // Copy to clipboard
                    await navigator.clipboard.writeText(formattedContent);
                    
                    // Show success notification
                    showNotification(`${prompt.title} copied! 🎉`);
                    console.log(`✅ ${prompt.title} copied successfully`);
                    
                    // Change back to copy icon after 2 seconds
                    setTimeout(() => {
                        if (actionIcon) {
                            actionIcon.innerHTML = `
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            `;
                            this.classList.remove('copied');
                        }
                    }, 2000);
                    
                } catch (error) {
                    console.error(`❌ Error copying ${prompt.title}:`, error);
                    showNotification('Failed to copy prompt');
                    
                    // Reset icon on error
                    const actionIcon = this.querySelector('.quick-link-action svg');
                    if (actionIcon) {
                        actionIcon.innerHTML = `
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        `;
                        this.classList.remove('copied');
                    }
                }
            }
        });
    });
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