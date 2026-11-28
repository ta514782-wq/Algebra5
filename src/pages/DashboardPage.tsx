import {
  ArrowRight,
  Award,
  Bookmark,
  BookOpen,
  Calculator,
  CheckCircle2,
  Compass,
  Flame,
  FlaskConical,
  Globe,
  Layers,
  Presentation,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { DailyAlgebraChallenge } from '../components/DailyAlgebraChallenge.tsx';
import { MathText } from '../components/MathFormula.tsx';
import { StudentPerformanceCharts } from '../components/ProgressCharts.tsx';
import { computeDailyStreak, loadDailyChallengeState } from '../core/dailyChallengeEngine.ts';
import { REAL_WORLD_SCENARIOS } from '../core/realWorldEngine.ts';
import { FORMULA_LIBRARY, GLOSSARY_ENTRIES } from '../data/glossaryAndFormulas.ts';
import { getVerifiedQuestionBank } from '../data/questionBank.ts';
import { LEARNING_TOPICS, LearningTopic } from '../data/topics.ts';

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
  customTopics?: LearningTopic[];
}

const SIMULATOR_GRID_ITEMS: Array<{ id: string; title: string; sub: string; category: string }> = [
  { id: 'group-explorer', title: 'Group Explorer', sub: 'Axioms, Cayley tables & element orders', category: 'Foundations' },
  { id: 'subgroups', title: 'Subgroup Finder', sub: 'Subset axioms, ⟨S⟩ closure & Hasse lattice', category: 'Subgroups' },
  { id: 'cosets', title: 'Coset Visualizer', sub: 'Left/right cosets & membership tester', category: 'Cosets' },
  { id: 'lagrange', title: 'Lagrange Verifier', sub: '|G| = |H| × [G:H] & A₄ converse lab', category: 'Theorems' },
  { id: 'normality', title: 'Normality Tester', sub: 'gHg⁻¹ = H & conjugation witnesses', category: 'Normality' },
  { id: 'normalizer', title: 'Normalizer N_G(H)', sub: 'Largest subgroup normalizing H', category: 'Subgroups' },
  { id: 'centralizer', title: 'Centralizer C_G(S)', sub: 'Elements commuting with S', category: 'Commutativity' },
  { id: 'centre', title: 'Centre Z(G)', sub: 'Global commuting elements & Z(G) ◁ G', category: 'Commutativity' },
  { id: 'quotient', title: 'Quotient Builder', sub: 'G/H tables, coset orders & structure', category: 'Quotients' },
  { id: 'homomorphism', title: 'First Isomorphism', sub: 'ker(φ), Im(φ) & G/ker(φ) ≅ Im(φ)', category: 'Morphisms' },
  { id: 'sylow', title: 'Sylow & Cayley Lab', sub: 'p-subgroups & G ↪ Sₙ embeddings', category: 'Structure' },
  { id: 'classification', title: 'Abelian Classifier', sub: 'Invariant factors & elementary divisors', category: 'FTFGAG' },
  { id: 'conjugacy', title: 'Conjugacy Classes', sub: 'Orbits, class sizes & class equation', category: 'Actions' },
  { id: 'compare', title: 'Group Comparison', sub: 'Side-by-side invariant isomorphism check', category: 'Compare' },
];

