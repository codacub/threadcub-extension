// Highlight sync service for ThreadCub Chrome extension
// Manages saving highlights to both local storage and Supabase backend

import { supabaseAuth, supabaseApi } from '../auth/supabase-client.js';
import { metadataScraper } from '../utils/metadata-scraper.js';

/**
 * Highlight sync service
 */
export const highlightSyncService = {
  /**
   * Save a highlight (to Supabase if authenticated, always to local storage)
   * @param {Selection|Object} selectionOrTag - Browser selection object OR tag object with text
   * @param {Object} additionalData - Additional data to save with highlight (e.g., tags)
   * @returns {Promise<Object>} Result object with success, synced status, and data
   */
  async saveHighlight(selectionOrTag, additionalData = {}) {
    console.log('📝 [HighlightSync] saveHighlight called');
    console.log('📝 [HighlightSync] Input data:', selectionOrTag);
    console.log('📝 [HighlightSync] Additional data:', additionalData);

    // Check if this is a tag object or a Selection object
    const isTagObject = selectionOrTag && typeof selectionOrTag === 'object' && 'text' in selectionOrTag;
    console.log('📝 [HighlightSync] Input type:', isTagObject ? 'Tag object' : 'Selection object');

    if (isTagObject) {
      // Handle tag object
      if (!selectionOrTag.text || selectionOrTag.text.trim() === '') {
        console.log('❌ [HighlightSync] No text in tag object');
        return { success: false, error: 'No text in tag' };
      }
    } else {
      // Handle Selection object
      if (!selectionOrTag || selectionOrTag.isCollapsed) {
        console.log('❌ [HighlightSync] No text selected or selection is collapsed');
        return { success: false, error: 'No text selected' };
      }
    }

    try {
      let metadata;

      if (isTagObject) {
        // Extract metadata from tag object and page
        console.log('📊 [HighlightSync] Extracting metadata from tag and page...');
        metadata = {
          highlighted_text: selectionOrTag.text,
          source_url: window.location.href,
          source_chat_id: metadataScraper.getChatId(),
          source_title: metadataScraper.getChatTitle(),
          source_platform: metadataScraper.getPlatform(),
          message_role: null, // Can't determine from tag alone
          surrounding_context: null // Not available from tag
        };
        console.log('📊 [HighlightSync] Metadata extracted:', metadata);
      } else {
        // Gather metadata from selection
        console.log('📊 [HighlightSync] Gathering metadata from page...');
        metadata = metadataScraper.gatherHighlightMetadata(selectionOrTag);
        console.log('📊 [HighlightSync] Metadata gathered:', metadata);
      }

      // Merge with any additional data
      const highlightData = {
        ...metadata,
        ...additionalData
      };
      console.log('📦 [HighlightSync] Final highlight data:', highlightData);

      // Always save locally first (backup/offline support)
      console.log('💾 [HighlightSync] Saving to local storage...');
      const localId = await this.saveToLocal(highlightData);
      console.log('✅ [HighlightSync] Saved to local storage with ID:', localId);

      // Try to sync to Supabase if authenticated
      console.log('🔐 [HighlightSync] Checking authentication status...');
      const isAuthenticated = await supabaseAuth.isAuthenticated();
      console.log('🔐 [HighlightSync] Is authenticated:', isAuthenticated);

      if (isAuthenticated) {
        try {
          console.log('🚀 [HighlightSync] Authenticated! Syncing to Supabase...');
          const result = await supabaseApi.insertHighlight(highlightData);
          console.log('✅ [HighlightSync] Successfully synced to Supabase:', result);

          // Update local record with Supabase ID
          await this.markAsSynced(localId, result[0].id);
          console.log('✅ [HighlightSync] Marked local record as synced');

          return {
            success: true,
            synced: true,
            data: result[0],
            localId
          };
        } catch (error) {
          console.error('❌ [HighlightSync] Failed to sync highlight to Supabase:', error);
          console.error('❌ [HighlightSync] Error details:', error.message, error.stack);

          // Mark as pending sync for retry later
          await this.markAsPendingSync(localId, error.message);
          console.log('⚠️ [HighlightSync] Marked as pending sync for retry');

          return {
            success: true,
            synced: false,
            error: error.message,
            localId,
            reason: 'sync_failed'
          };
        }
      }

      console.log('💾 [HighlightSync] User not authenticated, saved locally only');
      return {
        success: true,
        synced: false,
        localId,
        reason: 'not_authenticated'
      };
    } catch (error) {
      console.error('❌ [HighlightSync] Failed to save highlight:', error);
      console.error('❌ [HighlightSync] Error details:', error.message, error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Save highlight to local storage
   * @param {Object} metadata - Highlight metadata
   * @returns {Promise<string>} Local ID of saved highlight
   */
  async saveToLocal(metadata) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(['highlights'], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          const highlights = result.highlights || [];
          const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const highlightRecord = {
            local_id: localId,
            ...metadata,
            created_at: new Date().toISOString(),
            synced: false,
            pending_sync: false,
            supabase_id: null
          };

          // Add to beginning of array (most recent first)
          highlights.unshift(highlightRecord);

          chrome.storage.local.set({ highlights }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(localId);
            }
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Mark a local highlight as synced with Supabase
   * @param {string} localId - Local ID of highlight
   * @param {string} supabaseId - Supabase UUID of highlight
   * @returns {Promise<void>}
   */
  async markAsSynced(localId, supabaseId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['highlights'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const highlights = result.highlights || [];
        const index = highlights.findIndex(h => h.local_id === localId);

        if (index !== -1) {
          highlights[index].synced = true;
          highlights[index].supabase_id = supabaseId;
          highlights[index].pending_sync = false;
          highlights[index].sync_error = null;

          chrome.storage.local.set({ highlights }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        } else {
          resolve(); // Highlight not found, but don't error
        }
      });
    });
  },

  /**
   * Mark a local highlight as pending sync (failed to sync, will retry)
   * @param {string} localId - Local ID of highlight
   * @param {string} error - Error message (optional)
   * @returns {Promise<void>}
   */
  async markAsPendingSync(localId, error = null) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['highlights'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const highlights = result.highlights || [];
        const index = highlights.findIndex(h => h.local_id === localId);

        if (index !== -1) {
          highlights[index].pending_sync = true;
          highlights[index].sync_error = error;

          chrome.storage.local.set({ highlights }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          });
        } else {
          resolve(); // Highlight not found, but don't error
        }
      });
    });
  },

  /**
   * Sync all pending highlights to Supabase
   * @returns {Promise<Object>} Result with count of synced highlights
   */
  async syncPendingHighlights() {
    const isAuthenticated = await supabaseAuth.isAuthenticated();
    if (!isAuthenticated) {
      return { synced: 0, failed: 0, message: 'Not authenticated' };
    }

    return new Promise((resolve) => {
      chrome.storage.local.get(['highlights'], async (result) => {
        const highlights = result.highlights || [];
        const pending = highlights.filter(h => !h.synced || h.pending_sync);

        let syncedCount = 0;
        let failedCount = 0;

        for (const highlight of pending) {
          try {
            // Extract only the data needed for Supabase
            const { local_id, synced, pending_sync, supabase_id, sync_error, created_at, ...metadata } = highlight;

            const result = await supabaseApi.insertHighlight(metadata);
            await this.markAsSynced(local_id, result[0].id);
            syncedCount++;
          } catch (error) {
            console.error('Failed to sync highlight:', error);
            await this.markAsPendingSync(highlight.local_id, error.message);
            failedCount++;
          }
        }

        resolve({
          synced: syncedCount,
          failed: failedCount,
          total: pending.length
        });
      });
    });
  },

  /**
   * Get local highlights
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of highlights
   */
  async getLocalHighlights({ limit = 50, offset = 0 } = {}) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['highlights'], (result) => {
        const highlights = result.highlights || [];
        const sliced = highlights.slice(offset, offset + limit);
        resolve(sliced);
      });
    });
  },

  /**
   * Get count of pending sync highlights
   * @returns {Promise<number>} Count of pending highlights
   */
  async getPendingSyncCount() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['highlights'], (result) => {
        const highlights = result.highlights || [];
        const pending = highlights.filter(h => !h.synced || h.pending_sync);
        resolve(pending.length);
      });
    });
  },

  /**
   * Delete a local highlight
   * @param {string} localId - Local ID of highlight to delete
   * @param {boolean} deleteFromSupabase - Also delete from Supabase if synced
   * @returns {Promise<void>}
   */
  async deleteHighlight(localId, deleteFromSupabase = true) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['highlights'], async (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const highlights = result.highlights || [];
        const index = highlights.findIndex(h => h.local_id === localId);

        if (index === -1) {
          reject(new Error('Highlight not found'));
          return;
        }

        const highlight = highlights[index];

        // Delete from Supabase if synced and requested
        if (deleteFromSupabase && highlight.synced && highlight.supabase_id) {
          try {
            await supabaseApi.deleteHighlight(highlight.supabase_id);
          } catch (error) {
            console.error('Failed to delete from Supabase:', error);
            // Continue with local deletion even if Supabase delete fails
          }
        }

        // Remove from local storage
        highlights.splice(index, 1);

        chrome.storage.local.set({ highlights }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    });
  },

  /**
   * Clear all local highlights
   * @param {boolean} onlySynced - Only clear synced highlights
   * @returns {Promise<number>} Number of highlights cleared
   */
  async clearLocalHighlights(onlySynced = false) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['highlights'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const highlights = result.highlights || [];
        const originalCount = highlights.length;

        let remaining;
        if (onlySynced) {
          remaining = highlights.filter(h => !h.synced);
        } else {
          remaining = [];
        }

        chrome.storage.local.set({ highlights: remaining }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(originalCount - remaining.length);
          }
        });
      });
    });
  }
};
