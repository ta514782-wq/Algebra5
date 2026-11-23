import { motion } from 'motion/react';
import { FiniteGroup } from '../core/groupTypes.ts';
import { MathFormula, MathText } from './MathFormula.tsx';
import { ActiveOperationHighlight } from './VisualDiagrams.tsx';

function getPolygonVertexCoords(n: number, radius: number, cx: number, cy: number) {
  return Array.from({ length: n }, (_, k) => {
    const angle = -Math.PI / 2 - (2 * Math.PI * k) / n; // vertex 1 at top, counterclockwise 2..n
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

function applyDihedralElement(n: number, elIdx: number): number[] {
  const a = elIdx % n;
  const b = Math.floor(elIdx / n);
  // Label k (0-indexed) moves to slot pos(k) = (a + (b === 0 ? k : -k)) mod n
  const posOfLabel = Array.from({ length: n }, (_, k) => {
    const raw = b === 0 ? a + k : a - k;
    return ((raw % n) + n) % n;
  });
  return posOfLabel;
}

const VERTEX_COLORS = [
  '#2563EB', // 1 - blue
  '#059669', // 2 - emerald
  '#D97706', // 3 - amber
  '#7C3AED', // 4 - violet
  '#E11D48', // 5 - rose
  '#0891B2', // 6 - cyan
  '#EA580C', // 7 - orange
  '#0D9488', // 8 - teal
];

export function DihedralPolygonVisualizer({
  group,
  opA,
  opB,
  activeOp,
  onTriggerOp,
}: {
  group: FiniteGroup;
  opA: number;
  opB: number;
  activeOp?: ActiveOperationHighlight | null;
  onTriggerOp: (a: number, b: number, label: string) => void;
}) {
  const n = Math.max(3, Math.floor(group.order / 2));
  const a = activeOp?.a ?? opA;
  const b = activeOp?.b ?? opB;
  const res = activeOp?.result ?? group.table[a][b];
  const phase = activeOp?.phase ?? 'result';

  // Compare stages: Identity -> after b (first symmetry applied) -> after a·b (composition)
  const stageLabels = [
    {
      title: '1. Reference Polygon e',
      subtitle: 'Initial vertices',
      elIdx: 0,
      badge: 'e',
      latex: 'e',
    },
    {
      title: '2. Apply Right Symmetry b',
      subtitle: `Step 1: ${group.elements[b]}`,
      elIdx: b,
      badge: group.elements[b],
      latex: group.latexElements[b],
    },
    {
      title: '3. Then Apply Left a ⇒ a · b',
      subtitle: `Result: ${group.elements[res]}`,
      elIdx: res,
      badge: group.elements[res],
      latex: group.latexElements[res],
    },
  ];

  const rIdx = group.elements.indexOf('r');
  const sIdx = group.elements.indexOf('s');
  const rsIdx = group.elements.indexOf('rs');

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Geometric Symmetry Action on Regular {n}-gon (<MathFormula latex={group.latexName} />)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visualizing <MathText text="a · b" /> right-to-left: symmetry <MathText text="b" /> acts first on the polygon, followed by <MathText text="a" />, landing at <MathFormula latex={group.latexElements[res]} />.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {rIdx >= 0 && (
            <button
              type="button"
              onClick={() => onTriggerOp(rIdx, res, 'Rotate by r')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              Compose <MathText text="r · (curr)" />
            </button>
          )}
          {sIdx >= 0 && (
            <button
              type="button"
              onClick={() => onTriggerOp(sIdx, res, 'Reflect by s')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              Reflect <MathText text="s · (curr)" />
            </button>
          )}
          {rIdx >= 0 && sIdx >= 0 && rsIdx >= 0 && (
            <button
              type="button"
              onClick={() => onTriggerOp(sIdx, rIdx, 'Non-Abelian Witness: s · r')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-medium text-blue-800 dark:text-blue-200 whitespace-nowrap shrink-0"
            >
              Compare <MathText text="s·r vs r·s" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stageLabels.map((stage, sOrder) => {
          const isFlipped = Math.floor(stage.elIdx / n) === 1;
          const rotSteps = stage.elIdx % n;
          const posOfLabel = applyDihedralElement(n, stage.elIdx);
          const slots = getPolygonVertexCoords(n, 58, 90, 86);
          const polyPoints = slots.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
          const activeHighlight =
            (sOrder === 1 && phase === 'operands') || (sOrder === 2 && phase === 'result');

          return (
            <motion.div
              key={stage.title}
              animate={{ scale: activeHighlight ? 1.02 : 1 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-lg border p-3.5 transition-colors ${
                activeHighlight
                  ? sOrder === 2
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {stage.title}
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  <MathFormula latex={stage.latex} />
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                {isFlipped ? `Reflected · rotated ${rotSteps}×(${Math.round(360 / n)}°)` : `Rotated ${rotSteps}×(${Math.round(360 / n)}°)`}
              </div>

              <svg viewBox="0 0 180 172" className="w-full max-w-[200px] mx-auto block">
                {/* Reflection axis indicator when flipped */}
                {isFlipped && (
                  <line
                    x1={90 + 70 * Math.sin((Math.PI * rotSteps) / n)}
                    y1={86 - 70 * Math.cos((Math.PI * rotSteps) / n)}
                    x2={90 - 70 * Math.sin((Math.PI * rotSteps) / n)}
                    y2={86 + 70 * Math.cos((Math.PI * rotSteps) / n)}
                    stroke="#E11D48"
                    strokeWidth="1.25"
                    strokeDasharray="4 3"
                    opacity="0.7"
                  />
                )}

                <polygon
                  points={polyPoints}
                  fill={isFlipped ? 'rgba(225, 29, 72, 0.08)' : 'rgba(37, 99, 235, 0.08)'}
                  stroke={isFlipped ? '#E11D48' : '#2563EB'}
                  strokeWidth="1.75"
                />

                {/* Vertex markers placed at their transformed slot */}
                {n <= 12 &&
                  posOfLabel.map((slotIdx, labelZeroIdx) => {
                    const pt = slots[slotIdx];
                    const color = VERTEX_COLORS[labelZeroIdx % VERTEX_COLORS.length];
                    return (
                      <motion.g
                        key={labelZeroIdx}
                        animate={{ x: pt.x, y: pt.y }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <circle
                          cx={0}
                          cy={0}
                          r={n <= 6 ? 11.5 : 9.5}
                          fill={color}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fontSize={n <= 6 ? 11 : 9.5}
                          fontWeight="700"
                          fill="#FFFFFF"
                        >
                          {labelZeroIdx + 1}
                        </text>
                      </motion.g>
                    );
                  })}
              </svg>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function parsePermutationMapping(cycleStr: string, degree: number): number[] {
  const arr = Array.from({ length: degree }, (_, i) => i + 1);
  if (cycleStr === 'e') return arr;
  const cycles = cycleStr.match(/\([^)]+\)/g) ?? [];
  for (const cyc of cycles) {
    const nums = cyc
      .slice(1, -1)
      .trim()
      .split(/\s+/)
      .map(Number);
    for (let i = 0; i < nums.length; i++) {
      const from = nums[i];
      const to = nums[(i + 1) % nums.length];
      if (from >= 1 && from <= degree) {
        arr[from - 1] = to;
      }
    }
  }
  return arr;
}

export function PermutationActionVisualizer({
  group,
  opA,
  opB,
  activeOp,
}: {
  group: FiniteGroup;
  opA: number;
  opB: number;
  activeOp?: ActiveOperationHighlight | null;
}) {
  const a = activeOp?.a ?? opA;
  const b = activeOp?.b ?? opB;
  const res = activeOp?.result ?? group.table[a][b];
  const phase = activeOp?.phase ?? 'result';

  // Infer degree n from group id (S_3, A_4, S_4, S_5, etc.)
  const degMatch = /(\d+)/.exec(group.id);
  const degree = degMatch ? Math.min(Math.max(Number(degMatch[1]), 3), 5) : 3;

  const mapB = parsePermutationMapping(group.elements[b], degree);
  const mapA = parsePermutationMapping(group.elements[a], degree);
  const mapComp = parsePermutationMapping(group.elements[res], degree);

  const rowGap = 34;
  const topY = 44;
  const svgHeight = topY + (degree - 1) * rowGap + 30;
  const col1X = 64;
  const col2X = 230;
  const col3X = 396;
  const col4X = 540;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Permutation Composition Action Diagram (<MathFormula latex={group.latexName} />)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Right-to-left evaluation: <MathText text="(a ∘ b)(x) = a(b(x))" /> — trace <MathFormula latex={group.latexElements[b]} /> first, then <MathFormula latex={group.latexElements[a]} />, verifying <MathFormula latex={`${group.latexElements[a]} \\circ ${group.latexElements[b]} = ${group.latexElements[res]}`} />.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 610 ${svgHeight}`} className="w-full min-w-[500px] max-w-[660px] mx-auto block">
          {/* Column Titles */}
          <text x={col1X} y={18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748B">
            Input x
          </text>
          <text x={col2X} y={18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#4F46E5">
            After b: {group.elements[b]}
          </text>
          <text x={col3X} y={18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#2563EB">
            After a: {group.elements[a]}
          </text>
          <text x={col4X} y={18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#059669">
            Direct a∘b: {group.elements[res]}
          </text>

          {/* Arrows Stage 1: x -> b(x), Stage 2: b(x) -> a(b(x)) */}
          {Array.from({ length: degree }, (_, idx) => {
            const x = idx + 1;
            const bx = mapB[idx];
            const abx = mapA[bx - 1];
            const y1 = topY + idx * rowGap;
            const y2 = topY + (bx - 1) * rowGap;
            const y3 = topY + (abx - 1) * rowGap;
            const color = VERTEX_COLORS[idx % VERTEX_COLORS.length];

            return (
              <g key={`flow-${x}`}>
                <motion.path
                  d={`M ${col1X + 16} ${y1} C ${col1X + 72} ${y1}, ${col2X - 72} ${y2}, ${col2X - 16} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={phase === 'operands' ? 2.4 : 1.75}
                  strokeOpacity={0.85}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.24, delay: idx * 0.04 }}
                />
                <motion.path
                  d={`M ${col2X + 16} ${y2} C ${col2X + 72} ${y2}, ${col3X - 72} ${y3}, ${col3X - 16} ${y3}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={phase === 'result' ? 2.4 : 1.75}
                  strokeOpacity={0.85}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.24, delay: 0.08 + idx * 0.04 }}
                />
              </g>
            );
          })}

          {/* Nodes across columns */}
          {Array.from({ length: degree }, (_, idx) => {
            const val = idx + 1;
            const y = topY + idx * rowGap;
            const directOut = mapComp[idx];
            const color = VERTEX_COLORS[idx % VERTEX_COLORS.length];

            return (
              <g key={`nodes-${val}`}>
                {/* Input node */}
                <circle cx={col1X} cy={y} r={12} fill={color} />
                <text x={col1X} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
                  {val}
                </text>

                {/* Intermediate slot */}
                <circle cx={col2X} cy={y} r={12} fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
                <text x={col2X} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1E293B">
                  {val}
                </text>

                {/* Final slot */}
                <circle cx={col3X} cy={y} r={12} fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5" />
                <text x={col3X} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#065F46">
                  {val}
                </text>

                {/* Summary direct pair x -> (a∘b)(x) */}
                <text x={col4X} y={y + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={color}>
                  {val} ↦ {directOut}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
