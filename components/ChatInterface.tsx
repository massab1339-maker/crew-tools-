
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Content } from "@google/genai";
import { Send, Menu, X, Plus, MessageSquare, History, Search, ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import { createChatSession, sendMessageStream } from '../services/geminiService';
import { Message, ChatSessionRecord } from '../types';
import { WELCOME_MESSAGE } from '../constants';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SuggestedPrompts from './SuggestedPrompts';

interface ChatInterfaceProps {
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: WELCOME_MESSAGE }
  ]);
  const [chatHistory, setChatHistory] = useState<ChatSessionRecord[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('creo-chat-history');
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    setChatSession(createChatSession());
  }, []);

  // Sync state with localStorage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('creo-chat-history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
    }
  };

  const saveCurrentChatState = useCallback((currentMessages: Message[], currentId: string | null) => {
    if (currentMessages.length <= 1) return currentId;

    const firstUserMessage = currentMessages.find(m => m.role === 'user');
    const title = firstUserMessage 
      ? (firstUserMessage.text.length > 30 ? firstUserMessage.text.substring(0, 30) + '...' : firstUserMessage.text)
      : 'New Strategy';

    const idToUse = currentId || Date.now().toString();
    
    const newHistoryItem: ChatSessionRecord = {
      id: idToUse,
      title,
      messages: [...currentMessages],
      createdAt: Date.now(),
    };

    setChatHistory(prev => {
      const filtered = prev.filter(item => item.id !== idToUse);
      const newHistory = [newHistoryItem, ...filtered];
      // Sync immediately to localStorage to prevent data loss on page reload
      localStorage.setItem('creo-chat-history', JSON.stringify(newHistory));
      return newHistory;
    });

    return idToUse;
  }, []);

  const handleSend = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !chatSession || isLoading) return;

    setInput('');
    if (textAreaRef.current) textAreaRef.current.style.height = 'auto';

    const userMessageId = Date.now().toString();
    const newUserMessages: Message[] = [
      ...messages,
      { id: userMessageId, role: 'user', text: textToSend }
    ];
    setMessages(newUserMessages);
    setIsLoading(true);

    try {
      const streamResult = await sendMessageStream(chatSession, textToSend);
      
      const modelMessageId = (Date.now() + 1).toString();
      let fullText = '';
      let lastUpdateTime = 0;
      
      setMessages(prev => [
        ...prev,
        { id: modelMessageId, role: 'model', text: '', isStreaming: true }
      ]);

      for await (const chunk of streamResult) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          const now = Date.now();
          if (now - lastUpdateTime > 75) {
             setMessages(prev => 
              prev.map(msg => msg.id === modelMessageId ? { ...msg, text: fullText } : msg)
            );
            lastUpdateTime = now;
          }
        }
      }
      
      const finalMessages: Message[] = newUserMessages.concat([
        { id: modelMessageId, role: 'model', text: fullText, isStreaming: false }
      ]);

      setMessages(finalMessages);
      
      const savedId = saveCurrentChatState(finalMessages, activeChatId);
      if (!activeChatId) setActiveChatId(savedId);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [chatSession, input, isLoading, messages, activeChatId, saveCurrentChatState]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    if (messages.length > 1) {
      saveCurrentChatState(messages, activeChatId);
    }
    
    setChatSession(createChatSession());
    setMessages([{ id: Date.now().toString(), role: 'model', text: WELCOME_MESSAGE }]);
    setActiveChatId(null);
    setIsSidebarOpen(false);
  };

  const loadChatHistory = (record: ChatSessionRecord) => {
    if (messages.length > 1 && activeChatId !== record.id) {
       saveCurrentChatState(messages, activeChatId); 
    }

    setMessages(record.messages);
    setActiveChatId(record.id);
    
    const historyContent: Content[] = record.messages
      .filter(m => m.id !== 'welcome' && !m.id.startsWith('welcome'))
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

    setChatSession(createChatSession(historyContent));
    setIsSidebarOpen(false);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this search history?')) {
      const newHistory = chatHistory.filter(item => item.id !== id);
      setChatHistory(newHistory);
      localStorage.setItem('creo-chat-history', JSON.stringify(newHistory));
      
      if (activeChatId === id) {
        setMessages([{ id: 'welcome-' + Date.now(), role: 'model', text: WELCOME_MESSAGE }]);
        setActiveChatId(null);
        setChatSession(createChatSession());
      }
    }
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Clear ALL chat history? This cannot be undone.')) {
      setChatHistory([]);
      localStorage.removeItem('creo-chat-history');
      setMessages([{ id: 'welcome-' + Date.now(), role: 'model', text: WELCOME_MESSAGE }]);
      setActiveChatId(null);
      setChatSession(createChatSession());
      setIsSidebarOpen(false);
    }
  };

  const filteredHistory = chatHistory.filter(session => 
    session.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:relative z-30 w-72 h-full bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500" title="Back to Menu">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                    SocialStrategist
                </h1>
            </div>
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1 text-slate-500 hover:bg-slate-100 rounded"
            >
                <X size={20} />
            </button>
        </div>
        
        <div className="p-4 space-y-3">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl transition-all shadow-sm font-bold active:scale-95"
          >
            <Plus size={18} />
            New Strategy
          </button>

          {chatHistory.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {chatHistory.length > 0 && (
            <div className="mb-6">
              <div className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><History size={12} /> Recent Searches</span>
              </div>
              <div className="space-y-1">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <div key={item.id} className="group relative flex items-center gap-1 pr-1">
                      <button
                        onClick={() => loadChatHistory(item)}
                        className={`flex-1 text-left p-2.5 rounded-xl transition-all text-sm truncate flex items-center gap-3 ${
                          activeChatId === item.id 
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm' 
                            : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                        }`}
                      >
                        <MessageSquare size={14} className={`flex-shrink-0 ${activeChatId === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.title}</span>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteHistory(e, item.id)}
                        className={`p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 group-hover:opacity-100 ${activeChatId === item.id ? 'opacity-100' : ''}`}
                        title="Delete strategy"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 italic px-4 py-2">No matching strategies</div>
                )}
              </div>
            </div>
          )}

          {chatHistory.length > 0 && (
            <div className="px-2 mb-4">
              <button 
                onClick={clearAllHistory}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-dashed border-slate-200 bg-white"
              >
                <Trash2 size={14} />
                Clear All History
              </button>
            </div>
          )}

          <div className="px-4 py-4 mt-auto">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dominating Platforms</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs font-bold text-slate-600 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Insta</div>
              <div className="text-xs font-bold text-slate-600 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100"><div className="w-1.5 h-1.5 rounded-full bg-black"></div> TikTok</div>
              <div className="text-xs font-bold text-slate-600 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> YouTube</div>
              <div className="text-xs font-bold text-slate-600 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> LinkedIn</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
          Powered by Massab
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full relative">
        <div className="md:hidden flex items-center p-4 bg-white border-b border-slate-200 z-10 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="mr-3 text-slate-600"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-800">Social Strategic Assistant</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-checkerboard/30">
          <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col min-h-full">
            
            {messages.length === 1 && (
               <div className="flex-1 flex flex-col justify-center py-10">
                  <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-white rounded-3xl shadow-xl border border-indigo-50 mb-6">
                      <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">Level Up Your Content</h2>
                    <p className="text-slate-500 max-w-md mx-auto font-medium">Get viral strategies, hooks, and growth plans powered by AI.</p>
                  </div>
                  <SuggestedPrompts onSelect={(prompt) => handleSend(prompt)} />
               </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {isLoading && <TypingIndicator />}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shadow-up">
          <div className="max-w-3xl lg:max-w-5xl mx-auto relative group">
            <textarea
              ref={textAreaRef}
              value={input}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Ask about content ideas, captions, or strategy..."
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none max-h-[160px] min-h-[56px] shadow-sm text-slate-800 transition-all font-medium"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2.5 bottom-2.5 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="text-center text-[10px] font-black uppercase tracking-tighter text-slate-400 mt-3 flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            Review AI strategies before posting
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatInterface;
