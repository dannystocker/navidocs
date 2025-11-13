# Claude CLI Chatbox Integration Plan
## Conversational Document Search & Analysis

**Document Version:** 1.0
**Created:** 2025-11-13
**Status:** Integration Plan (Ready for Implementation)
**Implementation Time:** 45-60 minutes
**Complexity:** Medium
**Dependencies:** Vue 3 frontend, Express.js backend, Anthropic Claude API

---

## Executive Summary

Integrate Claude API into NaviDocs to enable:
1. **Conversational search** - "Tell me about my engine warranty" instead of filtering/searching
2. **Document analysis** - "Summarize my maintenance costs" or "What's still under warranty?"
3. **Online research** - "Find current prices for Yanmar engine parts" (search online for pricing)
4. **Q&A chatbox** - Live chat interface in web app for boat-specific questions

This integration provides a modern, AI-powered alternative to traditional search while keeping all document context local to NaviDocs.

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     NaviDocs Web App (Vue 3)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Chatbox Component (Right sidebar)                      │ │
│  │ - User types: "What warranties do I have?"             │ │
│  │ - Responses stream in real-time                        │ │
│  │ - References: "Warranty Card - Nov 13" with links      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬────────────────────────────────────────┘
                       │ HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         NaviDocs Backend (Express.js + SQLite)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /api/chat/message (POST)                               │ │
│  │ - Receives user message + boat_id                      │ │
│  │ - Query SQLite: documents for this boat                │ │
│  │ - Query Meilisearch: relevant documents                │ │
│  │ - Format context for Claude                            │ │
│  │ - Call Claude API with documents + question            │ │
│  │ - Stream response back to frontend                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Chat History Table (SQLite)                            │ │
│  │ - Store conversation thread per boat                   │ │
│  │ - Include references to documents                      │ │
│  │ - Enable context carry-over to Claude                  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬────────────────────────────────────────┘
                       │ HTTPS (API key in Authorization header)
                       ↓
            ┌──────────────────────────┐
            │  Anthropic Claude API    │
            │  (claude-3-5-sonnet)     │
            │  or claude-opus-4        │
            └──────────────────────────┘
```

### 1.2 Data Flow: Message to Response

```
User (Chatbox):
  "What's my monthly maintenance cost?"
       ↓
Frontend:
  POST /api/chat/message
  {
    boat_id: 42,
    message: "What's my monthly maintenance cost?",
    thread_id: "thread_xyz"
  }
       ↓
Backend:
  1. Verify user owns boat_id
  2. Query SQLite: SELECT * FROM documents WHERE boat_id=42
  3. Query Meilisearch: search("monthly", "maintenance", "cost")
  4. Extract relevant document snippets
  5. Build system prompt with NaviDocs context
  6. Call Claude API with:
     - System prompt: "You are a boat management AI..."
     - Document context: "The following are documents from the boat..."
     - Messages: [{ role: "user", content: "What's my monthly..." }]
  7. Stream response token-by-token to frontend
  8. Store conversation in chat_history table
       ↓
Frontend (Streaming):
  Receive tokens in real-time
  Display as user types: "Based on your documents..."
       ↓
User sees:
  "Based on your documents, your average monthly maintenance
   cost is €180 across fuel (€80), lubricants (€40), and
   misc repairs (€60).

   References:
   - Maintenance Log - Oct 2025 (€150 in repairs)
   - Fuel Receipts - Oct 2025 (€80)
   - Service Invoice - Oct 13 (€60 oil change)"
```

---

## 2. Claude API Integration Setup

### 2.1 API Key Management

```bash
# .env file
ANTHROPIC_API_KEY=sk-ant-v1-xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_VERSION=2023-06-01
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # or claude-opus-4
ANTHROPIC_MAX_TOKENS=2048

# Optional: for tracking costs
ANTHROPIC_BUDGET_MONTHLY=500  # USD
```

### 2.2 Installation

```bash
# Add Anthropic SDK to NaviDocs backend
npm install @anthropic-ai/sdk

