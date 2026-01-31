console.log('Loading: side-panel.js');

// ThreadCub Side Panel UI Module
// Extracted from Section 1H of content.js - all syntax errors fixed

class ThreadCubSidePanel {
  constructor(taggingSystem) {
    this.taggingSystem = taggingSystem;
    this.sidePanel = null;
    this.currentFilter = 'all'; // 'all', 'tags', 'anchors'
  }

  // ===== MAIN UPDATE METHOD =====
  updateTagsList() {
    const tagsList = this.sidePanel.querySelector('#threadcub-tags-container');
    if (!tagsList) return;

    // Filter items based on current filter
    const filteredItems = this.getFilteredItems();

    if (filteredItems.length === 0) {
      tagsList.innerHTML = this.createEmptyState();
    } else {
      tagsList.innerHTML = filteredItems.map(item => {
        // Check if item is an anchor or tag
        if (item.type === 'anchor') {
          return this.createAnchorCard(item);
        }
        return this.createTagCard(item);
      }).join('');
      this.setupNewCardListeners();
    }
  }

  // Get items based on current filter
  getFilteredItems() {
    const items = this.taggingSystem.tags || [];

    switch (this.currentFilter) {
      case 'tags':
        return items.filter(item => item.type !== 'anchor');
      case 'anchors':
        return items.filter(item => item.type === 'anchor');
      default:
        return items;
    }
  }

  // Set filter and update list
  setFilter(filter) {
    this.currentFilter = filter;
    this.updateTagsList();
    this.updateFilterTabs();
  }

