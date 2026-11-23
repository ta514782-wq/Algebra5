import { Bookmark, CheckCircle2, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { MathFormula, MathText } from '../components/MathFormula.tsx';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { downloadTopicPdf } from '../utils/pdfExport.ts';

interface CustomNote {
  id: number;
  topic_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface LearnMathPageProps {
  initialTopicId?: string;
  completedTopicIds: Set<string>;
  bookmarkedTopicIds: Set<string>;
  onToggleComplete: (topicId: string, completed: boolean) => void;
  onToggleBookmark: (topicId: string, label: string) => void;
  onPracticeTopic: (topicId: string) => void;
  customNotes: CustomNote[];
  isAuthenticated: boolean;
}

export function LearnMathPage({
  initialTopicId,
  completedTopicIds,
  bookmarkedTopicIds,
  onToggleComplete,
  onToggleBookmark,
  onPracticeTopic,
  customNotes,
  isAuthenticated,
}: LearnMathPageProps) {
  const [activeId, setActiveId] = useState(initialTopicId || LEARNING_TOPICS[0].id);
  const topic = LEARNING_TOPICS.find((t) => t.id === activeId) ?? LEARNING_TOPICS[0];
  const isCompleted = completedTopicIds.has(topic.id);
  const isBookmarked = bookmarkedTopicIds.has(topic.id);
  const topicCustomNotes = customNotes.filter((n) => n.topic_id === topic.id);

  return (
    <div className="space-y-6">
      {/* Topic Selector Tabs */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-wrap gap-2">
          {LEARNING_TOPICS.map((t) => {
            const active = t.id === topic.id;
            const done = completedTopicIds.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <span>
                  {t.number}. {t.title}
                </span>
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic Header & Actions */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Topic {topic.number} of 7 · Est. {topic.estimatedMinutes} min · {topic.solvedExamples.length} Solved Examples
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {topic.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{topic.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadTopicPdf(topic)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF Notes
            </button>
            <button
              type="button"
              onClick={() => onToggleBookmark(topic.id, `Topic ${topic.number}: ${topic.title}`)}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Bookmark topic' : 'Sign in to bookmark'}
              className={`px-3.5 py-2 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isBookmarked
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button
              type="button"
              onClick={() => onToggleComplete(topic.id, !isCompleted)}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Mark topic completed' : 'Sign in to track completion'}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
          <MathText text={topic.introduction} />
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Learning Objectives
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {topic.objectives.map((o, i) => (
                <li key={i}>• <MathText text={o} /></li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Prerequisites & Visual Intuition
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              Prerequisites: <MathText text={topic.prerequisites.join(' · ')} />
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <MathText text={topic.visualExplanation} />
            </p>
          </div>
        </div>
      </div>

      {/* Definitions & Formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Formal Definitions
          </h2>
          <div className="space-y-4">
            {topic.definitions.map((d) => (
              <div key={d.term} className="pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{d.term}</div>
                <div className="my-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <MathFormula latex={d.latex} display />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <MathText text={d.explanation} />
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Key Formulas
          </h2>
          <div className="space-y-3">
            {topic.formulas.map((f) => (
              <div key={f.label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300"><MathText text={f.label} /></div>
                <MathFormula latex={f.latex} display />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1"><MathText text={f.note} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Theorems & Proofs */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Theorems & Proofs
        </h2>
        <div className="space-y-5">
          {topic.theorems.map((th) => (
            <div key={th.name} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{th.name}</div>
              <p className="text-sm text-slate-700 dark:text-slate-300"><MathText text={th.statement} /></p>
              <MathFormula latex={th.statementLatex} display />
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Proof</div>
                <ol className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {th.proof.map((step, i) => (
                    <li key={i}>
                      <span className="font-mono font-semibold mr-1.5">{i + 1}.</span>
                      <MathText text={step} />
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Solved Examples */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Solved Examples ({topic.solvedExamples.length})
          </h2>
          <button
            type="button"
            onClick={() => onPracticeTopic(topic.id)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium whitespace-nowrap shrink-0"
          >
            Practice {topic.title} MCQs
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topic.solvedExamples.map((ex, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100"><MathText text={ex.title} /></div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium"><MathText text={ex.problem} /></p>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {ex.steps.map((s, j) => (
                  <li key={j}>• <MathText text={s} /></li>
                ))}
              </ul>
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-blue-800 dark:text-blue-300">
                Answer: <MathText text={ex.answer} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Exam Mistakes & Revision Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Common Examination Mistakes
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {topic.commonMistakes.map((m, i) => (
              <li key={i}>• <MathText text={m} /></li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-5 space-y-2.5">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Revision Summary Notes
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {topic.revisionNotes.map((r, i) => (
              <li key={i}>• <MathText text={r} /></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Instructor-Added Custom Notes */}
      {topicCustomNotes.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <FileText className="w-4 h-4 text-blue-600" />
            Instructor Supplemental Notes
          </div>
          {topicCustomNotes.map((n) => (
            <div key={n.id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