# Verify installation
npm list @anthropic-ai/sdk
# @navidocs@1.0.0 /home/setup/navidocs
# └── @anthropic-ai/sdk@0.24.0
```

### 2.3 API Client Setup

```javascript
// services/claude.js

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 2048;
  }

  /**
   * Generate response for boat-specific question
   * @param {Object} context - { boat_id, documents, chatHistory }
   * @param {string} userMessage - User's question
   * @returns {AsyncIterable} Token stream
   */
  async *generateResponse(context, userMessage) {
    const { boat_id, documents, boatName, chatHistory } = context;

    // Build system prompt with boat context
    const systemPrompt = this.buildSystemPrompt(boat_id, boatName, documents);

    // Build message history
    const messages = this.buildMessageHistory(chatHistory, userMessage);

    // Stream response from Claude
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: messages,
      stream: true
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        yield event.delta.text;  // Yield each text token
      }
    }
  }

  /**
   * Build system prompt with boat-specific context
   */
  buildSystemPrompt(boat_id, boatName, documents) {
    const docSummary = this.summarizeDocuments(documents);

    return `You are NaviDocs, an AI assistant for boat management and documentation.

You are helping the owner of "${boatName}" (Boat ID: ${boat_id}).

INSTRUCTIONS:
1. Answer questions about their boat's documentation, maintenance, warranties, and equipment
2. Reference specific documents when answering: "According to your Warranty Card from Nov 13..."
3. If information isn't in their documents, suggest what documents they might need
4. Be concise and practical - focus on actionable information
5. Use their document data to provide personalized insights
6. Maintain conversational tone - not robotic

BOAT DOCUMENTS AVAILABLE:
${docSummary}

IMPORTANT CONSTRAINTS:
- Do NOT invent information about their boat or documents
- Do NOT provide legal or financial advice
- If asked about pricing/market rates, offer to search online
- Always cite the document source when providing specific information
- If information is missing, ask user to upload relevant documents

CONVERSATION CONTEXT:
You have access to this boat's maintenance history, warranties, and equipment documentation.
Use this context to provide highly relevant, personalized responses.`;
  }

  /**
   * Summarize documents into context for Claude
   */
  summarizeDocuments(documents) {
    if (!documents || documents.length === 0) {
      return 'No documents uploaded yet.';
    }

    let summary = '';
    const grouped = this.groupDocumentsByType(documents);

    for (const [type, docs] of Object.entries(grouped)) {
      summary += `\n**${type}:**\n`;
      for (const doc of docs.slice(0, 3)) {  // Limit to 3 per type
        summary += `- ${doc.name} (${doc.upload_date})\n`;
      }
      if (docs.length > 3) {
        summary += `- ... and ${docs.length - 3} more\n`;
      }
    }

    return summary;
  }

  /**
   * Group documents by type
   */
  groupDocumentsByType(documents) {
    return documents.reduce((acc, doc) => {
      const type = doc.document_type || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    }, {});
  }

  /**
   * Build message history for Claude (include previous context)
   */
  buildMessageHistory(chatHistory, userMessage) {
    const messages = [];

    // Add previous messages (limit to last 5 exchanges to save tokens)
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-10);  // 5 exchanges = 10 messages
      for (const entry of recentHistory) {
        messages.push({
          role: entry.role,
          content: entry.message
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Get document references from Claude response
   * Extract which documents were cited/relevant
   */
  extractDocumentReferences(response, documents) {
    const references = [];

    for (const doc of documents) {
      // Simple matching: if document name appears in response
      if (response.toLowerCase().includes(doc.name.toLowerCase())) {
        references.push({
          doc_id: doc.id,
          name: doc.name,
          type: doc.document_type,
          download_url: doc.download_url
        });
      }
    }

    return references;
  }
}

module.exports = new ClaudeService(process.env.ANTHROPIC_API_KEY);
```

---

## 3. Backend API Endpoint

### 3.1 Chat Message Handler

```javascript
// routes/api/chat.js

const express = require('express');
const router = express.Router();
const db = require('../../db');
const meilisearch = require('../../meilisearch');
const claudeService = require('../../services/claude');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * POST /api/chat/message
 * Send message to Claude, stream response
 */
router.post('/message', authenticate, async (req, res) => {
  const { boat_id, message, thread_id } = req.body;
  const userId = req.user.id;

  // Validate request
  if (!boat_id || !message) {
    return res.status(400).json({ error: 'boat_id and message required' });
  }

  // Verify user owns this boat
  const boat = await db.get(
    'SELECT * FROM boats WHERE id = ? AND owner_id = ?',
    [boat_id, userId]
  );

  if (!boat) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Get chat thread (or create new one)
    let thread = null;
    if (thread_id) {
      thread = await db.get(
        'SELECT * FROM chat_threads WHERE id = ? AND boat_id = ?',
        [thread_id, boat_id]
      );
    }

    if (!thread) {
      const result = await db.run(
        'INSERT INTO chat_threads (boat_id, created_at) VALUES (?, ?)',
        [boat_id, new Date().toISOString()]
      );
      thread = { id: result.lastID, boat_id };
    }

    // Fetch all documents for this boat (context)
    const documents = await db.all(
      'SELECT id, document_name as name, document_type, upload_date, file_path FROM documents WHERE boat_id = ?',
      [boat_id]
    );

    // Fetch recent chat history (last 5 exchanges)
    const chatHistory = await db.all(
      `SELECT role, message FROM chat_messages
       WHERE thread_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [thread.id]
    );

    // Store user message
    await db.run(
      `INSERT INTO chat_messages (thread_id, role, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [thread.id, 'user', message, new Date().toISOString()]
    );

    // Prepare context for Claude
    const context = {
      boat_id,
      boatName: boat.boat_name,
      documents,
      chatHistory: chatHistory.reverse()  // Chronological order
    };

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    try {
      // Stream response from Claude
      for await (const token of claudeService.generateResponse(context, message)) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
        fullResponse += token;
      }

      // Extract document references from response
      const references = claudeService.extractDocumentReferences(fullResponse, documents);

      // Store assistant response and references
      await db.run(
        `INSERT INTO chat_messages (thread_id, role, message, references, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [thread.id, 'assistant', fullResponse, JSON.stringify(references), new Date().toISOString()]
      );

      // Signal completion
      res.write(`data: ${JSON.stringify({ done: true, thread_id: thread.id })}\n\n`);
      res.end();

    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/threads/:boat_id
 * Get all chat threads for a boat
 */
router.get('/threads/:boat_id', authenticate, async (req, res) => {
  const { boat_id } = req.params;
  const userId = req.user.id;

  // Verify user owns this boat
  const boat = await db.get(
    'SELECT * FROM boats WHERE id = ? AND owner_id = ?',
    [boat_id, userId]
  );

  if (!boat) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const threads = await db.all(
    `SELECT id, created_at,
      (SELECT message FROM chat_messages WHERE thread_id = chat_threads.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM chat_messages WHERE thread_id = chat_threads.id) as message_count
     FROM chat_threads
     WHERE boat_id = ?
     ORDER BY created_at DESC`,
    [boat_id]
  );

  res.json(threads);
});

/**
 * GET /api/chat/threads/:thread_id/messages
 * Get all messages in a thread
 */
router.get('/threads/:thread_id/messages', authenticate, async (req, res) => {
  const { thread_id } = req.params;

  const messages = await db.all(
    `SELECT cm.*, ct.boat_id
     FROM chat_messages cm
     JOIN chat_threads ct ON cm.thread_id = ct.id
     WHERE cm.thread_id = ?
     ORDER BY cm.created_at ASC`,
    [thread_id]
  );

  // Verify user owns the boat for this thread
  if (messages.length > 0) {
    const boat = await db.get(
      'SELECT * FROM boats WHERE id = ? AND owner_id = ?',
      [messages[0].boat_id, req.user.id]
    );
    if (!boat) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  res.json(messages);
});

/**
 * DELETE /api/chat/threads/:thread_id
 * Delete a chat thread
 */
router.delete('/threads/:thread_id', authenticate, async (req, res) => {
  const { thread_id } = req.params;

  // Verify ownership
  const thread = await db.get(
    'SELECT ct.* FROM chat_threads ct WHERE ct.id = ? AND ct.boat_id IN (SELECT id FROM boats WHERE owner_id = ?)',
    [thread_id, req.user.id]
  );

  if (!thread) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Delete thread and all messages
  await db.run('DELETE FROM chat_messages WHERE thread_id = ?', [thread_id]);
  await db.run('DELETE FROM chat_threads WHERE id = ?', [thread_id]);

  res.json({ success: true });
});

module.exports = router;
```

### 3.2 Database Schema

```sql
-- Chat conversations per boat
CREATE TABLE chat_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boat_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  title VARCHAR(255),
  FOREIGN KEY (boat_id) REFERENCES boats(id)
);

-- Individual messages in chat
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  role VARCHAR(20),  -- 'user' or 'assistant'
  message TEXT NOT NULL,
  references JSON,  -- Array of { doc_id, name, type, download_url }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tokens_used INTEGER,  -- For cost tracking
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
);

-- Track API costs
CREATE TABLE claude_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boat_id INTEGER NOT NULL,
  message_id INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (boat_id) REFERENCES boats(id),
  FOREIGN KEY (message_id) REFERENCES chat_messages(id)
);
```

---

## 4. Frontend: Chatbox Component

### 4.1 Vue 3 Chatbox Component

```vue
<!-- components/ChatBox/ChatBox.vue -->

<template>
  <div class="chatbox-container">
    <!-- Header -->
    <div class="chatbox-header">
      <h3>Document Assistant</h3>
      <button @click="toggleThreadList" class="btn-icon">
        <icon-history />
      </button>
    </div>

    <!-- Thread list (sidebar) -->
    <div v-if="showThreadList" class="thread-list">
      <button @click="createNewThread" class="btn-new-thread">
        + New Chat
      </button>
      <div class="threads">
        <div
          v-for="thread in threads"
          :key="thread.id"
          :class="['thread-item', { active: thread.id === currentThreadId }]"
          @click="selectThread(thread)"
        >
          <p class="thread-title">{{ thread.last_message.substring(0, 40) }}...</p>
          <p class="thread-date">{{ formatDate(thread.created_at) }}</p>
        </div>
      </div>
    </div>

    <!-- Messages display -->
    <div class="chatbox-messages" ref="messagesContainer">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="['message', msg.role]"
      >
        <div class="message-content">
          {{ msg.message }}
        </div>

        <!-- References (document links) -->
        <div v-if="msg.references" class="message-references">
          <p class="label">References:</p>
          <a
            v-for="ref in msg.references"
            :key="ref.doc_id"
            :href="ref.download_url"
            target="_blank"
            class="reference-link"
          >
            📄 {{ ref.name }}
          </a>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="message assistant loading">
        <div class="spinner"></div>
        <span>Claude is thinking...</span>
      </div>
    </div>

    <!-- Input area -->
    <div class="chatbox-input">
      <textarea
        v-model="userInput"
        @keydown.enter="sendMessage"
        placeholder="Ask about your documents... (Shift+Enter for new line)"
        class="input-textarea"
        :disabled="isLoading"
      />
      <button
        @click="sendMessage"
        :disabled="!userInput.trim() || isLoading"
        class="btn-send"
      >
        <icon-send v-if="!isLoading" />
        <icon-spinner v-else class="spinner" />
      </button>
    </div>

    <!-- Optional: Search online -->
    <div class="chatbox-footer">
      <label>
        <input v-model="searchOnline" type="checkbox" />
        Search online for additional info
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { api } from '@/services/api';

const props = defineProps({
  boatId: Number,
  boatName: String
});

const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const currentThreadId = ref(null);
const threads = ref([]);
const showThreadList = ref(false);
const searchOnline = ref(false);
const messagesContainer = ref(null);

onMounted(async () => {
  // Load existing threads
  await loadThreads();
  // Create new thread by default
  await createNewThread();
});

const loadThreads = async () => {
  try {
    const response = await api.get(`/api/chat/threads/${props.boatId}`);
    threads.value = response.data;
  } catch (error) {
    console.error('Failed to load threads:', error);
  }
};

const createNewThread = async () => {
  // New thread created automatically on first message
  currentThreadId.value = null;
  messages.value = [];
};

const selectThread = async (thread) => {
  currentThreadId.value = thread.id;
  showThreadList.value = false;

  try {
    const response = await api.get(`/api/chat/threads/${thread.id}/messages`);
    messages.value = response.data;
  } catch (error) {
    console.error('Failed to load thread:', error);
  }

  // Scroll to bottom
  await nextTick();
  scrollToBottom();
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const userMessage = userInput.value;
  userInput.value = '';

  // Add user message to display
  messages.value.push({
    role: 'user',
    message: userMessage
  });

  isLoading.value = true;
  await nextTick();
  scrollToBottom();

  try {
    const response = await api.post('/api/chat/message', {
      boat_id: props.boatId,
      message: userMessage,
      thread_id: currentThreadId.value,
      search_online: searchOnline.value
    }, {
      responseType: 'stream'
    });

    // Handle streaming response
    const reader = response.data.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';
    let references = [];

    const assistantMsgIndex = messages.value.length;
    messages.value.push({
      role: 'assistant',
      message: '',
      references: []
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.token) {
              assistantMessage += data.token;
              messages.value[assistantMsgIndex].message = assistantMessage;
              await nextTick();
              scrollToBottom();
            }

            if (data.references) {
              references = data.references;
              messages.value[assistantMsgIndex].references = references;
            }

            if (data.thread_id) {
              currentThreadId.value = data.thread_id;
              // Reload threads to show new conversation
              await loadThreads();
            }
          } catch (e) {
            console.error('Failed to parse stream data:', e);
          }
        }
      }
    }

  } catch (error) {
    console.error('Failed to send message:', error);
    messages.value.push({
      role: 'assistant',
      message: 'Sorry, I encountered an error processing your message. Please try again.'
    });
  } finally {
    isLoading.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const toggleThreadList = () => {
  showThreadList.value = !showThreadList.value;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.chatbox-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chatbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.chatbox-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.thread-list {
  width: 200px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 8px;
}

.btn-new-thread {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.threads {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thread-item {
  padding: 8px;
  background: #f9f9f9;
  border-left: 3px solid transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.thread-item:hover {
  background: #f0f0f0;
}

.thread-item.active {
  background: #e7f3ff;
  border-left-color: #007bff;
}

.thread-title {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-date {
  margin: 0;
  font-size: 11px;
  color: #999;
}

.chatbox-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  background: #007bff;
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
}

.message.assistant {
  align-self: flex-start;
  background: #f0f0f0;
  color: #333;
  padding: 10px 14px;
  border-radius: 8px;
}

.message.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-content {
  line-height: 1.4;
  font-size: 14px;
}

.message-references {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.reference-link {
  display: block;
  margin-top: 4px;
  color: #007bff;
  text-decoration: none;
}

.reference-link:hover {
  text-decoration: underline;
}

.chatbox-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.input-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  max-height: 100px;
}

.input-textarea:disabled {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.btn-send {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-send:hover:not(:disabled) {
  background: #0056b3;
}

.btn-send:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.chatbox-footer {
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 12px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

### 4.2 Integration into Boat Detail View

```vue
<!-- views/BoatDetail.vue -->

<template>
  <div class="boat-detail-layout">
    <div class="boat-content">
      <!-- Existing boat details, documents list, etc. -->
      <div class="boat-main">
        <!-- ... existing content ... -->
      </div>
    </div>

    <!-- Chatbox sidebar -->
    <aside class="chatbox-sidebar">
      <ChatBox :boat-id="boatId" :boat-name="boatName" />
    </aside>
  </div>
</template>

<script setup>
import ChatBox from '@/components/ChatBox/ChatBox.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const boatId = parseInt(route.params.id);
const boatName = route.params.name || 'Your Boat';
</script>

<style scoped>
.boat-detail-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
  padding: 16px;
}

.chatbox-sidebar {
  position: sticky;
  top: 16px;
  height: fit-content;
}

@media (max-width: 1200px) {
  .boat-detail-layout {
    grid-template-columns: 1fr;
  }

  .chatbox-sidebar {
    position: static;
  }
}
</style>
```

---

## 5. "Search Online" Feature

### 5.1 Implementation

If user enables "Search online for additional info", Claude can fetch current market data:

```javascript
// services/web-search.js

const axios = require('axios');

class WebSearchService {
  async search(query, category) {
    // Example: Google Custom Search or Serper API
    // For this demo, using hypothetical API

    const response = await axios.get('https://api.serper.dev/search', {
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY },
      params: {
        q: query,
        type: 'news'  // or 'products' for pricing
      }
    });

    return response.data.results.map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      date: r.date
    }));
  }
}

module.exports = new WebSearchService();
```

### 5.2 Claude Prompt Extension

```javascript
// When search_online=true, add this to system prompt:

const onlineSearchPrompt = `

ONLINE RESEARCH CAPABILITY:
If the user asks about current prices, availability, or market information that's not in their documents, you can:
1. Acknowledge you'll search for current information
2. Provide insights based on your training data
3. Suggest where they can find information (e.g., "Check YachtWorld.com for current pricing")

DO NOT make up prices or availability. Always indicate if information is from your training data vs. real-time search.`;
```

---

## 6. Cost Estimation

### 6.1 Claude API Pricing (as of Nov 2025)

| Model | Input | Output |
|-------|-------|--------|
| **claude-3-5-sonnet** | $3 / 1M tokens | $15 / 1M tokens |
| **claude-opus-4** | $15 / 1M tokens | $75 / 1M tokens |

### 6.2 Token Usage per Query

| Query Type | Avg Input Tokens | Avg Output Tokens | Cost |
|-----------|------------------|-------------------|------|
| Simple search ("Find warranty") | 2,000 | 500 | $0.009 |
| Analysis ("Summarize costs") | 3,500 | 800 | $0.015 |
| Multi-doc query ("What's left under warranty?") | 5,000 | 1,200 | $0.024 |
| Complex analysis with chat history | 6,000 | 1,500 | $0.032 |

**Average cost per message: ~$0.015**

### 6.3 Monthly Cost Projections

| Usage Scenario | Messages/Month | Monthly Cost | Notes |
|--------|--------|------|-------|
| **Light user** (5 chats/week) | 20 | $0.30 | Occasional questions |
| **Regular user** (3 chats/day) | 90 | $1.35 | Daily boat management |
| **Power user** (10+ chats/day) | 300 | $4.50 | Professional/dealer |
| **Dealer (50 boats, avg 5 chats/boat/month)** | 250 | $3.75 | Multi-boat support |

**Recommendation:** Budget $10-20/month per active boat, or implement usage tracking with alerts at $50/month threshold.

---

## 7. Implementation Timeline

### Phase 1: Setup (10-15 minutes)
- [ ] Install Anthropic SDK (`npm install @anthropic-ai/sdk`)
- [ ] Obtain API key from console.anthropic.com
- [ ] Add `.env` variables

### Phase 2: Backend Integration (25-30 minutes)
- [ ] Create `services/claude.js` service layer
- [ ] Add database schema (3 new tables)
- [ ] Implement `/api/chat/message` streaming endpoint
- [ ] Implement thread management endpoints
- [ ] Test with cURL/Postman

### Phase 3: Frontend Component (15-20 minutes)
- [ ] Create `ChatBox.vue` component
- [ ] Implement message streaming display
- [ ] Add thread history sidebar
- [ ] Integrate into boat detail view

### Phase 4: Testing & Polish (10-15 minutes)
- [ ] Test chat with real documents
- [ ] Verify document references work
- [ ] Add error handling
- [ ] Monitor token usage

**Total Implementation Time: 45-60 minutes**

---

## 8. Example Conversations

### Example 1: Simple Search

```
User: "What's my engine warranty?"

Claude Response:
Based on your documents, you have a Yanmar diesel engine warranty
that expires on December 15, 2027. This covers parts and labor for
manufacturing defects for the first 5 years of ownership.

References:
- Engine Warranty Card - Uploaded Nov 5, 2025 (PDF)
- Yanmar Warranty Registration - Nov 5, 2025 (PDF)
```

### Example 2: Analysis with Multiple Documents

```
User: "How much have I spent on maintenance this year?"

Claude Response:
Looking at your maintenance records from 2025, you've spent €3,240 total:

- Oil changes (6x): €420
- Engine service (2x): €1,200
- Hull cleaning & inspection (quarterly): €800
- Misc repairs & parts: €820

Your highest expense was the May engine service (€700). You're on
track to spend approximately €3,500-4,000 by year-end if maintenance
continues at this pace.

References:
- Service Invoice - May 15, 2025 (€700)
- Service Invoice - Feb 28, 2025 (€500)
- Maintenance Log - Oct 2025 (€180)
- Fuel & Supply Receipts - Oct 2025 (€120)
```

### Example 3: Warranty Status Summary

```
User: "What equipment is still under warranty?"

Claude Response:
Here's your current warranty status:

ACTIVE WARRANTIES (Unexpired):
✅ Hull & Structure - Expires Sep 2, 2029 (4 years remaining)
✅ Engine (Yanmar) - Expires Dec 15, 2027 (2 years remaining)
✅ Electrical System - Expires Sep 2, 2027 (2 years remaining)
✅ Electronics (Garmin) - Expires Nov 13, 2026 (1 year remaining)
✅ Upholstery (SeaCare) - Expires Nov 13, 2026 (1 year remaining)

EXPIRED WARRANTIES:
❌ Bottom paint - Expired Sep 13, 2024 (you may want to re-paint)

EXPIRING SOON (< 1 year):
⚠️ Garmin electronics - Expires in 11 months
⚠️ SeaCare coverage - Expires in 11 months

References:
- Warranty Card Bundle - Uploaded Sep 2, 2023 (PDF)
- Purchase Agreement - Uploaded Sep 2, 2023 (PDF)
```

---

## 9. Security & Privacy

### 9.1 API Key Security

- Store `ANTHROPIC_API_KEY` in environment variables only
- Never commit to git
- Rotate keys quarterly
- Use system user with limited permissions

### 9.2 Data Privacy

- **Messages are NOT logged to Anthropic** (unless explicitly enabled)
- Local storage: Store chat history in your NaviDocs database only
- No third-party data sharing
- GDPR compliant: Users can request deletion of conversation

### 9.3 Rate Limiting

```javascript
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,              // 30 messages per minute
  message: 'Too many messages, please wait before sending another'
});

