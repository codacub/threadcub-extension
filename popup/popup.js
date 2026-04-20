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
        setupFeedbackListeners();
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
        const fullPath = chrome.runtime.getURL('assets/images/coda/coda_happy.svg');
        const img = new Image();
        img.onload = () => {
            const imgEl = document.createElement('img');
            imgEl.src = fullPath;
            imgEl.alt = 'ThreadCub';
            imgEl.style.cssText = 'width:48px;height:auto;display:block;';
            logo.innerHTML = '';
            logo.appendChild(imgEl);
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
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_opened', data: { auth_state: 'authenticated' } });
            showAuthenticatedView(response.user);
        } else {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_opened', data: { auth_state: 'unauthenticated' } });
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
            convCount.textContent = `${response.count} chat${response.count === 1 ? '' : 's'} synced`;
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

    chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_floating_toggle', data: { new_state: newState ? 'hidden' : 'visible' } });

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            const action = newState ? 'hideFloatingButton' : 'showFloatingButton';
            chrome.tabs.sendMessage(tabs[0].id, { action }).catch(() => {});
        }
    } catch (e) {}
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_login_clicked', data: {} });
            chrome.tabs.create({ url: 'https://threadcub.com/auth/extension-login' }, (tab) => {
                chrome.storage.local.set({ threadcub_login_tab_id: tab.id });
            });
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_logout_clicked', data: {} });
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

    // Open Dashboard
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_dashboard_opened', data: {} });
            chrome.tabs.create({ url: 'https://threadcub.com/dashboard' });
        });
    }

    // Discord — authed
    const openDiscordBtn = document.getElementById('openDiscordBtn');
    if (openDiscordBtn) {
        openDiscordBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_discord_clicked', data: { auth_state: 'authenticated' } });
            chrome.tabs.create({ url: 'https://discord.gg/PDjByPDqRR' });
        });
    }

    // Discord — unauthed
    const openDiscordBtnUnauthed = document.getElementById('openDiscordBtnUnauthed');
    if (openDiscordBtnUnauthed) {
        openDiscordBtnUnauthed.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_discord_clicked', data: { auth_state: 'unauthenticated' } });
            chrome.tabs.create({ url: 'https://discord.gg/PDjByPDqRR' });
        });
    }

    // Onboarding — authed
    const showOnboardingBtnAuthed = document.getElementById('showOnboardingBtnAuthed');
    if (showOnboardingBtnAuthed) {
        showOnboardingBtnAuthed.addEventListener('click', triggerOnboarding);
    }

    // Onboarding — unauthed
    const showOnboardingBtnUnauthed = document.getElementById('showOnboardingBtnUnauthed');
    if (showOnboardingBtnUnauthed) {
        showOnboardingBtnUnauthed.addEventListener('click', triggerOnboarding);
    }

    // Floating toggle — authed
    const toggleFloatingBtnAuthed = document.getElementById('toggleFloatingBtnAuthed');
    if (toggleFloatingBtnAuthed) {
        toggleFloatingBtnAuthed.addEventListener('click', handleFloatingToggle);
    }

    // Floating toggle — unauthed
    const toggleFloatingBtnUnauthed = document.getElementById('toggleFloatingBtnUnauthed');
    if (toggleFloatingBtnUnauthed) {
        toggleFloatingBtnUnauthed.addEventListener('click', handleFloatingToggle);
    }

    // Waitlist button
    const joinWaitlistBtn = document.getElementById('joinWaitlistBtn');
    if (joinWaitlistBtn) {
        joinWaitlistBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_signup_clicked', data: {} });
            chrome.tabs.create({ url: 'https://www.threadcub.com/auth?mode=signup&from=extension' });
        });
    }

    // Sign in link
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://www.threadcub.com/auth?mode=signin&from=extension' });
        });
    }

    // Header shadow on scroll
    const header = document.querySelector('.header');
    document.querySelectorAll('.view').forEach(view => {
        view.addEventListener('scroll', () => {
            if (header) header.classList.toggle('scrolled', view.scrollTop > 0);
        });
    });

    // Make full rows clickable
    document.querySelectorAll('.action-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            if (e.target.closest('.action-end-btn') || e.target.closest('.toggle')) return;
            const btn = row.querySelector('.action-end-btn');
            const toggle = row.querySelector('.toggle input');
            if (toggle) {
                toggle.click();
            } else if (btn) {
                btn.click();
            }
        });
    });
}

