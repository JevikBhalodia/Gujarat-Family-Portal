import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { X, Send, Bot, User, ThumbsUp, ArrowUpRight } from 'lucide-react';

export function ChatPanel({ isOpen, onClose, schemeId, schemeName, departmentName }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [escalatingId, setEscalatingId] = useState(null);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQ = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: userQ }]);
    setLoading(true);

    try {
      const data = await apiRequest('/queries/chat', {
        method: 'POST',
        body: { scheme_id: schemeId, question: userQ }
      });

      setMessages((prev) => [
        ...prev,
        {
          id: data.queryId || Date.now() + 1,
          queryId: data.queryId,
          sender: 'bot',
          text: data.botAnswer,
          canEscalate: true,
          escalated: false,
          feedbackGiven: false
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Error consulting assistant. Please try again.',
          canEscalate: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async (msgId, queryId) => {
    if (!queryId) return;
    setEscalatingId(queryId);
    try {
      await apiRequest(`/queries/${queryId}/escalate`, { method: 'POST' });
      showToast(t('toast.querySent'));

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, escalated: true } : m
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to send to department.');
    } finally {
      setEscalatingId(null);
    }
  };

  const handleHelpful = (msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: true } : m))
    );
    showToast('Feedback recorded');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[1px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-title"
    >
      <div className="w-full sm:w-[360px] h-full bg-surface border-l border-line p-5 flex flex-col justify-between shadow-2xl focus:outline-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 id="chat-title" className="text-sm font-bold text-ink truncate max-w-[220px]">
                {t('chat.title')}
              </h2>
              <p className="text-[11px] text-muted truncate max-w-[220px]">
                {schemeName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-[8px] text-muted hover:text-ink hover:bg-indigo-50"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
          {messages.length === 0 && (
            <div className="p-4 rounded-[8px] bg-salt text-muted text-center space-y-1">
              <p>{t('chat.botDefaultIntro')}</p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col space-y-1.5 ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 rounded-[12px] max-w-[88%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo text-white rounded-br-none'
                    : 'bg-salt text-ink border border-line rounded-bl-none'
                }`}
              >
                {m.text}
              </div>

              {/* Bot reply utilities */}
              {m.sender === 'bot' && (
                <div className="flex flex-col space-y-1 pl-1 text-[11px] text-muted">
                  {!m.feedbackGiven ? (
                    <button
                      type="button"
                      onClick={() => handleHelpful(m.id)}
                      className="flex items-center space-x-1 text-muted hover:text-indigo transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{t('chat.wasHelpful')}</span>
                    </button>
                  ) : (
                    <span className="text-green">✓ Feedback noted</span>
                  )}

                  {/* Send to department action button */}
                  {m.canEscalate && !m.escalated && (
                    <button
                      type="button"
                      disabled={escalatingId === m.queryId}
                      onClick={() => handleEscalate(m.id, m.queryId)}
                      className="flex items-center space-x-1 text-indigo font-medium hover:underline pt-0.5 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{t('chat.sendToDept')}</span>
                    </button>
                  )}

                  {/* Escalation Confirmation */}
                  {m.escalated && (
                    <div className="p-2 rounded-[6px] bg-[#EBF5F0] text-green border border-[#B2D8C3] text-[10px] mt-1">
                      {t('chat.sentConfirmation', { dept: departmentName || 'department' })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-muted italic text-xs pl-1">
              <Bot className="w-4 h-4 animate-spin text-indigo" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="pt-3 border-t border-line flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 min-h-[40px] px-3 py-2 text-xs text-ink bg-surface border border-line rounded-[8px] focus:outline-none focus:border-indigo"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="min-h-[40px] px-3 bg-indigo hover:opacity-95 disabled:opacity-50 text-white rounded-[8px] flex items-center justify-center transition-opacity"
            aria-label={t('chat.send')}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
