import { enumerateAllSubgroups } from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { analyzeNormality } from './normalityEngine.ts';

export interface SylowSubgroupEntry {
  indices: number[];
  labels: string[];
  latexSet: string;
  isNormal: boolean;
  conjugateWitnessFromFirst: string | null;
  conjugateWitnessLatex: string | null;
}

export interface SylowPrimeReport {
  prime: number;
  power: number;
  sylowOrder: number;
  cofactorM: number;
  npCount: number;
  congruenceModPOk: boolean;
  dividesCofactorOk: boolean;
  allConjugateVerified: boolean;
  isUniqueNormal: boolean;
  validNpCandidates: number[];
  subgroups: SylowSubgroupEntry[];
}

export interface SylowAnalysis {
  groupOrder: number;
  exhaustive: boolean;
  factorizationLatex: string;
  reports: SylowPrimeReport[];
}

export interface CayleyElementPermutation {
  gIndex: number;
  gLabel: string;
  gLatex: string;
  order: number;
  /** leftMap[x] = g * x */
  leftMap: number[];
  cycleNotation: string;
  cycleLatex: string;
}

export interface CayleyTheoremAnalysis {
  groupOrder: number;
  targetSymmetricName: string;
  targetSymmetricLatex: string;
  isInjective: boolean;
  verifiedHomomorphismPairs: number;
  totalPairs: number;
  embeddings: CayleyElementPermutation[];
}

function primeFactorize(n: number): Array<{ prime: number; power: number }> {
  const res: Array<{ prime: number; power: number }> = [];
  let rem = n;
  let d = 2;
  while (d * d <= rem) {
    if (rem % d === 0) {
      let pow = 0;
      while (rem % d === 0) {
        rem /= d;
        pow++;
      }
      res.push({ prime: d, power: pow });
    }
    d++;
  }
  if (rem > 1) {
    res.push({ prime: rem, power: 1 });
  }
  return res;
}

export function analyzeSylowTheorems(group: FiniteGroup): SylowAnalysis {
  const factors = primeFactorize(group.order);
  const { subgroups: allSubs, exhaustive } = enumerateAllSubgroups(group);

  const factorizationLatex =
    factors.length === 0
      ? '1'
      : factors.map((f) => (f.power === 1 ? `${f.prime}` : `${f.prime}^{${f.power}}`)).join(' \\cdot ');

  const reports: SylowPrimeReport[] = factors.map(({ prime, power }) => {
    const sylowOrder = Math.pow(prime, power);
    const cofactorM = group.order / sylowOrder;
    const pSubs = allSubs.filter((s) => s.length === sylowOrder);

    const validNpCandidates: number[] = [];
    for (let d = 1; d <= cofactorM; d++) {
      if (cofactorM % d === 0 && d % prime === 1) {
        validNpCandidates.push(d);
      }
    }

    const baseKey = pSubs[0]?.join(',') ?? '';
    const entries: SylowSubgroupEntry[] = pSubs.map((sub, idx) => {
      const norm = analyzeNormality(group, sub);
      let witnessLabel: string | null = null;
      let witnessLatex: string | null = null;

      if (idx === 0) {
        witnessLabel = group.elements[group.identityIndex];
        witnessLatex = group.latexElements[group.identityIndex];
      } else {
        const subKey = sub.join(',');
        for (let g = 0; g < group.order; g++) {
          const gInv = group.inverses[g];
          const conj = Array.from(
            new Set(pSubs[0].map((h) => group.table[group.table[g][h]][gInv]))
          ).sort((a, b) => a - b);
          if (conj.join(',') === subKey) {
            witnessLabel = group.elements[g];
            witnessLatex = group.latexElements[g];
            break;
          }
        }
      }

      void baseKey;
      return {
        indices: sub,
        labels: sub.map((i) => group.elements[i]),
        latexSet: `\\{${sub.map((i) => group.latexElements[i]).join(', ')}\\}`,
        isNormal: norm.isNormal,
        conjugateWitnessFromFirst: witnessLabel,
        conjugateWitnessLatex: witnessLatex,
      };
    });

    const npCount = entries.length;
    const congruenceModPOk = npCount > 0 && npCount % prime === 1;
    const dividesCofactorOk = npCount > 0 && cofactorM % npCount === 0;
    const allConjugateVerified =
      npCount > 0 && entries.every((e) => e.conjugateWitnessFromFirst !== null);
    const isUniqueNormal = npCount === 1 && entries[0]?.isNormal === true;

    return {
      prime,
      power,
      sylowOrder,
      cofactorM,
      npCount,
      congruenceModPOk,
      dividesCofactorOk,
      allConjugateVerified,
      isUniqueNormal,
      validNpCandidates,
      subgroups: entries,
    };
  });

  return {
    groupOrder: group.order,
    exhaustive,
    factorizationLatex,
    reports,
  };
}

function buildElementCycles(
  perm: number[],
  labels: string[],
  latexLabels: string[]
): { cycleNotation: string; cycleLatex: string } {
  const n = perm.length;
  const visited = new Array<boolean>(n).fill(false);
  const cycles: string[] = [];
  const latexCycles: string[] = [];

  for (let i = 0; i < n; i++) {
    if (!visited[i] && perm[i] !== i) {
      const cyc: string[] = [];
      const lCyc: string[] = [];
      let cur = i;
      while (!visited[cur]) {
        visited[cur] = true;
        cyc.push(labels[cur]);
        lCyc.push(latexLabels[cur]);
        cur = perm[cur];
      }
      if (cyc.length > 1) {
        cycles.push(`(${cyc.join(' ')})`);
        latexCycles.push(`(${lCyc.join('\\;\\;')})`);
      }
    } else {
      visited[i] = true;
    }
  }

  return {
    cycleNotation: cycles.length === 0 ? 'id_G' : cycles.join(''),
    cycleLatex: latexCycles.length === 0 ? '\\mathrm{id}_G' : latexCycles.join(''),
  };
}

export function analyzeCayleyTheorem(group: FiniteGroup): CayleyTheoremAnalysis {
  const n = group.order;
  const embeddings: CayleyElementPermutation[] = Array.from({ length: n }, (_, g) => {
    const leftMap = group.table[g];
    const { cycleNotation, cycleLatex } = buildElementCycles(
      leftMap,
      group.elements,
      group.latexElements
    );
    return {
      gIndex: g,
      gLabel: group.elements[g],
      gLatex: group.latexElements[g],
      order: group.orders[g],
      leftMap,
      cycleNotation,
      cycleLatex,
    };
  });

  // Verify injective kernel = {e} and homomorphism lambda_{ab}(x) = lambda_a(lambda_b(x))
  let kernelCount = 0;
  for (let g = 0; g < n; g++) {
    if (embeddings[g].leftMap.every((val, x) => val === x)) {
      kernelCount++;
    }
  }

  let verifiedPairs = 0;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      const ab = group.table[a][b];
      const mapAB = embeddings[ab].leftMap;
      const mapA = embeddings[a].leftMap;
      const mapB = embeddings[b].leftMap;
      let match = true;
      for (let x = 0; x < n; x++) {
        if (mapAB[x] !== mapA[mapB[x]]) {
          match = false;
          break;
        }
      }
      if (match) verifiedPairs++;
    }
  }

  return {
    groupOrder: n,
    targetSymmetricName: `S${n}`,
    targetSymmetricLatex: `S_{${n}}`,
    isInjective: kernelCount === 1,
    verifiedHomomorphismPairs: verifiedPairs,
    totalPairs: n * n,
    embeddings,
  };
}
