import { ARTIFACT2_EXERCISES } from '../data/artifact2Exercises.ts';
import { getVerifiedQuestionBank } from '../data/questionBank.ts';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { calculateCentre } from './centreEngine.ts';
import { classifyAbelianGroup } from './classificationEngine.ts';
import { analyzeConjugacyClasses } from './conjugacyEngine.ts';
import { analyzeCosets } from './cosetEngine.ts';
import {
  buildAlternatingGroup,
  buildCustomGroup,
  buildCyclicGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildQuaternionGroup,
  buildSymmetricGroup,
  findSubgroupsOfOrder,
  generateSubgroupFromElements,
} from './groupEngine.ts';
import { validateSubgroup, verifyGroupAxioms } from './groupValidation.ts';
import { analyzeCosetBlockConsistency, findGroupIsomorphism } from './isomorphismEngine.ts';
import { verifyLagrangeTheorem } from './lagrangeEngine.ts';
import { buildSubgroupLattice } from './latticeEngine.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { calculateNormalizer } from './normalizerEngine.ts';
import { buildQuotientGroup } from './quotientEngine.ts';

export interface VerificationCheckItem {
  id: string;
  title: string;
  passed: boolean;
  details: string;
}

export function runLiveVerificationChecks(): VerificationCheckItem[] {
  const checks: VerificationCheckItem[] = [];

  // 1. Group Axioms
  const groups = [
    buildCyclicGroup(6),
    buildDihedralGroup(4),
    buildSymmetricGroup(3),
    buildSymmetricGroup(4),
    buildAlternatingGroup(4),
    buildQuaternionGroup(),
    buildDirectProductCyclic([2, 6]),
  ];
  const axiomsOk = groups.every((g) => verifyGroupAxioms(g).isValidGroup);
  checks.push({
    id: 'axioms',
    title: 'Group Axiom Verification (Closure, Associativity, Identity, Inverses)',
    passed: axiomsOk,
    details: `Verified across ${groups.map((g) => g.name).join(', ')}.`,
  });

  // 2. Invalid Group Rejection
  const badGroup = buildCustomGroup(
    'Invalid',
    ['e', 'a', 'b'],
    [
      ['e', 'a', 'b'],
      ['a', 'e', 'e'],
      ['b', 'b', 'a'],
    ]
  );
  checks.push({
    id: 'invalid-group',
    title: 'Invalid Cayley Table Rejection Guard',
    passed: !badGroup.group && Boolean(badGroup.error),
    details: badGroup.error || 'Rejected invalid multiplication table.',
  });

  // 3. Subgroup Validation & Coset Partition
  const S3 = buildSymmetricGroup(3);
  const badSub = validateSubgroup(S3, [S3.elements.indexOf('(1 2)')]);
  const H_s3 = generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]);
  const cosetS3 = analyzeCosets(S3, H_s3);
  const blockS3 = analyzeCosetBlockConsistency(S3, cosetS3.distinctLeftCosets);
  checks.push({
    id: 'cosets',
    title: 'Subgroup Validation, Coset Partition & Non-Normal Block Fracture',
    passed: !badSub.isSubgroup && cosetS3.partitionVerified && !cosetS3.allLeftEqualRight && !blockS3.allBlocksPure,
    details: `S₃ / ⟨(1 2)⟩ partitions into 3 cosets with ${cosetS3.mismatchWitnesses.length} mismatch witnesses and fractured Cayley blocks (${blockS3.pureBlockCount}/${blockS3.totalBlockCount} pure).`,
  });

  // 4. Lagrange & A_4 Converse Counterexample
  const A4 = buildAlternatingGroup(4);
  const search6 = findSubgroupsOfOrder(A4, 6);
  const lag = verifyLagrangeTheorem(A4, [0], 6);
  checks.push({
    id: 'lagrange',
    title: "Lagrange's Theorem & A₄ Converse Counterexample (Order 6)",
    passed: lag.equationVerified && search6.exhaustive && search6.subgroups.length === 0,
    details: 'Exhaustive verified lattice search confirms 0 subgroups of order 6 in A₄ (|A₄| = 12).',
  });

  // 5. Normality, Normalizer, Centre
  const D4 = buildDihedralGroup(4);
  const Hs = generateSubgroupFromElements(D4, [D4.elements.indexOf('s')]);
  const normS = analyzeNormality(D4, Hs);
  const normalizerS = calculateNormalizer(D4, Hs);
  const centreD4 = calculateCentre(D4);
  checks.push({
    id: 'normalizer',
    title: 'Normality, Proper Normalizer & Centre Separation',
    passed: !normS.isNormal && !normalizerS.equalsG && normalizerS.normalizerOrder === 4 && centreD4.centreOrder === 2,
    details: `In D₄: |N_{D₄}(⟨s⟩)| = ${normalizerS.normalizerOrder} < 8 and |Z(D₄)| = ${centreD4.centreOrder}.`,
  });

  // 6. Quotient Blocker & Explicit S4/V4 ≅ S3 Isomorphism Proof
  const blockedQ = buildQuotientGroup(S3, H_s3);
  const S4 = buildSymmetricGroup(4);
  const V4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => S4.elements.indexOf(l));
  const qS4 = buildQuotientGroup(S4, V4);
  const isoS4S3 = qS4.quotientGroup ? findGroupIsomorphism(qS4.quotientGroup, S3) : null;
  const nonAbGuard = qS4.quotientGroup ? classifyAbelianGroup(qS4.quotientGroup) : null;
  checks.push({
    id: 'quotient-iso',
    title: 'Quotient Safety Blocker, FTFGAG Guard & S₄/V₄ ≅ S₃ Proof',
    passed:
      !blockedQ.canConstruct &&
      Boolean(blockedQ.wellDefinedCounterexample) &&
      Boolean(isoS4S3?.isomorphic) &&
      isoS4S3?.verifiedPairs === 36 &&
      nonAbGuard?.isAbelian === false,
    details: `Non-normal S₃/⟨(1 2)⟩ blocked; S₄/V₄ ≅ S₃ verified across ${isoS4S3?.verifiedPairs ?? 0}/36 multiplication pairs.`,
  });

  // 7. Conjugacy Classes & Class Equations
  const eqS3 = analyzeConjugacyClasses(S3).classEquationString;
  const eqD4 = analyzeConjugacyClasses(D4).classEquationString;
  const eqA4 = analyzeConjugacyClasses(A4).classEquationString;
  checks.push({
    id: 'conjugacy',
    title: 'Conjugacy Classes & Class Equations',
    passed: eqS3 === '6 = 1 + 2 + 3' && eqD4 === '8 = 2 + 2 + 2 + 2' && eqA4 === '12 = 1 + 3 + 4 + 4',
    details: `S₃ (${eqS3}), D₄ (${eqD4}), A₄ (${eqA4}).`,
  });

  // 8. D3 Subgroup Lattice Hasse Reduction
  const latD4 = buildSubgroupLattice(D4);
  const latA4 = buildSubgroupLattice(A4);
  checks.push({
    id: 'lattice',
    title: 'Subgroup Lattice Hasse Reduction & Normality Counts',
    passed:
      latD4.nodes.length === 10 &&
      latD4.nodes.filter((n) => n.isNormal).length === 6 &&
      latA4.nodes.length === 10 &&
      latA4.nodes.filter((n) => n.isNormal).length === 3,
    details: `D₄: 10 subgroups (6 normal); A₄: 10 subgroups (3 normal).`,
  });

  // 9. Artifact 2 All 5 Exercises
  const a2Ok = ARTIFACT2_EXERCISES.every((ex) => ex.runLiveVerification().verified);
  checks.push({
    id: 'artifact2',
    title: "Professor's Artifact 2 — All 5 Guided Exercises",
    passed: a2Ok,
    details: 'D₄/⟨r²⟩ ≅ ℤ₂ × ℤ₂, S₄/V₄ ≅ S₃, N_{D₄}(⟨s⟩) ≠ D₄, A₄ order-6 failure, (ℤ₂ × ℤ₆)/⟨(1,2)⟩ ≅ ℤ₂.',
  });

  // 10. Curriculum Topics & Verified Practice Problem Vault
  const bank = getVerifiedQuestionBank();
  const topicsOk = LEARNING_TOPICS.length === 7 && LEARNING_TOPICS.every((t) => t.solvedExamples.length >= 5);
  checks.push({
    id: 'curriculum-mcq',
    title: '7 Curriculum Topics & Engine-Verified Practice Vault',
    passed: topicsOk && bank.length === 700 && bank.every((q) => q.verificationStatus === 'verified'),
    details: `${LEARNING_TOPICS.length} curriculum topics with ≥5 solved examples each; multi-tier Practice Problem Vault verified against the finite group engine.`,
  });

  return checks;
}
