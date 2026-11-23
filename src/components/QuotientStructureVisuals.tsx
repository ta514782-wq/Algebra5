import * as d3 from 'd3';
import { CheckCircle2, GitMerge, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CosetAnalysis, FiniteGroup, QuotientGroupAnalysis } from '../core/groupTypes.ts';
import { IsomorphismResult } from '../core/isomorphismEngine.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const FIBER_COLORS_LIGHT = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0891b2', '#ea580c', '#0d9488'];
const FIBER_COLORS_DARK = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#fb923c', '#2dd4bf'];

export function QuotientEpimorphismD3({
  group,
  cosets,
  quotient,
}: {
  group: FiniteGroup;
  cosets: CosetAnalysis;
  quotient: QuotientGroupAnalysis;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedCosetIdx, setSelectedCosetIdx] = useState<number>(0);
  const isDark = useIsDarkMode();

  const qGroup = quotient.quotientGroup;
  const distinct = cosets.distinctLeftCosets;

  const layout = useMemo(() => {
    if (!qGroup || group.order > 24) return null;

    const width = 680;
    const elemStep = 30;
    const groupGap = 14;
    let curY = 46;

    const fiberBoxes: Array<{
      cosetIdx: number;
      cosetLabel: string;
      topY: number;
      bottomY: number;
      centerY: number;
      members: Array<{ elIdx: number; label: string; y: number }>;
    }> = [];

    distinct.forEach((c, cIdx) => {
      const topY = curY;
      const members = c.elementIndices.map((elIdx, mPos) => ({
        elIdx,
        label: group.elements[elIdx],
        y: topY + 18 + mPos * elemStep,
      }));
      const bottomY = topY + Math.max(36, c.elementIndices.length * elemStep + 6);
      fiberBoxes.push({
        cosetIdx: cIdx,
        cosetLabel: c.cosetLabel,
        topY,
        bottomY,
        centerY: (topY + bottomY) / 2,
        members,
      });
      curY = bottomY + groupGap;
    });

    const height = Math.max(280, curY + 20);
    return { width, height, fiberBoxes };
  }, [group, distinct, qGroup]);

  useEffect(() => {
    if (!svgRef.current || !layout || !qGroup) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const colors = isDark ? FIBER_COLORS_DARK : FIBER_COLORS_LIGHT;
    const textCol = isDark ? '#f1f5f9' : '#0f172a';
    const mutedCol = isDark ? '#94a3b8' : '#64748b';
    const cardBg = isDark ? '#0f172a' : '#ffffff';
    const cardStroke = isDark ? '#334155' : '#cbd5e1';

    // Column Headers
    svg
      .append('text')
      .attr('x', 135)
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('fill', mutedCol)
      .attr('font-family', '"KaTeX_Main", Georgia, serif')
      .text(`Group ${group.name} (Fibers of H)`);

    svg
      .append('text')
      .attr('x', 535)
      .attr('y', 24)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('fill', mutedCol)
      .attr('font-family', '"KaTeX_Main", Georgia, serif')
      .text(`Quotient ${qGroup.name} (Order ${qGroup.order})`);

    const linkGen = d3
      .linkHorizontal<unknown, [number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);

    // Draw edges first
    const edgeLayer = svg.append('g');
    layout.fiberBoxes.forEach((box) => {
      const col = colors[box.cosetIdx % colors.length];
      const isSel = selectedCosetIdx === box.cosetIdx;
      box.members.forEach((m) => {
        edgeLayer
          .append('path')
          .attr('d', linkGen({ source: [228, m.y], target: [442, box.centerY] }) ?? '')
          .attr('fill', 'none')
          .attr('stroke', col)
          .attr('stroke-width', isSel ? 2.2 : 1.35)
          .attr('opacity', isSel ? 0.92 : 0.35);
      });
    });

    // Left Fiber Boxes + Element Pills
    const leftLayer = svg.append('g');
    layout.fiberBoxes.forEach((box) => {
      const col = colors[box.cosetIdx % colors.length];
      const isSel = selectedCosetIdx === box.cosetIdx;

      leftLayer
        .append('rect')
        .attr('x', 28)
        .attr('y', box.topY)
        .attr('width', 200)
        .attr('height', box.bottomY - box.topY)
        .attr('rx', 10)
        .attr('fill', cardBg)
        .attr('stroke', isSel ? col : cardStroke)
        .attr('stroke-width', isSel ? 2 : 1.1)
        .style('cursor', 'pointer')
        .on('click', () => setSelectedCosetIdx(box.cosetIdx));

      box.members.forEach((m) => {
        leftLayer
          .append('circle')
          .attr('cx', 48)
          .attr('cy', m.y)
          .attr('r', 4)
          .attr('fill', col);

        leftLayer
          .append('text')
          .attr('x', 62)
          .attr('y', m.y + 4)
          .attr('font-size', 12.5)
          .attr('fill', textCol)
          .attr('font-family', '"KaTeX_Main", "KaTeX_Math", Georgia, serif')
          .style('cursor', 'pointer')
          .text(m.label)
          .on('click', () => setSelectedCosetIdx(box.cosetIdx));
      });
    });

    // Right Quotient Nodes
    const rightLayer = svg.append('g');
    layout.fiberBoxes.forEach((box) => {
      const col = colors[box.cosetIdx % colors.length];
      const isSel = selectedCosetIdx === box.cosetIdx;
      const qElem = quotient.quotientElements?.[box.cosetIdx];
      const isKernel = box.cosetIdx === (quotient.identityCosetIndex ?? 0);

      const gNode = rightLayer
        .append('g')
        .attr('transform', `translate(442, ${box.centerY - 22})`)
        .style('cursor', 'pointer')
        .on('click', () => setSelectedCosetIdx(box.cosetIdx));

      if (isKernel) {
        gNode
          .append('rect')
          .attr('x', -4)
          .attr('y', -4)
          .attr('width', 194)
          .attr('height', 52)
          .attr('rx', 12)
          .attr('fill', 'none')
          .attr('stroke', col)
          .attr('stroke-width', 1.25);
      }

      gNode
        .append('rect')
        .attr('width', 186)
        .attr('height', 44)
        .attr('rx', 9)
        .attr('fill', cardBg)
        .attr('stroke', isSel ? col : cardStroke)
        .attr('stroke-width', isSel ? 2.2 : 1.25);

      gNode
        .append('text')
        .attr('x', 14)
        .attr('y', 19)
        .attr('font-size', 13)
        .attr('font-weight', 600)
        .attr('fill', textCol)
        .attr('font-family', '"KaTeX_Main", "KaTeX_Math", Georgia, serif')
        .text(box.cosetLabel);

      gNode
        .append('text')
        .attr('x', 14)
        .attr('y', 35)
        .attr('font-size', 10.5)
        .attr('fill', mutedCol)
        .attr('font-family', '"KaTeX_Main", Georgia, serif')
        .text(
          `ord = ${qElem?.order ?? '?'}${isKernel ? ' · Identity (ker π = H)' : ''}`
        );
    });
  }, [layout, group, qGroup, quotient, selectedCosetIdx, isDark]);

  if (!quotient.canConstruct || !qGroup) return null;

  const activeInfo = quotient.quotientElements?.[selectedCosetIdx];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            Natural Epimorphism & Fiber Collapse <MathFormula latex={`\\pi: ${group.latexName} \\twoheadrightarrow ${qGroup.latexName}`} />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <MathText text="Every element x ∈ G maps to its coset π(x) = xH, collapsing the normal subgroup H to the identity coset ker(π) = H." />
          </p>
        </div>
        {activeInfo && (
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
            <MathText
              text={`Fiber π⁻¹(${activeInfo.cosetLabel}) = {${activeInfo.memberLabels.join(', ')}} · ord(${activeInfo.cosetLabel}) = ${activeInfo.order}`}
            />
          </div>
        )}
      </div>

      {group.order > 24 || !layout ? (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
          <MathText
            text={`Group order |G| = ${group.order} > 24: visual fiber diagram is capped at 24 elements, while all ${qGroup.order} quotient cosets in G/H remain exact in the Cayley table below.`}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="w-full min-w-[540px] max-h-[480px]"
            role="img"
            aria-label={`Natural epimorphism fiber diagram from ${group.name} to ${qGroup.name}`}
          />
        </div>
      )}
    </div>
  );
}

export function IsomorphismWitnessPanel({ proof }: { proof: IsomorphismResult | null }) {
  if (!proof || !proof.isomorphic) return null;

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Verified Explicit Isomorphism Proof{' '}
            <MathFormula latex={`${proof.sourceLatex} \\cong ${proof.targetLatex}`} />
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            <MathText text={proof.reason} />
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 tabular-nums">
          <CheckCircle2 className="w-4 h-4" />
          {proof.verifiedPairs} / {proof.totalPairs} Pairs Verified
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {proof.mapping.map((m) => (
          <div
            key={m.sourceIndex}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs"
          >
            <MathFormula latex={`\\varphi(${m.sourceLatex}) = ${m.targetLatex}`} />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              <MathFormula latex={`\\mathrm{ord} = ${m.order}`} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