export function DashboardPage({ onNavigate, onStartPresenter, progress, userDisplayName, customTopics }: DashboardPageProps) {
  const allTopics = useMemo(
    () => [...LEARNING_TOPICS, ...(customTopics ?? [])],
    [customTopics]
  );
  const bank = useMemo(() => getVerifiedQuestionBank(), []);
  const dailyStreak = useMemo(() => {
    const state = loadDailyChallengeState();
    return computeDailyStreak(state.attemptsByDate);
  }, []);

  const refBookmarks = useMemo(() => {
    if (typeof window === 'undefined') return [] as Array<{ id: string; label: string; page: string }>;
    try {
      const raw = window.localStorage.getItem('algebralab.refBookmarks.v1');
      if (!raw) return [];
      const keys = JSON.parse(raw) as string[];
      if (!Array.isArray(keys)) return [];
      const items: Array<{ id: string; label: string; page: string }> = [];
      for (const k of keys) {
        if (k.startsWith('f:')) {
          const f = FORMULA_LIBRARY.find((x) => x.id === k.slice(2));
          if (f) items.push({ id: k, label: f.name, page: 'formulas' });
        } else if (k.startsWith('g:')) {
          const g = GLOSSARY_ENTRIES.find((x) => x.term === k.slice(2));
          if (g) items.push({ id: k, label: g.term, page: 'glossary' });
        }
      }
      return items;
    } catch {
      return [];
    }
  }, []);

  const completedTopicIds = new Set(
    (progress?.topics ?? []).filter((t) => t.completed === 1).map((t) => t.topic_id)
  );
  const completedCount = completedTopicIds.size;
  const curriculumPct = Math.round((completedCount / allTopics.length) * 100);

  const totalAttempted = (progress?.practice ?? []).reduce((s, p) => s + p.total, 0);
  const totalCorrect = (progress?.practice ?? []).reduce((s, p) => s + p.score, 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const hasChartData = (progress?.practice.length ?? 0) > 0 || (progress?.exams.length ?? 0) > 0;

  const recommendedTopic =
    allTopics.find((t) => !completedTopicIds.has(t.id)) ?? allTopics[0];

  return (
    <div className="space-y-6">
      {/* Hero / Welcome Banner */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-blue-700 dark:text-blue-400">
              AlgebraLab · Learn. Visualize. Calculate. Experiment. Master.
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              {userDisplayName ? `Welcome back, ${userDisplayName}` : 'Master Cosets, Normal Subgroups & Quotient Groups'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Verified finite group-theory workspace uniting interactive coset partitions, D3 subgroup lattices, quotient Cayley tables, guided Artifact 2 proofs, and adaptive exam preparation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('cosets')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              Open Coset Visualizer
            </button>
            <button
              type="button"
              onClick={() => onNavigate('artifact2')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Compass className="w-4 h-4" />
              Guided Problems
            </button>
            <button
              type="button"
              onClick={() => onNavigate('proof-assistant')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Proof Assistant
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

      {/* 6-Metric Overview Strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">Learning Modules</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {completedCount} / {allTopics.length}
          </div>
          <div className="mt-2 space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${curriculumPct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{curriculumPct}% completed</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Live Simulators</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {SIMULATOR_GRID_ITEMS.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Group, D3 & Sylow engines</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Questions Completed</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {totalAttempted}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {progress?.practice.length ?? 0} quiz sessions
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Average Quiz Score</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {accuracy}%
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {progress ? `${totalCorrect} verified correct` : 'Sign in to track scores'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Daily Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {dailyStreak.currentStreak}d
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {dailyStreak.totalCompleted} daily challenges done
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Exam Vault</div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {bank.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">3 difficulty tiers · 7 topics</div>
        </div>
      </section>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Daily Challenge + Complete Simulator Grid + Real-World + Performance */}
        <div className="lg:col-span-2 space-y-6">
          <DailyAlgebraChallenge bank={bank} onNavigate={onNavigate} />

          {/* Complete Computational Simulators Grid */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Interactive Mathematical Simulators
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Launch any deterministic Algebra II computational workbench directly.
                </p>
              </div>
              <Calculator className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {SIMULATOR_GRID_ITEMS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onNavigate(tool.id)}
                  className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors"
                >
                  <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400">{tool.category}</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{tool.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <MathText text={tool.sub} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Performance Trend Chart (or Clean Empty State) */}
          {hasChartData && progress ? (
            <StudentPerformanceCharts progress={progress} />
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Performance & Accuracy Analytics
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete a 10-question practice session or mock exam while signed in to plot your live accuracy curve, or preview analytics in Local Demo Mode.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('practice')}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
                >
                  Start Practice Quiz
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('progress')}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                >
                  Student Analytics
                </button>
              </div>
            </div>
          )}

          {/* Real-World Problem Applications Module */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-4">
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
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
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
                  className="text-left p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors flex flex-col justify-between gap-2"
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

        {/* Right Column: Recommended Topic, Curriculum Progress, Assessment/Teacher Access, Bookmarks */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-3">
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
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {allTopics.length} Curriculum Modules
              </h2>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-1.5">
              {allTopics.map((t) => {
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
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">Study</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assessment, AI & Teacher Quick Access */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Practice, Proofs & Instructor Tools
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'practice', label: 'Practice MCQs' },
                { id: 'exams', label: 'Mock Exams' },
                { id: 'solver', label: 'Step Solver' },
                { id: 'proof-assistant', label: 'Proof Assistant' },
                { id: 'tutor', label: 'AI Tutor' },
                { id: 'formulas', label: 'Formula Cheat Sheet' },
                { id: 'mistakes', label: 'Mistake Notebook' },
                { id: 'teacher', label: 'Teacher Panel' },
              ].map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNavigate(link.id)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left font-medium text-slate-700 dark:text-slate-300 transition-colors truncate"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Bookmarks & Activity */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Bookmarks & Activity
              </h2>
              <Bookmark className="w-4 h-4 text-slate-400" />
            </div>
            {!progress && refBookmarks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bookmark concepts in the Formula Library or Glossary, or sign in to sync topic completions, practice scores, and your Mistake Notebook.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {(progress?.bookmarks ?? []).slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate"><MathText text={b.label} /></span>
                  </div>
                ))}
                {refBookmarks.slice(0, 4).map((rb) => (
                  <button
                    key={rb.id}
                    type="button"
                    onClick={() => onNavigate(rb.page)}
                    className="w-full flex items-center gap-2 text-left text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate"><MathText text={rb.label} /></span>
                  </button>
                ))}
                {(progress?.activity ?? []).slice(0, 4).map((a) => (
                  <div key={a.id} className="text-slate-500 dark:text-slate-400 truncate">
                    {a.created_at.slice(0, 10)} · <MathText text={a.summary} />
                  </div>
                ))}
                {progress && progress.bookmarks.length === 0 && refBookmarks.length === 0 && progress.activity.length === 0 && (
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
