import { analyzeConjugacyClasses } from './conjugacyEngine.ts';
import { analyzeCosets } from './cosetEngine.ts';
import { classifyAbelianGroup } from './classificationEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { validateSubgroup } from './groupValidation.ts';
import { verifyLagrangeTheorem } from './lagrangeEngine.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { buildQuotientGroup } from './quotientEngine.ts';
import { analyzeSylowTheorems } from './sylowAndCayleyEngine.ts';

export type ProofTheoremId =
  | 'coset-partition'
  | 'lagrange'
  | 'normality-equivalence'
  | 'quotient-well-defined'
  | 'first-isomorphism'
  | 'class-equation'
  | 'sylow-first'
  | 'ftfgag';

export interface StructuredTheoremProof {
  id: ProofTheoremId;
  title: string;
  topicTag: string;
  theoremStatement: string;
  formulaLatex: string;
  givenInfo: string[];
  requiredConclusion: string;
  proofStrategy: string;
  steps: string[];
  finalConclusion: string;
  liveInstantiation: {
    applicable: boolean;
    statusLabel: string;
    details: string[];
  };
}

export const PROOF_THEOREM_CATALOG: Array<{
  id: ProofTheoremId;
  title: string;
  topicTag: string;
}> = [
  { id: 'coset-partition', title: 'Coset Equivalence & Partition Theorem', topicTag: 'Cosets' },
  { id: 'lagrange', title: "Lagrange's Theorem", topicTag: 'Lagrange Theorem' },
  { id: 'normality-equivalence', title: 'Equivalent Characterizations of Normality', topicTag: 'Normal Subgroups' },
  { id: 'quotient-well-defined', title: 'Well-Definedness of Quotient Multiplication', topicTag: 'Quotient Groups' },
  { id: 'first-isomorphism', title: 'First Isomorphism Theorem', topicTag: 'Homomorphisms' },
  { id: 'class-equation', title: 'The Group Class Equation', topicTag: 'Conjugacy' },
  { id: 'sylow-first', title: 'Sylow First Theorem (Existence of p-Subgroups)', topicTag: 'Sylow Theory' },
  { id: 'ftfgag', title: 'Classification of Finite Abelian Groups', topicTag: 'Abelian Groups' },
];

