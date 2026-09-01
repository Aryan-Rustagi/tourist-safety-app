import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, AlertCircle, Bot, User, Loader2, Siren, X, MessageCircle } from 'lucide-react';
import api from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning_details?: unknown;
}

interface Coords {
  lat: number | null;
  lng: number | null;
}

export const SafetyChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your AI Safety Assistant. I can provide emergency guidance, first-aid instructions, and safety information tailored to your current location. How can I help you?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [coords, setCoords] = useState<Coords>({ lat: null, lng: null });
  const [locationError, setLocationError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Location denied.'),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages
      .filter(m => m.id !== 'welcome' && !m.id.startsWith('err-'))
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: text.trim() });

    try {
      const res = await api.post('/ai/chat', {
        message: text.trim(),
        history,
        lat: coords.lat,
        lng: coords.lng,
      });

      const reply = res.data.reply || 'I could not generate a response. Please try again.';
      const isFallback = reply === 'AI is temporarily offline. Please call 112 for emergencies.';

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: isFallback ? `🚨 **CRITICAL ALERT**\n\n${reply}` : reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Unable to reach the AI server. Please check your connection or call **112** for emergencies.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEmergencyHelp = () => {
    const locStr =
      coords.lat && coords.lng
        ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        : 'unknown location';
    sendMessage(
      `I need emergency help. I am at coordinates ${locStr}. Please give me immediate instructions.`
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const gpsLabel = coords.lat
    ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng?.toFixed(4)}`
    : locationError || 'Acquiring GPS…';

  return (
    <>
      {/* ── FAB Toggle ── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`chat-fab${isOpen ? ' chat-hidden' : ''}`}
        aria-label="Open AI Safety Assistant"
        id="chatbot-open-btn"
        type="button"
      >
        <MessageCircle size={22} />
      </button>

      {/* ── Chat Panel ── */}
      <div className={`chat-panel${isOpen ? '' : ' chat-hidden'}`} role="dialog" aria-label="Safety Assistant Chat">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-avatar">
            <Bot size={18} color="white" />
            <span className="chat-header-status" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="chat-header-name">Safety Assistant</div>
            <div className="chat-header-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {locationError && <AlertCircle size={11} color="#FBBF24" />}
              <span className="truncate">{gpsLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="chat-close-btn"
            aria-label="Close Chat"
            id="chatbot-close-btn"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}
            >
              {/* Avatar */}
              <div className={`chat-msg-avatar ${msg.role === 'user' ? 'chat-msg-avatar-user' : 'chat-msg-avatar-ai'}`}>
                {msg.role === 'user'
                  ? <User size={14} />
                  : <Bot size={14} />
                }
              </div>

              {/* Bubble */}
              <div>
                <div className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-msg-bubble-user' : 'chat-msg-bubble-ai'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="chat-md">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p>{children}</p>,
                          ul: ({ children }) => <ul>{children}</ul>,
                          ol: ({ children }) => <ol>{children}</ol>,
                          strong: ({ children }) => <strong>{children}</strong>,
                          code: ({ children }) => <code>{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <p className={`chat-msg-time ${msg.role === 'user' ? 'chat-msg-time-user' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-msg chat-msg-ai">
              <div className="chat-msg-avatar chat-msg-avatar-ai">
                <Bot size={14} />
              </div>
              <div className="chat-msg-bubble chat-msg-bubble-ai chat-typing-dots">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Emergency button */}
        <div className="chat-emergency-bar">
          <button
            onClick={handleEmergencyHelp}
            disabled={isTyping}
            className="chat-emergency-btn"
            id="chatbot-emergency-btn"
            type="button"
          >
            <Siren size={14} />
            Emergency Help Now
          </button>
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about safety, routes, first aid…"
            rows={1}
            disabled={isTyping}
            className="chat-textarea"
            id="chatbot-input"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="chat-send-btn"
            aria-label="Send message"
            id="chatbot-send-btn"
            type="button"
          >
            {isTyping ? <Loader2 size={16} style={{ animation: 'none' }} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </>
  );
};
