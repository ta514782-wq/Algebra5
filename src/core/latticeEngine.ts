import {
  enumerateAllSubgroups,
  generateSubgroupFromElements,
  getPresetSubgroups,
} from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { analyzeNormality } from './normalityEngine.ts';

export interface SubgroupLatticeNode {
  id: string;
  elements: number[];
  elementLabels: string[];
  order: number;
  index: number;
  label: string;
  generatorsLabel: string;
  isTrivial: boolean;
  isWhole: boolean;
  isNormal: boolean;
  isCyclic: boolean;
  tierIndex: number; // 0 = top (|G|), maxTier = bottom ({e})
  tierPos: number; // 0-based horizontal index within tier after crossing minimization
  tierSize: number;
  coveredByIds: string[]; // Direct supergroups (minimal containing subgroups)
  coversIds: string[]; // Direct subgroups (maximal proper subgroups inside this node)
  ancestorIds: string[]; // All proper supergroups
  descendantIds: string[]; // All proper subgroups
}

export interface SubgroupLatticeEdge {
  id: string;
  sourceId: string; // Larger subgroup (higher tier)
  targetId: string; // Smaller subgroup (lower tier)
  tierSpan: number;
}

export interface SubgroupLatticeGraph {
  groupOrder: number;
  groupName: string;
  exhaustive: boolean;
  ordersDesc: number[];
  nodes: SubgroupLatticeNode[];
  edges: SubgroupLatticeEdge[];
  nodeMap: Record<string, SubgroupLatticeNode>;
}

function computeSubgroupLabel(
  group: FiniteGroup,
  elements: number[],
  presetNameMap: Map<string, string>
): { label: string; generatorsLabel: string; isCyclic: boolean } {
  const n = elements.length;
  if (n === 1) {
    const idLabel = `{${group.elements[elements[0]]}}`;
    return { label: idLabel, generatorsLabel: idLabel, isCyclic: true };
  }
  if (n === group.order) {
    const shortName = group.name.split(' ')[0];
    return { label: shortName, generatorsLabel: group.name, isCyclic: group.orders.some((o) => o === n) };
  }

  // Check if cyclic
  const cyclicGens = elements.filter((idx) => group.orders[idx] === n);
  if (cyclicGens.length > 0) {
    // Prefer element with shortest clean label (e.g., 'r' over 'r^3', '1' over '5')
    const bestGen = [...cyclicGens].sort((a, b) => {
      const la = group.elements[a].length;
      const lb = group.elements[b].length;
      if (la !== lb) return la - lb;
      return a - b;
    })[0];
    const genStr = `⟨${group.elements[bestGen]}⟩`;
    return { label: genStr, generatorsLabel: genStr, isCyclic: true };
  }

  const key = elements.join(',');
  const presetLabel = presetNameMap.get(key);

  // Find minimal 2-generator pair if possible
  const nonId = elements.filter((idx) => idx !== group.identityIndex);
  let genPair: [number, number] | null = null;
  for (let i = 0; i < nonId.length && !genPair; i++) {
    for (let j = i + 1; j < nonId.length && !genPair; j++) {
      const generated = generateSubgroupFromElements(group, [nonId[i], nonId[j]]);
      if (generated.length === n && generated.every((v, idx) => v === elements[idx])) {
        genPair = [nonId[i], nonId[j]];
      }
    }
  }

  if (genPair) {
    const pairLabel = `⟨${group.elements[genPair[0]]}, ${group.elements[genPair[1]]}⟩`;
    return {
      label: presetLabel ?? pairLabel,
      generatorsLabel: pairLabel,
      isCyclic: false,
    };
  }

  // Fallback for 3+ generators (e.g. Z2 x Z2 x Z2 or similar)
  const minimalGens: number[] = [];
  let currentClosure: number[] = [group.identityIndex];
  for (const cand of nonId) {
    if (!currentClosure.includes(cand)) {
      minimalGens.push(cand);
      currentClosure = generateSubgroupFromElements(group, minimalGens);
      if (currentClosure.length === n) break;
    }
  }
  const multiLabel = `⟨${minimalGens.map((g) => group.elements[g]).join(', ')}⟩`;
  return {
    label: presetLabel ?? multiLabel,
    generatorsLabel: multiLabel,
    isCyclic: false,
  };
}

