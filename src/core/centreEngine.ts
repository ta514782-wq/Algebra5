import { calculateCentralizer } from './centralizerEngine.ts';
import { CentreAnalysis, FiniteGroup } from './groupTypes.ts';
import { analyzeNormality } from './normalityEngine.ts';

export function calculateCentre(group: FiniteGroup): CentreAnalysis {
  const allIndices = Array.from({ length: group.order }, (_, i) => i);
  const centralizer = calculateCentralizer(group, allIndices);
  const centreIndices = centralizer.centralizerIndices;
  const normality = analyzeNormality(group, centreIndices);

  const elementBreakdown = centralizer.commutingPairs.map((p) => ({
    label: p.gLabel,
    isCentral: p.commutesWithAll,
    nonCommutingWith: p.failingWitness,
  }));

  const isAbelianGroup = centreIndices.length === group.order;
  const explanation = isAbelianGroup
    ? `Since ${group.name} is abelian, every element commutes with all elements, so Z(${group.name}) = ${group.name}.`
    : `Z(${group.name}) = {${centreIndices.map((i) => group.elements[i]).join(', ')}} has order ${centreIndices.length}. Every element in Z(G) commutes with all g ∈ G, and Z(G) = ⋂_{x ∈ G} C_G(x) is always a normal subgroup of G.`;

  return {
    centreIndices,
    centreLabels: centreIndices.map((i) => group.elements[i]),
    centreOrder: centreIndices.length,
    isAbelianGroup,
    isNormalSubgroup: normality.isNormal,
    elementBreakdown,
    explanation,
  };
}
