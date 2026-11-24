import { CheckCircle2, Download, GitBranch, Grid3X3, Play, RefreshCw, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { convertUnicodeMathToLatex, MathFormula, MathText } from '../components/MathFormula.tsx';
import { VisualCheatSheetD3 } from '../components/VisualCheatSheetD3.tsx';
import {
  buildAlternatingGroup,
  buildDihedralGroup,
  buildSymmetricGroup,
  generateSubgroupFromElements,
} from '../core/groupEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import { runLiveVerificationChecks } from '../core/verificationCertificate.ts';
import { FORMULA_LIBRARY, GLOSSARY_ENTRIES } from '../data/glossaryAndFormulas.ts';
import { getVerifiedQuestionBank, PracticeQuestion } from '../data/questionBank.ts';
import { downloadVerificationReportPdf } from '../utils/pdfExport.ts';
import { StudentProgressState } from './DashboardPage.tsx';

export function MistakeNotebookPage({
  progress,
  isAuthenticated,
  onToggleMastered,
}: {
  progress: StudentProgressState | null;
  isAuthenticated: boolean;
  onToggleMastered: (questionId: string, mastered: boolean) => void;
}) {
  const bank = useMemo(() => getVerifiedQuestionBank(), []);
  const [filter, setFilter] = useState<'all' | 'active' | 'mastered'>('active');
  const [revisionSet, setRevisionSet] = useState<PracticeQuestion[] | null>(null);
  const [revAnswers, setRevAnswers] = useState<Record<string, number>>({});

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Mistake Notebook & Revision Center
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in or register in the top bar to automatically record missed practice/exam questions, retry them, and generate targeted revision tests.
        </p>
      </div>
    );
  }

  const mistakes = (progress?.mistakes ?? []).filter((m) => {
    if (filter === 'active') return m.mastered === 0;
    if (filter === 'mastered') return m.mastered === 1;
    return true;
  });

  const startRevisionTest = () => {
    const unmasteredIds = new Set(
      (progress?.mistakes ?? []).filter((m) => m.mastered === 0).map((m) => m.question_id)
    );
    const matched = bank.filter((q) => unmasteredIds.has(q.id));
    setRevisionSet(matched.slice(0, 10));
    setRevAnswers({});
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Mistake Notebook & Revision Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {progress?.mistakes.filter((m) => m.mastered === 0).length ?? 0} active mistakes ·{' '}
            {progress?.mistakes.filter((m) => m.mastered === 1).length ?? 0} mastered
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['active', 'mastered', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize ${
                  filter === f ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={(progress?.mistakes ?? []).filter((m) => m.mastered === 0).length === 0}
            onClick={startRevisionTest}
            className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-xs font-medium inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Generate Revision Test
          </button>
        </div>
      </div>

      {revisionSet && revisionSet.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Targeted Mistake Revision Test ({revisionSet.length} Questions)
            </h2>
            <button
              type="button"
              onClick={() => setRevisionSet(null)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close Test
            </button>
          </div>
          {revisionSet.map((q, idx) => {
            const picked = revAnswers[q.id];
            const isCorrect = picked === q.correctIndex;
            return (
              <div key={q.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-sm font-medium">
                  {idx + 1}. <MathText text={q.question} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => {
                        setRevAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                        if (optIdx === q.correctIndex) {
                          onToggleMastered(q.id, true);
                        }
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs ${
                        picked === optIdx
                          ? optIdx === q.correctIndex
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'border-red-500 bg-red-50 dark:bg-red-950/40'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="font-mono font-semibold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                      <MathText text={opt} />
                    </button>
                  ))}
                </div>
                {picked !== undefined && (
                  <div className={`text-xs ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                    {isCorrect ? (
                      'Mastered! Marked complete in your notebook.'
                    ) : (
                      <>
                        Try again — <MathText text={q.correctExplanation} />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mistakes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
          No questions in this view. Complete practice sets or mock exams to track challenging problems here.
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    Topic: {m.topic_id} · ID: {m.question_id} · Attempts: {m.attempts}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    <MathText text={m.question_text} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleMastered(m.question_id, m.mastered === 0)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shrink-0 ${
                    m.mastered === 1
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {m.mastered === 1 ? 'Mastered' : 'Mark as Mastered'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300">
                  Previous Answer: <MathText text={m.previous_answer} />
                </div>
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                  Correct Answer: <MathText text={m.correct_answer} />
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <MathText text={m.explanation} />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormulaLibraryPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'formulas' | 'cheatsheet'>('formulas');
  const filtered = FORMULA_LIBRARY.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.topic.toLowerCase().includes(query.toLowerCase()) ||
      f.explanation.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Formula Library & Visual Cheat Sheet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Searchable theorems, identities, and interactive D3.js group-structure diagrams
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('formulas')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'formulas'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Formulas & Identities
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cheatsheet')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'cheatsheet'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Visual Cheat Sheet
            </button>
          </div>

          {activeTab === 'formulas' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search formulas…"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {activeTab === 'cheatsheet' ? (
        <VisualCheatSheetD3 />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((f) => (
            <div key={f.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">{f.topic}</div>
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{f.name}</div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <MathFormula latex={f.latex} display />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <MathText text={f.explanation} />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  const sorted = [...GLOSSARY_ENTRIES]
    .sort((a, b) => a.term.localeCompare(b.term))
    .filter(
      (g) =>
        g.term.toLowerCase().includes(query.toLowerCase()) ||
        g.definition.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Abstract Algebra Glossary
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Alphabetical definitions, standard symbols, and concrete finite-group examples
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search glossary terms…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((entry) => (
          <div key={entry.term} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{entry.term}</h2>
              {entry.symbol && (
                <MathFormula
                  latex={convertUnicodeMathToLatex(entry.symbol)}
                  className="text-xs text-blue-700 dark:text-blue-400"
                />
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <MathText text={entry.definition} />
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Example: <MathText text={entry.example} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutPage({
  onLaunchDemo,
}: {
  onLaunchDemo?: (group: FiniteGroup, subset: number[], targetPage: string) => void;
}) {
  const [checks, setChecks] = useState(() => runLiveVerificationChecks());
  const passedCount = checks.filter((c) => c.passed).length;

  const demoScenarios = useMemo(
    () => [
      {
        id: 's4-v4-s3',
        title: 'S₄/V₄ ≅ S₃ Quotient & 36/36 Isomorphism',
        subtitle: 'Epimorphism π: S₄ ↠ S₄/V₄ + explicit verified bijection to S₃',
        targetPage: 'quotient',
        build: () => {
          const S4 = buildSymmetricGroup(4);
          const v4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => S4.elements.indexOf(l));
          return { group: S4, subset: v4 };
        },
      },
      {
        id: 's3-blocked',
        title: 'Non-Normal S₃/⟨(1 2)⟩ Blocker & Fractured Blocks',
        subtitle: 'Safety guard rejecting quotient multiplication with visual counterexample',
        targetPage: 'quotient',
        build: () => {
          const S3 = buildSymmetricGroup(3);
          const H = generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]);
          return { group: S3, subset: H };
        },
      },
      {
        id: 'd4-lattice',
        title: 'D₄ Interactive D3 Subgroup Lattice',
        subtitle: 'All 10 subgroups (6 normal) with Hasse covering edges',
        targetPage: 'group-explorer',
        build: () => {
          const D4 = buildDihedralGroup(4);
          const H = generateSubgroupFromElements(D4, [D4.elements.indexOf('r²')]);
          return { group: D4, subset: H };
        },
      },
      {
        id: 'a4-converse',
        title: 'A₄ Converse of Lagrange Counterexample',
        subtitle: 'Exhaustive verified lattice proof: 0 subgroups of order 6 in A₄',
        targetPage: 'lagrange',
        build: () => {
          const A4 = buildAlternatingGroup(4);
          const v4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => A4.elements.indexOf(l));
          return { group: A4, subset: v4 };
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            BS Mathematics · Algebra II — Artifact 2
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            About AlgebraLab
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            AlgebraLab is a computational and educational platform focused on Cosets, Lagrange's Theorem, Normal Subgroups, Normalizers, Centralizers, Centre, Conjugacy Classes, Quotient Groups, and Finite Abelian Group Classification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mathematical Safeguards</h2>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Every finite group & custom Cayley table is verified against closure, associativity, identity, and inverses.</li>
              <li>• Subgroup operations validate identity, closure, and inverses before computing cosets or Lagrange's index.</li>
              <li>• Quotient group construction <MathText text="G/H" /> is strictly blocked unless <MathText text="H ◁ G" /> holds across all elements.</li>
              <li>• Non-abelian quotient groups (such as <MathText text="S₄/V₄ ≅ S₃" />) are guarded against Finite Abelian Classification.</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Computational Scope & Limits</h2>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Cyclic groups <MathText text="ℤₙ" /> up to order 36; direct products up to order 48.</li>
              <li>• Dihedral groups <MathText text="Dₙ" /> up to <MathText text="D₁₆" />; symmetric groups up to <MathText text="S₅" />; alternating groups up to <MathText text="A₅" />.</li>
              <li>• Exhaustive subgroup lattice enumeration runs up to order 24 (including <MathText text="A₄, D₄, S₃, S₄" />); larger groups clearly flag resource-bounded searches.</li>
              <li>• Deep multi-tier Practice Problem Vault verified directly by the group engine.</li>
            </ul>
          </div>
        </div>
      </div>

      {onLaunchDemo && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              1-Click Professor Demo Walkthrough
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jump directly into the four flagship computational proofs and visual diagrams in the lab.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {demoScenarios.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  const { group, subset } = demo.build();
                  onLaunchDemo(group, subset, demo.targetPage);
                }}
                className="text-left p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <MathText text={demo.title} />
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <MathText text={demo.subtitle} />
                  </div>
                </div>
                <span className="p-1.5 rounded-lg bg-blue-700 text-white shrink-0">
                  <Play className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Live Mathematical Verification Certificate ({passedCount}/{checks.length} Passed)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic in-browser verification suite executing directly against the finite group-theory engine.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChecks(runLiveVerificationChecks())}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-Run Checks
            </button>
            <button
              type="button"
              onClick={() => downloadVerificationReportPdf(checks)}
              className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export Verification Report PDF
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {checks.map((chk) => (
            <div
              key={chk.id}
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                chk.passed
                  ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  chk.passed ? 'text-emerald-600' : 'text-red-600'
                }`}
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  <MathText text={chk.title} />
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  <MathText text={chk.details} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
