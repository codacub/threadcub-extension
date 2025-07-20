// === SECTION 1H: New Card Design with Design System ===

updateTagsList() {
  const tagsList = this.sidePanel.querySelector('#threadcub-tags-container');
  if (!tagsList) return;
  
  // Define tokens inline (later we'll move this to separate file)
  const tokens = {
    colors: {
      primary: '#7C3AED',
      white: '#FFFFFF',
      priority: {
        high: { background: '#EDFBCD', text: '#67A221' },
        medium: { background: '#FEF3C9', text: '#D77720' },
        low: { background: '#FFF1F2', text: '#F24261' }
      },
      addTag: { background: '#7C3AED', text: '#FFFFFF' },
      gray: {
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        500: '#6B7280',
        700: '#374151'
      }
    },
    spacing: {
      1: '4px', 2: '8px', 3: '12px', 4: '16px', 
      5: '20px', 6: '24px', 8: '32px'
    },
    typography: {
      fontFamily: { primary: "'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
      fontSize: { xs: '12px', sm: '14px', base: '16px', lg: '18px' },
      fontWeight: { normal: '400', semibold: '600', extrabold: '800' }
    },
    icons: {
      pawPrint: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>',
      cornerDownLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>',
      squarePen: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>',
      tag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
      trash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
    }
  };
  
  if (this.tags.length === 0) {
    tagsList.innerHTML = this.createEmptyState(tokens);
  } else {
    tagsList.innerHTML = this.tags.map(tag => this.createTagCard(tag, tokens)).join('');
    this.setupNewCardListeners();
  }
}

createEmptyState(tokens) {
  return `
    <div id="threadcub-empty-state" style="
      text-align: center;
      padding: ${tokens.spacing[8]} ${tokens.spacing[5]};
      color: ${tokens.colors.gray[500]};
    ">
      <div style="
        width: 80px;
        height: 80px;
        margin: 0 auto ${tokens.spacing[5]};
        background: linear-gradient(135deg, ${tokens.colors.gray[100]} 0%, ${tokens.colors.gray[200]} 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
      ">🏷️</div>
      
      <h3 style="
        font-size: ${tokens.typography.fontSize.lg};
        font-weight: ${tokens.typography.fontWeight.semibold};
        margin: 0 0 ${tokens.spacing[2]};
        color: ${tokens.colors.gray[700]};
      ">No tags yet</h3>
      
      <p style="
        font-size: ${tokens.typography.fontSize.sm};
        line-height: 1.5;
        margin: 0;
        max-width: 200px;
        margin: 0 auto;
      ">Highlight text to get started with your first swipe!</p>
    </div>
  `;
}

createTagCard(tag, tokens) {
  const priority = tag.priority || 'medium';
  const hasNote = tag.note && tag.note.trim().length > 0;
  const hasTags = tag.tags && tag.tags.length > 0;
  
  return `
    <div class="threadcub-tag-card" 
         data-tag-id="${tag.id}" 
         data-state="default"
         style="
           background: ${tokens.colors.white};
           border: 1px solid ${tokens.colors.gray[200]};
           border-radius: 8px;
           padding: ${tokens.spacing[4]};
           margin-bottom: ${tokens.spacing[3]};
           position: relative;
           transition: all 0.2s ease;
           cursor: pointer;
         ">
      
      <!-- Card Content -->
      <div class="card-content">
        <!-- Tag Text -->
        <div class="tag-text" style="
          font-size: ${tokens.typography.fontSize.sm};
          line-height: 1.4;
          color: ${tokens.colors.gray[700]};
          margin-bottom: ${tokens.spacing[4]};
          font-family: ${tokens.typography.fontFamily.primary};
        ">${tag.text}</div>
        
        <!-- Priority Tags (if any) -->
        ${hasTags ? this.createPriorityTags(tag.tags, tokens) : ''}
        
        <!-- Note Display (if exists) -->
        ${hasNote ? this.createNoteDisplay(tag.note, tag.id, tokens) : ''}
        
        <!-- Default State: Just Paw Print -->
        <div class="default-state" style="
          display: flex;
          justify-content: flex-end;
          align-items: center;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        ">
          <div style="
            color: ${tokens.colors.gray[500]};
            display: flex;
            align-items: center;
            justify-content: center;
          ">${tokens.icons.pawPrint}</div>
        </div>
        
        <!-- Hover State: Action Buttons (hidden by default) -->
        <div class="action-buttons" style="
          display: none;
          justify-content: center;
          align-items: center;
          gap: ${tokens.spacing[4]};
          padding-top: ${tokens.spacing[2]};
        ">
          <button class="action-btn" data-action="continue-chat" data-tag-id="${tag.id}" style="
            background: transparent;
            border: none;
            color: ${tokens.colors.gray[500]};
            cursor: pointer;
            padding: ${tokens.spacing[2]};
            border-radius: 4px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          ">${tokens.icons.cornerDownLeft}</button>
          
          <button class="action-btn" data-action="edit-note" data-tag-id="${tag.id}" style="
            background: transparent;
            border: none;
            color: ${tokens.colors.gray[500]};
            cursor: pointer;
            padding: ${tokens.spacing[2]};
            border-radius: 4px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          ">${tokens.icons.squarePen}</button>
          
          <button class="action-btn" data-action="add-tag" data-tag-id="${tag.id}" style="
            background: transparent;
            border: none;
            color: ${tokens.colors.gray[500]};
            cursor: pointer;
            padding: ${tokens.spacing[2]};
            border-radius: 4px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          ">${tokens.icons.tag}</button>
          
          <button class="action-btn" data-action="delete" data-tag-id="${tag.id}" style="
            background: transparent;
            border: none;
            color: ${tokens.colors.gray[500]};
            cursor: pointer;
            padding: ${tokens.spacing[2]};
            border-radius: 4px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          ">${tokens.icons.trash}</button>
        </div>
        
        <!-- Note Editing State (hidden by default) -->
        <div class="note-editing" style="display: none;" data-tag-id="${tag.id}">
          <textarea class="note-textarea" placeholder="Add your note..." style="
            width: 100%;
            min-height: 80px;
            padding: ${tokens.spacing[3]};
            border: 2px solid ${tokens.colors.primary};
            border-radius: 6px;
            font-size: ${tokens.typography.fontSize.sm};
            line-height: 1.4;
            color: ${tokens.colors.gray[700]};
            resize: vertical;
            font-family: ${tokens.typography.fontFamily.primary};
            margin-bottom: ${tokens.spacing[3]};
            box-sizing: border-box;
            outline: none;
          ">${tag.note || ''}</textarea>
          
          <div style="display: flex; gap: ${tokens.spacing[2]};">
            <button class="save-note-btn" data-tag-id="${tag.id}" style="
              background: ${tokens.colors.primary};
              border: none;
              color: white;
              padding: ${tokens.spacing[2]} ${tokens.spacing[3]};
              border-radius: 4px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              cursor: pointer;
              text-transform: uppercase;
              transition: all 0.2s ease;
              opacity: 0.5;
              pointer-events: none;
            ">SAVE</button>
            
            <button class="cancel-note-btn" data-tag-id="${tag.id}" style="
              background: transparent;
              border: none;
              color: ${tokens.colors.gray[500]};
              padding: ${tokens.spacing[2]} ${tokens.spacing[3]};
              border-radius: 4px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              cursor: pointer;
              text-transform: uppercase;
              transition: all 0.2s ease;
            ">CANCEL</button>
          </div>
        </div>
        
        <!-- Tag Editing State (hidden by default) -->
        <div class="tag-editing" style="display: none;" data-tag-id="${tag.id}">
          <div class="priority-options" style="
            display: flex;
            gap: ${tokens.spacing[2]};
            margin-bottom: ${tokens.spacing[3]};
            flex-wrap: wrap;
          ">
            <button class="priority-btn" data-priority="high" style="
              background: ${tokens.colors.priority.high.background};
              color: ${tokens.colors.priority.high.text};
              border: none;
              padding: ${tokens.spacing[1]} ${tokens.spacing[3]};
              border-radius: 12px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              text-transform: uppercase;
              cursor: pointer;
              transition: all 0.2s ease;
            ">HIGH</button>
            
            <button class="priority-btn" data-priority="medium" style="
              background: ${tokens.colors.priority.medium.background};
              color: ${tokens.colors.priority.medium.text};
              border: none;
              padding: ${tokens.spacing[1]} ${tokens.spacing[3]};
              border-radius: 12px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              text-transform: uppercase;
              cursor: pointer;
              transition: all 0.2s ease;
            ">MEDIUM</button>
            
            <button class="priority-btn" data-priority="low" style="
              background: ${tokens.colors.priority.low.background};
              color: ${tokens.colors.priority.low.text};
              border: none;
              padding: ${tokens.spacing[1]} ${tokens.spacing[3]};
              border-radius: 12px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              text-transform: uppercase;
              cursor: pointer;
              transition: all 0.2s ease;
            ">LOW</button>
            
            <button class="priority-btn add-tag-btn" style="
              background: ${tokens.colors.addTag.background};
              color: ${tokens.colors.addTag.text};
              border: none;
              padding: ${tokens.spacing[1]} ${tokens.spacing[3]};
              border-radius: 12px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              text-transform: uppercase;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: ${tokens.spacing[1]};
            ">
              <span style="font-size: 10px;">+</span> ADD TAG
            </button>
          </div>
          
          <div style="display: flex; gap: ${tokens.spacing[2]};">
            <button class="cancel-tag-btn" data-tag-id="${tag.id}" style="
              background: transparent;
              border: none;
              color: ${tokens.colors.gray[500]};
              padding: ${tokens.spacing[2]} ${tokens.spacing[3]};
              border-radius: 4px;
              font-size: ${tokens.typography.fontSize.xs};
              font-weight: ${tokens.typography.fontWeight.extrabold};
              cursor: pointer;
              text-transform: uppercase;
              transition: all 0.2s ease;
            ">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

createPriorityTags(tags, tokens) {
  return `
    <div class="priority-tags" style="
      display: flex;
      gap: ${tokens.spacing[1]};
      margin-bottom: ${tokens.spacing[3]};
      flex-wrap: wrap;
    ">
      ${tags.map(tag => `
        <span class="priority-tag" style="
          background: ${tokens.colors.priority[tag.priority || 'medium'].background};
          color: ${tokens.colors.priority[tag.priority || 'medium'].text};
          padding: ${tokens.spacing[1]} ${tokens.spacing[2]};
          border-radius: 12px;
          font-size: ${tokens.typography.fontSize.xs};
          font-weight: ${tokens.typography.fontWeight.extrabold};
          text-transform: uppercase;
        ">${tag.label}</span>
      `).join('')}
    </div>
  `;
}

createNoteDisplay(note, tagId, tokens) {
  return `
    <div class="note-display" data-tag-id="${tagId}" style="
      background: ${tokens.colors.gray[100]};
      border: 1px solid ${tokens.colors.gray[200]};
      border-radius: 6px;
      padding: ${tokens.spacing[3]};
      margin-bottom: ${tokens.spacing[3]};
      font-size: ${tokens.typography.fontSize.sm};
      line-height: 1.4;
      color: ${tokens.colors.gray[700]};
    ">${note}</div>
  `;
}

setupNewCardListeners() {
  const cards = this.sidePanel.querySelectorAll('.threadcub-tag-card');
  
  cards.forEach(card => {
    const tagId = parseInt(card.getAttribute('data-tag-id'));
    
    // Card hover effects
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      
      // Show action buttons, hide paw print
      const defaultState = card.querySelector('.default-state');
      const actionButtons = card.querySelector('.action-buttons');
      
      if (defaultState) defaultState.style.display = 'none';
      if (actionButtons) actionButtons.style.display = 'flex';
    });
    
    card.addEventListener('mouseleave', () => {
      // Only reset if we're not in editing state
      const currentState = card.getAttribute('data-state');
      if (currentState === 'default') {
        card.style.boxShadow = 'none';
        
        // Hide action buttons, show paw print
        const defaultState = card.querySelector('.default-state');
        const actionButtons = card.querySelector('.action-buttons');
        
        if (defaultState) defaultState.style.display = 'flex';
        if (actionButtons) actionButtons.style.display = 'none';
      }
    });
    
    // Action button listeners
    this.setupCardActionListeners(card, tagId);
  });
}

setupCardActionListeners(card, tagId) {
  // Continue in chat
  const continueBtn = card.querySelector('[data-action="continue-chat"]');
  if (continueBtn) {
    continueBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.continueTagInChat(tagId);
    });
    
    continueBtn.addEventListener('mouseenter', () => {
      continueBtn.style.background = '#F3F4F6';
      continueBtn.style.color = '#7C3AED';
    });
    
    continueBtn.addEventListener('mouseleave', () => {
      continueBtn.style.background = 'transparent';
      continueBtn.style.color = '#6B7280';
    });
  }
  
  // Edit note
  const editBtn = card.querySelector('[data-action="edit-note"]');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterNoteEditingState(card, tagId);
    });
    
    editBtn.addEventListener('mouseenter', () => {
      editBtn.style.background = '#F3F4F6';
      editBtn.style.color = '#7C3AED';
    });
    
    editBtn.addEventListener('mouseleave', () => {
      editBtn.style.background = 'transparent';
      editBtn.style.color = '#6B7280';
    });
  }
  
  // Add tag
  const tagBtn = card.querySelector('[data-action="add-tag"]');
  if (tagBtn) {
    tagBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.enterTagEditingState(card, tagId);
    });
    
    tagBtn.addEventListener('mouseenter', () => {
      tagBtn.style.background = '#F3F4F6';
      tagBtn.style.color = '#7C3AED';
    });
    
    tagBtn.addEventListener('mouseleave', () => {
      tagBtn.style.background = 'transparent';
      tagBtn.style.color = '#6B7280';
    });
  }
  
  // Delete
  const deleteBtn = card.querySelector('[data-action="delete"]');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTagWithUndo(tagId);
    });
    
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = '#FEF2F2';
      deleteBtn.style.color = '#EF4444';
    });
    
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = 'transparent';
      deleteBtn.style.color = '#6B7280';
    });
  }
  
  // Note editing listeners
  this.setupNoteEditingListeners(card, tagId);
  
  // Tag editing listeners
  this.setupTagEditingListeners(card, tagId);
}

enterNoteEditingState(card, tagId) {
  card.setAttribute('data-state', 'note-editing');
  
  // Hide default content, show note editing
  const actionButtons = card.querySelector('.action-buttons');
  const defaultState = card.querySelector('.default-state');
  const noteEditing = card.querySelector('.note-editing');
  
  if (actionButtons) actionButtons.style.display = 'none';
  if (defaultState) defaultState.style.display = 'none';
  if (noteEditing) {
    noteEditing.style.display = 'block';
    
    // Focus the textarea
    const textarea = noteEditing.querySelector('.note-textarea');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }
}

enterTagEditingState(card, tagId) {
  card.setAttribute('data-state', 'tag-editing');
  
  // Hide default content, show tag editing
  const actionButtons = card.querySelector('.action-buttons');
  const defaultState = card.querySelector('.default-state');
  const tagEditing = card.querySelector('.tag-editing');
  
  if (actionButtons) actionButtons.style.display = 'none';
  if (defaultState) defaultState.style.display = 'none';
  if (tagEditing) tagEditing.style.display = 'block';
}

setupNoteEditingListeners(card, tagId) {
  const textarea = card.querySelector('.note-textarea');
  const saveBtn = card.querySelector('.save-note-btn');
  const cancelBtn = card.querySelector('.cancel-note-btn');
  
  if (textarea && saveBtn) {
    // Enable save button when text is entered
    textarea.addEventListener('input', () => {
      const hasText = textarea.value.trim().length > 0;
      
      if (hasText) {
        saveBtn.style.opacity = '1';
        saveBtn.style.pointerEvents = 'auto';
        saveBtn.style.background = '#7C3AED';
      } else {
        saveBtn.style.opacity = '0.5';
        saveBtn.style.pointerEvents = 'none';
        saveBtn.style.background = '#D1D5DB';
      }
    });
    
    // Save note
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveNoteForCard(tagId, textarea.value.trim());
      this.exitEditingState(card);
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.exitEditingState(card);
    });
  }
}

setupTagEditingListeners(card, tagId) {
  const priorityBtns = card.querySelectorAll('.priority-btn');
  const cancelBtn = card.querySelector('.cancel-tag-btn');
  
  priorityBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const priority = btn.getAttribute('data-priority');
      
      if (priority) {
        this.addPriorityTag(tagId, priority);
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

exitEditingState(card) {
  card.setAttribute('data-state', 'default');
  
  // Hide all editing states
  const noteEditing = card.querySelector('.note-editing');
  const tagEditing = card.querySelector('.tag-editing');
  
  if (noteEditing) noteEditing.style.display = 'none';
  if (tagEditing) tagEditing.style.display = 'none';
  
  // Show action buttons since user was interacting
  const actionButtons = card.querySelector('.action-buttons');
  const defaultState = card.querySelector('.default-state');
  
  if (actionButtons) actionButtons.style.display = 'flex';
  if (defaultState) defaultState.style.display = 'none';
}

// Helper methods
saveNoteForCard(tagId, noteText) {
  const tag = this.tags.find(t => t.id === tagId);
  if (tag) {
    tag.note = noteText;
    console.log('🏷️ ThreadCub: Note saved for tag:', tagId);
    this.updateTagsList(); // Refresh to show the note
  }
}

addPriorityTag(tagId, priority) {
  const tag = this.tags.find(t => t.id === tagId);
  if (tag) {
    if (!tag.tags) tag.tags = [];
    
    // Remove existing priority tags
    tag.tags = tag.tags.filter(t => !['high', 'medium', 'low'].includes(t.priority));
    
    // Add new priority tag
    tag.tags.push({
      label: priority.toUpperCase(),
      priority: priority
    });
    
    console.log('🏷️ ThreadCub: Priority tag added:', priority);
  }
}

deleteTagWithUndo(tagId) {
  // For now, just delete immediately (we'll add undo functionality later)
  console.log('🏷️ ThreadCub: Delete with undo for tag:', tagId);
  this.deleteTag(tagId);
}

// Continue in chat method (needed for action buttons)
continueTagInChat(tagId) {
  const tag = this.tags.find(t => t.id === tagId);
  if (!tag) {
    console.log('🏷️ ThreadCub: Tag not found for continue in chat:', tagId);
    return false;
  }
  
  console.log('🏷️ ThreadCub: Continue tag in chat:', tagId);
  
  // Use the same chat population logic as the "Find Out More" button
  const success = this.populateChatInputDirectly(tag.text);
  
  if (success) {
    // Close the side panel after successful population
    this.hideSidePanel();
    console.log('🏷️ ThreadCub: Tag text sent to chat input and panel closed');
  } else {
    console.log('🏷️ ThreadCub: Could not find chat input field');
  }
  
  return success;
}

// Filter tags by priority
filterTagsByPriority(priority) {
  console.log('🏷️ ThreadCub: Filtering tags by priority:', priority);
  
  const allCards = this.sidePanel.querySelectorAll('.threadcub-tag-card');
  
  allCards.forEach(card => {
    const tagId = parseInt(card.getAttribute('data-tag-id'));
    const tag = this.tags.find(t => t.id === tagId);
    
    let shouldShow = true;
    
    if (priority !== 'all' && tag) {
      // Check if tag has the specified priority
      const hasPriority = tag.tags && tag.tags.some(t => t.priority === priority);
      shouldShow = hasPriority;
    }
    
    // Show/hide card
    card.style.display = shouldShow ? 'block' : 'none';
  });
}

// === END SECTION 1H ===