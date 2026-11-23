import { analyzeCosets } from './cosetEngine.ts';
import { buildGroupFromTable } from './groupEngine.ts';
import { FiniteGroup, QuotientElement, QuotientGroupAnalysis } from './groupTypes.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { toSuperscript } from '../utils/mathUnicode.ts';

function findNonNormalWellDefinedCounterexample(
  group: FiniteGroup,
  H: number[]
): QuotientGroupAnalysis['wellDefinedCounterexample'] | undefined {
  const cosets = analyzeCosets(group, H);
  // Look for g1, g2 and h1, h2 in H such that (g1*h1)*(g2*h2) is not in the coset (g1*g2)H
  const cosetOf = (el: number): number[] => {
    return Array.from(new Set(H.map((h) => group.table[el][h]))).sort((a, b) => a - b);
  };

  for (let g1 = 0; g1 < group.order; g1++) {
    for (let g2 = 0; g2 < group.order; g2++) {
      const targetCoset = cosetOf(group.table[g1][g2]);
      const targetKey = targetCoset.join(',');
      for (const h1 of H) {
        for (const h2 of H) {
          const rep1 = group.table[g1][h1];
          const rep2 = group.table[g2][h2];
          const shiftedCoset = cosetOf(group.table[rep1][rep2]);
          if (shiftedCoset.join(',') !== targetKey) {
            return {
              g1: group.elements[g1],
              g2: group.elements[g2],
              h1: group.elements[h1],
              h2: group.elements[h2],
              directProductCoset: targetCoset.map((i) => group.elements[i]),
              shiftedProductCoset: shiftedCoset.map((i) => group.elements[i]),
            };
          }
        }
      }
    }
  }
  void cosets;
  return undefined;
}

export function buildQuotientGroup(
  group: FiniteGroup,
  subgroupIndices: number[]
): QuotientGroupAnalysis {
  const normality = analyzeNormality(group, subgroupIndices);
  const H = Array.from(new Set(subgroupIndices)).sort((a, b) => a - b);

  if (!normality.isSubgroup) {
    return {
      canConstruct: false,
      normality,
      reasonIfInvalid: `Cannot construct G/H: H is not a valid subgroup of ${group.name}.`,
      indexMatchesOrder: false,
    };
  }

  if (!normality.isNormal) {
    const counter = findNonNormalWellDefinedCounterexample(group, H);
    return {
      canConstruct: false,
      normality,
      reasonIfInvalid: `Cannot construct G/H because H is NOT normal in ${group.name}. Coset multiplication (g₁H)(g₂H) = (g₁g₂)H is not well-defined when gH ≠ Hg.`,
      wellDefinedCounterexample: counter,
      indexMatchesOrder: false,
    };
  }

  const cosets = analyzeCosets(group, H);
  const distinct = cosets.distinctLeftCosets;

  // Map every group element to its coset index in `distinct`
  const keyToCosetIdx = new Map<string, number>();
  distinct.forEach((c, idx) => {
    keyToCosetIdx.set(c.elementIndices.join(','), idx);
  });

  const elemToCosetIdx = new Array<number>(group.order).fill(0);
  for (let g = 0; g < group.order; g++) {
    const key = cosets.leftCosets[g].elementIndices.join(',');
    elemToCosetIdx[g] = keyToCosetIdx.get(key)!;
  }

  const qOrder = distinct.length;
  const qTable = Array.from({ length: qOrder }, (_, i) => {
    const g1 = distinct[i].representativeIndex;
    return Array.from({ length: qOrder }, (_, j) => {
      const g2 = distinct[j].representativeIndex;
      const prod = group.table[g1][g2];
      return elemToCosetIdx[prod];
    });
  });

  const identityCosetIndex = elemToCosetIdx[group.identityIndex];
  const qElementsLabels = distinct.map((c) => c.cosetLabel);
  const qLatexLabels = distinct.map((c) => c.latexLabel);

  const quotientGroup = buildGroupFromTable({
    id: `${group.id}/H`,
    name: `${group.name}/H`,
    latexName: `${group.latexName}/H`,
    family: 'quotient',
    operationSymbol: group.operationSymbol === '+' ? '+' : '·',
    operationName: `Quotient coset ${group.operationSymbol === '+' ? 'addition' : 'multiplication'}`,
    elements: qElementsLabels,
    latexElements: qLatexLabels,
    table: qTable,
    identityIndex: identityCosetIndex,
  });

  const inH = new Set(H);
  const orderChecks: QuotientGroupAnalysis['orderChecks'] = [];
  const quotientElements: QuotientElement[] = distinct.map((c, idx) => {
    const rep = c.representativeIndex;
    let cur = rep;
    let m = 1;
    const powerSequence: string[] = [`${group.elements[rep]}¹ = ${group.elements[cur]}`];
    while (!inH.has(cur) && m <= group.order) {
      cur = group.table[cur][rep];
      m++;
      powerSequence.push(`${group.elements[rep]}${toSuperscript(m)} = ${group.elements[cur]}`);
    }
    orderChecks.push({
      cosetLabel: c.cosetLabel,
      repLabel: c.representativeLabel,
      order: m,
      powerSequence,
    });
    return {
      index: idx,
      representativeIndex: rep,
      representativeLabel: c.representativeLabel,
      cosetLabel: c.cosetLabel,
      latexLabel: c.latexLabel,
      members: c.elementIndices,
      memberLabels: c.elementLabels,
      order: quotientGroup.orders[idx],
    };
  });

  return {
    canConstruct: true,
    normality,
    quotientGroup,
    quotientElements,
    identityCosetIndex,
    inverseCosetIndices: quotientGroup.inverses,
    orderChecks,
    indexMatchesOrder: quotientGroup.order === cosets.index,
  };
}
