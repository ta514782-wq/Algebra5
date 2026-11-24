import * as d3 from 'd3';
import {
  CheckCircle2,
  GitBranch,
  Grid3X3,
  Orbit,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildVisualCheatSheetData,
  CayleyCellDatum,
  CHEAT_SHEET_GROUPS,
  CheatSheetGroupKey,
} from '../core/visualCheatSheetEngine.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

type DiagramMode = 'cayley' | 'lattice' | 'orbits';
type CayleyColorMode = 'element' | 'order' | 'commute';

const CAYLEY_PALETTE = [
  '#e2e8f0', // 0: identity neutral
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#dc2626',
  '#db2777',
  '#4f46e5',
  '#0d9488',
  '#ca8a04',
  '#ea580c',
];

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

export function VisualCheatSheetD3() {
  const [selectedKey, setSelectedKey] = useState<CheatSheetGroupKey>('D_4');
  const [diagramMode, setDiagramMode] = useState<DiagramMode>('cayley');
  const [cayleyColorMode, setCayleyColorMode] = useState<CayleyColorMode>('element');

  // Interactive selections per mode
  const [hoveredCell, setHoveredCell] = useState<CayleyCellDatum | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedElementIdx, setSelectedElementIdx] = useState<number>(1);

  const cayleySvgRef = useRef<SVGSVGElement | null>(null);
  const latticeSvgRef = useRef<SVGSVGElement | null>(null);
  const orbitsSvgRef = useRef<SVGSVGElement | null>(null);

  const isDark = useIsDarkTheme();

  const preset = useMemo(
    () => CHEAT_SHEET_GROUPS.find((g) => g.key === selectedKey) ?? CHEAT_SHEET_GROUPS[0],
    [selectedKey]
  );

  const data = useMemo(() => buildVisualCheatSheetData(preset.build()), [preset]);

  // Reset contextual selections cleanly when group changes
  useEffect(() => {
    setHoveredCell(null);
    const defaultNode =
      data.lattice.nodes.find((n) => !n.isTrivial && !n.isWhole) ?? data.lattice.nodes[0];
    setSelectedNodeId(defaultNode?.id ?? null);
    setHoveredNodeId(null);
    setSelectedElementIdx(data.group.order > 1 ? 1 : 0);
  }, [data]);

  // 1. D3 CAYLEY TABLE RENDERER
  useEffect(() => {
    if (diagramMode !== 'cayley' || !cayleySvgRef.current) return;

    const svg = d3.select(cayleySvgRef.current);
    svg.selectAll('*').remove();

    const n = data.group.order;
    const cellSize = n >= 12 ? 36 : n >= 8 ? 48 : 58;
    const headerSize = n >= 12 ? 46 : 54;
    const pad = 14;
    const size = headerSize + n * cellSize + pad * 2;

    svg.attr('viewBox', `0 0 ${size} ${size}`);

    const band = d3
      .scaleBand<number>()
      .domain(d3.range(n))
      .range([pad + headerSize, pad + headerSize + n * cellSize])
      .padding(0.08);

    const elementColorScale = d3
      .scaleOrdinal<number, string>()
      .domain(d3.range(n))
      .range(CAYLEY_PALETTE);

    const orderDomain = Array.from(new Set(data.group.orders)).sort((a, b) => a - b);
    const orderColorScale = d3
      .scaleOrdinal<number, string>()
      .domain(orderDomain)
      .range(['#64748b', '#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626']);

    const bgTextDefault = isDark ? '#f1f5f9' : '#0f172a';
    const headerFill = isDark ? '#1e293b' : '#f1f5f9';
    const headerStroke = isDark ? '#334155' : '#cbd5e1';

    const gRoot = svg.append('g');

    // Top-left operation badge
    gRoot
      .append('rect')
      .attr('x', pad)
      .attr('y', pad)
      .attr('width', headerSize - 6)
      .attr('height', headerSize - 6)
      .attr('rx', 6)
      .attr('fill', isDark ? '#0f172a' : '#e2e8f0')
      .attr('stroke', headerStroke);

    gRoot
      .append('text')
      .attr('x', pad + (headerSize - 6) / 2)
      .attr('y', pad + (headerSize - 6) / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', 15)
      .attr('font-weight', 700)
      .attr('fill', bgTextDefault)
      .text(data.group.operationSymbol);

    // Column headers
    gRoot
      .selectAll<SVGGElement, number>('g.col-hdr')
      .data(d3.range(n))
      .enter()
      .append('g')
      .attr('class', 'col-hdr')
      .each(function (cIdx) {
        const grp = d3.select(this);
        const x = band(cIdx)!;
        const w = band.bandwidth();
        grp
          .append('rect')
          .attr('x', x)
          .attr('y', pad)
          .attr('width', w)
          .attr('height', headerSize - 6)
          .attr('rx', 5)
          .attr('fill', headerFill)
          .attr('stroke', headerStroke);
        grp
          .append('text')
          .attr('x', x + w / 2)
          .attr('y', pad + (headerSize - 6) / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', n >= 12 ? 9.5 : 12)
          .attr('font-weight', 700)
          .attr('font-family', '"JetBrains Mono", monospace')
          .attr('fill', bgTextDefault)
          .text(data.group.elements[cIdx]);
      });

    // Row headers
    gRoot
      .selectAll<SVGGElement, number>('g.row-hdr')
      .data(d3.range(n))
      .enter()
      .append('g')
      .attr('class', 'row-hdr')
      .each(function (rIdx) {
        const grp = d3.select(this);
        const y = band(rIdx)!;
        const h = band.bandwidth();
        grp
          .append('rect')
          .attr('x', pad)
          .attr('y', y)
          .attr('width', headerSize - 6)
          .attr('height', h)
          .attr('rx', 5)
          .attr('fill', headerFill)
          .attr('stroke', headerStroke);
        grp
          .append('text')
          .attr('x', pad + (headerSize - 6) / 2)
          .attr('y', y + h / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', n >= 12 ? 9.5 : 12)
          .attr('font-weight', 700)
          .attr('font-family', '"JetBrains Mono", monospace')
          .attr('fill', bgTextDefault)
          .text(data.group.elements[rIdx]);
      });

    // Matrix cells via D3 data join
    const cellsGroup = gRoot.append('g').attr('class', 'cells-layer');
    const cellNodes = cellsGroup
      .selectAll<SVGGElement, CayleyCellDatum>('g.cayley-cell')
      .data(data.cayleyCells, (d) => `${d.row}-${d.col}`)
      .enter()
      .append('g')
      .attr('class', 'cayley-cell cursor-pointer')
      .on('mouseenter', (_ev, d) => setHoveredCell(d))
      .on('click', (_ev, d) => setHoveredCell(d));

    cellNodes
      .append('rect')
      .attr('x', (d) => band(d.col)!)
      .attr('y', (d) => band(d.row)!)
      .attr('width', band.bandwidth())
      .attr('height', band.bandwidth())
      .attr('rx', 5)
      .attr('fill', (d) => {
        if (cayleyColorMode === 'commute') {
          return d.commutes ? '#059669' : '#d97706';
        }
        if (cayleyColorMode === 'order') {
          return orderColorScale(d.productOrder);
        }
        if (d.productIndex === data.group.identityIndex) {
          return isDark ? '#334155' : '#e2e8f0';
        }
        return elementColorScale(d.productIndex);
      })
      .attr('fill-opacity', (d) => {
        if (hoveredCell) {
          if (hoveredCell.row === d.row && hoveredCell.col === d.col) return 1;
          if (hoveredCell.row === d.row || hoveredCell.col === d.col) return 0.92;
          return 0.45;
        }
        return 0.88;
      })
      .attr('stroke', (d) => {
        if (hoveredCell && hoveredCell.row === d.row && hoveredCell.col === d.col) {
          return isDark ? '#ffffff' : '#0f172a';
        }
        return 'transparent';
      })
      .attr('stroke-width', 2);

    cellNodes
      .append('text')
      .attr('x', (d) => band(d.col)! + band.bandwidth() / 2)
      .attr('y', (d) => band(d.row)! + band.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', n >= 12 ? 8.5 : 11)
      .attr('font-weight', 600)
      .attr('font-family', '"JetBrains Mono", monospace')
      .attr('fill', (d) => {
        if (cayleyColorMode === 'element' && d.productIndex === data.group.identityIndex) {
          return isDark ? '#f8fafc' : '#0f172a';
        }
        return '#ffffff';
      })
      .text((d) => d.productLabel);
  }, [diagramMode, data, cayleyColorMode, hoveredCell, isDark]);

  // 2. D3 SUBGROUP LATTICE HASSE RENDERER
  useEffect(() => {
    if (diagramMode !== 'lattice' || !latticeSvgRef.current) return;

    const svg = d3.select(latticeSvgRef.current);
    svg.selectAll('*').remove();

    const lattice = data.lattice;
    const nodeW = 104;
    const nodeH = 44;
    const leftMargin = 82;
    const rightMargin = 28;
    const topMargin = 32;
    const bottomMargin = 32;
    const tierStep = 84;
    const colStep = 122;

    const maxTierSize = Math.max(1, ...lattice.nodes.map((n) => n.tierSize));
    const width = Math.max(660, leftMargin + rightMargin + maxTierSize * colStep);
    const tierCount = Math.max(1, lattice.ordersDesc.length);
    const height = Math.max(330, topMargin + bottomMargin + Math.max(1, tierCount - 1) * tierStep + nodeH);

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - leftMargin - rightMargin;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, tierCount - 1)])
      .range([topMargin + nodeH / 2, height - bottomMargin - nodeH / 2]);

    const posMap = new Map<string, { x: number; y: number }>();
    const posNodes = lattice.nodes.map((node) => {
      const k = node.tierSize;
      let x = leftMargin + innerW / 2;
      if (k > 1) {
        const span = Math.min(innerW - nodeW, (k - 1) * colStep);
        const startX = leftMargin + (innerW - span) / 2;
        const xScale = d3.scaleLinear().domain([0, k - 1]).range([startX, startX + span]);
        x = xScale(node.tierPos);
      }
      const y = tierCount === 1 ? height / 2 : yScale(node.tierIndex);
      posMap.set(node.id, { x, y });
      return { ...node, x, y };
    });

    const focusId = hoveredNodeId ?? selectedNodeId;
    const focusNode = focusId ? lattice.nodeMap[focusId] : null;
    const descSet = new Set(focusNode?.descendantIds ?? []);
    const ancSet = new Set(focusNode?.ancestorIds ?? []);

    const palette = isDark
      ? {
          tierLine: '#1e293b',
          tierText: '#94a3b8',
          edgeDefault: '#475569',
          edgeDesc: '#38bdf8',
          edgeAnc: '#34d399',
          nodeFill: '#0f172a',
          nodeStroke: '#475569',
          nodeText: '#f1f5f9',
          subText: '#94a3b8',
          activeFill: '#1d4ed8',
          activeStroke: '#93c5fd',
          descFill: '#0c4a6e',
          ancFill: '#064e3b',
        }
      : {
          tierLine: '#e2e8f0',
          tierText: '#64748b',
          edgeDefault: '#94a3b8',
          edgeDesc: '#0284c7',
          edgeAnc: '#059669',
          nodeFill: '#ffffff',
          nodeStroke: '#cbd5e1',
          nodeText: '#0f172a',
          subText: '#64748b',
          activeFill: '#1d4ed8',
          activeStroke: '#1e40af',
          descFill: '#e0f2fe',
          ancFill: '#d1fae5',
        };

    // Tier guides
    const tiersG = svg.append('g');
    lattice.ordersDesc.forEach((ord, idx) => {
      const y = tierCount === 1 ? height / 2 : yScale(idx);
      tiersG
        .append('line')
        .attr('x1', leftMargin - 8)
        .attr('x2', width - rightMargin + 8)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', palette.tierLine)
        .attr('stroke-dasharray', '3 4');
      tiersG
        .append('text')
        .attr('x', 12)
        .attr('y', y + 4)
        .attr('font-size', 11.5)
        .attr('fill', palette.tierText)
        .attr('font-family', '"KaTeX_Main", Georgia, serif')
        .text(`|H| = ${ord}`);
    });

    // Hasse edges via d3.linkVertical
    const linkGen = d3
      .linkVertical<unknown, [number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);

    svg
      .append('g')
      .selectAll('path.lattice-edge')
      .data(lattice.edges)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('d', (d) => {
        const s = posMap.get(d.sourceId)!;
        const t = posMap.get(d.targetId)!;
        return linkGen({ source: [s.x, s.y + nodeH / 2], target: [t.x, t.y - nodeH / 2] }) ?? '';
      })
      .attr('stroke', (d) => {
        if (focusNode) {
          const inDown = (d.sourceId === focusNode.id || descSet.has(d.sourceId)) && descSet.has(d.targetId);
          const inUp = ancSet.has(d.sourceId) && (d.targetId === focusNode.id || ancSet.has(d.targetId));
          if (inDown) return palette.edgeDesc;
          if (inUp) return palette.edgeAnc;
        }
        return palette.edgeDefault;
      })
      .attr('stroke-width', (d) => {
        if (focusNode && (d.sourceId === focusNode.id || d.targetId === focusNode.id)) return 2.4;
        return 1.5;
      })
      .attr('opacity', (d) => {
        if (!focusNode) return 0.75;
        const inDown = (d.sourceId === focusNode.id || descSet.has(d.sourceId)) && descSet.has(d.targetId);
        const inUp = ancSet.has(d.sourceId) && (d.targetId === focusNode.id || ancSet.has(d.targetId));
        return inDown || inUp ? 1 : 0.16;
      });

    // Subgroup nodes
    const nodesG = svg
      .append('g')
      .selectAll('g.cheat-node')
      .data(posNodes)
      .enter()
      .append('g')
      .attr('class', 'cheat-node cursor-pointer')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .on('mouseenter', (_ev, d) => setHoveredNodeId(d.id))
      .on('mouseleave', () => setHoveredNodeId(null))
      .on('click', (_ev, d) => setSelectedNodeId(d.id));

    // Normal outer ring
    nodesG
      .filter((d) => d.isNormal)
      .append('rect')
      .attr('x', -nodeW / 2 - 4)
      .attr('y', -nodeH / 2 - 4)
      .attr('width', nodeW + 8)
      .attr('height', nodeH + 8)
      .attr('rx', 10)
      .attr('fill', 'none')
      .attr('stroke', (d) =>
        d.id === focusId ? palette.activeStroke : isDark ? '#64748b' : '#475569'
      )
      .attr('stroke-width', 1.3);

    nodesG
      .append('rect')
      .attr('x', -nodeW / 2)
      .attr('y', -nodeH / 2)
      .attr('width', nodeW)
      .attr('height', nodeH)
      .attr('rx', 7)
      .attr('stroke-dasharray', (d) => (d.isNormal ? 'none' : '4 2'))
      .attr('fill', (d) => {
        if (d.id === focusId) return palette.activeFill;
        if (descSet.has(d.id)) return palette.descFill;
        if (ancSet.has(d.id)) return palette.ancFill;
        return palette.nodeFill;
      })
      .attr('stroke', (d) => {
        if (d.id === focusId) return palette.activeStroke;
        if (descSet.has(d.id)) return palette.edgeDesc;
        if (ancSet.has(d.id)) return palette.edgeAnc;
        return palette.nodeStroke;
      })
      .attr('stroke-width', (d) => (d.id === focusId ? 2 : 1.25));

    nodesG
      .append('text')
      .attr('y', -3)
      .attr('text-anchor', 'middle')
      .attr('font-size', (d) => (d.label.length > 10 ? 11 : 12.5))
      .attr('font-weight', 600)
      .attr('font-family', '"KaTeX_Main", Georgia, serif')
      .attr('fill', (d) => (d.id === focusId ? '#ffffff' : palette.nodeText))
      .text((d) => (d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label));

    nodesG
      .append('text')
      .attr('y', 13)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', (d) => (d.id === focusId ? '#dbeafe' : palette.subText))
      .text((d) => `|H|=${d.order}${d.isNormal ? ' · ◁' : ''}`);
  }, [diagramMode, data, selectedNodeId, hoveredNodeId, isDark]);

  // 3. D3 CONJUGACY & ELEMENT ORDER ORBIT GRAPH
  useEffect(() => {
    if (diagramMode !== 'orbits' || !orbitsSvgRef.current) return;

    const svg = d3.select(orbitsSvgRef.current);
    svg.selectAll('*').remove();

    const width = 680;
    const height = 400;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const classes = data.conjugacy.classes;
    const numClasses = classes.length;
    const cx = width / 2;
    const cy = height / 2;
    const ringRadius = Math.min(width, height) * 0.34;

    const clusterColors = d3.scaleOrdinal<number, string>()
      .domain(d3.range(numClasses))
      .range(['#64748b', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626']);

    const bgLine = isDark ? '#334155' : '#cbd5e1';
    const centerText = isDark ? '#e2e8f0' : '#0f172a';
    const mutedText = isDark ? '#94a3b8' : '#64748b';

    // Outer reference ring
    svg
      .append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', ringRadius)
      .attr('fill', 'none')
      .attr('stroke', bgLine)
      .attr('stroke-dasharray', '4 4');

    // Center Class Equation hub
    svg
      .append('text')
      .attr('x', cx)
      .attr('y', cy - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .attr('font-weight', 700)
      .attr('fill', centerText)
      .text(`${data.group.name} Class Equation`);

    svg
      .append('text')
      .attr('x', cx)
      .attr('y', cy + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-family', '"JetBrains Mono", monospace')
      .attr('fill', isDark ? '#60a5fa' : '#1d4ed8')
      .text(data.conjugacy.classEquationString);

    // Draw each conjugacy class cluster around the ring
    classes.forEach((cls, cIdx) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * cIdx) / numClasses;
      const clusterX = cx + ringRadius * Math.cos(angle);
      const clusterY = cy + ringRadius * Math.sin(angle);
      const clusterR = cls.size === 1 ? 26 : 30 + cls.size * 6;
      const color = cls.isCentral ? '#059669' : clusterColors(cIdx);

      // Spoke line from center
      svg
        .append('line')
        .attr('x1', cx)
        .attr('y1', cy)
        .attr('x2', clusterX)
        .attr('y2', clusterY)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', 1.5);

      // Cluster boundary bubble
      svg
        .append('circle')
        .attr('cx', clusterX)
        .attr('cy', clusterY)
        .attr('r', clusterR)
        .attr('fill', color)
        .attr('fill-opacity', isDark ? 0.14 : 0.08)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.55)
        .attr('stroke-dasharray', cls.isCentral ? 'none' : '3 2');

      // Cluster caption outside ring
      const capX = cx + (ringRadius + clusterR + 18) * Math.cos(angle);
      const capY = cy + (ringRadius + clusterR + 18) * Math.sin(angle);
      svg
        .append('text')
        .attr('x', capX)
        .attr('y', capY + 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .attr('fill', mutedText)
        .text(cls.isCentral ? 'Z(G) · |Cl|=1' : `|Cl|=${cls.size}`);

      // Individual element nodes inside cluster
      cls.elements.forEach((elIdx, k) => {
        const subAngle = (2 * Math.PI * k) / cls.elements.length;
        const offsetR = cls.elements.length === 1 ? 0 : Math.min(clusterR - 16, 22);
        const ex = clusterX + offsetR * Math.cos(subAngle);
        const ey = clusterY + offsetR * Math.sin(subAngle);
        const isSel = elIdx === selectedElementIdx;

        const elG = svg
          .append('g')
          .attr('class', 'cursor-pointer')
          .on('click', () => setSelectedElementIdx(elIdx))
          .on('mouseenter', () => setSelectedElementIdx(elIdx));

        elG
          .append('circle')
          .attr('cx', ex)
          .attr('cy', ey)
          .attr('r', cls.elements.length >= 4 ? 13 : 15)
          .attr('fill', isSel ? '#1d4ed8' : color)
          .attr('stroke', isSel ? (isDark ? '#ffffff' : '#0f172a') : 'transparent')
          .attr('stroke-width', 2);

        elG
          .append('text')
          .attr('x', ex)
          .attr('y', ey + 3.5)
          .attr('text-anchor', 'middle')
          .attr('font-size', data.group.elements[elIdx].length > 5 ? 8.5 : 10.5)
          .attr('font-weight', 700)
          .attr('font-family', '"JetBrains Mono", monospace')
          .attr('fill', '#ffffff')
          .text(data.group.elements[elIdx]);
      });
    });
  }, [diagramMode, data, selectedElementIdx, isDark]);

  const activeLatticeNode =
    (hoveredNodeId ? data.lattice.nodeMap[hoveredNodeId] : null) ??
    (selectedNodeId ? data.lattice.nodeMap[selectedNodeId] : null) ??
    data.lattice.nodes[0];

  const selectedClass = data.conjugacy.classes.find((c) => c.elements.includes(selectedElementIdx));

  return (
    <div className="space-y-6">
      {/* Group Selector & D3 Diagram Mode Controls */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Interactive Group Structure Visual Cheat Sheet (D3.js)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between canonical finite groups and inspect D3-rendered Cayley tables, Hasse subgroup lattices, and conjugacy orbit structures.
            </p>
          </div>

          {/* Diagram Type Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {[
              { id: 'cayley' as const, label: 'Cayley Table', icon: Grid3X3 },
              { id: 'lattice' as const, label: 'Subgroup Lattice', icon: GitBranch },
              { id: 'orbits' as const, label: 'Conjugacy & Orders', icon: Orbit },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = diagramMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDiagramMode(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Canonical Group Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CHEAT_SHEET_GROUPS.map((g) => {
            const active = g.key === selectedKey;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setSelectedKey(g.key)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:border-blue-400'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  <MathFormula latex={g.latexName} />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {g.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Invariant Cheat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Order <MathFormula latex="|G|" /></div>
            <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {data.group.order}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Commutativity</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {data.group.isAbelian ? 'Abelian' : 'Non-Abelian'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Cyclicity</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {data.isCyclic ? 'Cyclic' : `Max ord = ${data.maxElementOrder}`}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Subgroups (Normal)</div>
            <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {data.lattice.nodes.length} ({data.normalSubgroupCount} ◁)
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Centre <MathFormula latex="|Z(G)|" /></div>
            <div className="font-mono font-bold tabular-nums text-blue-700 dark:text-blue-400 mt-0.5">
              {data.conjugacy.centralElements.length}
            </div>
          </div>
        </div>
      </section>

      {/* Main D3 Interactive Diagram + Live Cheat Sheet Inspector */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        {/* Mode 1: D3 Cayley Table */}
        {diagramMode === 'cayley' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  D3 Cayley Multiplication Heatmap — <MathFormula latex={preset.latexName} />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {[
                    { id: 'element' as const, label: 'Color by Element' },
                    { id: 'order' as const, label: 'Color by Order' },
                    { id: 'commute' as const, label: 'Commutativity' },
                  ].map((cm) => (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => setCayleyColorMode(cm.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                        cayleyColorMode === cm.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 flex justify-center overflow-x-auto">
                <svg
                  ref={cayleySvgRef}
                  className="w-full max-w-[520px] h-auto select-none"
                  role="img"
                  aria-label={`Interactive D3 Cayley table for ${data.group.name}`}
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Cell & Structural Inspector
              </div>
              {hoveredCell ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">Selected Operation</div>
                    <div className="mt-1 text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                      {hoveredCell.rowLabel} {data.group.operationSymbol} {hoveredCell.colLabel} ={' '}
                      <span className="text-blue-700 dark:text-blue-400">{hoveredCell.productLabel}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">Product Order</div>
                      <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {hoveredCell.productOrder}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">Reverse Order</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {hoveredCell.reverseProductLabel}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 font-medium ${
                      hoveredCell.commutes
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {hoveredCell.commutes ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {hoveredCell.commutes
                        ? 'Symmetric across main diagonal (Commutes)'
                        : `Asymmetric (${hoveredCell.productLabel} ≠ ${hoveredCell.reverseProductLabel})`}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Hover or click any cell in the D3 Cayley matrix to inspect the product, element order, and diagonal symmetry.
                </p>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-800 dark:text-slate-200">How to Read This Cheat Sheet</div>
                <p>• Every row & column contains each group element exactly once (Latin Square property).</p>
                <p>
                  • Symmetry across the top-left to bottom-right diagonal holds iff <MathText text="G" /> is abelian (
                  {data.nonCommutingPairsCount} non-commuting pairs in {data.group.name}).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: D3 Subgroup Lattice */}
        {diagramMode === 'lattice' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  D3 Hasse Subgroup Lattice — <MathFormula latex={preset.latexName} />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Double border = Normal (<MathText text="H ◁ G" />) · Dashed = Non-normal
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 overflow-x-auto">
                <svg
                  ref={latticeSvgRef}
                  className="w-full min-h-[340px] max-h-[460px] select-none"
                  role="img"
                  aria-label={`Interactive D3 subgroup lattice for ${data.group.name}`}
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Subgroup Node Inspector
              </div>
              {activeLatticeNode && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-slate-500">
                        {activeLatticeNode.isCyclic ? 'Cyclic Subgroup' : 'Non-Cyclic Subgroup'}
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                        <MathText text={activeLatticeNode.label} />
                      </div>
                    </div>
                    <span
                      className={`font-medium ${
                        activeLatticeNode.isNormal
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {activeLatticeNode.isNormal ? 'Normal (◁)' : 'Non-Normal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">Order <MathFormula latex="|H|" /></div>
                      <div className="font-mono font-bold tabular-nums">{activeLatticeNode.order}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">Index <MathFormula latex="[G:H]" /></div>
                      <div className="font-mono font-bold tabular-nums">{activeLatticeNode.index}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200 break-words">
                    {`{${activeLatticeNode.elementLabels.join(', ')}}`}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sky paths point down to {activeLatticeNode.descendantIds.length} subgroup(s); emerald paths point up to{' '}
                    {activeLatticeNode.ancestorIds.length} supergroup(s).
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode 3: D3 Conjugacy & Element Order Map */}
        {diagramMode === 'orbits' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  D3 Conjugacy Class & Centre Partition — <MathFormula latex={preset.latexName} />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any element node to inspect order, inverse & centralizer
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 flex justify-center">
                <svg
                  ref={orbitsSvgRef}
                  className="w-full max-w-[680px] h-auto select-none"
                  role="img"
                  aria-label={`Interactive D3 conjugacy orbit map for ${data.group.name}`}
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Element & Orbit Inspector
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Selected Element</div>
                  <div className="mt-1 text-lg font-bold font-mono text-blue-700 dark:text-blue-400">
                    {data.group.elements[selectedElementIdx]}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">Element Order</div>
                    <div className="font-mono font-bold tabular-nums">
                      {data.group.orders[selectedElementIdx]}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">Inverse <MathFormula latex="g^{-1}" /></div>
                    <div className="font-mono font-bold">
                      {data.group.elements[data.group.inverses[selectedElementIdx]]}
                    </div>
                  </div>
                </div>

                {selectedClass && (
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="text-[11px] text-slate-500">
                      Conjugacy Class (<MathFormula latex={`|C_G(x)| = ${selectedClass.centralizerOrder}`} />)
                    </div>
                    <div className="font-mono text-slate-800 dark:text-slate-200 break-words">
                      Cl({data.group.elements[selectedElementIdx]}) = {`{${selectedClass.elementLabels.join(', ')}}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Orbit-Stabilizer: <MathFormula latex={`|\\mathrm{Cl}(x)| = \\frac{${data.group.order}}{${selectedClass.centralizerOrder}} = ${selectedClass.size}`} />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 mb-1">Class Equation</div>
                  <MathFormula latex={data.conjugacy.classEquationLatex} className="text-slate-900 dark:text-slate-100" />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
