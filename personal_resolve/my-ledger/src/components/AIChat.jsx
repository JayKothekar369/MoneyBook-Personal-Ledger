import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, TrendingUp, Search, BrainCircuit } from 'lucide-react';

export default function AIChat({ user, transactions }) {
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello ${user?.name || 'there'}! I am your AI Financial Assistant. How can I help you today?`, sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e, textOverride) => {
    if (e) e.preventDefault();
    const query = textOverride || input;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), text: query, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userData: { ...user, transactions } })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.response || "I couldn't process that. Please try again.",
        sender: 'ai'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Error connecting to AI service.",
        sender: 'ai'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "How much did I spend this month?",
    "Who still has to pay me?",
    "Show highest expense category",
    "How much have I invested?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)]">
      
      {/* Header section done in App.jsx routing, but we can add an AI specific banner */}
      <div className="glass-panel p-6 rounded-[2rem] mb-6 relative overflow-hidden shrink-0 border-indigo-500/30 glow-text flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
            Ask MoneyBook AI
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Get smart insights on your transactions and balances.</p>
        </div>
      </div>

      <div className="glass-panel flex-1 rounded-[2rem] flex flex-col relative overflow-hidden border border-slate-700/50">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-inner ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 border border-slate-600 text-indigo-400'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`p-4 rounded-2xl shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm'
                }`}>
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] gap-3 flex-row">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-inner bg-slate-800 border border-slate-600 text-indigo-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl shadow-lg bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 md:px-6 pb-2 pt-2 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scroll-bar">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(null, sug)}
                className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors whitespace-nowrap"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={(e) => handleSend(e)} className="p-4 md:p-6 bg-slate-900/80 border-t border-slate-800">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask anything about your finances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full glass-input rounded-full pl-6 pr-14 py-3.5 focus:outline-none text-white shadow-inner placeholder:text-slate-500 text-sm font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(99,102,241,0.3)]"
            >
              <Send className="w-4 h-4 ml-0.5 mt-0.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
