import { classifyAbelianGroup } from './classificationEngine.ts';
import { analyzeCosets } from './cosetEngine.ts';
import {
  buildAlternatingGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildSymmetricGroup,
} from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { validateSubgroup } from './groupValidation.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { calculateNormalizer } from './normalizerEngine.ts';

export interface LabChallenge {
  id: string;
  number: number;
  title: string;
  prompt: string;
  hint: string;
  group: FiniteGroup;
  targetGoalSummary: string;
}

export interface ChallengeGradeResult {
  passed: boolean;
  headline: string;
  checks: Array<{ label: string; ok: boolean; detail: string }>;
}

export function getLabChallenges(): LabChallenge[] {
  return [
    {
      id: 'd4-non-normal-order2',
      number: 1,
      title: 'Construct a Non-Normal Order-2 Subgroup in D₄',
      prompt: 'Select elements in $D_4$ forming a subgroup $H \\le D_4$ with $|H| = 2$ such that $H$ fails normality ($H \\not\\trianglelefteq D_4$).',
      hint: 'Remember $r^2 \\in Z(D_4)$ generates a normal subgroup, whereas reflections like $s$ or $rs$ do not commute with $r$.',
      group: buildDihedralGroup(4),
      targetGoalSummary: 'H ≤ D₄, |H| = 2, and H ⋪ D₄',
    },
    {
      id: 'd4-normalizer-of-s',
      number: 2,
      title: 'Build the Exact Normalizer $N_{D_4}(\\langle s \\rangle)$',
      prompt: 'Construct the subgroup $N = N_{D_4}(\\langle s \\rangle) = \\{g \\in D_4 : g\\langle s \\rangle g^{-1} = \\langle s \\rangle\\}$ by clicking its elements.',
      hint: 'Since $r^2$ commutes with everything and $s \\in \\langle s \\rangle$, check which elements preserve $\\{e, s\\}$ under conjugation.',
      group: buildDihedralGroup(4),
      targetGoalSummary: 'N = N_D₄(⟨s⟩), order 4',
    },
    {
      id: 's4-normal-v4',
      number: 3,
      title: 'Construct the Normal Klein-Four Subgroup $V_4 \\trianglelefteq S_4$',
      prompt: 'Select the $4$ permutations in $S_4$ that form the unique normal subgroup of order $4$ so that $S_4 / V_4 \\cong S_3$.',
      hint: 'Include the identity $e$ together with all three double transpositions of cycle type $(2,2)$.',
      group: buildSymmetricGroup(4),
      targetGoalSummary: 'H ◁ S₄ and |H| = 4',
    },
    {
      id: 's3-non-normal',
      number: 4,
      title: 'Witness Left $\\neq$ Right Cosets in $S_3$',
      prompt: 'Construct a subgroup $H \\le S_3$ of index $[S_3 : H] = 3$ whose left cosets $gH$ do not all equal its right cosets $Hg$.',
      hint: 'Any single transposition $(1\\;2)$, $(1\\;3)$, or $(2\\;3)$ paired with $e$ has order $2$.',
      group: buildSymmetricGroup(3),
      targetGoalSummary: 'H ≤ S₃, [S₃ : H] = 3, gH ≠ Hg',
    },
    {
      id: 'z2z6-non-cyclic-order4',
      number: 5,
      title: 'Build a Non-Cyclic Order-4 Subgroup in $\\mathbb{Z}_2 \\times \\mathbb{Z}_6$',
      prompt: 'Construct a subgroup $H \\le \\mathbb{Z}_2 \\times \\mathbb{Z}_6$ of order $4$ that is isomorphic to $\\mathbb{Z}_2 \\times \\mathbb{Z}_2$ (not cyclic!).',
      hint: 'Collect the identity $(0,0)$ and three distinct elements of order $2$ in $\\mathbb{Z}_2 \\times \\mathbb{Z}_6$.',
      group: buildDirectProductCyclic([2, 6]),
      targetGoalSummary: 'H ≤ ℤ₂ × ℤ₆, |H| = 4, H ≅ V₄ (non-cyclic)',
    },
    {
      id: 'a4-unique-normal',
      number: 6,
      title: 'Isolate the Only Proper Non-Trivial Normal Subgroup of $A_4$',
      prompt: 'Select the unique subgroup $H \\trianglelefteq A_4$ with $1 < |H| < 12$, key to proving $A_4$ has no subgroup of order $6$.',
      hint: 'Check elements whose conjugacy class size divides into a normal union containing $e$.',
      group: buildAlternatingGroup(4),
      targetGoalSummary: 'H ◁ A₄ and 1 < |H| < 12',
    },
  ];
}

