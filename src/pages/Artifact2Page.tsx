import { ArrowRight, CheckCircle2, Download, PlayCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LabChallengesSection } from '../components/LabChallengesSection.tsx';
import { MathText } from '../components/MathFormula.tsx';
import { IsomorphismWitnessPanel } from '../components/QuotientStructureVisuals.tsx';
import { FiniteGroup } from '../core/groupTypes.ts';
import { ARTIFACT2_EXERCISES } from '../data/artifact2Exercises.ts';
import { downloadExerciseProofPdf } from '../utils/pdfExport.ts';

interface Artifact2PageProps {
  onLoadIntoLab: (group: FiniteGroup, subset: number[], targetPage: string) => void;
}

export function Artifact2Page({ onLoadIntoLab }: Artifact2PageProps) {
  const [sectionTab, setSectionTab] = useState<'guided' | 'challenges'>('guided');
  const [selectedEx, setSelectedEx] = useState(0);

  const verifications = useMemo(
    () => ARTIFACT2_EXERCISES.map((ex) => ex.runLiveVerification()),
    []
  );

  const current = ARTIFACT2_EXERCISES[selectedEx];
  const live = verifications[selectedEx];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Professor's Artifact 2 · Guided Exercises & Constructive Challenges
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Five Core Problems in Cosets, Normal Subgroups & Quotient Groups
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
