import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Send, Bot, User, AlertTriangle, CheckCircle } from 'lucide-react';

export function ChatWidget({ schemeId, schemeName }) {
  const { t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQueryId, setCurrentQueryId] = useState(null);
  const [escalated, setEscalated] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQ = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setLoading(true);
    setEscalated(false);

    try {
      const data = await apiRequest('/queries/chat', {
        method: 'POST',
        body: { scheme_id: schemeId, question: userQ }
      });

      setCurrentQueryId(data.queryId);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.botAnswer,
          canEscalate: data.canEscalate
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error contacting scheme assistant. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!currentQueryId) return;
    try {
      await apiRequest(`/queries/${currentQueryId}/escalate`, { method: 'POST' });
      setEscalated(true);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: '✓ Query officially escalated to the Department Officer inbox. You will receive a response in your Applications / Queries tab.'
        }
      ]);
    } catch (err) {
      alert(err.message || 'Failed to escalate query');
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-[340px]">
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-700">
        <Bot className="w-4 h-4 text-sky-600" />
        <span>Scheme Assistant ({schemeName})</span>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
        {messages.length === 0 && (
          <p className="text-slate-400 text-center py-8">
            Ask any question regarding scheme rules, documents, or benefits. The assistant will answer from verified government guidelines.
          </p>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none'
                  : m.sender === 'system'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 w-full'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-400 italic text-[11px]">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            <span>Consulting scheme documentation...</span>
          </div>
        )}
      </div>

      {/* Escalation bar */}
      {currentQueryId && !escalated && (
        <div className="py-2 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleEscalate}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{t('raiseToAuthority')}</span>
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('askBot') + '...'}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="p-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

export default ChatWidget;
