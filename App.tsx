
import React, { useState } from 'react';
import { MessageSquare, Sparkles, Target, TrendingUp } from 'lucide-react';
import { AppMode } from './types';
import ChatInterface from './components/ChatInterface';
import GoalTracker from './components/GoalTracker';

function App() {
  const [mode, setMode] = useState<AppMode>('home');

  return (
    <>
      {/* Home Screen */}
      <div className={`min-h-screen bg-blue-50 flex items-center justify-center p-4 md:p-8 ${mode === 'home' ? '' : 'hidden'}`}>
        <div className="max-w-4xl w-full">
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white mb-4 md:mb-6 shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-2 md:mb-4 tracking-tight">
                  Welcome to Massab Tools
              </h1>
              <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto px-2">
                  The ultimate creator toolkit. Generate strategies and track your path to social stardom.
              </p>
          </div>

          {/* Selection Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chat Card */}
              <button 
                  onClick={() => setMode('chat')}
                  className="group relative w-full bg-blue-600 rounded-3xl p-6 md:p-10 border border-blue-500 shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-white">
                      <MessageSquare size={160} />
                  </div>
                  
                  <div className="relative z-10">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white text-blue-600 rounded-xl flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <MessageSquare className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          Social Strategic
                      </h2>
                      <h3 className="text-sm md:text-base font-semibold text-blue-200 uppercase tracking-wider mb-4 md:mb-6">
                          AI Content Assistant
                      </h3>
                      <p className="text-blue-100 leading-relaxed text-sm md:text-base">
                          Get viral strategies, captions, hooks, and growth tips. Turn your ideas into engaging posts instantly.
                      </p>
                      
                      <div className="mt-8 flex items-center text-white font-bold gap-2 group-hover:gap-4 transition-all">
                        <span>Launch Assistant</span>
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                        </div>
                      </div>
                  </div>
              </button>

              {/* Tracker Card */}
              <button 
                  onClick={() => setMode('tracker')}
                  className="group relative w-full bg-indigo-600 rounded-3xl p-6 md:p-10 border border-indigo-500 shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:shadow-indigo-900/30 transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-white">
                      <Target size={160} />
                  </div>
                  
                  <div className="relative z-10">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white text-indigo-600 rounded-xl flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          Goal Tracker
                      </h2>
                      <h3 className="text-sm md:text-base font-semibold text-indigo-200 uppercase tracking-wider mb-4 md:mb-6">
                          Monitor Your Growth
                      </h3>
                      <p className="text-indigo-100 leading-relaxed text-sm md:text-base">
                          Set follower targets, engagement goals, and watch your progress with visual charts and stats.
                      </p>
                      
                      <div className="mt-8 flex items-center text-white font-bold gap-2 group-hover:gap-4 transition-all">
                        <span>Open Tracker</span>
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                        </div>
                      </div>
                  </div>
              </button>
          </div>

          <div className="mt-12 md:mt-16 text-center text-xs md:text-sm text-slate-400">
              © 2025 Massab Tools. All rights reserved.
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 bg-white ${mode === 'chat' ? '' : 'hidden'}`}>
        <ChatInterface onBack={() => setMode('home')} />
      </div>

      <div className={`fixed inset-0 z-50 bg-slate-50 overflow-y-auto ${mode === 'tracker' ? '' : 'hidden'}`}>
        <GoalTracker onBack={() => setMode('home')} />
      </div>
    </>
  );
}

export default App;
