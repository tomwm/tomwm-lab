import { useState, Component, type ReactNode } from 'react';
import { MapPin, BookOpen, BrainCircuit } from 'lucide-react';
import Timeline from '@/components/Timeline';
import FlashCards from '@/components/FlashCards';
import QuizMode from '@/components/QuizMode';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack }; }
  render() {
    if (this.state.error) return (
      <div className="p-8 text-red-800 bg-red-50 font-mono text-xs whitespace-pre-wrap overflow-auto h-full">
        <strong>Runtime error:</strong>{'\n'}{this.state.error}
      </div>
    );
    return this.props.children;
  }
}

type View = 'timeline' | 'flashcards' | 'quiz';

const TABS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'timeline', label: 'Timeline', icon: <MapPin size={15} /> },
  { id: 'flashcards', label: 'Flash Cards', icon: <BookOpen size={15} /> },
  { id: 'quiz', label: 'Quiz', icon: <BrainCircuit size={15} /> },
];

export default function App() {
  const [view, setView] = useState<View>('timeline');

  return (
    <div className="h-screen flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 flex-shrink-0 px-4 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-stone-900 text-sm leading-tight truncate">AQA Migration Timeline</h1>
          <p className="text-xs text-stone-400 hidden sm:block">Paper 2 · Migration, empires & the people</p>
        </div>
        <nav className="flex gap-1 bg-stone-100 p-1 rounded-lg flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === tab.id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <ErrorBoundary>
          {view === 'timeline' && <Timeline />}
          {view === 'flashcards' && <FlashCards />}
          {view === 'quiz' && <QuizMode />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
