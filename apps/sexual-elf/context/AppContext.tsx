'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppState, WizardAnswers, RiskAssessment, ChatMessage } from '@/lib/types';

const initialState: AppState = {
  wizardAnswers: {},
  wizardStep: 0,
  wizardComplete: false,
  assessment: null,
  chatMessages: [],
};

type Action =
  | { type: 'SET_WIZARD_ANSWER'; key: string; value: string | string[] | undefined }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'COMPLETE_WIZARD' }
  | { type: 'SET_ASSESSMENT'; assessment: RiskAssessment }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_LAST_ASSISTANT_MESSAGE'; content: string }
  | { type: 'RESET_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_WIZARD_ANSWER':
      return {
        ...state,
        wizardAnswers: { ...state.wizardAnswers, [action.key]: action.value },
      };
    case 'NEXT_STEP':
      return { ...state, wizardStep: Math.min(state.wizardStep + 1, 3) };
    case 'PREV_STEP':
      return { ...state, wizardStep: Math.max(state.wizardStep - 1, 0) };
    case 'COMPLETE_WIZARD':
      return { ...state, wizardComplete: true };
    case 'SET_ASSESSMENT':
      return { ...state, assessment: action.assessment };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.message] };
    case 'UPDATE_LAST_ASSISTANT_MESSAGE': {
      const msgs = [...state.chatMessages];
      const lastIdx = msgs.length - 1;
      if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
        msgs[lastIdx] = { ...msgs[lastIdx], content: action.content };
      }
      return { ...state, chatMessages: msgs };
    }
    case 'RESET_ALL':
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  setWizardAnswer: (key: string, value: string | string[] | undefined) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeWizard: () => void;
  setAssessment: (assessment: RiskAssessment) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: AppContextValue = {
    ...state,
    setWizardAnswer: (key, value) => dispatch({ type: 'SET_WIZARD_ANSWER', key, value }),
    nextStep: () => dispatch({ type: 'NEXT_STEP' }),
    prevStep: () => dispatch({ type: 'PREV_STEP' }),
    completeWizard: () => dispatch({ type: 'COMPLETE_WIZARD' }),
    setAssessment: (assessment) => dispatch({ type: 'SET_ASSESSMENT', assessment }),
    addChatMessage: (message) => dispatch({ type: 'ADD_CHAT_MESSAGE', message }),
    updateLastAssistantMessage: (content) => dispatch({ type: 'UPDATE_LAST_ASSISTANT_MESSAGE', content }),
    resetAll: () => dispatch({ type: 'RESET_ALL' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppContextProvider');
  return ctx;
}
