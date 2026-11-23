import { AbelianClassificationAnalysis, FiniteGroup } from './groupTypes.ts';
import { toSubscript } from '../utils/mathUnicode.ts';

function primeFactorize(n: number): Array<{ prime: number; power: number }> {
  const factors: Array<{ prime: number; power: number }> = [];
  let rem = n;
  for (let p = 2; p * p <= rem; p++) {
    if (rem % p === 0) {
      let count = 0;
      while (rem % p === 0) {
        rem /= p;
        count++;
      }
      factors.push({ prime: p, power: count });
    }
  }
  if (rem > 1) factors.push({ prime: rem, power: 1 });
  return factors;
}

export function classifyAbelianGroup(group: FiniteGroup): AbelianClassificationAnalysis {
  const orderMap = new Map<number, string[]>();
  for (let i = 0; i < group.order; i++) {
    const ord = group.orders[i];
    if (!orderMap.has(ord)) orderMap.set(ord, []);
    orderMap.get(ord)!.push(group.elements[i]);
  }
  const elementOrderDistribution = Array.from(orderMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([order, elements]) => ({ order, count: elements.length, elements }));

  const isCyclic = group.orders.some((o) => o === group.order);

  if (!group.isAbelian) {
    return {
      isAbelian: false,
      groupOrder: group.order,
      isCyclic: false,
      elementOrderDistribution,
      primePowerFactorization: [],
      elementaryDivisors: [],
      invariantFactors: [],
      decompositionOrderCheck: group.order,
      canonicalLatex: `\\text{Non-abelian group of order } ${group.order}`,
      elementaryLatex: '\\text{Not applicable (non-abelian)}',
      explanation: `${group.name} is NON-ABELIAN. The Fundamental Theorem of Finitely Generated Abelian Groups applies strictly to abelian groups and must not be applied here.`,
    };
  }

  if (group.order === 1) {
    return {
      isAbelian: true,
      groupOrder: 1,
      isCyclic: true,
      elementOrderDistribution,
      primePowerFactorization: [],
      elementaryDivisors: [1],
      invariantFactors: [1],
      decompositionOrderCheck: 1,
      canonicalLatex: '\\{e\\} \\cong \\mathbb{Z}_1',
      elementaryLatex: '\\mathbb{Z}_1',
      explanation: 'The trivial group of order 1 is cyclic and isomorphic to ℤ₁.',
    };
  }

  const primeFactors = primeFactorize(group.order);
  const perPrimeLists: number[][] = [];
  const primePowerFactorization: AbelianClassificationAnalysis['primePowerFactorization'] = [];
  const allElementaryDivisors: number[] = [];

  for (const { prime, power } of primeFactors) {
    const sylowOrder = Math.pow(prime, power);
    // Count elements in G whose order divides p^k (i.e. x^(p^k) == e)
    const ranksGE: number[] = [];
    let prevLog = 0;
    for (let k = 1; k <= power; k++) {
      const targetExp = Math.pow(prime, k);
      let countDiv = 0;
      for (let i = 0; i < group.order; i++) {
        if (targetExp % group.orders[i] === 0) countDiv++;
      }
      const curLog = Math.round(Math.log(countDiv) / Math.log(prime));
      ranksGE.push(curLog - prevLog);
      prevLog = curLog;
    }

    // ranksGE[k-1] = number of cyclic p-factors of order >= p^k
    const pDivisors: number[] = [];
    for (let k = 1; k <= ranksGE.length; k++) {
      const exactCount = ranksGE[k - 1] - (ranksGE[k] ?? 0);
      for (let c = 0; c < exactCount; c++) {
        pDivisors.push(Math.pow(prime, k));
      }
    }
    pDivisors.sort((a, b) => b - a);
    perPrimeLists.push(pDivisors);
    allElementaryDivisors.push(...pDivisors);

    primePowerFactorization.push({
      prime,
      power,
      sylowOrder,
      elementaryDivisors: [...pDivisors].sort((a, b) => a - b),
    });
  }

  allElementaryDivisors.sort((a, b) => a - b);

  // Build invariant factors d_1 | d_2 | ... | d_M
  const maxFactors = Math.max(...perPrimeLists.map((l) => l.length));
  const invariantFactors: number[] = [];
  for (let col = maxFactors - 1; col >= 0; col--) {
    let prod = 1;
    for (const pList of perPrimeLists) {
      prod *= pList[col] ?? 1;
    }
    invariantFactors.push(prod);
  }

  const decompositionOrderCheck = invariantFactors.reduce((a, b) => a * b, 1);
  const canonicalLatex = invariantFactors.map((d) => `\\mathbb{Z}_{${d}}`).join(' \\times ');
  const elementaryLatex = allElementaryDivisors.map((d) => `\\mathbb{Z}_{${d}}`).join(' \\times ');

  const explanation = isCyclic
    ? `Since ${group.name} is abelian of order ${group.order} and contains an element of order ${group.order}, it is cyclic: ${group.name} ≅ ℤ${toSubscript(group.order)}.`
    : `${group.name} is abelian of order ${group.order} (non-cyclic, max element order ${Math.max(...group.orders)}). By the Fundamental Theorem of Finite Abelian Groups, its invariant-factor decomposition is ${invariantFactors.map((d) => `ℤ${toSubscript(d)}`).join(' × ')} and its elementary-divisor decomposition is ${allElementaryDivisors.map((d) => `ℤ${toSubscript(d)}`).join(' × ')}.`;

  return {
    isAbelian: true,
    groupOrder: group.order,
    isCyclic,
    elementOrderDistribution,
    primePowerFactorization,
    elementaryDivisors: allElementaryDivisors,
    invariantFactors,
    decompositionOrderCheck,
    canonicalLatex,
    elementaryLatex,
    explanation,
  };
}
