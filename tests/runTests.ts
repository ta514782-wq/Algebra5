import assert from 'node:assert/strict';
import { calculateCentralizer } from '../src/core/centralizerEngine.ts';
import { calculateCentre } from '../src/core/centreEngine.ts';
import { classifyAbelianGroup } from '../src/core/classificationEngine.ts';
import { analyzeConjugacyClasses } from '../src/core/conjugacyEngine.ts';
import { analyzeCosets } from '../src/core/cosetEngine.ts';
import {
  computeDailyStreak,
  getLocalDateKey,
  selectDailyAlgebraChallenge,
} from '../src/core/dailyChallengeEngine.ts';
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
  resolveGroupById,
} from '../src/core/groupEngine.ts';
import { validateSubgroup, verifyGroupAxioms } from '../src/core/groupValidation.ts';
import { parseSubsetExpression } from '../src/core/expressionParser.ts';
import { analyzeHomomorphism, buildPresetHomomorphisms } from '../src/core/homomorphismEngine.ts';
import { analyzeCosetBlockConsistency, findGroupIsomorphism } from '../src/core/isomorphismEngine.ts';
import { getLabChallenges, gradeLabChallenge } from '../src/core/labChallenges.ts';
import { verifyLagrangeTheorem } from '../src/core/lagrangeEngine.ts';
import { buildSubgroupLattice } from '../src/core/latticeEngine.ts';
import { analyzeNormality } from '../src/core/normalityEngine.ts';
import { calculateNormalizer } from '../src/core/normalizerEngine.ts';
import { buildQuotientGroup } from '../src/core/quotientEngine.ts';
import { solveGroupProblem } from '../src/core/solverEngine.ts';
import { analyzeCayleyTheorem, analyzeSylowTheorems } from '../src/core/sylowAndCayleyEngine.ts';
import { buildVerifiedEngineTutorReply } from '../src/core/tutorEngineFallback.ts';
import { runLiveVerificationChecks } from '../src/core/verificationCertificate.ts';
import { ARTIFACT2_EXERCISES } from '../src/data/artifact2Exercises.ts';
import { LEARNING_TOPICS } from '../src/data/topics.ts';
import { getVerifiedQuestionBank } from '../src/data/questionBank.ts';
import { splitNotebookSegments } from '../src/components/MathFormula.tsx';
import { cayleyTableToLatex, solverSolutionToLatex } from '../src/utils/latexExport.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`PASS: ${name}`);
}

test('Group axioms hold for Z_6, D_4, S_3, S_4, A_4, Q_8, Z_2xZ_6', () => {
  const groups = [
    buildCyclicGroup(6),
    buildDihedralGroup(4),
    buildSymmetricGroup(3),
    buildSymmetricGroup(4),
    buildAlternatingGroup(4),
    buildQuaternionGroup(),
    buildDirectProductCyclic([2, 6]),
  ];
  for (const g of groups) {
    const report = verifyGroupAxioms(g);
    assert.equal(report.isValidGroup, true, `${g.name} must satisfy all group axioms`);
  }
});

test('Custom invalid group table is rejected with clear failure reason', () => {
  const bad = buildCustomGroup(
    'Bad3',
    ['e', 'a', 'b'],
    [
      ['e', 'a', 'b'],
      ['a', 'e', 'e'],
      ['b', 'b', 'a'],
    ]
  );
  assert.equal(bad.group, undefined);
  assert.ok(bad.error && bad.error.length > 10);
});

test('Subgroup validation rejects sets missing identity or closure', () => {
  const D4 = buildDihedralGroup(4);
  const rIdx = D4.elements.indexOf('r');
  const sIdx = D4.elements.indexOf('s');
  const badNoId = validateSubgroup(D4, [rIdx]);
  assert.equal(badNoId.isSubgroup, false);
  assert.equal(badNoId.hasIdentity, false);

  const badNotClosed = validateSubgroup(D4, [0, rIdx, sIdx]);
  assert.equal(badNotClosed.isSubgroup, false);
  assert.equal(badNotClosed.isClosed, false);
});

