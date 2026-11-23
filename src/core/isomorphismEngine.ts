import {
  buildAlternatingGroup,
  buildCyclicGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildQuaternionGroup,
  buildSymmetricGroup,
} from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { classifyAbelianGroup } from './classificationEngine.ts';

export interface IsomorphismMappingEntry {
  sourceIndex: number;
  sourceLabel: string;
  sourceLatex: string;
  targetIndex: number;
  targetLabel: string;
  targetLatex: string;
  order: number;
}

export interface IsomorphismResult {
  isomorphic: boolean;
  sourceName: string;
  sourceLatex: string;
  targetName: string;
  targetLatex: string;
  mapping: IsomorphismMappingEntry[];
  verifiedPairs: number;
  totalPairs: number;
  reason: string;
}

export interface CosetBlockCellCheck {
  rowCoset: number;
  colCoset: number;
  targetCosets: number[];
  isPure: boolean;
}

export interface CosetBlockAnalysis {
  orderedIndices: number[];
  cosetSlices: Array<{
    cosetIndex: number;
    cosetLabel: string;
    latexLabel: string;
    startPos: number;
    length: number;
  }>;
  elementToCosetIndex: number[];
  blockChecks: CosetBlockCellCheck[];
  pureBlockCount: number;
  totalBlockCount: number;
  allBlocksPure: boolean;
}

function getOrderProfileKey(group: FiniteGroup): string {
  const counts = new Map<number, number>();
  for (const o of group.orders) {
    counts.set(o, (counts.get(o) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([o, c]) => `${o}:${c}`)
    .join(',');
}

export function findGroupIsomorphism(source: FiniteGroup, target: FiniteGroup): IsomorphismResult {
  const n = source.order;
  if (n !== target.order) {
    return {
      isomorphic: false,
      sourceName: source.name,
      sourceLatex: source.latexName,
      targetName: target.name,
      targetLatex: target.latexName,
      mapping: [],
      verifiedPairs: 0,
      totalPairs: n * n,
      reason: `Orders differ: |${source.name}| = ${source.order} ≠ ${target.order} = |${target.name}|.`,
    };
  }

  if (source.isAbelian !== target.isAbelian) {
    return {
      isomorphic: false,
      sourceName: source.name,
      sourceLatex: source.latexName,
      targetName: target.name,
      targetLatex: target.latexName,
      mapping: [],
      verifiedPairs: 0,
      totalPairs: n * n,
      reason: `${source.name} is ${source.isAbelian ? 'abelian' : 'non-abelian'} whereas ${target.name} is ${target.isAbelian ? 'abelian' : 'non-abelian'}.`,
    };
  }

  if (getOrderProfileKey(source) !== getOrderProfileKey(target)) {
    return {
      isomorphic: false,
      sourceName: source.name,
      sourceLatex: source.latexName,
      targetName: target.name,
      targetLatex: target.latexName,
      mapping: [],
      verifiedPairs: 0,
      totalPairs: n * n,
      reason: 'Element-order distributions do not match.',
    };
  }

  if (n > 24) {
    return {
      isomorphic: false,
      sourceName: source.name,
      sourceLatex: source.latexName,
      targetName: target.name,
      targetLatex: target.latexName,
      mapping: [],
      verifiedPairs: 0,
      totalPairs: n * n,
      reason: 'Explicit full-bijection search is bounded to groups of order ≤ 24.',
    };
  }

  // Group target elements by element order for tight pruning
  const targetByOrder = new Map<number, number[]>();
  for (let j = 0; j < n; j++) {
    const ord = target.orders[j];
    if (!targetByOrder.has(ord)) targetByOrder.set(ord, []);
    targetByOrder.get(ord)!.push(j);
  }

  // Order source indices with highest-order non-identity elements first to propagate products fast
  const assignOrder = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    if (a === source.identityIndex) return -1;
    if (b === source.identityIndex) return 1;
    return source.orders[b] - source.orders[a];
  });

  const phi = new Array<number>(n).fill(-1);
  const usedTarget = new Array<boolean>(n).fill(false);

  // Fix identity -> identity
  phi[source.identityIndex] = target.identityIndex;
  usedTarget[target.identityIndex] = true;

  const isConsistentWithAssigned = (u: number, v: number): boolean => {
    for (let x = 0; x < n; x++) {
      if (phi[x] === -1) continue;
      const ux = source.table[u][x];
      const xu = source.table[x][u];
      const targetUX = target.table[v][phi[x]];
      const targetXU = target.table[phi[x]][v];
      if (phi[ux] !== -1 && phi[ux] !== targetUX) return false;
      if (phi[xu] !== -1 && phi[xu] !== targetXU) return false;
    }
    const uu = source.table[u][u];
    const targetUU = target.table[v][v];
    if (uu === u && targetUU !== v) return false;
    if (phi[uu] !== -1 && phi[uu] !== targetUU) return false;
    return true;
  };

  let steps = 0;
  const maxSteps = 250000;

  const backtrack = (pos: number): boolean => {
    if (++steps > maxSteps) return false;
    if (pos >= assignOrder.length) {
      // Final full |G|^2 table check
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (phi[source.table[i][j]] !== target.table[phi[i]][phi[j]]) return false;
        }
      }
      return true;
    }

    const u = assignOrder[pos];
    if (phi[u] !== -1) return backtrack(pos + 1);

    const candidates = targetByOrder.get(source.orders[u]) ?? [];
    for (const v of candidates) {
      if (usedTarget[v]) continue;
      if (!isConsistentWithAssigned(u, v)) continue;

      // Also propagate powers of u -> powers of v
      const newlyAssigned: number[] = [];
      let conflict = false;
      let curS = u;
      let curT = v;
      for (let p = 1; p <= source.orders[u]; p++) {
        if (phi[curS] === -1) {
          if (usedTarget[curT]) {
            conflict = true;
            break;
          }
          if (!isConsistentWithAssigned(curS, curT)) {
            conflict = true;
            break;
          }
          phi[curS] = curT;
          usedTarget[curT] = true;
          newlyAssigned.push(curS);
        } else if (phi[curS] !== curT) {
          conflict = true;
          break;
        }
        curS = source.table[curS][u];
        curT = target.table[curT][v];
      }

      if (!conflict && backtrack(pos + 1)) {
        return true;
      }

      for (const sIdx of newlyAssigned) {
        usedTarget[phi[sIdx]] = false;
        phi[sIdx] = -1;
      }
    }

    return false;
  };

  const found = backtrack(0);
  if (!found) {
    return {
      isomorphic: false,
      sourceName: source.name,
      sourceLatex: source.latexName,
      targetName: target.name,
      targetLatex: target.latexName,
      mapping: [],
      verifiedPairs: 0,
      totalPairs: n * n,
      reason: `No structure-preserving bijection exists between ${source.name} and ${target.name}.`,
    };
  }

  let verifiedPairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (phi[source.table[i][j]] === target.table[phi[i]][phi[j]]) {
        verifiedPairs++;
      }
    }
  }

  const mapping: IsomorphismMappingEntry[] = Array.from({ length: n }, (_, i) => ({
    sourceIndex: i,
    sourceLabel: source.elements[i],
    sourceLatex: source.latexElements[i],
    targetIndex: phi[i],
    targetLabel: target.elements[phi[i]],
    targetLatex: target.latexElements[phi[i]],
    order: source.orders[i],
  }));

  return {
    isomorphic: verifiedPairs === n * n,
    sourceName: source.name,
    sourceLatex: source.latexName,
    targetName: target.name,
    targetLatex: target.latexName,
    mapping,
    verifiedPairs,
    totalPairs: n * n,
    reason: `Verified explicit isomorphism φ: ${source.name} → ${target.name} across all ${verifiedPairs} / ${n * n} Cayley table multiplication pairs.`,
  };
}

