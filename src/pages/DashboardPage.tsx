import {
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Calculator,
  CheckCircle2,
  Compass,
  FlaskConical,
  Globe,
  Layers,
  Presentation,
} from 'lucide-react';
import { useMemo } from 'react';
import { DailyAlgebraChallenge } from '../components/DailyAlgebraChallenge.tsx';
import { MathText } from '../components/MathFormula.tsx';
import { REAL_WORLD_SCENARIOS } from '../core/realWorldEngine.ts';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { getVerifiedQuestionBank } from '../data/questionBank.ts';

export interface StudentProgressState {
  topics: Array<{ topic_id: string; completed: number; updated_at: string }>;
  practice: Array<{ id: number; topic_id: string; difficulty: string; score: number; total: number; time_seconds: number; created_at: string }>;
  exams: Array<{ id: number; question_count: number; score: number; percentage: number; time_seconds: number; topic_breakdown_json: string; created_at: string }>;
  bookmarks: Array<{ id: number; item_type: 'topic' | 'question'; item_id: string; label: string; created_at: string }>;
  mistakes: Array<{ id: number; question_id: string; topic_id: string; question_text: string; previous_answer: string; correct_answer: string; explanation: string; mastered: number; attempts: number; updated_at: string }>;
  activity: Array<{ id: number; activity_type: string; summary: string; created_at: string }>;
}

interface DashboardPageProps {
  onNavigate: (page: string, topicId?: string) => void;
  onStartPresenter?: () => void;
  progress: StudentProgressState | null;
  userDisplayName: string | null;
}

export function DashboardPage({ onNavigate, onStartPresenter, progress, userDisplayName }: DashboardPageProps) {
  const bank = useMemo(() => getVerifiedQuestionBank(), []);
  const completedTopicIds = new Set(
    (progress?.topics ?? []).filter((t) => t.completed === 1).map((t) => t.topic_id)
  );
  const completedCount = completedTopicIds.size;

  const totalAttempted = (progress?.practice ?? []).reduce((s, p) => s + p.total, 0);
  const totalCorrect = (progress?.practice ?? []).reduce((s, p) => s + p.score, 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const recommendedTopic =
    LEARNING_TOPICS.find((t) => !completedTopicIds.has(t.id)) ?? LEARNING_TOPICS[0];

  return (
    <div className="space-y-6">
      {/* Hero / Welcome Banner */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Algebra II · Artifact 2 Computational & Learning Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              {userDisplayName ? `Welcome back, ${userDisplayName}` : 'Master Cosets, Normal Subgroups & Quotient Groups'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              AlgebraLab pairs a verified finite group-theory engine with interactive coset partitions, quotient Cayley tables, guided Artifact 2 proofs, and an ever-fresh vault of calculation-checked problems across every topic.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('cosets')}
              className="px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              Open Coset Visualizer
            </button>
            <button
              type="button"
              onClick={() => onNavigate('artifact2')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Compass className="w-4 h-4" />
              Artifact 2 Exercises
            </button>
            <button
              type="button"
              onClick={() => onNavigate('real-world')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Real-World Problems
            </button>
            {onStartPresenter && (
              <button
                type="button"
                onClick={onStartPresenter}
                className="px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
              >
                <Presentation className="w-4 h-4" />
                Classroom Demo Tour
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Learning Topics</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {completedCount} / {LEARNING_TOPICS.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Completed modules</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Practice Problem Vault</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            Adaptive
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fresh draws · 3 difficulty tiers</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Questions Attempted</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {totalAttempted}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {progress?.practice.length ?? 0} practice sessions
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Overall Accuracy</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {accuracy}%
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {progress ? `${totalCorrect} correct answers` : 'Sign in to track progress'}
          </div>
        </div>
      </section>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Daily Algebra Challenge + Core Calculators */}
        <div className="lg:col-span-2 space-y-6">
          <DailyAlgebraChallenge bank={bank} onNavigate={onNavigate} />

          {/* Learning Progress & Quick Calculators */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Core Computational Calculators
              </h2>
              <Calculator className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { id: 'group-explorer', title: 'Group Explorer', sub: 'Axioms & Cayley tables' },
                { id: 'cosets', title: 'Coset Visualizer', sub: 'Left/right coset partition' },
                { id: 'lagrange', title: 'Lagrange Verifier', sub: '|G| = |H| × [G:H] & A₄' },
                { id: 'normality', title: 'Normality Tester', sub: 'gHg⁻¹ = H & gH = Hg' },
                { id: 'quotient', title: 'Quotient Builder', sub: 'G/H tables & coset orders' },
                { id: 'classification', title: 'Abelian Classifier', sub: 'Invariant factors & FTFGAG' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onNavigate(tool.id)}
                  className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{tool.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <MathText text={tool.sub} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-World Problem Applications Module */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Real-World Problem Simulators
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explore where cosets, Lagrange’s theorem, normalizers, centralizers, and quotients power real engineering systems.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('real-world')}
                className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Open Interactive Lab
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {REAL_WORLD_SCENARIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate('real-world', item.id)}
                  className="text-left p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                      <MathText text={item.algebraTopic} />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      <MathText text={item.summary} />
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="truncate">{item.domain}</span>
                    <ArrowRight className="w-3 h-3 shrink-0 text-blue-600 dark:text-blue-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Topic, Bookmarks, Recent Activity */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recommended Next Topic
              </h2>
              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Topic {recommendedTopic.number} · {recommendedTopic.estimatedMinutes} min
              </div>
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {recommendedTopic.title}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                <MathText text={recommendedTopic.subtitle} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('learn', recommendedTopic.id)}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium inline-flex items-center justify-center gap-1.5"
            >
              Study Topic {recommendedTopic.number}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Topic Completion List */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Curriculum Progress
              </h2>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              {LEARNING_TOPICS.map((t) => {
                const done = completedTopicIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onNavigate('learn', t.id)}
                    className="w-full flex items-center justify-between gap-2 text-left py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {t.number}. {t.title}
                    </span>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">Pending</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Bookmarks & Activity */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Bookmarks & Activity
              </h2>
              <Bookmark className="w-4 h-4 text-slate-400" />
            </div>
            {!progress ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in or register in the top bar to save topic completions, bookmarks, practice scores, and your Mistake Notebook.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {progress.bookmarks.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate"><MathText text={b.label} /></span>
                  </div>
                ))}
                {progress.activity.slice(0, 4).map((a) => (
                  <div key={a.id} className="text-slate-500 dark:text-slate-400 truncate">
                    {a.created_at.slice(0, 10)} · <MathText text={a.summary} />
                  </div>
                ))}
                {progress.bookmarks.length === 0 && progress.activity.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400">No saved activity yet. Try a 10-question practice session!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
