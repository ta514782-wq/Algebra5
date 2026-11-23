export interface GlossaryEntry {
  term: string;
  symbol?: string;
  definition: string;
  example: string;
}

export interface FormulaEntry {
  id: string;
  name: string;
  topic: string;
  latex: string;
  explanation: string;
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: 'Abelian Group',
    symbol: 'ab = ba',
    definition: 'A group G in which the binary operation is commutative for every pair of elements a, b ∈ G.',
    example: 'ℤₙ and V₄ are abelian; S₃ and D₄ are non-abelian.',
  },
  {
    term: 'Centralizer',
    symbol: 'C_G(S)',
    definition: 'The subgroup of all elements g ∈ G that commute individually with every element s ∈ S: {g ∈ G : gs = sg ∀ s ∈ S}.',
    example: 'In D₄, C_{D₄}(r) = ⟨r⟩ = {e, r, r², r³}.',
  },
  {
    term: 'Centre',
    symbol: 'Z(G)',
    definition: 'The subgroup of elements in G that commute with every element of G: Z(G) = C_G(G). Always a normal subgroup.',
    example: 'Z(D₄) = {e, r²} and Z(S₃) = {e}.',
  },
  {
    term: 'Class Equation',
    symbol: '|G| = |Z(G)| + ∑ [G : C_G(xᵢ)]',
    definition: 'An identity expressing the order of a finite group as the sum of |Z(G)| and the sizes of all non-central conjugacy classes.',
    example: 'For S₃: 6 = 1 + 2 + 3. For D₄: 8 = 2 + 2 + 2 + 2.',
  },
  {
    term: 'Conjugacy Class',
    symbol: 'Cl(x)',
    definition: 'The set of all conjugates of x in G: Cl(x) = {gxg⁻¹ : g ∈ G}. Conjugacy classes partition G.',
    example: 'In S₃, Cl((1 2)) = {(1 2), (1 3), (2 3)}.',
  },
  {
    term: 'Conjugate',
    symbol: 'gxg⁻¹ / gHg⁻¹',
    definition: 'The result of transforming an element x or subgroup H by g via conjugation gxg⁻¹ or gHg⁻¹.',
    example: 'In S₃, (1 3)(1 2)(1 3)⁻¹ = (2 3).',
  },
  {
    term: 'Coset',
    symbol: 'gH / Hg',
    definition: 'A translate of a subgroup H by an element g ∈ G. Cosets partition G into blocks of equal cardinality |H|.',
    example: 'In ℤ₆ with H = {0, 3}, the cosets are {0, 3}, {1, 4}, and {2, 5}.',
  },
  {
    term: 'Elementary Divisors',
    symbol: 'p₁^{a₁}, …, p_k^{a_k}',
    definition: 'The unique multiset of prime-power cyclic orders whose direct product is isomorphic to a given finite abelian group.',
    example: 'ℤ₁₂ has elementary divisors 4 and 3 (since ℤ₁₂ ≅ ℤ₄ × ℤ₃).',
  },
  {
    term: 'Group',
    symbol: '(G, ·)',
    definition: 'A non-empty set G equipped with an associative binary operation that has an identity element and an inverse for every element.',
    example: 'D₄ (symmetries of a square, order 8) and ℤₙ (integers mod n).',
  },
  {
    term: 'Index',
    symbol: '[G : H]',
    definition: 'The number of distinct left (or right) cosets of subgroup H in G. For finite groups, [G : H] = |G| / |H|.',
    example: '[S₄ : V₄] = 24 / 4 = 6.',
  },
  {
    term: 'Invariant Factors',
    symbol: 'd₁ ∣ d₂ ∣ ⋯ ∣ d_m',
    definition: 'A unique divisibility chain of positive integers ≥ 2 such that a finite abelian group is isomorphic to ℤ_{d₁} × ⋯ × ℤ_{d_m}.',
    example: 'ℤ₂ × ℤ₆ has invariant factors (2, 6) since 2 ∣ 6.',
  },
  {
    term: "Lagrange's Theorem",
    symbol: '|G| = |H| · [G : H]',
    definition: 'Theorem stating that the order of any subgroup H of a finite group G divides the order of G.',
    example: 'A group of order 15 can only have subgroups of orders 1, 3, 5, or 15.',
  },
  {
    term: 'Left Coset',
    symbol: 'gH',
    definition: 'The subset {gh : h ∈ H} formed by multiplying subgroup H on the left by g ∈ G.',
    example: 'In S₃ with H = {e, (1 2)}, (1 3)H = {(1 3), (1 2 3)}.',
  },
  {
    term: 'Normal Subgroup',
    symbol: 'H ◁ G',
    definition: 'A subgroup H ≤ G satisfying gHg⁻¹ = H (equivalently gH = Hg) for every g ∈ G.',
    example: 'A₃ ◁ S₃, V₄ ◁ S₄, and ⟨r²⟩ ◁ D₄.',
  },
  {
    term: 'Normalizer',
    symbol: 'N_G(H)',
    definition: 'The largest subgroup of G in which H is normal: N_G(H) = {g ∈ G : gHg⁻¹ = H}.',
    example: 'In D₄, N_{D₄}(⟨s⟩) = {e, r², s, r²s}.',
  },
  {
    term: 'Quotient Group',
    symbol: 'G/H',
    definition: 'The group of cosets of a normal subgroup H ◁ G under the operation (g₁H)(g₂H) = (g₁g₂)H.',
    example: 'D₄ / ⟨r²⟩ ≅ ℤ₂ × ℤ₂ and S₄ / V₄ ≅ S₃.',
  },
  {
    term: 'Right Coset',
    symbol: 'Hg',
    definition: 'The subset {hg : h ∈ H} formed by multiplying subgroup H on the right by g ∈ G.',
    example: 'In S₃ with H = {e, (1 2)}, H(1 3) = {(1 3), (1 3 2)}.',
  },
  {
    term: 'Subgroup',
    symbol: 'H ≤ G',
    definition: 'A non-empty subset H ⊆ G that forms a group under the same binary operation inherited from G.',
    example: '⟨r⟩ = {e, r, r², r³} is a subgroup of D₄.',
  },
];

