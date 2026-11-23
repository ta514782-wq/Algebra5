import { ArrowRight, CheckCircle2, Flame, Play, RefreshCw, Timer, Trophy, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PracticeQuestion } from '../data/questionBank.ts';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

function shuffleQuestions(arr: PracticeQuestion[]): PracticeQuestion[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function LightningChallengePanel({ allQuestions }: { allQuestions: PracticeQuestion[] }) {
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [queue, setQueue] = useState<PracticeQuestion[]>([]);
  const [qIdx, setQIdx] = useState<number>(0);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [lastPick, setLastPick] = useState<{ chosen: number; correct: boolean } | null>(null);
  const [missedLog, setMissedLog] = useState<Array<{ q: PracticeQuestion; chosenIdx: number }>>([]);

  const pool = useMemo(
    () =>
      allQuestions.filter((q) => (topicFilter === 'all' ? true : q.topicId === topicFilter)),
    [allQuestions, topicFilter]
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('done');
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, timeLeft]);

  const startRound = () => {
    setQueue(shuffleQuestions(pool));
    setQIdx(0);
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnsweredCount(0);
    setCorrectCount(0);
    setLastPick(null);
    setMissedLog([]);
    setPhase('playing');
  };

  const currentQ = queue[qIdx];
  const multiplier = streak >= 6 ? 3 : streak >= 3 ? 2 : 1;

  const advanceNext = () => {
    setLastPick(null);
    if (qIdx + 1 >= queue.length) {
      setQueue(shuffleQuestions(pool));
      setQIdx(0);
    } else {
      setQIdx((i) => i + 1);
    }
  };

  const handleOptionClick = (optIdx: number) => {
    if (phase !== 'playing' || !currentQ || lastPick !== null) return;
    const isCorrect = optIdx === currentQ.correctIndex;
    setLastPick({ chosen: optIdx, correct: isCorrect });
    setAnsweredCount((c) => c + 1);

    if (isCorrect) {
      const nextStreak = streak + 1;
      const mult = nextStreak >= 6 ? 3 : nextStreak >= 3 ? 2 : 1;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 10 * mult);
    } else {
      setStreak(0);
      setMissedLog((prev) => [...prev, { q: currentQ, chosenIdx: optIdx }]);
    }

    window.setTimeout(() => {
      advanceNext();
    }, 750);
  };

  if (phase === 'ready') {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Classroom Audience Challenge · 60-Second Sprint
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Coset, Normality & Quotient Lightning Round
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Answer as many engine-verified Algebra II questions as you can in 60 seconds. Build 3+ and 6+ answer streaks for 2× and 3× score multipliers—ideal for live classroom play.
            </p>
          </div>
          <Flame className="w-8 h-8 text-amber-500 shrink-0" />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Topic Focus
            </label>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="all">All 7 Algebra II Topics (Mixed Sprint)</option>
              {LEARNING_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  Topic {t.number}: {t.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={startRound}
            className="h-10 px-5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4" />
            Start 60-Second Sprint
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Time&apos;s Up! Lightning Scoreboard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  60-second classroom sprint complete
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startRound}
              className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Play Again
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Total Points</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-1">{score}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Accuracy</div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-1">{pct}%</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Correct / Answered</div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-1">{correctCount}/{answeredCount}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">Best Streak</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">{bestStreak}</div>
            </div>
          </div>

          {missedLog.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quick Review of Missed Questions ({missedLog.length})
              </h3>
              {missedLog.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    <MathText text={item.q.question} />
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400">
                    Correct Answer: <MathText text={item.q.options[item.q.correctIndex]} /> — <MathText text={item.q.correctExplanation} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
      {/* Live Timer & Streak HUD */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-3 tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Timer className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`} />
              <span className={`font-mono text-base ${timeLeft <= 10 ? 'text-red-600' : ''}`}>{timeLeft}s</span>
            </span>
            <span className="text-blue-700 dark:text-blue-400 font-mono text-sm">
              Score: {score}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono">
              <Flame className="w-3.5 h-3.5" />
              Streak: {streak} ({multiplier}×)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPhase('done')}
            className="px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            End Sprint
          </button>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${timeLeft <= 10 ? 'bg-red-600' : 'bg-blue-600'}`}
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      </div>

      {currentQ && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{currentQ.topicTitle} · {currentQ.difficulty}</span>
            {currentQ.formula && <MathFormula latex={currentQ.formula} />}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
            <MathText text={currentQ.question} />
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQ.options.map((opt, idx) => {
              let cls =
                'border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100';
              if (lastPick !== null) {
                if (idx === currentQ.correctIndex) {
                  cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                } else if (idx === lastPick.chosen) {
                  cls = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={lastPick !== null}
                  onClick={() => handleOptionClick(idx)}
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${cls}`}
                >
                  <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                  <MathText text={opt} />
                </button>
              );
            })}
          </div>

          {lastPick && (
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span className={`inline-flex items-center gap-1.5 ${lastPick.correct ? 'text-emerald-600' : 'text-red-600'}`}>
                {lastPick.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {lastPick.correct ? `+${10 * multiplier} pts!` : 'Streak reset — next question coming…'}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                Advancing <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
