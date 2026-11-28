import { PROOF_THEOREM_CATALOG, ProofTheoremId } from '../core/proofAssistantEngine.ts';
import { REAL_WORLD_SCENARIOS } from '../core/realWorldEngine.ts';
import { ARTIFACT2_EXERCISES } from '../data/artifact2Exercises.ts';
import { FORMULA_LIBRARY, GLOSSARY_ENTRIES } from '../data/glossaryAndFormulas.ts';
import { LEARNING_TOPICS, LearningTopic } from '../data/topics.ts';

export type SidebarSearchCategory =
  | 'Lab'
  | 'Concept'
  | 'Proof'
  | 'Formula'
  | 'Glossary'
  | 'Exercise'
  | 'Real-World';

export interface SidebarSearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: SidebarSearchCategory;
  targetPage: string;
  topicId?: string;
  referenceQuery?: string;
  formulaTab?: 'formulas' | 'cheatsheet';
  theoremId?: ProofTheoremId;
  keywords: string;
}

const LAB_AND_WORKSPACE_INDEX: SidebarSearchItem[] = [
  {
    id: 'nav-dashboard',
    title: 'Overview Dashboard',
    subtitle: 'Progress strip, daily streak, simulators & recent activity',
    category: 'Lab',
    targetPage: 'dashboard',
    keywords: 'home overview metrics progress streak daily challenge dashboard',
  },
  {
    id: 'nav-group-explorer',
    title: 'Group Explorer',
    subtitle: 'Axioms, Cayley tables, element orders & custom groups',
    category: 'Lab',
    targetPage: 'group-explorer',
    keywords: 'cayley table closure associativity identity inverses abelian cyclic dihedral symmetric quaternion custom group',
  },
  {
    id: 'nav-subgroups',
    title: 'Subgroup Finder & Lattice',
    subtitle: 'Subset axiom validator, ⟨S⟩ closure & D3 Hasse lattice',
    category: 'Lab',
    targetPage: 'subgroups',
    keywords: 'subgroup finder validator closure generator lattice hasse diagram subset criterion',
  },
  {
    id: 'nav-cosets',
    title: 'Coset Visualizer',
    subtitle: 'Left cosets gH, right cosets Hg, partition & membership tester',
    category: 'Lab',
    targetPage: 'cosets',
    keywords: 'coset left right gH Hg partition index representative membership equivalence',
  },
  {
    id: 'nav-lagrange',
    title: 'Lagrange Verifier',
    subtitle: '|G| = |H| × [G:H] & A₄ order-6 converse counterexample',
    category: 'Lab',
    targetPage: 'lagrange',
    keywords: 'lagrange theorem order divides index converse counterexample A4 subgroup of order 6',
  },
  {
    id: 'nav-normality',
    title: 'Normality Tester',
    subtitle: 'Conjugation gHg⁻¹ = H & coset equality witnesses',
    category: 'Lab',
    targetPage: 'normality',
    keywords: 'normal subgroup triangle conjugate gHg^-1 witness non-normal',
  },
  {
    id: 'nav-normalizer',
    title: 'Normalizer Calculator N_G(H)',
    subtitle: 'Largest subgroup normalizing H & conjugate orbits',
    category: 'Lab',
    targetPage: 'normalizer',
    keywords: 'normalizer N_G(H) conjugate subgroup orbit stabilizer',
  },
  {
    id: 'nav-centralizer',
    title: 'Centralizer Calculator C_G(S)',
    subtitle: 'Elements commuting with every member of subset S',
    category: 'Lab',
    targetPage: 'centralizer',
    keywords: 'centralizer C_G(S) C_G(a) commute gs=sg',
  },
  {
    id: 'nav-centre',
    title: 'Centre Calculator Z(G)',
    subtitle: 'Global commuting elements & Z(G) ◁ G verification',
    category: 'Lab',
    targetPage: 'centre',
    keywords: 'centre center Z(G) commuting elements normal',
  },
  {
    id: 'nav-quotient',
    title: 'Quotient Group Builder G/H',
    subtitle: 'Well-definedness check, quotient Cayley table & coset orders',
    category: 'Lab',
    targetPage: 'quotient',
    keywords: 'quotient factor group G/H G/N well-defined coset multiplication cayley table',
  },
  {
    id: 'nav-homomorphism',
    title: 'First Isomorphism & Homomorphisms',
    subtitle: 'Kernel ker(φ), image Im(φ) & G/ker(φ) ≅ Im(φ)',
    category: 'Lab',
    targetPage: 'homomorphism',
    keywords: 'homomorphism isomorphism kernel image injective surjective bijection first isomorphism theorem',
  },
  {
    id: 'nav-sylow',
    title: 'Sylow & Cayley Lab',
    subtitle: 'Sylow p-subgroups n_p & Cayley regular embedding G ↪ Sₙ',
    category: 'Lab',
    targetPage: 'sylow',
    keywords: 'sylow theorems p-subgroup np congruence cayley embedding Sn permutation',
  },
  {
    id: 'nav-classification',
    title: 'Abelian Group Classifier (FTFGAG)',
    subtitle: 'Invariant factors & elementary divisors for finite abelian groups',
    category: 'Lab',
    targetPage: 'classification',
    keywords: 'ftfgag classification finite abelian invariant factors elementary divisors primary decomposition',
  },
  {
    id: 'nav-conjugacy',
    title: 'Conjugacy Classes & Class Equation',
    subtitle: 'Conjugation orbits, class sizes & |G| = |Z(G)| + ∑[G:C_G(x)]',
    category: 'Lab',
    targetPage: 'conjugacy',
    keywords: 'conjugacy class equation orbit stabilizer centralizer',
  },
  {
    id: 'nav-compare',
    title: 'Group Comparison',
    subtitle: 'Side-by-side structural invariants & explicit isomorphism search',
    category: 'Lab',
    targetPage: 'compare',
    keywords: 'compare two groups isomorphic D4 Q8 Z4 V4 invariant',
  },
  {
    id: 'nav-solver',
    title: 'Step-by-Step Solver',
    subtitle: 'Symbolic & LaTeX-exportable solutions for active groups',
    category: 'Lab',
    targetPage: 'solver',
    keywords: 'step by step solver latex export calculation',
  },
  {
    id: 'nav-proof-assistant',
    title: 'Mathematical Proof Assistant',
    subtitle: 'Structured theorem proofs with live active-group verification',
    category: 'Proof',
    targetPage: 'proof-assistant',
    keywords: 'proof assistant theorem given strategy conclusion derivation',
  },
  {
    id: 'nav-tutor',
    title: 'AI Algebra Tutor',
    subtitle: 'Interactive Q&A, mistake checking & practice generation',
    category: 'Lab',
    targetPage: 'tutor',
    keywords: 'ai tutor chat explain mistake check practice question',
  },
  {
    id: 'nav-practice',
    title: 'Practice MCQs & Lightning Sprint',
    subtitle: '700 verified non-repeating questions & 60s challenge',
    category: 'Lab',
    targetPage: 'practice',
    keywords: 'practice quiz mcq 700 questions lightning sprint non-repeating',
  },
  {
    id: 'nav-exams',
    title: 'Mock Examinations',
    subtitle: 'Timed 10, 20, 30, 50 & 70-question exams with review modal',
    category: 'Lab',
    targetPage: 'exams',
    keywords: 'mock exam timed examination test review score',
  },
  {
    id: 'nav-mistakes',
    title: 'Mistake Notebook',
    subtitle: 'Targeted revision of missed practice & exam questions',
    category: 'Lab',
    targetPage: 'mistakes',
    keywords: 'mistake notebook wrong answers revision mastered',
  },
  {
    id: 'nav-progress',
    title: 'Student Progress & Analytics',
    subtitle: 'Strong/weak topics, study time, charts & Local Demo Mode',
    category: 'Lab',
    targetPage: 'progress',
    keywords: 'student progress analytics charts strong weak topics csv pdf export demo mode',
  },
  {
    id: 'nav-teacher',
    title: 'Teacher / Admin Panel',
    subtitle: 'Create modules, edit notes/MCQs, CSV/JSON import & class analytics',
    category: 'Lab',
    targetPage: 'teacher',
    keywords: 'teacher admin instructor create module edit note csv json import roster',
  },
  {
    id: 'nav-visual-cheat-sheet',
    title: 'Visual Cheat Sheet (D3 Diagrams)',
    subtitle: 'Interactive D3 Cayley tables, subgroup lattices & conjugacy charts',
    category: 'Formula',
    targetPage: 'formulas',
    formulaTab: 'cheatsheet',
    keywords: 'visual cheat sheet d3 diagram cayley lattice conjugacy interactive',
  },
  {
    id: 'nav-about',
    title: 'About & Live Verification Certificate',
    subtitle: '10 automated mathematical verification suites & walkthroughs',
    category: 'Lab',
    targetPage: 'about',
    keywords: 'about verification certificate test suites architecture',
  },
];