export function identifyCanonicalGroupWithProof(group: FiniteGroup): IsomorphismResult | null {
  if (group.order > 24) return null;

  if (group.isAbelian) {
    const cls = classifyAbelianGroup(group);
    const canonicalTarget =
      cls.invariantFactors.length === 0
        ? buildCyclicGroup(1)
        : cls.invariantFactors.length === 1
          ? buildCyclicGroup(cls.invariantFactors[0])
          : buildDirectProductCyclic(cls.invariantFactors);
    const res = findGroupIsomorphism(group, canonicalTarget);
    return res.isomorphic ? res : null;
  }

  // Known non-abelian reference models up to order 24
  const candidates: FiniteGroup[] = [];
  if (group.order === 6) candidates.push(buildSymmetricGroup(3));
  else if (group.order === 8) candidates.push(buildDihedralGroup(4), buildQuaternionGroup());
  else if (group.order === 10) candidates.push(buildDihedralGroup(5));
  else if (group.order === 12) candidates.push(buildAlternatingGroup(4), buildDihedralGroup(6));
  else if (group.order === 14) candidates.push(buildDihedralGroup(7));
  else if (group.order === 16) candidates.push(buildDihedralGroup(8));
  else if (group.order === 18) candidates.push(buildDihedralGroup(9));
  else if (group.order === 20) candidates.push(buildDihedralGroup(10));
  else if (group.order === 22) candidates.push(buildDihedralGroup(11));
  else if (group.order === 24) candidates.push(buildSymmetricGroup(4), buildDihedralGroup(12));

  for (const cand of candidates) {
    const res = findGroupIsomorphism(group, cand);
    if (res.isomorphic) return res;
  }
  return null;
}

export function analyzeCosetBlockConsistency(
  group: FiniteGroup,
  distinctCosets: Array<{ cosetLabel: string; latexLabel: string; elementIndices: number[] }>
): CosetBlockAnalysis {
  const elementToCosetIndex = new Array<number>(group.order).fill(0);
  const orderedIndices: number[] = [];
  const cosetSlices: CosetBlockAnalysis['cosetSlices'] = [];

  distinctCosets.forEach((coset, cIdx) => {
    const startPos = orderedIndices.length;
    for (const elIdx of coset.elementIndices) {
      elementToCosetIndex[elIdx] = cIdx;
      orderedIndices.push(elIdx);
    }
    cosetSlices.push({
      cosetIndex: cIdx,
      cosetLabel: coset.cosetLabel,
      latexLabel: coset.latexLabel,
      startPos,
      length: coset.elementIndices.length,
    });
  });

  const blockChecks: CosetBlockCellCheck[] = [];
  let pureBlockCount = 0;

  for (let r = 0; r < distinctCosets.length; r++) {
    for (let c = 0; c < distinctCosets.length; c++) {
      const targetSet = new Set<number>();
      for (const a of distinctCosets[r].elementIndices) {
        for (const b of distinctCosets[c].elementIndices) {
          targetSet.add(elementToCosetIndex[group.table[a][b]]);
        }
      }
      const targetCosets = Array.from(targetSet).sort((x, y) => x - y);
      const isPure = targetCosets.length === 1;
      if (isPure) pureBlockCount++;
      blockChecks.push({ rowCoset: r, colCoset: c, targetCosets, isPure });
    }
  }

  return {
    orderedIndices,
    cosetSlices,
    elementToCosetIndex,
    blockChecks,
    pureBlockCount,
    totalBlockCount: blockChecks.length,
    allBlocksPure: pureBlockCount === blockChecks.length,
  };
}
