import { ArrowRight, CheckCircle2, Download, Eye, EyeOff, HelpCircle, PlayCircle, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LabChallengesSection } from '../components/LabChallengesSection.tsx';
import { MathText } from '../components/MathFormula.tsx';
import { IsomorphismWitnessPanel } from '../components/QuotientStructureVisuals.tsx';
import { FiniteGroup } from '../core/groupTypes.ts';
import { ARTIFACT2_EXERCISES } from '../data/artifact2Exercises.ts';
import { downloadExerciseProofPdf } from '../utils/pdfExport.ts';

interface GuidedAttemptPrompt {
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

const GUIDED_ATTEMPTS: GuidedAttemptPrompt[] = [
  {
    prompt: 'Before revealing the solution: what is the quotient group D₄ / ⟨r²⟩ isomorphic to?',
    options: ['ℤ₄ (Cyclic of order 4)', 'V₄ ≅ ℤ₂ × ℤ₂ (Klein four-group)', 'D₄ (order 8)', 'Not a quotient group'],
    correctIndex: 1,
    hint: 'Every non-identity coset in D₄/⟨r²⟩ satisfies (r⟨r²⟩)² = r²⟨r²⟩ = ⟨r²⟩ and (s⟨r²⟩)² = ⟨r²⟩, so all 3 non-identity cosets have order 2.',
  },
  {
    prompt: 'Before revealing: what is the order and isomorphism type of S₄ / V₄?',
    options: ['Order 6, isomorphic to ℤ₆', 'Order 6, isomorphic to S₃ (non-abelian)', 'Order 4, isomorphic to V₄', 'Order 12, isomorphic to A₄'],
    correctIndex: 1,
    hint: '|S₄| / |V₄| = 24 / 4 = 6. Cosets (1 2)V₄ and (1 2 3)V₄ do not commute, forcing S₄/V₄ ≅ S₃.',
  },
  {
    prompt: 'Before revealing: for H = ⟨(1 2)⟩ ≤ S₃, what is the order of the normalizer N_{S₃}(H)?',
    options: ['1 (only identity)', '2 (just H itself)', '3 (isomorphic to A₃)', '6 (whole S₃)'],
    correctIndex: 1,
    hint: '⟨(1 2)⟩ is non-normal of order 2 in S₃, and has 3 distinct conjugates, so [S₃ : N_{S₃}(H)] = 3 ⇒ |N_{S₃}(H)| = 2.',
  },
  {
    prompt: 'Before revealing: how many subgroups of order 6 exist inside A₄ (where |A₄| = 12)?',
    options: ['0 (Counterexample to Lagrange converse)', '1 (Unique normal subgroup)', '2 subgroups', '4 subgroups'],
    correctIndex: 0,
    hint: 'Any subgroup of order 6 in A₄ would have index 2, hence be normal and contain all squares of elements—including all eight 3-cycles, which exceeds size 6.',
  },
  {
    prompt: 'Before revealing: what is the quotient (ℤ₂ × ℤ₆) / ⟨(1, 2)⟩ isomorphic to?',
    options: ['ℤ₂ (order 2)', 'ℤ₄ (cyclic of order 4)', 'V₄ ≅ ℤ₂ × ℤ₂ (order 4)', 'ℤ₆ (order 6)'],
    correctIndex: 1,
    hint: 'The element (1, 2) has order lcm(2, 3) = 3, so the quotient has order 12/3 = 4, and the coset (0, 1) + ⟨(1, 2)⟩ generates order 4.',
  },
];

interface Artifact2PageProps {
  onLoadIntoLab: (group: FiniteGroup, subset: number[], targetPage: string) => void;
}

export function Artifact2Page({ onLoadIntoLab }: Artifact2PageProps) {
  const [sectionTab, setSectionTab] = useState<'guided' | 'challenges'>('guided');
  const [selectedEx, setSelectedEx] = useState(0);
  const [attemptChoices, setAttemptChoices] = useState<Record<number, number>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});

  const verifications = useMemo(
    () => ARTIFACT2_EXERCISES.map((ex) => ex.runLiveVerification()),
    []
  );

  const current = ARTIFACT2_EXERCISES[selectedEx];
  const live = verifications[selectedEx];
  const currentAttempt = GUIDED_ATTEMPTS[selectedEx];
  const pickedAttempt = attemptChoices[selectedEx];
  const solutionVisible = Boolean(revealedSolutions[selectedEx]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Professor's Guided Problems · Artifact 2
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Professor's Guided Problems: Cosets, Normal Subgroups & Quotients
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
              Every exercise and hands-on challenge below executes live against the finite group-theory engine, verifying cosets, normalizers, subgroup lattices, and quotient classifications directly from multiplication tables.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setSectionTab('guided')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                sectionTab === 'guided'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Guided Exercises (5)
            </button>
            <button
              type="button"
              onClick={() => setSectionTab('challenges')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                sectionTab === 'challenges'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Hands-On Lab Challenges (6)
            </button>
          </div>
        </div>

        {sectionTab === 'guided' && (
          <div className="flex flex-wrap gap-2 mt-4">
            {ARTIFACT2_EXERCISES.map((ex, idx) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedEx(idx)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  selectedEx === idx
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                Problem {ex.number}
              </button>
            ))}
          </div>
        )}
      </div>

      {sectionTab === 'challenges' ? (
        <LabChallengesSection onLoadIntoLab={onLoadIntoLab} />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {current.number}. <MathText text={current.title} />
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1.5">
              <MathText text={current.statement} />
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-800 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            {live.verified ? 'Engine Verified' : 'Check Failed'}
          </div>
        </div>

        {/* Attempt Before Reveal Interactive Card */}
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/70 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Attempt Before Revealing Solution
            </div>
            <button
              type="button"
              onClick={() =>
                setRevealedSolutions((prev) => ({
                  ...prev,
                  [selectedEx]: !prev[selectedEx],
                }))
              }
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {solutionVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {solutionVisible ? 'Hide Full Solution' : 'Reveal Full Solution'}
            </button>
          </div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
            <MathText text={currentAttempt.prompt} />
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentAttempt.options.map((opt, idx) => {
              const isPicked = pickedAttempt === idx;
              const isCorrect = idx === currentAttempt.correctIndex;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setAttemptChoices((prev) => ({ ...prev, [selectedEx]: idx }));
                    if (idx === currentAttempt.correctIndex) {
                      setRevealedSolutions((prev) => ({ ...prev, [selectedEx]: true }));
                    }
                  }}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    pickedAttempt === undefined
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-500'
                      : isPicked && isCorrect
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : isPicked && !isCorrect
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <MathText text={opt} />
                </button>
              );
            })}
          </div>
          {pickedAttempt !== undefined && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                pickedAttempt === currentAttempt.correctIndex
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200'
              }`}
            >
              {pickedAttempt === currentAttempt.correctIndex ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <MathText text={currentAttempt.hint} />
              </div>
            </div>
          )}
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {live.liveMetrics.map((m) => (
            <div
              key={m.label}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <MathText text={m.label} />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                <MathText text={m.value} />
              </div>
            </div>
          ))}
        </div>

        {solutionVisible && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Mathematical Background
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    <MathText text={current.background} />
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Inputs
                  </h3>
                  <div className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    <div><MathText text={current.groupInputLabel} /></div>
                    <div><MathText text={current.subgroupInputLabel} /></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Computational Procedure
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    {current.procedure.map((p, i) => (
                      <li key={i}><MathText text={p} /></li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step-by-Step Solution
                  </h3>
                  <ol className="mt-1.5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {current.steps.map((s, i) => (
                      <li key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                        <MathText text={s} />
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Final Result & Live Engine Output
                  </h3>
                  <div className="mt-1.5 p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1.5">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      <MathText text={current.finalResult} />
                    </div>
                    {live.detailLines.map((line, i) => (
                      <div key={i} className="text-xs text-blue-800 dark:text-blue-300">
                        <MathText text={line} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <MathText text={current.explanation} />
                  </p>
                </div>
              </div>
            </div>

            <IsomorphismWitnessPanel proof={live.isomorphismProof ?? null} />
          </>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onLoadIntoLab(live.group, live.subgroupIndices, 'cosets')}
            className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <PlayCircle className="w-4 h-4" />
            Inspect in Coset Visualizer
          </button>
          <button
            type="button"
            onClick={() =>
              onLoadIntoLab(
                live.group,
                live.subgroupIndices,
                current.number === 3 ? 'normalizer' : current.number === 4 ? 'lagrange' : 'quotient'
              )
            }
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Open Dedicated Module
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => downloadExerciseProofPdf(current, live)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Proof PDF
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