test('Left and right cosets partition S_3 and differ for non-normal H = {e, (1 2)}', () => {
  const S3 = buildSymmetricGroup(3);
  const H = generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]);
  const cosets = analyzeCosets(S3, H);
  assert.equal(cosets.valid, true);
  assert.equal(cosets.partitionVerified, true);
  assert.equal(cosets.index, 3);
  assert.equal(cosets.allLeftEqualRight, false);
  assert.ok(cosets.mismatchWitnesses.length > 0);
});

test("Lagrange's theorem verified and converse fails in A_4 for order 6", () => {
  const A4 = buildAlternatingGroup(4);
  const v4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => A4.elements.indexOf(l));
  const lag = verifyLagrangeTheorem(A4, v4, 6);
  assert.equal(lag.equationVerified, true);
  assert.equal(lag.index, 3);
  assert.equal(lag.converseSearch?.exhaustive, true);
  assert.equal(lag.converseSearch?.foundSubgroups.length, 0);

  const search3 = findSubgroupsOfOrder(A4, 3);
  assert.equal(search3.exhaustive, true);
  assert.equal(search3.subgroups.length, 4);
});

test('Normality, normalizer, centralizer, and centre calculations', () => {
  const D4 = buildDihedralGroup(4);
  const s = D4.elements.indexOf('s');
  const r2 = D4.elements.indexOf('r²');
  const r = D4.elements.indexOf('r');

  const H_s = generateSubgroupFromElements(D4, [s]);
  const normS = analyzeNormality(D4, H_s);
  assert.equal(normS.isNormal, false);

  const normalizerS = calculateNormalizer(D4, H_s);
  assert.equal(normalizerS.equalsG, false);
  assert.equal(normalizerS.normalizerOrder, 4);
  assert.equal(normalizerS.hContainedInNormalizer, true);

  const H_r = generateSubgroupFromElements(D4, [r]);
  const centR = calculateCentralizer(D4, H_r);
  assert.equal(centR.centralizerOrder, 4);

  const centreD4 = calculateCentre(D4);
  assert.equal(centreD4.centreOrder, 2);
  assert.deepEqual(centreD4.centreIndices, [0, r2]);
  assert.equal(centreD4.isNormalSubgroup, true);
});

test('Quotient group blocks non-normal H and builds valid D_4/<r^2> and S_4/V_4', () => {
  const S3 = buildSymmetricGroup(3);
  const H_bad = generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]);
  const blocked = buildQuotientGroup(S3, H_bad);
  assert.equal(blocked.canConstruct, false);
  assert.ok(blocked.wellDefinedCounterexample);

  const D4 = buildDihedralGroup(4);
  const H_r2 = generateSubgroupFromElements(D4, [D4.elements.indexOf('r²')]);
  const qD4 = buildQuotientGroup(D4, H_r2);
  assert.equal(qD4.canConstruct, true);
  assert.equal(qD4.quotientGroup?.order, 4);
  const clsD4 = classifyAbelianGroup(qD4.quotientGroup!);
  assert.deepEqual(clsD4.invariantFactors, [2, 2]);

  const S4 = buildSymmetricGroup(4);
  const v4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => S4.elements.indexOf(l));
  const qS4 = buildQuotientGroup(S4, v4);
  assert.equal(qS4.canConstruct, true);
  assert.equal(qS4.quotientGroup?.order, 6);
  assert.equal(qS4.quotientGroup?.isAbelian, false);
  const nonAbCls = classifyAbelianGroup(qS4.quotientGroup!);
  assert.equal(nonAbCls.isAbelian, false);
});

test('Conjugacy classes and Class Equation verified on S_3, D_4, A_4, Q_8', () => {
  const S3 = analyzeConjugacyClasses(buildSymmetricGroup(3));
  assert.equal(S3.partitionVerified, true);
  assert.equal(S3.classEquationString, '6 = 1 + 2 + 3');

  const D4 = analyzeConjugacyClasses(buildDihedralGroup(4));
  assert.equal(D4.classEquationString, '8 = 2 + 2 + 2 + 2');

  const A4 = analyzeConjugacyClasses(buildAlternatingGroup(4));
  assert.equal(A4.classEquationString, '12 = 1 + 3 + 4 + 4');

  const Q8 = analyzeConjugacyClasses(buildQuaternionGroup());
  assert.equal(Q8.classEquationString, '8 = 2 + 2 + 2 + 2');
});

