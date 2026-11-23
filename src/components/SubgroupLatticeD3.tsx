import * as d3 from 'd3';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Maximize2,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiniteGroup } from '../core/groupTypes.ts';
import {
  buildSubgroupLattice,
  SubgroupLatticeEdge,
  SubgroupLatticeNode,
} from '../core/latticeEngine.ts';
import { MathText } from './MathFormula.tsx';
import { SubgroupLatticePreview } from './VisualDiagrams.tsx';

interface PositionedNode extends SubgroupLatticeNode {
  x: number;
  y: number;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

function buildEdgePath(
  source: PositionedNode,
  target: PositionedNode,
  edge: SubgroupLatticeEdge,
  nodeH: number,
  edgeIndexOffset: number
): string {
  const sx = source.x;
  const sy = source.y + nodeH / 2;
  const tx = target.x;
  const ty = target.y - nodeH / 2;

  if (edge.tierSpan <= 1 || Math.abs(sx - tx) >= 40) {
    const link = d3
      .linkVertical<unknown, [number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);
    return link({ source: [sx, sy], target: [tx, ty] }) ?? '';
  }

  // Gently bow edges that jump across intermediate tiers near the same x-column
  const direction = edgeIndexOffset % 2 === 0 ? 1 : -1;
  const bow = direction * (46 + (edgeIndexOffset % 3) * 14);
  const midY = (sy + ty) / 2;
  const path = d3.path();
  path.moveTo(sx, sy);
  path.bezierCurveTo(sx + bow, midY - 18, tx + bow, midY + 18, tx, ty);
  return path.toString();
}

export function SubgroupLatticeD3({
  group,
  activeSubgroup,
  onSelectSubgroup,
}: {
  group: FiniteGroup;
  activeSubgroup: number[];
  onSelectSubgroup: (elements: number[]) => void;
}) {
  const [viewMode, setViewMode] = useState<'d3' | 'tiers'>('d3');
  const [normalOnly, setNormalOnly] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomPct, setZoomPct] = useState<number>(100);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomLayerRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const isDark = useIsDarkTheme();
  const reducedMotion = usePrefersReducedMotion();

  const lattice = useMemo(() => buildSubgroupLattice(group), [group]);

  const activeKey = useMemo(
    () => [...new Set(activeSubgroup)].sort((a, b) => a - b).join(','),
    [activeSubgroup]
  );

  const activeNode = lattice.nodeMap[activeKey] ?? null;
  const focusId = hoveredId ?? (activeNode ? activeNode.id : null);
  const inspectedNode = (hoveredId ? lattice.nodeMap[hoveredId] : null) ?? activeNode;