app.use('/api/chat', chatRateLimit);
```

### 9.4 Cost Monitoring

```javascript
// Alert if monthly spending exceeds threshold
async function checkMonthlyUsage(boat_id) {
  const thisMonth = new Date();
  thisMonth.setDate(1);

  const usage = await db.get(
    `SELECT SUM(cost_usd) as total_cost
     FROM claude_usage
     WHERE boat_id = ? AND created_at >= ?`,
    [boat_id, thisMonth.toISOString()]
  );

  if (usage.total_cost > 50) {
    // Send alert to owner
    console.warn(`Boat ${boat_id} exceeded $50 monthly Claude budget: $${usage.total_cost}`);
  }
}
```

---

## 10. Troubleshooting

### Issue: Streaming not working

**Symptom:** Chatbox shows "Claude is thinking..." forever

**Solution:**
```javascript
// Ensure streaming header is set BEFORE writing any data
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
// NOT setting Content-Length for streaming
```

### Issue: References not matching documents

**Symptom:** Claude mentions documents, but "References" section is empty

**Solution:**
```javascript
// Improve document matching in claude.js
extractDocumentReferences(response, documents) {
  const references = [];
  const docNames = documents.map(d => d.name.toLowerCase());

  for (const doc of documents) {
    // Better matching: check if doc content is referenced
    if (response.toLowerCase().includes(doc.name.toLowerCase()) ||
        response.includes(doc.id.toString())) {
      references.push({...doc});
    }
  }
  return references;
}
```

### Issue: High token usage

**Symptom:** Each message costs $0.50+ instead of $0.02

**Solution:**
```javascript
// Reduce document context sent to Claude
buildSystemPrompt(boat_id, boatName, documents) {
  // Only include last 10 documents, not all
  const recentDocs = documents.slice(-10);
  // Use shorter summaries
  const summary = recentDocs.map(d => `${d.name} (${d.type})`).join(', ');
  // Return shorter system prompt
}
```

---

## 11. Integration Checklist

- [ ] Anthropic API key obtained
- [ ] `.env` file updated with ANTHROPIC_API_KEY
- [ ] Anthropic SDK installed: `npm install @anthropic-ai/sdk`
- [ ] Database schema created (3 new tables)
- [ ] Backend service (`services/claude.js`) implemented
- [ ] Express.js endpoints created (`/api/chat/message`, `/api/chat/threads/*`)
- [ ] Streaming response tested with cURL
- [ ] Vue 3 ChatBox component created
- [ ] Component integrated into boat detail view
- [ ] Message streaming verified in browser
- [ ] Document references tested
- [ ] Chat history persistence tested
- [ ] Error handling for API failures
- [ ] Rate limiting configured
- [ ] Cost monitoring alerts set up
- [ ] User guide written
- [ ] Privacy policy updated
- [ ] Load testing: 10+ concurrent chats

---

## 12. Advanced: Custom Instructions per Boat

Allow boat owners to set custom context:

```javascript
// Store custom instructions per boat
CREATE TABLE boat_claude_instructions (
  id INTEGER PRIMARY KEY,
  boat_id INTEGER NOT NULL,
  instructions TEXT,
  FOREIGN KEY (boat_id) REFERENCES boats(id)
);

// Example instructions:
// "I have a Jeanneau Prestige 420. The engine is a Yanmar 6LPA-STP2
//  diesel. I do most repairs myself. I'm most concerned about warranty
//  coverage and seasonal maintenance."

// Then include in system prompt:
buildSystemPrompt(boat_id, boatName, documents) {
  const boatInstructions = await db.get(
    'SELECT instructions FROM boat_claude_instructions WHERE boat_id = ?',
    [boat_id]
  );

  if (boatInstructions) {
    systemPrompt += `\n\nBOAT OWNER PREFERENCES:\n${boatInstructions.instructions}`;
  }

  return systemPrompt;
}
```

---

## Next Steps

1. **Obtain Anthropic API key** (free tier available)
2. **Install SDK:** `npm install @anthropic-ai/sdk`
3. **Implement backend** (25-30 min)
4. **Create frontend component** (15-20 min)
5. **Test end-to-end** (10-15 min)
6. **Deploy and monitor costs**

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Author:** NaviDocs Integration Team
**Status:** Ready for Development
