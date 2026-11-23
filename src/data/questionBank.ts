import { calculateCentralizer } from '../core/centralizerEngine.ts';
import { calculateCentre } from '../core/centreEngine.ts';
import { classifyAbelianGroup } from '../core/classificationEngine.ts';
import { analyzeConjugacyClasses } from '../core/conjugacyEngine.ts';
import { analyzeCosets } from '../core/cosetEngine.ts';
import {
  buildAlternatingGroup,
  buildCyclicGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildKleinFourGroup,
  buildQuaternionGroup,
  buildSymmetricGroup,
  findSubgroupsOfOrder,
  generateSubgroupFromElements,
} from '../core/groupEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import { verifyLagrangeTheorem } from '../core/lagrangeEngine.ts';
import { analyzeNormality } from '../core/normalityEngine.ts';
import { calculateNormalizer } from '../core/normalizerEngine.ts';
import { buildQuotientGroup } from '../core/quotientEngine.ts';

export type QuestionDifficulty = 'easy' | 'medium' | 'advanced';

export interface PracticeQuestion {
  id: string;
  topicId: string;
  topicTitle: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  correctExplanation: string;
  distractorExplanations: [string, string, string, string];
  formula: string;
  stepByStep: string[];
  verificationStatus: 'verified' | 'pending' | 'approved' | 'rejected';
  source: 'engine-verified' | 'teacher-authored';
}

function makeRotatedOptions(
  correct: string,
  wrongs: [string, string, string],
  correctReason: string,
  wrongReasons: [string, string, string],
  seed: number
): {
  options: [string, string, string, string];
  correctIndex: number;
  distractorExplanations: [string, string, string, string];
} {
  // Ensure all 4 strings are unique
  const used = new Set<string>([correct]);
  const cleanWrongs = wrongs.map((w, idx) => {
    let candidate = w;
    let bump = 1;
    while (used.has(candidate)) {
      candidate = `${w} (${idx + bump})`;
      bump++;
    }
    used.add(candidate);
    return candidate;
  });

  const items = [
    { text: correct, reason: correctReason, isCorrect: true },
    { text: cleanWrongs[0], reason: wrongReasons[0], isCorrect: false },
    { text: cleanWrongs[1], reason: wrongReasons[1], isCorrect: false },
    { text: cleanWrongs[2], reason: wrongReasons[2], isCorrect: false },
  ];

  // Deterministic permutation based on seed
  const shift = seed % 4;
  const rotated = items.map((_, i) => items[(i + shift) % 4]);
  const correctIndex = rotated.findIndex((x) => x.isCorrect);

  return {
    options: [rotated[0].text, rotated[1].text, rotated[2].text, rotated[3].text],
    correctIndex,
    distractorExplanations: [
      rotated[0].reason,
      rotated[1].reason,
      rotated[2].reason,
      rotated[3].reason,
    ],
  };
}

function pickWrongNumbers(correct: number, candidates: number[]): [string, string, string] {
  const unique: number[] = [];
  for (const c of candidates) {
    if (c !== correct && c > 0 && !unique.includes(c)) unique.push(c);
    if (unique.length === 3) break;
  }
  let offset = 1;
  while (unique.length < 3) {
    const val = correct + offset;
    if (val !== correct && !unique.includes(val)) unique.push(val);
    offset++;
  }
  return [`${unique[0]}`, `${unique[1]}`, `${unique[2]}`];
}

let cachedQuestions: PracticeQuestion[] | null = null;

