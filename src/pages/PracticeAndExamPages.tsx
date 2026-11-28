import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LightningChallengePanel } from '../components/LightningChallengePanel.tsx';
import { MathFormula, MathText } from '../components/MathFormula.tsx';
import { getVerifiedQuestionBank, PracticeQuestion, QuestionDifficulty } from '../data/questionBank.ts';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { drawNonRepeatingSession, shuffleArray } from '../utils/sessionSampling.ts';

export { drawNonRepeatingSession };

interface PracticeMcqsPageProps {
  initialTopicId?: string;
  customApprovedQuestions: PracticeQuestion[];
  bookmarkedQuestionIds: Set<string>;
  isAuthenticated: boolean;
  onToggleBookmark: (qId: string, label: string) => void;
  onSavePracticeSession: (payload: {
    topicId: string;
    difficulty: string;
    score: number;
    total: number;
    timeSeconds: number;
    mistakes: Array<{
      questionId: string;
      topicId: string;
      questionText: string;
      previousAnswer: string;
      correctAnswer: string;
      explanation: string;
    }>;
  }) => void;
}

export function PracticeMcqsPage({
  initialTopicId,
  customApprovedQuestions,
  bookmarkedQuestionIds,
  isAuthenticated,
  onToggleBookmark,
  onSavePracticeSession,
}: PracticeMcqsPageProps) {
  const allQuestions = useMemo(
    () => [...getVerifiedQuestionBank(), ...customApprovedQuestions],
    [customApprovedQuestions]
  );

  const [practiceMode, setPracticeMode] = useState<'set' | 'lightning'>('set');
  const [topicFilter, setTopicFilter] = useState<string>(initialTopicId || 'all');
  const [diffFilter, setDiffFilter] = useState<'all' | QuestionDifficulty>('all');
  const [timedMode, setTimedMode] = useState<boolean>(false);
  const [reviewWrongOnly, setReviewWrongOnly] = useState(false);

  const filteredPool = useMemo(
    () =>
      allQuestions.filter((q) => {
        if (topicFilter !== 'all' && q.topicId !== topicFilter) return false;
        if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
        return true;
      }),
    [allQuestions, topicFilter, diffFilter]
  );

  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [sessionDraw, setSessionDraw] = useState<{
    questions: PracticeQuestion[];
    resetCycle: boolean;
    unseenRemainingBeforeDraw: number;
  }>(() => {
    const initial = drawNonRepeatingSession(
      allQuestions.filter((q) => (!initialTopicId || initialTopicId === 'all' ? true : q.topicId === initialTopicId)),
      new Set(),
      10
    );
    return {
      questions: initial.questions,
      resetCycle: initial.resetCycle,
      unseenRemainingBeforeDraw: initial.unseenRemainingBeforeDraw,
    };
  });

  useEffect(() => {
    setSeenIds((prev) => {
      if (prev.size > 0) return prev;
      const next = new Set(prev);
      sessionDraw.questions.forEach((q) => next.add(q.id));
      return next;
    });
  }, []);

  const sessionQuestions = sessionDraw.questions;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (sessionFinished) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionFinished, sessionQuestions]);

  const startNewSet = (newTopic?: string, newDiff?: 'all' | QuestionDifficulty) => {
    const nextTopic = newTopic !== undefined ? newTopic : topicFilter;
    const nextDiff = newDiff !== undefined ? newDiff : diffFilter;
    if (newTopic !== undefined) setTopicFilter(newTopic);
    if (newDiff !== undefined) setDiffFilter(newDiff);

    const nextPool = allQuestions.filter((q) => {
      if (nextTopic !== 'all' && q.topicId !== nextTopic) return false;
      if (nextDiff !== 'all' && q.difficulty !== nextDiff) return false;
      return true;
    });
    const drawn = drawNonRepeatingSession(nextPool, seenIds, 10);
    setSeenIds(drawn.nextSeenIds);
    setSessionDraw({
      questions: drawn.questions,
      resetCycle: drawn.resetCycle,
      unseenRemainingBeforeDraw: drawn.unseenRemainingBeforeDraw,
    });
    setCurrentIdx(0);
    setSelectedAnswers({});
    setCheckedMap({});
    setElapsedSeconds(0);
    setSessionFinished(false);
    setSavedNotice(false);
    setReviewWrongOnly(false);
  };

  const currentQ = sessionQuestions[currentIdx];

  const handleCheck = () => {
    if (!currentQ || selectedAnswers[currentIdx] === undefined) return;
    setCheckedMap((prev) => ({ ...prev, [currentIdx]: true }));
  };

  const handleFinishSession = () => {
    setSessionFinished(true);
    const checkedAll: Record<number, boolean> = {};
    const mistakes: Array<{
      questionId: string;
      topicId: string;
      questionText: string;
      previousAnswer: string;
      correctAnswer: string;
      explanation: string;
    }> = [];
    let score = 0;

    sessionQuestions.forEach((q, idx) => {
      checkedAll[idx] = true;
      const ans = selectedAnswers[idx];
      if (ans === q.correctIndex) {
        score++;
      } else {
        mistakes.push({
          questionId: q.id,
          topicId: q.topicId,
          questionText: q.question,
          previousAnswer: ans !== undefined ? q.options[ans] : 'Unanswered',
          correctAnswer: q.options[q.correctIndex],
          explanation: q.correctExplanation,
        });
      }
    });
    setCheckedMap(checkedAll);
    if (isAuthenticated && !savedNotice) {
      onSavePracticeSession({
        topicId: topicFilter,
        difficulty: diffFilter,
        score,
        total: sessionQuestions.length,
        timeSeconds: elapsedSeconds,
        mistakes,
      });
      setSavedNotice(true);
    }
  };

  const scoreCount = sessionQuestions.reduce(
    (acc, q, idx) => (checkedMap[idx] && selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc),
    0
  );

  if (!currentQ) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">No questions matched those filters.</p>
        <button
          type="button"
          onClick={() => startNewSet('all', 'all')}
          className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Practice Vault & Classroom Sprint
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Practice 10-question curated sets or launch the 60-second Lightning Challenge.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setPracticeMode('set')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
              practiceMode === 'set'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            10-Question Practice Set
          </button>
          <button
            type="button"
            onClick={() => setPracticeMode('lightning')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              practiceMode === 'lightning'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            60s Lightning Challenge
          </button>
        </div>
      </div>

      {practiceMode === 'lightning' ? (
        <LightningChallengePanel allQuestions={allQuestions} />
      ) : (
        <>
      {/* Controls Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={topicFilter}
            onChange={(e) => startNewSet(e.target.value, undefined)}
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          >
            <option value="all">All 7 Topics (Adaptive Vault)</option>
            {LEARNING_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                Topic {t.number}: {t.title}
              </option>
            ))}
          </select>

          <select
            value={diffFilter}
            onChange={(e) => startNewSet(undefined, e.target.value as 'all' | QuestionDifficulty)}
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="advanced">Advanced</option>
          </select>

          <button
            type="button"
            onClick={() => setTimedMode((v) => !v)}
            className={`h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              timedMode
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {timedMode ? `Timed: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s` : 'Enable Timer'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-1">
            {filteredPool.filter((q) => !seenIds.has(q.id)).length}/{filteredPool.length} unseen
            {sessionDraw.resetCycle ? ' · Deck cycled' : ''}
          </span>
          <button
            type="button"
            onClick={() => {
              setCurrentIdx(0);
              setSelectedAnswers({});
              setCheckedMap({});
              setElapsedSeconds(0);
              setSessionFinished(false);
            }}
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            Restart Set
          </button>
          <button
            type="button"
            onClick={() => startNewSet()}
            className="h-9 px-3.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Next 10 Questions
          </button>
        </div>
      </div>

      {/* Session End Summary */}
      {sessionFinished && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Practice Session Complete
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Score: {scoreCount} / {sessionQuestions.length} ({Math.round((scoreCount / sessionQuestions.length) * 100)}%) · Time: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReviewWrongOnly((v) => !v)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                {reviewWrongOnly ? 'Show All 10' : 'Review Incorrect Only'}
              </button>
              <button
                type="button"
                onClick={() => startNewSet()}
                className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium"
              >
                New 10-Question Set
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300">
            {scoreCount >= 8
              ? 'Strong mastery on this set! Try Advanced difficulty or a 20-question Mock Exam.'
              : 'Recommendation: Review the step-by-step solutions below and revisit your Mistake Notebook to master missed concepts.'}
            {!isAuthenticated && ' Sign in to save this session and missed questions to your profile.'}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {sessionQuestions.map((q, idx) => {
              const userAns = selectedAnswers[idx];
              const isOk = userAns === q.correctIndex;
              if (reviewWrongOnly && isOk) return null;
              return (
                <div key={q.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2 font-medium">
                    <span>
                      Q{idx + 1}. <MathText text={q.question} />
                    </span>
                    <span className={isOk ? 'text-emerald-600' : 'text-red-600'}>
                      {isOk ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Your answer: {userAns !== undefined ? <MathText text={q.options[userAns]} /> : 'Unanswered'} · Correct:{' '}
                    <MathText text={q.options[q.correctIndex]} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        {/* Progress Dots */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {sessionQuestions.map((q, idx) => {
              const checked = checkedMap[idx];
              const ok = selectedAnswers[idx] === q.correctIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-8 h-8 rounded-md text-xs font-mono font-semibold border transition-colors ${
                    idx === currentIdx
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : checked
                        ? ok
                          ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-red-300 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                        : selectedAnswers[idx] !== undefined
                          ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 text-blue-800'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              Score: {scoreCount}/{Object.keys(checkedMap).length} · Checked: {Object.keys(checkedMap).length}/{sessionQuestions.length}
            </span>
            <button
              type="button"
              disabled={!isAuthenticated}
              onClick={() => onToggleBookmark(currentQ.id, `${currentQ.topicTitle}: ${currentQ.question.slice(0, 60)}…`)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 ${
                bookmarkedQuestionIds.has(currentQ.id)
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {bookmarkedQuestionIds.has(currentQ.id) ? 'Bookmarked' : 'Bookmark'}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Question {currentIdx + 1} of {sessionQuestions.length} · {currentQ.topicTitle} · Difficulty: {currentQ.difficulty} · ID: {currentQ.id}
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
            <MathText text={currentQ.question} />
          </h2>
        </div>

        <div className="space-y-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswers[currentIdx] === idx;
            const isChecked = Boolean(checkedMap[currentIdx]);
            const isRight = idx === currentQ.correctIndex;

            let borderCls =
              'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/70 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200';
            if (isChecked) {
              if (isRight) {
                borderCls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
              } else if (isSelected) {
                borderCls = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
              }
            } else if (isSelected) {
              borderCls = 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isChecked}
                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: idx }))}
                className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors flex items-start justify-between gap-3 ${borderCls}`}
              >
                <div>
                  <span className="font-mono font-semibold mr-2.5">{String.fromCharCode(65 + idx)}.</span>
                  <MathText text={opt} />
                </div>
                {isChecked && isRight && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {isChecked && !isRight && isSelected && <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-medium inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              type="button"
              disabled={currentIdx === sessionQuestions.length - 1}
              onClick={() => setCurrentIdx((i) => Math.min(sessionQuestions.length - 1, i + 1))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-medium inline-flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!checkedMap[currentIdx] ? (
              <button
                type="button"
                disabled={selectedAnswers[currentIdx] === undefined}
                onClick={handleCheck}
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium"
              >
                Check Answer
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleFinishSession}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium"
            >
              Finish & Score Set
            </button>
          </div>
        </div>

        {/* Immediate Feedback After Submission */}
        {checkedMap[currentIdx] && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={`text-sm font-semibold ${
                selectedAnswers[currentIdx] === currentQ.correctIndex
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {selectedAnswers[currentIdx] === currentQ.correctIndex
                  ? 'Correct!'
                  : `Incorrect — Correct Option is ${String.fromCharCode(65 + currentQ.correctIndex)}`}
              </div>
              <MathFormula latex={currentQ.formula} className="text-xs text-slate-600 dark:text-slate-300" />
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300">
              <MathText text={currentQ.correctExplanation} />
            </p>

            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Option-by-Option Analysis:
              </div>
              {currentQ.options.map((opt, idx) => (
                <div key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">
                    <span className="font-mono">{String.fromCharCode(65 + idx)}</span> (<MathText text={opt} />):
                  </span>{' '}
                  <MathText text={currentQ.distractorExplanations[idx]} />
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Step-by-Step Solution:</div>
              {currentQ.stepByStep.map((s, i) => (
                <div key={i} className="text-xs text-slate-600 dark:text-slate-400">
                  • <MathText text={s} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

interface MockExamPageProps {
  customApprovedQuestions: PracticeQuestion[];
  isAuthenticated: boolean;
  onSaveExamResult: (payload: {
    questionCount: number;
    score: number;
    percentage: number;
    timeSeconds: number;
    topicBreakdown: Record<string, { correct: number; total: number }>;
    mistakes: Array<{
      questionId: string;
      topicId: string;
      questionText: string;
      previousAnswer: string;
      correctAnswer: string;
      explanation: string;
    }>;
  }) => void;
}

export function MockExamPage({
  customApprovedQuestions,
  isAuthenticated,
  onSaveExamResult,
}: MockExamPageProps) {
  const allQuestions = useMemo(
    () => [...getVerifiedQuestionBank(), ...customApprovedQuestions],
    [customApprovedQuestions]
  );

  const [examSize, setExamSize] = useState<10 | 20 | 30 | 50 | 70>(20);
  const [timeMinutes, setTimeMinutes] = useState<number>(25);
  const [examQuestions, setExamQuestions] = useState<PracticeQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [activeJumpIdx, setActiveJumpIdx] = useState<number>(0);

  const submitExam = (qs: PracticeQuestion[], ansMap: Record<number, number>, remaining: number) => {
    setConfirmSubmitOpen(false);
    setSubmitted(true);
    let score = 0;
    const breakdown: Record<string, { correct: number; total: number }> = {};
    const mistakes: Array<{
      questionId: string;
      topicId: string;
      questionText: string;
      previousAnswer: string;
      correctAnswer: string;
      explanation: string;
    }> = [];

    qs.forEach((q, idx) => {
      if (!breakdown[q.topicTitle]) breakdown[q.topicTitle] = { correct: 0, total: 0 };
      breakdown[q.topicTitle].total++;
      const chosen = ansMap[idx];
      if (chosen === q.correctIndex) {
        score++;
        breakdown[q.topicTitle].correct++;
      } else {
        mistakes.push({
          questionId: q.id,
          topicId: q.topicId,
          questionText: q.question,
          previousAnswer: chosen !== undefined ? q.options[chosen] : 'Unanswered',
          correctAnswer: q.options[q.correctIndex],
          explanation: q.correctExplanation,
        });
      }
    });

    if (isAuthenticated) {
      onSaveExamResult({
        questionCount: qs.length,
        score,
        percentage: (score / qs.length) * 100,
        timeSeconds: Math.max(0, timeMinutes * 60 - remaining),
        topicBreakdown: breakdown,
        mistakes,
      });
    }
  };

  useEffect(() => {
    if (!examQuestions || submitted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(examQuestions, answers, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  });

  const startExam = () => {
    const selected = shuffleArray(allQuestions).slice(0, examSize);
    setExamQuestions(selected);
    setAnswers({});
    setSecondsLeft(timeMinutes * 60);
    setSubmitted(false);
    setConfirmSubmitOpen(false);
    setActiveJumpIdx(0);
  };

  const jumpToQuestion = (idx: number) => {
    setActiveJumpIdx(idx);
    const el = document.getElementById(`exam-q-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!examQuestions) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Mock Examination System
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Strict examination mode: explanations and answer keys remain hidden until submission or automatic expiry.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Question Count
            </label>
            <div className="flex flex-wrap gap-2">
              {([10, 20, 30, 50, 70] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setExamSize(cnt);
                    setTimeMinutes(Math.round(cnt * 1.2));
                  }}
                  className={`px-4 py-2 rounded-lg border text-xs font-mono font-semibold ${
                    examSize === cnt
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cnt} Questions
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Time Limit (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(Math.max(5, Number(e.target.value)))}
              className="h-9 w-28 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={startExam}
          className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium"
        >
          Begin {examSize}-Question Examination
        </button>
      </div>
    );
  }

  const totalScore = examQuestions.reduce(
    (s, q, i) => (answers[i] === q.correctIndex ? s + 1 : s),
    0
  );
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const unansweredIndices = examQuestions
    .map((_, idx) => idx)
    .filter((idx) => answers[idx] === undefined);

  const topicBreakdownEntries = Object.entries(
    examQuestions.reduce<Record<string, { correct: number; total: number }>>((acc, q, idx) => {
      if (!acc[q.topicTitle]) acc[q.topicTitle] = { correct: 0, total: 0 };
      acc[q.topicTitle].total++;
      if (answers[idx] === q.correctIndex) acc[q.topicTitle].correct++;
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Mock Exam ({examQuestions.length} Questions) · Answered {Object.keys(answers).length}/{examQuestions.length}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-mono font-semibold tabular-nums ${secondsLeft < 60 && !submitted ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {submitted ? 'Submitted' : `${mins}:${String(secs).padStart(2, '0')} remaining`}
            </span>
            {!submitted ? (
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium whitespace-nowrap"
              >
                Review & Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setExamQuestions(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium whitespace-nowrap"
              >
                New Exam
              </button>
            )}
          </div>
        </div>

        {/* Question Navigation Palette */}
        <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
          {examQuestions.map((q, idx) => {
            const isAnswered = answers[idx] !== undefined;
            const isCorrect = answers[idx] === q.correctIndex;
            const isActive = activeJumpIdx === idx;
            let cls =
              'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60';
            if (submitted) {
              cls = isCorrect
                ? 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-red-500/70 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
            } else if (isAnswered) {
              cls = 'border-blue-500 bg-blue-600 text-white';
            }
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => jumpToQuestion(idx)}
                className={`w-7 h-7 rounded text-[11px] font-mono font-semibold border transition-colors ${cls} ${
                  isActive ? 'ring-2 ring-blue-400' : ''
                }`}
                title={`Jump to Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Review & Confirmation Modal */}
      {confirmSubmitOpen && !submitted && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Review Exam Before Final Submission
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Answered</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {examQuestions.length - unansweredIndices.length} / {examQuestions.length}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">Unanswered</div>
                <div className={`text-lg font-bold font-mono mt-0.5 ${unansweredIndices.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {unansweredIndices.length}
                </div>
              </div>
            </div>

            {unansweredIndices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Unanswered questions (click any number to jump back):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {unansweredIndices.map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setConfirmSubmitOpen(false);
                        jumpToQuestion(idx);
                      }}
                      className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-xs font-mono font-semibold text-amber-800 dark:text-amber-200"
                    >
                      Q{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => submitExam(examQuestions, answers, secondsLeft)}
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium"
              >
                Confirm & Grade Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {submitted && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Examination Score: {totalScore} / {examQuestions.length} ({Math.round((totalScore / examQuestions.length) * 100)}%)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Incorrect answers have been automatically added to your Mistake Notebook (when signed in). Full explanations are unlocked below.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {topicBreakdownEntries.map(([topicTitle, st]) => {
              const pct = Math.round((st.correct / st.total) * 100);
              return (
                <div key={topicTitle} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{topicTitle}</div>
                  <div className="font-mono text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
                    {st.correct}/{st.total} correct ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {examQuestions.map((q, idx) => {
          const chosen = answers[idx];
          const isOk = chosen === q.correctIndex;
          return (
            <div
              key={q.id}
              id={`exam-q-${idx}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {idx + 1}. <MathText text={q.question} />
                </div>
                {submitted && (
                  <span className={`text-xs font-semibold shrink-0 ${isOk ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isOk ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, optIdx) => {
                  const sel = chosen === optIdx;
                  const right = optIdx === q.correctIndex;
                  let cls = 'border-slate-200 dark:border-slate-800 hover:border-blue-400';
                  if (submitted) {
                    if (right) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-medium';
                    else if (sel) cls = 'border-red-500 bg-red-50 dark:bg-red-950/40';
                  } else if (sel) {
                    cls = 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 font-medium';
                  }
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                      className={`text-left p-2.5 rounded-lg border text-xs ${cls}`}
                    >
                      <span className="font-mono font-semibold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                      <MathText text={opt} />
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Explanation:</span> <MathText text={q.correctExplanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
