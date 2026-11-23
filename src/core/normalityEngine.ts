import { analyzeCosets } from './cosetEngine.ts';
import { ConjugationEntry, FiniteGroup, NormalityAnalysis } from './groupTypes.ts';
import { validateSubgroup } from './groupValidation.ts';

export function analyzeNormality(
  group: FiniteGroup,
  subgroupIndices: number[]
): NormalityAnalysis {
  const validation = validateSubgroup(group, subgroupIndices);
  const H = Array.from(new Set(subgroupIndices)).sort((a, b) => a - b);
  const hKey = H.join(',');

  if (!validation.isSubgroup) {
    return {
      isSubgroup: false,
      validation,
      isNormal: false,
      conjugationConditionHolds: false,
      cosetEqualityHolds: false,
      conjugations: [],
      failingElements: [],
      explanation: `Normality cannot hold because H is not a subgroup of ${group.name}: ${validation.reasons.join(' ')}`,
    };
  }

  const cosets = analyzeCosets(group, H);
  const conjugations: ConjugationEntry[] = [];
  const failingElements: NormalityAnalysis['failingElements'] = [];

  for (let g = 0; g < group.order; g++) {
    const gInv = group.inverses[g];
    const conjSet = Array.from(
      new Set(H.map((h) => group.table[group.table[g][h]][gInv]))
    ).sort((a, b) => a - b);

    const equalsH = conjSet.join(',') === hKey;
    conjugations.push({
      gIndex: g,
      gLabel: group.elements[g],
      conjugateIndices: conjSet,
      conjugateLabels: conjSet.map((i) => group.elements[i]),
      equalsH,
    });

    if (!equalsH) {
      failingElements.push({
        gLabel: group.elements[g],
        gHgInv: conjSet.map((i) => group.elements[i]),
        gH: cosets.leftCosets[g].elementLabels,
        Hg: cosets.rightCosets[g].elementLabels,
      });
    }
  }

  const conjugationConditionHolds = failingElements.length === 0;
  const cosetEqualityHolds = cosets.allLeftEqualRight;
  const isNormal = conjugationConditionHolds && cosetEqualityHolds;

  const explanation = isNormal
    ? `H is a normal subgroup of ${group.name} (H ◁ ${group.name}). Both equivalent conditions hold for all ${group.order} elements g ∈ ${group.name}: gHg⁻¹ = H and gH = Hg.`
    : `H is NOT normal in ${group.name}. Found ${failingElements.length} witness element(s) g ∈ ${group.name} (for example, g = ${failingElements[0].gLabel}) where gHg⁻¹ ≠ H and gH ≠ Hg.`;

  return {
    isSubgroup: true,
    validation,
    isNormal,
    conjugationConditionHolds,
    cosetEqualityHolds,
    conjugations,
    failingElements,
    explanation,
  };
}
