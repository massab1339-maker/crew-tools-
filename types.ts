
import React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export type SuggestedPrompt = {
  title: string;
  prompt: string;
  icon: React.ReactNode;
  color?: string;
  bgColor?: string;
  cardBg?: string;
  borderColor?: string;
};

export interface ChatSessionRecord {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Goal {
  id: string;
  title: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'LinkedIn' | 'X' | 'Other';
  targetValue: number;
  currentValue: number;
  unit: string;
  createdAt: number;
  archivedAt?: number;
}

export type AppMode = 'home' | 'chat' | 'tracker';