test("Professor's Artifact 2 all 5 exercises verify live", () => {
  assert.equal(ARTIFACT2_EXERCISES.length, 5);
  for (const ex of ARTIFACT2_EXERCISES) {
    const res = ex.runLiveVerification();
    assert.equal(res.verified, true, `Artifact 2 Exercise ${ex.number} failed verification`);
  }
});

test('7 learning topics each have >= 5 solved examples', () => {
  assert.equal(LEARNING_TOPICS.length, 7);
  for (const t of LEARNING_TOPICS) {
    assert.ok(t.solvedExamples.length >= 5, `Topic ${t.id} needs >= 5 solved examples`);
  }
});

test('700-MCQ Bank has 100 unique verified questions per topic (700 total)', () => {
  const bank = getVerifiedQuestionBank();
  assert.equal(bank.length, 700, `Expected 700 MCQs, got ${bank.length}`);

  const topicCounts = new Map<string, number>();
  const promptSet = new Set<string>();

  for (const q of bank) {
    topicCounts.set(q.topicId, (topicCounts.get(q.topicId) ?? 0) + 1);
    assert.equal(promptSet.has(q.question), false, `Duplicate question: ${q.question}`);
    promptSet.add(q.question);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4, `Non-unique options in ${q.id}`);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
    assert.equal(q.verificationStatus, 'verified');
  }

  assert.equal(topicCounts.size, 7);
  for (const [topic, cnt] of topicCounts.entries()) {
    assert.equal(cnt, 100, `Topic ${topic} has ${cnt} questions instead of 100`);
  }
});

test('Subgroup lattice engine computes exact Hasse covering edges and normality counts', () => {
  const D4Lattice = buildSubgroupLattice(buildDihedralGroup(4));
  assert.equal(D4Lattice.exhaustive, true);
  assert.equal(D4Lattice.nodes.length, 10);
  // Normal subgroups of D_4: {e}, <r^2>, <r>, {e,r^2,s,r^2s}, {e,r^2,rs,r^3s}, D_4 (6 normal subgroups)
  assert.equal(D4Lattice.nodes.filter((n) => n.isNormal).length, 6);

  const S3Lattice = buildSubgroupLattice(buildSymmetricGroup(3));
  assert.equal(S3Lattice.nodes.length, 6);
  // Normal in S_3: {e}, A_3, S_3
  assert.equal(S3Lattice.nodes.filter((n) => n.isNormal).length, 3);
  // Covering edges in S_3: S_3 -> A_3 (1), S_3 -> 3 transpositions (3), A_3 -> {e} (1), 3 transpositions -> {e} (3) => 8 edges
  assert.equal(S3Lattice.edges.length, 8);

  const A4Lattice = buildSubgroupLattice(buildAlternatingGroup(4));
  assert.equal(A4Lattice.nodes.length, 10); // {e}, 3x C_2, 4x C_3, V_4, A_4
  assert.equal(A4Lattice.nodes.filter((n) => n.isNormal).length, 3); // {e}, V_4, A_4

  // Verify Hasse transitive reduction invariant: no edge A->B has an intermediate subgroup C
  for (const edge of D4Lattice.edges) {
    const src = D4Lattice.nodeMap[edge.sourceId];
    const tgt = D4Lattice.nodeMap[edge.targetId];
    assert.ok(src.order > tgt.order);
    const intermediateExists = src.descendantIds.some((midId) => {
      const mid = D4Lattice.nodeMap[midId];
      return mid.ancestorIds.includes(src.id) && mid.descendantIds.includes(tgt.id);
    });
    assert.equal(intermediateExists, false, `Redundant transitive edge ${edge.id}`);
  }
});

