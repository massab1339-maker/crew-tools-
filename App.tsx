import React, { useState } from 'react';
import { MessageSquare, Image, Sparkles } from 'lucide-react';
import { AppMode } from './types';
import ChatInterface from './components/ChatInterface';
import ThumbnailMaker from './components/ThumbnailMaker';

function App() {
  const [mode, setMode] = useState<AppMode>('home');

  return (
    <>
      {/* Home Screen */}
      <div className={`min-h-screen bg-blue-50 flex items-center justify-center p-4 ${mode === 'home' ? '' : 'hidden'}`}>
        <div className="max-w-4xl w-full">
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white mb-4 md:mb-6 shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-2 md:mb-4 tracking-tight">
                  Welcome to Creo Tools
              </h1>
              <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto px-2">
                  The ultimate creator toolkit. Generate professional strategies or design viral thumbnails in seconds.
              </p>
          </div>

          {/* Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              
              <button 
                  onClick={() => setMode('chat')}
                  className="group relative bg-blue-600 rounded-3xl p-5 md:p-8 border border-blue-500 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-white">
                      <MessageSquare size={120} />
                  </div>
                  
                  <div className="relative z-10">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
                          Social Strategic
                      </h2>
                      <h3 className="text-xs md:text-sm font-semibold text-blue-200 uppercase tracking-wider mb-2 md:mb-4">
                          AI Chat Assistant
                      </h3>
                      <p className="text-blue-100 leading-relaxed hidden md:block">
                          Get social media strategies, captions, growth tips, and full content support powered by Gemini AI.
                      </p>
                      <p className="text-blue-100/90 text-sm leading-snug md:hidden">
                          Strategies, captions & growth tips.
                      </p>
                  </div>
              </button>

              <button 
                  onClick={() => setMode('thumbnail')}
                  className="group relative bg-pink-600 rounded-3xl p-5 md:p-8 border border-pink-500 shadow-lg shadow-pink-900/20 hover:shadow-xl hover:shadow-pink-900/30 transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
              >
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-white">
                      <Image size={120} />
                  </div>

                  <div className="relative z-10">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-pink-600 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <Image className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
                          Thumbnail Maker
                      </h2>
                      <h3 className="text-xs md:text-sm font-semibold text-pink-200 uppercase tracking-wider mb-2 md:mb-4">
                          Create or Edit Designs
                      </h3>
                      <p className="text-pink-100 leading-relaxed hidden md:block">
                          Design viral thumbnails instantly. Choose a template, customize text, and export for YouTube or Instagram.
                      </p>
                      <p className="text-pink-100/90 text-sm leading-snug md:hidden">
                          Design viral thumbnails instantly.
                      </p>
                  </div>
              </button>

          </div>

          <div className="mt-8 md:mt-12 text-center text-xs md:text-sm text-slate-400">
              © 2025 Creo Tools. Powered by Massab.
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 bg-white ${mode === 'chat' ? '' : 'hidden'}`}>
        <ChatInterface onBack={() => setMode('home')} />
      </div>

      <div className={`fixed inset-0 z-50 bg-slate-100 ${mode === 'thumbnail' ? '' : 'hidden'}`}>
        <ThumbnailMaker onBack={() => setMode('home')} />
      </div>
    </>
  );
}

export default App;