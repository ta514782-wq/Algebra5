import { CheckCircle2, PlayCircle, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { useState } from 'react';
import { generateSubgroupFromElements } from '../core/groupEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import {
  ChallengeGradeResult,
  getLabChallenges,
  gradeLabChallenge,
} from '../core/labChallenges.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

export function LabChallengesSection({
  onLoadIntoLab,
}: {
  onLoadIntoLab: (group: FiniteGroup, subset: number[], targetPage: string) => void;
}) {
  const challenges = getLabChallenges();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectionsById, setSelectionsById] = useState<Record<string, number[]>>({});
  const [gradesById, setGradesById] = useState<Record<string, ChallengeGradeResult | undefined>>({});

  const current = challenges[selectedIdx];
  const currentSel = selectionsById[current.id] ?? [current.group.identityIndex];
  const currentGrade = gradesById[current.id];
  const solvedCount = challenges.filter((c) => gradesById[c.id]?.passed).length;

  const updateSelection = (next: number[]) => {
    setSelectionsById((prev) => ({
      ...prev,
      [current.id]: Array.from(new Set(next)).sort((a, b) => a - b),
    }));
  };

  const toggleElement = (elIdx: number) => {
    if (currentSel.includes(elIdx)) {
      updateSelection(currentSel.filter((i) => i !== elIdx));
    } else {
      updateSelection([...currentSel, elIdx]);
    }
  };

  const handleCheck = () => {
    const res = gradeLabChallenge(current.id, currentSel);
    setGradesById((prev) => ({ ...prev, [current.id]: res }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Hands-On Construct & Prove Challenges
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click group elements below to construct subgroups meeting each mathematical property; every submission is graded deterministically by the finite-group engine.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 tabular-nums">
            Completed: {solvedCount} / {challenges.length}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {challenges.map((c, idx) => {
            const passed = gradesById[c.id]?.passed;
            const active = selectedIdx === idx;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {passed && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Challenge {c.number}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Active Group: <MathFormula latex={current.group.latexName} /> (order {current.group.order}) · Target: <MathText text={current.targetGoalSummary} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {current.number}. <MathText text={current.title} />
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <MathText text={current.prompt} />
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hint: <MathText text={current.hint} />
          </p>
        </div>

        {/* Clickable Element Construction Grid */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Current Construction ({currentSel.length} selected):{' '}
              <MathFormula
                latex={`\\{${currentSel.map((i) => current.group.latexElements[i]).join(', ')}\\}`}
              />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateSelection(generateSubgroupFromElements(current.group, currentSel))}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate ⟨Selection⟩
              </button>
              <button
                type="button"
                onClick={() => updateSelection([current.group.identityIndex])}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {current.group.elements.map((_, elIdx) => {
              const selected = currentSel.includes(elIdx);
              return (
                <button
                  key={elIdx}
                  type="button"
                  onClick={() => toggleElement(elIdx)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                    selected
                      ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  <MathFormula latex={current.group.latexElements[elIdx]} />{' '}
                  <span className="opacity-70 text-[10px]">({current.group.orders[elIdx]})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCheck}
            className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify Construction
          </button>

          <button
            type="button"
            onClick={() => onLoadIntoLab(current.group, currentSel, 'normality')}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <PlayCircle className="w-4 h-4" />
            Inspect Construction in Lab
          </button>
        </div>

        {currentGrade && (
          <div
            className={`p-4 rounded-lg border space-y-2.5 ${
              currentGrade.passed
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {currentGrade.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>{currentGrade.headline}</span>
            </div>
            <div className="space-y-1.5">
              {currentGrade.checks.map((chk, idx) => (
                <div key={idx} className="text-xs flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className={chk.ok ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {chk.ok ? '✓' : '✗'}
                  </span>
                  <div>
                    <span className="font-semibold">{chk.label}:</span>{' '}
                    <MathText text={chk.detail} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
