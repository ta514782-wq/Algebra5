import {
  ArrowLeftRight,
  CheckCircle2,
  FlaskConical,
  GitCompareArrows,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { compareTwoGroups } from '../core/groupComparisonEngine.ts';
import { getPresetSubgroups, PRESET_GROUPS } from '../core/groupEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

interface GroupComparisonPanelProps {
  onOpenInExplorer?: (group: FiniteGroup, subset: number[]) => void;
}

const CLASSIC_PAIRS: Array<{ label: string; keyA: string; keyB: string }> = [
  { label: 'D₄ vs Q₈ (Order 8 Non-Abelian)', keyA: 'D_4', keyB: 'Q_8' },
  { label: 'S₃ vs ℤ₆ (Order 6)', keyA: 'S_3', keyB: 'Z_6' },
  { label: 'D₃ vs S₃ (Isomorphic Order 6)', keyA: 'D_3', keyB: 'S_3' },
  { label: 'ℤ₁₂ vs ℤ₂ × ℤ₆ (Order 12 Abelian)', keyA: 'Z_12', keyB: 'Z2xZ6' },
  { label: 'A₄ vs ℤ₂ × ℤ₆ (Order 12)', keyA: 'A_4', keyB: 'Z2xZ6' },
];

export function GroupComparisonPanel({ onOpenInExplorer }: GroupComparisonPanelProps) {
  const [keyA, setKeyA] = useState<string>('D_4');
  const [keyB, setKeyB] = useState<string>('Q_8');
  const [showDiffsOnly, setShowDiffsOnly] = useState<boolean>(false);

  const groupA = useMemo(() => {
    const found = PRESET_GROUPS.find((p) => p.key === keyA) ?? PRESET_GROUPS[0];
    return found.build();
  }, [keyA]);

  const groupB = useMemo(() => {
    const found = PRESET_GROUPS.find((p) => p.key === keyB) ?? PRESET_GROUPS[1];
    return found.build();
  }, [keyB]);

  const report = useMemo(() => compareTwoGroups(groupA, groupB), [groupA, groupB]);
  const displayedRows = showDiffsOnly ? report.rows.filter((r) => !r.matches) : report.rows;

  const handleSwap = () => {
    setKeyA(keyB);
    setKeyB(keyA);
  };

  return (
    <div className="space-y-6">
      {/* Header & Group Pair Selection */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
              <GitCompareArrows className="w-4 h-4 shrink-0" />
              <span>Computational Lab · Structural Invariant Comparator</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Group Properties Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Select any two groups from the library to compare their order, commutativity, subgroup counts, normal subgroups, centre, conjugacy classes, element order spectra, and isomorphism status side-by-side.
            </p>
          </div>
        </div>

        {/* Classic Comparison Presets */}
        <div className="flex flex-wrap gap-2">
          {CLASSIC_PAIRS.map((pair) => {
            const active = keyA === pair.keyA && keyB === pair.keyB;
            return (
              <button
                key={pair.label}
                type="button"
                onClick={() => {
                  setKeyA(pair.keyA);
                  setKeyB(pair.keyB);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <MathText text={pair.label} />
              </button>
            );
          })}
        </div>

        {/* Dual Library Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end pt-1">
          <div className="space-y-1.5">
            <label htmlFor="compare-group-a" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Group A
            </label>
            <select
              id="compare-group-a"
              value={keyA}
              onChange={(e) => setKeyA(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              {PRESET_GROUPS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="h-10 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            title="Swap Group A and Group B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Swap
          </button>

          <div className="space-y-1.5">
            <label htmlFor="compare-group-b" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Group B
            </label>
            <select
              id="compare-group-b"
              value={keyB}
              onChange={(e) => setKeyB(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              {PRESET_GROUPS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Isomorphism Verdict Banner */}
      <section
        className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          report.isomorphism.isomorphic
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {report.isomorphism.isomorphic ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
              <MathFormula latex={groupA.latexName} />
              <span>{report.isomorphism.isomorphic ? '≅' : '≇'}</span>
              <MathFormula latex={groupB.latexName} />
              <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                · {report.isomorphism.isomorphic ? 'Isomorphic Groups' : 'Non-Isomorphic Groups'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <MathText text={report.isomorphism.reason} />
            </p>
          </div>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
          {report.matchingCount} matching · {report.differingCount} differing
        </div>
      </section>

      {/* Side-by-Side Properties Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Side-by-Side Structural Properties
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiffsOnly((d) => !d)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                showDiffsOnly
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {showDiffsOnly ? 'Showing Differences Only' : 'Show Differences Only'}
            </button>
            {onOpenInExplorer && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const sub = getPresetSubgroups(groupA)[1]?.elements ?? [groupA.identityIndex];
                    onOpenInExplorer(groupA, sub);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Explore {groupA.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sub = getPresetSubgroups(groupB)[1]?.elements ?? [groupB.identityIndex];
                    onOpenInExplorer(groupB, sub);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Explore {groupB.name}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold w-1/4">Property</th>
                <th className="py-3 px-4 font-semibold w-[32%]">
                  <span className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                    <span>Group A:</span>
                    <MathFormula latex={groupA.latexName} />
                  </span>
                </th>
                <th className="py-3 px-4 font-semibold w-[32%]">
                  <span className="inline-flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                    <span>Group B:</span>
                    <MathFormula latex={groupB.latexName} />
                  </span>
                </th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Every tracked invariant matches between {groupA.name} and {groupB.name}.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => (
                  <tr
                    key={row.key}
                    className={
                      !row.matches
                        ? 'bg-amber-50/40 dark:bg-amber-950/10'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    }
                  >
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <MathText text={row.property} />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs sm:text-[13px] text-slate-700 dark:text-slate-300">
                      {row.valueA}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs sm:text-[13px] text-slate-700 dark:text-slate-300">
                      {row.valueB}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-medium ${
                          row.matches
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {row.matches ? 'Match' : 'Differs'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
