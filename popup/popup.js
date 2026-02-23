// =============================================================================
// ThreadCub Popup - Auth-Aware Interface
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🐻 ThreadCub Popup: Starting initialization...');

    try {
        await initializeLogo();
        initializeVersion();
        await checkAuthState();
        await initializeFloatingButtonState();
        setupEventListeners();
        listenForStorageChanges();

        console.log('🐻 ThreadCub Popup: Initialization complete!');
    } catch (error) {
        console.error('🐻 ThreadCub Popup: Initialization error:', error);
        showUnauthenticatedView();
    }
});

// =============================================================================
// VERSION
// =============================================================================

function initializeVersion() {
    const versionLabel = document.getElementById('versionLabel');
    if (versionLabel && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
        const { version } = chrome.runtime.getManifest();
        versionLabel.textContent = `v${version}`;
    }
}

// =============================================================================
// LOGO
// =============================================================================

async function initializeLogo() {
    const logo = document.querySelector('.logo');
    if (!logo) return;

    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        const fullPath = chrome.runtime.getURL('icons/icon128.png');
        const img = new Image();
        img.onload = () => {
            logo.style.backgroundImage = `url('${fullPath}')`;
            logo.style.backgroundColor = 'transparent';
        };
        img.onerror = () => {
            logo.textContent = '🐻';
            logo.style.fontSize = '48px';
            logo.style.backgroundColor = 'transparent';
        };
        img.src = fullPath;
    } else {
        logo.textContent = '🐻';
        logo.style.fontSize = '48px';
        logo.style.backgroundColor = 'transparent';
    }
}

// =============================================================================
// AUTH STATE CHECK
// =============================================================================

async function checkAuthState() {
    console.log('🔐 Popup: Checking auth state...');

    const authLoading  = document.getElementById('authLoading');
    const authedView   = document.getElementById('authedView');
    const unauthedView = document.getElementById('unauthedView');

    if (authLoading)  authLoading.style.display = 'flex';
    if (authedView)   authedView.style.display = 'none';
    if (unauthedView) unauthedView.style.display = 'none';

    try {
        const response = await chrome.runtime.sendMessage({ action: 'validateAuthToken' });
        console.log('🔐 Popup: Auth validation response:', response);

        if (response?.success && response?.authenticated) {
            showAuthenticatedView(response.user);
        } else {
            showUnauthenticatedView();
        }
    } catch (error) {
        console.error('🔐 Popup: Error checking auth:', error);
        showUnauthenticatedView();
    }
}

// =============================================================================
// VIEW MANAGEMENT
// =============================================================================

function showAuthenticatedView(userData) {
    const authLoading  = document.getElementById('authLoading');
    const authedView   = document.getElementById('authedView');
    const unauthedView = document.getElementById('unauthedView');
    const userEmail    = document.getElementById('userEmail');

    if (authLoading)  authLoading.style.display = 'none';
    if (authedView)   authedView.style.display = 'flex';
    if (unauthedView) unauthedView.style.display = 'none';

    const email = userData?.email || userData?.user?.email || userData?.user_metadata?.email || 'User';
    if (userEmail) userEmail.textContent = email;

    console.log('🔐 Popup: Showing authenticated view for:', email);
    loadConversationCount();
}

function showUnauthenticatedView() {
    const authLoading  = document.getElementById('authLoading');
    const authedView   = document.getElementById('authedView');
    const unauthedView = document.getElementById('unauthedView');

    if (authLoading)  authLoading.style.display = 'none';
    if (authedView)   authedView.style.display = 'none';
    if (unauthedView) unauthedView.style.display = 'flex';

    console.log('🔐 Popup: Showing unauthenticated view');
}

// =============================================================================
// CONVERSATION COUNT
// =============================================================================

async function loadConversationCount() {
    const convCount = document.getElementById('convCount');
    if (!convCount) return;
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getConversationCount' });
        if (response?.count !== undefined) {
            convCount.textContent = `${response.count} conversation${response.count === 1 ? '' : 's'} saved`;
        }
    } catch (err) {
        console.warn('🐻 Popup: Could not load conversation count:', err);
    }
}

// =============================================================================
// FLOATING BUTTON TOGGLE
// =============================================================================

async function initializeFloatingButtonState() {
    const stored = await chrome.storage.local.get('threadcub_button_hidden');
    updateFloatingButtonUI(!!stored.threadcub_button_hidden);
}

// Updates both the authed and unauthed toggle buttons to stay in sync
function updateFloatingButtonUI(isHidden) {
    ['Authed', 'Unauthed'].forEach(suffix => {
        const title = document.getElementById(`toggleFloatingTitle${suffix}`);
        const desc  = document.getElementById(`toggleFloatingDesc${suffix}`);
        const icon  = document.getElementById(`toggleFloatingIcon${suffix}`);
        if (!title || !desc || !icon) return;

        if (isHidden) {
            title.textContent = 'Show floating button';
            desc.textContent  = 'Restore the save button on AI pages';
            icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>`;
        } else {
            title.textContent = 'Hide floating button';
            desc.textContent  = 'Remove the save button from AI pages';
            icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>`;
        }
    });
}

