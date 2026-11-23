import { analyzeCosets } from './cosetEngine.ts';
import { findSubgroupsOfOrder } from './groupEngine.ts';
import { FiniteGroup, LagrangeAnalysis } from './groupTypes.ts';
import { validateSubgroup } from './groupValidation.ts';

export function verifyLagrangeTheorem(
  group: FiniteGroup,
  subgroupIndices: number[],
  converseTargetDivisor?: number
): LagrangeAnalysis {
  const validation = validateSubgroup(group, subgroupIndices);
  const gOrder = group.order;
  const hOrder = validation.order;

  if (!validation.isSubgroup) {
    return {
      groupOrder: gOrder,
      subgroupOrder: hOrder,
      index: null,
      divides: false,
      equationVerified: false,
      validation,
      stepByStep: [
        `Step 1: Verify whether H is a valid subgroup of ${group.name}.`,
        `Validation failed: ${validation.reasons.join(' ')}`,
        `Lagrange's theorem applies only to valid subgroups H ≤ G.`,
      ],
    };
  }

  const cosets = analyzeCosets(group, subgroupIndices);
  const index = cosets.index;
  const divides = gOrder % hOrder === 0;
  const equationVerified = divides && hOrder * index === gOrder && cosets.partitionVerified;

  const stepByStep = [
    `Step 1 (Subgroup Verification): H is a verified subgroup of ${group.name} with |H| = ${hOrder}.`,
    `Step 2 (Coset Partition): Partition ${group.name} (|G| = ${gOrder}) into disjoint left cosets gH. Each left coset has exact cardinality |gH| = |H| = ${hOrder} via the bijection h ↦ g${group.operationSymbol}h.`,
    `Step 3 (Count Cosets): There are [G : H] = ${index} distinct left cosets covering all ${gOrder} elements of ${group.name}.`,
    `Step 4 (Lagrange Equation): |G| = |H| × [G : H] ⇒ ${gOrder} = ${hOrder} × ${index}. Divisibility |H| ∣ |G| holds (${gOrder} / ${hOrder} = ${index}).`,
  ];

  let converseSearch: LagrangeAnalysis['converseSearch'];
  if (converseTargetDivisor !== undefined) {
    const search = findSubgroupsOfOrder(group, converseTargetDivisor);
    converseSearch = {
      targetDivisor: converseTargetDivisor,
      foundSubgroups: search.subgroups,
      exhaustive: search.exhaustive,
      note: search.note,
    };
  }

  return {
    groupOrder: gOrder,
    subgroupOrder: hOrder,
    index,
    divides,
    equationVerified,
    validation,
    stepByStep,
    converseSearch,
  };
}