export const FORMULA_LIBRARY: FormulaEntry[] = [
  {
    id: 'f1',
    name: 'Left Coset Equality',
    topic: 'Left and Right Cosets',
    latex: 'aH = bH \\iff a^{-1}b \\in H',
    explanation: 'Determines whether two elements generate the exact same left coset without listing all elements.',
  },
  {
    id: 'f2',
    name: 'Right Coset Equality',
    topic: 'Left and Right Cosets',
    latex: 'Ha = Hb \\iff ab^{-1} \\in H',
    explanation: 'Dual condition for right cosets (note the inverse is on the right!).',
  },
  {
    id: 'f3',
    name: "Lagrange's Theorem",
    topic: "Lagrange's Theorem",
    latex: '|G| = |H| \\cdot [G : H]',
    explanation: 'Fundamental counting identity linking group order, subgroup order, and index.',
  },
  {
    id: 'f4',
    name: 'Element Order Divisibility',
    topic: "Lagrange's Theorem",
    latex: '\\mathrm{ord}(g) \\mid |G| \\implies g^{|G|} = e',
    explanation: 'Every element raised to the group order equals the identity.',
  },
  {
    id: 'f5',
    name: 'Index Transitivity',
    topic: "Lagrange's Theorem",
    latex: 'K \\le H \\le G \\implies [G : K] = [G : H][H : K]',
    explanation: 'Multiplicativity of subgroup indices in a tower of subgroups.',
  },
  {
    id: 'f6',
    name: 'Normality via Conjugation',
    topic: 'Normal Subgroups',
    latex: 'H \\trianglelefteq G \\iff \\forall g \\in G,\\; gHg^{-1} = H',
    explanation: 'A subgroup is normal iff it is closed under conjugation by every group element.',
  },
  {
    id: 'f7',
    name: 'Normality via Cosets',
    topic: 'Normal Subgroups',
    latex: 'H \\trianglelefteq G \\iff \\forall g \\in G,\\; gH = Hg',
    explanation: 'Equivalent criterion: every left coset coincides with the corresponding right coset.',
  },
  {
    id: 'f8',
    name: 'Index-2 Normality',
    topic: 'Normal Subgroups',
    latex: '[G : H] = 2 \\implies H \\trianglelefteq G',
    explanation: 'Every subgroup of index 2 is automatically normal.',
  },
  {
    id: 'f9',
    name: 'Normalizer Definition',
    topic: 'Normalizers & Centralizers',
    latex: 'N_G(H) = \\{g \\in G : gHg^{-1} = H\\}',
    explanation: 'Largest subgroup of G containing H as a normal subgroup.',
  },
  {
    id: 'f10',
    name: 'Centralizer Definition',
    topic: 'Normalizers & Centralizers',
    latex: 'C_G(S) = \\{g \\in G : gs = sg \\;\\forall s \\in S\\}',
    explanation: 'Subgroup of elements commuting individually with every element of S.',
  },
  {
    id: 'f11',
    name: 'Number of Conjugate Subgroups',
    topic: 'Normalizers & Centralizers',
    latex: '|\\{gHg^{-1} : g \\in G\\}| = [G : N_G(H)]',
    explanation: 'Counts distinct conjugates of H in G.',
  },
  {
    id: 'f12',
    name: 'Centre of a Group',
    topic: 'Centre & Conjugacy Classes',
    latex: 'Z(G) = C_G(G) = \\bigcap_{x \\in G} C_G(x) \\trianglelefteq G',
    explanation: 'Elements commuting with everything in G.',
  },
  {
    id: 'f13',
    name: 'Conjugacy Class Size',
    topic: 'Centre & Conjugacy Classes',
    latex: '|\\mathrm{Cl}(x)| = [G : C_G(x)]',
    explanation: 'Size of each conjugacy class equals the index of its representative’s centralizer.',
  },
  {
    id: 'f14',
    name: 'The Class Equation',
    topic: 'Centre & Conjugacy Classes',
    latex: '|G| = |Z(G)| + \\sum_{i} [G : C_G(x_i)]',
    explanation: 'Separates central singletons from non-central conjugacy classes.',
  },
  {
    id: 'f15',
    name: 'Quotient Multiplication',
    topic: 'Quotient Groups',
    latex: '(g_1H)(g_2H) = (g_1g_2)H \\quad (H \\trianglelefteq G)',
    explanation: 'Binary operation on G/H; well-defined iff H is normal.',
  },
  {
    id: 'f16',
    name: 'Coset Element Order',
    topic: 'Quotient Groups',
    latex: '\\mathrm{ord}_{G/H}(gH) = \\min\\{m \\ge 1 : g^m \\in H\\}',
    explanation: 'Exact order of a coset inside the quotient group G/H.',
  },
  {
    id: 'f17',
    name: 'Chinese Remainder Isomorphism',
    topic: 'Classification of Quotient Groups',
    latex: '\\mathbb{Z}_m \\times \\mathbb{Z}_n \\cong \\mathbb{Z}_{mn} \\iff \\gcd(m, n) = 1',
    explanation: 'Criterion for combining cyclic factors of coprime orders.',
  },
  {
    id: 'f18',
    name: 'Fundamental Theorem of Finite Abelian Groups',
    topic: 'Classification of Quotient Groups',
    latex: 'A \\cong \\mathbb{Z}_{d_1} \\times \\mathbb{Z}_{d_2} \\times \\cdots \\times \\mathbb{Z}_{d_m}, \\quad d_1 \\mid d_2 \\mid \\cdots \\mid d_m',
    explanation: 'Unique canonical invariant-factor decomposition for finite abelian groups.',
  },
];