async function handleFloatingToggle() {
    const stored = await chrome.storage.local.get('threadcub_button_hidden');
    const newState = !stored.threadcub_button_hidden;

    await chrome.storage.local.set({ threadcub_button_hidden: newState });
    updateFloatingButtonUI(newState);
    console.log('🐻 Popup: Floating button hidden:', newState);

    // Directly message the active tab as a reliable fallback —
    // the content script's storage listener can miss the change
    // if the script loaded before the key was ever written.
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            const action = newState ? 'hideFloatingButton' : 'showFloatingButton';
            chrome.tabs.sendMessage(tabs[0].id, { action }).catch(() => {
                // Tab doesn't have the content script — safe to ignore
            });
        }
    } catch (e) {
        // Non-critical
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {

    // Login button (unauthed view)
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://threadcub.com/auth/extension-login' }, (tab) => {
                chrome.storage.local.set({ threadcub_login_tab_id: tab.id });
            });
        });
    }

    // Logout button (authed view)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('🔐 Popup: Logout clicked');
            logoutBtn.disabled = true;
            try {
                const response = await chrome.runtime.sendMessage({ action: 'authLogout' });
                if (response?.success) showUnauthenticatedView();
            } catch (error) {
                console.error('🔐 Popup: Logout error:', error);
            } finally {
                logoutBtn.disabled = false;
            }
        });
    }

    // Open Dashboard (authed view)
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://threadcub.com/dashboard' });
        });
    }

    // Discord — authed view
    const openDiscordBtn = document.getElementById('openDiscordBtn');
    if (openDiscordBtn) {
        openDiscordBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://discord.gg/PDjByPDqRR' });
        });
    }

    // Discord — unauthed view
    const openDiscordBtnUnauthed = document.getElementById('openDiscordBtnUnauthed');
    if (openDiscordBtnUnauthed) {
        openDiscordBtnUnauthed.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://discord.gg/PDjByPDqRR' });
        });
    }

    // Quick tips / onboarding — authed view
    const showOnboardingBtnAuthed = document.getElementById('showOnboardingBtnAuthed');
    if (showOnboardingBtnAuthed) {
        showOnboardingBtnAuthed.addEventListener('click', triggerOnboarding);
    }

    // Quick tips / onboarding — unauthed view
    const showOnboardingBtnUnauthed = document.getElementById('showOnboardingBtnUnauthed');
    if (showOnboardingBtnUnauthed) {
        showOnboardingBtnUnauthed.addEventListener('click', triggerOnboarding);
    }

    // Floating toggle — authed view
    const toggleFloatingBtnAuthed = document.getElementById('toggleFloatingBtnAuthed');
    if (toggleFloatingBtnAuthed) {
        toggleFloatingBtnAuthed.addEventListener('click', handleFloatingToggle);
    }

    // Floating toggle — unauthed view
    const toggleFloatingBtnUnauthed = document.getElementById('toggleFloatingBtnUnauthed');
    if (toggleFloatingBtnUnauthed) {
        toggleFloatingBtnUnauthed.addEventListener('click', handleFloatingToggle);
    }
}

// =============================================================================
// ONBOARDING TRIGGER
// =============================================================================

async function triggerOnboarding() {
    // Reset the done flag so the tour will run again, but keep welcome_seen
    // so it doesn't wait for the welcome tab to be closed
    await chrome.storage.local.remove('threadcub_onboarding_done');
    await chrome.storage.local.set({ threadcub_welcome_seen: true });

    // Try to trigger directly on the active tab — onboarding.js exposes
    // window.threadcubOnboarding.start() which we can call via executeScript
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    if (window.threadcubOnboarding?.start) {
                        window.threadcubOnboarding.start();
                    }
                }
            });
        }
    } catch (e) {
        // scripting permission may not be available — the flag reset above
        // means the tour will start automatically on the next page load
        console.warn('🐻 Popup: Could not trigger onboarding directly:', e.message);
    }

    window.close();
}

// =============================================================================
// LISTEN FOR STORAGE CHANGES
// =============================================================================

function listenForStorageChanges() {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;

        // Auth token changed externally (e.g. login tab completed)
        if (changes.threadcub_auth_token) {
            if (changes.threadcub_auth_token.newValue) {
                checkAuthState();
            } else {
                showUnauthenticatedView();
            }
        }

        // Floating button hidden/shown from the page (X button on the bear)
        if ('threadcub_button_hidden' in changes) {
            updateFloatingButtonUI(!!changes.threadcub_button_hidden.newValue);
        }
    });

    console.log('🔐 Popup: Listening for storage changes');
}

console.log('🐻 ThreadCub Popup: JavaScript loaded');