  // Compute coordinates via D3 linear scales
  const layout = useMemo(() => {
    const nodeW = 108;
    const nodeH = 46;
    const leftMargin = 88;
    const rightMargin = 36;
    const topMargin = 40;
    const bottomMargin = 40;
    const tierStep = 94;
    const colStep = 132;

    const maxTierSize = Math.max(
      1,
      ...lattice.nodes.map((n) => n.tierSize)
    );
    const width = Math.max(720, leftMargin + rightMargin + maxTierSize * colStep);
    const tierCount = Math.max(1, lattice.ordersDesc.length);
    const height = Math.max(360, topMargin + bottomMargin + Math.max(1, tierCount - 1) * tierStep + nodeH);

    const innerW = width - leftMargin - rightMargin;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, tierCount - 1)])
      .range([topMargin + nodeH / 2, height - bottomMargin - nodeH / 2]);

    const positionedNodes: PositionedNode[] = lattice.nodes.map((node) => {
      const k = node.tierSize;
      let x = leftMargin + innerW / 2;
      if (k > 1) {
        const span = Math.min(innerW - nodeW, (k - 1) * colStep);
        const startX = leftMargin + (innerW - span) / 2;
        const xScale = d3
          .scaleLinear()
          .domain([0, k - 1])
          .range([startX, startX + span]);
        x = xScale(node.tierPos);
      }
      const y = tierCount === 1 ? height / 2 : yScale(node.tierIndex);
      return { ...node, x, y };
    });

    const posMap = new Map<string, PositionedNode>();
    for (const pn of positionedNodes) posMap.set(pn.id, pn);

    return { width, height, nodeW, nodeH, leftMargin, rightMargin, yScale, tierCount, positionedNodes, posMap };
  }, [lattice]);

  // Attach d3.zoom to SVG
  useEffect(() => {
    if (viewMode !== 'd3' || !svgRef.current || !zoomLayerRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomLayer = d3.select(zoomLayerRef.current);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 2.5])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform.toString());
        setZoomPct(Math.round(event.transform.k * 100));
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
    setZoomPct(100);

    return () => {
      svg.on('.zoom', null);
    };
  }, [viewMode, group.id]);

  // Render tier guides, Hasse inclusion edges, and nodes using D3 data joins
  useEffect(() => {
    if (viewMode !== 'd3' || !zoomLayerRef.current) return;

    const root = d3.select(zoomLayerRef.current);
    const dur = reducedMotion ? 0 : 160;

    const palette = isDark
      ? {
          tierLine: '#1e293b',
          tierText: '#94a3b8',
          edgeDefault: '#475569',
          edgeDescendant: '#38bdf8',
          edgeAncestor: '#34d399',
          nodeFill: '#0f172a',
          nodeStroke: '#475569',
          nodeStrokeNormal: '#64748b',
          nodeText: '#f1f5f9',
          nodeSubText: '#94a3b8',
          activeFill: '#1e3a8a',
          activeStroke: '#60a5fa',
          activeSubText: '#dbeafe',
          descFill: '#0c4a6e',
          descStroke: '#38bdf8',
          ancFill: '#064e3b',
          ancStroke: '#34d399',
        }
      : {
          tierLine: '#e2e8f0',
          tierText: '#64748b',
          edgeDefault: '#94a3b8',
          edgeDescendant: '#0284c7',
          edgeAncestor: '#059669',
          nodeFill: '#ffffff',
          nodeStroke: '#cbd5e1',
          nodeStrokeNormal: '#475569',
          nodeText: '#0f172a',
          nodeSubText: '#64748b',
          activeFill: '#1d4ed8',
          activeStroke: '#1e40af',
          activeSubText: '#dbeafe',
          descFill: '#e0f2fe',
          descStroke: '#0284c7',
          ancFill: '#d1fae5',
          ancStroke: '#059669',
        };

    const focusNode = focusId ? lattice.nodeMap[focusId] : null;
    const descSet = new Set(focusNode?.descendantIds ?? []);
    const ancSet = new Set(focusNode?.ancestorIds ?? []);

    // 1. Tier guide lines & |H| labels
    const tiersGroup = root.select<SVGGElement>('g.tiers-layer');
    const tierData = lattice.ordersDesc.map((ord, idx) => ({
      ord,
      idx,
      y: layout.tierCount === 1 ? layout.height / 2 : layout.yScale(idx),
    }));

    const tierRows = tiersGroup
      .selectAll<SVGGElement, (typeof tierData)[number]>('g.tier-guide')
      .data(tierData, (d) => `${d.ord}`);

    const tierEnter = tierRows.enter().append('g').attr('class', 'tier-guide');
    tierEnter.append('line');
    tierEnter.append('text');

    const tierMerged = tierEnter.merge(tierRows);
    tierMerged
      .select('line')
      .attr('x1', layout.leftMargin - 8)
      .attr('x2', layout.width - layout.rightMargin + 8)
      .attr('y1', (d) => d.y)
      .attr('y2', (d) => d.y)
      .attr('stroke', palette.tierLine)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 4');

    tierMerged
      .select('text')
      .attr('x', 12)
      .attr('y', (d) => d.y + 4)
      .attr('fill', palette.tierText)
      .attr('font-size', 12)
      .attr('font-family', '"KaTeX_Main", Georgia, "Times New Roman", serif')
      .text((d) => `|H| = ${d.ord}`);

    tierRows.exit().remove();

    // 2. Hasse Edges
    const edgesGroup = root.select<SVGGElement>('g.edges-layer');
    const edgeSel = edgesGroup
      .selectAll<SVGPathElement, SubgroupLatticeEdge>('path.hasse-edge')
      .data(lattice.edges, (d) => d.id);

    const edgeEnter = edgeSel
      .enter()
      .append('path')
      .attr('class', 'hasse-edge')
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round');

    edgeEnter
      .merge(edgeSel)
      .attr('d', (d, idx) => {
        const s = layout.posMap.get(d.sourceId);
        const t = layout.posMap.get(d.targetId);
        if (!s || !t) return '';
        return buildEdgePath(s, t, d, layout.nodeH, idx);
      })
      .transition()
      .duration(dur)
      .attr('stroke', (d) => {
        if (focusNode) {
          const sInDown = d.sourceId === focusNode.id || descSet.has(d.sourceId);
          const tInDown = descSet.has(d.targetId);
          if (sInDown && tInDown) return palette.edgeDescendant;

          const sInUp = ancSet.has(d.sourceId);
          const tInUp = d.targetId === focusNode.id || ancSet.has(d.targetId);
          if (sInUp && tInUp) return palette.edgeAncestor;
        }
        return palette.edgeDefault;
      })
      .attr('stroke-width', (d) => {
        if (focusNode) {
          const direct = d.sourceId === focusNode.id || d.targetId === focusNode.id;
          const inDown = (d.sourceId === focusNode.id || descSet.has(d.sourceId)) && descSet.has(d.targetId);
          const inUp = ancSet.has(d.sourceId) && (d.targetId === focusNode.id || ancSet.has(d.targetId));
          if (direct) return 2.5;
          if (inDown || inUp) return 2.0;
          return 1.1;
        }
        return 1.5;
      })
      .attr('opacity', (d) => {
        if (normalOnly) {
          const sNorm = lattice.nodeMap[d.sourceId]?.isNormal;
          const tNorm = lattice.nodeMap[d.targetId]?.isNormal;
          if (!sNorm || !tNorm) return 0.1;
        }
        if (focusNode) {
          const inDown = (d.sourceId === focusNode.id || descSet.has(d.sourceId)) && descSet.has(d.targetId);
          const inUp = ancSet.has(d.sourceId) && (d.targetId === focusNode.id || ancSet.has(d.targetId));
          return inDown || inUp ? 0.95 : 0.16;
        }
        return 0.72;
      });

    edgeSel.exit().remove();

    // 3. Subgroup Nodes
    const nodesGroup = root.select<SVGGElement>('g.nodes-layer');
    const nodeSel = nodesGroup
      .selectAll<SVGGElement, PositionedNode>('g.lattice-node')
      .data(layout.positionedNodes, (d) => d.id);

    const nodeEnter = nodeSel
      .enter()
      .append('g')
      .attr('class', 'lattice-node cursor-pointer focus:outline-none')
      .attr('role', 'button')
      .attr('tabindex', 0);

    // Outer double ring for normal subgroups (structural non-hue indicator)
    nodeEnter.append('rect').attr('class', 'normal-outer-ring');
    nodeEnter.append('rect').attr('class', 'node-box');
    nodeEnter.append('text').attr('class', 'node-label');
    nodeEnter.append('text').attr('class', 'node-meta');

    const nodeMerged = nodeEnter.merge(nodeSel);

    nodeMerged
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr(
        'aria-label',
        (d) =>
          `Subgroup ${d.label}, order ${d.order}, index ${d.index}, ${
            d.isNormal ? 'normal subgroup' : 'non-normal subgroup'
          }`
      )
      .on('mouseenter', (_ev, d) => setHoveredId(d.id))
      .on('mouseleave', () => setHoveredId(null))
      .on('click', (_ev, d) => onSelectSubgroup(d.elements))
      .on('keydown', (ev: KeyboardEvent, d) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onSelectSubgroup(d.elements);
        }
      });

    nodeMerged
      .transition()
      .duration(dur)
      .attr('opacity', (d) => {
        if (normalOnly && !d.isNormal) return 0.18;
        if (focusNode) {
          if (d.id === focusNode.id || descSet.has(d.id) || ancSet.has(d.id)) return 1;
          return 0.34;
        }
        return 1;
      });

    nodeMerged
      .select<SVGRectElement>('rect.normal-outer-ring')
      .attr('x', -layout.nodeW / 2 - 4)
      .attr('y', -layout.nodeH / 2 - 4)
      .attr('width', layout.nodeW + 8)
      .attr('height', layout.nodeH + 8)
      .attr('rx', 11)
      .attr('fill', 'none')
      .attr('stroke-width', 1.4)
      .attr('stroke', (d) => {
        if (!d.isNormal) return 'none';
        if (d.id === activeKey || d.id === focusId) return palette.activeStroke;
        if (descSet.has(d.id)) return palette.descStroke;
        if (ancSet.has(d.id)) return palette.ancStroke;
        return palette.nodeStrokeNormal;
      })
      .attr('opacity', (d) => (d.isNormal ? 0.85 : 0));

    nodeMerged
      .select<SVGRectElement>('rect.node-box')
      .attr('x', -layout.nodeW / 2)
      .attr('y', -layout.nodeH / 2)
      .attr('width', layout.nodeW)
      .attr('height', layout.nodeH)
      .attr('rx', 8)
      .attr('stroke-width', (d) => (d.id === activeKey || d.id === focusId ? 2 : 1.25))
      .attr('stroke-dasharray', (d) => (d.isNormal ? 'none' : '4 2'))
      .attr('fill', (d) => {
        if (d.id === activeKey || d.id === focusId) return palette.activeFill;
        if (descSet.has(d.id)) return palette.descFill;
        if (ancSet.has(d.id)) return palette.ancFill;
        return palette.nodeFill;
      })
      .attr('stroke', (d) => {
        if (d.id === activeKey || d.id === focusId) return palette.activeStroke;
        if (descSet.has(d.id)) return palette.descStroke;
        if (ancSet.has(d.id)) return palette.ancStroke;
        return d.isNormal ? palette.nodeStrokeNormal : palette.nodeStroke;
      });

    nodeMerged
      .select<SVGTextElement>('text.node-label')
      .attr('x', 0)
      .attr('y', -3)
      .attr('text-anchor', 'middle')
      .attr('font-size', (d) => (d.label.length > 11 ? 11.5 : 13))
      .attr('font-weight', 600)
      .attr('font-family', '"KaTeX_Main", "KaTeX_Math", Georgia, "Times New Roman", serif')
      .attr('fill', (d) =>
        d.id === activeKey || d.id === focusId ? '#ffffff' : palette.nodeText
      )
      .text((d) => (d.label.length > 15 ? `${d.label.slice(0, 14)}…` : d.label));

    nodeMerged
      .select<SVGTextElement>('text.node-meta')
      .attr('x', 0)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10.5)
      .attr('font-family', '"KaTeX_Main", Georgia, "Times New Roman", serif')
      .attr('fill', (d) =>
        d.id === activeKey || d.id === focusId ? palette.activeSubText : palette.nodeSubText
      )
      .text((d) => `|H| = ${d.order}${d.isNormal ? ' · ◁' : ''}`);

    nodeSel.exit().remove();
  }, [
    viewMode,
    lattice,
    layout,
    focusId,
    activeKey,
    normalOnly,
    isDark,
    reducedMotion,
    onSelectSubgroup,
  ]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .duration(reducedMotion ? 0 : 180)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .duration(reducedMotion ? 0 : 200)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            Subgroup Lattice (Hasse Inclusion Diagram)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {lattice.nodes.length} subgroups · {lattice.edges.length} covering inclusions ·{' '}
            {lattice.exhaustive ? 'Complete Exhaustive Lattice' : 'Resource-Bounded Sample (|G| > 24)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'd3' && (
            <>
              <button
                type="button"
                onClick={() => setNormalOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  normalOnly
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {normalOnly ? 'Showing Normal Only (◁)' : 'Isolate Normal (◁)'}
              </button>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => handleZoom(1.25)}
                  aria-label="Zoom in lattice"
                  title="Zoom in"
                  className="p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
                  {zoomPct}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(0.8)}
                  aria-label="Zoom out lattice"
                  title="Zoom out"
                  className="p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  aria-label="Reset lattice zoom"
                  title="Reset zoom and pan"
                  className="p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('d3')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'd3'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Lattice Graph
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tiers')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'tiers'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Order Tiers
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'tiers' ? (
        <SubgroupLatticePreview
          group={group}
          subgroups={lattice.nodes.map((n) => n.elements)}
          activeSubgroup={activeSubgroup}
          onSelectSubgroup={onSelectSubgroup}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Interactive D3 Hasse Canvas (~67%) */}
          <div className="xl:col-span-8 flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 overflow-hidden">
            <div className="relative flex-1 min-h-[380px]">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                className="w-full h-full min-h-[380px] max-h-[540px] select-none touch-none"
                role="img"
                aria-label={`Hasse subgroup lattice diagram for ${group.name}`}
              >
                <g ref={zoomLayerRef} className="lattice-zoom-layer">
                  <g className="tiers-layer" />
                  <g className="edges-layer" />
                  <g className="nodes-layer" />
                </g>
              </svg>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Double solid border: Normal (<MathText text="H ◁ G" />)</span>
                <span>Dashed border: Non-normal</span>
                <span>Sky paths: Subgroups <MathText text="K ≤ H" /></span>
                <span>Emerald paths: Supergroups <MathText text="H ≤ K" /></span>
              </div>
              <span>Click node to select · Scroll/drag to zoom & pan</span>
            </div>
          </div>

          {/* Inclusion Inspector Deck (~33%) */}
          <div className="xl:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 flex flex-col justify-between space-y-4">
            <AnimatePresence mode="wait">
              {!inspectedNode ? (
                <motion.div
                  key="none"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Inclusion Inspector
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    The current element selection does not form a closed subgroup of <MathText text={group.name} />. Click any node in the Hasse diagram or use “Generate ⟨Selection⟩” above to highlight its subgroup inclusion cone.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={inspectedNode.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {hoveredId ? 'Hover Preview' : 'Selected Subgroup'} · {inspectedNode.isCyclic ? 'Cyclic' : 'Non-cyclic'}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      <MathText text={inspectedNode.label} />
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${
                      inspectedNode.isNormal
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {inspectedNode.isNormal ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {inspectedNode.isNormal ? 'Normal (◁)' : 'Non-normal'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Order <MathText text="|H|" /></div>
                    <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {inspectedNode.order}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Index <MathText text="[G:H]" /></div>
                    <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {inspectedNode.index}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">Generators</div>
                    <div
                      className="font-semibold text-slate-900 dark:text-slate-100 truncate"
                      title={inspectedNode.generatorsLabel}
                    >
                      <MathText text={inspectedNode.generatorsLabel} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Elements ({inspectedNode.order})
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 break-words">
                    <MathText text={`{${inspectedNode.elementLabels.join(', ')}}`} />
                  </div>
                </div>

                {/* Direct Supergroups (Covering Up) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <ChevronUp className="w-3.5 h-3.5" />
                    Direct Supergroups ({inspectedNode.coveredByIds.length})
                  </div>
                  {inspectedNode.coveredByIds.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Top of lattice (whole group <MathText text={group.name} />)
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedNode.coveredByIds.map((pid) => {
                        const parent = lattice.nodeMap[pid];
                        if (!parent) return null;
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => onSelectSubgroup(parent.elements)}
                            className="px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 hover:border-emerald-500 text-xs text-emerald-900 dark:text-emerald-200 transition-colors whitespace-nowrap shrink-0"
                          >
                            <MathText text={`${parent.label} (|H| = ${parent.order})`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct Subgroups (Covered Down) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-sky-700 dark:text-sky-400 inline-flex items-center gap-1">
                    <ChevronDown className="w-3.5 h-3.5" />
                    Maximal Subgroups Inside <MathText text="H" /> ({inspectedNode.coversIds.length})
                  </div>
                  {inspectedNode.coversIds.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Bottom of lattice (trivial subgroup)
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedNode.coversIds.map((cid) => {
                        const child = lattice.nodeMap[cid];
                        if (!child) return null;
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => onSelectSubgroup(child.elements)}
                            className="px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 hover:border-sky-500 text-xs text-sky-900 dark:text-sky-200 transition-colors whitespace-nowrap shrink-0"
                          >
                            <MathText text={`${child.label} (|H| = ${child.order})`} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                </motion.div>
              )}
            </AnimatePresence>

            {inspectedNode && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                Inclusion Cone: Contains {inspectedNode.descendantIds.length} proper subgroup(s) · Contained in{' '}
                {inspectedNode.ancestorIds.length} proper supergroup(s)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
