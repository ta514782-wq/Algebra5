import { Check, Clock, Download, Edit3, Plus, Shield, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MathText } from '../components/MathFormula.tsx';
import { StudentPerformanceCharts } from '../components/ProgressCharts.tsx';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { downloadCsv, downloadPerformancePdf } from '../utils/pdfExport.ts';
import { StudentProgressState } from './DashboardPage.tsx';

const LOCAL_DEMO_KEY = 'algebralab.localDemoProgress.v1';

function buildLocalDemoProgress(): StudentProgressState {
  return {
    topics: [
      { topic_id: 'cosets', completed: 1, updated_at: '2026-11-20' },
      { topic_id: 'lagrange', completed: 1, updated_at: '2026-11-21' },
      { topic_id: 'normal-subgroups', completed: 1, updated_at: '2026-11-22' },
      { topic_id: 'quotient-groups', completed: 0, updated_at: '2026-11-24' },
    ],
    practice: [
      { id: 1, topic_id: 'cosets', difficulty: 'easy', score: 9, total: 10, time_seconds: 340, created_at: '2026-11-20' },
      { id: 2, topic_id: 'lagrange', difficulty: 'medium', score: 8, total: 10, time_seconds: 410, created_at: '2026-11-21' },
      { id: 3, topic_id: 'normal-subgroups', difficulty: 'medium', score: 8, total: 10, time_seconds: 395, created_at: '2026-11-22' },
      { id: 4, topic_id: 'quotient-groups', difficulty: 'advanced', score: 6, total: 10, time_seconds: 480, created_at: '2026-11-24' },
      { id: 5, topic_id: 'normalizer-centralizer', difficulty: 'medium', score: 5, total: 10, time_seconds: 460, created_at: '2026-11-25' },
    ],
    exams: [
      { id: 1, question_count: 20, score: 16, percentage: 80, time_seconds: 980, topic_breakdown_json: '{}', created_at: '2026-11-25' },
    ],
    bookmarks: [],
    mistakes: [
      {
        id: 1,
        question_id: 'norm-med-02',
        topic_id: 'normalizer-centralizer',
        question_text: 'Contrast N_{S₃}(⟨(1 2)⟩) and C_{S₃}((1 2))',
        previous_answer: 'Order 6',
        correct_answer: 'Order 2',
        explanation: 'Transposition (1 2) has 3 conjugates in S₃, so its normalizer has index 3 and order 2.',
        mastered: 0,
        attempts: 1,
        updated_at: '2026-11-25',
      },
    ],
    activity: [],
  };
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function StudentProgressPage({
  progress,
  username,
  isAuthenticated,
}: {
  progress: StudentProgressState | null;
  username: string | null;
  isAuthenticated: boolean;
}) {
  const [demoEnabled, setDemoEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(LOCAL_DEMO_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleDemoMode = (next: boolean) => {
    setDemoEnabled(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_DEMO_KEY, next ? 'true' : 'false');
      } catch {
        // ignore storage errors
      }
    }
  };

  const demoProgress = useMemo(() => buildLocalDemoProgress(), []);
  const activeProgress = isAuthenticated && progress ? progress : demoEnabled ? demoProgress : null;
  const activeName = isAuthenticated && username ? username : 'Demo Student';
  const isDemoView = !isAuthenticated && demoEnabled;

  if (!activeProgress) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Student Progress & Analytics
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Sign in or register in the top bar to persist your topic completions, quiz accuracy, mock exam scores, and export CSV/PDF performance reports — or preview the analytics dashboard in Local Demo Mode.
        </p>
        <button
          type="button"
          onClick={() => toggleDemoMode(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Enable Local Demo Mode
        </button>
      </div>
    );
  }

  const completedTopics = activeProgress.topics.filter((t) => t.completed === 1).length;
  const totalAttempted = activeProgress.practice.reduce((s, p) => s + p.total, 0);
  const totalCorrect = activeProgress.practice.reduce((s, p) => s + p.score, 0);
  const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  const totalTimeSec =
    activeProgress.practice.reduce((s, p) => s + (p.time_seconds || 0), 0) +
    activeProgress.exams.reduce((s, e) => s + (e.time_seconds || 0), 0);

  // Compute topic-by-topic accuracy
  const topicPerf = new Map<string, { score: number; total: number }>();
  for (const p of activeProgress.practice) {
    const cur = topicPerf.get(p.topic_id) ?? { score: 0, total: 0 };
    cur.score += p.score;
    cur.total += p.total;
    topicPerf.set(p.topic_id, cur);
  }

  const topicStats = Array.from(topicPerf.entries()).map(([tid, stats]) => ({
    topicId: tid,
    title: LEARNING_TOPICS.find((t) => t.id === tid)?.title ?? tid,
    score: stats.score,
    total: stats.total,
    pct: stats.total > 0 ? Math.round((stats.score / stats.total) * 100) : 0,
  }));
  const strongTopics = topicStats.filter((t) => t.pct >= 75);
  const weakTopics = topicStats.filter((t) => t.pct < 75);
  const unmasteredMistakes = activeProgress.mistakes.filter((m) => m.mastered === 0);

  const handleExportCsv = () => {
    downloadCsv(
      `AlgebraLab_Progress_${activeName}.csv`,
      ['Type', 'Topic / Count', 'Score', 'Total', 'Date'],
      [
        ...activeProgress.practice.map((p) => ['Practice', p.topic_id, p.score, p.total, p.created_at]),
        ...activeProgress.exams.map((e) => ['Mock Exam', `${e.question_count} Qs`, e.score, e.question_count, e.created_at]),
      ]
    );
  };

  const handleExportPdf = () => {
    downloadPerformancePdf({
      username: activeName,
      completedTopics,
      totalTopics: LEARNING_TOPICS.length,
      practiceCount: activeProgress.practice.length,
      accuracyPercent: accuracy,
      exams: activeProgress.exams,
      practice: activeProgress.practice,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Student Progress — {activeName}
            </h1>
            {isDemoView && (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                · Local Demo Mode (Sample Telemetry)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Completed Topics: {completedTopics}/{LEARNING_TOPICS.length} · Practice Accuracy: {accuracy.toFixed(1)}% · Mock Exams: {activeProgress.exams.length} · Study Time: {formatDuration(totalTimeSec)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDemoView && (
            <button
              type="button"
              onClick={() => toggleDemoMode(false)}
              className="px-3.5 py-2 rounded-lg border border-amber-400/70 text-amber-700 dark:text-amber-300 text-xs font-medium"
            >
              Exit Demo Mode
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Strong vs Weak Topics + Time Spent + Revision Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Strong Topics (≥ 75%)
          </div>
          {strongTopics.length === 0 ? (
            <p className="text-xs text-slate-500">Complete sets at ≥ 75% accuracy to highlight mastered topics.</p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {strongTopics.map((t) => (
                <li key={t.topicId} className="flex justify-between gap-2">
                  <span className="truncate">{t.title}</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{t.pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Needs Review (&lt; 75%)
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-slate-500">No weak topics detected across logged sessions.</p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {weakTopics.map((t) => (
                <li key={t.topicId} className="flex justify-between gap-2">
                  <span className="truncate">{t.title}</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">{t.pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>Revision Recommendations</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {weakTopics.length > 0
              ? `Focus next on ${weakTopics.map((w) => w.title).join(', ')}, plus ${unmasteredMistakes.length} active mistake(s) in your Mistake Notebook.`
              : unmasteredMistakes.length > 0
                ? `Review ${unmasteredMistakes.length} active mistake(s) in your Mistake Notebook to cement full accuracy.`
                : `Great pace (${formatDuration(totalTimeSec)} logged). Challenge yourself with a 30-question Mock Exam.`}
          </p>
        </div>
      </div>

      {/* Topic Performance Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Topic Performance Breakdown
        </h2>
        {topicPerf.size === 0 ? (
          <p className="text-xs text-slate-500">Complete a practice session to visualize your topic accuracy.</p>
        ) : (
          <div className="space-y-2.5">
            {topicStats.map((stats) => (
              <div key={stats.topicId} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>{stats.title}</span>
                  <span>
                    {stats.score}/{stats.total} ({stats.pct}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stats.pct >= 75 ? 'bg-emerald-600' : stats.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StudentPerformanceCharts progress={activeProgress} />

      {/* Practice & Exam History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Practice History
          </h2>
          {activeProgress.practice.length === 0 ? (
            <p className="text-xs text-slate-500">No practice sessions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 text-left">Topic</th>
                    <th className="py-2 text-left">Difficulty</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProgress.practice.slice(0, 15).map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="py-1.5">{p.topic_id}</td>
                      <td className="py-1.5">{p.difficulty}</td>
                      <td className="py-1.5 text-right font-semibold">
                        {p.score}/{p.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Mock Examination History
          </h2>
          {activeProgress.exams.length === 0 ? (
            <p className="text-xs text-slate-500">No mock examinations completed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-right">Questions</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProgress.exams.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="py-1.5">{e.created_at.slice(0, 10)}</td>
                      <td className="py-1.5 text-right">{e.question_count}</td>
                      <td className="py-1.5 text-right font-semibold">
                        {e.score}/{e.question_count} ({e.percentage.toFixed(0)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TeacherPanelProps {
  token: string | null;
  userRole: 'student' | 'teacher' | null;
  teacherClaimed: boolean;
  envAdminConfigured: boolean;
  onAuthSuccess: (token: string, user: { id: number; username: string; display_name: string; email: string; role: 'student' | 'teacher' }) => void;
  onRefreshContent: () => void;
}

interface TeacherOverview {
  students: Array<{
    id: number;
    username: string;
    display_name: string;
    practice_count: number;
    total_score: number;
    total_attempted: number;
    exam_count: number;
    completed_topics: number;
  }>;
  customModules?: Array<{
    id: string;
    title: string;
    subtitle: string;
    estimated_minutes: number;
    introduction: string;
    objectives_json: string;
    common_mistakes_json: string;
    revision_notes_json: string;
    created_at: string;
  }>;
  customNotes: Array<{ id: number; topic_id: string; title: string; content: string; created_at: string }>;
  customQuestions: Array<{
    id: string;
    topic_id: string;
    difficulty: string;
    question: string;
    options_json: string;
    correct_index: number;
    explanation: string;
    status: string;
  }>;
  difficultMistakes: Array<{ question_id: string; topic_id: string; question_text: string; miss_count: number }>;
}

export function TeacherAdminPage({
  token,
  userRole,
  teacherClaimed,
  envAdminConfigured,
  onAuthSuccess,
  onRefreshContent,
}: TeacherPanelProps) {
  const [passcode, setPasscode] = useState('');
  const [username, setUsername] = useState('professor');
  const [displayName, setDisplayName] = useState('Course Professor');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [noteTopic, setNoteTopic] = useState(LEARNING_TOPICS[0].id);
  const [noteKind, setNoteKind] = useState<'Note' | 'Theorem' | 'Solved Example' | 'Resource'>('Note');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [qTopic, setQTopic] = useState(LEARNING_TOPICS[0].id);
  const [qDiff, setQDiff] = useState<'easy' | 'medium' | 'advanced'>('medium');
  const [qPrompt, setQPrompt] = useState('');
  const [qOpts, setQOpts] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExpl, setQExpl] = useState('');
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Edit note & edit question state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteTopic, setEditNoteTopic] = useState(LEARNING_TOPICS[0].id);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');

  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editQTopic, setEditQTopic] = useState(LEARNING_TOPICS[0].id);
  const [editQDiff, setEditQDiff] = useState<'easy' | 'medium' | 'advanced'>('medium');
  const [editQPrompt, setEditQPrompt] = useState('');
  const [editQOpts, setEditQOpts] = useState(['', '', '', '']);
  const [editQCorrect, setEditQCorrect] = useState(0);
  const [editQExpl, setEditQExpl] = useState('');

  // Create / Edit custom module state
  const [modTitle, setModTitle] = useState('');
  const [modSubtitle, setModSubtitle] = useState('');
  const [modMinutes, setModMinutes] = useState(30);
  const [modIntro, setModIntro] = useState('');
  const [modObjectives, setModObjectives] = useState('');
  const [modMistakes, setModMistakes] = useState('');
  const [modRevision, setModRevision] = useState('');
  const [editingModId, setEditingModId] = useState<string | null>(null);

  const loadOverview = async (tok: string) => {
    const resp = await fetch('/api/teacher/overview', {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (resp.ok) {
      setOverview(await resp.json());
    }
  };

  useEffect(() => {
    if (token && userRole === 'teacher') {
      loadOverview(token);
    }
  }, [token, userRole]);

  const handleTeacherAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = !envAdminConfigured && !teacherClaimed ? '/api/auth/claim-teacher' : '/api/auth/teacher-login';
    const body = envAdminConfigured
      ? { passcode }
      : !teacherClaimed
        ? { username, displayName, password }
        : { username, password };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setAuthError(data.error || 'Authentication failed.');
      return;
    }
    onAuthSuccess(data.token, data.user);
  };

  if (userRole !== 'teacher' || !token) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {!envAdminConfigured && !teacherClaimed
              ? 'First-Run Instructor Setup'
              : 'Protected Teacher & Admin Panel'}
          </h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {envAdminConfigured
            ? 'Enter the administrator passcode configured on the server.'
            : !teacherClaimed
              ? 'Claim the instructor account for this AlgebraLab instance. Passwords are hashed securely with scrypt on the server.'
              : 'Sign in with your instructor credentials to manage notes, review questions, and view class analytics.'}
        </p>

        <form onSubmit={handleTeacherAuth} className="space-y-3">
          {envAdminConfigured ? (
            <div>
              <label className="block text-xs font-medium mb-1">Administrator Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">Instructor Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              {!teacherClaimed && (
                <div>
                  <label className="block text-xs font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Password {!teacherClaimed ? '(min 8 characters)' : ''}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </>
          )}

          {authError && <p className="text-xs text-red-600">{authError}</p>}

          <button
            type="submit"
            className="w-full h-9 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium"
          >
            {!envAdminConfigured && !teacherClaimed ? 'Claim Instructor Account' : 'Sign In as Instructor'}
          </button>
        </form>
      </div>
    );
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefixedTitle = noteKind === 'Note' ? noteTitle.trim() : `[${noteKind}] ${noteTitle.trim()}`;
    const resp = await fetch('/api/teacher/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topicId: noteTopic, title: prefixedTitle, content: noteContent }),
    });
    if (resp.ok) {
      setNoteTitle('');
      setNoteContent('');
      setStatusMsg(`${noteKind} published to module.`);
      await loadOverview(token);
      onRefreshContent();
    }
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/teacher/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadOverview(token);
    onRefreshContent();
  };

  const saveEditNote = async () => {
    if (editingNoteId === null) return;
    const resp = await fetch(`/api/teacher/notes/${editingNoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topicId: editNoteTopic, title: editNoteTitle, content: editNoteContent }),
    });
    if (resp.ok) {
      setEditingNoteId(null);
      setStatusMsg('Supplemental note updated.');
      await loadOverview(token);
      onRefreshContent();
    }
  };

  const saveEditQuestion = async () => {
    if (!editingQId) return;
    const resp = await fetch(`/api/teacher/questions/${editingQId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        topicId: editQTopic,
        difficulty: editQDiff,
        question: editQPrompt,
        options: editQOpts,
        correctIndex: editQCorrect,
        explanation: editQExpl,
      }),
    });
    if (resp.ok) {
      setEditingQId(null);
      setStatusMsg('Question updated.');
      await loadOverview(token);
      onRefreshContent();
    }
  };

  const splitLines = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const saveCustomModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: modTitle,
      subtitle: modSubtitle,
      estimatedMinutes: modMinutes,
      introduction: modIntro,
      objectives: splitLines(modObjectives),
      commonMistakes: splitLines(modMistakes),
      revisionNotes: splitLines(modRevision),
    };
    const url = editingModId ? `/api/teacher/modules/${editingModId}` : '/api/teacher/modules';
    const method = editingModId ? 'PATCH' : 'POST';
    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      setModTitle('');
      setModSubtitle('');
      setModMinutes(30);
      setModIntro('');
      setModObjectives('');
      setModMistakes('');
      setModRevision('');
      setEditingModId(null);
      setStatusMsg(editingModId ? 'Custom module updated.' : 'Custom learning module created.');
      await loadOverview(token);
      onRefreshContent();
    }
  };

  const deleteCustomModule = async (id: string) => {
    await fetch(`/api/teacher/modules/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadOverview(token);
    onRefreshContent();
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const resp = await fetch('/api/teacher/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        topicId: qTopic,
        difficulty: qDiff,
        question: qPrompt,
        options: qOpts,
        correctIndex: qCorrect,
        explanation: qExpl,
        status: 'approved',
      }),
    });
    if (resp.ok) {
      setQPrompt('');
      setQOpts(['', '', '', '']);
      setQExpl('');
      setStatusMsg('Question added and approved.');
      await loadOverview(token);
      onRefreshContent();
    }
  };

  const handleBulkImport = async () => {
    try {
      let parsed: unknown[];
      if (importText.trim().startsWith('[')) {
        parsed = JSON.parse(importText);
      } else {
        // CSV lines: topicId,difficulty,question,optA,optB,optC,optD,correctIndex,explanation
        parsed = importText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            const parts = line.split(',').map((s) => s.trim());
            return {
              topicId: parts[0],
              difficulty: parts[1],
              question: parts[2],
              options: [parts[3], parts[4], parts[5], parts[6]],
              correctIndex: Number(parts[7]),
              explanation: parts[8] || 'Imported question.',
              status: 'pending',
            };
          });
      }
      const resp = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions: parsed }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setImportText('');
        setStatusMsg(`Imported ${data.inserted} question(s) into review queue.`);
        await loadOverview(token);
        onRefreshContent();
      } else {
        setStatusMsg(data.error || 'Import failed.');
      }
    } catch {
      setStatusMsg('Could not parse JSON/CSV import payload.');
    }
  };

  const updateQuestionStatus = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/teacher/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    await loadOverview(token);
    onRefreshContent();
  };

  const exportClassReport = () => {
    if (!overview) return;
    downloadCsv(
      'AlgebraLab_Class_Report.csv',
      ['Username', 'Display Name', 'Topics Completed', 'Practice Sessions', 'Total Score', 'Attempted', 'Exams'],
      overview.students.map((s) => [
        s.username,
        s.display_name,
        s.completed_topics,
        s.practice_count,
        s.total_score,
        s.total_attempted,
        s.exam_count,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Teacher & Administrator Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage curriculum notes, import/review questions, and monitor class performance.
          </p>
        </div>
        <button
          type="button"
          onClick={exportClassReport}
          className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Download Class CSV Report
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-800 dark:text-blue-200">
          {statusMsg}
        </div>
      )}

      {/* Student Roster & Difficult Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Student Performance ({overview?.students.length ?? 0} students)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 text-left">Student</th>
                  <th className="py-2 text-right">Topics</th>
                  <th className="py-2 text-right">Practice</th>
                  <th className="py-2 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.students ?? []).map((s) => {
                  const acc = s.total_attempted > 0 ? Math.round((s.total_score / s.total_attempted) * 100) : 0;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="py-1.5 font-sans font-medium">{s.display_name}</td>
                      <td className="py-1.5 text-right">{s.completed_topics}/7</td>
                      <td className="py-1.5 text-right">{s.practice_count}</td>
                      <td className="py-1.5 text-right">{acc}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Most Difficult Questions (Class Mistake Logs)
          </h2>
          {(overview?.difficultMistakes.length ?? 0) === 0 ? (
            <p className="text-xs text-slate-500">No student mistakes logged yet.</p>
          ) : (
            <div className="space-y-2">
              {overview?.difficultMistakes.map((d) => (
                <div key={d.question_id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs flex justify-between gap-2">
                  <span className="truncate"><MathText text={d.question_text} /></span>
                  <span className="font-mono font-semibold text-red-600 shrink-0">{d.miss_count} misses</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Note & Add Question */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={addNote} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Add Module Note, Theorem, Example or Resource
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={noteTopic}
              onChange={(e) => setNoteTopic(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {LEARNING_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.number}. {t.title}
                </option>
              ))}
              {(overview?.customModules ?? []).map((m, idx) => (
                <option key={m.id} value={m.id}>
                  {LEARNING_TOPICS.length + idx + 1}. {m.title}
                </option>
              ))}
            </select>
            <select
              value={noteKind}
              onChange={(e) => setNoteKind(e.target.value as typeof noteKind)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="Note">Lecture Note</option>
              <option value="Theorem">Theorem & Proof</option>
              <option value="Solved Example">Solved Example</option>
              <option value="Resource">Learning Resource</option>
            </select>
          </div>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title"
            required
            className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <textarea
            rows={3}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Lecture note or worked proof..."
            required
            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Publish Note
          </button>

          {(overview?.customNotes.length ?? 0) > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {overview?.customNotes.map((n) => (
                <div key={n.id} className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/50 text-xs space-y-2">
                  {editingNoteId === n.id ? (
                    <div className="space-y-2">
                      <select
                        value={editNoteTopic}
                        onChange={(e) => setEditNoteTopic(e.target.value)}
                        className="w-full h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        {LEARNING_TOPICS.map((t) => (
                          <option key={t.id} value={t.id}>{t.number}. {t.title}</option>
                        ))}
                        {(overview?.customModules ?? []).map((m, idx) => (
                          <option key={m.id} value={m.id}>{LEARNING_TOPICS.length + idx + 1}. {m.title}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editNoteTitle}
                        onChange={(e) => setEditNoteTitle(e.target.value)}
                        className="w-full h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <textarea
                        rows={2}
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={saveEditNote} className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-medium">
                          Save Note
                        </button>
                        <button type="button" onClick={() => setEditingNoteId(null)} className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-[11px]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">[{n.topic_id}] {n.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(n.id);
                            setEditNoteTopic(n.topic_id);
                            setEditNoteTitle(n.title);
                            setEditNoteContent(n.content);
                          }}
                          className="text-blue-600 dark:text-blue-400 p-1"
                          title="Edit note"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteNote(n.id)} className="text-red-600 p-1" title="Delete note">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>

        <form onSubmit={addQuestion} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Create Custom MCQ
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={qTopic}
              onChange={(e) => setQTopic(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {LEARNING_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
              {(overview?.customModules ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
            <select
              value={qDiff}
              onChange={(e) => setQDiff(e.target.value as typeof qDiff)}
              className="h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <input
            type="text"
            value={qPrompt}
            onChange={(e) => setQPrompt(e.target.value)}
            placeholder="Question stem"
            required
            className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            {qOpts.map((val, idx) => (
              <input
                key={idx}
                type="text"
                value={val}
                onChange={(e) => {
                  const next = [...qOpts];
                  next[idx] = e.target.value;
                  setQOpts(next);
                }}
                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                required
                className="h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <label>Correct Option:</label>
            <select
              value={qCorrect}
              onChange={(e) => setQCorrect(Number(e.target.value))}
              className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {[0, 1, 2, 3].map((i) => (
                <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={qExpl}
            onChange={(e) => setQExpl(e.target.value)}
            placeholder="Mathematical explanation"
            required
            className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium"
          >
            Save & Approve Question
          </button>
        </form>
      </div>

      {/* Bulk CSV/JSON Import & Review Queue */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Import Questions (CSV or JSON) & Answer-Key Review
        </h2>
        <textarea
          rows={3}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='Paste JSON array or CSV lines: topicId,difficulty,question,optA,optB,optC,optD,correctIndex,explanation'
          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
        />
        <button
          type="button"
          onClick={handleBulkImport}
          disabled={!importText.trim()}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          Import to Review Queue
        </button>

        {(overview?.customQuestions.length ?? 0) > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {overview?.customQuestions.map((q) => {
              const parsedOpts = (() => {
                try {
                  return JSON.parse(q.options_json) as string[];
                } catch {
                  return ['', '', '', ''];
                }
              })();
              return (
                <div key={q.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {editingQId === q.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={editQTopic}
                          onChange={(e) => setEditQTopic(e.target.value)}
                          className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          {LEARNING_TOPICS.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                          {(overview?.customModules ?? []).map((m) => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                        </select>
                        <select
                          value={editQDiff}
                          onChange={(e) => setEditQDiff(e.target.value as typeof editQDiff)}
                          className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={editQPrompt}
                        onChange={(e) => setEditQPrompt(e.target.value)}
                        className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {editQOpts.map((val, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={val}
                            onChange={(e) => {
                              const next = [...editQOpts];
                              next[idx] = e.target.value;
                              setEditQOpts(next);
                            }}
                            className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label>Correct:</label>
                        <select
                          value={editQCorrect}
                          onChange={(e) => setEditQCorrect(Number(e.target.value))}
                          className="h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          {[0, 1, 2, 3].map((i) => (
                            <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editQExpl}
                          onChange={(e) => setEditQExpl(e.target.value)}
                          placeholder="Explanation"
                          className="flex-1 min-w-[180px] h-8 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={saveEditQuestion} className="px-3 py-1 rounded bg-blue-600 text-white text-[11px] font-medium">
                          Save Question
                        </button>
                        <button type="button" onClick={() => setEditingQId(null)} className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 text-[11px]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate"><MathText text={q.question} /></div>
                        <div className="text-slate-500">
                          {q.topic_id} · {q.difficulty} · Status: {q.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQId(q.id);
                            setEditQTopic(q.topic_id);
                            setEditQDiff((['easy', 'medium', 'advanced'].includes(q.difficulty) ? q.difficulty : 'medium') as typeof editQDiff);
                            setEditQPrompt(q.question);
                            setEditQOpts([parsedOpts[0] ?? '', parsedOpts[1] ?? '', parsedOpts[2] ?? '', parsedOpts[3] ?? '']);
                            setEditQCorrect(q.correct_index);
                            setEditQExpl(q.explanation);
                          }}
                          className="p-1.5 rounded border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="Edit question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuestionStatus(q.id, 'approved')}
                          className="p-1.5 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuestionStatus(q.id, 'rejected')}
                          className="p-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50"
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create & Manage Custom Learning Modules */}
      <form onSubmit={saveCustomModule} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editingModId ? 'Edit Custom Module' : 'Create Custom Learning Module'}
          </h2>
          {editingModId && (
            <button
              type="button"
              onClick={() => {
                setEditingModId(null);
                setModTitle('');
                setModSubtitle('');
                setModMinutes(30);
                setModIntro('');
                setModObjectives('');
                setModMistakes('');
                setModRevision('');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={modTitle}
            onChange={(e) => setModTitle(e.target.value)}
            placeholder="Module title (e.g. Sylow Applications)"
            required
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <input
            type="text"
            value={modSubtitle}
            onChange={(e) => setModSubtitle(e.target.value)}
            placeholder="Subtitle / key concepts"
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <input
            type="number"
            min={5}
            max={240}
            value={modMinutes}
            onChange={(e) => setModMinutes(Math.max(5, Number(e.target.value)))}
            placeholder="Est. minutes"
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
        </div>
        <textarea
          rows={2}
          value={modIntro}
          onChange={(e) => setModIntro(e.target.value)}
          placeholder="Module introduction & overview..."
          required
          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <textarea
            rows={2}
            value={modObjectives}
            onChange={(e) => setModObjectives(e.target.value)}
            placeholder="Learning objectives (one per line)"
            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <textarea
            rows={2}
            value={modMistakes}
            onChange={(e) => setModMistakes(e.target.value)}
            placeholder="Common mistakes (one per line)"
            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <textarea
            rows={2}
            value={modRevision}
            onChange={(e) => setModRevision(e.target.value)}
            placeholder="Revision notes (one per line)"
            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {editingModId ? 'Save Module Changes' : 'Publish Custom Module'}
        </button>

        {(overview?.customModules?.length ?? 0) > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {overview?.customModules?.map((m) => (
              <div key={m.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{m.title}</div>
                  <div className="text-slate-500 truncate">{m.subtitle || m.introduction}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const parseArr = (raw: string) => {
                        try {
                          const arr = JSON.parse(raw);
                          return Array.isArray(arr) ? arr.join('\n') : '';
                        } catch {
                          return '';
                        }
                      };
                      setEditingModId(m.id);
                      setModTitle(m.title);
                      setModSubtitle(m.subtitle);
                      setModMinutes(m.estimated_minutes);
                      setModIntro(m.introduction);
                      setModObjectives(parseArr(m.objectives_json));
                      setModMistakes(parseArr(m.common_mistakes_json));
                      setModRevision(parseArr(m.revision_notes_json));
                    }}
                    className="text-blue-600 dark:text-blue-400 p-1"
                    title="Edit module"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCustomModule(m.id)}
                    className="text-red-600 p-1"
                    title="Delete module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
