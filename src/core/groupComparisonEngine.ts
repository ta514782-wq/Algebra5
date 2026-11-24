import { calculateCentre } from './centreEngine.ts';
import { analyzeConjugacyClasses } from './conjugacyEngine.ts';
import { enumerateAllSubgroups } from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { findGroupIsomorphism, IsomorphismResult } from './isomorphismEngine.ts';
import { analyzeNormality } from './normalityEngine.ts';

export interface GroupPropertySummary {
  id: string;
  name: string;
  latexName: string;
  order: number;
  family: string;
  operationName: string;
  isAbelian: boolean;
  isCyclic: boolean;
  generatorCount: number;
  subgroupCount: number;
  exhaustiveSubgroups: boolean;
  normalSubgroupCount: number;
  isSimple: boolean;
  isHamiltonian: boolean;
  centreOrder: number;
  centreLabels: string[];
  conjugacyClassCount: number;
  classEquationString: string;
  maxElementOrder: number;
  orderSpectrum: string;
  orderCounts: Array<{ order: number; count: number }>;
}

export interface ComparisonRow {
  key: string;
  property: string;
  valueA: string;
  valueB: string;
  matches: boolean;
  isMath?: boolean;
}

export interface GroupComparisonReport {
  summaryA: GroupPropertySummary;
  summaryB: GroupPropertySummary;
  isomorphism: IsomorphismResult;
  rows: ComparisonRow[];
  matchingCount: number;
  differingCount: number;
}

export function computeGroupPropertySummary(group: FiniteGroup): GroupPropertySummary {
  const { subgroups, exhaustive } = enumerateAllSubgroups(group);
  let normalSubgroupCount = 0;
  for (const sub of subgroups) {
    if (analyzeNormality(group, sub).isNormal) {
      normalSubgroupCount += 1;
    }
  }

  const centre = calculateCentre(group);
  const conjugacy = analyzeConjugacyClasses(group);

  const countMap = new Map<number, number>();
  let maxElementOrder = 1;
  let generatorCount = 0;
  for (const ord of group.orders) {
    countMap.set(ord, (countMap.get(ord) ?? 0) + 1);
    if (ord > maxElementOrder) maxElementOrder = ord;
    if (ord === group.order) generatorCount += 1;
  }

  const orderCounts = Array.from(countMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([order, count]) => ({ order, count }));

  const orderSpectrum = orderCounts
    .map(({ order, count }) => `ord ${order}: ×${count}`)
    .join(' · ');

  const isCyclic = generatorCount > 0;
  const isSimple = group.order > 1 && exhaustive && normalSubgroupCount === 2;
  const isHamiltonian = !group.isAbelian && exhaustive && normalSubgroupCount === subgroups.length;

  return {
    id: group.id,
    name: group.name,
    latexName: group.latexName,
    order: group.order,
    family: group.family,
    operationName: group.operationName,
    isAbelian: group.isAbelian,
    isCyclic,
    generatorCount,
    subgroupCount: subgroups.length,
    exhaustiveSubgroups: exhaustive,
    normalSubgroupCount,
    isSimple,
    isHamiltonian,
    centreOrder: centre.centreOrder,
    centreLabels: centre.centreLabels,
    conjugacyClassCount: conjugacy.classes.length,
    classEquationString: conjugacy.classEquationString,
    maxElementOrder,
    orderSpectrum,
    orderCounts,
  };
}

