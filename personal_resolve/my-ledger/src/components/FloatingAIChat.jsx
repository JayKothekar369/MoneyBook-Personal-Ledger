import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, BrainCircuit, X, MessageSquare, Sparkles } from 'lucide-react';

export default function FloatingAIChat({ user, transactions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hi ${user?.name || 'there'}! I am MoneyBook AI. Ask me anything about your balances or expenses!`, sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
    "Total expense this month?",
    "Who owes me money?",
    "Show highest category",
    "Net savings summary"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping pointer-events-none"></div>
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="glass-panel w-[90vw] sm:w-[400px] h-[500px] rounded-3xl flex flex-col overflow-hidden border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in">
          {/* Header */}
          <div className="bg-slate-900/90 px-5 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">MoneyBook Copilot</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-medium">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-950/20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 shadow-inner ${
                    msg.sender === 'user' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 border border-slate-700 text-cyan-400'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4.5 h-4.5" />}
                  </div>

                  <div className={`p-3 rounded-2xl text-xs leading-relaxed font-medium shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-sm'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-2.5 flex-row">
                  <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 shadow-inner bg-slate-800 border border-slate-700 text-cyan-400">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 rounded-tl-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt chips */}
          <div className="px-4 py-2 border-t border-slate-800/40 bg-slate-900/40 overflow-x-auto flex gap-1.5 hide-scroll-bar">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(null, sug)}
                className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/10 hover:bg-cyan-500/10 transition-colors whitespace-nowrap"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form onSubmit={(e) => handleSend(e)} className="p-3.5 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 glass-input rounded-full px-4 py-2 focus:outline-none text-white placeholder:text-slate-500 text-xs font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