// =============================================================================
// ONBOARDING TRIGGER
// =============================================================================

async function triggerOnboarding(e) {
    const authState = e?.currentTarget?.id?.includes('Authed') ? 'authenticated' : 'unauthenticated';
    chrome.runtime.sendMessage({ action: 'trackEvent', eventType: 'popup_onboarding_triggered', data: { auth_state: authState } });

    await chrome.storage.local.remove('threadcub_onboarding_done');
    await chrome.storage.local.set({ threadcub_welcome_seen: true });

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

        if (changes.threadcub_auth_token) {
            if (changes.threadcub_auth_token.newValue) {
                checkAuthState();
            } else {
                showUnauthenticatedView();
            }
        }

        if ('threadcub_button_hidden' in changes) {
            updateFloatingButtonUI(!!changes.threadcub_button_hidden.newValue);
        }
    });

    console.log('🔐 Popup: Listening for storage changes');
}

// =============================================================================
// TOAST
// =============================================================================

function showPopupToast(message, type = 'success') {
    const existing = document.querySelector('.popup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `popup-toast popup-toast-${type}`;
    const icon = type === 'error'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`;
toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================================================
// FEEDBACK & BUG LISTENERS
// =============================================================================

function setupFeedbackListeners() {
    let previousView = null;

    function showView(viewId) {
        const views = ['unauthedView', 'authedView', 'feedbackView', 'bugView'];
        const formViews = ['feedbackView', 'bugView'];
        const header = document.querySelector('.header');
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === viewId ? 'flex' : 'none';
        });
        if (header) {
            header.classList.toggle('hidden', formViews.includes(viewId));
        }
    }

    function openFeedbackView(fromView) {
        previousView = fromView;
        const comment = document.getElementById('feedbackComment');
        const consent = document.getElementById('feedbackContactConsent');
        if (comment) comment.value = '';
        if (consent) consent.checked = false;
        document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
        showView('feedbackView');
    }

    function openBugView(fromView) {
        previousView = fromView;
        const comment = document.getElementById('bugComment');
        const consent = document.getElementById('bugContactConsent');
        if (comment) comment.value = '';
        if (consent) consent.checked = false;
        showView('bugView');
    }

    // Feedback — open buttons
    const openFeedbackBtnAuthed = document.getElementById('openFeedbackBtnAuthed');
    if (openFeedbackBtnAuthed) {
        openFeedbackBtnAuthed.addEventListener('click', () => openFeedbackView('authedView'));
    }

    const openFeedbackBtnUnauthed = document.getElementById('openFeedbackBtnUnauthed');
    if (openFeedbackBtnUnauthed) {
        openFeedbackBtnUnauthed.addEventListener('click', () => openFeedbackView('unauthedView'));
    }

    // Bug — open buttons
    const openBugBtnAuthed = document.getElementById('openBugBtnAuthed');
    if (openBugBtnAuthed) {
        openBugBtnAuthed.addEventListener('click', () => openBugView('authedView'));
    }

    const openBugBtnUnauthed = document.getElementById('openBugBtnUnauthed');
    if (openBugBtnUnauthed) {
        openBugBtnUnauthed.addEventListener('click', () => openBugView('unauthedView'));
    }

    // Rating buttons — hover + click
    document.querySelectorAll('.rating-btn').forEach(btn => {
        const img = btn.querySelector('.rating-img');
        if (!img) return;
        btn.addEventListener('mouseenter', () => {
            if (!btn.classList.contains('selected')) img.src = img.dataset.active;
        });
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('selected')) img.src = img.dataset.default;
        });
    });

    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rating-btn').forEach(b => {
                b.classList.remove('selected');
                const img = b.querySelector('.rating-img');
                if (img) img.src = img.dataset.default;
            });
            btn.classList.add('selected');
            const activeImg = btn.querySelector('.rating-img');
            if (activeImg) activeImg.src = activeImg.dataset.active;
        });
    });

    // Feedback — back + send
    const feedbackBackBtn = document.getElementById('feedbackBackBtn');
    if (feedbackBackBtn) {
        feedbackBackBtn.addEventListener('click', () => {
            showView(previousView || 'unauthedView');
        });
    }

    const feedbackSendBtn = document.getElementById('feedbackSendBtn');
    if (feedbackSendBtn) {
        feedbackSendBtn.addEventListener('click', async () => {
            const rating = document.querySelector('.rating-btn.selected')?.dataset.value || null;
            const comment = document.getElementById('feedbackComment')?.value?.trim() || '';
            const canContact = document.getElementById('feedbackContactConsent')?.checked || false;

            if (!rating && !comment) {
                showPopupToast('Please add a rating or comment first.', 'error');
                return;
            }

            feedbackSendBtn.disabled = true;
            feedbackSendBtn.textContent = 'Sending…';

            try {
                const res = await fetch('https://www.threadcub.com/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'feedback', rating, comment, canContact })
                });
                if (res.ok) {
                    document.querySelectorAll('.rating-btn').forEach(b => {
                        b.classList.remove('selected');
                        const img = b.querySelector('.rating-img');
                        if (img) img.src = img.dataset.default;
                    });
                    document.getElementById('feedbackComment').value = '';
                    document.getElementById('feedbackContactConsent').checked = false;
                    feedbackSendBtn.textContent = 'Send';
                    feedbackSendBtn.disabled = false;
                    showView(previousView || 'unauthedView');
                    showPopupToast('Thanks for your feedback!');
                } else {
                    throw new Error('Server error');
                }
            } catch (err) {
                feedbackSendBtn.textContent = 'Failed. Please try again';
                feedbackSendBtn.disabled = false;
                setTimeout(() => {
                    feedbackSendBtn.textContent = 'Send';
                    feedbackSendBtn.disabled = false;
                }, 2000);
            }
        });
    }

    // Bug — back + send
    const bugBackBtn = document.getElementById('bugBackBtn');
    if (bugBackBtn) {
        bugBackBtn.addEventListener('click', () => {
            showView(previousView || 'unauthedView');
        });
    }

    const bugSendBtn = document.getElementById('bugSendBtn');
    if (bugSendBtn) {
        bugSendBtn.addEventListener('click', async () => {
            const comment = document.getElementById('bugComment')?.value?.trim() || '';
            const canContact = document.getElementById('bugContactConsent')?.checked || false;

            if (!comment) {
                bugSendBtn.textContent = 'Add a description first';
                setTimeout(() => { bugSendBtn.textContent = 'Send'; }, 2000);
                return;
            }

            bugSendBtn.disabled = true;
            bugSendBtn.textContent = 'Sending…';

            try {
                const res = await fetch('https://www.threadcub.com/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'bug', comment, canContact })
                });
                if (res.ok) {
                    document.getElementById('bugComment').value = '';
                    document.getElementById('bugContactConsent').checked = false;
                    bugSendBtn.textContent = 'Send';
                    bugSendBtn.disabled = false;
                    showView(previousView || 'unauthedView');
                    showPopupToast('Bug reported. Thanks!');
                } else {
                    throw new Error('Server error');
                }
            } catch (err) {
                bugSendBtn.textContent = 'Failed. Please try again';
                bugSendBtn.disabled = false;
                setTimeout(() => {
                    bugSendBtn.textContent = 'Send';
                    bugSendBtn.disabled = false;
                }, 2000);
            }
        });
    }
}

console.log('🐻 ThreadCub Popup: JavaScript loaded');