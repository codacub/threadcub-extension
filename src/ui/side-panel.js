console.log('Loading: side-panel.js');

// ThreadCub Side Panel UI Module
// Extracted from Section 1H of content.js - all syntax errors fixed

class ThreadCubSidePanel {
  constructor(taggingSystem) {
    this.taggingSystem = taggingSystem;
    this.sidePanel = null;
    this.currentFilter = 'all'; // 'all', 'tags', 'anchors'
    this.expandedSections = new Set(); // Track which sections are expanded (all collapsed by default)
  }

  // ===== MAIN UPDATE METHOD =====
  updateTagsList() {
    const tagsList = this.sidePanel.querySelector('#threadcub-tags-container');
    if (!tagsList) return;

    const items = this.taggingSystem.tags || [];

    if (items.length === 0) {
      tagsList.innerHTML = this.createEmptyState();
      return;
    }

    // Organize items into sections
    const sections = this.organizeItemsIntoSections(items);

    // Render sections
    tagsList.innerHTML = this.renderSections(sections);
    this.setupNewCardListeners();
    this.setupSectionListeners();
  }

  // Organize items into sections based on messageIndex
  organizeItemsIntoSections(items) {
    // Separate anchors and tags
    const anchors = items.filter(item => item.type === 'anchor');
    const tags = items.filter(item => item.type !== 'anchor');

    // Sort anchors by messageIndex (or createdAt as fallback)
    anchors.sort((a, b) => {
      const aIndex = a.anchor?.messageIndex ?? a.messageIndex ?? Infinity;
      const bIndex = b.anchor?.messageIndex ?? b.messageIndex ?? Infinity;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    // Sort tags by messageIndex (or createdAt as fallback)
    tags.sort((a, b) => {
      const aIndex = a.rangeInfo?.messageIndex ?? a.messageIndex ?? Infinity;
      const bIndex = b.rangeInfo?.messageIndex ?? b.messageIndex ?? Infinity;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    // Build sections array
    const sections = [];

    // Root section: "Start of Chat" - tags before first anchor
    const firstAnchorIndex = anchors.length > 0
      ? (anchors[0].anchor?.messageIndex ?? anchors[0].messageIndex ?? Infinity)
      : Infinity;

    const rootTags = tags.filter(tag => {
      const tagIndex = tag.rangeInfo?.messageIndex ?? tag.messageIndex ?? -1;
      return tagIndex < firstAnchorIndex;
    });

    sections.push({
      type: 'root',
      id: 'root',
      title: 'Start of Chat',
      tags: rootTags
    });

    // Anchor sections: each anchor with its tags
    anchors.forEach((anchor, i) => {
      const anchorIndex = anchor.anchor?.messageIndex ?? anchor.messageIndex ?? Infinity;
      const nextAnchorIndex = i < anchors.length - 1
        ? (anchors[i + 1].anchor?.messageIndex ?? anchors[i + 1].messageIndex ?? Infinity)
        : Infinity;

      const sectionTags = tags.filter(tag => {
        const tagIndex = tag.rangeInfo?.messageIndex ?? tag.messageIndex ?? -1;
        return tagIndex >= anchorIndex && tagIndex < nextAnchorIndex;
      });

      sections.push({
        type: 'anchor',
        id: anchor.id,
        anchor: anchor,
        tags: sectionTags
      });
    });

    return sections;
  }

  // Render all sections
  renderSections(sections) {
    return sections.map(section => {
      if (section.type === 'root') {
        return this.createRootSection(section);
      }
      return this.createAnchorSection(section);
    }).join('');
  }

  // Create root "Start of Chat" section
  createRootSection(section) {
    const isExpanded = this.expandedSections.has('root');
    const hasContent = section.tags.length > 0;

    if (!hasContent) {
      return ''; // Don't show empty root section
    }

    const filteredTags = this.filterSectionTags(section.tags);

    return `
      <div class="threadcub-section" data-section-id="root" data-expanded="${isExpanded}">
        <div class="section-header" data-section-id="root">
          <div class="section-header-left">
            <div class="section-chevron">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
            <div class="section-title">${section.title}</div>
            <div class="section-count">(${section.tags.length})</div>
          </div>
        </div>
        <div class="section-content" style="display: ${isExpanded ? 'block' : 'none'};">
          ${this.createSectionFilter(section.id)}
          <div class="section-tags">
            ${filteredTags.map(tag => this.createSectionTagCard(tag)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Create anchor section with header and nested tags
  createAnchorSection(section) {
    const isExpanded = this.expandedSections.has(section.id);
    const anchor = section.anchor;
    const hasNote = anchor.note && anchor.note.trim().length > 0;
    const hasTags = anchor.tags && anchor.tags.length > 0;

    const filteredTags = this.filterSectionTags(section.tags);

    return `
      <div class="threadcub-section" data-section-id="${section.id}" data-expanded="${isExpanded}">
        <div class="section-header section-header-anchor" data-section-id="${section.id}" data-anchor-id="${anchor.id}">
          <div class="section-header-left">
            <div class="section-chevron">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
            <div class="section-anchor-text">${anchor.snippet || anchor.text}</div>
            <div class="section-count">(${section.tags.length})</div>
          </div>
          <div class="section-header-actions">
            <div class="section-action jump-to-anchor" data-anchor-id="${anchor.id}" title="Jump to anchor">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>
            </div>
            <div class="section-action edit-anchor" data-anchor-id="${anchor.id}" title="Edit anchor">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
            </div>
            <div class="section-action delete-anchor" data-anchor-id="${anchor.id}" title="Delete anchor">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
          </div>
        </div>
        ${hasTags || hasNote ? `
          <div class="section-anchor-meta">
            ${hasTags ? this.createPriorityTags(anchor.tags) : ''}
            ${hasNote ? `<div class="section-anchor-note">${anchor.note}</div>` : ''}
          </div>
        ` : ''}
        <div class="section-content" style="display: ${isExpanded ? 'block' : 'none'};">
          ${section.tags.length > 0 ? this.createSectionFilter(section.id) : ''}
          <div class="section-tags">
            ${filteredTags.map(tag => this.createSectionTagCard(tag)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Create priority filter inside a section
  createSectionFilter(sectionId) {
    return `
      <div class="section-filter" data-section-id="${sectionId}">
        <button class="section-filter-btn active" data-priority="all">All</button>
        <button class="section-filter-btn" data-priority="high">High</button>
        <button class="section-filter-btn" data-priority="medium">Med</button>
        <button class="section-filter-btn" data-priority="low">Low</button>
      </div>
    `;
  }

  // Filter section tags by priority (currently shows all - will be enhanced with state)
  filterSectionTags(tags) {
    // For now, return all tags - priority filtering will be handled by section filter buttons
    return tags;
  }

  // Create tag card for inside sections (with jump-to icon)
  createSectionTagCard(tag) {
    const hasNote = tag.note && tag.note.trim().length > 0;
    const hasTags = tag.tags && tag.tags.length > 0;

    return `
      <div class="threadcub-tag-card threadcub-section-tag" data-tag-id="${tag.id}" data-state="default">
        <div class="card-content">
          <div class="tag-text">${tag.text}</div>

          ${hasTags ? this.createPriorityTags(tag.tags) : ''}
          ${hasNote ? this.createNoteDisplay(tag.note, tag.id) : ''}

          <div class="default-state">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
            </div>
            <div class="action-buttons">
              ${this.createActionButton('continue-chat', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>', tag.id)}
              ${this.createActionButton('jump-to-tag', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>', tag.id)}
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

  // Setup section expand/collapse and action listeners
  setupSectionListeners() {
    // Section header click for expand/collapse
    const sectionHeaders = this.sidePanel.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking on action buttons
        if (e.target.closest('.section-header-actions')) return;

        const sectionId = header.getAttribute('data-section-id');
        this.toggleSection(sectionId);
      });
    });

    // Jump to anchor buttons
    const jumpBtns = this.sidePanel.querySelectorAll('.jump-to-anchor');
    jumpBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const anchorId = parseInt(btn.getAttribute('data-anchor-id'));
        if (this.taggingSystem.jumpToAnchor) {
          this.taggingSystem.jumpToAnchor(anchorId);
        }
      });
    });

    // Edit anchor buttons
    const editBtns = this.sidePanel.querySelectorAll('.edit-anchor');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const anchorId = parseInt(btn.getAttribute('data-anchor-id'));
        // TODO: Implement anchor editing UI
        console.log('Edit anchor:', anchorId);
      });
    });

    // Delete anchor buttons
    const deleteBtns = this.sidePanel.querySelectorAll('.delete-anchor');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const anchorId = parseInt(btn.getAttribute('data-anchor-id'));
        this.taggingSystem.deleteTagWithUndo(anchorId);
      });
    });

    // Section filter buttons
    const filterBtns = this.sidePanel.querySelectorAll('.section-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filter = this.sidePanel.querySelector('.section-filter');
        const sectionId = filter?.getAttribute('data-section-id');
        const priority = btn.getAttribute('data-priority');

        // Update active state
        const siblings = btn.parentElement.querySelectorAll('.section-filter-btn');
        siblings.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');

        // Filter tags within section
        this.filterSectionByPriority(sectionId, priority);
      });
    });

    // Jump to tag buttons
    const jumpTagBtns = this.sidePanel.querySelectorAll('[data-action="jump-to-tag"]');
    jumpTagBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagId = parseInt(btn.getAttribute('data-tag-id'));
        this.jumpToTag(tagId);
      });
    });
  }

  // Toggle section expand/collapse
  toggleSection(sectionId) {
    const section = this.sidePanel.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;

    const isExpanded = this.expandedSections.has(sectionId);

    if (isExpanded) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }

    // Update UI
    section.setAttribute('data-expanded', !isExpanded);
    const content = section.querySelector('.section-content');
    const chevron = section.querySelector('.section-chevron');

    if (content) {
      content.style.display = isExpanded ? 'none' : 'block';
    }
    if (chevron) {
      chevron.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(90deg)';
    }
  }

  // Filter tags within a section by priority
  filterSectionByPriority(sectionId, priority) {
    const section = this.sidePanel.querySelector(`[data-section-id="${sectionId}"]`);
    if (!section) return;

    const tagCards = section.querySelectorAll('.threadcub-section-tag');

    tagCards.forEach(card => {
      const tagId = parseInt(card.getAttribute('data-tag-id'));
      const tag = this.taggingSystem.tags.find(t => t.id === tagId);

      if (priority === 'all') {
        card.style.display = 'block';
      } else {
        const hasPriority = tag?.tags?.some(t => t.priority === priority);
        card.style.display = hasPriority ? 'block' : 'none';
      }
    });
  }

  // Jump to a tag location in the conversation
  jumpToTag(tagId) {
    const tag = this.taggingSystem.tags.find(t => t.id === tagId);
    if (!tag) {
      console.log('Tag not found:', tagId);
      return;
    }

    console.log('Jumping to tag:', tag);

    // Strategy 1: Use rangeInfo if available (TextQuote-style)
    if (tag.rangeInfo) {
      const result = this.jumpToTagViaRangeInfo(tag);
      if (result.success) return;
    }

    // Strategy 2: Use anchor context if available
    if (tag.anchor) {
      const result = window.anchorSystem?.jumpToAnchor(tag.anchor);
      if (result?.success) return;
    }

    // Strategy 3: Search for text in messages
    this.jumpToTagViaTextSearch(tag);
  }

  // Jump using rangeInfo (stored selection context)
  jumpToTagViaRangeInfo(tag) {
    const rangeInfo = tag.rangeInfo;

    // Try adapter-based search first, then fallback to broad search
    const adapter = window.PlatformAdapters?.getAdapter();
    let messages = adapter ? adapter.getMessageElements() : [];

    // If adapter returns nothing, use broad DOM search
    if (!messages || messages.length === 0) {
      messages = document.querySelectorAll('div[class*="message"], div[class*="prose"], div[class*="markdown"], article, [data-message]');
    }

    // Final fallback
    if (!messages || messages.length === 0) {
      messages = document.querySelectorAll('div, p, article');
    }

    for (const message of messages) {
      const messageText = message.textContent || '';

      // Check if exact text exists in this message
      if (!messageText.includes(tag.text)) continue;

      // Verify with prefix/suffix context if available
      const exactIndex = messageText.indexOf(tag.text);
      let score = 0.5;

      if (rangeInfo?.prefix || rangeInfo?.beforeText) {
        const prefix = rangeInfo.prefix || rangeInfo.beforeText;
        const beforeText = messageText.slice(0, exactIndex);
        if (beforeText.includes(prefix)) score += 0.25;
      }

      if (rangeInfo?.suffix || rangeInfo?.afterText) {
        const suffix = rangeInfo.suffix || rangeInfo.afterText;
        const afterText = messageText.slice(exactIndex + tag.text.length);
        if (afterText.includes(suffix)) score += 0.25;
      }

      if (score >= 0.5) { // Lower threshold for better matching
        // Found good match - scroll and flash
        message.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.flashElement(message);
        return { success: true, method: 'rangeInfo' };
      }
    }

    return { success: false };
  }

  // Jump using text search fallback
  jumpToTagViaTextSearch(tag) {
    // Try adapter-based search first
    const adapter = window.PlatformAdapters?.getAdapter();
    let messages = adapter ? adapter.getMessageElements() : [];

    // If adapter returns nothing, use broad DOM search
    if (!messages || messages.length === 0) {
      messages = document.querySelectorAll('div[class*="message"], div[class*="prose"], div[class*="markdown"], article, [data-message]');
    }

    for (const message of messages) {
      const messageText = message.textContent || '';

      if (messageText.includes(tag.text)) {
        message.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.flashElement(message);
        return { success: true, method: 'textSearch' };
      }
    }

    // Final fallback: Full DOM text node search
    const result = this.jumpViaFullTextSearch(tag.text);
    if (result.success) return result;

    // Show failure notification
    this.showJumpFailedNotification();
    return { success: false };
  }

  // Full DOM text search (walks all text nodes)
  jumpViaFullTextSearch(searchText) {
    console.log('Attempting full DOM text search for:', searchText);

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textNode;
    while ((textNode = walker.nextNode())) {
      const nodeText = textNode.textContent;
      if (nodeText.includes(searchText)) {
        const element = textNode.parentElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.flashElement(element);
          return { success: true, method: 'fullTextSearch' };
        }
      }
    }

    return { success: false };
  }

  // Flash highlight an element
  flashElement(element) {
    if (!element) return;

    element.classList.add('threadcub-anchor-flash');
    setTimeout(() => {
      element.classList.remove('threadcub-anchor-flash');
    }, 2000);
  }

  // Show notification when jump fails
  showJumpFailedNotification() {
    const notification = document.createElement('div');
    notification.className = 'threadcub-jump-failed';
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
      <span>Could not find this text in the conversation</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  // Get items based on current filter (legacy - now handled by sections)
  getFilteredItems() {
    return this.taggingSystem.tags || [];
  }

  // Set filter and update list (legacy compatibility)
  setFilter(filter) {
    this.currentFilter = filter;
    this.updateTagsList();
    this.updateFilterTabs();
  }

  // Update filter tab active states (legacy compatibility)
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
  // Anchor cards now match tag card structure for visual consistency
  createAnchorCard(anchor) {
    const hasNote = anchor.note && anchor.note.trim().length > 0;
    const hasTags = anchor.tags && anchor.tags.length > 0;

    return `
      <div class="threadcub-tag-card threadcub-anchor-card" data-tag-id="${anchor.id}" data-anchor-id="${anchor.id}" data-state="default" data-type="anchor">
        <div class="card-content">
          <div class="tag-text">${anchor.snippet || anchor.text}</div>

          ${hasTags ? this.createPriorityTags(anchor.tags) : ''}
          ${hasNote ? this.createNoteDisplay(anchor.note, anchor.id) : ''}

          <div class="default-state">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
            </div>
            <div class="action-buttons">
              ${this.createActionButton('jump-to', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>', anchor.id)}
              ${this.createActionButton('edit-note', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>', anchor.id)}
              ${this.createActionButton('add-tag', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>', anchor.id)}
              ${this.createActionButton('delete', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', anchor.id)}
            </div>
          </div>

          ${this.createNoteEditingState(anchor)}
          ${this.createTagEditingState(anchor)}
        </div>
      </div>
    `;
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
    // Setup section tag card listeners (tags inside sections)
    const sectionTagCards = this.sidePanel.querySelectorAll('.threadcub-section-tag');
    sectionTagCards.forEach(card => {
      const tagId = parseInt(card.getAttribute('data-tag-id'));
      this.setupSectionTagCardListeners(card, tagId);
    });

    // Setup standalone tag card listeners (legacy, outside sections)
    const tagCards = this.sidePanel.querySelectorAll('.threadcub-tag-card:not(.threadcub-section-tag):not(.threadcub-anchor-card)');
    tagCards.forEach(card => {
      const tagId = parseInt(card.getAttribute('data-tag-id'));
      this.setupTagCardListeners(card, tagId);
    });

    // Setup anchor card listeners (legacy standalone anchors)
    const anchorCards = this.sidePanel.querySelectorAll('.threadcub-anchor-card');
    anchorCards.forEach(card => {
      const anchorId = parseInt(card.getAttribute('data-anchor-id'));
      this.setupAnchorCardListeners(card, anchorId);
    });
  }

  // Setup listeners for section tag cards (with jump-to functionality)
  setupSectionTagCardListeners(card, tagId) {
    // Card hover effects
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = 'var(--shadow-card-hover)';
    });

    card.addEventListener('mouseleave', () => {
      const currentState = card.getAttribute('data-state');
      if (currentState === 'default') {
        card.style.boxShadow = 'var(--shadow-card)';
      }
    });

    // Continue in chat (speech bubble)
    const continueBtn = card.querySelector('[data-action="continue-chat"]');
    if (continueBtn) {
      continueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.taggingSystem.continueTagInChat(tagId);
      });
    }

    // Jump to tag (arrow)
    const jumpBtn = card.querySelector('[data-action="jump-to-tag"]');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.jumpToTag(tagId);
      });
    }

    // Edit note
    const editBtn = card.querySelector('[data-action="edit-note"]');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterNoteEditingState(card, tagId);
      });
    }

    // Add tag/priority
    const tagBtn = card.querySelector('[data-action="add-tag"]');
    if (tagBtn) {
      tagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterTagEditingState(card, tagId);
      });
    }

    // Delete
    const deleteBtn = card.querySelector('[data-action="delete"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.taggingSystem.deleteTagWithUndo(tagId);
      });
    }

    // Note editing listeners
    this.setupNoteEditingListeners(card, tagId);

    // Tag editing listeners
    this.setupTagEditingListeners(card, tagId);
  }

  // Setup listeners for anchor cards (now uses same pattern as tag cards)
  setupAnchorCardListeners(card, anchorId) {
    // Card hover effects - same as tags
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = 'var(--shadow-card-hover)';
    });

    card.addEventListener('mouseleave', () => {
      const currentState = card.getAttribute('data-state');
      if (currentState === 'default') {
        card.style.boxShadow = 'var(--shadow-card)';
      }
    });

    // Jump-to action icon
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
        this.enterNoteEditingState(card, anchorId);
      });
    }

    // Add tag/priority button
    const tagBtn = card.querySelector('[data-action="add-tag"]');
    if (tagBtn) {
      tagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterTagEditingState(card, anchorId);
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

    // Note editing listeners - use same as tags
    this.setupNoteEditingListeners(card, anchorId);

    // Tag editing listeners - use same as tags
    this.setupTagEditingListeners(card, anchorId);
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