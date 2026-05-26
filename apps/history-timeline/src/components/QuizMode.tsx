import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Trophy } from 'lucide-react';
import { type Question, quizQuestions } from '@/data/quiz-questions';
import { uniqueCards, ERA_ORDER, getTimelineBucket } from '@/lib/utils';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(era: string, count = 10): Question[] {
  const pool = era === 'All'
    ? quizQuestions
    : quizQuestions.filter(q => {
        const card = uniqueCards.find(c => c.id === q.cardId);
        return card && getTimelineBucket(card) === era;
      });
  return shuffle([...pool])
    .slice(0, Math.min(count, pool.length))
    .map(q => ({ ...q, options: shuffle([...q.options]) }));
}

export default function QuizMode() {
  const [eraFilter, setEraFilter] = useState('All');
  const [questions, setQuestions] = useState<Question[]>(() => buildQuiz('All'));
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const eras = ['All', ...ERA_ORDER.filter(e => uniqueCards.some(c => getTimelineBucket(c) === e))];

  const startQuiz = useCallback((era: string) => {
    setQuestions(buildQuiz(era));
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }, []);

  const q = questions[qIndex];
  const isCorrect = selected === q?.correct;

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (qIndex + 1 >= questions.length) {
      setDone(true);
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
    }
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
        <Trophy size={48} className={pct >= 70 ? 'text-yellow-500' : 'text-stone-400'} />
        <div className="text-center">
          <h2 className="text-3xl font-bold">{score} / {questions.length}</h2>
          <p className="text-stone-500 mt-1">{pct}% correct</p>
          <p className="text-sm mt-3 text-stone-600">
            {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort — keep revising!' : 'Keep practising — you\'ll get there!'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => startQuiz(eraFilter)}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const progress = ((qIndex) / questions.length) * 100;

  return (
    <div className="flex flex-col h-full overflow-y-auto max-w-2xl mx-auto px-4 py-4 gap-4">
      {/* Era filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-shrink-0 -mx-4 px-4">
        {eras.map(era => (
          <button key={era}
            onClick={() => { setEraFilter(era); startQuiz(era); }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 ${
              eraFilter === era ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-300 text-stone-600 hover:border-stone-500'
            }`}
          >
            {era === 'All' ? 'All eras' : era}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-stone-500">Q{qIndex + 1} of {questions.length}</span>
        <span className="text-xs text-green-600 font-medium">{score} correct</span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Question {qIndex + 1}</p>
        <h2 className="text-lg font-semibold text-stone-900 leading-snug">{q.question}</h2>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i];
          const isSelected = selected === opt;
          const isRight = opt === q.correct;
          let cls = 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50';
          if (selected) {
            if (isRight) cls = 'border-green-400 bg-green-50 text-green-900';
            else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-900';
            else cls = 'border-stone-200 bg-stone-50 opacity-60';
          }
          return (
            <button key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={!!selected}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-start gap-3 ${cls}`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold opacity-60">
                {letter}
              </span>
              <span className="text-sm leading-snug flex-1">{opt}</span>
              {selected && isRight && <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />}
              {selected && isSelected && !isRight && <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Explanation + Next */}
      {selected && (
        <div className="space-y-3 animate-fade-in" ref={el => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>
          <div className={`rounded-xl p-4 text-sm ${isCorrect ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-orange-50 border border-orange-200 text-orange-900'}`}>
            <p className="font-semibold mb-1">{isCorrect ? 'Correct!' : 'Not quite.'}</p>
            <p className="leading-relaxed text-xs">{q.explanation}</p>
          </div>
          <button onClick={next}
            className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">
            {qIndex + 1 >= questions.length ? 'See results' : 'Next question →'}
          </button>
        </div>
      )}
    </div>
  );
}
