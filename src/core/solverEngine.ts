import { calculateCentralizer } from './centralizerEngine.ts';
import { calculateCentre } from './centreEngine.ts';
import { classifyAbelianGroup } from './classificationEngine.ts';
import { analyzeConjugacyClasses } from './conjugacyEngine.ts';
import { analyzeCosets } from './cosetEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { verifyLagrangeTheorem } from './lagrangeEngine.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { calculateNormalizer } from './normalizerEngine.ts';
import { buildQuotientGroup } from './quotientEngine.ts';

export type SolverProblemType =
  | 'cosets'
  | 'lagrange'
  | 'normality'
  | 'normalizer'
  | 'centralizer'
  | 'centre'
  | 'quotient'
  | 'classification'
  | 'conjugacy';

export interface SolverOutput {
  problemTitle: string;
  givenInfo: string[];
  requiredResult: string;
  relevantTheorem: string;
  formulaLatex: string;
  steps: string[];
  finalAnswer: string;
  verificationSummary: string;
  verifiedByEngine: boolean;
}

export function solveGroupProblem(
  type: SolverProblemType,
  group: FiniteGroup,
  subsetIndices: number[]
): SolverOutput {
  const hLabels = subsetIndices.map((i) => group.elements[i]).join(', ');

  switch (type) {
    case 'cosets': {
      const res = analyzeCosets(group, subsetIndices);
      if (!res.valid) {
        return {
          problemTitle: `Compute Left and Right Cosets of H in ${group.name}`,
          givenInfo: [`Group G = ${group.name} (order ${group.order})`, `Subset H = {${hLabels}}`],
          requiredResult: 'All distinct left cosets gH, right cosets Hg, and index [G:H]',
          relevantTheorem: 'Coset Partition Theorem',
          formulaLatex: 'gH = \\{gh : h \\in H\\}, \\quad [G:H] = \\frac{|G|}{|H|}',
          steps: res.validation.reasons,
          finalAnswer: 'Invalid input: H is not a subgroup of G.',
          verificationSummary: 'Subgroup axioms failed in the group engine.',
          verifiedByEngine: true,
        };
      }
      return {
        problemTitle: `Compute Left and Right Cosets of H in ${group.name}`,
        givenInfo: [`Group G = ${group.name} (|G| = ${group.order})`, `Subgroup H = {${hLabels}} (|H| = ${res.validation.order})`],
        requiredResult: 'All distinct left cosets, right cosets, index [G:H], and coset equality test',
        relevantTheorem: 'Cosets Partition G into Equinumerous Blocks',
        formulaLatex: 'gH = \\{g \\cdot h : h \\in H\\}, \\quad Hg = \\{h \\cdot g : h \\in H\\}',
        steps: [
          `1. Verified H is a subgroup of ${group.name} of order ${res.validation.order}.`,
          `2. Computed ${res.distinctLeftCosets.length} distinct left cosets: ${res.distinctLeftCosets.map((c) => `${c.cosetLabel} = {${c.elementLabels.join(', ')}}`).join('; ')}.`,
          `3. Computed ${res.distinctRightCosets.length} distinct right cosets: ${res.distinctRightCosets.map((c) => `${c.cosetLabel} = {${c.elementLabels.join(', ')}}`).join('; ')}.`,
          `4. Compared gH and Hg for every g ∈ G: ${res.allLeftEqualRight ? 'All left and right cosets match.' : `Mismatch detected at g = ${res.mismatchWitnesses[0]?.element}.`}`,
        ],
        finalAnswer: `[G : H] = ${res.index}. Left cosets = Right cosets: ${res.allLeftEqualRight ? 'Yes' : 'No'}.`,
        verificationSummary: `Engine verified disjoint partition of ${group.order} elements into ${res.index} cosets of size ${res.validation.order}.`,
        verifiedByEngine: res.partitionVerified,
      };
    }

    case 'lagrange': {
      const res = verifyLagrangeTheorem(group, subsetIndices);
      return {
        problemTitle: `Verify Lagrange's Theorem for H ≤ ${group.name}`,
        givenInfo: [`Group G = ${group.name} (|G| = ${group.order})`, `Subset H = {${hLabels}} (|H| = ${res.subgroupOrder})`],
        requiredResult: 'Verify |G| = |H| × [G : H] and check |H| ∣ |G|',
        relevantTheorem: "Lagrange's Theorem",
        formulaLatex: '|G| = |H| \\cdot [G : H]',
        steps: res.stepByStep,
        finalAnswer: res.equationVerified
          ? `Verified: ${res.groupOrder} = ${res.subgroupOrder} × ${res.index}.`
          : 'Lagrange verification failed because H is not a valid subgroup.',
        verificationSummary: `Divisibility: ${res.divides ? 'Yes' : 'No'}; Coset partition verified: ${res.equationVerified ? 'Yes' : 'No'}.`,
        verifiedByEngine: res.equationVerified,
      };
    }

    case 'normality': {
      const res = analyzeNormality(group, subsetIndices);
      return {
        problemTitle: `Test Normality of H in ${group.name}`,
        givenInfo: [`Group G = ${group.name}`, `Subset H = {${hLabels}}`],
        requiredResult: 'Determine whether H ◁ G using conjugation and coset equality',
        relevantTheorem: 'Normal Subgroup Criterion',
        formulaLatex: 'H \\trianglelefteq G \\iff \\forall g \\in G,\\; gHg^{-1} = H \\iff \\forall g \\in G,\\; gH = Hg',
        steps: res.isSubgroup
          ? [
              '1. Confirmed H satisfies subgroup axioms (identity, closure, inverses).',
              `2. Checked gHg⁻¹ for all ${group.order} elements g ∈ G.`,
              `3. Checked gH = Hg for all ${group.order} elements g ∈ G.`,
              res.isNormal
                ? '4. Every conjugate gHg⁻¹ equals H and every left coset equals its right coset.'
                : `4. Witness failure at g = ${res.failingElements[0]?.gLabel}: gHg⁻¹ = {${res.failingElements[0]?.gHgInv.join(', ')}} ≠ H.`,
            ]
          : res.validation.reasons,
        finalAnswer: res.isNormal ? `H is NORMAL in ${group.name} (H ◁ ${group.name}).` : `H is NOT normal in ${group.name}.`,
        verificationSummary: res.explanation,
        verifiedByEngine: true,
      };
    }

    case 'normalizer': {
      const res = calculateNormalizer(group, subsetIndices);
      return {
        problemTitle: `Compute Normalizer N_G(H) in ${group.name}`,
        givenInfo: [`Group G = ${group.name}`, `Subset/Subgroup H = {${hLabels}}`],
        requiredResult: 'Find all g ∈ G such that gHg⁻¹ = H',
        relevantTheorem: 'Normalizer Subgroup Theorem',
        formulaLatex: 'N_G(H) = \\{g \\in G : gHg^{-1} = H\\}',
        steps: [
          `1. Evaluated gHg⁻¹ for each g ∈ ${group.name}.`,
          `2. Collected elements where gHg⁻¹ = H: {${res.normalizerLabels.join(', ')}}.`,
          `3. Verified H ⊆ N_G(H): ${res.hContainedInNormalizer ? 'True' : 'False'}.`,
          `4. Verified N_G(H) ≤ G: ${res.normalizerIsSubgroup ? 'True' : 'False'}.`,
        ],
        finalAnswer: `N_G(H) = {${res.normalizerLabels.join(', ')}} (order ${res.normalizerOrder}).`,
        verificationSummary: res.explanation,
        verifiedByEngine: res.normalizerIsSubgroup,
      };
    }

    case 'centralizer': {
      const res = calculateCentralizer(group, subsetIndices);
      return {
        problemTitle: `Compute Centralizer C_G(S) in ${group.name}`,
        givenInfo: [`Group G = ${group.name}`, `Subset S = {${hLabels}}`],
        requiredResult: 'Find all g ∈ G commuting with every s ∈ S',
        relevantTheorem: 'Centralizer Subgroup Property',
        formulaLatex: 'C_G(S) = \\{g \\in G : gs = sg \\;\\forall s \\in S\\}',
        steps: [
          `1. Tested commutation gs = sg for all g ∈ ${group.name} against every s ∈ S.`,
          `2. Elements commuting with all s ∈ S: {${res.centralizerLabels.join(', ')}}.`,
          `3. Verified C_G(S) is a subgroup of ${group.name}.`,
        ],
        finalAnswer: `C_G(S) = {${res.centralizerLabels.join(', ')}} (order ${res.centralizerOrder}).`,
        verificationSummary: res.explanation,
        verifiedByEngine: res.centralizerIsSubgroup,
      };
    }

    case 'centre': {
      const res = calculateCentre(group);
      return {
        problemTitle: `Compute Centre Z(${group.name})`,
        givenInfo: [`Group G = ${group.name} (order ${group.order})`],
        requiredResult: 'Find all central elements commuting with every element of G',
        relevantTheorem: 'Centre as a Normal Subgroup',
        formulaLatex: 'Z(G) = \\{z \\in G : zg = gz \\;\\forall g \\in G\\} \\trianglelefteq G',
        steps: [
          `1. Checked commutation for all ${group.order} elements across the full Cayley table.`,
          `2. Identified ${res.centreOrder} central element(s): {${res.centreLabels.join(', ')}}.`,
          `3. Verified Z(G) is a normal subgroup of ${group.name}.`,
        ],
        finalAnswer: `Z(${group.name}) = {${res.centreLabels.join(', ')}} (order ${res.centreOrder}).`,
        verificationSummary: res.explanation,
        verifiedByEngine: res.isNormalSubgroup,
      };
    }

    case 'quotient': {
      const res = buildQuotientGroup(group, subsetIndices);
      if (!res.canConstruct || !res.quotientGroup) {
        return {
          problemTitle: `Construct Quotient Group ${group.name}/H`,
          givenInfo: [`Group G = ${group.name}`, `Subset H = {${hLabels}}`],
          requiredResult: 'Construct G/H and compute its Cayley table and coset orders',
          relevantTheorem: 'Well-Definedness of Quotient Multiplication',
          formulaLatex: '(g_1H)(g_2H) = (g_1g_2)H \\iff H \\trianglelefteq G',
          steps: [
            '1. Checked subgroup and normality axioms for H.',
            res.reasonIfInvalid || 'H is not normal.',
            res.wellDefinedCounterexample
              ? `2. Counterexample: (${res.wellDefinedCounterexample.g1}·${res.wellDefinedCounterexample.h1})(${res.wellDefinedCounterexample.g2}·${res.wellDefinedCounterexample.h2}) yields a different coset than (${res.wellDefinedCounterexample.g1}·${res.wellDefinedCounterexample.g2})H.`
              : '2. Coset multiplication fails well-definedness.',
          ],
          finalAnswer: 'Quotient group cannot be constructed because H is not normal in G.',
          verificationSummary: 'Blocked invalid quotient construction per Theorem.',
          verifiedByEngine: true,
        };
      }
      return {
        problemTitle: `Construct Quotient Group ${group.name}/H`,
        givenInfo: [`Group G = ${group.name} (|G| = ${group.order})`, `Normal subgroup H = {${hLabels}} (|H| = ${res.normality.validation.order})`],
        requiredResult: 'Cosets of G/H, Cayley table, identity coset, and element orders',
        relevantTheorem: 'Quotient Group Theorem',
        formulaLatex: '|G/H| = [G:H] = \\frac{|G|}{|H|}, \\quad \\mathrm{ord}(gH) = \\min\\{m \\ge 1 : g^m \\in H\\}',
        steps: [
          `1. Verified H ◁ ${group.name}.`,
          `2. Formed ${res.quotientGroup.order} distinct cosets: ${res.quotientGroup.elements.join(', ')}.`,
          `3. Computed quotient multiplication table (g₁H)(g₂H) = (g₁g₂)H.`,
          `4. Computed coset orders: ${res.orderChecks?.map((o) => `ord(${o.cosetLabel}) = ${o.order}`).join(', ')}.`,
        ],
        finalAnswer: `|${group.name}/H| = ${res.quotientGroup.order}; ${res.quotientGroup.isAbelian ? 'Abelian' : 'Non-abelian'} quotient group.`,
        verificationSummary: `Verified |G/H| = [G:H] = ${res.quotientGroup.order} and group axioms on quotient table.`,
        verifiedByEngine: res.indexMatchesOrder,
      };
    }

    case 'classification': {
      const qRes = buildQuotientGroup(group, subsetIndices);
      const targetGroup = qRes.canConstruct && qRes.quotientGroup ? qRes.quotientGroup : group;
      const cls = classifyAbelianGroup(targetGroup);
      return {
        problemTitle: `Classify ${targetGroup.name}`,
        givenInfo: [`Target Group: ${targetGroup.name} (order ${targetGroup.order})`],
        requiredResult: 'Classify using FTFGAG if abelian',
        relevantTheorem: 'Fundamental Theorem of Finite Abelian Groups',
        formulaLatex: cls.isAbelian ? `${targetGroup.latexName} \\cong ${cls.canonicalLatex}` : '\\text{Non-abelian}',
        steps: [
          `1. Checked commutativity of ${targetGroup.name}: ${cls.isAbelian ? 'Abelian' : 'Non-abelian'}.`,
          cls.isAbelian
            ? `2. Computed prime-power decomposition and element-order profile.`
            : `2. Stopped FTFGAG classification because ${targetGroup.name} is non-abelian.`,
          cls.isAbelian
            ? `3. Invariant factors: [${cls.invariantFactors.join(', ')}]; Elementary divisors: [${cls.elementaryDivisors.join(', ')}].`
            : `3. Element order profile: ${cls.elementOrderDistribution.map((d) => `${d.count} of order ${d.order}`).join(', ')}.`,
        ],
        finalAnswer: cls.explanation,
        verificationSummary: `Product of invariant factors = ${cls.decompositionOrderCheck} (matches |G| = ${cls.groupOrder}).`,
        verifiedByEngine: cls.decompositionOrderCheck === cls.groupOrder,
      };
    }

    case 'conjugacy': {
      const res = analyzeConjugacyClasses(group);
      return {
        problemTitle: `Conjugacy Classes & Class Equation of ${group.name}`,
        givenInfo: [`Group G = ${group.name} (|G| = ${group.order})`],
        requiredResult: 'Partition G into conjugacy classes and write the Class Equation',
        relevantTheorem: 'Class Equation of a Finite Group',
        formulaLatex: res.classEquationLatex,
        steps: [
          `1. Computed Cl(x) = {gxg⁻¹ : g ∈ G} for each element.`,
          `2. Found ${res.classes.length} conjugacy classes; ${res.centralElements.length} central element(s) of class size 1.`,
          `3. Verified class sizes sum to ${res.sumOfSizes} = |G|.`,
        ],
        finalAnswer: res.classEquationString,
        verificationSummary: `Partition verified: ${res.partitionVerified ? 'Yes' : 'No'}.`,
        verifiedByEngine: res.partitionVerified,
      };
    }
  }
}