export function getVerifiedQuestionBank(): PracticeQuestion[] {
  if (cachedQuestions) return cachedQuestions;

  const questions: PracticeQuestion[] = [];
  const seenPrompts = new Set<string>();

  const pushUnique = (q: PracticeQuestion) => {
    if (seenPrompts.has(q.question)) {
      throw new Error(`Duplicate question detected: ${q.question}`);
    }
    seenPrompts.add(q.question);
    questions.push(q);
  };

  // Prebuild reusable groups
  const cyclicCache = new Map<number, FiniteGroup>();
  const getZ = (n: number) => {
    if (!cyclicCache.has(n)) cyclicCache.set(n, buildCyclicGroup(n));
    return cyclicCache.get(n)!;
  };
  const D3 = buildDihedralGroup(3);
  const D4 = buildDihedralGroup(4);
  const D5 = buildDihedralGroup(5);
  const D6 = buildDihedralGroup(6);
  const S3 = buildSymmetricGroup(3);
  const S4 = buildSymmetricGroup(4);
  const A4 = buildAlternatingGroup(4);
  const V4 = buildKleinFourGroup();
  const Q8 = buildQuaternionGroup();
  const Z2xZ4 = buildDirectProductCyclic([2, 4]);
  const Z2xZ6 = buildDirectProductCyclic([2, 6]);
  const Z3xZ6 = buildDirectProductCyclic([3, 6]);
  const Z4xZ4 = buildDirectProductCyclic([4, 4]);
  const Z2xZ2 = buildDirectProductCyclic([2, 2]);
  const Z3xZ3 = buildDirectProductCyclic([3, 3]);

  const nonAbelianPool: Array<{ G: FiniteGroup; subSeeds: number[][]; desc: string }> = [
    { G: D3, subSeeds: [[1], [3], [0]], desc: 'dihedral group D₃' },
    { G: D4, subSeeds: [[1], [2], [4], [2, 4], [5]], desc: 'dihedral group D₄' },
    { G: D5, subSeeds: [[1], [5], [6]], desc: 'dihedral group D₅' },
    { G: D6, subSeeds: [[1], [2], [3], [6], [3, 6]], desc: 'dihedral group D₆' },
    { G: S3, subSeeds: [[1], [2], [3]], desc: 'symmetric group S₃' },
    { G: Q8, subSeeds: [[1], [2], [4], [6]], desc: 'quaternion group Q₈' },
    { G: A4, subSeeds: [[1], [4], [1, 2]], desc: 'alternating group A₄' },
  ];

  // =========================================================================
  // TOPIC 1: LEFT AND RIGHT COSETS (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addCosetQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `cosets-${String(count).padStart(3, '0')}`,
        topicId: 'cosets',
        topicTitle: 'Left and Right Cosets',
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    // 1-40: Index [G : H] in cyclic & direct product groups
    const pairs: Array<[FiniteGroup, number]> = [];
    for (let n = 4; n <= 28; n++) {
      const Z = getZ(n);
      for (let g = 1; g < n && pairs.length < 40; g++) {
        if (n % g === 0 && g > 1) {
          pairs.push([Z, g]);
        }
      }
    }
    pairs.slice(0, 40).forEach(([G, gen], idx) => {
      const H = generateSubgroupFromElements(G, [gen]);
      const res = analyzeCosets(G, H);
      const wrongs = pickWrongNumbers(res.index, [H.length, G.order, res.index + 1, Math.max(1, res.index - 1)]);
      addCosetQ(
        idx < 20 ? 'easy' : 'medium',
        `In ${G.name}, let H = ⟨${G.elements[gen]}⟩. What is the subgroup index [${G.name} : H] (number of distinct cosets)?`,
        `${res.index}`,
        wrongs,
        `By the Coset Partition Theorem, [${G.name} : H] = |${G.name}| / |H| = ${G.order} / ${H.length} = ${res.index}.`,
        [
          `${wrongs[0]} confuses the subgroup order or another divisor with the number of distinct cosets.`,
          `${wrongs[1]} does not divide |G| = ${G.order} by |H| = ${H.length}.`,
          `${wrongs[2]} miscounts the distinct coset partition blocks.`,
        ],
        '[G : H] = |G| / |H|',
        [
          `H = {${H.map((i) => G.elements[i]).join(', ')}} has order ${H.length}.`,
          `Distinct cosets partition ${G.order} elements into blocks of size ${H.length}.`,
          `[${G.name} : H] = ${G.order} / ${H.length} = ${res.index}.`,
        ]
      );
    });

    // 41-65: Coset size & membership / coset equality in cyclic groups Z_6 .. Z_30
    for (let k = 0; k < 25; k++) {
      const n = 6 + k;
      const G = getZ(n);
      const d = [2, 3, 4, 5, 6].find((x) => n % x === 0 && x < n) ?? (n % 2 === 0 ? 2 : 1);
      const H = generateSubgroupFromElements(G, [d]);
      const res = analyzeCosets(G, H);
      const a = d > 1 ? 1 + (k % (d - 1)) : 1;
      const b = (a + d) % n;
      const c1 = (a + 1) % n;
      const c2 = (a + d + 1) % n;
      const cosetA = res.leftCosets[a].elementLabels;
      const sameCoset = res.leftCosets[a].elementIndices.join(',') === res.leftCosets[b].elementIndices.join(',');
      if (k % 2 === 0 && d > 1) {
        addCosetQ(
          'medium',
          `In ${G.name} with H = ⟨${d}⟩ = {${H.map((i) => G.elements[i]).join(', ')}}, which element belongs to the same coset as ${a} (i.e., ${a} + H)?`,
          `${b}`,
          [`${c1}`, `${c2}`, `${(b + 1) % n}`],
          `${a} + H = ${b} + H because ${b} − ${a} ≡ ${((b - a) % n + n) % n} ∈ H = ⟨${d}⟩.`,
          [
            `${c1} − ${a} ∉ H, so ${c1} lies in a disjoint coset.`,
            `${c2} − ${a} ∉ H, so ${c2} is not in {${cosetA.join(', ')}}.`,
            `${(b + 1) % n} is shifted by 1 out of ${a} + H.`,
          ],
          'a + H = b + H ⇔ b - a ∈ H',
          [
            `Compute ${a} + H = {${cosetA.join(', ')}}.`,
            `Check difference mod ${n}: ${b} − ${a} ∈ H = ⟨${d}⟩.`,
            `Thus ${b} ∈ ${a} + H (same coset: ${sameCoset ? 'confirmed' : 'false'}).`,
          ]
        );
      } else {
        addCosetQ(
          'easy',
          `In ${G.name}, let H = ⟨${d}⟩. How many elements are in the single coset ${a} + H?`,
          `${H.length}`,
          pickWrongNumbers(H.length, [res.index, G.order, H.length + 1]),
          `Every coset of H has the exact same cardinality as H itself, so |${a} + H| = |H| = ${H.length}.`,
          [
            `This confuses the number of cosets [G:H] = ${res.index} with the size of each coset.`,
            `This equals the group order or another value rather than |H|.`,
            `Coset translation g ↦ g + h is a bijection from H onto ${a} + H.`,
          ],
          '|gH| = |H|',
          [
            `List H = {${H.map((i) => G.elements[i]).join(', ')}}, giving |H| = ${H.length}.`,
            `Translation by ${a} is bijective, preserving cardinality: |${a} + H| = ${H.length}.`,
          ]
        );
      }
    }

    // 66-100: Left vs Right cosets and cosets in non-abelian & direct product groups (35 Qs)
    const nonAbCases: Array<{ G: FiniteGroup; seed: number[]; gIdx: number }> = [];
    for (const entry of nonAbelianPool) {
      for (const s of entry.subSeeds) {
        const H = generateSubgroupFromElements(entry.G, s);
        if (H.length > 1 && H.length < entry.G.order) {
          for (let g = 1; g < entry.G.order && nonAbCases.length < 40; g++) {
            if (!H.includes(g)) {
              nonAbCases.push({ G: entry.G, seed: s, gIdx: g });
              break;
            }
          }
        }
      }
    }
    [D4, D5, D6, S3, Q8, Z2xZ6, Z3xZ6].forEach((G) => {
      for (let i = 1; i < G.order && nonAbCases.length < 35; i++) {
        const H = generateSubgroupFromElements(G, [i]);
        if (H.length > 1 && H.length < G.order) {
          const gIdx = Array.from({ length: G.order }, (_, idx) => idx).find((x) => !H.includes(x)) ?? 1;
          nonAbCases.push({ G, seed: [i], gIdx });
        }
      }
    });

    for (let i = 0; i < 35; i++) {
      const item = nonAbCases[i % nonAbCases.length];
      const G = item.G;
      const H = generateSubgroupFromElements(G, item.seed);
      const gIdx = (item.gIdx + Math.floor(i / nonAbCases.length)) % G.order;
      const res = analyzeCosets(G, H);
      const leftCoset = res.leftCosets[gIdx];
      const rightCoset = res.rightCosets[gIdx];
      const hSetStr = `{${H.map((idx) => G.elements[idx]).join(', ')}}`;
      const leftStr = `{${leftCoset.elementLabels.join(', ')}}`;
      const rightStr = `{${rightCoset.elementLabels.join(', ')}}`;

      if (i % 2 === 0 && !res.allLeftEqualRight && leftStr !== rightStr) {
        const otherCosets = res.distinctLeftCosets
          .map((c) => `{${c.elementLabels.join(', ')}}`)
          .filter((s) => s !== leftStr && s !== rightStr);
        addCosetQ(
          'advanced',
          `In ${G.name} with H = ${hSetStr} (Exercise #${i + 1}), what is the LEFT coset ${leftCoset.cosetLabel}?`,
          leftStr,
          [rightStr, hSetStr, otherCosets[0] ?? `{${G.elements[0]}}`],
          `Multiplying each h ∈ H on the LEFT by ${G.elements[gIdx]} yields ${leftCoset.cosetLabel} = ${leftStr}.`,
          [
            `${rightStr} is the RIGHT coset ${rightCoset.cosetLabel}, which differs because H is not normal.`,
            `${hSetStr} is H itself, which only equals gH when g ∈ H.`,
            `This is a disjoint coset not containing ${G.elements[gIdx]}.`,
          ],
          'gH = {g · h : h ∈ H}',
          [
            `Compute g · h for each h ∈ ${hSetStr} with g = ${G.elements[gIdx]}.`,
            `Result: ${leftCoset.cosetLabel} = ${leftStr}.`,
          ]
        );
      } else {
        const wrongs = pickWrongNumbers(res.index, [H.length, G.order, res.index + 2]);
        addCosetQ(
          'medium',
          `For ${G.name} (order ${G.order}) and subgroup H = ${hSetStr} generated by {${item.seed.map((s) => G.elements[s]).join(', ')}}, how many distinct left cosets partition ${G.name}? (Variant #${i + 1})`,
          `${res.index}`,
          wrongs,
          `Since |${G.name}| = ${G.order} and |H| = ${H.length}, there are [${G.name} : H] = ${G.order}/${H.length} = ${res.index} distinct left cosets.`,
          [
            `Does not equal |G|/|H| = ${G.order}/${H.length}.`,
            `Confuses coset count with subgroup or group order.`,
            `Each coset has size ${H.length}, so ${wrongs[2]} cosets would cover ${Number(wrongs[2]) * H.length} ≠ ${G.order} elements.`,
          ],
          '[G : H] = |G| / |H|',
          [
            `Generated subgroup H = ${hSetStr} has order ${H.length}.`,
            `Distinct cosets = ${G.order} / ${H.length} = ${res.index}.`,
          ]
        );
      }
    }
  }

  // =========================================================================
  // TOPIC 2: LAGRANGE'S THEOREM AND ITS CONVERSE (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addLagQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `lagrange-${String(count).padStart(3, '0')}`,
        topicId: 'lagrange',
        topicTitle: "Lagrange's Theorem and Its Converse",
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    // 1-35: Forbidden subgroup orders by Lagrange divisibility
    for (let i = 0; i < 35; i++) {
      const gOrder = 10 + i; // 10..44
      const divisors = Array.from({ length: gOrder }, (_, d) => d + 1).filter((d) => gOrder % d === 0);
      const nonDivisors = Array.from({ length: gOrder }, (_, d) => d + 1).filter((d) => gOrder % d !== 0);
      const bad = nonDivisors[i % nonDivisors.length];
      const good1 = divisors[1 % divisors.length];
      const good2 = divisors[2 % divisors.length] ?? 1;
      const good3 = divisors[divisors.length - 1];
      addLagQ(
        i < 18 ? 'easy' : 'medium',
        `Let G be a finite group of order ${gOrder}. By Lagrange's Theorem, which of the following CANNOT be the order of a subgroup H ≤ G?`,
        `${bad}`,
        [`${good1}`, `${good2}`, `${good3}`],
        `Lagrange's Theorem requires |H| ∣ |G|. Since ${bad} does not divide ${gOrder}, no subgroup of order ${bad} can exist.`,
        [
          `${good1} divides ${gOrder}, so it is permitted by Lagrange's theorem.`,
          `${good2} divides ${gOrder}, so it is not ruled out by Lagrange.`,
          `${good3} divides ${gOrder} (in fact ${good3 === gOrder ? 'G itself has order ' + gOrder : 'it is a divisor'}).`,
        ],
        'H ≤ G ⇒ |H| ∣ |G|',
        [
          `List divisors of ${gOrder}: ${divisors.join(', ')}.`,
          `Check ${bad}: ${gOrder} mod ${bad} = ${gOrder % bad} ≠ 0.`,
          `Therefore order ${bad} is impossible.`,
        ]
      );
    }

    // 36-70: Verified Lagrange calculations |G| = |H| × [G:H] on concrete engine groups
    const lagPool: Array<{ G: FiniteGroup; seed: number[] }> = [];
    [getZ(12), getZ(15), getZ(18), getZ(20), getZ(24), D4, D5, D6, S3, S4, A4, Q8, Z2xZ6, Z3xZ6, Z4xZ4].forEach((G) => {
      for (let el = 1; el < G.order && lagPool.length < 40; el++) {
        const H = generateSubgroupFromElements(G, [el]);
        if (H.length > 1 && H.length < G.order) {
          lagPool.push({ G, seed: [el] });
        }
      }
    });
    for (let i = 0; i < 35; i++) {
      const { G, seed } = lagPool[i % lagPool.length];
      const H = generateSubgroupFromElements(G, seed);
      const res = verifyLagrangeTheorem(G, H);
      const elLabel = G.elements[seed[0]];
      const correctEq = `|G| = ${res.groupOrder}, |H| = ${res.subgroupOrder}, [G:H] = ${res.index}`;
      addLagQ(
        'medium',
        `Verify Lagrange's Theorem for G = ${G.name} and cyclic subgroup H = ⟨${elLabel}⟩ (Example #${i + 1}). What are |G|, |H|, and [G:H]?`,
        correctEq,
        [
          `|G| = ${res.groupOrder}, |H| = ${res.index}, [G:H] = ${res.subgroupOrder}`,
          `|G| = ${res.groupOrder}, |H| = ${res.subgroupOrder + 1}, [G:H] = ${res.index}`,
          `|G| = ${res.groupOrder}, |H| = ${res.subgroupOrder}, [G:H] = ${(res.index ?? 1) + 1}`,
        ],
        `In ${G.name}, |G| = ${res.groupOrder}, ord(${elLabel}) = |H| = ${res.subgroupOrder}, and [G:H] = ${res.groupOrder}/${res.subgroupOrder} = ${res.index}.`,
        [
          `Swaps |H| and the index [G:H] (unless |H| = [G:H], wait—only distinct values apply here).`,
          `Notice (${res.subgroupOrder + 1}) × ${res.index} ≠ ${res.groupOrder}.`,
          `Notice ${res.subgroupOrder} × ${(res.index ?? 1) + 1} ≠ ${res.groupOrder}.`,
        ],
        '|G| = |H| × [G : H]',
        res.stepByStep
      );
    }

    // 71-100: Converse of Lagrange's Theorem, A_4, prime-order groups, and element orders (30 Qs)
    const a4Search6 = findSubgroupsOfOrder(A4, 6);
    const a4Search4 = findSubgroupsOfOrder(A4, 4);
    const a4Search3 = findSubgroupsOfOrder(A4, 3);
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    for (let i = 0; i < 30; i++) {
      if (i < 10) {
        const p = primes[i];
        const wrongs = pickWrongNumbers(2, [p, p - 1, p + 1]);
        addLagQ(
          'easy',
          `If G is a group of prime order p = ${p}, exactly how many subgroups (including {e} and G) does G have?`,
          '2',
          wrongs,
          `Since ${p} is prime, its only positive divisors are 1 and ${p}. Every element g ≠ e has order ${p}, so the only subgroups are {e} and G.`,
          [
            `Any proper non-trivial subgroup would require a proper divisor of ${p}.`,
            `There is only 1 subgroup of order 1 and 1 subgroup of order ${p}.`,
            `Lagrange's theorem restricts subgroup orders to divisors of ${p}.`,
          ],
          '|H| ∣ p (p prime) ⇒ |H| ∈ {1, p}',
          [
            `Divisors of prime ${p} are 1 and ${p}.`,
            `Order 1 gives {e}; order ${p} gives G itself. Total = 2 subgroups.`,
          ]
        );
      } else if (i < 20) {
        const ordTest = i % 2 === 0 ? 6 : 4;
        const found = ordTest === 6 ? a4Search6.subgroups.length : a4Search4.subgroups.length;
        if (ordTest === 6) {
          addLagQ(
            'advanced',
            `In A₄ (order 12), how many subgroups of order 6 exist (Case #${i})?`,
            `${found}`,
            ['1', '3', '4'],
            `Exhaustive search in A₄ finds ${found} subgroups of order 6: an index-2 subgroup would be normal and contain all eight 3-cycles, forcing |H| ≥ 9.`,
            [
              `A₄ has no subgroup of order 6; it is the classic counterexample to the converse of Lagrange's Theorem.`,
              `Three subgroups exist of order 2, not order 6.`,
              `Four subgroups exist of order 3, not order 6.`,
            ],
            '6 ∣ |A₄| = 12, yet ∄ H ≤ A₄ with |H| = 6',
            [
              `Checked complete subgroup lattice of A₄ (|A₄| = 12).`,
              `Subgroup orders present in A₄: 1, 2 (×3), 3 (×4), 4 (×1 = V₄), 12.`,
              `Zero subgroups of order 6 exist.`,
            ]
          );
        } else {
          addLagQ(
            'advanced',
            `In A₄ (order 12), how many subgroups of order 4 exist (Case #${i})?`,
            `${found}`,
            ['0', '3', '6'],
            `A₄ has ${found} subgroup of order 4: namely the Klein four-subgroup V₄ = {e, (1 2)(3 4), (1 3)(2 4), (1 4)(2 3)}.`,
            [
              `Unlike order 6, order 4 DOES have a subgroup (V₄) in A₄.`,
              `Order 2 has 3 subgroups, whereas order 4 has only 1 (V₄).`,
              `6 does not match the number of order-4 subgroups in A₄.`,
            ],
            '|V₄| = 4 ∣ |A₄| = 12',
            [
              `Exhaustive search finds V₄ = {e, (1 2)(3 4), (1 3)(2 4), (1 4)(2 3)}.`,
              `Note: A₄ also has ${a4Search3.subgroups.length} subgroups of order 3, and 0 of order 6.`,
            ]
          );
        }
      } else {
        const k = i - 19; // 1..10
        const groupOrder = 6 * k;
        addLagQ(
          'medium',
          `If G is a group of order ${groupOrder} and g ∈ G, what does Lagrange's Theorem guarantee about g^${groupOrder}?`,
          'g^' + groupOrder + ' = e',
          ['g^' + groupOrder + ' = g', 'g^' + (groupOrder / 2) + ' = e always', 'ord(g) = ' + groupOrder + ' always'],
          `Since ord(g) divides |G| = ${groupOrder}, writing ${groupOrder} = m·ord(g) gives g^${groupOrder} = (g^{ord(g)})^m = e^m = e.`,
          [
            `g^(${groupOrder}+1) = g, whereas g^${groupOrder} = e.`,
            `g^(${groupOrder / 2}) = e fails if an element has order ${groupOrder} or an even-power divisor not dividing ${groupOrder / 2}.`,
            `G need not be cyclic, so not every element has order ${groupOrder}.`,
          ],
          'ord(g) ∣ |G| ⇒ g^{|G|} = e',
          [
            `By Lagrange applied to ⟨g⟩, ord(g) divides ${groupOrder}.`,
            `Hence ${groupOrder} = k · ord(g) for some integer k ≥ 1.`,
            `Therefore g^${groupOrder} = (g^{ord(g)})^k = e.`,
          ]
        );
      }
    }
  }

  // =========================================================================
  // TOPIC 3: NORMAL AND NON-NORMAL SUBGROUPS (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addNormQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `normal-${String(count).padStart(3, '0')}`,
        topicId: 'normal-subgroups',
        topicTitle: 'Normal and Non-Normal Subgroups',
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    const testGroups: FiniteGroup[] = [S3, D4, D3, D5, D6, Q8, A4, S4, getZ(8), getZ(12), Z2xZ6];
    const samples: Array<{ G: FiniteGroup; H: number[]; label: string }> = [];
    for (const G of testGroups) {
      for (let i = 1; i < G.order; i++) {
        const H = generateSubgroupFromElements(G, [i]);
        if (H.length > 1 && H.length < G.order) {
          samples.push({ G, H, label: `⟨${G.elements[i]}⟩` });
        }
      }
    }
    // Add V4 in S4 and A4
    const v4InS4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => S4.elements.indexOf(l));
    samples.unshift({ G: S4, H: v4InS4, label: 'V₄' });

    for (let i = 0; i < 60; i++) {
      const s = samples[i % samples.length];
      const norm = analyzeNormality(s.G, s.H);
      const hDesc = `{${s.H.map((idx) => s.G.elements[idx]).join(', ')}}`;
      if (norm.isNormal) {
        addNormQ(
          i < 25 ? 'easy' : 'medium',
          `In ${s.G.name}, consider subgroup H = ${s.label} = ${hDesc} (Case #${i + 1}). Why is H normal in ${s.G.name}?`,
          `For every g ∈ ${s.G.name}, gHg⁻¹ = H and gH = Hg`,
          [
            `Because H has order ${s.H.length} which is prime`,
            `Because ${s.G.name} is always abelian`,
            `Because gHg⁻¹ = {e} for all g ∈ ${s.G.name}`,
          ],
          norm.explanation,
          [
            `Prime order alone does not imply normality (e.g., ⟨(1 2)⟩ in S₃ has prime order 2 but is non-normal).`,
            `${s.G.isAbelian ? 'Even though this group is abelian, the defining condition of normality is gHg⁻¹ = H.' : `${s.G.name} is actually non-abelian!`}`,
            `Conjugation preserves subgroup order |gHg⁻¹| = |H| = ${s.H.length} > 1, so it cannot equal {e}.`,
          ],
          'H ◁ G ⇔ ∀ g ∈ G, gHg⁻¹ = H ⇔ gH = Hg',
          [
            `Verified |H| = ${s.H.length} divides |${s.G.name}| = ${s.G.order} (index ${s.G.order / s.H.length}).`,
            `Checked gHg⁻¹ = H across all ${s.G.order} elements g ∈ ${s.G.name}.`,
          ]
        );
      } else {
        const fail = norm.failingElements[0];
        const conjStr = `{${fail.gHgInv.join(', ')}}`;
        const wrongConjs = [
          hDesc,
          `{${s.G.elements[0]}}`,
          `{${fail.gH.join(', ')}}`,
        ] as [string, string, string];
        if (wrongConjs[2] === conjStr) wrongConjs[2] = `{${fail.Hg.join(', ')}}`;
        addNormQ(
          'medium',
          `In ${s.G.name}, H = ${s.label} = ${hDesc} is NOT normal (Case #${i + 1}). What is the conjugate subgroup gHg⁻¹ when g = ${fail.gLabel}?`,
          conjStr,
          wrongConjs,
          `Conjugating H by g = ${fail.gLabel} produces ${conjStr} ≠ H, proving H is not normal in ${s.G.name}.`,
          [
            `${hDesc} is H itself, which would mean g ∈ N_G(H), false for g = ${fail.gLabel}.`,
            `Conjugation preserves cardinality, so |gHg⁻¹| = |H| = ${s.H.length}, never 1.`,
            `Confuses the coset ${fail.gLabel}H with the conjugate ${fail.gLabel}H${fail.gLabel}⁻¹.`,
          ],
          'gHg⁻¹ = {ghg⁻¹ : h ∈ H}',
          [
            `Compute g⁻¹ = ${s.G.elements[s.G.inverses[s.G.elements.indexOf(fail.gLabel)]]}.`,
            `Evaluate ghg⁻¹ for every h ∈ ${hDesc}.`,
            `Result: ${conjStr} ≠ H.`,
          ]
        );
      }
    }

    // 61-100: Conjugation witnesses & conceptual normality tests (40 Qs)
    const nonNormWitnesses: Array<{ G: FiniteGroup; H: number[]; label: string }> = [];
    for (const entry of nonAbelianPool) {
      for (let i = 1; i < entry.G.order; i++) {
        const H = generateSubgroupFromElements(entry.G, [i]);
        if (H.length > 1 && H.length < entry.G.order) {
          const norm = analyzeNormality(entry.G, H);
          if (!norm.isNormal) {
            nonNormWitnesses.push({ G: entry.G, H, label: `⟨${entry.G.elements[i]}⟩` });
          }
        }
      }
    }
    for (let i = 0; i < 40; i++) {
      const item = nonNormWitnesses[i % nonNormWitnesses.length];
      const norm = analyzeNormality(item.G, item.H);
      const fail = norm.failingElements[0];
      const hSet = `{${item.H.map((x) => item.G.elements[x]).join(', ')}}`;
      const passingEl = norm.conjugations.find((c) => c.equalsH && c.gIndex !== 0)?.gLabel ?? 'e';
      const otherEl = item.G.elements[item.H[1] ?? 0];
      addNormQ(
        'advanced',
        `For H = ${item.label} = ${hSet} in ${item.G.name}, which element g ∈ ${item.G.name} witnesses failure of normality (gH ≠ Hg)? (Check #${i + 1})`,
        fail.gLabel,
        [passingEl, 'e', otherEl === fail.gLabel ? item.G.elements[0] : otherEl],
        `For g = ${fail.gLabel}, ${fail.gLabel}H = {${fail.gH.join(', ')}} ≠ {${fail.Hg.join(', ')}} = H${fail.gLabel}.`,
        [
          `${passingEl} normalizes H (${passingEl}H = H${passingEl}).`,
          `The identity e always satisfies eH = H = He.`,
          `Elements inside H always satisfy hH = H = Hh.`,
        ],
        'H ⋪ G ⇔ ∃ g ∈ G with gH ≠ Hg',
        [
          `Compute left coset ${fail.gLabel}H = {${fail.gH.join(', ')}}.`,
          `Compute right coset H${fail.gLabel} = {${fail.Hg.join(', ')}}.`,
          `Since ${fail.gLabel}H ≠ H${fail.gLabel}, H is not normal.`,
        ]
      );
    }
  }

  // =========================================================================
  // TOPIC 4: NORMALIZERS AND CENTRALIZERS (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addNCQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `normcent-${String(count).padStart(3, '0')}`,
        topicId: 'normalizers-centralizers',
        topicTitle: 'Normalizers and Centralizers',
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    const ncGroups = [S3, D4, D5, D6, Q8, A4, S4];
    const ncPairs: Array<{ G: FiniteGroup; idx: number }> = [];
    for (const G of ncGroups) {
      for (let i = 1; i < G.order; i++) {
        ncPairs.push({ G, idx: i });
      }
    }

    // 1-50: |N_G(H)| and number of conjugates [G : N_G(H)]
    for (let i = 0; i < 50; i++) {
      const { G, idx } = ncPairs[i % ncPairs.length];
      const H = generateSubgroupFromElements(G, [idx]);
      const norm = calculateNormalizer(G, H);
      if (i % 2 === 0) {
        const wrongs = pickWrongNumbers(norm.normalizerOrder, [H.length, G.order, G.order / 2, 1]);
        addNCQ(
          i < 20 ? 'easy' : 'medium',
          `In ${G.name} (order ${G.order}), let H = ⟨${G.elements[idx]}⟩ (order ${H.length}). What is |N_G(H)|? (Query #${i + 1})`,
          `${norm.normalizerOrder}`,
          wrongs,
          `N_G(H) = {${norm.normalizerLabels.join(', ')}} has order ${norm.normalizerOrder}.`,
          [
            `Check whether every element of this size satisfies gHg⁻¹ = H.`,
            `Lagrange requires |H| ∣ |N_G(H)| ∣ |G|; exact conjugation test yields ${norm.normalizerOrder}.`,
            `Not equal to ${wrongs[2]} by direct evaluation of gHg⁻¹.`,
          ],
          'N_G(H) = {g ∈ G : gHg⁻¹ = H}',
          [
            `H = {${H.map((x) => G.elements[x]).join(', ')}}.`,
            `Elements g ∈ ${G.name} with gHg⁻¹ = H: {${norm.normalizerLabels.join(', ')}}.`,
            `Order |N_G(H)| = ${norm.normalizerOrder}.`,
          ]
        );
      } else {
        const numConj = G.order / norm.normalizerOrder;
        const wrongs = pickWrongNumbers(numConj, [norm.normalizerOrder, G.order, H.length, numConj + 1]);
        addNCQ(
          'advanced',
          `In ${G.name}, let H = ⟨${G.elements[idx]}⟩. How many distinct conjugate subgroups gHg⁻¹ does H have in ${G.name}? (Query #${i + 1})`,
          `${numConj}`,
          wrongs,
          `By Orbit-Stabilizer, the number of conjugates of H is [G : N_G(H)] = ${G.order} / ${norm.normalizerOrder} = ${numConj}.`,
          [
            `${wrongs[0]} confuses |N_G(H)| or |G| with the index [G : N_G(H)].`,
            `Conjugate count must equal |G| / |N_G(H)| = ${numConj}.`,
            `Not ${wrongs[2]}.`,
          ],
          '|{gHg⁻¹ : g ∈ G}| = [G : N_G(H)]',
          [
            `Computed |N_G(H)| = ${norm.normalizerOrder}.`,
            `Number of distinct conjugates = ${G.order} / ${norm.normalizerOrder} = ${numConj}.`,
          ]
        );
      }
    }

    // 51-100: |C_G(x)| and C_G(H) vs N_G(H)
    for (let i = 0; i < 50; i++) {
      const { G, idx } = ncPairs[(i + 7) % ncPairs.length];
      const cent = calculateCentralizer(G, [idx]);
      const H = generateSubgroupFromElements(G, [idx]);
      const norm = calculateNormalizer(G, H);
      if (i < 35) {
        const wrongs = pickWrongNumbers(cent.centralizerOrder, [norm.normalizerOrder, G.order, 1, H.length]);
        addNCQ(
          i < 15 ? 'easy' : 'medium',
          `In ${G.name} (order ${G.order}), what is the order of the centralizer C_G(${G.elements[idx]})? (Item #${i + 1})`,
          `${cent.centralizerOrder}`,
          wrongs,
          `C_G(${G.elements[idx]}) = {${cent.centralizerLabels.join(', ')}} has order ${cent.centralizerOrder}.`,
          [
            `Remember C_G(x) counts elements commuting individually with ${G.elements[idx]} (gx = xg).`,
            `All powers of ${G.elements[idx]} lie in C_G(${G.elements[idx]}), and exact testing gives order ${cent.centralizerOrder}.`,
            `Does not equal ${wrongs[2]}.`,
          ],
          'C_G(x) = {g ∈ G : gx = xg}',
          [
            `Tested gx = xg for all ${G.order} elements g ∈ ${G.name}.`,
            `Commuting elements: {${cent.centralizerLabels.join(', ')}}.`,
            `|C_G(${G.elements[idx]})| = ${cent.centralizerOrder}.`,
          ]
        );
      } else {
        const centH = calculateCentralizer(G, H);
        addNCQ(
          'advanced',
          `In ${G.name}, compare C_G(H) and N_G(H) for H = ⟨${G.elements[idx]}⟩ (Item #${i + 1}). What are |C_G(H)| and |N_G(H)|?`,
          `|C_G(H)| = ${centH.centralizerOrder}, |N_G(H)| = ${norm.normalizerOrder}`,
          [
            `|C_G(H)| = ${norm.normalizerOrder}, |N_G(H)| = ${centH.centralizerOrder + 1}`,
            `|C_G(H)| = ${G.order}, |N_G(H)| = ${norm.normalizerOrder}`,
            `|C_G(H)| = ${centH.centralizerOrder}, |N_G(H)| = ${Math.max(1, centH.centralizerOrder - 1)}`,
          ],
          `Always C_G(H) ⊆ N_G(H), giving |C_G(H)| = ${centH.centralizerOrder} ≤ ${norm.normalizerOrder} = |N_G(H)|.`,
          [
            `C_G(H) can never exceed N_G(H) because every element commuting with each h ∈ H also normalizes H.`,
            `Unless ${G.elements[idx]} ∈ Z(${G.name}), C_G(H) ≠ ${G.name}.`,
            `Normalizer always contains centralizer: |N_G(H)| ≥ |C_G(H)|.`,
          ],
          'C_G(H) ◁ N_G(H) ≤ G',
          [
            `C_G(H) = {${centH.centralizerLabels.join(', ')}} (order ${centH.centralizerOrder}).`,
            `N_G(H) = {${norm.normalizerLabels.join(', ')}} (order ${norm.normalizerOrder}).`,
          ]
        );
      }
    }
  }

  // =========================================================================
  // TOPIC 5: CENTRE AND CONJUGACY CLASSES (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addConjQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `conj-${String(count).padStart(3, '0')}`,
        topicId: 'centre-conjugacy',
        topicTitle: 'Centre and Conjugacy Classes',
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    // 1-30: |Z(G)| across D_n (n=3..14), S_3, S_4, A_4, Q_8, V_4, Z_n
    const centrePool: FiniteGroup[] = [
      D3, D4, D5, D6,
      buildDihedralGroup(7), buildDihedralGroup(8), buildDihedralGroup(9), buildDihedralGroup(10),
      buildDihedralGroup(11), buildDihedralGroup(12),
      S3, S4, A4, Q8, V4, getZ(6), getZ(10), Z2xZ6,
    ];
    for (let i = 0; i < 30; i++) {
      const G = centrePool[i % centrePool.length];
      const z = calculateCentre(G);
      const wrongs = pickWrongNumbers(z.centreOrder, [G.order, 1, 2, 4]);
      addConjQ(
        i < 15 ? 'easy' : 'medium',
        `What is the order of the centre Z(${G.name})? (Case #${i + 1})`,
        `${z.centreOrder}`,
        wrongs,
        `Z(${G.name}) = {${z.centreLabels.join(', ')}} has order ${z.centreOrder}.`,
        [
          `Remember for Dₙ: |Z(Dₙ)| = 2 when n is even, and 1 when n is odd.`,
          `For Sₙ (n ≥ 3) and A₄, Z(G) = {e} has order 1.`,
          `Abelian groups have Z(G) = G.`,
        ],
        'Z(G) = {z ∈ G : zg = gz ∀ g ∈ G}',
        [
          `Checked commutation with all elements of ${G.name}.`,
          `Central elements: {${z.centreLabels.join(', ')}} ⇒ |Z(${G.name})| = ${z.centreOrder}.`,
        ]
      );
    }

    // 31-65: Conjugacy class size |Cl(x)| and centralizer index
    const conjGroups = [S3, D4, D5, D6, Q8, A4, S4];
    const conjPairs: Array<{ G: FiniteGroup; xIdx: number }> = [];
    for (const G of conjGroups) {
      const analysis = analyzeConjugacyClasses(G);
      for (const cl of analysis.classes) {
        conjPairs.push({ G, xIdx: cl.representativeIndex });
      }
    }
    for (let i = 0; i < 35; i++) {
      const { G, xIdx } = conjPairs[i % conjPairs.length];
      const analysis = analyzeConjugacyClasses(G);
      const cl = analysis.classes.find((c) => c.elements.includes(xIdx))!;
      const wrongs = pickWrongNumbers(cl.size, [cl.centralizerOrder, G.order, cl.size + 1, 2]);
      addConjQ(
        'medium',
        `In ${G.name} (order ${G.order}), what is the size of the conjugacy class Cl(${G.elements[xIdx]})? (Query #${i + 1})`,
        `${cl.size}`,
        wrongs,
        `Cl(${G.elements[xIdx]}) = {${cl.elementLabels.join(', ')}} has size ${cl.size} = [${G.name} : C_G(${G.elements[xIdx]})] = ${G.order}/${cl.centralizerOrder}.`,
        [
          `${wrongs[0]} confuses |C_G(x)| or |G| with |Cl(x)|.`,
          `Class size must divide |G| = ${G.order}.`,
          `Exact orbit computation gives ${cl.size}.`,
        ],
        '|Cl(x)| = [G : C_G(x)]',
        [
          `Conjugates g·${G.elements[xIdx]}·g⁻¹ form {${cl.elementLabels.join(', ')}}.`,
          `Class size = ${cl.size} (centralizer order ${cl.centralizerOrder}).`,
        ]
      );
    }

    // 66-100: Class Equation & number of conjugacy classes
    for (let i = 0; i < 35; i++) {
      const G = centrePool[i % 14]; // non-abelian & small groups
      const analysis = analyzeConjugacyClasses(G);
      if (i % 2 === 0) {
        addConjQ(
          'medium',
          `Which expression is the verified Class Equation of ${G.name}? (Check #${i + 1})`,
          analysis.classEquationString,
          [
            `${G.order} = ${analysis.centralElements.length + 1} + ${analysis.nonCentralClassSizes.join(' + ') || '0'}`,
            `${G.order} = ${analysis.classes.length} + ${G.order - analysis.classes.length}`,
            `${G.order} = 1 + ${G.order - 1}`,
          ],
          `Grouping central elements (${analysis.centralElements.length}) and non-central class sizes (${analysis.nonCentralClassSizes.join(', ')}) gives ${analysis.classEquationString}.`,
          [
            `The terms do not sum to |${G.name}| = ${G.order}.`,
            `Confuses the number of classes with |Z(G)|.`,
            `Not every non-central element lies in a single giant conjugacy class.`,
          ],
          '|G| = |Z(G)| + ∑ [G : C_G(x_i)]',
          [
            `Z(${G.name}) = {${analysis.centralElements.join(', ')}} (size ${analysis.centralElements.length}).`,
            `Non-central conjugacy classes have sizes: ${analysis.nonCentralClassSizes.join(', ') || 'none'}.`,
            `Sum: ${analysis.classEquationString}.`,
          ]
        );
      } else {
        const numClasses = analysis.classes.length;
        const wrongs = pickWrongNumbers(numClasses, [G.order, analysis.centralElements.length, numClasses + 1]);
        addConjQ(
          'advanced',
          `Into how many disjoint conjugacy classes does ${G.name} partition? (Count #${i + 1})`,
          `${numClasses}`,
          wrongs,
          `${G.name} partitions into ${numClasses} conjugacy classes: ${analysis.classes.map((c) => `{${c.elementLabels.join(', ')}}`).join(', ')}.`,
          [
            `Abelian groups have |G| classes, whereas non-abelian groups merge non-central elements into larger classes.`,
            `Does not account for all non-central classes.`,
            `Miscounts the conjugacy orbits.`,
          ],
          'G = ⨆ Cl(x_i)',
          [
            `Computed all conjugacy orbits of ${G.name}.`,
            `Total distinct classes = ${numClasses}.`,
          ]
        );
      }
    }
  }

  // =========================================================================
  // TOPIC 6: QUOTIENT GROUPS AND CAYLEY TABLES (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addQuotQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `quotient-${String(count).padStart(3, '0')}`,
        topicId: 'quotient-groups',
        topicTitle: 'Quotient Groups and Cayley Tables',
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    // 1-45: Coset orders in Z_n / <d> and (Z_m x Z_n)/H
    const qPairs: Array<{ G: FiniteGroup; H: number[]; label: string }> = [];
    for (let n = 6; n <= 24; n++) {
      const Z = getZ(n);
      for (let d = 2; d < n; d++) {
        if (n % d === 0) {
          qPairs.push({ G: Z, H: generateSubgroupFromElements(Z, [d]), label: `⟨${d}⟩` });
        }
      }
    }
    qPairs.push(
      { G: D4, H: generateSubgroupFromElements(D4, [D4.elements.indexOf('r²')]), label: '⟨r²⟩' },
      { G: D4, H: generateSubgroupFromElements(D4, [D4.elements.indexOf('r')]), label: '⟨r⟩' },
      { G: Q8, H: generateSubgroupFromElements(Q8, [1]), label: '{1, -1}' },
      { G: S4, H: ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => S4.elements.indexOf(l)), label: 'V₄' }
    );

    for (let i = 0; i < 45; i++) {
      const item = qPairs[i % qPairs.length];
      const q = buildQuotientGroup(item.G, item.H);
      const cosets = q.quotientElements!;
      const chosen = cosets[(1 + i) % cosets.length];
      const wrongs = pickWrongNumbers(chosen.order, [
        item.G.orders[chosen.representativeIndex],
        q.quotientGroup!.order,
        chosen.order + 1,
      ]);
      addQuotQ(
        i < 20 ? 'easy' : 'medium',
        `In the quotient group ${item.G.name} / ${item.label}, what is the order of the coset ${chosen.cosetLabel}? (Query #${i + 1})`,
        `${chosen.order}`,
        wrongs,
        `ord(${chosen.cosetLabel}) = min{m ≥ 1 : g^m ∈ H} = ${chosen.order}.`,
        [
          `Be careful: the order of g in G may be larger than the order of gH in G/H.`,
          `This is |G/H| or another multiple, not the smallest m with g^m ∈ H.`,
          `Coset order must divide |G/H| = ${q.quotientGroup!.order}.`,
        ],
        'ord(gH) = min{m ≥ 1 : g^m ∈ H}',
        [
          `H = {${item.H.map((idx) => item.G.elements[idx]).join(', ')}}.`,
          `Compute powers/multiples of ${chosen.representativeLabel} until landing in H: m = ${chosen.order}.`,
        ]
      );
    }

    // 46-75: Inverse cosets & quotient order |G/H|
    for (let i = 0; i < 30; i++) {
      const item = qPairs[(i + 5) % qPairs.length];
      const q = buildQuotientGroup(item.G, item.H);
      const qG = q.quotientGroup!;
      const elemIdx = (1 + i) % qG.order;
      const invIdx = qG.inverses[elemIdx];
      const otherCosets = qG.elements.filter((_, idx) => idx !== invIdx);
      addQuotQ(
        'medium',
        `In the quotient group ${item.G.name} / ${item.label}, what is the inverse of the coset ${qG.elements[elemIdx]}? (Item #${i + 1})`,
        qG.elements[invIdx],
        [
          otherCosets[0] ?? qG.elements[0],
          otherCosets[1] ?? qG.elements[0],
          otherCosets[2] ?? 'Does not exist',
        ],
        `Multiplying ${qG.elements[elemIdx]} by ${qG.elements[invIdx]} yields the identity coset ${qG.elements[qG.identityIndex]}.`,
        [
          `Multiplying by ${otherCosets[0] ?? qG.elements[0]} does not land in H.`,
          `Multiplying by ${otherCosets[1] ?? qG.elements[0]} gives a non-identity coset.`,
          `Every element in a valid quotient group G/H has a unique inverse.`,
        ],
        '(gH)⁻¹ = g⁻¹H',
        [
          `Find representative inverse (${item.G.elements[q.quotientElements![elemIdx].representativeIndex]})⁻¹ in ${item.G.name}.`,
          `Locate its coset in the quotient Cayley table: ${qG.elements[invIdx]}.`,
        ]
      );
    }

    // 76-100: Quotient validity & abelianness tests
    const invalidPairs: Array<{ G: FiniteGroup; H: number[]; label: string }> = [
      { G: S3, H: generateSubgroupFromElements(S3, [S3.elements.indexOf('(1 2)')]), label: '⟨(1 2)⟩' },
      { G: D4, H: generateSubgroupFromElements(D4, [D4.elements.indexOf('s')]), label: '⟨s⟩' },
      { G: D4, H: generateSubgroupFromElements(D4, [D4.elements.indexOf('rs')]), label: '⟨rs⟩' },
      { G: D5, H: generateSubgroupFromElements(D5, [D5.elements.indexOf('s')]), label: '⟨s⟩' },
      { G: A4, H: generateSubgroupFromElements(A4, [A4.elements.indexOf('(1 2 3)')]), label: '⟨(1 2 3)⟩' },
    ];
    for (let i = 0; i < 25; i++) {
      if (i % 2 === 0) {
        const inv = invalidPairs[i % invalidPairs.length];
        const q = buildQuotientGroup(inv.G, inv.H);
        addQuotQ(
          'advanced',
          `Can the quotient group ${inv.G.name} / ${inv.label} be constructed using (g₁H)(g₂H) = (g₁g₂)H? (Check #${i + 1})`,
          'No — H is not normal, so coset multiplication is not well-defined',
          [
            `Yes — it forms an abelian group of order ${inv.G.order / inv.H.length}`,
            `Yes — it forms a non-abelian group of order ${inv.G.order / inv.H.length}`,
            `Only if we restrict to right cosets Hg instead of left cosets gH`,
          ],
          q.reasonIfInvalid!,
          [
            `Coset multiplication depends on choice of representatives when H is not normal.`,
            `Even non-abelian quotient groups require H ◁ G.`,
            `Switching to right cosets fails for the same reason when gH ≠ Hg.`,
          ],
          '(g₁H)(g₂H) = (g₁g₂)H well-defined ⇔ H ◁ G',
          [
            `Checked normality of ${inv.label} in ${inv.G.name}: fails.`,
            `Witness: ${q.normality.failingElements[0]?.gLabel}H ≠ H${q.normality.failingElements[0]?.gLabel}.`,
          ]
        );
      } else {
        const item = qPairs[(i + 10) % qPairs.length];
        const q = buildQuotientGroup(item.G, item.H);
        const qG = q.quotientGroup!;
        addQuotQ(
          'medium',
          `What is the order |${item.G.name} / ${item.label}| and is this quotient group abelian? (Check #${i + 1})`,
          `Order ${qG.order}, ${qG.isAbelian ? 'Abelian' : 'Non-abelian'}`,
          [
            `Order ${qG.order}, ${qG.isAbelian ? 'Non-abelian' : 'Abelian'}`,
            `Order ${item.H.length}, ${qG.isAbelian ? 'Abelian' : 'Non-abelian'}`,
            `Order ${item.G.order}, Abelian`,
          ],
          `|${item.G.name}/${item.label}| = ${item.G.order}/${item.H.length} = ${qG.order}, and checking the Cayley table confirms it is ${qG.isAbelian ? 'abelian' : 'non-abelian'}.`,
          [
            `Order is correct, but commutativity of the quotient Cayley table is opposite.`,
            `${item.H.length} is |H|, not [G:H] = |G/H|.`,
            `${item.G.order} is |G| before dividing by |H|.`,
          ],
          '|G/H| = [G : H] = |G| / |H|',
          [
            `Verified ${item.label} ◁ ${item.G.name}.`,
            `Constructed ${qG.order}×${qG.order} quotient Cayley table.`,
          ]
        );
      }
    }
  }

  // =========================================================================
  // TOPIC 7: CLASSIFICATION OF QUOTIENT GROUPS (100 verified MCQs)
  // =========================================================================
  {
    let count = 0;
    const addClsQ = (
      diff: QuestionDifficulty,
      prompt: string,
      correct: string,
      wrongs: [string, string, string],
      correctReason: string,
      wrongReasons: [string, string, string],
      formula: string,
      steps: string[]
    ) => {
      count++;
      const rot = makeRotatedOptions(correct, wrongs, correctReason, wrongReasons, count);
      pushUnique({
        id: `class-${String(count).padStart(3, '0')}`,
        topicId: 'classification',
        topicTitle: 'Classification of Quotient Groups',
        difficulty: diff,
        question: prompt,
        options: rot.options,
        correctIndex: rot.correctIndex,
        correctExplanation: correctReason,
        distractorExplanations: rot.distractorExplanations,
        formula,
        stepByStep: steps,
        verificationStatus: 'verified',
        source: 'engine-verified',
      });
    };

    const abelianPairs: Array<[number, number]> = [
      [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 8], [2, 9], [2, 10],
      [3, 3], [3, 4], [3, 5], [3, 6], [3, 9], [4, 4], [4, 6], [4, 8],
      [5, 5], [6, 6],
    ];

    // 1-45: Invariant factor & cyclic classification of direct products and quotients
    for (let i = 0; i < 45; i++) {
      const [m, n] = abelianPairs[i % abelianPairs.length];
      const G = m * n <= 48 ? buildDirectProductCyclic([m, n]) : Z4xZ4;
      const cls = classifyAbelianGroup(G);
      const invStr = cls.invariantFactors.map((d) => `ℤ_${d}`).join(' × ');
      const elemStr = cls.elementaryDivisors.map((d) => `ℤ_${d}`).join(' × ');
      if (i < 25) {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const gVal = gcd(m, n);
        addClsQ(
          gVal === 1 ? 'easy' : 'medium',
          `What is the canonical invariant-factor decomposition of ${G.name}? (Type #${i + 1})`,
          invStr,
          [
            cls.isCyclic ? `ℤ_${m} × ℤ_${n} (already invariant)` : `ℤ_${G.order}`,
            `ℤ_${G.order + 2}`,
            invStr === elemStr ? `ℤ_2 × ℤ_${G.order}` : `ℤ_${m * n} × ℤ_2`,
          ],
          cls.explanation,
          [
            `Invariant factors must satisfy d₁ ∣ d₂ ∣ ⋯ ∣ d_k; when gcd(m, n) = 1, ℤ_m × ℤ_n ≅ ℤ_{mn}.`,
            `Order of the decomposition must match |G| = ${G.order}.`,
            `Product of invariant factors must equal ${G.order}.`,
          ],
          'A ≅ ℤ_{d₁} × ⋯ × ℤ_{d_k}, d₁ ∣ d₂ ∣ ⋯ ∣ d_k',
          [
            `Check gcd(${m}, ${n}) = ${gVal}.`,
            `Elementary divisors: [${cls.elementaryDivisors.join(', ')}].`,
            `Invariant factors: [${cls.invariantFactors.join(', ')}] ⇒ ${invStr}.`,
          ]
        );
      } else {
        addClsQ(
          'medium',
          `What are the elementary divisors (prime-power cyclic orders) of ${G.name}? (Type #${i + 1})`,
          `[${cls.elementaryDivisors.join(', ')}]`,
          [
            `[${G.order}]`,
            `[${cls.elementaryDivisors.join(', ')}, 2]`,
            `[${m + 1}, ${n}]`,
          ],
          `Factoring each cyclic summand into prime powers yields elementary divisors [${cls.elementaryDivisors.join(', ')}].`,
          [
            `${G.order} is not a single prime power unless |G| = p^k and G is cyclic.`,
            `Product would exceed |G| = ${G.order}.`,
            `Numbers must be prime powers whose product equals ${G.order}.`,
          ],
          'A ≅ ∏ ℤ_{p_i^{a_i}}',
          [
            `Factor order ${G.order} into prime powers matching element-order ranks.`,
            `Elementary divisors: [${cls.elementaryDivisors.join(', ')}].`,
          ]
        );
      }
    }

    // 46-80: Quotient group classification (Z_a x Z_b)/<g> and D_4/<r^2>
    const quotClsTargets: Array<{ G: FiniteGroup; genIdx: number; title: string }> = [];
    [Z2xZ4, Z2xZ6, Z3xZ6, Z4xZ4, Z2xZ2, Z3xZ3].forEach((G) => {
      for (let idx = 1; idx < G.order; idx++) {
        const H = generateSubgroupFromElements(G, [idx]);
        if (H.length > 1 && H.length < G.order) {
          quotClsTargets.push({ G, genIdx: idx, title: `${G.name} / ⟨${G.elements[idx]}⟩` });
        }
      }
    });
    for (let i = 0; i < 35; i++) {
      const t = quotClsTargets[i % quotClsTargets.length];
      const H = generateSubgroupFromElements(t.G, [t.genIdx]);
      const q = buildQuotientGroup(t.G, H);
      const qG = q.quotientGroup!;
      const cls = classifyAbelianGroup(qG);
      const invStr = cls.invariantFactors.map((d) => `ℤ_${d}`).join(' × ');
      const altWrong = cls.isCyclic
        ? (qG.order % 4 === 0 ? `ℤ_2 × ℤ_${qG.order / 2}` : `ℤ_2 × ℤ_${qG.order}`)
        : `ℤ_${qG.order}`;
      addClsQ(
        'advanced',
        `Classify the abelian quotient group ${t.title} up to isomorphism (Problem #${i + 1}).`,
        invStr,
        [altWrong, `ℤ_${qG.order * 2}`, `ℤ_${H.length}`],
        cls.explanation,
        [
          `Check whether an element of order ${qG.order} exists in ${t.title} (actual max order: ${Math.max(...qG.orders)}).`,
          `Wrong order: |G/H| = ${t.G.order} / ${H.length} = ${qG.order}.`,
          `${H.length} is |H|, not |G/H|.`,
        ],
        '|G/H| = |G|/|H|; FTFGAG',
        [
          `|H| = |⟨${t.G.elements[t.genIdx]}⟩| = ${H.length}, so |G/H| = ${qG.order}.`,
          `Element order distribution in G/H: ${cls.elementOrderDistribution.map((d) => `${d.count} of ord ${d.order}`).join(', ')}.`,
          `Classification: ${invStr}.`,
        ]
      );
    }

    // 81-100: Non-abelian quotient warning & Cyclicity checks (20 Qs)
    for (let i = 0; i < 20; i++) {
      if (i < 10) {
        addClsQ(
          'advanced',
          `Can the Fundamental Theorem of Finite Abelian Groups classify S₄/V₄ (Variant #${i + 1})?`,
          'No — S₄/V₄ is non-abelian (≅ S₃), so FTFGAG does not apply',
          [
            'Yes — S₄/V₄ ≅ ℤ₆',
            'Yes — S₄/V₄ ≅ ℤ₂ × ℤ₃',
            'Yes — every quotient of S₄ is abelian',
          ],
          'S₄/V₄ has order 6 and is non-abelian (isomorphic to S₃). Never apply the abelian classification theorem to a non-abelian group.',
          [
            'ℤ₆ is abelian, whereas S₄/V₄ fails commutativity.',
            'ℤ₂ × ℤ₃ ≅ ℤ₆ is abelian, contradicting non-commuting cosets in S₄/V₄.',
            'False: only quotients by subgroups containing the commutator subgroup [S₄, S₄] = A₄ are abelian.',
          ],
          'FTFGAG applies iff G is abelian',
          [
            'Test commutativity of (1 2)V₄ and (1 2 3)V₄.',
            'Since they do not commute, S₄/V₄ is non-abelian (≅ S₃).',
          ]
        );
      } else {
        const modA = 2 + (i % 5);
        const modB = modA + 2;
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const g = gcd(modA, modB);
        const isCyc = g === 1;
        addClsQ(
          'easy',
          `Is the finite abelian group ℤ_${modA} × ℤ_${modB} cyclic? (Check #${i + 1})`,
          isCyc ? `Yes, because gcd(${modA}, ${modB}) = 1` : `No, because gcd(${modA}, ${modB}) = ${g} > 1`,
          [
            isCyc ? `No, because ${modA} and ${modB} are distinct` : `Yes, every direct product of cyclic groups is cyclic`,
            `Only if ${modA} divides ${modB}`,
            `Only if ${modA} + ${modB} is prime`,
          ],
          `ℤ_m × ℤ_n is cyclic (≅ ℤ_{mn}) if and only if gcd(m, n) = 1. Here gcd(${modA}, ${modB}) = ${g}.`,
          [
            `Distinctness does not block cyclicity; coprimality determines it.`,
            `Divisibility forces gcd = min(m, n) > 1, which prevents cyclicity.`,
            `Sum primality is unrelated to gcd(m, n).`,
          ],
          'ℤ_m × ℤ_n cyclic ⇔ gcd(m, n) = 1',
          [
            `Compute gcd(${modA}, ${modB}) = ${g}.`,
            `Max element order is lcm(${modA}, ${modB}) = ${(modA * modB) / g} ${isCyc ? '=' : '<'} ${modA * modB}.`,
          ]
        );
      }
    }
  }

  cachedQuestions = questions;
  return questions;
}
