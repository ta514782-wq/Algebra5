export interface SolvedExample {
  title: string;
  problem: string;
  steps: string[];
  answer: string;
}

export interface FormalDefinition {
  term: string;
  latex: string;
  explanation: string;
}

export interface TheoremBlock {
  name: string;
  statement: string;
  statementLatex: string;
  proof: string[];
}

export interface LearningTopic {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  objectives: string[];
  prerequisites: string[];
  introduction: string;
  definitions: FormalDefinition[];
  theorems: TheoremBlock[];
  formulas: Array<{ label: string; latex: string; note: string }>;
  solvedExamples: SolvedExample[];
  visualExplanation: string;
  commonMistakes: string[];
  revisionNotes: string[];
}

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    id: 'cosets',
    number: 1,
    title: 'Left and Right Cosets',
    subtitle: 'Coset equality, partitions of finite groups, and subgroup index',
    estimatedMinutes: 35,
    objectives: [
      'Compute left cosets gH and right cosets Hg in additive and multiplicative finite groups.',
      'Determine when two cosets represent the exact same subset of G.',
      'Prove that distinct left (or right) cosets partition G into equal-sized disjoint blocks.',
      'Compute the subgroup index [G : H] and verify when gH = Hg holds.',
    ],
    prerequisites: ['Group axioms (closure, identity, inverses, associativity)', 'Subgroup criterion'],
    introduction:
      'Given a subgroup H of a group G, translating H by an element g ∈ G creates a coset. Cosets generalize the idea of congruence classes modulo n in integers to arbitrary, potentially non-abelian groups, forming the foundation for Lagrange’s theorem and quotient groups.',
    definitions: [
      {
        term: 'Left Coset',
        latex: 'gH = \\{g \\cdot h : h \\in H\\}',
        explanation: 'All elements obtained by multiplying g on the left by every element of H. In additive notation, g + H = {g + h : h ∈ H}.',
      },
      {
        term: 'Right Coset',
        latex: 'Hg = \\{h \\cdot g : h \\in H\\}',
        explanation: 'All elements obtained by multiplying g on the right by every element of H. In abelian groups, gH = Hg always.',
      },
      {
        term: 'Subgroup Index',
        latex: '[G : H] = |\\{gH : g \\in G\\}|',
        explanation: 'The number of distinct left (or equivalently, right) cosets of H in G.',
      },
    ],
    theorems: [
      {
        name: 'Coset Equality Criterion',
        statement: 'For any a, b ∈ G and subgroup H ≤ G, aH = bH if and only if a⁻¹b ∈ H (equivalently b⁻¹a ∈ H).',
        statementLatex: 'aH = bH \\iff a^{-1}b \\in H \\qquad (\\text{and } Ha = Hb \\iff ab^{-1} \\in H)',
        proof: [
          'Suppose aH = bH. Since e ∈ H, we have b = b·e ∈ bH = aH, so b = ah for some h ∈ H.',
          'Multiplying on the left by a⁻¹ gives a⁻¹b = h ∈ H.',
          'Conversely, suppose a⁻¹b = h₀ ∈ H, so b = ah₀. Then for any h ∈ H, bh = a(h₀h) ∈ aH, showing bH ⊆ aH.',
          'Symmetrically, a = bh₀⁻¹ implies aH ⊆ bH, hence aH = bH.',
        ],
      },
      {
        name: 'Coset Partition Theorem',
        statement: 'The distinct left cosets of H in G form a partition of G, and every left coset has the same cardinality as H.',
        statementLatex: 'G = \\bigsqcup_{i=1}^{[G:H]} g_i H, \\quad |gH| = |H|',
        proof: [
          'Define a relation a ~ b on G by a⁻¹b ∈ H. Reflexivity (a⁻¹a = e ∈ H), symmetry (h⁻¹ ∈ H), and transitivity (closure of H) hold because H ≤ G.',
          'The equivalence class of g is precisely [g] = {x ∈ G : g⁻¹x ∈ H} = gH, so distinct cosets are disjoint and their union is G.',
          'The map φ: H → gH defined by φ(h) = gh is a bijection (with inverse x ↦ g⁻¹x), proving |gH| = |H|.',
        ],
      },
    ],
    formulas: [
      { label: 'Additive coset', latex: 'a + H = \\{a + h : h \\in H\\}', note: 'Used in ℤ_n and ℤ_m × ℤ_n.' },
      { label: 'Membership in H', latex: 'gH = H \\iff g \\in H', note: 'Only elements of H leave H invariant as a coset.' },
      { label: 'Index identity', latex: '[G : H] = \\frac{|G|}{|H|}', note: 'Exact whenever G is finite.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Cosets of 3ℤ₆ in ℤ₆',
        problem: 'Let G = ℤ₆ under addition mod 6 and H = {0, 3}. Find all distinct left cosets and [ℤ₆ : H].',
        steps: [
          '0 + H = {0, 3}.',
          '1 + H = {1 + 0, 1 + 3} = {1, 4}.',
          '2 + H = {2 + 0, 2 + 3} = {2, 5}.',
          '3 + H = {3, 0} = 0 + H; 4 + H = {4, 1} = 1 + H; 5 + H = {5, 2} = 2 + H.',
        ],
        answer: '3 distinct cosets: {0, 3}, {1, 4}, {2, 5}. Index [ℤ₆ : H] = 3.',
      },
      {
        title: 'Example 2: Left vs Right Cosets in S₃',
        problem: 'In G = S₃, let H = {e, (1 2)}. Compute (1 3)H and H(1 3) and compare.',
        steps: [
          'Left coset (1 3)H = {(1 3)∘e, (1 3)∘(1 2)} = {(1 3), (1 2 3)}.',
          'Right coset H(1 3) = {e∘(1 3), (1 2)∘(1 3)} = {(1 3), (1 3 2)}.',
          'Notice (1 2 3) ≠ (1 3 2), so (1 3)H ≠ H(1 3).',
        ],
        answer: '(1 3)H = {(1 3), (1 2 3)} ≠ {(1 3), (1 3 2)} = H(1 3).',
      },
      {
        title: 'Example 3: Coset Equality Test in D₄',
        problem: 'In D₄, let H = ⟨s⟩ = {e, s}. Are the left cosets rH and rsH equal?',
        steps: [
          'Use the criterion aH = bH ⇔ a⁻¹b ∈ H.',
          'Compute r⁻¹(rs) = (r⁻¹r)s = e·s = s.',
          'Since s ∈ H, we immediately have rH = rsH = {r, rs}.',
        ],
        answer: 'Yes, rH = rsH = {r, rs}.',
      },
      {
        title: 'Example 4: Partition of D₄ by ⟨r²⟩',
        problem: 'Find all left cosets of H = {e, r²} in D₄.',
        steps: [
          'eH = {e, r²}.',
          'rH = {r, r³}.',
          'sH = {s, sr²} = {s, r²s}.',
          'rsH = {rs, r³s}.',
          'Check union: 4 cosets × 2 elements = 8 = |D₄|.',
        ],
        answer: '4 distinct cosets: {e, r²}, {r, r³}, {s, r²s}, {rs, r³s}. [D₄ : H] = 4.',
      },
      {
        title: 'Example 5: Cosets in Direct Product ℤ₂ × ℤ₄',
        problem: 'In G = ℤ₂ × ℤ₄, let H = ⟨(1, 2)⟩ = {(0,0), (1,2)}. Find [G : H] and list all cosets.',
        steps: [
          '|G| = 2 × 4 = 8 and |H| = 2, so [G : H] = 8 / 2 = 4.',
          '(0,0) + H = {(0,0), (1,2)}.',
          '(0,1) + H = {(0,1), (1,3)}.',
          '(1,0) + H = {(1,0), (0,2)}.',
          '(1,1) + H = {(1,1), (0,3)}.',
        ],
        answer: '[G : H] = 4 with the 4 disjoint cosets listed above.',
      },
    ],
    visualExplanation:
      'Imagine G as a tiled rectangle of |G| cells. Choosing H picks a tile of |H| cells; every left coset gH translates that tile without overlap until all [G : H] rows completely tile G.',
    commonMistakes: [
      'Confusing gH = Hg (equal sets) with gh = hg for every h ∈ H (elementwise commutation).',
      'Forgetting that aH = bH uses a⁻¹b ∈ H for left cosets, whereas Ha = Hb uses ab⁻¹ ∈ H for right cosets.',
      'Assuming a coset gH is itself a subgroup when g ∉ H (it lacks the identity element e!).',
    ],
    revisionNotes: [
      'Every coset of H has the exact same size |H|.',
      'Two cosets are either completely identical or completely disjoint.',
      'Only the coset H itself (when g ∈ H) is a subgroup of G.',
    ],
  },
  {
    id: 'lagrange',
    number: 2,
    title: "Lagrange's Theorem and Its Converse",
    subtitle: 'Divisibility of group order, applications, and the A₄ counterexample',
    estimatedMinutes: 35,
    objectives: [
      "State and prove Lagrange's Theorem using the coset partition of a finite group.",
      'Apply |G| = |H| · [G : H] to determine possible subgroup and element orders.',
      'Explain why groups of prime order must be cyclic and have no proper non-trivial subgroups.',
      'Demonstrate rigorously why the converse of Lagrange’s Theorem fails using A₄ (order 12).',
    ],
    prerequisites: ['Left and Right Cosets', 'Subgroup Index', 'Element Order'],
    introduction:
      "Lagrange's Theorem is one of the most fundamental structural constraints in finite group theory: the size of any subgroup must divide the size of the whole group. Equally crucial is knowing its limitation—its converse is false in general.",
    definitions: [
      {
        term: "Lagrange's Equation",
        latex: '|G| = |H| \\cdot [G : H]',
        explanation: 'Because distinct left cosets of H partition G and each has size |H|, the total order |G| is the product of |H| and the number of cosets [G : H].',
      },
      {
        term: 'Converse of Lagrange’s Theorem',
        latex: 'd \\mid |G| \\stackrel{?}{\\implies} \\exists H \\le G \\text{ with } |H| = d',
        explanation: 'True for finite cyclic and abelian groups, and true for prime powers (Sylow theorems), but FALSE for general non-abelian groups such as A₄.',
      },
    ],
    theorems: [
      {
        name: "Lagrange's Theorem",
        statement: 'If G is a finite group and H is a subgroup of G, then |H| divides |G|, and |G| = |H| · [G : H].',
        statementLatex: 'H \\le G \\implies |H| \\mid |G| \\quad \\text{and} \\quad |G| = |H|\\,[G : H]',
        proof: [
          'Let k = [G : H] be the number of distinct left cosets g₁H, g₂H, …, g_kH of H in G.',
          'By the Coset Partition Theorem, G is the disjoint union of these k cosets.',
          'Each coset satisfies |g_i H| = |H|.',
          'Counting elements on both sides yields |G| = ∑_{i=1}^k |g_i H| = k · |H| = [G : H] · |H|.',
        ],
      },
      {
        name: 'Failure of Converse in A₄',
        statement: 'The alternating group A₄ has order 12, and 6 ∣ 12, yet A₄ has NO subgroup of order 6.',
        statementLatex: '|A_4| = 12, \\quad 6 \\mid 12, \\quad \\nexists H \\le A_4 \\text{ with } |H| = 6',
        proof: [
          'Suppose for contradiction that H ≤ A₄ has |H| = 6, so [A₄ : H] = 2.',
          'Any subgroup of index 2 is normal in A₄, so for every x ∈ A₄, x² ∈ H (because (xH)² = x²H = H in the order-2 quotient A₄/H).',
          'A₄ contains eight 3-cycles, and the square of every 3-cycle is another 3-cycle (e.g., (1 2 3)² = (1 3 2)).',
          'Thus all eight 3-cycles must belong to H, forcing |H| ≥ 8 + 1 = 9 > 6, a contradiction!',
        ],
      },
    ],
    formulas: [
      { label: 'Order of element divides |G|', latex: '\\mathrm{ord}(g) \\mid |G|', note: 'Apply Lagrange to H = ⟨g⟩.' },
      { label: 'Euler/Fermat Group Corollary', latex: 'g^{|G|} = e', note: 'Since |G| = k · ord(g) for every g ∈ G.' },
      { label: 'Prime-order theorem', latex: '|G| = p \\text{ (prime)} \\implies G \\cong \\mathbb{Z}_p', note: 'Every non-identity element generates G.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Possible Subgroup Orders of a Group of Order 15',
        problem: 'What are the possible orders of subgroups of a group G of order 15?',
        steps: [
          'By Lagrange’s theorem, |H| must divide |G| = 15.',
          'The positive divisors of 15 are 1, 3, 5, and 15.',
        ],
        answer: 'Possible subgroup orders are 1, 3, 5, and 15.',
      },
      {
        title: 'Example 2: Verifying Lagrange in D₄',
        problem: 'Verify Lagrange’s theorem for H = {e, r², s, r²s} ≤ D₄.',
        steps: [
          '|D₄| = 8 and |H| = 4.',
          'The distinct cosets are H = {e, r², s, r²s} and rH = {r, r³, rs, r³s}.',
          'Thus [D₄ : H] = 2, and |H| · [D₄ : H] = 4 × 2 = 8 = |D₄|.',
        ],
        answer: 'Verified: 8 = 4 × 2.',
      },
      {
        title: 'Example 3: Why Every Group of Order 7 is Cyclic',
        problem: 'Prove that any group G of order 7 is cyclic.',
        steps: [
          'Pick any g ∈ G with g ≠ e. Then ord(g) = |⟨g⟩| > 1.',
          'By Lagrange’s theorem, ord(g) divides 7.',
          'Since 7 is prime, ord(g) = 7, so ⟨g⟩ = G.',
        ],
        answer: 'G = ⟨g⟩ is cyclic and isomorphic to ℤ₇.',
      },
      {
        title: 'Example 4: Computing g^24 in S₄',
        problem: 'Without multiplying 24 times, what is σ²⁴ for any σ ∈ S₄?',
        steps: [
          '|S₄| = 4! = 24.',
          'For any σ ∈ S₄, ord(σ) divides 24 by Lagrange’s theorem.',
          'Therefore σ²⁴ = e for every permutation σ ∈ S₄.',
        ],
        answer: 'σ²⁴ = e.',
      },
      {
        title: 'Example 5: Counting 3-cycles in A₄ to Refute Order-6 Subgroup',
        problem: 'List the element-order counts of A₄ to verify there are 8 elements of order 3.',
        steps: [
          'Identity e: 1 element (order 1).',
          'Double transpositions (1 2)(3 4), (1 3)(2 4), (1 4)(2 3): 3 elements (order 2).',
          '3-cycles (1 2 3), (1 3 2), (1 2 4), (1 4 2), (1 3 4), (1 4 3), (2 3 4), (2 4 3): 8 elements (order 3).',
          'Total = 1 + 3 + 8 = 12. Since every 3-cycle is a square of its inverse 3-cycle, any index-2 subgroup would have to contain all 8 of them—impossible for size 6.',
        ],
        answer: 'A₄ has no subgroup of order 6 despite 6 ∣ 12.',
      },
    ],
    visualExplanation:
      'Lagrange’s theorem guarantees that subgroup sizes always sit cleanly on the divisor lattice of |G|. However, some divisor nodes (like 6 in A₄) remain empty slots with no subgroup inhabiting them.',
    commonMistakes: [
      'Assuming that because d ∣ |G|, there must exist a subgroup of order d.',
      'Confusing the order of an element with the index [G : ⟨g⟩].',
      'Applying Lagrange’s theorem to a subset H without first verifying that H is actually a subgroup.',
    ],
    revisionNotes: [
      '|G| = |H| × [G : H] always holds for finite groups.',
      'Groups of prime order have only trivial and improper subgroups.',
      'A₄ (order 12) is the smallest counterexample to the converse of Lagrange’s Theorem (no order-6 subgroup).',
    ],
  },
  {
    id: 'normal-subgroups',
    number: 3,
    title: 'Normal and Non-Normal Subgroups',
    subtitle: 'Conjugation invariance, coset equality, and index-2 normality',
    estimatedMinutes: 40,
    objectives: [
      'Test normality using both equivalent criteria: gHg⁻¹ = H and gH = Hg for all g ∈ G.',
      'Identify explicit witness elements proving a subgroup is non-normal.',
      'Explain why every subgroup of an abelian group or of index 2 is automatically normal.',
      'Distinguish Q₈ (non-abelian Hamiltonian group) from S₃ and D₄.',
    ],
    prerequisites: ['Left and Right Cosets', 'Subgroup Criterion'],
    introduction:
      'Normal subgroups are the special subgroups for which left cosets and right cosets coincide everywhere. This symmetry is the exact condition needed to turn the set of cosets into a new group—the quotient group.',
    definitions: [
      {
        term: 'Normal Subgroup',
        latex: 'H \\trianglelefteq G \\iff \\forall g \\in G,\\; gHg^{-1} = H \\iff \\forall g \\in G,\\; gH = Hg',
        explanation: 'A subgroup invariant under conjugation by every element of G.',
      },
      {
        term: 'Conjugate of H by g',
        latex: 'gHg^{-1} = \\{ghg^{-1} : h \\in H\\}',
        explanation: 'A subgroup conjugate to H; H is normal iff H has only one conjugate (itself).',
      },
    ],
    theorems: [
      {
        name: 'Equivalent Normality Conditions',
        statement: 'For H ≤ G, the following are equivalent: (1) gH = Hg for all g ∈ G; (2) gHg⁻¹ = H for all g ∈ G; (3) gHg⁻¹ ⊆ H for all g ∈ G.',
        statementLatex: 'gH = Hg \\;\\forall g \\iff gHg^{-1} = H \\;\\forall g \\iff gHg^{-1} \\subseteq H \\;\\forall g',
        proof: [
          '(1) ⇒ (2): If gH = Hg, multiplying on the right by g⁻¹ gives gHg⁻¹ = Hgg⁻¹ = H.',
          '(2) ⇒ (3): Equality implies inclusion immediately.',
          '(3) ⇒ (2): Applying g⁻¹Hg ⊆ H (since g⁻¹ ∈ G) and conjugating by g gives H ⊆ gHg⁻¹.',
          '(2) ⇒ (1): Multiplying gHg⁻¹ = H on the right by g yields gH = Hg.',
        ],
      },
      {
        name: 'Index-2 Normality Theorem',
        statement: 'Every subgroup H of index [G : H] = 2 in G is normal in G.',
        statementLatex: '[G : H] = 2 \\implies H \\trianglelefteq G',
        proof: [
          'Since [G : H] = 2, there are only two left cosets: H and G \\ H.',
          'Similarly, there are only two right cosets: H and G \\ H.',
          'For g ∈ H, gH = H = Hg. For g ∉ H, gH = G \\ H = Hg.',
          'Thus gH = Hg for all g ∈ G, so H ◁ G.',
        ],
      },
    ],
    formulas: [
      { label: 'Conjugation check', latex: 'g h g^{-1} \\in H \\;\\forall g \\in G, h \\in H', note: 'Sufficient to check on generators of G and H.' },
      { label: 'Kernel normality', latex: '\\ker(\\phi) \\trianglelefteq G', note: 'Every normal subgroup is the kernel of a homomorphism.' },
      { label: 'Abelian groups', latex: 'G \\text{ abelian} \\implies \\forall H \\le G,\\; H \\trianglelefteq G', note: 'Because gh = hg everywhere.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Index-2 Subgroup A₃ in S₃',
        problem: 'Show that A₃ = {e, (1 2 3), (1 3 2)} is normal in S₃.',
        steps: [
          '|S₃| = 6 and |A₃| = 3, so [S₃ : A₃] = 6 / 3 = 2.',
          'By the Index-2 Normality Theorem, any subgroup of index 2 is normal.',
          'Explicitly, for g = (1 2), gA₃ = {(1 2), (2 3), (1 3)} = A₃g.',
        ],
        answer: 'A₃ ◁ S₃.',
      },
      {
        title: 'Example 2: Non-Normal Subgroup in S₃',
        problem: 'Prove that H = {e, (1 2)} is NOT normal in S₃.',
        steps: [
          'Conjugate h = (1 2) by g = (1 3): g⁻¹ = (1 3).',
          'Compute (1 3)(1 2)(1 3) = (2 3).',
          'Since (2 3) ∉ H, gHg⁻¹ ≠ H.',
        ],
        answer: 'H is not normal in S₃ (witness: g = (1 3)).',
      },
      {
        title: 'Example 3: Centre ⟨r²⟩ in D₄',
        problem: 'Verify that H = {e, r²} is normal in D₄.',
        steps: [
          'Check conjugation by generators r and s.',
          'r·r²·r⁻¹ = r² ∈ H.',
          's·r²·s⁻¹ = r⁻²·s·s⁻¹ = r⁻² = r² ∈ H.',
          'Since r and s generate D₄, H is normal in D₄.',
        ],
        answer: '⟨r²⟩ ◁ D₄.',
      },
      {
        title: 'Example 4: Non-Normal Reflection Subgroup ⟨s⟩ in D₄',
        problem: 'Show that H = {e, s} is NOT normal in D₄.',
        steps: [
          'Conjugate s by r: r·s·r⁻¹ = r·(r·s) = r²s.',
          'Since r²s ∉ {e, s}, rHr⁻¹ = {e, r²s} ≠ H.',
        ],
        answer: '⟨s⟩ is not normal in D₄ (witness: g = r).',
      },
      {
        title: 'Example 5: V₄ inside S₄',
        problem: 'Verify that V₄ = {e, (1 2)(3 4), (1 3)(2 4), (1 4)(2 3)} is normal in S₄.',
        steps: [
          'Conjugation in Sₙ preserves cycle structure.',
          'V₄ consists of the identity plus ALL elements of cycle type (2,2) in S₄.',
          'Therefore, for any σ ∈ S₄ and v ∈ V₄, σvσ⁻¹ has the same cycle type as v, so σvσ⁻¹ ∈ V₄.',
        ],
        answer: 'V₄ ◁ S₄.',
      },
    ],
    visualExplanation:
      'Think of conjugation gHg⁻¹ as viewing subgroup H from the perspective of element g. Normal subgroups look identical from every perspective in G.',
    commonMistakes: [
      'Thinking gH = Hg means gh = hg for individual elements; it only requires set equality!',
      'Claiming a subgroup is normal after checking only one or two conjugations without checking generators of G.',
      'Assuming normality is transitive: if K ◁ H and H ◁ G, K need NOT be normal in G (e.g., ⟨s⟩ ◁ {e, r², s, r²s} ◁ D₄, yet ⟨s⟩ ⋪ D₄!).',
    ],
    revisionNotes: [
      'Check either gHg⁻¹ = H for all g or gH = Hg for all g.',
      'Subgroups of index 2 are always normal.',
      'Normality is NOT transitive!',
    ],
  },
  {
    id: 'normalizers-centralizers',
    number: 4,
    title: 'Normalizers and Centralizers',
    subtitle: 'Set-wise invariance versus elementwise commutation',
    estimatedMinutes: 35,
    objectives: [
      'Compute the normalizer N_G(H) and centralizer C_G(S) for subsets and subgroups of finite groups.',
      'Verify that C_G(H) ≤ N_G(H) ≤ G and H ≤ N_G(H).',
      'Distinguish carefully between N_G(H) (set-wise stability) and C_G(H) (elementwise commutation).',
      'Use N_G(H) to measure how close H is to being normal in G.',
    ],
    prerequisites: ['Normal Subgroups', 'Subgroup Criterion'],
    introduction:
      'When a subgroup H fails to be normal in G, it is still normal inside a largest intermediate subgroup called its normalizer N_G(H). Meanwhile, the centralizer C_G(S) collects elements that commute individually with every element of S.',
    definitions: [
      {
        term: 'Normalizer of H in G',
        latex: 'N_G(H) = \\{g \\in G : gHg^{-1} = H\\}',
        explanation: 'The set of elements whose conjugation maps H onto itself as a set (not necessarily fixing individual elements of H).',
      },
      {
        term: 'Centralizer of S in G',
        latex: 'C_G(S) = \\{g \\in G : gs = sg \\;\\forall s \\in S\\}',
        explanation: 'The set of elements commuting individually with every element s ∈ S.',
      },
    ],
    theorems: [
      {
        name: 'Normalizer-Centralizer Hierarchy',
        statement: 'For any subgroup H ≤ G: C_G(H) ◁ N_G(H) ≤ G, and H ◁ N_G(H). Moreover, H ◁ G if and only if N_G(H) = G.',
        statementLatex: 'C_G(H) \\trianglelefteq N_G(H) \\le G, \\quad H \\trianglelefteq N_G(H), \\quad H \\trianglelefteq G \\iff N_G(H) = G',
        proof: [
          'For h ∈ H, hHh⁻¹ = H by closure, so H ⊆ N_G(H).',
          'N_G(H) is the stabilizer of H under the conjugation action on subgroups, so N_G(H) ≤ G.',
          'Every g ∈ C_G(H) satisfies ghg⁻¹ = h for each h ∈ H, hence gHg⁻¹ = H, proving C_G(H) ⊆ N_G(H).',
          'In fact, N_G(H)/C_G(H) embeds into Aut(H) via the conjugation homomorphism (N/C Theorem).',
        ],
      },
    ],
    formulas: [
      { label: 'Number of conjugates of H', latex: '|\\{gHg^{-1} : g \\in G\\}| = [G : N_G(H)]', note: 'Orbit-Stabilizer applied to conjugation on subgroups.' },
      { label: 'Class size formula', latex: '|\\mathrm{Cl}(x)| = [G : C_G(x)]', note: 'Used directly in the Class Equation.' },
      { label: 'N/C Theorem', latex: 'N_G(H)/C_G(H) \\hookrightarrow \\mathrm{Aut}(H)', note: 'Crucial structural link.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Proper Normalizer in S₃',
        problem: 'Find N_{S₃}(H) for H = {e, (1 2)}.',
        steps: [
          'Since H ≤ N_{S₃}(H), |N_{S₃}(H)| is divisible by 2 and divides 6, so it is 2 or 6.',
          'Test g = (1 3): (1 3)H(1 3)⁻¹ = {e, (2 3)} ≠ H, so N_{S₃}(H) ≠ S₃.',
          'Therefore N_{S₃}(H) = H = {e, (1 2)}.',
        ],
        answer: 'N_{S₃}(H) = {e, (1 2)} (proper subgroup of order 2).',
      },
      {
        title: 'Example 2: Proper Normalizer in D₄',
        problem: 'In D₄, compute N_{D₄}(⟨s⟩) where ⟨s⟩ = {e, s}.',
        steps: [
          'Check r²·s·r⁻² = r²·r²·s = r⁴s = s, so r² ∈ N_{D₄}(⟨s⟩).',
          'Check r·s·r⁻¹ = r²s ∉ ⟨s⟩, so r ∉ N_{D₄}(⟨s⟩).',
          'Hence N_{D₄}(⟨s⟩) = {e, r², s, r²s} of order 4 ≠ 8.',
        ],
        answer: 'N_{D₄}(⟨s⟩) = {e, r², s, r²s}, a proper subgroup of order 4.',
      },
      {
        title: 'Example 3: Centralizer of ⟨r⟩ in D₄',
        problem: 'Compute C_{D₄}(⟨r⟩) and N_{D₄}(⟨r⟩).',
        steps: [
          'Since [D₄ : ⟨r⟩] = 2, ⟨r⟩ ◁ D₄, so N_{D₄}(⟨r⟩) = D₄ (order 8).',
          'For centralizer: does s commute with r? sr = r³s ≠ rs, so s ∉ C_{D₄}(⟨r⟩).',
          'Powers of r commute with r, so C_{D₄}(⟨r⟩) = ⟨r⟩ (order 4).',
        ],
        answer: 'C_{D₄}(⟨r⟩) = ⟨r⟩ ≠ D₄ = N_{D₄}(⟨r⟩).',
      },
      {
        title: 'Example 4: Centralizer of a Single Element in S₃',
        problem: 'Compute C_{S₃}((1 2 3)).',
        steps: [
          'Powers of (1 2 3) commute with (1 2 3): {e, (1 2 3), (1 3 2)} ⊆ C_{S₃}((1 2 3)).',
          'Test (1 2): (1 2)(1 2 3) = (2 3) while (1 2 3)(1 2) = (1 3). Not equal!',
          'By Lagrange, order is 3.',
        ],
        answer: 'C_{S₃}((1 2 3)) = A₃ = {e, (1 2 3), (1 3 2)}.',
      },
      {
        title: 'Example 5: Centralizer of V₄ in S₄',
        problem: 'Find C_{S₄}(V₄) vs N_{S₄}(V₄).',
        steps: [
          'Since V₄ ◁ S₄, N_{S₄}(V₄) = S₄ (order 24).',
          'Checking commutation with (1 2)(3 4) and (1 3)(2 4) leaves only V₄ itself.',
        ],
        answer: 'C_{S₄}(V₄) = V₄ (order 4) while N_{S₄}(V₄) = S₄ (order 24).',
      },
    ],
    visualExplanation:
      'Imagine a nested chain of subgroups: C_G(H) sits inside N_G(H), which sits inside G. Elements in C_G(H) freeze every point of H; elements in N_G(H) may permute H’s elements while keeping the set H intact.',
    commonMistakes: [
      'Confusing N_G(H) with C_G(H): N_G(⟨r⟩) = D₄ (order 8), while C_G(⟨r⟩) = ⟨r⟩ (order 4).',
      'Forgetting that H is always contained in N_G(H), whereas H is contained in C_G(H) ONLY when H is abelian.',
    ],
    revisionNotes: [
      'N_G(H) = G ⇔ H ◁ G.',
      'C_G(H) ≤ N_G(H) always.',
      'If H is non-abelian, H is NOT a subset of C_G(H).',
    ],
  },
  {
    id: 'centre-conjugacy',
    number: 5,
    title: 'Centre and Conjugacy Classes',
    subtitle: 'Central elements, conjugacy orbits, and the Class Equation',
    estimatedMinutes: 35,
    objectives: [
      'Compute the centre Z(G) and verify Z(G) ◁ G.',
      'Partition a finite group into disjoint conjugacy classes Cl(x).',
      'Derive and apply the Class Equation |G| = |Z(G)| + ∑ [G : C_G(x_i)].',
      'Verify the Class Equation for S₃, D₄, Q₈, and A₄.',
    ],
    prerequisites: ['Centralizers', 'Normal Subgroups', "Lagrange's Theorem"],
    introduction:
      'Conjugacy partitions a group into elements sharing identical algebraic symmetries. Single-element conjugacy classes form the centre Z(G), leading directly to the Class Equation—one of the most powerful counting tools in algebra.',
    definitions: [
      {
        term: 'Centre of G',
        latex: 'Z(G) = \\{z \\in G : zg = gz \\;\\forall g \\in G\\} = C_G(G)',
        explanation: 'The set of elements commuting with every element of G. Z(G) is always an abelian normal subgroup of G.',
      },
      {
        term: 'Conjugacy Class of x',
        latex: '\\mathrm{Cl}(x) = \\{gxg^{-1} : g \\in G\\}',
        explanation: 'The orbit of x under conjugation by G. All elements in Cl(x) have the same order.',
      },
    ],
    theorems: [
      {
        name: 'The Class Equation',
        statement: 'For any finite group G, |G| equals |Z(G)| plus the sum of sizes of all non-central conjugacy classes.',
        statementLatex: '|G| = |Z(G)| + \\sum_{i} [G : C_G(x_i)]',
        proof: [
          'Conjugacy (y ~ x ⇔ y = gxg⁻¹ for some g ∈ G) is an equivalence relation partitioning G into disjoint classes Cl(x).',
          'An element z has |Cl(z)| = 1 iff gzg⁻¹ = z for all g ∈ G, which happens iff z ∈ Z(G).',
          'Grouping all size-1 classes gives |Z(G)|.',
          'Each remaining non-central class Cl(x_i) has size |Cl(x_i)| = [G : C_G(x_i)] > 1 by the Orbit-Stabilizer theorem.',
        ],
      },
    ],
    formulas: [
      { label: 'Class size', latex: '|\\mathrm{Cl}(x)| = [G : C_G(x)] = \\frac{|G|}{|C_G(x)|}', note: 'Divides |G|!' },
      { label: 'Centre in Abelian G', latex: 'G \\text{ abelian} \\iff Z(G) = G', note: 'All conjugacy classes have size 1.' },
      { label: 'Prime-power centre', latex: '|G| = p^n \\;(n \\ge 1) \\implies |Z(G)| > 1', note: 'Proven immediately via the Class Equation mod p.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Conjugacy Classes and Class Equation of S₃',
        problem: 'Find the conjugacy classes, Z(S₃), and the Class Equation of S₃.',
        steps: [
          'Cl(e) = {e} (size 1).',
          'Transpositions: Cl((1 2)) = {(1 2), (1 3), (2 3)} (size 3).',
          '3-cycles: Cl((1 2 3)) = {(1 2 3), (1 3 2)} (size 2).',
          'Z(S₃) = {e} (order 1).',
        ],
        answer: '6 = 1 + 2 + 3; Z(S₃) = {e}.',
      },
      {
        title: 'Example 2: Centre and Class Equation of D₄',
        problem: 'Compute Z(D₄) and the Class Equation of D₄.',
        steps: [
          'Central elements: e and r² commute with both r and s, so Z(D₄) = {e, r²} (size 2).',
          'Remaining classes: {r, r³} (size 2), {s, r²s} (size 2), {rs, r³s} (size 2).',
        ],
        answer: '8 = 2 + 2 + 2 + 2; Z(D₄) = {e, r²}.',
      },
      {
        title: 'Example 3: Class Equation of Q₈',
        problem: 'Compute Z(Q₈) and the conjugacy classes of Q₈.',
        steps: [
          'Z(Q₈) = {1, -1} (order 2).',
          'Cl(i) = {i, -i}, Cl(j) = {j, -j}, Cl(k) = {k, -k} (each size 2).',
        ],
        answer: '8 = 2 + 2 + 2 + 2; Z(Q₈) = {1, -1}.',
      },
      {
        title: 'Example 4: Conjugacy Classes of A₄',
        problem: 'Determine the Class Equation of A₄ (note that 3-cycles split into two classes!).',
        steps: [
          'Z(A₄) = {e} (size 1).',
          'Double transpositions {(1 2)(3 4), (1 3)(2 4), (1 4)(2 3)} form 1 class of size 3.',
          'In A₄ (unlike S₄), (1 2 3) is NOT conjugate to (1 3 2), splitting the eight 3-cycles into two classes of size 4.',
        ],
        answer: '12 = 1 + 3 + 4 + 4.',
      },
      {
        title: 'Example 5: Why Every Group of Order p² is Abelian',
        problem: 'Use Z(G) to prove any group G of order p² (p prime) is abelian.',
        steps: [
          '|Z(G)| > 1 by the Class Equation, and |Z(G)| divides p², so |Z(G)| ∈ {p, p²}.',
          'If |Z(G)| = p, then G/Z(G) has order p, hence is cyclic.',
          'By the G/Z(G) cyclic theorem, G must be abelian, contradicting |Z(G)| = p.',
        ],
        answer: 'Z(G) = G, so G is abelian.',
      },
    ],
    visualExplanation:
      'Picture the group split into orbits under conjugation. Central elements stand alone as singletons; non-central elements cluster into multi-element bubbles whose sizes always divide |G|.',
    commonMistakes: [
      'Assuming elements with the same cycle type in Aₙ are always conjugate in Aₙ (false for 3-cycles in A₄!).',
      'Counting non-central classes twice or forgetting that |Z(G)| counts ALL size-1 classes.',
    ],
    revisionNotes: [
      'Z(G) is always a normal subgroup of G.',
      '|Cl(x)| = [G : C_G(x)] always divides |G|.',
      'Class Equation: |G| = |Z(G)| + ∑ [G : C_G(x_i)].',
    ],
  },
  {
    id: 'quotient-groups',
    number: 6,
    title: 'Quotient Groups and Cayley Tables',
    subtitle: 'Coset multiplication, well-definedness, and quotient element orders',
    estimatedMinutes: 40,
    objectives: [
      'Construct the quotient group G/H when H ◁ G and build its Cayley table.',
      'Prove why quotient multiplication (g₁H)(g₂H) = (g₁g₂)H fails when H is not normal.',
      'Determine the identity coset, inverse cosets, and order of every element gH ∈ G/H.',
      'Verify |G/H| = [G : H] = |G| / |H|.',
    ],
    prerequisites: ['Left and Right Cosets', 'Normal Subgroups'],
    introduction:
      'When H is normal in G, the cosets of H inherit a natural, well-defined group structure called the quotient group G/H. Taking a quotient collapses H to the identity element, revealing a simpler homomorphic image of G.',
    definitions: [
      {
        term: 'Quotient Group G/H',
        latex: 'G/H = \\{gH : g \\in G\\}, \\quad (g_1H)(g_2H) = (g_1g_2)H',
        explanation: 'Defined ONLY when H ◁ G. The identity element is eH = H, and the inverse of gH is g⁻¹H.',
      },
      {
        term: 'Order of a Coset',
        latex: '\\mathrm{ord}_{G/H}(gH) = \\min\\{m \\ge 1 : g^m \\in H\\}',
        explanation: 'The smallest positive power m bringing g^m into H (or smallest m·g ∈ H in additive notation).',
      },
    ],
    theorems: [
      {
        name: 'Well-Definedness Theorem for Quotient Groups',
        statement: 'Coset multiplication (aH)(bH) = (ab)H is well-defined on G/H if and only if H ◁ G.',
        statementLatex: '(aH)(bH) = (ab)H \\text{ well-defined} \\iff H \\trianglelefteq G',
        proof: [
          'If H ◁ G and a₁H = a₂H, b₁H = b₂H, then a₁ = a₂h₁ and b₁ = b₂h₂.',
          'Then a₁b₁ = a₂(h₁b₂)h₂ = a₂(b₂h₁′)h₂ = (a₂b₂)(h₁′h₂) ∈ (a₂b₂)H because b₂⁻¹h₁b₂ ∈ H.',
          'Conversely, if multiplication is well-defined, then for any g ∈ G and h ∈ H, (gH)(g⁻¹H) = (gg⁻¹)H = H, and choosing rep gh ∈ gH gives (ghg⁻¹)H = H, so ghg⁻¹ ∈ H.',
        ],
      },
    ],
    formulas: [
      { label: 'Quotient order', latex: '|G/H| = [G : H] = \\frac{|G|}{|H|}', note: 'Lagrange directly gives the quotient order.' },
      { label: 'Inverse coset', latex: '(gH)^{-1} = g^{-1}H', note: 'Additive notation: -(g + H) = (-g) + H.' },
      { label: 'First Isomorphism Theorem', latex: 'G / \\ker(\\phi) \\cong \\mathrm{im}(\\phi)', note: 'Every quotient group is an isomorphic image of G.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Quotient ℤ₆ / ⟨3⟩',
        problem: 'Construct the Cayley table of ℤ₆ / H where H = {0, 3}.',
        steps: [
          'Cosets: H = {0, 3}, 1+H = {1, 4}, 2+H = {2, 5}.',
          '(1+H) + (1+H) = 2+H; (1+H) + (2+H) = 3+H = H.',
          '(2+H) + (2+H) = 4+H = 1+H.',
        ],
        answer: 'Order-3 cyclic table isomorphic to ℤ₃.',
      },
      {
        title: 'Example 2: Quotient D₄ / ⟨r²⟩',
        problem: 'Compute the elements and orders of D₄ / ⟨r²⟩.',
        steps: [
          'H = {e, r²} ◁ D₄ since H = Z(D₄).',
          'Distinct cosets: H, rH = {r, r³}, sH = {s, r²s}, rsH = {rs, r³s}.',
          'Check squares: r² ∈ H ⇒ ord(rH) = 2; s² = e ∈ H ⇒ ord(sH) = 2; (rs)² = e ∈ H ⇒ ord(rsH) = 2.',
        ],
        answer: 'Every non-identity coset has order 2; D₄/⟨r²⟩ ≅ V₄ ≅ ℤ₂ × ℤ₂.',
      },
      {
        title: 'Example 3: Order of Coset 2 + ⟨4⟩ in ℤ₁₂/⟨4⟩',
        problem: 'Find the order of the coset 2 + H in ℤ₁₂ / H where H = ⟨4⟩ = {0, 4, 8}.',
        steps: [
          '1·2 = 2 ∉ H.',
          '2·2 = 4 ∈ H.',
          'Smallest positive m with 2m ∈ H is m = 2.',
        ],
        answer: 'ord(2 + H) = 2.',
      },
      {
        title: 'Example 4: Why S₃ / ⟨(1 2)⟩ Fails',
        problem: 'Demonstrate concretely why coset multiplication fails for H = {e, (1 2)} in S₃.',
        steps: [
          'Take a = (1 3) and b = (2 3). Notice (1 3)(1 2) = (1 2 3) ∈ aH.',
          'Using rep (1 3): (1 3)(2 3)H = (1 3 2)H = {(1 3 2), (2 3)}.',
          'Using rep (1 2 3) ∈ (1 3)H: (1 2 3)(2 3)H = (1 2)H = H = {e, (1 2)}.',
          'Different representatives in the same coset produce different product cosets!',
        ],
        answer: 'Not well-defined because H is not normal in S₃.',
      },
      {
        title: 'Example 5: S₄ / V₄ ≅ S₃',
        problem: 'Compute the order and structure of S₄ / V₄.',
        steps: [
          '|S₄| = 24 and |V₄| = 4, so |S₄/V₄| = 6.',
          'Pick α = (1 2) and β = (1 2 3).',
          'αV₄ · βV₄ = (1 2)(1 2 3)V₄ = (2 3)V₄, whereas βV₄ · αV₄ = (1 2 3)(1 2)V₄ = (1 3)V₄.',
          'Since (2 3)⁻¹(1 3) = (1 3 2) ∉ V₄, the cosets do not commute! Non-abelian order-6 group ⇒ S₃.',
        ],
        answer: 'S₄/V₄ is non-abelian of order 6, hence S₄/V₄ ≅ S₃.',
      },
    ],
    visualExplanation:
      'Each coset in G/H becomes a single vertex in the quotient Cayley table, collapsing all internal differences inside H into a single identity node.',
    commonMistakes: [
      'Trying to construct G/H when H is not normal in G.',
      'Thinking ord(gH) equals ord(g); in general ord(gH) divides ord(g) and can be strictly smaller!',
      'Using additive notation as multiplicative powers (forgetting g^m in ℤ_n means m·g).',
    ],
    revisionNotes: [
      'Never build G/H without checking H ◁ G first.',
      'ord(gH) = min{m ≥ 1 : g^m ∈ H}.',
      '|G/H| = [G : H].',
    ],
  },
  {
    id: 'classification',
    number: 7,
    title: 'Classification of Quotient Groups',
    subtitle: 'Fundamental Theorem of Finitely Generated Abelian Groups, invariant factors & elementary divisors',
    estimatedMinutes: 40,
    objectives: [
      'Test whether a quotient group G/H is abelian before applying abelian classification.',
      'Compute invariant-factor and elementary-divisor decompositions of finite abelian groups.',
      'Determine whether an abelian quotient group is cyclic using gcd/lcm criteria.',
      'Classify groups such as (ℤ₂ × ℤ₆)/⟨(1,2)⟩ and D₄/⟨r²⟩.',
    ],
    prerequisites: ['Quotient Groups', 'Direct Products', 'Prime Factorization'],
    introduction:
      'Every finite abelian group (and hence every abelian quotient group) decomposes uniquely into a direct product of cyclic groups. The Fundamental Theorem gives two canonical forms—elementary divisors and invariant factors—allowing complete classification up to isomorphism.',
    definitions: [
      {
        term: 'Elementary Divisors',
        latex: 'G \\cong \\mathbb{Z}_{p_1^{a_1}} \\times \\mathbb{Z}_{p_2^{a_2}} \\times \\cdots \\times \\mathbb{Z}_{p_k^{a_k}}',
        explanation: 'Decomposition into cyclic groups of prime-power orders.',
      },
      {
        term: 'Invariant Factors',
        latex: 'G \\cong \\mathbb{Z}_{d_1} \\times \\mathbb{Z}_{d_2} \\times \\cdots \\times \\mathbb{Z}_{d_m}, \\quad d_1 \\mid d_2 \\mid \\cdots \\mid d_m',
        explanation: 'Unique nested divisibility chain obtained by combining coprime prime-power divisors.',
      },
    ],
    theorems: [
      {
        name: 'Fundamental Theorem of Finite Abelian Groups',
        statement: 'Every finite abelian group of order n > 1 is isomorphic to a unique direct product of cyclic groups of prime-power orders (elementary divisors), and also to a unique product ℤ_{d₁} × ⋯ × ℤ_{d_m} with d₁ ∣ d₂ ∣ ⋯ ∣ d_m.',
        statementLatex: 'A \\cong \\prod_{i=1}^m \\mathbb{Z}_{d_i}, \\quad d_1 \\mid d_2 \\mid \\cdots \\mid d_m',
        proof: [
          'Decompose A into its Sylow p-subgroups A = ⊕_p A_p (using Chinese Remainder / primary decomposition).',
          'Each abelian p-group A_p decomposes uniquely into cyclic p-power factors ⊕ ℤ_{p^{e_{p,j}}}.',
          'Aligning the largest prime-power factors across primes yields the invariant factors d_m, d_{m-1}, …, d₁ with d_i ∣ d_{i+1}.',
        ],
      },
    ],
    formulas: [
      { label: 'Chinese Remainder Theorem', latex: '\\gcd(m,n) = 1 \\implies \\mathbb{Z}_m \\times \\mathbb{Z}_n \\cong \\mathbb{Z}_{mn}', note: 'Key rule for converting between invariant factors and elementary divisors.' },
      { label: 'Abelian groups of order p²', latex: '\\mathbb{Z}_{p^2} \\text{ or } \\mathbb{Z}_p \\times \\mathbb{Z}_p', note: 'Distinguished by whether an element of order p² exists.' },
      { label: 'Direct product order', latex: '\\mathrm{ord}(a,b) = \\mathrm{lcm}(\\mathrm{ord}(a), \\mathrm{ord}(b))', note: 'Used to find subgroup and coset orders in direct products.' },
    ],
    solvedExamples: [
      {
        title: 'Example 1: Classify (ℤ₂ × ℤ₆) / ⟨(1, 2)⟩',
        problem: 'Classify the quotient group (ℤ₂ × ℤ₆) / ⟨(1, 2)⟩.',
        steps: [
          'Compute ord(1, 2) in ℤ₂ × ℤ₆: ord(1 in ℤ₂) = 2, ord(2 in ℤ₆) = 3 ⇒ lcm(2, 3) = 6.',
          'Thus |⟨(1, 2)⟩| = 6, and |(ℤ₂ × ℤ₆)/⟨(1, 2)⟩| = 12 / 6 = 2.',
          'Wait! Check the subgroup elements carefully: 1·(1,2)=(1,2), 2·(1,2)=(0,4), 3·(1,2)=(1,0), 4·(1,2)=(0,2), 5·(1,2)=(1,4), 6·(1,2)=(0,0).',
          'Any group of prime order 2 is cyclic, so (ℤ₂ × ℤ₆)/⟨(1, 2)⟩ ≅ ℤ₂!',
        ],
        answer: '(ℤ₂ × ℤ₆)/⟨(1, 2)⟩ ≅ ℤ₂ (cyclic of order 2).',
      },
      {
        title: 'Example 2: Classify (ℤ₄ × ℤ₆) / ⟨(2, 3)⟩',
        problem: 'Classify the abelian quotient group (ℤ₄ × ℤ₆) / ⟨(2, 3)⟩.',
        steps: [
          '|ℤ₄ × ℤ₆| = 24. ord(2, 3) = lcm(2, 2) = 2, so quotient order is 24 / 2 = 12.',
          'Element (1, 1) + H: k(1, 1) ∈ {(0,0), (2,3)} ⇒ k ≡ 0 (mod 4) and k ≡ 0 (mod 6) OR k ≡ 2 (mod 4) and k ≡ 3 (mod 6).',
          'Even k cannot equal 3 mod 6, so we need 12 ∣ k. Thus (1, 1) + H has order 12!',
        ],
        answer: 'Cyclic of order 12: ≅ ℤ₁₂ (invariant factor [12], elementary divisors [3, 4]).',
      },
      {
        title: 'Example 3: Classify D₄ / ⟨r²⟩',
        problem: 'Classify D₄ / ⟨r²⟩ even though D₄ itself is non-abelian.',
        steps: [
          '|D₄ / ⟨r²⟩| = 8 / 2 = 4.',
          'Every group of order 4 is abelian! Check orders: rH, sH, rsH all have order 2.',
          'No element has order 4, so it is not cyclic.',
        ],
        answer: 'D₄ / ⟨r²⟩ ≅ ℤ₂ × ℤ₂ (invariant factors [2, 2]).',
      },
      {
        title: 'Example 4: Elementary Divisors to Invariant Factors',
        problem: 'Convert elementary divisors {2, 2, 4, 3, 9} into invariant factors.',
        steps: [
          'Group by primes descending: p=2 → [4, 2, 2]; p=3 → [9, 3, 1].',
          'Multiply columns from smallest to largest:',
          'd₁ = 2 × 1 = 2; d₂ = 2 × 3 = 6; d₃ = 4 × 9 = 36.',
        ],
        answer: 'Invariant factors: ℤ₂ × ℤ₆ × ℤ₃₆ (order 432).',
      },
      {
        title: 'Example 5: Why S₄ / V₄ Cannot Use FTFGAG',
        problem: 'Can we classify S₄ / V₄ using the Fundamental Theorem of Finite Abelian Groups?',
        steps: [
          'Compute S₄ / V₄: it has order 6 and is non-abelian (since (1 2)V₄ · (1 2 3)V₄ ≠ (1 2 3)V₄ · (1 2)V₄).',
          'FTFGAG applies ONLY to abelian groups.',
        ],
        answer: 'No — S₄/V₄ is non-abelian (≅ S₃), so FTFGAG does not apply.',
      },
    ],
    visualExplanation:
      'The Fundamental Theorem acts like prime factorization for abelian groups: first break the group into prime-power components (elementary divisors), then recombine coprime powers into nested invariant factors.',
    commonMistakes: [
      'Applying the Finite Abelian Classification Theorem to a non-abelian quotient group like S₄/V₄ ≅ S₃.',
      'Writing ℤ₂ × ℤ₃ as an invariant-factor form without noticing gcd(2, 3) = 1 ⇒ ℤ₂ × ℤ₃ ≅ ℤ₆!',
      'Confusing invariant factors (divisibility chain) with elementary divisors (prime powers).',
    ],
    revisionNotes: [
      'Always check abelianness FIRST before applying FTFGAG.',
      'Invariant factors satisfy d₁ ∣ d₂ ∣ ⋯ ∣ d_m.',
      'An abelian group is cyclic iff it has a single invariant factor (all prime-power divisors use distinct primes).',
    ],
  },
];
