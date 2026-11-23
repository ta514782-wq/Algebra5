import { CosetAnalysis, CosetEntry, FiniteGroup } from './groupTypes.ts';
import { validateSubgroup } from './groupValidation.ts';

function formatCosetOp(gLabel: string, opSym: string, isLeft: boolean): string {
  if (opSym === '+') {
    return isLeft ? `${gLabel} + H` : `H + ${gLabel}`;
  }
  return isLeft ? `${gLabel}H` : `H${gLabel}`;
}

function formatCosetLatex(gLatex: string, opSym: string, isLeft: boolean): string {
  if (opSym === '+') {
    return isLeft ? `${gLatex} + H` : `H + ${gLatex}`;
  }
  return isLeft ? `${gLatex}H` : `H${gLatex}`;
}

export function analyzeCosets(
  group: FiniteGroup,
  subgroupIndices: number[]
): CosetAnalysis {
  const validation = validateSubgroup(group, subgroupIndices);
  const H = Array.from(new Set(subgroupIndices)).sort((a, b) => a - b);

  if (!validation.isSubgroup) {
    return {
      valid: false,
      validation,
      leftCosets: [],
      rightCosets: [],
      distinctLeftCosets: [],
      distinctRightCosets: [],
      index: 0,
      allLeftEqualRight: false,
      mismatchWitnesses: [],
      partitionVerified: false,
    };
  }

  const leftCosets: CosetEntry[] = [];
  const rightCosets: CosetEntry[] = [];
  const seenLeft = new Map<string, CosetEntry>();
  const seenRight = new Map<string, CosetEntry>();
  const mismatchWitnesses: CosetAnalysis['mismatchWitnesses'] = [];

  for (let g = 0; g < group.order; g++) {
    const leftSet = Array.from(new Set(H.map((h) => group.table[g][h]))).sort((a, b) => a - b);
    const rightSet = Array.from(new Set(H.map((h) => group.table[h][g]))).sort((a, b) => a - b);

    const gLabel = group.elements[g];
    const gLatex = group.latexElements[g];

    const lEntry: CosetEntry = {
      representativeIndex: g,
      representativeLabel: gLabel,
      cosetLabel: formatCosetOp(gLabel, group.operationSymbol, true),
      latexLabel: formatCosetLatex(gLatex, group.operationSymbol, true),
      elementIndices: leftSet,
      elementLabels: leftSet.map((i) => group.elements[i]),
    };

    const rEntry: CosetEntry = {
      representativeIndex: g,
      representativeLabel: gLabel,
      cosetLabel: formatCosetOp(gLabel, group.operationSymbol, false),
      latexLabel: formatCosetLatex(gLatex, group.operationSymbol, false),
      elementIndices: rightSet,
      elementLabels: rightSet.map((i) => group.elements[i]),
    };

    leftCosets.push(lEntry);
    rightCosets.push(rEntry);

    const lKey = leftSet.join(',');
    const rKey = rightSet.join(',');
    if (!seenLeft.has(lKey)) seenLeft.set(lKey, lEntry);
    if (!seenRight.has(rKey)) seenRight.set(rKey, rEntry);

    if (lKey !== rKey) {
      mismatchWitnesses.push({
        element: gLabel,
        leftCoset: lEntry.elementLabels,
        rightCoset: rEntry.elementLabels,
      });
    }
  }

  const distinctLeftCosets = Array.from(seenLeft.values());
  const distinctRightCosets = Array.from(seenRight.values());

  // Verify disjointness and full union = G
  const covered = new Set<number>();
  let disjoint = true;
  for (const c of distinctLeftCosets) {
    for (const el of c.elementIndices) {
      if (covered.has(el)) disjoint = false;
      covered.add(el);
    }
  }
  const partitionVerified =
    disjoint &&
    covered.size === group.order &&
    distinctLeftCosets.every((c) => c.elementIndices.length === H.length);

  return {
    valid: true,
    validation,
    leftCosets,
    rightCosets,
    distinctLeftCosets,
    distinctRightCosets,
    index: distinctLeftCosets.length,
    allLeftEqualRight: mismatchWitnesses.length === 0,
    mismatchWitnesses,
    partitionVerified,
  };
}