test('Explicit isomorphism proof verifies S_4/V_4 ≅ S_3 (36/36) and D_4/<r^2> ≅ Z_2 x Z_2 (16/16)', () => {
  const S4 = buildSymmetricGroup(4);
  const S3 = buildSymmetricGroup(3);
  const V4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => S4.elements.indexOf(l));
  const qS4 = buildQuotientGroup(S4, V4);
  assert.equal(qS4.canConstruct, true);
  const isoS4 = findGroupIsomorphism(qS4.quotientGroup!, S3);
  assert.equal(isoS4.isomorphic, true);
  assert.equal(isoS4.verifiedPairs, 36);
  assert.equal(isoS4.totalPairs, 36);

  const D4 = buildDihedralGroup(4);
  const H_r2 = generateSubgroupFromElements(D4, [D4.elements.indexOf('r²')]);
  const qD4 = buildQuotientGroup(D4, H_r2);
  const V4Model = buildDirectProductCyclic([2, 2]);
  const isoD4 = findGroupIsomorphism(qD4.quotientGroup!, V4Model);
  assert.equal(isoD4.isomorphic, true);
  assert.equal(isoD4.verifiedPairs, 16);
  assert.equal(isoD4.totalPairs, 16);
});

test('Coset-block consistency separates normal D_4/<r^2> from non-normal S_3/<(1 2)>', () => {
  const D4 = buildDihedralGroup(4);
  const H_r2 = generateSubgroupFromElements(D4, [D4.elements.indexOf('r²')]);
  const cosetD4 = analyzeCosets(D4, H_r2);
  const blockD4 = analyzeCosetBlockConsistency(D4, cosetD4.distinctLeftCosets);
  assert.equal(blockD4.allBlocksPure, true);
  assert.equal(blockD4.pureBlockCount, blockD4.totalBlockCount);

  const S3 = buildSymmetricGroup(3);
  const H_s3 = generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]);
  const cosetS3 = analyzeCosets(S3, H_s3);
  const blockS3 = analyzeCosetBlockConsistency(S3, cosetS3.distinctLeftCosets);
  assert.equal(blockS3.allBlocksPure, false);
  assert.ok(blockS3.pureBlockCount < blockS3.totalBlockCount);
});

test('Typed subgroup & generator expression parser resolves generators and explicit sets', () => {
  const D4 = buildDihedralGroup(4);
  const pD4 = parseSubsetExpression(D4, '⟨r^2⟩');
  assert.equal(pD4.error, undefined);
  assert.equal(pD4.isGenerator, true);
  assert.deepEqual(pD4.parsedLabels, ['e', 'r²']);

  const A4 = buildAlternatingGroup(4);
  const pA4 = parseSubsetExpression(A4, '⟨(1 2 3), (1 2)(3 4)⟩');
  assert.equal(pA4.error, undefined);
  assert.equal(pA4.indices.length, 12);

  const Z12 = buildCyclicGroup(12);
  const pZ12 = parseSubsetExpression(Z12, '{0, 4, 8}');
  assert.equal(pZ12.error, undefined);
  assert.equal(pZ12.isGenerator, false);
  assert.deepEqual(pZ12.parsedLabels, ['0', '4', '8']);
});

test('Live Verification Certificate passes all 10 verification suites', () => {
  const checks = runLiveVerificationChecks();
  assert.equal(checks.length, 10);
  for (const c of checks) {
    assert.equal(c.passed, true, `Verification check "${c.title}" failed: ${c.details}`);
  }
});

test('Homomorphism engine & First Isomorphism Theorem verify presets and catch counterexamples', () => {
  const presets = buildPresetHomomorphisms();
  for (const p of presets) {
    const res = analyzeHomomorphism(p.sourceGroup, p.targetGroup, p.mapArray);
    if (p.intendedFailure) {
      assert.equal(res.isHomomorphism, false, `${p.id} should fail homomorphism check`);
      assert.ok(res.counterexample, `${p.id} should provide explicit counterexample`);
    } else {
      assert.equal(res.isHomomorphism, true, `${p.id} should pass homomorphism check`);
      assert.equal(res.verifiedPairs, p.sourceGroup.order * p.sourceGroup.order);
      assert.equal(res.kernelNormal, true);
      assert.equal(res.firstIsoProof?.isomorphic, true, `First Iso Theorem failed for ${p.id}`);
    }
  }
});