export function gradeLabChallenge(
  challengeId: string,
  selectedIndices: number[]
): ChallengeGradeResult {
  const challenge = getLabChallenges().find((c) => c.id === challengeId);
  if (!challenge) {
    return { passed: false, headline: 'Unknown challenge.', checks: [] };
  }
  const g = challenge.group;
  const clean = Array.from(new Set(selectedIndices)).sort((a, b) => a - b);
  const subVal = validateSubgroup(g, clean);

  if (!subVal.isSubgroup) {
    return {
      passed: false,
      headline: 'Selection is not a valid subgroup yet.',
      checks: [
        {
          label: 'Subgroup axioms (identity, closure, inverses)',
          ok: false,
          detail: subVal.reasons.join(' '),
        },
      ],
    };
  }

  switch (challengeId) {
    case 'd4-non-normal-order2': {
      const ordOk = clean.length === 2;
      const norm = analyzeNormality(g, clean);
      const nonNormalOk = !norm.isNormal;
      const passed = ordOk && nonNormalOk;
      return {
        passed,
        headline: passed
          ? 'Verified! You constructed a non-normal order-2 subgroup of D₄.'
          : 'Subgroup is valid, but check the order and non-normality targets.',
        checks: [
          { label: 'Valid subgroup H ≤ D₄', ok: true, detail: `|H| = ${clean.length}` },
          { label: 'Order equals 2', ok: ordOk, detail: ordOk ? '|H| = 2' : `Got |H| = ${clean.length}, need 2` },
          {
            label: 'Non-normal (H ⋪ D₄)',
            ok: nonNormalOk,
            detail: nonNormalOk
              ? `Witness: g = ${norm.failingElements[0]?.gLabel} fails gHg⁻¹ = H`
              : 'Your selection is normal in D₄ (such as ⟨r²⟩ = Z(D₄)). Try a reflection!',
          },
        ],
      };
    }

    case 'd4-normalizer-of-s': {
      const sIdx = g.elements.indexOf('s');
      const targetNorm = calculateNormalizer(g, [g.identityIndex, sIdx]);
      const exactMatch =
        clean.length === targetNorm.normalizerIndices.length &&
        clean.every((v, idx) => v === targetNorm.normalizerIndices[idx]);
      return {
        passed: exactMatch,
        headline: exactMatch
          ? 'Exact match! N_D₄(⟨s⟩) = {e, r², s, r²s}.'
          : 'Not quite the normalizer of ⟨s⟩.',
        checks: [
          { label: 'Valid subgroup N ≤ D₄', ok: true, detail: `|N| = ${clean.length}` },
          {
            label: 'Equals N_D₄(⟨s⟩)',
            ok: exactMatch,
            detail: exactMatch
              ? 'Includes all elements satisfying g⟨s⟩g⁻¹ = ⟨s⟩.'
              : `Your subset has ${clean.length} element(s); check which r^k and r^k s leave {e, s} invariant under g(·)g⁻¹.`,
          },
        ],
      };
    }

    case 's4-normal-v4': {
      const ordOk = clean.length === 4;
      const norm = analyzeNormality(g, clean);
      const passed = ordOk && norm.isNormal;
      return {
        passed,
        headline: passed
          ? 'Verified! V₄ ◁ S₄ constructed (S₄/V₄ ≅ S₃).'
          : 'Check that |H| = 4 and H is closed under conjugation in S₄.',
        checks: [
          { label: 'Valid subgroup H ≤ S₄', ok: true, detail: `|H| = ${clean.length}` },
          { label: 'Order equals 4', ok: ordOk, detail: `Got |H| = ${clean.length}` },
          {
            label: 'Normal in S₄ (H ◁ S₄)',
            ok: norm.isNormal,
            detail: norm.isNormal
              ? 'All 24 conjugations preserve H.'
              : `Conjugation fails at ${norm.failingElements[0]?.gLabel}.`,
          },
        ],
      };
    }

    case 's3-non-normal': {
      const cosets = analyzeCosets(g, clean);
      const idxOk = cosets.index === 3;
      const mismatchOk = !cosets.allLeftEqualRight;
      const passed = idxOk && mismatchOk;
      return {
        passed,
        headline: passed
          ? 'Verified! Left and right cosets disagree for your order-2 subgroup of S₃.'
          : 'Check index [S₃ : H] = 3 and non-equality of cosets.',
        checks: [
          { label: 'Index [S₃ : H] = 3', ok: idxOk, detail: `[S₃ : H] = ${cosets.index}` },
          {
            label: 'Left cosets ≠ Right cosets',
            ok: mismatchOk,
            detail: mismatchOk
              ? `Witness g = ${cosets.mismatchWitnesses[0]?.element}`
              : 'All left and right cosets match for this subgroup.',
          },
        ],
      };
    }

    case 'z2z6-non-cyclic-order4': {
      const ordOk = clean.length === 4;
      const maxElemOrder = Math.max(...clean.map((i) => g.orders[i]));
      const nonCyclicOk = ordOk && maxElemOrder < 4;
      const cls = classifyAbelianGroup({
        ...g,
        order: clean.length,
        elements: clean.map((i) => g.elements[i]),
        latexElements: clean.map((i) => g.latexElements[i]),
        orders: clean.map((i) => g.orders[i]),
        inverses: clean.map((i) => clean.indexOf(g.inverses[i])),
        identityIndex: clean.indexOf(g.identityIndex),
        table: clean.map((r) => clean.map((c) => clean.indexOf(g.table[r][c]))),
      });
      const v4Ok = ordOk && cls.invariantFactors.length === 2;
      const passed = ordOk && nonCyclicOk && v4Ok;
      return {
        passed,
        headline: passed
          ? 'Verified! {(0,0), (1,0), (0,3), (1,3)} ≅ ℤ₂ × ℤ₂.'
          : 'Make sure |H| = 4 and no element in H has order 4.',
        checks: [
          { label: 'Order equals 4', ok: ordOk, detail: `|H| = ${clean.length}` },
          {
            label: 'Non-cyclic (every non-identity element has order 2)',
            ok: nonCyclicOk,
            detail: nonCyclicOk
              ? 'Max element order in H is 2 (isomorphic to V₄).'
              : `Max element order in H is ${maxElemOrder}.`,
          },
        ],
      };
    }

    case 'a4-unique-normal': {
      const properOk = clean.length > 1 && clean.length < g.order;
      const norm = analyzeNormality(g, clean);
      const passed = properOk && norm.isNormal;
      return {
        passed,
        headline: passed
          ? 'Verified! V₄ is the unique proper non-trivial normal subgroup of A₄.'
          : 'Selection is either trivial/improper or not normal in A₄.',
        checks: [
          { label: 'Proper non-trivial (1 < |H| < 12)', ok: properOk, detail: `|H| = ${clean.length}` },
          {
            label: 'Normal in A₄ (H ◁ A₄)',
            ok: norm.isNormal,
            detail: norm.isNormal
              ? 'All 12 conjugations satisfy gHg⁻¹ = H.'
              : `Fails conjugation at g = ${norm.failingElements[0]?.gLabel}.`,
          },
        ],
      };
    }

    default:
      return { passed: false, headline: 'Unsupported challenge.', checks: [] };
  }
}
