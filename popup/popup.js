// =============================================================================
// ThreadCub Popup - Auth-Aware Interface
// =============================================================================

// =============================================================================
// MAIN INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🐻 ThreadCub Popup: Starting initialization...');

    try {
        await initializeLogo();
        await checkAuthState();
        setupEventListeners();
        listenForAuthChanges();

        console.log('🐻 ThreadCub Popup: Initialization complete!');

    } catch (error) {
        console.error('🐻 ThreadCub Popup: Initialization error:', error);
        // Show unauthenticated view as fallback
        showUnauthenticatedView();
    }
});

// =============================================================================
// LOGO INITIALIZATION
// =============================================================================

async function initializeLogo() {
    const logo = document.querySelector('.logo');

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        const iconPath = 'icons/icon128.png';
        const fullPath = chrome.runtime.getURL(iconPath);

        const img = new Image();
        img.onload = function() {
            logo.style.backgroundImage = `url('${fullPath}')`;
            logo.style.backgroundColor = 'transparent';
        };
        img.onerror = function() {
            logo.textContent = '\uD83D\uDC3B';
            logo.style.fontSize = '48px';
            logo.style.backgroundColor = 'transparent';
        };
        img.src = fullPath;

    } else {
        logo.textContent = '\uD83D\uDC3B';
        logo.style.fontSize = '48px';
        logo.style.backgroundColor = 'transparent';
    }
}

// =============================================================================
// AUTH STATE CHECK
// =============================================================================

async function checkAuthState() {
    console.log('🔐 Popup: Checking auth state...');

    const authLoading = document.getElementById('authLoading');
    const authedView = document.getElementById('authedView');
    const unauthedView = document.getElementById('unauthedView');

    // Show loading
    authLoading.style.display = 'flex';
    authedView.style.display = 'none';
    unauthedView.style.display = 'none';

    try {
        // Ask background script to validate the token
        const response = await chrome.runtime.sendMessage({ action: 'validateAuthToken' });
        console.log('🔐 Popup: Auth validation response:', response);

        if (response && response.success && response.authenticated) {
            console.log('🔐 Popup: User is authenticated');
            showAuthenticatedView(response.user);
        } else {
            console.log('🔐 Popup: User is not authenticated');
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
    const authLoading = document.getElementById('authLoading');
    const authedView = document.getElementById('authedView');
    const unauthedView = document.getElementById('unauthedView');
    const userEmail = document.getElementById('userEmail');

    authLoading.style.display = 'none';
    authedView.style.display = 'flex';
    unauthedView.style.display = 'none';

    // Display user email
    const email = userData?.email || userData?.user?.email || userData?.user_metadata?.email || 'User';
    userEmail.textContent = email;
    console.log('🔐 Popup: Showing authenticated view for:', email);
}

function showUnauthenticatedView() {
    const authLoading = document.getElementById('authLoading');
    const authedView = document.getElementById('authedView');
    const unauthedView = document.getElementById('unauthedView');

    authLoading.style.display = 'none';
    authedView.style.display = 'none';
    unauthedView.style.display = 'flex';

    console.log('🔐 Popup: Showing unauthenticated view');
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('🔐 Popup: Login button clicked');
            chrome.tabs.create({ url: 'https://threadcub.com/auth/extension-login' });
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('🔐 Popup: Logout button clicked');
            logoutBtn.disabled = true;

            try {
                const response = await chrome.runtime.sendMessage({ action: 'authLogout' });
                console.log('🔐 Popup: Logout response:', response);

                if (response && response.success) {
                    showUnauthenticatedView();
                }
            } catch (error) {
                console.error('🔐 Popup: Logout error:', error);
            } finally {
                logoutBtn.disabled = false;
            }
        });
    }

    // Open Dashboard button
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', () => {
            console.log('🔐 Popup: Open Dashboard clicked');
            chrome.tabs.create({ url: 'https://threadcub.com/dashboard' });
        });
    }

    // Open Discord button
    const openDiscordBtn = document.getElementById('openDiscordBtn');
    if (openDiscordBtn) {
        openDiscordBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://discord.gg/PDjByPDqRR' });
        });
    }
}

// =============================================================================
// LISTEN FOR AUTH CHANGES (storage changes trigger UI update)
// =============================================================================

function listenForAuthChanges() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.threadcub_auth_token) {
                console.log('🔐 Popup: Auth token changed in storage, refreshing UI...');
                const newToken = changes.threadcub_auth_token.newValue;

                if (newToken) {
                    // Token was added - re-check auth state
                    checkAuthState();
                } else {
                    // Token was removed - show login view
                    showUnauthenticatedView();
                }
            }
        });

        console.log('🔐 Popup: Listening for auth storage changes');
    }
}

console.log('🐻 ThreadCub Popup: Auth-aware JavaScript loaded');
