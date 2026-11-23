import {
  buildCyclicGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildGroupFromTable,
  buildKleinFourGroup,
  buildSymmetricGroup,
} from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { findGroupIsomorphism, IsomorphismResult } from './isomorphismEngine.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { buildQuotientGroup } from './quotientEngine.ts';

export interface HomomorphismPairCounterexample {
  aIndex: number;
  bIndex: number;
  aLabel: string;
  bLabel: string;
  aLatex: string;
  bLatex: string;
  lhsIndex: number; // phi(a * b)
  rhsIndex: number; // phi(a) * phi(b)
  lhsLabel: string;
  rhsLabel: string;
  lhsLatex: string;
  rhsLatex: string;
}

export interface HomomorphismAnalysis {
  isHomomorphism: boolean;
  verifiedPairs: number;
  totalPairs: number;
  counterexample: HomomorphismPairCounterexample | null;
  preservesIdentity: boolean;
  kernelIndices: number[];
  kernelLabels: string[];
  kernelLatex: string;
  kernelNormal: boolean;
  imageIndices: number[];
  imageLabels: string[];
  imageLatex: string;
  imageGroup: FiniteGroup | null;
  isInjective: boolean;
  isSurjective: boolean;
  isIsomorphism: boolean;
  firstIsoCosets: Array<{
    cosetLabel: string;
    cosetLatex: string;
    imageLabel: string;
    imageLatex: string;
    memberLabels: string[];
  }>;
  firstIsoProof: IsomorphismResult | null;
  summary: string;
}

export interface PresetHomomorphism {
  id: string;
  title: string;
  subtitle: string;
  sourceGroup: FiniteGroup;
  targetGroup: FiniteGroup;
  mapArray: number[];
  intendedFailure?: boolean;
}

export function analyzeHomomorphism(
  source: FiniteGroup,
  target: FiniteGroup,
  mapArray: number[]
): HomomorphismAnalysis {
  const n = source.order;
  const totalPairs = n * n;
  const safeMap = Array.from({ length: n }, (_, i) => {
    const v = mapArray[i];
    return Number.isInteger(v) && v >= 0 && v < target.order ? v : target.identityIndex;
  });

  let verifiedPairs = 0;
  let counterexample: HomomorphismPairCounterexample | null = null;

  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      const ab = source.table[a][b];
      const lhs = safeMap[ab];
      const rhs = target.table[safeMap[a]][safeMap[b]];
      if (lhs === rhs) {
        verifiedPairs++;
      } else if (!counterexample) {
        counterexample = {
          aIndex: a,
          bIndex: b,
          aLabel: source.elements[a],
          bLabel: source.elements[b],
          aLatex: source.latexElements[a],
          bLatex: source.latexElements[b],
          lhsIndex: lhs,
          rhsIndex: rhs,
          lhsLabel: target.elements[lhs],
          rhsLabel: target.elements[rhs],
          lhsLatex: target.latexElements[lhs],
          rhsLatex: target.latexElements[rhs],
        };
      }
    }
  }

  const isHomomorphism = verifiedPairs === totalPairs;
  const preservesIdentity = safeMap[source.identityIndex] === target.identityIndex;

  const kernelIndices = Array.from({ length: n }, (_, i) => i).filter(
    (i) => safeMap[i] === target.identityIndex
  );
  const imageSet = new Set(safeMap);
  const imageIndices = Array.from(imageSet).sort((a, b) => a - b);

  const kernelNormal = isHomomorphism
    ? analyzeNormality(source, kernelIndices).isNormal
    : false;

  // Build finite subgroup structure for Im(phi) when valid homomorphism
  let imageGroup: FiniteGroup | null = null;
  let firstIsoProof: IsomorphismResult | null = null;
  const firstIsoCosets: HomomorphismAnalysis['firstIsoCosets'] = [];

  if (isHomomorphism) {
    const imgPosMap = new Map<number, number>();
    imageIndices.forEach((origIdx, pos) => imgPosMap.set(origIdx, pos));
    const imgIdentity = imgPosMap.get(target.identityIndex) ?? 0;
    const imgTable = imageIndices.map((rOrig) =>
      imageIndices.map((cOrig) => {
        const prod = target.table[rOrig][cOrig];
        return imgPosMap.get(prod) ?? 0;
      })
    );

    imageGroup = buildGroupFromTable({
      id: `Im_${source.id}_${target.id}`,
      name: `Im(φ) ≤ ${target.name}`,
      latexName: `\\mathrm{Im}(\\varphi)`,
      family: target.family,
      operationSymbol: target.operationSymbol,
      operationName: target.operationName,
      elements: imageIndices.map((idx) => target.elements[idx]),
      latexElements: imageIndices.map((idx) => target.latexElements[idx]),
      table: imgTable,
      identityIndex: imgIdentity,
    });

    const q = buildQuotientGroup(source, kernelIndices);
    if (q.canConstruct && q.quotientGroup) {
      for (const el of q.quotientElements ?? []) {
        const imgTargetIdx = safeMap[el.representativeIndex];
        firstIsoCosets.push({
          cosetLabel: el.cosetLabel,
          cosetLatex: el.latexLabel,
          imageLabel: target.elements[imgTargetIdx],
          imageLatex: target.latexElements[imgTargetIdx],
          memberLabels: el.memberLabels,
        });
      }
      firstIsoProof = findGroupIsomorphism(q.quotientGroup, imageGroup);
    }
  }

  const isInjective = isHomomorphism && kernelIndices.length === 1;
  const isSurjective = isHomomorphism && imageIndices.length === target.order;
  const isIsomorphism = isInjective && isSurjective;

  const summary = isHomomorphism
    ? `Verified homomorphism φ: ${source.name} → ${target.name} across all ${verifiedPairs}/${totalPairs} pairs. |ker(φ)| = ${kernelIndices.length}, |Im(φ)| = ${imageIndices.length}, and G/ker(φ) ≅ Im(φ).`
    : `Not a homomorphism (${verifiedPairs}/${totalPairs} pairs match): fails at a = ${counterexample?.aLabel}, b = ${counterexample?.bLabel}.`;

  return {
    isHomomorphism,
    verifiedPairs,
    totalPairs,
    counterexample,
    preservesIdentity,
    kernelIndices,
    kernelLabels: kernelIndices.map((i) => source.elements[i]),
    kernelLatex: `\\{${kernelIndices.map((i) => source.latexElements[i]).join(', ')}\\}`,
    kernelNormal,
    imageIndices,
    imageLabels: imageIndices.map((i) => target.elements[i]),
    imageLatex: `\\{${imageIndices.map((i) => target.latexElements[i]).join(', ')}\\}`,
    imageGroup,
    isInjective,
    isSurjective,
    isIsomorphism,
    firstIsoCosets,
    firstIsoProof,
    summary,
  };
}