export function buildSubgroupLattice(group: FiniteGroup): SubgroupLatticeGraph {
  const { subgroups, exhaustive } = enumerateAllSubgroups(group);

  // Curated short names from preset subgroups
  const presetNameMap = new Map<string, string>();
  for (const p of getPresetSubgroups(group)) {
    const k = [...p.elements].sort((a, b) => a - b).join(',');
    if (p.id === 'v4_in_s4' || p.id === 'v4_in_a4') presetNameMap.set(k, 'V₄');
    else if (p.id === 's3_in_s4') presetNameMap.set(k, 'Stab(4)');
    else if (p.id === 'a4_in_s4') presetNameMap.set(k, 'A₄');
    else if (p.id === 'v4_in_d4') presetNameMap.set(k, '{e,r²,s,r²s}');
  }

  const orderSet = new Set<number>();
  for (const sub of subgroups) orderSet.add(sub.length);
  const ordersDesc = Array.from(orderSet).sort((a, b) => b - a);
  const orderToTier = new Map<number, number>();
  ordersDesc.forEach((ord, idx) => orderToTier.set(ord, idx));

  const elementSets = subgroups.map((s) => new Set<number>(s));
  const ids = subgroups.map((s) => s.join(','));

  // Build inclusion matrix: isSubset[i][j] === true means subgroups[i] ⊂ subgroups[j] (strict)
  const m = subgroups.length;
  const isSubset: boolean[][] = Array.from({ length: m }, () => new Array<boolean>(m).fill(false));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      if (i === j) continue;
      if (subgroups[i].length >= subgroups[j].length) continue;
      if (subgroups[j].length % subgroups[i].length !== 0) continue;
      if (subgroups[i].every((el) => elementSets[j].has(el))) {
        isSubset[i][j] = true;
      }
    }
  }

  // Hasse transitive reduction: j covers i iff i ⊂ j and no k with i ⊂ k ⊂ j
  const edges: SubgroupLatticeEdge[] = [];
  const coversByIdx: string[][] = Array.from({ length: m }, () => []);
  const coveredByIdx: string[][] = Array.from({ length: m }, () => []);
  const ancestorsByIdx: string[][] = Array.from({ length: m }, () => []);
  const descendantsByIdx: string[][] = Array.from({ length: m }, () => []);

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      if (!isSubset[i][j]) continue;
      ancestorsByIdx[i].push(ids[j]);
      descendantsByIdx[j].push(ids[i]);

      let hasIntermediate = false;
      for (let k = 0; k < m; k++) {
        if (k !== i && k !== j && isSubset[i][k] && isSubset[k][j]) {
          hasIntermediate = true;
          break;
        }
      }
      if (!hasIntermediate) {
        const tierSource = orderToTier.get(subgroups[j].length)!;
        const tierTarget = orderToTier.get(subgroups[i].length)!;
        edges.push({
          id: `${ids[j]}->${ids[i]}`,
          sourceId: ids[j],
          targetId: ids[i],
          tierSpan: tierTarget - tierSource,
        });
        coversByIdx[j].push(ids[i]);
        coveredByIdx[i].push(ids[j]);
      }
    }
  }

  const nodes: SubgroupLatticeNode[] = subgroups.map((sub, idx) => {
    const id = ids[idx];
    const order = sub.length;
    const isNormal = group.isAbelian ? true : analyzeNormality(group, sub).isNormal;
    const { label, generatorsLabel, isCyclic } = computeSubgroupLabel(group, sub, presetNameMap);
    return {
      id,
      elements: sub,
      elementLabels: sub.map((elIdx) => group.elements[elIdx]),
      order,
      index: group.order / order,
      label,
      generatorsLabel,
      isTrivial: order === 1,
      isWhole: order === group.order,
      isNormal,
      isCyclic,
      tierIndex: orderToTier.get(order)!,
      tierPos: 0,
      tierSize: 1,
      coveredByIds: coveredByIdx[idx],
      coversIds: coversByIdx[idx],
      ancestorIds: ancestorsByIdx[idx],
      descendantIds: descendantsByIdx[idx],
    };
  });

  const nodeMap: Record<string, SubgroupLatticeNode> = {};
  for (const node of nodes) {
    nodeMap[node.id] = node;
  }

  // Group into tiers and perform barycenter crossing minimization
  const tiers: SubgroupLatticeNode[][] = ordersDesc.map(() => []);
  for (const node of nodes) {
    tiers[node.tierIndex].push(node);
  }
  // Initial deterministic sort inside each tier: normal first or cyclic, then label
  for (const tier of tiers) {
    tier.sort((a, b) => {
      if (a.isNormal !== b.isNormal) return a.isNormal ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
    tier.forEach((n, i) => {
      n.tierPos = i;
      n.tierSize = tier.length;
    });
  }

  // 4 bidirectional barycenter passes to untangle Hasse edges
  const assignTierPositions = () => {
    for (const tier of tiers) {
      tier.forEach((n, i) => {
        n.tierPos = i;
        n.tierSize = tier.length;
      });
    }
  };

  for (let pass = 0; pass < 4; pass++) {
    // Top-down pass
    for (let t = 1; t < tiers.length; t++) {
      const tier = tiers[t];
      const scores = new Map<string, number>();
      for (const node of tier) {
        if (node.coveredByIds.length === 0) {
          scores.set(node.id, node.tierPos);
        } else {
          const avg =
            node.coveredByIds.reduce((sum, pid) => {
              const p = nodeMap[pid];
              const normPos = p.tierSize > 1 ? p.tierPos / (p.tierSize - 1) : 0.5;
              return sum + normPos;
            }, 0) / node.coveredByIds.length;
          scores.set(node.id, avg);
        }
      }
      tier.sort((a, b) => {
        const diff = (scores.get(a.id) ?? 0) - (scores.get(b.id) ?? 0);
        if (Math.abs(diff) > 1e-6) return diff;
        return a.id.localeCompare(b.id);
      });
      assignTierPositions();
    }

    // Bottom-up pass
    for (let t = tiers.length - 2; t >= 0; t--) {
      const tier = tiers[t];
      const scores = new Map<string, number>();
      for (const node of tier) {
        if (node.coversIds.length === 0) {
          scores.set(node.id, node.tierPos);
        } else {
          const avg =
            node.coversIds.reduce((sum, cid) => {
              const c = nodeMap[cid];
              const normPos = c.tierSize > 1 ? c.tierPos / (c.tierSize - 1) : 0.5;
              return sum + normPos;
            }, 0) / node.coversIds.length;
          scores.set(node.id, avg);
        }
      }
      tier.sort((a, b) => {
        const diff = (scores.get(a.id) ?? 0) - (scores.get(b.id) ?? 0);
        if (Math.abs(diff) > 1e-6) return diff;
        return a.id.localeCompare(b.id);
      });
      assignTierPositions();
    }
  }

  return {
    groupOrder: group.order,
    groupName: group.name,
    exhaustive,
    ordersDesc,
    nodes,
    edges,
    nodeMap,
  };
}
