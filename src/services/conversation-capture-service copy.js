// Conversation capture service for ThreadCub Chrome extension
// Captures full conversation transcripts and syncs to Supabase

import { supabaseAuth } from '../auth/supabase-client.js';

const SUPABASE_URL = 'https://evbkoulaaityzztyutox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YmtvdWxhYWl0eXp6dHl1dG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTEwMDUsImV4cCI6MjA2ODE4NzAwNX0.OP6_JmlZwxo9p2ZpWSQMdE-wGVSqowB9kkT08A0c92Q';

export const conversationCaptureService = {
  /**
   * Capture full conversation from current page and save/update in Supabase
   * @param {string} chatId - Chat ID to capture
   * @returns {Promise<Object>} Result object
   */
  async captureFullConversation(chatId) {
    try {
      console.log('📝 [ConversationCapture] Starting capture for chat:', chatId);
      
      // Scrape conversation from page
      const transcript = this.scrapeConversationFromPage();
      const messageCount = transcript.length;
      
      if (messageCount === 0) {
        console.warn('⚠️ [ConversationCapture] No messages found to capture');
        return { success: false, error: 'No messages found' };
      }
      
      console.log(`📊 [ConversationCapture] Scraped ${messageCount} messages`);
      
      // Check authentication
      const isAuthenticated = await supabaseAuth.isAuthenticated();
      if (!isAuthenticated) {
        console.error('❌ [ConversationCapture] Not authenticated');
        return { success: false, error: 'Not authenticated' };
      }
      
      // Refresh token if expired
      const session = await supabaseAuth.getSession();
      if (supabaseAuth.isExpired(session)) {
        const refreshed = await supabaseAuth.refreshSession();
        if (!refreshed) {
          return { success: false, error: 'Session expired' };
        }
      }
      
      const currentSession = await supabaseAuth.getSession();
      
      const conversationData = {
        chat_id: chatId,
        user_id: currentSession.user.id,
        title: this.detectChatTitle(),
        platform: this.detectPlatform(),
        source_url: window.location.href,
        full_transcript: transcript,
        message_count: messageCount
      };
      
      console.log('💾 [ConversationCapture] Calling upsert function...');
      
      // Call the Supabase RPC function for upsert
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify(conversationData)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ [ConversationCapture] Upsert failed:', error);
        throw new Error(`Failed to upsert conversation: ${response.status} - ${error}`);
      }
      
      const result = await response.json();
      console.log('✅ [ConversationCapture] Conversation captured successfully');
      
      return { success: true, data: result, messageCount };
      
    } catch (error) {
      console.error('❌ [ConversationCapture] Error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Scrape conversation messages from current page
   * @returns {Array} Array of message objects
   */
  scrapeConversationFromPage() {
    const messages = [];
    const platform = this.detectPlatform();
    
    if (platform === 'claude') {
      // Claude.ai scraping
      const turns = document.querySelectorAll('[data-testid="conversation-turn"]');
      
      turns.forEach((turn, index) => {
        const isUser = turn.querySelector('[data-is-user-message="true"]') !== null;
        const role = isUser ? 'user' : 'assistant';
        
        const contentEl = turn.querySelector('.font-user-message, .font-claude-message');
        const content = contentEl ? contentEl.innerText.trim() : '';
        
        if (content) {
          messages.push({
            role,
            content,
            sequence: index + 1,
            timestamp: new Date().toISOString()
          });
        }
      });
      
    } else if (platform === 'chatgpt') {
      // ChatGPT scraping
      const turns = document.querySelectorAll('[data-testid^="conversation-turn"]');
      
      turns.forEach((turn, index) => {
        const role = turn.getAttribute('data-testid').includes('user') ? 'user' : 'assistant';
        const contentEl = turn.querySelector('.markdown, .whitespace-pre-wrap');
        const content = contentEl ? contentEl.innerText.trim() : '';
        
        if (content) {
          messages.push({
            role,
            content,
            sequence: index + 1,
            timestamp: new Date().toISOString()
          });
        }
      });
      
    } else if (platform === 'gemini') {
      // Gemini scraping
      const userMessages = document.querySelectorAll('[data-test-id="user-query-text"]');
      const assistantMessages = document.querySelectorAll('[data-test-id="model-response-text"]');
      
      const maxLength = Math.max(userMessages.length, assistantMessages.length);
      let sequence = 1;
      
      for (let i = 0; i < maxLength; i++) {
        if (userMessages[i]) {
          messages.push({
            role: 'user',
            content: userMessages[i].innerText.trim(),
            sequence: sequence++,
            timestamp: new Date().toISOString()
          });
        }
        if (assistantMessages[i]) {
          messages.push({
            role: 'assistant',
            content: assistantMessages[i].innerText.trim(),
            sequence: sequence++,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return messages;
  },

  /**
   * Detect platform from current URL
   * @returns {string} Platform name
   */
  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('claude.ai')) return 'claude';
    if (hostname.includes('chat.openai.com')) return 'chatgpt';
    if (hostname.includes('gemini.google.com')) return 'gemini';
    return 'unknown';
  },

  /**
   * Detect chat title from page
   * @returns {string} Chat title
   */
  detectChatTitle() {
    const platform = this.detectPlatform();
    
    if (platform === 'claude') {
      const title = document.title.replace(' - Claude', '').trim();
      if (title && title !== 'Claude') return title;
      
      const titleEl = document.querySelector('[data-testid="chat-title"]');
      if (titleEl) return titleEl.innerText.trim();
    } else if (platform === 'chatgpt') {
      const title = document.title.replace(' - ChatGPT', '').trim();
      if (title && title !== 'ChatGPT') return title;
    } else if (platform === 'gemini') {
      const title = document.title.replace(' - Gemini', '').trim();
      if (title && title !== 'Gemini') return title;
    }
    
    return 'Untitled Conversation';
  }
};