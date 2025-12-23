
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Target, Trash2, TrendingUp, Instagram, Youtube, Linkedin, Twitter, Globe, X, Sparkles, Send, CheckCircle2, Trophy, ArrowRight, Zap, History, LayoutDashboard, Calendar, Edit3 } from 'lucide-react';
import { Goal, Message } from '../types';
import { createGoalCoachSession, sendMessageStream } from '../services/geminiService';
import { COACH_WELCOME } from '../constants';
import TypingIndicator from './TypingIndicator';

interface GoalTrackerProps {
  onBack: () => void;
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ onBack }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [view, setView] = useState<'active' | 'history'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // AI Coach States
  const [coachMessages, setCoachMessages] = useState<Message[]>([
    { id: 'coach-welcome', role: 'model', text: COACH_WELCOME }
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachSession, setCoachSession] = useState<any>(null);
  const [proposedGoal, setProposedGoal] = useState<Partial<Goal> | null>(null);

  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    platform: 'Instagram',
    unit: 'Followers',
    currentValue: 0,
    targetValue: 1000,
  });

  const coachEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('creo-goals');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse goals', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('creo-goals', JSON.stringify(goals));
  }, [goals]);

  // Scroll coach to bottom
  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages, isCoachLoading]);

  const handleAddGoal = (goalData?: Partial<Goal>) => {
    const data = goalData || newGoal;
    if (!data.title || !data.targetValue) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: data.title,
      platform: (data.platform as any) || 'Other',
      targetValue: Number(data.targetValue),
      currentValue: Number(data.currentValue) || 0,
      unit: data.unit || 'Units',
      createdAt: Date.now(),
    };

    setGoals([goal, ...goals]);
    setIsModalOpen(false);
    setIsCoachOpen(false);
    setProposedGoal(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    setNewGoal({
      platform: 'Instagram',
      unit: 'Followers',
      currentValue: 0,
      targetValue: 1000,
    });
  };

  const startCoachSession = (contextMessage?: string) => {
    const session = createGoalCoachSession();
    setCoachSession(session);
    setProposedGoal(null);
    setIsCoachOpen(true);
    
    if (contextMessage) {
      setCoachMessages([{ id: 'coach-welcome', role: 'model', text: "Analyzing your recent success... let's set a new target!" }]);
      handleCoachSend(contextMessage, session);
    } else {
      setCoachMessages([{ id: 'coach-welcome', role: 'model', text: COACH_WELCOME }]);
    }
  };

  const handleCoachSend = async (textOverride?: string, sessionOverride?: any) => {
    const activeSession = sessionOverride || coachSession;
    const userText = textOverride || coachInput;
    if (!userText.trim() || !activeSession || isCoachLoading) return;

    if (!textOverride) setCoachInput('');
    setCoachMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsCoachLoading(true);

    try {
      const stream = await sendMessageStream(activeSession, userText);
      const modelId = (Date.now() + 1).toString();
      let fullText = '';
      
      setCoachMessages(prev => [...prev, { id: modelId, role: 'model', text: '', isStreaming: true }]);

      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          setCoachMessages(prev => prev.map(m => m.id === modelId ? { ...m, text: fullText } : m));
        }
      }

      const proposalMatch = fullText.match(/GOAL_PROPOSAL:\s*({.*?})/);
      if (proposalMatch) {
        try {
          const parsed = JSON.parse(proposalMatch[1]);
          setProposedGoal(parsed);
          const cleanedText = fullText.replace(/GOAL_PROPOSAL:\s*{.*?}/, "").trim();
          setCoachMessages(prev => prev.map(m => m.id === modelId ? { ...m, text: cleanedText, isStreaming: false } : m));
        } catch (e) {
          console.error("Failed to parse goal proposal", e);
        }
      } else {
        setCoachMessages(prev => prev.map(m => m.id === modelId ? { ...m, isStreaming: false } : m));
      }

    } catch (error) {
      console.error("Coach error:", error);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleArchiveGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, archivedAt: Date.now() } : g));
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleUpdateProgress = (id: string, newValue: number) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        // Enforce the cap: Value cannot exceed targetValue
        const cappedValue = Math.min(newValue, g.targetValue);
        return { ...g, currentValue: cappedValue };
      }
      return g;
    }));
  };

  const handleSetNewTarget = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newTarget = prompt(`Current target for "${goal.title}" is ${goal.targetValue}. Enter your new target:`, (goal.targetValue * 2).toString());
    if (newTarget && !isNaN(Number(newTarget))) {
      setGoals(goals.map(g => g.id === id ? { ...g, targetValue: Number(newTarget) } : g));
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram size={18} className="text-pink-600" />;
      case 'YouTube': return <Youtube size={18} className="text-red-600" />;
      case 'TikTok': return <Globe size={18} className="text-black" />;
      case 'LinkedIn': return <Linkedin size={18} className="text-blue-700" />;
      case 'X': return <Twitter size={18} className="text-slate-900" />;
      default: return <Target size={18} className="text-indigo-600" />;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    const rawProgress = Math.round((current / target) * 100);
    // Capping at 100 as per user request: "counting stops after 100 percent"
    return Math.min(rawProgress, 100);
  };

  const activeGoals = goals.filter(g => !g.archivedAt);
  const archivedGoals = goals.filter(g => g.archivedAt).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Trophy className="text-amber-400" size={20} />
          <span className="font-bold text-sm">Action successful!</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Social Goal Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => startCoachSession()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 font-medium"
            >
                <Sparkles size={18} className="text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Suggest with AI</span>
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 font-medium"
            >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Goal</span>
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex border-t border-slate-100 bg-white">
          <button 
            onClick={() => setView('active')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${view === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutDashboard size={16} />
            Active Goals ({activeGoals.length})
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${view === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <History size={16} />
            Achievement History ({archivedGoals.length})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {view === 'active' ? (
          activeGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                <Target size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">No active goals</h2>
              <p className="text-slate-500 max-w-sm mb-8">
                Start tracking your creator journey by setting your next big target.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Set New Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {activeGoals.map((goal) => {
                const progress = calculateProgress(goal.currentValue, goal.targetValue);
                const isCompleted = progress >= 100;

                return (
                  <div 
                    key={goal.id} 
                    className={`bg-white rounded-3xl p-6 shadow-sm border transition-all duration-500 relative group overflow-hidden ${
                      isCompleted ? 'border-green-200 shadow-green-100 bg-gradient-to-b from-white to-green-50' : 'border-slate-200 hover:shadow-md'
                    }`}
                  >
                    {isCompleted && (
                      <div className="absolute -right-4 -top-4 opacity-10 text-green-600 rotate-12">
                        <Trophy size={100} />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${isCompleted ? 'bg-green-100 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                          {getPlatformIcon(goal.platform)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 truncate max-w-[140px]">{goal.title}</h3>
                          <p className={`text-xs uppercase tracking-wider font-semibold ${isCompleted ? 'text-green-600' : 'text-slate-500'}`}>
                            {isCompleted ? 'Target Reached!' : goal.platform}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-end">
                        <div className={`text-2xl font-black ${isCompleted ? 'text-green-700' : 'text-slate-900'}`}>
                          {progress}%
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                          <div className={`text-sm font-semibold ${isCompleted ? 'text-green-700' : 'text-slate-600'}`}>
                            {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${
                            isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="pt-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Update Current {goal.unit}</label>
                          <input 
                            type="range"
                            min="0"
                            max={goal.targetValue}
                            step="1"
                            value={goal.currentValue}
                            onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="mt-4 flex gap-2">
                            <input 
                              type="number"
                              min="0"
                              max={goal.targetValue}
                              value={goal.currentValue}
                              onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 flex items-center">
                              {goal.unit}
                            </div>
                          </div>
                          
                          {isCompleted && (
                            <div className="mt-4 space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                              <div className="p-3 bg-green-100/50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-700 font-bold text-xs">
                                <Trophy size={14} className="text-amber-500" /> 
                                High Achiever! Goal Met.
                              </div>
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => handleArchiveGoal(goal.id)}
                                  className="w-full bg-slate-900 text-white py-3.5 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 px-4 group"
                                >
                                  <Trophy size={20} className="text-amber-400 group-hover:scale-125 transition-transform" />
                                  <span className="font-bold uppercase tracking-wider text-xs">Save to Achievements</span>
                                </button>
                                <button 
                                  onClick={() => handleSetNewTarget(goal.id)}
                                  className="w-full bg-white text-indigo-600 border-2 border-indigo-100 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all active:scale-95"
                                >
                                  <TrendingUp size={18} />
                                  Raise New Target
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {archivedGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <History size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No history yet</h2>
                <p className="text-slate-500 max-w-sm">
                  Complete your active goals to build a track record of your creator success.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedGoals.map((goal) => (
                  <div 
                    key={goal.id} 
                    className="bg-white rounded-3xl p-6 shadow-sm border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 relative overflow-hidden group"
                  >
                    <div className="absolute right-[-10px] top-[-10px] opacity-10 text-amber-500 rotate-12 group-hover:scale-110 transition-transform">
                      <Trophy size={80} />
                    </div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2.5 bg-amber-100 rounded-xl border border-amber-200">
                        {getPlatformIcon(goal.platform)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{goal.title}</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600">
                          <CheckCircle2 size={10} />
                          Success Recorded
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="bg-white/60 rounded-2xl p-4 border border-white">
                        <div className="text-center">
                          <div className="text-3xl font-black text-slate-900 leading-none mb-1">
                            {goal.targetValue.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            Total {goal.unit} reached
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          Achieved on {new Date(goal.archivedAt!).toLocaleDateString()}
                        </div>
                        <button 
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI Goal Coach Modal */}
      {isCoachOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCoachOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                  <Sparkles size={20} className="text-slate-900" />
                </div>
                <div>
                  <h2 className="font-bold">Growth Coach</h2>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">AI Power</p>
                </div>
              </div>
              <button onClick={() => setIsCoachOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {coachMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCoachLoading && <div className="flex justify-start"><TypingIndicator /></div>}
              <div ref={coachEndRef} />
            </div>

            {proposedGoal && (
                <div className="p-4 bg-amber-100 border-t border-amber-200 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-200 rounded-lg">
                            <Target size={18} className="text-amber-800" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Growth Recommendation</p>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{proposedGoal.title}</p>
                            <p className="text-xs text-slate-600">{proposedGoal.targetValue?.toLocaleString()} {proposedGoal.unit} on {proposedGoal.platform}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleAddGoal(proposedGoal)}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/10 active:scale-95"
                    >
                        <Zap size={18} className="text-amber-400 fill-amber-400" />
                        Create this Goal
                    </button>
                </div>
            )}

            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2 mb-3">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 active:scale-95"
                >
                  <Plus size={14} />
                  Deploy Manual Goal
                </button>
                <button 
                  onClick={() => handleCoachSend("I'm ready to set this up! Please provide a formal SMART goal proposal for me now.")}
                  disabled={isCoachLoading || proposedGoal !== null}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-100 disabled:opacity-50 active:scale-95"
                >
                  <Sparkles size={14} />
                  Ask AI to Deploy
                </button>
              </div>

              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="Tell your coach..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={coachInput}
                  onChange={e => setCoachInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCoachSend()}
                />
                <button 
                  onClick={() => handleCoachSend()}
                  disabled={!coachInput.trim() || isCoachLoading}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Target className="text-indigo-600" />
                Set New Goal
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Goal Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Q1 Follower Target"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newGoal.title || ''}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Platform</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newGoal.platform}
                    onChange={e => setNewGoal({...newGoal, platform: e.target.value as any})}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="X">X / Twitter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Unit</label>
                  <input 
                    type="text"
                    placeholder="Followers"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newGoal.unit}
                    onChange={e => setNewGoal({...newGoal, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Start Value</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newGoal.currentValue}
                    onChange={e => setNewGoal({...newGoal, currentValue: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Target Value</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                  />
                </div>
              </div>

              <button 
                onClick={() => handleAddGoal()}
                disabled={!newGoal.title || !newGoal.targetValue}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-4"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