export function buildSidebarSearchIndex(customTopics: LearningTopic[] = []): SidebarSearchItem[] {
  const items: SidebarSearchItem[] = [...LAB_AND_WORKSPACE_INDEX];

  const allTopics = [...LEARNING_TOPICS, ...customTopics];
  for (const t of allTopics) {
    const defTerms = t.definitions.map((d) => `${d.term} ${d.explanation}`).join(' ');
    const thTerms = t.theorems.map((th) => `${th.name} ${th.statement}`).join(' ');
    const formTerms = t.formulas.map((f) => `${f.label} ${f.note}`).join(' ');
    items.push({
      id: `topic-${t.id}`,
      title: `${t.number}. ${t.title}`,
      subtitle: t.subtitle,
      category: 'Concept',
      targetPage: 'learn',
      topicId: t.id,
      keywords: `${t.introduction} ${t.objectives.join(' ')} ${defTerms} ${thTerms} ${formTerms} ${t.commonMistakes.join(' ')}`,
    });
  }

  for (const th of PROOF_THEOREM_CATALOG) {
    items.push({
      id: `proof-${th.id}`,
      title: th.title,
      subtitle: `Proof Assistant · ${th.topicTag}`,
      category: 'Proof',
      targetPage: 'proof-assistant',
      theoremId: th.id,
      keywords: `proof theorem ${th.topicTag} ${th.id}`,
    });
  }

  for (const ex of ARTIFACT2_EXERCISES) {
    items.push({
      id: `artifact2-${ex.id}`,
      title: `Guided Problem ${ex.number}: ${ex.title}`,
      subtitle: `${ex.groupInputLabel}`,
      category: 'Exercise',
      targetPage: 'artifact2',
      keywords: `${ex.statement} ${ex.background} ${ex.groupInputLabel} ${ex.subgroupInputLabel} ${ex.finalResult} professor guided artifact 2`,
    });
  }

  for (const rw of REAL_WORLD_SCENARIOS) {
    items.push({
      id: `rw-${rw.id}`,
      title: rw.title,
      subtitle: `${rw.domain} · ${rw.algebraTopic.replace(/\$[^$]*\$/g, '').trim()}`,
      category: 'Real-World',
      targetPage: 'real-world',
      topicId: rw.id,
      keywords: `${rw.domain} ${rw.algebraTopic} ${rw.summary} ${rw.whereUsed.join(' ')}`,
    });
  }

  for (const f of FORMULA_LIBRARY) {
    items.push({
      id: `formula-${f.id}`,
      title: f.name,
      subtitle: `Formula · ${f.topic}`,
      category: 'Formula',
      targetPage: 'formulas',
      referenceQuery: f.name,
      formulaTab: 'formulas',
      keywords: `${f.topic} ${f.explanation} ${f.latex}`,
    });
  }

  for (const g of GLOSSARY_ENTRIES) {
    items.push({
      id: `glossary-${g.term}`,
      title: g.term,
      subtitle: g.symbol ? `Glossary · ${g.symbol}` : 'Glossary Definition',
      category: 'Glossary',
      targetPage: 'glossary',
      referenceQuery: g.term,
      keywords: `${g.symbol ?? ''} ${g.definition} ${g.example}`,
    });
  }

  return items;
}