export function buildStructuredProof(
  theoremId: ProofTheoremId,
  group: FiniteGroup,
  subsetIndices: number[]
): StructuredTheoremProof {
  const subVal = validateSubgroup(group, subsetIndices);
  const subsetStr = `{${subsetIndices.map((i) => group.elements[i]).join(', ')}}`;

  switch (theoremId) {
    case 'coset-partition': {
      const cosets = analyzeCosets(group, subsetIndices);
      return {
        id: theoremId,
        title: 'Coset Equivalence & Partition Theorem',
        topicTag: 'Cosets',
        theoremStatement:
          'If H ≤ G, the left cosets {gH : g ∈ G} partition G into disjoint blocks of identical cardinality |H|.',
        formulaLatex: 'aH = bH \\iff b^{-1}a \\in H, \\qquad |gH| = |H|',
        givenInfo: [
          `Finite group G = ${group.name} (|G| = ${group.order})`,
          `Selection H = ${subsetStr} (${subVal.isSubgroup ? `valid subgroup, |H| = ${subVal.order}` : 'not a valid subgroup'})`,
        ],
        requiredConclusion:
          'Show that the relation a ~ b ⇔ b⁻¹a ∈ H is an equivalence relation whose equivalence classes are the left cosets aH, each equinumerous to H.',
        proofStrategy:
          'Verify reflexivity, symmetry, and transitivity using the subgroup axioms of H, identify [a] = aH, and construct an explicit bijection φ_a : H → aH.',
        steps: [
          '1. Reflexivity: Since H ≤ G, the identity e ∈ H. Thus a⁻¹a = e ∈ H, so a ~ a for every a ∈ G.',
          '2. Symmetry: Suppose a ~ b, so b⁻¹a ∈ H. Since H is closed under inverses, (b⁻¹a)⁻¹ = a⁻¹b ∈ H, proving b ~ a.',
          '3. Transitivity: If a ~ b and b ~ c, then b⁻¹a ∈ H and c⁻¹b ∈ H. By closure of H, (c⁻¹b)(b⁻¹a) = c⁻¹a ∈ H, hence a ~ c.',
          '4. Identifying Classes: x ∈ [a] ⇔ a⁻¹x ∈ H ⇔ a⁻¹x = h for some h ∈ H ⇔ x = ah ∈ aH. Thus [a] = aH, so distinct cosets are disjoint and cover G.',
          '5. Equal Cardinality: Define φ_a : H → aH by φ_a(h) = ah. Left cancellation in G implies φ_a is injective, and by definition of aH it is surjective, so |aH| = |H|.',
        ],
        finalConclusion:
          'Therefore the distinct left cosets of H form an equal-sized partition of G.',
        liveInstantiation: subVal.isSubgroup
          ? {
              applicable: true,
              statusLabel: `Verified on ${group.name} (${cosets.index} disjoint cosets of size ${subVal.order})`,
              details: [
                `Distinct left cosets (${cosets.index}): ${cosets.distinctLeftCosets.map((c) => `{${c.elementLabels.join(', ')}}`).join(' ⊔ ')}`,
                `Partition check across all ${group.order} elements: ${cosets.partitionVerified ? 'Passed (pairwise disjoint & exhaustive)' : 'Failed'}`,
              ],
            }
          : {
              applicable: false,
              statusLabel: 'Requires a valid subgroup H ≤ G',
              details: subVal.reasons,
            },
      };
    }

    case 'lagrange': {
      const lag = verifyLagrangeTheorem(group, subsetIndices);
      return {
        id: theoremId,
        title: "Lagrange's Theorem",
        topicTag: 'Lagrange Theorem',
        theoremStatement:
          'For any finite group G and any subgroup H ≤ G, both |H| and the index [G : H] divide |G|, with |G| = |H| · [G : H].',
        formulaLatex: '|G| = |H| \\cdot [G : H] \\implies |H| \\mid |G|',
        givenInfo: [
          `Finite group G = ${group.name} of order |G| = ${group.order}`,
          `Subgroup H = ${subsetStr} (${subVal.isSubgroup ? `|H| = ${subVal.order}` : 'currently not a subgroup'})`,
        ],
        requiredConclusion: 'Prove that |G| = |H| · [G : H], and hence |H| divides |G|.',
        proofStrategy:
          'Combine the disjoint coset partition of G with the uniform cardinality |gH| = |H|.',
        steps: [
          '1. By the Coset Partition Theorem, G is the disjoint union of its [G : H] = k distinct left cosets: G = g₁H ⊔ g₂H ⊔ ⋯ ⊔ gₖH.',
          '2. Because these cosets are pairwise disjoint, |G| equals the sum of their sizes: |G| = ∑ᵢ₌₁ᵏ |gᵢH|.',
          '3. Every coset satisfies |gᵢH| = |H| via the bijection h ↦ gᵢh.',
          '4. Summing k identical terms gives |G| = k · |H| = |H| · [G : H].',
          '5. Since [G : H] is a positive integer, |H| divides |G|.',
        ],
        finalConclusion:
          'Hence |H| ∣ |G| and [G : H] = |G| / |H|. Caution: the converse fails in general (e.g. A₄ has order 12 and 6 ∣ 12, but no subgroup of order 6).',
        liveInstantiation: lag.equationVerified
          ? {
              applicable: true,
              statusLabel: `Verified: ${lag.groupOrder} = ${lag.subgroupOrder} × ${lag.index}`,
              details: lag.stepByStep,
            }
          : {
              applicable: false,
              statusLabel: 'Select a valid subgroup H ≤ G to instantiate',
              details: lag.validation.reasons,
            },
      };
    }

    case 'normality-equivalence': {
      const norm = analyzeNormality(group, subsetIndices);
      return {
        id: theoremId,
        title: 'Equivalent Characterizations of Normality',
        topicTag: 'Normal Subgroups',
        theoremStatement:
          'For a subgroup H ≤ G, the following are equivalent: (1) gH = Hg for all g ∈ G, (2) gHg⁻¹ = H for all g ∈ G, and (3) gHg⁻¹ ⊆ H for all g ∈ G.',
        formulaLatex: 'gH = Hg \\;\\forall g\\in G \\iff gHg^{-1} = H \\;\\forall g\\in G \\iff gHg^{-1} \\subseteq H \\;\\forall g\\in G',
        givenInfo: [
          `Group G = ${group.name} (|G| = ${group.order})`,
          `Subset H = ${subsetStr}`,
        ],
        requiredConclusion: 'Establish the logical cycle (1) ⇒ (2) ⇒ (3) ⇒ (1).',
        proofStrategy:
          'Right-multiply coset equality by g⁻¹, note inclusion is immediate, and apply (3) to both g and g⁻¹.',
        steps: [
          '1. (1) ⇒ (2): Assume gH = Hg for all g ∈ G. Right-multiplying both sets by g⁻¹ yields gHg⁻¹ = Hgg⁻¹ = He = H.',
          '2. (2) ⇒ (3): If gHg⁻¹ = H, then trivially gHg⁻¹ ⊆ H.',
          '3. (3) ⇒ (2): Suppose gHg⁻¹ ⊆ H for all g ∈ G. Replacing g by g⁻¹ gives g⁻¹Hg ⊆ H. Conjugating on the left by g and right by g⁻¹ yields H = g(g⁻¹Hg)g⁻¹ ⊆ gHg⁻¹. Together with gHg⁻¹ ⊆ H, this forces gHg⁻¹ = H.',
          '4. (2) ⇒ (1): Given gHg⁻¹ = H for all g ∈ G, right-multiplying by g gives gH = Hg.',
        ],
        finalConclusion:
          'All three normality criteria are logically equivalent; any one proves H ◁ G.',
        liveInstantiation: subVal.isSubgroup
          ? {
              applicable: true,
              statusLabel: norm.isNormal ? `H ◁ ${group.name} (All criteria hold)` : `H ⋪ ${group.name} (${norm.failingElements.length} witnesses)`,
              details: [
                norm.explanation,
                norm.failingElements.length > 0
                  ? `Counterexample witnesses where gHg⁻¹ ≠ H: ${norm.failingElements.slice(0, 5).join(', ')}`
                  : `Checked all ${group.order} elements g ∈ ${group.name}: gHg⁻¹ = H and gH = Hg hold universally.`,
              ],
            }
          : {
              applicable: false,
              statusLabel: 'Select a valid subgroup H ≤ G',
              details: subVal.reasons,
            },
      };
    }

    case 'quotient-well-defined': {
      const quot = buildQuotientGroup(group, subsetIndices);
      return {
        id: theoremId,
        title: 'Well-Definedness of Quotient Multiplication',
        topicTag: 'Quotient Groups',
        theoremStatement:
          'If N ◁ G, then the coset operation (aN)(bN) = (ab)N is well-defined on G/N and turns G/N into a group of order [G : N].',
        formulaLatex: 'aN = a\'N,\\; bN = b\'N \\implies (ab)N = (a\'b\')N',
        givenInfo: [
          `Group G = ${group.name} (|G| = ${group.order})`,
          `Candidate normal subgroup N = ${subsetStr}`,
        ],
        requiredConclusion:
          'Prove that multiplying cosets is independent of representative choice whenever N ◁ G, and satisfies the group axioms.',
        proofStrategy:
          'Write a′ = an₁ and b′ = bn₂ with n₁, n₂ ∈ N, commute b across n₁ via normality b⁻¹N b = N, and verify quotient group axioms.',
        steps: [
          '1. Representative Independence: Assume aN = a′N and bN = b′N. Then a′ = an₁ and b′ = bn₂ for some n₁, n₂ ∈ N.',
          '2. Compute a′b′ = (an₁)(bn₂) = a(bb⁻¹)n₁bn₂ = (ab)(b⁻¹n₁b)n₂.',
          '3. Because N ◁ G, b⁻¹Nb = N, so b⁻¹n₁b ∈ N. Since N is closed under multiplication, n₃ := (b⁻¹n₁b)n₂ ∈ N.',
          '4. Thus a′b′ = (ab)n₃ ∈ (ab)N, which proves (a′b′)N = (ab)N.',
          '5. Group Axioms: Associativity inherits from G, identity is eN = N, and the inverse of aN is a⁻¹N.',
        ],
        finalConclusion:
          'G/N is a well-defined group of order |G/N| = |G| / |N| whenever N ◁ G.',
        liveInstantiation: quot.canConstruct && quot.quotientGroup
          ? {
              applicable: true,
              statusLabel: `Verified: G/N has order ${quot.quotientGroup.order}`,
              details: [
                `Quotient group G/N constructed with ${quot.quotientElements?.length ?? quot.quotientGroup.order} cosets.`,
                `Abelian quotient: ${quot.quotientGroup.isAbelian ? 'Yes' : 'No'}`,
              ],
            }
          : {
              applicable: false,
              statusLabel: 'Quotient G/N fails well-definedness (N is not normal)',
              details: [quot.reasonIfInvalid ?? 'Subgroup N is not normal in G.'],
            },
      };
    }

    case 'first-isomorphism': {
      const quot = buildQuotientGroup(group, subsetIndices);
      return {
        id: theoremId,
        title: 'First Isomorphism Theorem',
        topicTag: 'Homomorphisms',
        theoremStatement:
          'If φ : G → G′ is a group homomorphism, then ker(φ) ◁ G and G / ker(φ) ≅ Im(φ).',
        formulaLatex: 'G / \\ker(\\varphi) \\cong \\mathrm{Im}(\\varphi)',
        givenInfo: [
          `Domain group G = ${group.name} (|G| = ${group.order})`,
          `Normal subgroup N = ${subsetStr} (acts as ker(π) under the canonical projection π : G → G/N)`,
        ],
        requiredConclusion:
          'Prove ker(φ) ◁ G and construct a well-defined bijective homomorphism ψ : G/ker(φ) → Im(φ).',
        proofStrategy:
          'Verify ker(φ) is closed under conjugation, define ψ(gK) = φ(g), and prove well-definedness, homomorphism property, injectivity, and surjectivity.',
        steps: [
          '1. Normality of K = ker(φ): For k ∈ K and g ∈ G, φ(gkg⁻¹) = φ(g)φ(k)φ(g)⁻¹ = φ(g)e′φ(g)⁻¹ = e′, so gkg⁻¹ ∈ K. Thus K ◁ G.',
          '2. Well-Definedness of ψ(gK) = φ(g): If g₁K = g₂K, then g₂⁻¹g₁ ∈ K, so φ(g₂)⁻¹φ(g₁) = φ(g₂⁻¹g₁) = e′, giving φ(g₁) = φ(g₂).',
          '3. Homomorphism: ψ((g₁K)(g₂K)) = ψ((g₁g₂)K) = φ(g₁g₂) = φ(g₁)φ(g₂) = ψ(g₁K)ψ(g₂K).',
          '4. Injectivity: If ψ(gK) = e′, then φ(g) = e′, so g ∈ K and gK = K (identity in G/K). Thus ker(ψ) = {K}.',
          '5. Surjectivity: Any y ∈ Im(φ) equals φ(g) for some g ∈ G, so ψ(gK) = y.',
        ],
        finalConclusion:
          'Every homomorphic image of G is isomorphic to a quotient group G/N for N = ker(φ) ◁ G.',
        liveInstantiation: quot.canConstruct && quot.quotientGroup
          ? {
              applicable: true,
              statusLabel: `Canonical projection π : ${group.name} → G/N verified`,
              details: [
                `Kernel of canonical projection π is N = ${subsetStr} (order ${subVal.order}).`,
                `Image has order ${quot.quotientGroup.order}, matching |G| / |ker(π)| = ${group.order} / ${subVal.order}.`,
              ],
            }
          : {
              applicable: false,
              statusLabel: 'Only normal subgroups can occur as homomorphism kernels',
              details: [quot.reasonIfInvalid ?? 'Subgroup N is not normal in G.'],
            },
      };
    }

    case 'class-equation': {
      const conj = analyzeConjugacyClasses(group);
      return {
        id: theoremId,
        title: 'The Group Class Equation',
        topicTag: 'Conjugacy',
        theoremStatement:
          'For any finite group G, |G| = |Z(G)| + ∑ [G : C_G(xᵢ)], summed over representatives xᵢ of non-central conjugacy classes.',
        formulaLatex: '|G| = |Z(G)| + \\sum_{x_i \\notin Z(G)} [G : C_G(x_i)]',
        givenInfo: [
          `Finite group G = ${group.name} of order ${group.order}`,
          `Centre size |Z(G)| = ${conj.centralElements.length}`,
        ],
        requiredConclusion:
          'Partition G by conjugacy classes, isolate singleton central classes, and compute each class size via Orbit-Stabilizer.',
        proofStrategy:
          'Show conjugacy is an equivalence relation, characterize singleton classes as Z(G), and apply |Cl(x)| = [G : C_G(x)].',
        steps: [
          '1. G acts on itself by conjugation: g · x = gxg⁻¹. The orbits of this action are the conjugacy classes Cl(x), which partition G.',
          '2. An element x belongs to Z(G) iff gxg⁻¹ = x for all g ∈ G, iff |Cl(x)| = 1. There are |Z(G)| such singleton classes.',
          '3. The stabilizer of x under conjugation is Stab(x) = {g ∈ G : gxg⁻¹ = x} = C_G(x), the centralizer of x.',
          '4. By the Orbit-Stabilizer Theorem, |Cl(x)| = [G : C_G(x)] for every representative x.',
          '5. Summing all class sizes and separating singletons gives |G| = |Z(G)| + ∑_{xᵢ ∉ Z(G)} [G : C_G(xᵢ)].',
        ],
        finalConclusion:
          'The Class Equation constrains subgroup structure and implies every non-trivial p-group has a non-trivial centre.',
        liveInstantiation: {
          applicable: true,
          statusLabel: `Verified on ${group.name}: ${conj.classEquationString}`,
          details: [
            `Centre Z(${group.name}) has order ${conj.centralElements.length} (${conj.classes.length} total conjugacy classes).`,
            `Class sizes: [${conj.classes.map((c) => c.size).join(', ')}], summing to ${group.order}.`,
          ],
        },
      };
    }

    case 'sylow-first': {
      const sylow = analyzeSylowTheorems(group);
      return {
        id: theoremId,
        title: 'Sylow First Theorem (Existence of p-Subgroups)',
        topicTag: 'Sylow Theory',
        theoremStatement:
          'If p is prime and pᵏ is the highest power of p dividing |G| (with |G| = pᵏm, p ∤ m), then G has at least one subgroup of order pᵏ (a Sylow p-subgroup).',
        formulaLatex: '|G| = p^k m,\\; p \\nmid m \\implies \\exists P \\le G \\text{ with } |P| = p^k',
        givenInfo: [
          `Finite group G = ${group.name}, |G| = ${group.order}`,
          `Prime factorization: ${sylow.factorizationLatex}`,
        ],
        requiredConclusion:
          'Guarantee existence of a subgroup P ≤ G of maximal prime-power order pᵏ.',
        proofStrategy:
          'Use strong induction on |G| combined with the Class Equation (Cauchy/centre reduction) or Wielandt’s action on subsets of size pᵏ.',
        steps: [
          '1. Proceed by induction on |G| (or Wielandt’s binomial counting argument on the family Ω of all pᵏ-element subsets of G).',
          '2. In the Wielandt proof, |Ω| = C(pᵏm, pᵏ). By Kummer/Lucas congruence, p does not divide |Ω|.',
          '3. G acts on Ω by left multiplication: g · S = gS. Since |Ω| is not divisible by p, at least one orbit O = G · S₀ has size |O| not divisible by p.',
          '4. Let P = Stab_G(S₀). By Orbit-Stabilizer, |P| · |O| = |G| = pᵏm. Because p ∤ |O|, pᵏ must divide |P|.',
          '5. Meanwhile P acts freely on S₀ by left multiplication (or right cosets of P sit inside S₀), forcing |P| ≤ |S₀| = pᵏ. Thus |P| = pᵏ.',
        ],
        finalConclusion:
          'P is a subgroup of G of order pᵏ, proving Sylow’s First Theorem.',
        liveInstantiation: {
          applicable: true,
          statusLabel: `Computed for ${group.name} (${sylow.reports.length} prime factor${sylow.reports.length === 1 ? '' : 's'})`,
          details: sylow.reports.map(
            (pr) =>
              `p = ${pr.prime}: Sylow order ${pr.sylowOrder}, count n_${pr.prime} = ${pr.npCount} (${pr.npCount} ≡ 1 mod ${pr.prime} verified)`
          ),
        },
      };
    }

    case 'ftfgag': {
      const cls = classifyAbelianGroup(group);
      return {
        id: theoremId,
        title: 'Classification of Finite Abelian Groups',
        topicTag: 'Abelian Groups',
        theoremStatement:
          'Every finite abelian group G of order n > 1 is isomorphic to a unique direct product of cyclic prime-power groups (elementary divisors) and to a unique chain ℤ_{d₁} × ⋯ × ℤ_{dₖ} with d₁ ∣ d₂ ∣ ⋯ ∣ dₖ (invariant factors).',
        formulaLatex: 'G \\cong \\mathbb{Z}_{d_1} \\times \\mathbb{Z}_{d_2} \\times \\cdots \\times \\mathbb{Z}_{d_k}, \\qquad d_1 \\mid d_2 \\mid \\cdots \\mid d_k',
        givenInfo: [
          `Group G = ${group.name} (|G| = ${group.order}, ${group.isAbelian ? 'abelian' : 'non-abelian'})`,
        ],
        requiredConclusion:
          'Decompose G into primary p-components (elementary divisors) and reassemble into nested invariant factors.',
        proofStrategy:
          'First split G into its Sylow p-subgroups (Chinese Remainder / primary decomposition), then induct on max element order to split off a cyclic direct summand.',
        steps: [
          '1. Primary Decomposition: Since G is finite abelian, each Sylow p-subgroup G(p) is unique and G ≅ ∏_{p ∣ |G|} G(p).',
          '2. Direct Summand Lemma: In an abelian p-group G(p), pick an element a of maximal order pʳ. Then ⟨a⟩ has a complementary subgroup K such that G(p) ≅ ⟨a⟩ × K.',
          '3. Induction on Order: Repeating step 2 yields G(p) ≅ ℤ_{p^{e₁}} × ⋯ × ℤ_{p^{eₘ}} (elementary divisors).',
          '4. Invariant Factors: Grouping the largest prime powers across each prime p via CRT (ℤ_a × ℤ_b ≅ ℤ_{ab} when gcd(a,b)=1) produces d₁ ∣ d₂ ∣ ⋯ ∣ dₖ.',
          '5. Uniqueness: Comparing counts of elements of order pʲ in G determines the multiset of elementary divisors uniquely.',
        ],
        finalConclusion:
          'Every finite abelian group is uniquely classified up to isomorphism by its elementary divisors or invariant factors.',
        liveInstantiation: cls.isAbelian
          ? {
              applicable: true,
              statusLabel: `Decomposed ${group.name} (${cls.isCyclic ? 'Cyclic' : 'Non-cyclic Abelian'})`,
              details: [
                `Invariant Factors: ${cls.invariantFactors.length > 0 ? cls.invariantFactors.map((d) => `ℤ_${d}`).join(' × ') : 'Trivial {e}'}`,
                `Elementary Divisors: ${cls.elementaryDivisors.length > 0 ? cls.elementaryDivisors.map((d) => `ℤ_${d}`).join(' × ') : 'None'}`,
              ],
            }
          : {
              applicable: false,
              statusLabel: `${group.name} is non-abelian — theorem does not apply`,
              details: [cls.explanation],
            },
      };
    }
  }
}