export function compareTwoGroups(groupA: FiniteGroup, groupB: FiniteGroup): GroupComparisonReport {
  const summaryA = computeGroupPropertySummary(groupA);
  const summaryB = computeGroupPropertySummary(groupB);
  const isomorphism = findGroupIsomorphism(groupA, groupB);

  const formatCentre = (s: GroupPropertySummary) =>
    `|Z| = ${s.centreOrder} (${s.centreLabels.length <= 4 ? `{${s.centreLabels.join(', ')}}` : `${s.centreOrder} elements`})`;

  const formatNormalShare = (s: GroupPropertySummary) => {
    if (s.isAbelian) return `${s.normalSubgroupCount} / ${s.subgroupCount} (all normal — abelian)`;
    if (s.isHamiltonian) return `${s.normalSubgroupCount} / ${s.subgroupCount} (Dedekind/Hamiltonian)`;
    if (s.isSimple) return `${s.normalSubgroupCount} / ${s.subgroupCount} (Simple group)`;
    return `${s.normalSubgroupCount} / ${s.subgroupCount}`;
  };

  const rows: ComparisonRow[] = [
    {
      key: 'order',
      property: 'Group Order |G|',
      valueA: String(summaryA.order),
      valueB: String(summaryB.order),
      matches: summaryA.order === summaryB.order,
    },
    {
      key: 'abelian',
      property: 'Commutativity',
      valueA: summaryA.isAbelian ? 'Abelian (Commutative)' : 'Non-Abelian',
      valueB: summaryB.isAbelian ? 'Abelian (Commutative)' : 'Non-Abelian',
      matches: summaryA.isAbelian === summaryB.isAbelian,
    },
    {
      key: 'cyclic',
      property: 'Cyclic Structure',
      valueA: summaryA.isCyclic ? `Cyclic (${summaryA.generatorCount} generators)` : 'Not Cyclic',
      valueB: summaryB.isCyclic ? `Cyclic (${summaryB.generatorCount} generators)` : 'Not Cyclic',
      matches: summaryA.isCyclic === summaryB.isCyclic && summaryA.generatorCount === summaryB.generatorCount,
    },
    {
      key: 'subgroups',
      property: 'Total Subgroups',
      valueA: `${summaryA.subgroupCount}${summaryA.exhaustiveSubgroups ? '' : ' (bounded)'}`,
      valueB: `${summaryB.subgroupCount}${summaryB.exhaustiveSubgroups ? '' : ' (bounded)'}`,
      matches: summaryA.subgroupCount === summaryB.subgroupCount,
    },
    {
      key: 'normal-subgroups',
      property: 'Normal Subgroups (H ◁ G)',
      valueA: formatNormalShare(summaryA),
      valueB: formatNormalShare(summaryB),
      matches: summaryA.normalSubgroupCount === summaryB.normalSubgroupCount,
    },
    {
      key: 'centre',
      property: 'Centre Z(G)',
      valueA: formatCentre(summaryA),
      valueB: formatCentre(summaryB),
      matches: summaryA.centreOrder === summaryB.centreOrder,
    },
    {
      key: 'conjugacy',
      property: 'Conjugacy Classes',
      valueA: `${summaryA.conjugacyClassCount} classes (${summaryA.classEquationString})`,
      valueB: `${summaryB.conjugacyClassCount} classes (${summaryB.classEquationString})`,
      matches: summaryA.conjugacyClassCount === summaryB.conjugacyClassCount,
    },
    {
      key: 'max-order',
      property: 'Maximum Element Order',
      valueA: String(summaryA.maxElementOrder),
      valueB: String(summaryB.maxElementOrder),
      matches: summaryA.maxElementOrder === summaryB.maxElementOrder,
    },
    {
      key: 'order-spectrum',
      property: 'Element Order Spectrum',
      valueA: summaryA.orderSpectrum,
      valueB: summaryB.orderSpectrum,
      matches: summaryA.orderSpectrum === summaryB.orderSpectrum,
    },
    {
      key: 'family',
      property: 'Algebraic Family',
      valueA: summaryA.family.charAt(0).toUpperCase() + summaryA.family.slice(1),
      valueB: summaryB.family.charAt(0).toUpperCase() + summaryB.family.slice(1),
      matches: summaryA.family === summaryB.family,
    },
  ];

  const matchingCount = rows.filter((r) => r.matches).length;
  const differingCount = rows.length - matchingCount;

  return {
    summaryA,
    summaryB,
    isomorphism,
    rows,
    matchingCount,
    differingCount,
  };
}