export function searchSidebarIndex(
  index: SidebarSearchItem[],
  rawQuery: string,
  limit = 24
): SidebarSearchItem[] {
  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) return [];
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  const scored: Array<{ item: SidebarSearchItem; score: number }> = [];
  for (const item of index) {
    const titleLower = item.title.toLowerCase();
    const subLower = item.subtitle.toLowerCase();
    const keyLower = item.keywords.toLowerCase();
    const catLower = item.category.toLowerCase();
    const combined = `${titleLower} ${subLower} ${catLower} ${keyLower}`;

    let allMatch = true;
    for (const tok of tokens) {
      if (!combined.includes(tok)) {
        allMatch = false;
        break;
      }
    }
    if (!allMatch) continue;

    let score = 0;
    if (titleLower === trimmed) score += 120;
    else if (titleLower.startsWith(trimmed)) score += 80;
    else if (titleLower.includes(trimmed)) score += 55;

    for (const tok of tokens) {
      if (titleLower.includes(tok)) score += 25;
      else if (subLower.includes(tok)) score += 12;
      else if (catLower.includes(tok)) score += 8;
      else score += 4;
    }

    if (item.category === 'Lab' || item.category === 'Concept') score += 6;
    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  return scored.slice(0, limit).map((entry) => entry.item);
}