test('Normalizer conjugate subgroup Orbit-Stabilizer partition matches [G : N_G(H)]', () => {
  const D4 = buildDihedralGroup(4);
  const H_s = generateSubgroupFromElements(D4, [D4.elements.indexOf('s')]);
  const normD4 = calculateNormalizer(D4, H_s);
  assert.equal(normD4.conjugateOrbitPartition.length, D4.order / normD4.normalizerOrder);
  assert.equal(normD4.conjugateOrbitPartition.length, 2);

  const S3 = buildSymmetricGroup(3);
  const H_12 = generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]);
  const normS3 = calculateNormalizer(S3, H_12);
  assert.equal(normS3.conjugateOrbitPartition.length, S3.order / normS3.normalizerOrder);
  assert.equal(normS3.conjugateOrbitPartition.length, 3);
});

test('Lab challenges grade valid and invalid constructions accurately', () => {
  const challenges = getLabChallenges();
  assert.equal(challenges.length, 6);

  // Challenge 1: non-normal order-2 in D4
  const d4 = challenges[0].group;
  assert.equal(gradeLabChallenge('d4-non-normal-order2', [0, d4.elements.indexOf('s')]).passed, true);
  assert.equal(gradeLabChallenge('d4-non-normal-order2', [0, d4.elements.indexOf('r²')]).passed, false);

  // Challenge 3: normal V4 in S4
  const s4 = challenges[2].group;
  const v4Idx = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => s4.elements.indexOf(l));
  assert.equal(gradeLabChallenge('s4-normal-v4', v4Idx).passed, true);

  // Challenge 5: non-cyclic order-4 in Z2 x Z6
  const z2z6 = challenges[4].group;
  const nonCyc = ['(0,0)', '(1,0)', '(0,3)', '(1,3)'].map((l) => z2z6.elements.indexOf(l));
  assert.equal(gradeLabChallenge('z2z6-non-cyclic-order4', nonCyc).passed, true);
});

test('URL group resolution and LaTeX export utilities produce valid output', () => {
  assert.equal(resolveGroupById('D_4')?.order, 8);
  assert.equal(resolveGroupById('Z2xZ6')?.order, 12);
  assert.equal(resolveGroupById('Q_8')?.order, 8);
  assert.equal(resolveGroupById('S_4')?.order, 24);

  const S3 = buildSymmetricGroup(3);
  const latexTable = cayleyTableToLatex(S3);
  assert.ok(latexTable.includes('\\begin{array}'));
  assert.ok(latexTable.includes('\\end{array}'));

  const sol = solveGroupProblem('centre', S3, [0]);
  const latexSol = solverSolutionToLatex(sol);
  assert.ok(latexSol.includes('\\begin{enumerate}'));
});

test('Sylow Theorems & Cayley Regular Embedding verify on A_4, S_3, D_4', () => {
  const A4 = buildAlternatingGroup(4);
  const sylowA4 = analyzeSylowTheorems(A4);
  const rep2 = sylowA4.reports.find((r) => r.prime === 2)!;
  const rep3 = sylowA4.reports.find((r) => r.prime === 3)!;
  assert.equal(rep2.npCount, 1);
  assert.equal(rep2.isUniqueNormal, true);
  assert.equal(rep3.npCount, 4);
  assert.equal(rep3.congruenceModPOk, true);
  assert.equal(rep3.dividesCofactorOk, true);
  assert.equal(rep3.allConjugateVerified, true);

  const S3 = buildSymmetricGroup(3);
  const sylowS3 = analyzeSylowTheorems(S3);
  assert.equal(sylowS3.reports.find((r) => r.prime === 2)!.npCount, 3);
  assert.equal(sylowS3.reports.find((r) => r.prime === 3)!.npCount, 1);

  const D4 = buildDihedralGroup(4);
  const cayleyD4 = analyzeCayleyTheorem(D4);
  assert.equal(cayleyD4.isInjective, true);
  assert.equal(cayleyD4.verifiedHomomorphismPairs, 64);
});

