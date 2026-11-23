import { Check, Download, Plus, Shield, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MathText } from '../components/MathFormula.tsx';
import { StudentPerformanceCharts } from '../components/ProgressCharts.tsx';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { downloadCsv, downloadPerformancePdf } from '../utils/pdfExport.ts';
import { StudentProgressState } from './DashboardPage.tsx';

export function StudentProgressPage({
  progress,
  username,
  isAuthenticated,
}: {
  progress: StudentProgressState | null;
  username: string | null;
  isAuthenticated: boolean;
}) {
  if (!isAuthenticated || !progress) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Student Progress & Analytics
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in or register in the top bar to persist your topic completions, quiz accuracy, mock exam scores, and export CSV/PDF performance reports.
        </p>
      </div>
    );
  }

  const completedTopics = progress.topics.filter((t) => t.completed === 1).length;
  const totalAttempted = progress.practice.reduce((s, p) => s + p.total, 0);
  const totalCorrect = progress.practice.reduce((s, p) => s + p.score, 0);
  const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

  // Compute topic-by-topic accuracy
  const topicPerf = new Map<string, { score: number; total: number }>();
  for (const p of progress.practice) {
    const cur = topicPerf.get(p.topic_id) ?? { score: 0, total: 0 };
    cur.score += p.score;
    cur.total += p.total;
    topicPerf.set(p.topic_id, cur);
  }

  const handleExportCsv = () => {
    downloadCsv(
      `AlgebraLab_Progress_${username ?? 'student'}.csv`,
      ['Type', 'Topic / Count', 'Score', 'Total', 'Date'],
      [
        ...progress.practice.map((p) => ['Practice', p.topic_id, p.score, p.total, p.created_at]),
        ...progress.exams.map((e) => ['Mock Exam', `${e.question_count} Qs`, e.score, e.question_count, e.created_at]),
      ]
    );
  };

  const handleExportPdf = () => {
    downloadPerformancePdf({
      username: username ?? 'Student',
      completedTopics,
      totalTopics: LEARNING_TOPICS.length,
      practiceCount: progress.practice.length,
      accuracyPercent: accuracy,
      exams: progress.exams,
      practice: progress.practice,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Student Progress — {username}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Completed Topics: {completedTopics}/{LEARNING_TOPICS.length} · Practice Accuracy: {accuracy.toFixed(1)}% · Mock Exams: {progress.exams.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {/* Topic Performance Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Topic Performance Breakdown
        </h2>
        {topicPerf.size === 0 ? (
          <p className="text-xs text-slate-500">Complete a practice session to visualize your topic accuracy.</p>
        ) : (
          <div className="space-y-2.5">
            {Array.from(topicPerf.entries()).map(([tid, stats]) => {
              const pct = Math.round((stats.score / stats.total) * 100);
              return (
                <div key={tid} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span>{tid}</span>
                    <span>
                      {stats.score}/{stats.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StudentPerformanceCharts progress={progress} />

      {/* Practice & Exam History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Practice History
          </h2>
          {progress.practice.length === 0 ? (
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
                  {progress.practice.slice(0, 15).map((p) => (
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
          {progress.exams.length === 0 ? (
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
                  {progress.exams.map((e) => (
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
    const resp = await fetch('/api/teacher/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topicId: noteTopic, title: noteTitle, content: noteContent }),
    });
    if (resp.ok) {
      setNoteTitle('');
      setNoteContent('');
      setStatusMsg('Supplemental note saved.');
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
            Add Topic Note
          </h2>
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
          </select>
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
                <div key={n.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                  <span className="truncate font-medium">[{n.topic_id}] {n.title}</span>
                  <button type="button" onClick={() => deleteNote(n.id)} className="text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
            {overview?.customQuestions.map((q) => (
              <div key={q.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate"><MathText text={q.question} /></div>
                  <div className="text-slate-500">
                    {q.topic_id} · {q.difficulty} · Status: {q.status}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
