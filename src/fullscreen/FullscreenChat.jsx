import { useState, useEffect, useCallback, useRef } from 'react';
import '../../../style/chat.css';

const FULLSCREEN_EVENTS = {
  TOKEN: 'llm-fullscreen:token',
  OPEN: 'llm-fullscreen:open',
  CLOSE: 'llm-fullscreen:close',
  TOGGLE: 'llm-fullscreen:toggle',
};

// Fallback models if API fails
const FALLBACK_MODELS = [
  { name: 'gpt-4-turbo', provider: 'openai', context_window: 128000 },
  { name: 'gpt-3.5-turbo', provider: 'openai', context_window: 16000 },
];

const DEFAULT_SETTINGS = {
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  systemPrompt: '',
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

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [conversationSettings, setConversationSettings] = useState({}); // per-conversation settings
  const [availableModels, setAvailableModels] = useState(FALLBACK_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

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

  // Load conversations, token balance and models on open
  useEffect(() => {
    if (isOpen && currentToken) {
      loadConversations();
      loadTokenBalance();
      loadModels();
    }
  }, [isOpen, currentToken]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/models`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setAvailableModels(data);
          // Update default model if current one is not available
          const modelNames = data.map(m => m.name);
          if (!modelNames.includes(settings.model)) {
            setSettings(prev => ({ ...prev, model: data[0].name }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load models:', err);
      // Keep using fallback models
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const loadTokenBalance = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/users/me/tokens`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTokenBalance(data);
      }
    } catch (err) {
      console.error('Failed to load token balance:', err);
    }
  };

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
        const dialogs = data.dialogs || [];
        setConversations(dialogs);

        // Store conversation settings
        const convSettings = {};
        dialogs.forEach(d => {
          convSettings[d.id] = {
            model: d.model_name || DEFAULT_SETTINGS.model,
            systemPrompt: d.system_prompt || '',
            ...d.agent_config,
          };
        });
        setConversationSettings(convSettings);

        if (dialogs.length > 0 && !activeConversationId) {
          selectConversation(dialogs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (dialogId) => {
    if (messages[dialogId]) return;

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
    // Load conversation-specific settings
    if (conversationSettings[id]) {
      setSettings(prev => ({
        ...prev,
        model: conversationSettings[id].model || prev.model,
        systemPrompt: conversationSettings[id].systemPrompt || '',
        temperature: conversationSettings[id].temperature ?? prev.temperature,
        maxTokens: conversationSettings[id].max_tokens ?? prev.maxTokens,
        topP: conversationSettings[id].top_p ?? prev.topP,
      }));
    }
  }, [conversationSettings]);

  const createNewConversation = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/dialogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          title: 'New Chat',
          model_name: settings.model,
          system_prompt: settings.systemPrompt || undefined,
          agent_config: {
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
            top_p: settings.topP,
          },
        }),
      });

      if (response.ok) {
        const newConv = await response.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages((prev) => ({ ...prev, [newConv.id]: [] }));
        setConversationSettings(prev => ({
          ...prev,
          [newConv.id]: {
            model: settings.model,
            systemPrompt: settings.systemPrompt,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
            top_p: settings.topP,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      // Fallback to temp conversation
      const tempId = `temp-${Date.now()}`;
      const newConv = {
        id: tempId,
        title: 'New Chat',
        created_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(tempId);
      setMessages((prev) => ({ ...prev, [tempId]: [] }));
    }
  };

  const deleteConversation = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/dialogs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok || id.startsWith('temp-')) {
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

    let currentConvId = activeConversationId;

    // If no active conversation, create one via API
    if (!activeConversationId) {
      try {
        const response = await fetch(`${apiUrl}/api/v1/dialogs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
            model_name: settings.model,
            system_prompt: settings.systemPrompt || undefined,
            agent_config: {
              temperature: settings.temperature,
              max_tokens: settings.maxTokens,
              top_p: settings.topP,
            },
          }),
        });

        if (response.ok) {
          const newConv = await response.json();
          currentConvId = newConv.id;
          setConversations((prev) => [newConv, ...prev]);
          setActiveConversationId(currentConvId);
        }
      } catch (err) {
        console.error('Failed to create conversation:', err);
        currentConvId = `temp-${Date.now()}`;
        const newConv = {
          id: currentConvId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          created_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(currentConvId);
      }
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
      // Use the dialog messages endpoint for streaming
      const response = await fetch(`${apiUrl}/api/v1/dialogs/${currentConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          content: content,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';
      let promptTokens = 0;
      let completionTokens = 0;

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

              // Handle streaming response
              const content = parsed.content || parsed.choices?.[0]?.delta?.content || '';
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

              // Capture token usage
              if (parsed.done) {
                promptTokens = parsed.prompt_tokens || 0;
                completionTokens = parsed.completion_tokens || 0;
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }

      // Update token balance after message
      if (promptTokens || completionTokens) {
        setTokenBalance(prev => prev ? {
          ...prev,
          balance: prev.balance - promptTokens - completionTokens,
          total_used: prev.total_used + promptTokens + completionTokens,
        } : prev);
      }

      // Refresh token balance from server
      loadTokenBalance();

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
    setShowSettings(false);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const currentMessages = messages[activeConversationId] || [];
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentModel = availableModels.find(m => m.name === settings.model);

  // Helper to format context window
  const formatContext = (contextWindow) => {
    if (!contextWindow) return '';
    if (contextWindow >= 1000000) return `${Math.round(contextWindow / 1000000)}M`;
    if (contextWindow >= 1000) return `${Math.round(contextWindow / 1000)}k`;
    return contextWindow.toString();
  };

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
              {/* Token balance display */}
              {tokenBalance && (
                <div className="llm-chat-token-balance" title="Token balance">
                  <span className="llm-chat-token-icon">🪙</span>
                  <span>{tokenBalance.balance?.toLocaleString() || 0}</span>
                </div>
              )}
              {/* Current model indicator */}
              <div className="llm-chat-model-indicator" title={`Model: ${currentModel?.name || settings.model}`}>
                <span className="llm-chat-model-icon">🤖</span>
                <span>{currentModel?.name || settings.model}</span>
                {currentModel?.context_window && (
                  <span className="llm-chat-model-context">({formatContext(currentModel.context_window)})</span>
                )}
              </div>
              {/* Settings button */}
              <button
                className="llm-chat-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                ⚙️
              </button>
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
                        {conv.model_name && <span className="llm-chat-conv-model">{conv.model_name}</span>}
                        <span>{new Date(conv.created_at).toLocaleDateString()}</span>
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

          {/* Settings panel */}
          {showSettings && (
            <div className="llm-chat-settings-panel">
              <div className="llm-chat-settings-header">
                <h3>Settings</h3>
                <button onClick={() => setShowSettings(false)}>✕</button>
              </div>

              <div className="llm-chat-settings-content">
                {/* Model selection */}
                <div className="llm-chat-setting-group">
                  <label>
                    Model
                    {isLoadingModels && <span className="llm-chat-setting-hint">(loading...)</span>}
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) => updateSetting('model', e.target.value)}
                    disabled={isLoadingModels}
                  >
                    {availableModels.map(model => (
                      <option key={model.name} value={model.name}>
                        {model.name} ({formatContext(model.context_window)}) - {model.provider}
                      </option>
                    ))}
                  </select>
                  {currentModel && (
                    <div className="llm-chat-model-info">
                      <span>Provider: {currentModel.provider}</span>
                      {currentModel.cost_per_1k_prompt_tokens && (
                        <span>Cost: ${currentModel.cost_per_1k_prompt_tokens}/1k in, ${currentModel.cost_per_1k_completion_tokens}/1k out</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Temperature */}
                <div className="llm-chat-setting-group">
                  <label>
                    Temperature: {settings.temperature}
                    <span className="llm-chat-setting-hint">
                      (0 = precise, 1 = creative)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  />
                </div>

                {/* Max tokens */}
                <div className="llm-chat-setting-group">
                  <label>
                    Max Tokens: {settings.maxTokens}
                    <span className="llm-chat-setting-hint">
                      (max response length)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="16384"
                    step="256"
                    value={settings.maxTokens}
                    onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                  />
                </div>

                {/* Top P */}
                <div className="llm-chat-setting-group">
                  <label>
                    Top P: {settings.topP}
                    <span className="llm-chat-setting-hint">
                      (nucleus sampling)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.topP}
                    onChange={(e) => updateSetting('topP', parseFloat(e.target.value))}
                  />
                </div>

                {/* System prompt */}
                <div className="llm-chat-setting-group">
                  <label>
                    System Prompt
                    <span className="llm-chat-setting-hint">
                      (instructions for the AI)
                    </span>
                  </label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                    placeholder="You are a helpful assistant..."
                    rows={4}
                  />
                </div>

                {/* Token usage info */}
                {tokenBalance && (
                  <div className="llm-chat-token-info">
                    <h4>Token Usage</h4>
                    <div className="llm-chat-token-stats">
                      <div>
                        <span>Balance:</span>
                        <strong>{tokenBalance.balance?.toLocaleString() || 0}</strong>
                      </div>
                      <div>
                        <span>Used:</span>
                        <strong>{tokenBalance.total_used?.toLocaleString() || 0}</strong>
                      </div>
                      {tokenBalance.limit && (
                        <div>
                          <span>Limit:</span>
                          <strong>{tokenBalance.limit?.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main chat area */}
          <main className="llm-chat-main">
            <div className="llm-chat-messages">
              {currentMessages.length === 0 ? (
                <div className="llm-chat-message llm-chat-message-system">
                  <div className="llm-chat-welcome">
                    <h3>Welcome to LLM Chat</h3>
                    <p>Select a model and start chatting. Current model: <strong>{currentModel?.name || settings.model}</strong></p>
                    <p>Use ⚙️ to configure settings like temperature and system prompt.</p>
                  </div>
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
                      {msg.prompt_tokens && (
                        <span className="llm-chat-tokens-used">
                          {msg.prompt_tokens + msg.completion_tokens} tokens
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="llm-chat-input-area">
              {error && <div className="llm-chat-error-banner">{error}</div>}
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
                  {isStreaming ? '⏹ Stop' : '➤ Send'}
                </button>
              </div>
              <div className="llm-chat-footer-row">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span className="llm-chat-model-hint">{currentModel?.name || settings.model}</span>
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
