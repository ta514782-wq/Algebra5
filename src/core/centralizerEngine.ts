import { CentralizerAnalysis, FiniteGroup } from './groupTypes.ts';
import { validateSubgroup } from './groupValidation.ts';

export function calculateCentralizer(
  group: FiniteGroup,
  subsetIndices: number[]
): CentralizerAnalysis {
  const S = Array.from(new Set(subsetIndices))
    .filter((i) => i >= 0 && i < group.order)
    .sort((a, b) => a - b);

  const centralizerIndices: number[] = [];
  const commutingPairs: CentralizerAnalysis['commutingPairs'] = [];

  for (let g = 0; g < group.order; g++) {
    let commutes = true;
    let failingWitness: string | undefined;
    for (const s of S) {
      const gs = group.table[g][s];
      const sg = group.table[s][g];
      if (gs !== sg) {
        commutes = false;
        failingWitness = `${group.elements[g]}${group.elements[s]} = ${group.elements[gs]} ≠ ${group.elements[sg]} = ${group.elements[s]}${group.elements[g]}`;
        break;
      }
    }
    if (commutes) centralizerIndices.push(g);
    commutingPairs.push({
      gLabel: group.elements[g],
      commutesWithAll: commutes,
      failingWitness,
    });
  }

  const subCheck = validateSubgroup(group, centralizerIndices);
  const subsetLabels = S.map((i) => group.elements[i]);

  const explanation =
    S.length === 0
      ? 'For the empty subset S = ∅, the commuting condition holds vacuously for every element, so C_G(∅) = G.'
      : `C_G(S) consists of all elements g ∈ ${group.name} that commute elementwise with every s ∈ {${subsetLabels.join(', ')}}. Note that unlike N_G(S) which only requires gSg⁻¹ = S as a set, C_G(S) requires gsg⁻¹ = s for each individual s ∈ S, so C_G(S) ⊆ N_G(S).`;

  return {
    subsetIndices: S,
    subsetLabels,
    centralizerIndices,
    centralizerLabels: centralizerIndices.map((i) => group.elements[i]),
    centralizerOrder: centralizerIndices.length,
    centralizerIsSubgroup: subCheck.isSubgroup,
    commutingPairs,
    explanation,
  };
}
