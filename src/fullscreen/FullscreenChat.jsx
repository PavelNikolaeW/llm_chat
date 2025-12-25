import { useState, useEffect, useCallback, useRef } from 'react';
import '../../../style/chat.css';

const FULLSCREEN_EVENTS = {
  TOKEN: 'llm-fullscreen:token',
  OPEN: 'llm-fullscreen:open',
  CLOSE: 'llm-fullscreen:close',
  TOGGLE: 'llm-fullscreen:toggle',
};

function FullscreenChat({ apiUrl, token: initialToken, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState(initialToken);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Event handlers for external API
  useEffect(() => {
    const handleTokenUpdate = (e) => setCurrentToken(e.detail);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
      setIsOpen(false);
      onClose?.();
    };
    const handleToggle = () => {
      setIsOpen((prev) => {
        const newState = !prev;
        if (!newState) onClose?.();
        return newState;
      });
    };

    window.addEventListener(FULLSCREEN_EVENTS.TOKEN, handleTokenUpdate);
    window.addEventListener(FULLSCREEN_EVENTS.OPEN, handleOpen);
    window.addEventListener(FULLSCREEN_EVENTS.CLOSE, handleClose);
    window.addEventListener(FULLSCREEN_EVENTS.TOGGLE, handleToggle);

    return () => {
      window.removeEventListener(FULLSCREEN_EVENTS.TOKEN, handleTokenUpdate);
      window.removeEventListener(FULLSCREEN_EVENTS.OPEN, handleOpen);
      window.removeEventListener(FULLSCREEN_EVENTS.CLOSE, handleClose);
      window.removeEventListener(FULLSCREEN_EVENTS.TOGGLE, handleToggle);
    };
  }, [onClose]);

  // Load conversations on open
  useEffect(() => {
    if (isOpen && currentToken) {
      loadConversations();
    }
  }, [isOpen, currentToken]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/dialogs`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.dialogs || []);
        // If there are conversations, load the first one
        if (data.dialogs?.length > 0 && !activeConversationId) {
          selectConversation(data.dialogs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (dialogId) => {
    if (messages[dialogId]) return; // Already loaded

    try {
      const response = await fetch(`${apiUrl}/api/v1/dialogs/${dialogId}/messages`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => ({
          ...prev,
          [dialogId]: data.messages || [],
        }));
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
    loadMessages(id);
  }, []);

  const createNewConversation = async () => {
    const tempId = `temp-${Date.now()}`;
    const newConv = {
      id: tempId,
      title: 'New Chat',
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(tempId);
    setMessages((prev) => ({ ...prev, [tempId]: [] }));
  };

  const deleteConversation = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/dialogs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          if (remaining.length > 0) {
            selectConversation(remaining[0].id);
          } else {
            setActiveConversationId(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const sendMessage = async () => {
    const content = inputValue.trim();
    if (!content || isStreaming) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content,
      created_at: new Date().toISOString(),
    };

    const assistantMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    const currentConvId = activeConversationId || `temp-${Date.now()}`;

    // If no active conversation, create one
    if (!activeConversationId) {
      const newConv = {
        id: currentConvId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        created_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(currentConvId);
    }

    setMessages((prev) => ({
      ...prev,
      [currentConvId]: [...(prev[currentConvId] || []), userMessage, assistantMessage],
    }));
    setInputValue('');
    setIsStreaming(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const currentMessages = messages[currentConvId] || [];
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [...currentMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          dialog_id: currentConvId.startsWith('temp-') ? null : currentConvId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';
      let newDialogId = currentConvId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              // Check for dialog_id in response (for new conversations)
              if (parsed.dialog_id && currentConvId.startsWith('temp-')) {
                newDialogId = parsed.dialog_id;
              }

              const content = parsed.choices?.[0]?.delta?.content || parsed.delta?.text || '';
              if (content) {
                accumulatedContent += content;
                setMessages((prev) => ({
                  ...prev,
                  [currentConvId]: (prev[currentConvId] || []).map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ),
                }));
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }

      // Update conversation with real ID if it was a temp conversation
      if (newDialogId !== currentConvId) {
        setConversations((prev) =>
          prev.map((c) => (c.id === currentConvId ? { ...c, id: newDialogId } : c))
        );
        setMessages((prev) => {
          const { [currentConvId]: msgs, ...rest } = prev;
          return { ...rest, [newDialogId]: msgs };
        });
        setActiveConversationId(newDialogId);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;

      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);

      setMessages((prev) => ({
        ...prev,
        [currentConvId]: (prev[currentConvId] || []).map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: 'Sorry, an error occurred. Please try again.', error: true }
            : msg
        ),
      }));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentMessages = messages[activeConversationId] || [];
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  if (!isOpen) return null;

  return (
    <>
      <div className="llm-chat-overlay open" onClick={handleClose} />
      <div className="llm-chat-container open">
        <header className="llm-chat-header">
          <div className="llm-chat-header-top">
            <span className="llm-chat-title">
              {activeConversation?.title || 'New Chat'}
            </span>
            <div className="llm-chat-header-right">
              <button className="llm-chat-close-btn" onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>
        </header>

        <div className="llm-chat-body">
          {/* Sidebar with conversation history */}
          <aside className="llm-chat-sidebar">
            <div className="llm-chat-sidebar-header">
              <span>History</span>
              <button className="llm-chat-newchat-btn" onClick={createNewConversation}>
                + New
              </button>
            </div>
            <div className="llm-chat-conversation-list">
              {isLoadingConversations ? (
                <div style={{ padding: '12px', color: '#9ca3af' }}>Loading...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '12px', color: '#9ca3af' }}>No conversations</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`llm-chat-conversation-item ${
                      conv.id === activeConversationId ? 'active' : ''
                    }`}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <div>
                      <div className="llm-chat-conversation-title">
                        {conv.title || 'Untitled'}
                      </div>
                      <div className="llm-chat-conversation-meta">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="llm-chat-conv-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Main chat area */}
          <main className="llm-chat-main">
            <div className="llm-chat-messages">
              {currentMessages.length === 0 ? (
                <div className="llm-chat-message llm-chat-message-system">
                  Start a new conversation by typing a message below
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`llm-chat-message llm-chat-message-${msg.role} ${
                      msg.error ? 'llm-chat-error' : ''
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    <div className="llm-chat-message-meta">
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="llm-chat-input-area">
              {error && <div className="llm-chat-error">{error}</div>}
              <div className="llm-chat-input-row">
                <textarea
                  ref={textareaRef}
                  className="llm-chat-textarea"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
                  disabled={isStreaming}
                  rows={2}
                />
                <button
                  className="llm-chat-send-btn"
                  onClick={sendMessage}
                  disabled={isStreaming || !inputValue.trim()}
                >
                  {isStreaming ? 'Stop' : 'Send'}
                </button>
              </div>
              <div className="llm-chat-footer-row">
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// Simple markdown-like formatting
function formatMessage(content) {
  if (!content) return '';
  // Escape HTML first
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

export default FullscreenChat;
export { FULLSCREEN_EVENTS };
