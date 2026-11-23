import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import {
  computeDailyStreak,
  DailyChallengeStorageState,
  formatChallengeDate,
  formatCountdown,
  getLocalDateKey,
  getMsUntilNextDay,
  loadDailyChallengeState,
  saveDailyChallengeAttempt,
  selectDailyAlgebraChallenge,
} from '../core/dailyChallengeEngine.ts';
import { PracticeQuestion } from '../data/questionBank.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

interface DailyAlgebraChallengeProps {
  bank: PracticeQuestion[];
  onNavigate: (page: string, topicId?: string) => void;
}

const DIFFICULTY_LABEL: Record<PracticeQuestion['difficulty'], string> = {
  easy: 'Foundational',
  medium: 'Intermediate',
  advanced: 'Advanced',
};

export function DailyAlgebraChallenge({ bank, onNavigate }: DailyAlgebraChallengeProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [storageState, setStorageState] = useState<DailyChallengeStorageState>(() =>
    loadDailyChallengeState()
  );
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const dateKey = getLocalDateKey(now);

  const daily = useMemo(() => selectDailyAlgebraChallenge(bank, now), [bank, dateKey]);
  const savedAttempt = storageState.attemptsByDate[daily.dateKey];
  const isSubmitted = Boolean(savedAttempt && savedAttempt.questionId === daily.question.id);
  const activeChoice = isSubmitted && savedAttempt ? savedAttempt.selectedIndex : selectedChoice;

  const streakStats = useMemo(
    () => computeDailyStreak(storageState.attemptsByDate, now),
    [storageState.attemptsByDate, dateKey]
  );

  const countdown = formatCountdown(getMsUntilNextDay(now));
  const formattedDate = formatChallengeDate(now);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Reset transient selection if midnight rolls over to a new question
  useEffect(() => {
    setSelectedChoice(null);
    setShowHint(false);
  }, [daily.dateKey]);

  const handleCheckAnswer = () => {
    if (activeChoice === null || isSubmitted) return;
    const isCorrect = activeChoice === daily.question.correctIndex;
    const nextState = saveDailyChallengeAttempt({
      dateKey: daily.dateKey,
      questionId: daily.question.id,
      selectedIndex: activeChoice,
      isCorrect,
      submittedAt: new Date().toISOString(),
    });
    setStorageState(nextState);
  };

  return (
    <section
      aria-labelledby="daily-algebra-challenge-heading"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4"
    >
      {/* Header & Clean Metadata Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
            <h2
              id="daily-algebra-challenge-heading"
              className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Daily Algebra Challenge
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {daily.question.topicTitle}
            </span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_LABEL[daily.question.difficulty]}</span>
            <span aria-hidden="true">·</span>
            <span>Engine-Verified</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums whitespace-nowrap">
            <Flame
              className={`w-3.5 h-3.5 shrink-0 ${
                streakStats.currentStreak > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400'
              }`}
            />
            Streak: {streakStats.currentStreak}d
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Next in {countdown}
          </span>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <p className="text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
          <MathText text={daily.question.question} />
        </p>

        {/* Optional Hint Reveal */}
        <AnimatePresence initial={false}>
          {showHint && !isSubmitted && daily.question.formula && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium">Reference identity:</span>
              <MathFormula latex={daily.question.formula} className="text-slate-900 dark:text-slate-100" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {daily.question.options.map((opt, idx) => {
            const isSelected = activeChoice === idx;
            const isRight = idx === daily.question.correctIndex;
            let cls =
              'border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40';
            if (isSubmitted) {
              if (isRight) {
                cls =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium';
              } else if (isSelected) {
                cls =
                  'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100';
              } else {
                cls =
                  'border-slate-200 dark:border-slate-800 opacity-75 text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/20';
              }
            } else if (isSelected) {
              cls =
                'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 font-medium';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                aria-pressed={isSelected}
                onClick={() => setSelectedChoice(idx)}
                className={`min-h-[44px] flex items-center justify-between gap-2 text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${cls}`}
              >
                <span className="min-w-0">
                  <span className="font-mono font-semibold mr-2">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <MathText text={opt} />
                </span>
                {isSubmitted && isRight && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {isSubmitted && isSelected && !isRight && (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                disabled={activeChoice === null}
                onClick={handleCheckAnswer}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-45 text-white text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Check Answer
              </button>
              {daily.question.formula && (
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('practice', daily.question.topicId)}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors"
              >
                Practice Similar Questions
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('learn', daily.question.topicId)}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Review Topic
              </button>
            </>
          )}
        </div>

        {isSubmitted && daily.question.formula && (
          <MathFormula
            latex={daily.question.formula}
            className="text-xs text-slate-600 dark:text-slate-400"
          />
        )}
      </div>

      {/* Verified Solution & Step-by-Step Proof */}
      <AnimatePresence initial={false}>
        {isSubmitted && activeChoice !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs"
          >
            <div className="flex items-start gap-2">
              {activeChoice === daily.question.correctIndex ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-slate-800 dark:text-slate-200">
                <div className="font-semibold">
                  {activeChoice === daily.question.correctIndex
                    ? 'Correct — Daily challenge completed.'
                    : `Incorrect (Option ${String.fromCharCode(65 + activeChoice)} selected; Option ${String.fromCharCode(65 + daily.question.correctIndex)} is verified).`}
                </div>
                {activeChoice !== daily.question.correctIndex &&
                  daily.question.distractorExplanations[activeChoice] && (
                    <p className="text-red-700 dark:text-red-300">
                      Why your choice misses: <MathText text={daily.question.distractorExplanations[activeChoice]} />
                    </p>
                  )}
                <p className="text-slate-700 dark:text-slate-300">
                  <MathText text={daily.question.correctExplanation} />
                </p>
              </div>
            </div>

            {daily.question.stepByStep.length > 0 && (
              <ol className="pl-6 list-decimal space-y-1 text-slate-600 dark:text-slate-400">
                {daily.question.stepByStep.map((step, i) => (
                  <li key={i}>
                    <MathText text={step} />
                  </li>
                ))}
              </ol>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