test('Daily Algebra Challenge selects unique, deterministically random daily questions and tracks streaks', () => {
  const bank = getVerifiedQuestionBank();

  // Same calendar day at different hours gives identical challenge
  const morning = new Date(2026, 10, 23, 8, 15, 0);
  const evening = new Date(2026, 10, 23, 22, 45, 0);
  const pickMorning = selectDailyAlgebraChallenge(bank, morning);
  const pickEvening = selectDailyAlgebraChallenge(bank, evening);
  assert.equal(pickMorning.dateKey, '2026-11-23');
  assert.equal(pickMorning.question.id, pickEvening.question.id);

  // Full cycle (bank.length consecutive days) yields strictly unique questions across multiple topics & difficulties
  const seenIds = new Set<string>();
  const seenTopics = new Set<string>();
  const seenDifficulties = new Set<string>();
  for (let offset = 0; offset < bank.length; offset++) {
    const d = new Date(2026, 0, 1 + offset, 12, 0, 0);
    const pick = selectDailyAlgebraChallenge(bank, d);
    seenIds.add(pick.question.id);
    if (offset < 30) {
      seenTopics.add(pick.question.topicId);
      seenDifficulties.add(pick.question.difficulty);
    }
  }
  assert.equal(seenIds.size, bank.length);
  assert.ok(seenTopics.size >= 5, `Expected multi-topic variety in first 30 days, got ${seenTopics.size}`);
  assert.equal(seenDifficulties.size, 3, 'Expected all 3 difficulty tiers within first 30 days');

  // 365 consecutive days starting from 2026-11-23 also produce 365 strictly unique questions
  const yearWindow = new Set<string>();
  for (let offset = 0; offset < 365; offset++) {
    const d = new Date(2026, 10, 23 + offset, 12, 0, 0);
    yearWindow.add(selectDailyAlgebraChallenge(bank, d).question.id);
  }
  assert.equal(yearWindow.size, 365);

  // Streak calculation counts consecutive calendar days
  const today = new Date(2026, 10, 23, 10, 0, 0);
  const d1 = getLocalDateKey(new Date(2026, 10, 21, 10, 0, 0));
  const d2 = getLocalDateKey(new Date(2026, 10, 22, 10, 0, 0));
  const d3 = getLocalDateKey(today);
  const streak = computeDailyStreak(
    {
      [d1]: { dateKey: d1, questionId: 'q1', selectedIndex: 0, isCorrect: true, submittedAt: '' },
      [d2]: { dateKey: d2, questionId: 'q2', selectedIndex: 1, isCorrect: false, submittedAt: '' },
      [d3]: { dateKey: d3, questionId: 'q3', selectedIndex: 2, isCorrect: true, submittedAt: '' },
    },
    today
  );
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.totalCompleted, 3);
  assert.equal(streak.totalCorrect, 2);
});

test('MathText word boundaries and verified deterministic tutor fallback answers work cleanly', () => {
  const segs1 = splitNotebookSegments('centralizers, quotient groups, with selection {e, r^2}, and no subgroup of order 6');
  const mathValues = segs1.filter((s) => s.kind === 'math').map((s) => s.value);
  assert.equal(mathValues.includes('g'), false);
  assert.equal(mathValues.includes('s'), false);

  const D4 = buildDihedralGroup(4);
  const r2 = D4.elements.indexOf('r²');
  const sub = generateSubgroupFromElements(D4, [r2]);

  const a4Reply = buildVerifiedEngineTutorReply(
    'Explain why A₄ has no subgroup of order 6',
    'Lagrange’s Theorem',
    'proof',
    D4,
    sub
  );
  assert.ok(a4Reply.includes('0') && a4Reply.includes('3-cycle'));

  const d4Reply = buildVerifiedEngineTutorReply(
    'Why is D₄/⟨r²⟩ isomorphic to V₄?',
    'Quotient Groups',
    'standard',
    D4,
    sub
  );
  assert.ok(d4Reply.includes('16/16'));

  const normCentReply = buildVerifiedEngineTutorReply(
    'Contrast normalizer N_G(H) vs centralizer C_G(H)',
    'Normalizer & Centralizer',
    'standard',
    D4,
    sub
  );
  assert.ok(normCentReply.includes('Normalizer') && normCentReply.includes('Centralizer') && normCentReply.includes('C_{'));
});

console.log(`\nALL ${passed} TEST SUITES PASSED!`);