  // Update filter tab active states
  updateFilterTabs() {
    const tabs = this.sidePanel?.querySelectorAll('.threadcub-filter-tab');
    tabs?.forEach(tab => {
      const tabFilter = tab.getAttribute('data-filter');
      if (tabFilter === this.currentFilter) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // ===== ANCHOR CARD CREATION =====
  createAnchorCard(anchor) {
    const hasNote = anchor.note && anchor.note.trim().length > 0;

    return `
      <div class="threadcub-anchor-card" data-anchor-id="${anchor.id}" data-type="anchor">
        <div class="card-content">
          <!-- Anchor type badge -->
          <div class="anchor-type-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22V8"/>
              <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
              <circle cx="12" cy="5" r="3"/>
            </svg>
            ANCHOR
          </div>

          <!-- Anchor snippet -->
          <div class="anchor-snippet">${anchor.snippet || anchor.text}</div>

          ${hasNote ? this.createNoteDisplay(anchor.note, anchor.id) : ''}

          <!-- Anchor actions -->
          <div class="anchor-actions">
            <button class="anchor-jump-button" data-action="jump-to" data-anchor-id="${anchor.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
              Jump to
            </button>

            <div style="display: flex; gap: 8px;">
              ${this.createAnchorActionButton('edit-note', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>', anchor.id)}
              ${this.createAnchorActionButton('delete', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', anchor.id)}
            </div>
          </div>

          <!-- Anchor metadata -->
          <div class="anchor-metadata">
            <div class="anchor-metadata-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              ${this.formatDate(anchor.createdAt)}
            </div>
            ${anchor.platform ? `
            <div class="anchor-metadata-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="14" x="2" y="3" rx="2"/>
                <line x1="8" x2="16" y1="21" y2="21"/>
                <line x1="12" x2="12" y1="17" y2="21"/>
              </svg>
              ${anchor.platform}
            </div>
            ` : ''}
          </div>

          ${this.createNoteEditingState(anchor)}
        </div>
      </div>
    `;
  }

  // Create anchor action button
  createAnchorActionButton(action, iconSvg, anchorId) {
    const deleteClass = action === 'delete' ? ' delete' : '';
    return `
      <button class="anchor-action-button${deleteClass}" data-action="${action}" data-anchor-id="${anchorId}">
        ${iconSvg}
      </button>
    `;
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  }

  // ===== EMPTY STATE =====
  createEmptyState() {
    return `
      <div id="threadcub-empty-state">
        <div class="empty-state-icon">🏷️</div>

        <h3 class="empty-state-title">No tags yet</h3>

        <p class="empty-state-description">Highlight text to get started with your first swipe!</p>
      </div>
    `;
  }

  // ===== TAG CARD CREATION =====
  createTagCard(tag) {
    const hasNote = tag.note && tag.note.trim().length > 0;
    const hasTags = tag.tags && tag.tags.length > 0;

    // This version includes SVG icons directly, as they are not style tokens.
    return `
      <div class="threadcub-tag-card" data-tag-id="${tag.id}" data-state="default">
        <div class="card-content">
          <div class="tag-text">${tag.text}</div>

          ${hasTags ? this.createPriorityTags(tag.tags) : ''}
          ${hasNote ? this.createNoteDisplay(tag.note, tag.id) : ''}

          <div class="default-state">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
            </div>
            <div class="action-buttons">
              ${this.createActionButton('continue-chat', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>', tag.id)}
              ${this.createActionButton('edit-note', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>', tag.id)}
              ${this.createActionButton('add-tag', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>', tag.id)}
              ${this.createActionButton('delete', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', tag.id)}
            </div>
          </div>

          ${this.createNoteEditingState(tag)}
          ${this.createTagEditingState(tag)}
        </div>
      </div>
    `;
  }

  // ===== CARD COMPONENTS (Simplified to use CSS classes) =====
  createTagText(tag) { // Removed 'tokens' parameter
    return `
      <div class="tag-text">${tag.text}</div>
    `;
  }

  createDefaultState(tag) { // Removed 'tokens' parameter
    return `
      <div class="default-state">
        <div class="card-icon paw-print-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paw-print"><path d="M5.5 7.8c-.8.7-1.5 1.7-1.5 2.8C4 13.5 7 16 9.5 16c2.2 0 3.5-2.1 4-3.5"/><path d="M18 9c.8-.7 1.5-1.7 1.5-2.8C19.5 3.5 16.5 1 14 1c-2.2 0-3.5 2.1-4 3.5"/><path d="M2.5 16.1c.8-.7 1.5-1.7 1.5-2.8C4 10.5 7 8 9.5 8c2.2 0 3.5 2.1 4 3.5"/><path d="M21 17c-.8.7-1.5 1.7-1.5 2.8C19.5 22.5 16.5 25 14 25c-2.2 0-3.5-2.1-4-3.5"/><circle cx="12" cy="12" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="19" r="1"/></svg>
        </div>

        <div class="action-buttons">
          ${this.createActionButton('continue-chat', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>', tag.id)}
          ${this.createActionButton('edit-note', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>', tag.id)}
          ${this.createActionButton('add-tag', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>', tag.id)}
          ${this.createActionButton('delete', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', tag.id)}
        </div>
      </div>
    `;
  }

  createActionButton(action, iconSvg, tagId) {
    return `
      <div class="action-button" data-action="${action}" data-tag-id="${tagId}">
        ${iconSvg}
      </div>
    `;
  }

  createNoteEditingState(tag) { // Removed 'tokens' parameter
    return `
      <div class="note-editing" style="display: none;" data-tag-id="${tag.id}">
        <textarea class="note-textarea" placeholder="Add your note...">${tag.note || ''}</textarea>

        <div class="note-actions">
          ${this.createSaveButton(tag.id)}
          ${this.createCancelButton(tag.id)}
        </div>
      </div>
    `;
  }

  createTagEditingState(tag) { // Removed 'tokens' parameter
    return `
      <div class="tag-editing" style="display: none;" data-tag-id="${tag.id}">
        <div class="priority-options">
          ${this.createPriorityButton('high')}
          ${this.createPriorityButton('medium')}
          ${this.createPriorityButton('low')}
          ${this.createAddTagButton()}
        </div>

        <div class="tag-actions">
          ${this.createCancelTagButton(tag.id)}
        </div>
      </div>
    `;
  }

  // ===== HELPER COMPONENTS (Simplified to use CSS classes and variables) =====
  createPriorityButton(priority) { // Removed 'tokens' parameter
    return `
      <button class="priority-btn" data-priority="${priority}">${priority.toUpperCase()}</button>
    `;
  }

  createAddTagButton() { // Removed 'tokens' parameter
    return `
      <button class="priority-btn add-tag-btn">
        <span class="add-tag-plus">+</span> ADD TAG
      </button>
    `;
  }

  createSaveButton(tagId) { // Removed 'tokens' parameter
    return `
      <button class="save-note-btn" data-tag-id="${tagId}">SAVE</button>
    `;
  }

  createCancelButton(tagId) { // Removed 'tokens' parameter
    return `
      <button class="cancel-note-btn" data-tag-id="${tagId}">CANCEL</button>
    `;
  }

  createCancelTagButton(tagId) { // Removed 'tokens' parameter
    return `
      <button class="cancel-tag-btn" data-tag-id="${tagId}">CANCEL</button>
    `;
  }

  createPriorityTags(tags) {
    return `
      <div class="priority-tags">
        ${tags.map(tag => `
          <span class="priority-tag priority-${tag.priority || 'medium'}">${tag.label}</span>
        `).join('')}
      </div>
    `;
  }

  createNoteDisplay(note, tagId) {
    return `
      <div class="note-display" data-tag-id="${tagId}">${note}</div>
    `;
  }

  // ===== EVENT LISTENERS (Updated to use CSS variables and classes) =====
  setupNewCardListeners() {
    // Setup tag card listeners
    const tagCards = this.sidePanel.querySelectorAll('.threadcub-tag-card');
    tagCards.forEach(card => {
      const tagId = parseInt(card.getAttribute('data-tag-id'));
      this.setupTagCardListeners(card, tagId);
    });

    // Setup anchor card listeners
    const anchorCards = this.sidePanel.querySelectorAll('.threadcub-anchor-card');
    anchorCards.forEach(card => {
      const anchorId = parseInt(card.getAttribute('data-anchor-id'));
      this.setupAnchorCardListeners(card, anchorId);
    });
  }

  // Setup listeners for anchor cards
  setupAnchorCardListeners(card, anchorId) {
    // Jump-to button
    const jumpBtn = card.querySelector('[data-action="jump-to"]');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Anchor: Jump to clicked for anchor', anchorId);
        if (this.taggingSystem.jumpToAnchor) {
          this.taggingSystem.jumpToAnchor(anchorId);
        }
      });
    }

    // Edit note button
    const editBtn = card.querySelector('[data-action="edit-note"]');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterNoteEditingStateForAnchor(card, anchorId);
      });
    }

    // Delete button
    const deleteBtn = card.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.taggingSystem.deleteTagWithUndo(anchorId);
      });
    }

    // Note editing listeners
    this.setupNoteEditingListenersForAnchor(card, anchorId);
  }

  // Enter note editing state for anchor
  enterNoteEditingStateForAnchor(card, anchorId) {
    const noteEditing = card.querySelector('.note-editing');
    const anchorActions = card.querySelector('.anchor-actions');

    if (anchorActions) anchorActions.style.display = 'none';
    if (noteEditing) {
      noteEditing.style.display = 'block';
      const textarea = noteEditing.querySelector('.note-textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }
  }

  // Setup note editing listeners for anchor
  setupNoteEditingListenersForAnchor(card, anchorId) {
    const textarea = card.querySelector('.note-textarea');
    const saveBtn = card.querySelector('.save-note-btn');
    const cancelBtn = card.querySelector('.cancel-note-btn');

    if (textarea && saveBtn) {
      textarea.addEventListener('input', () => {
        const hasText = textarea.value.trim().length > 0;
        if (hasText) {
          saveBtn.classList.add('active');
        } else {
          saveBtn.classList.remove('active');
        }
      });

      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (saveBtn.classList.contains('active')) {
          this.taggingSystem.saveNoteForCard(anchorId, textarea.value.trim());
          this.exitNoteEditingStateForAnchor(card);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exitNoteEditingStateForAnchor(card);
      });
    }
  }

  // Exit note editing state for anchor
  exitNoteEditingStateForAnchor(card) {
    const noteEditing = card.querySelector('.note-editing');
    const anchorActions = card.querySelector('.anchor-actions');

    if (noteEditing) noteEditing.style.display = 'none';
    if (anchorActions) anchorActions.style.display = 'flex';
  }

  // Setup listeners for tag cards (existing functionality)
  setupTagCardListeners(card, tagId) {
    // Card hover effects: Using CSS classes/pseudo-classes is preferred, but
    // for direct manipulation requested earlier, using CSS variables.
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = 'var(--shadow-card-hover)'; // Use CSS variable
    });

    card.addEventListener('mouseleave', () => {
      const currentState = card.getAttribute('data-state');
      if (currentState === 'default') {
        card.style.boxShadow = 'var(--shadow-card)'; // Use CSS variable for default
      }
    });

    // Action button listeners
    this.setupCardActionListeners(card, tagId);
  }

  setupCardActionListeners(card, tagId) {
    // Continue in chat
    const continueBtn = card.querySelector('[data-action="continue-chat"]');
    if (continueBtn) {
      continueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.taggingSystem.continueTagInChat(tagId);
      });

      /* this.addButtonHoverEffects(continueBtn, 'var(--color-gray-100)', 'var(--color-primary)'); */ // Use CSS variables
    }

    // Edit note
    const editBtn = card.querySelector('[data-action="edit-note"]');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterNoteEditingState(card, tagId);
      });

      /*this.addButtonHoverEffects(editBtn, 'var(--color-gray-100)', 'var(--color-primary)'); */ // Use CSS variables
    }

    // Add tag
    const tagBtn = card.querySelector('[data-action="add-tag"]');
    if (tagBtn) {
      tagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterTagEditingState(card, tagId);
      });

      /*this.addButtonHoverEffects(tagBtn, 'var(--color-gray-100)', 'var(--color-primary)');*/ // Use CSS variables
    }

    // Delete
    const deleteBtn = card.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.taggingSystem.deleteTagWithUndo(tagId);
      });

     /* this.addButtonHoverEffects(deleteBtn, 'var(--color-error-light)', 'var(--color-error)');*/ // Use CSS variables
    }

    // Note editing listeners
    this.setupNoteEditingListeners(card, tagId);

    // Tag editing listeners
    this.setupTagEditingListeners(card, tagId);
  }

  addButtonHoverEffects(button, hoverBg, hoverColor) {
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverBg;
      button.style.color = hoverColor;
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
      button.style.color = 'var(--color-gray-500)'; // Use CSS variable
    });
  }

  // ===== STATE MANAGEMENT =====
  enterNoteEditingState(card, tagId) {
    card.setAttribute('data-state', 'note-editing');

    const defaultState = card.querySelector('.default-state');
    const noteEditing = card.querySelector('.note-editing');

    if (defaultState) defaultState.style.display = 'none';
    if (noteEditing) {
      noteEditing.style.display = 'block';

      const textarea = noteEditing.querySelector('.note-textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }
  }

  enterTagEditingState(card, tagId) {
    card.setAttribute('data-state', 'tag-editing');

    const defaultState = card.querySelector('.default-state');
    const tagEditing = card.querySelector('.tag-editing');

    if (defaultState) defaultState.style.display = 'none';
    if (tagEditing) tagEditing.style.display = 'block';
  }

  exitEditingState(card) {
    card.setAttribute('data-state', 'default');

    const noteEditing = card.querySelector('.note-editing');
    const tagEditing = card.querySelector('.tag-editing');

    if (noteEditing) noteEditing.style.display = 'none';
    if (tagEditing) tagEditing.style.display = 'none';

    const defaultState = card.querySelector('.default-state');
    if (defaultState) defaultState.style.display = 'flex';
  }

  // ===== NOTE EDITING =====
  setupNoteEditingListeners(card, tagId) {
    const textarea = card.querySelector('.note-textarea');
    const saveBtn = card.querySelector('.save-note-btn');
    const cancelBtn = card.querySelector('.cancel-note-btn');

    if (textarea && saveBtn) {
      textarea.addEventListener('input', () => {
        const hasText = textarea.value.trim().length > 0;

        if (hasText) {
          saveBtn.classList.add('active'); // Use class for active state
        } else {
          saveBtn.classList.remove('active'); // Remove class for inactive state
        }
      });

      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Only save if active (i.e., has text)
        if (saveBtn.classList.contains('active')) {
          this.taggingSystem.saveNoteForCard(tagId, textarea.value.trim());
          this.exitEditingState(card);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exitEditingState(card);
      });
    }
  }

  // ===== TAG EDITING =====
  setupTagEditingListeners(card, tagId) {
    const priorityBtns = card.querySelectorAll('.priority-btn');
    const cancelBtn = card.querySelector('.cancel-tag-btn');

    priorityBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const priority = btn.getAttribute('data-priority');

        if (priority) {
          this.taggingSystem.addPriorityTag(tagId, priority);
          this.exitEditingState(card);
          this.updateTagsList(); // Refresh to show new tag
        }
      });
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exitEditingState(card);
      });
    }
  }

  // ===== PUBLIC METHODS =====
  setSidePanel(sidePanel) {
    this.sidePanel = sidePanel;
  }
}

// Make the class globally available
window.ThreadCubSidePanel = ThreadCubSidePanel;

console.log('✅ ThreadCubSidePanel defined:', typeof window.ThreadCubSidePanel);