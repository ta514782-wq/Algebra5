import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { ConjugacyAnalysis, CosetAnalysis, FiniteGroup } from '../core/groupTypes.ts';
import { analyzeCosetBlockConsistency } from '../core/isomorphismEngine.ts';
import { cayleyTableToLatex } from '../utils/latexExport.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

export interface ActiveOperationHighlight {
  a: number;
  b: number;
  result: number;
  phase?: 'operands' | 'result';
  modeLabel?: string;
}

const COSET_PALETTE = [
  { bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-200', fill: '#2563EB' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-200', fill: '#059669' },
  { bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-200', fill: '#D97706' },
  { bg: 'bg-violet-50 dark:bg-violet-950/50', border: 'border-violet-300 dark:border-violet-800', text: 'text-violet-900 dark:text-violet-200', fill: '#7C3AED' },
  { bg: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-200', fill: '#E11D48' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/50', border: 'border-cyan-300 dark:border-cyan-800', text: 'text-cyan-900 dark:text-cyan-200', fill: '#0891B2' },
  { bg: 'bg-orange-50 dark:bg-orange-950/50', border: 'border-orange-300 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-200', fill: '#EA580C' },
  { bg: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-300 dark:border-teal-800', text: 'text-teal-900 dark:text-teal-200', fill: '#0D9488' },
];

export function CayleyTableView({
  group,
  highlightIndices,
  maxDisplay = 24,
  activeOp,
  onSelectOperation,
}: {
  group: FiniteGroup;
  highlightIndices?: number[];
  maxDisplay?: number;
  activeOp?: ActiveOperationHighlight | null;
  onSelectOperation?: (a: number, b: number) => void;
}) {
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const limit = Math.min(group.order, maxDisplay);
  const truncated = group.order > maxDisplay;
  const hiSet = new Set(highlightIndices ?? []);

  const opLatex =
    group.operationSymbol === '∘'
      ? '\\circ'
      : group.operationSymbol === '+'
        ? '+'
        : group.operationSymbol === '*'
          ? '*'
          : '\\cdot';

  const displayOp = hoverCell
    ? {
        a: hoverCell.r,
        b: hoverCell.c,
        result: group.table[hoverCell.r][hoverCell.c],
        phase: 'result' as const,
        modeLabel: 'Hover Preview',
      }
    : activeOp ?? null;

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(cayleyTableToLatex(group, maxDisplay));
      setCopiedLatex(true);
      window.setTimeout(() => setCopiedLatex(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="min-h-[30px] flex flex-wrap items-center justify-between gap-2">
        <AnimatePresence mode="wait">
          {displayOp ? (
            <motion.div
              key={`${displayOp.a}-${displayOp.b}-${displayOp.result}-${displayOp.phase ?? 'result'}`}
              initial={{ opacity: 0, y: -3, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 3, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              {displayOp.modeLabel && (
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                  {displayOp.modeLabel} ·
                </span>
              )}
              <MathFormula
                latex={`${group.latexElements[displayOp.a]} ${opLatex} ${group.latexElements[displayOp.b]} = ${group.latexElements[displayOp.result]}`}
              />
            </motion.div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Hover or click any cell to inspect <MathText text="a ⋆ b" />
            </span>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleCopyLatex}
          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          {copiedLatex ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          {copiedLatex ? 'Copied LaTeX' : 'Copy LaTeX'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-xs tabular-nums">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80">
              <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-slate-500">
                <MathFormula latex={opLatex} />
              </th>
              {group.latexElements.slice(0, limit).map((el, j) => {
                const isOpCol = displayOp?.b === j;
                return (
                  <th
                    key={`col-${j}`}
                    className={`p-2 border-b border-slate-200 dark:border-slate-700 font-semibold text-center whitespace-nowrap transition-colors duration-150 ${
                      isOpCol
                        ? 'bg-indigo-600 text-white'
                        : hiSet.has(j)
                          ? 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <motion.span
                      className="inline-block"
                      animate={{ scale: isOpCol ? 1.1 : 1 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <MathFormula latex={el} />
                    </motion.span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {group.table.slice(0, limit).map((row, i) => {
              const isOpRow = displayOp?.a === i;
              return (
                <tr key={`row-${i}`}>
                  <th
                    className={`p-2 border-r border-slate-200 dark:border-slate-700 font-semibold text-center whitespace-nowrap transition-colors duration-150 ${
                      isOpRow
                        ? 'bg-blue-600 text-white'
                        : hiSet.has(i)
                          ? 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <motion.span
                      className="inline-block"
                      animate={{ scale: isOpRow ? 1.1 : 1 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <MathFormula latex={group.latexElements[i]} />
                    </motion.span>
                  </th>
                  {row.slice(0, limit).map((val, j) => {
                    const isRowHit = displayOp?.a === i;
                    const isColHit = displayOp?.b === j;
                    const isExact = isRowHit && isColHit;
                    const isId = val === group.identityIndex;
                    const isResultPhase = displayOp?.phase !== 'operands';
                    return (
                      <td
                        key={`cell-${i}-${j}`}
                        onMouseEnter={() => setHoverCell({ r: i, c: j })}
                        onMouseLeave={() => setHoverCell(null)}
                        onClick={() => onSelectOperation?.(i, j)}
                        className={`p-2 text-center border-b border-r border-slate-100 dark:border-slate-800/70 whitespace-nowrap transition-colors duration-150 ${
                          onSelectOperation ? 'cursor-pointer' : ''
                        } ${
                          isExact
                            ? isResultPhase
                              ? 'bg-emerald-600 text-white font-bold ring-2 ring-inset ring-emerald-300 dark:ring-emerald-400'
                              : 'bg-blue-600 text-white font-semibold ring-2 ring-inset ring-blue-300'
                            : isRowHit || isColHit
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-slate-100'
                              : isId
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-medium'
                                : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <motion.span
                          className="inline-block"
                          animate={
                            isExact
                              ? { scale: isResultPhase ? [1, 1.18, 1.04] : 1.06 }
                              : { scale: 1 }
                          }
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <MathFormula latex={group.latexElements[val]} />
                        </motion.span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {truncated && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing first {limit} × {limit} entries of the {group.order} × {group.order} Cayley table for legibility.
        </p>
      )}
    </div>
  );
}

export function CosetPartitionDiagram({ cosets }: { cosets: CosetAnalysis }) {
  if (!cosets.valid) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cosets.distinctLeftCosets.map((c, idx) => {
          const style = COSET_PALETTE[idx % COSET_PALETTE.length];
          return (
            <div
              key={c.cosetLabel}
              className={`rounded-lg border p-3.5 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${style.text}`}>
                  <MathFormula latex={c.latexLabel} />
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                  <MathFormula latex={`|${c.latexLabel}| = ${c.elementIndices.length}`} />
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.elementLabels.map((el) => (
                  <span
                    key={el}
                    className="px-2 py-1 rounded bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <MathText text={el} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
        <span>Distinct Blocks: {cosets.index}</span>
        <span>Elements Covered: {cosets.distinctLeftCosets.reduce((s, c) => s + c.elementIndices.length, 0)}</span>
        <span>Disjointness & Union Verified: {cosets.partitionVerified ? 'Yes' : 'No'}</span>
      </div>
    </div>
  );
}

export function ElementOrderChart({ group }: { group: FiniteGroup }) {
  const counts = new Map<number, number>();
  for (const ord of group.orders) {
    counts.set(ord, (counts.get(ord) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries()).sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(...entries.map((e) => e[1]), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 h-40 pt-4 px-2 border-b border-slate-200 dark:border-slate-800">
        {entries.map(([ord, count], idx) => {
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={`${group.id}-${ord}`} className="flex-1 flex flex-col items-center justify-end h-full min-w-[40px]">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
                className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 mb-1"
              >
                {count}
              </motion.span>
              <motion.div
                initial={{ scaleY: 0, opacity: 0.4 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 0.24, delay: idx * 0.035, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[44px] rounded-t-md bg-blue-600 dark:bg-blue-500"
                style={{ height: `${Math.max(pct, 8)}%`, transformOrigin: 'bottom' }}
                title={`Order ${ord}: ${count} element(s)`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 px-2">
        {entries.map(([ord]) => (
          <div key={ord} className="flex-1 text-center text-xs text-slate-500 dark:text-slate-400">
            <MathFormula latex={`\\mathrm{ord} = ${ord}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConjugacyPartitionDiagram({ analysis }: { analysis: ConjugacyAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="w-full h-8 rounded-lg overflow-hidden flex border border-slate-200 dark:border-slate-800">
        {analysis.classes.map((c, idx) => {
          const style = COSET_PALETTE[idx % COSET_PALETTE.length];
          const widthPct = (c.size / analysis.groupOrder) * 100;
          return (
            <div
              key={`bar-${idx}`}
              style={{ width: `${widthPct}%`, backgroundColor: style.fill }}
              className="h-full flex items-center justify-center text-[11px] font-mono font-semibold text-white border-r border-white/30 last:border-r-0"
              title={`Cl(${c.representativeLabel}) = {${c.elementLabels.join(', ')}} (size ${c.size})`}
            >
              {c.size}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {analysis.classes.map((c, idx) => {
          const style = COSET_PALETTE[idx % COSET_PALETTE.length];
          return (
            <div
              key={`cl-${idx}`}
              className={`rounded-lg border p-3.5 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className={`text-xs font-semibold ${style.text}`}>
                  <MathText text={`Cl(${c.representativeLabel})`} /> {c.isCentral ? '· Central' : ''}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                  Size {c.size} · <MathText text={`|C_G(${c.representativeLabel})| = ${c.centralizerOrder}`} />
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.elementLabels.map((el) => (
                  <span
                    key={el}
                    className="px-2 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <MathText text={el} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SubgroupLatticePreview({
  group,
  subgroups,
  activeSubgroup,
  onSelectSubgroup,
}: {
  group: FiniteGroup;
  subgroups: number[][];
  activeSubgroup: number[];
  onSelectSubgroup: (s: number[]) => void;
}) {
  const activeKey = activeSubgroup.join(',');
  // Group subgroups by order descending
  const byOrder = new Map<number, number[][]>();
  for (const s of subgroups) {
    if (!byOrder.has(s.length)) byOrder.set(s.length, []);
    byOrder.get(s.length)!.push(s);
  }
  const ordersDesc = Array.from(byOrder.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-2.5">
      {ordersDesc.map((ord) => (
        <div key={ord} className="flex items-start gap-3">
          <div className="w-16 shrink-0 pt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <MathFormula latex={`|H| = ${ord}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {byOrder.get(ord)!.slice(0, 12).map((sub, i) => {
              const key = sub.join(',');
              const isActive = key === activeKey;
              const label =
                sub.length === 1
                  ? `{${group.elements[sub[0]]}}`
                  : sub.length === group.order
                    ? group.name
                    : `{${sub.slice(0, 4).map((x) => group.elements[x]).join(', ')}${sub.length > 4 ? ', …' : ''}}`;
              return (
                <button
                  key={`${ord}-${i}`}
                  type="button"
                  onClick={() => onSelectSubgroup(sub)}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  <MathText text={label} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CosetBlockedCayleyTable({
  group,
  cosets,
  maxDisplay = 24,
}: {
  group: FiniteGroup;
  cosets: CosetAnalysis;
  maxDisplay?: number;
}) {
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);
  const blockData = useMemo(
    () => analyzeCosetBlockConsistency(group, cosets.distinctLeftCosets),
    [group, cosets.distinctLeftCosets]
  );

  if (!cosets.valid) return null;

  if (group.order > maxDisplay) {
    return (
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          Coset Block Consistency: {blockData.pureBlockCount} / {blockData.totalBlockCount} pure blocks
        </div>
        <p>
          Full {group.order} × {group.order} coset-blocked grid is omitted above order {maxDisplay} for legibility; mathematical block consistency across all {blockData.totalBlockCount} coset pairs is{' '}
          <span className="font-semibold">{blockData.allBlocksPure ? '100% intact (H ◁ G)' : 'fractured (H ⋪ G)'}</span>.
        </p>
      </div>
    );
  }

  const ordered = blockData.orderedIndices;
  const sliceEndPositions = new Set(
    blockData.cosetSlices.slice(0, -1).map((s) => s.startPos + s.length - 1)
  );

  const opLatex =
    group.operationSymbol === '∘'
      ? '\\circ'
      : group.operationSymbol === '+'
        ? '+'
        : group.operationSymbol === '*'
          ? '*'
          : '\\cdot';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div
          className={`px-3 py-1.5 rounded-lg border font-medium ${
            blockData.allBlocksPure
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}
        >
          Coset Block Purity: {blockData.pureBlockCount} / {blockData.totalBlockCount} blocks solid{' '}
          {blockData.allBlocksPure ? '— Quotient multiplication is well-defined!' : '— Blocks fracture (non-normal H)'}
        </div>
        {hoverPos && (
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <MathFormula
              latex={`${group.latexElements[hoverPos.r]} ${opLatex} ${group.latexElements[hoverPos.c]} = ${group.latexElements[group.table[hoverPos.r][hoverPos.c]]} \\in ${cosets.distinctLeftCosets[blockData.elementToCosetIndex[group.table[hoverPos.r][hoverPos.c]]]?.latexLabel ?? ''}`}
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-[11px] tabular-nums">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80">
              <th className="p-1.5 border-b-2 border-r-2 border-slate-300 dark:border-slate-600 text-slate-500">
                <MathFormula latex={opLatex} />
              </th>
              {ordered.map((elIdx, pos) => {
                const cIdx = blockData.elementToCosetIndex[elIdx];
                const pal = COSET_PALETTE[cIdx % COSET_PALETTE.length];
                const isBreak = sliceEndPositions.has(pos);
                return (
                  <th
                    key={`ch-${pos}`}
                    className={`p-1.5 border-b-2 border-slate-300 dark:border-slate-600 text-center whitespace-nowrap ${pal.bg} ${pal.text} ${
                      isBreak ? 'border-r-2 border-r-slate-400 dark:border-r-slate-500' : 'border-r border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <MathFormula latex={group.latexElements[elIdx]} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordered.map((rIdx, rPos) => {
              const rCoset = blockData.elementToCosetIndex[rIdx];
              const rPal = COSET_PALETTE[rCoset % COSET_PALETTE.length];
              const isRowBreak = sliceEndPositions.has(rPos);
              return (
                <tr key={`cr-${rPos}`}>
                  <th
                    className={`p-1.5 border-r-2 border-slate-300 dark:border-slate-600 text-center whitespace-nowrap ${rPal.bg} ${rPal.text} ${
                      isRowBreak ? 'border-b-2 border-b-slate-400 dark:border-b-slate-500' : 'border-b border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <MathFormula latex={group.latexElements[rIdx]} />
                  </th>
                  {ordered.map((cIdx, cPos) => {
                    const prod = group.table[rIdx][cIdx];
                    const pCoset = blockData.elementToCosetIndex[prod];
                    const pPal = COSET_PALETTE[pCoset % COSET_PALETTE.length];
                    const isColBreak = sliceEndPositions.has(cPos);
                    const isExact = hoverPos?.r === rIdx && hoverPos?.c === cIdx;
                    return (
                      <td
                        key={`cc-${rPos}-${cPos}`}
                        onMouseEnter={() => setHoverPos({ r: rIdx, c: cIdx })}
                        onMouseLeave={() => setHoverPos(null)}
                        className={`p-1.5 text-center whitespace-nowrap transition-colors ${
                          isExact ? 'ring-2 ring-inset ring-slate-900 dark:ring-white font-bold' : ''
                        } ${pPal.bg} ${pPal.text} ${
                          isColBreak ? 'border-r-2 border-r-slate-400 dark:border-r-slate-500' : 'border-r border-slate-200/70 dark:border-slate-700/70'
                        } ${
                          isRowBreak ? 'border-b-2 border-b-slate-400 dark:border-b-slate-500' : 'border-b border-slate-200/70 dark:border-slate-700/70'
                        }`}
                      >
                        <MathFormula latex={group.latexElements[prod]} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