/** Parses cycle strings for permutation homomorphism presets */
function applyPermString(cycleStr: string, x: number): number {
  if (cycleStr === 'e') return x;
  const groups = cycleStr.match(/\([^)]+\)/g) ?? [];
  let cur = x;
  // Permutations in disjoint cycle form: evaluate inside each cycle
  for (const grp of groups) {
    const nums = grp
      .slice(1, -1)
      .trim()
      .split(/\s+/)
      .map(Number);
    const pos = nums.indexOf(cur);
    if (pos !== -1) {
      cur = nums[(pos + 1) % nums.length];
    }
  }
  return cur;
}

export function buildPresetHomomorphisms(): PresetHomomorphism[] {
  // 1. Classic S_4 -> S_3 via action on the 3 partitions of {1,2,3,4} into pairs:
  // P1 = {12|34}, P2 = {13|24}, P3 = {14|23}. Kernel is exactly V_4!
  const S4 = buildSymmetricGroup(4);
  const S3 = buildSymmetricGroup(3);
  const partitions: Array<[Set<number>, Set<number>]> = [
    [new Set([1, 2]), new Set([3, 4])],
    [new Set([1, 3]), new Set([2, 4])],
    [new Set([1, 4]), new Set([2, 3])],
  ];
  const findPartIndex = (a: number, b: number): number => {
    for (let k = 0; k < 3; k++) {
      const [pA, pB] = partitions[k];
      if ((pA.has(a) && pA.has(b)) || (pB.has(a) && pB.has(b))) return k + 1;
    }
    return 1;
  };
  const s4ToS3Map = S4.elements.map((el) => {
    const img1 = findPartIndex(applyPermString(el, 1), applyPermString(el, 2));
    const img2 = findPartIndex(applyPermString(el, 1), applyPermString(el, 3));
    const img3 = findPartIndex(applyPermString(el, 1), applyPermString(el, 4));
    // Match S3 element sending 1->img1, 2->img2, 3->img3
    const idx = S3.elements.findIndex(
      (sEl) =>
        applyPermString(sEl, 1) === img1 &&
        applyPermString(sEl, 2) === img2 &&
        applyPermString(sEl, 3) === img3
    );
    return idx >= 0 ? idx : 0;
  });

  // 2. Sign homomorphism sgn: S_4 -> Z_2 (ker = A_4)
  const Z2 = buildCyclicGroup(2);
  const s4ToZ2Map = S4.elements.map((el) => {
    if (el === 'e') return 0;
    const cycles = el.match(/\([^)]+\)/g) ?? [];
    const swaps = cycles.reduce((sum, c) => sum + (c.slice(1, -1).trim().split(/\s+/).length - 1), 0);
    return swaps % 2;
  });

  // 3. D_4 -> V_4 collapsing <r^2> (center of D_4): r^a s^b -> (a mod 2, b mod 2)
  const D4 = buildDihedralGroup(4);
  const V4 = buildKleinFourGroup();
  const d4ToV4Map = D4.elements.map((_, i) => {
    const a = i % 4;
    const b = Math.floor(i / 4);
    const bitA = a % 2;
    const bitB = b % 2;
    if (bitA === 0 && bitB === 0) return 0; // e
    if (bitA === 1 && bitB === 0) return 1; // a
    if (bitA === 0 && bitB === 1) return 2; // b
    return 3; // c
  });

  // 4. Modular reduction Z_12 -> Z_4: x -> x mod 4
  const Z12 = buildCyclicGroup(12);
  const Z4 = buildCyclicGroup(4);
  const z12ToZ4Map = Z12.elements.map((_, x) => x % 4);

  // 5. Coordinate projection Z_2 x Z_6 -> Z_2: (a, b) -> a
  const Z2xZ6 = buildDirectProductCyclic([2, 6]);
  const projMap = Z2xZ6.elements.map((_, idx) => Math.floor(idx / 6) % 2);

  // 6. Broken map example: Z_6 -> Z_4 via x -> x mod 4 (fails homomorphism law!)
  const Z6 = buildCyclicGroup(6);
  const brokenMap = Z6.elements.map((_, x) => x % 4);

  return [
    {
      id: 's4_to_s3',
      title: 'Partition Action φ: S₄ → S₃ (ker = V₄)',
      subtitle: 'Flagship Artifact 2 theorem: S₄/V₄ ≅ S₃ proved directly via First Isomorphism Theorem.',
      sourceGroup: S4,
      targetGroup: S3,
      mapArray: s4ToS3Map,
    },
    {
      id: 's4_sgn',
      title: 'Parity / Sign Map sgn: S₄ → ℤ₂ (ker = A₄)',
      subtitle: 'Even permutations map to 0 and odd permutations map to 1, giving S₄/A₄ ≅ ℤ₂.',
      sourceGroup: S4,
      targetGroup: Z2,
      mapArray: s4ToZ2Map,
    },
    {
      id: 'd4_to_v4',
      title: 'Centre Collapse φ: D₄ → V₄ (ker = ⟨r²⟩)',
      subtitle: 'Sends r ↦ a and s ↦ b with r² ↦ e, yielding D₄/⟨r²⟩ ≅ V₄.',
      sourceGroup: D4,
      targetGroup: V4,
      mapArray: d4ToV4Map,
    },
    {
      id: 'z12_to_z4',
      title: 'Modular Reduction φ: ℤ₁₂ → ℤ₄ (ker = {0, 4, 8})',
      subtitle: 'Standard canonical projection x ↦ x mod 4, giving ℤ₁₂/⟨4⟩ ≅ ℤ₄.',
      sourceGroup: Z12,
      targetGroup: Z4,
      mapArray: z12ToZ4Map,
    },
    {
      id: 'proj_z2_z6',
      title: 'First Projection π₁: ℤ₂ × ℤ₆ → ℤ₂ (ker = {0} × ℤ₆)',
      subtitle: 'Projects (a, b) ↦ a with kernel of order 6.',
      sourceGroup: Z2xZ6,
      targetGroup: Z2,
      mapArray: projMap,
    },
    {
      id: 'broken_z6_z4',
      title: 'Counterexample Map f: ℤ₆ → ℤ₄ (x ↦ x mod 4)',
      subtitle: 'Demonstrates failure of φ(a + b) = φ(a) + φ(b) when target modulus 4 ∤ 6.',
      sourceGroup: Z6,
      targetGroup: Z4,
      mapArray: brokenMap,
      intendedFailure: true,
    },
  ];
}
