import { calculateCentralizer } from './centralizerEngine.ts';
import { calculateCentre } from './centreEngine.ts';
import { classifyAbelianGroup } from './classificationEngine.ts';
import { analyzeCosets } from './cosetEngine.ts';
import {
  buildAlternatingGroup,
  buildCyclicGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildQuaternionGroup,
  buildSymmetricGroup,
  generateSubgroupFromElements,
} from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { verifyLagrangeTheorem } from './lagrangeEngine.ts';
import { analyzeNormality } from './normalityEngine.ts';
import { calculateNormalizer } from './normalizerEngine.ts';
import { buildQuotientGroup } from './quotientEngine.ts';

export type RealWorldScenarioId =
  | 'error-correcting-codes'
  | 'molecular-crystallography'
  | 'shift-scheduling'
  | 'quantum-commutation'
  | 'network-quotient'
  | 'signal-ftfgag';

export interface RealWorldScenarioMeta {
  id: RealWorldScenarioId;
  title: string;
  domain: string;
  algebraTopic: string;
  summary: string;
  targetLabPage: string;
  whereUsed: string[];
  algebraMapping: Array<{ mathSymbol: string; realWorldMeaning: string }>;
  keyInsight: string;
}

export const REAL_WORLD_SCENARIOS: RealWorldScenarioMeta[] = [
  {
    id: 'error-correcting-codes',
    title: 'Satellite Error-Correcting Codes',
    domain: 'Telecommunications & Deep-Space Data',
    algebraTopic: 'Left & Right Cosets ($\\mathbb{Z}_2^n / C$)',
    summary:
      'Linear binary codes form a subgroup $C$ inside $\\mathbb{Z}_2^n$. Every corrupted transmission lands in a coset $r + C$ whose unique minimum-weight coset leader identifies the exact flipped bit.',
    targetLabPage: 'cosets',
    whereUsed: [
      'NASA Voyager & Mars Rover deep-space telemetry links',
      'ECC server RAM (Hamming single-error correction)',
      'QR codes and 5G wireless control channels',
    ],
    algebraMapping: [
      { mathSymbol: 'G = \\mathbb{Z}_2^3', realWorldMeaning: 'All 8 possible 3-bit received packets' },
      { mathSymbol: 'C = \\{(0,0,0), (1,1,1)\\}', realWorldMeaning: 'Valid noise-free codewords' },
      { mathSymbol: 'r + C', realWorldMeaning: 'Coset of vectors sharing the same parity syndrome' },
    ],
    keyInsight:
      'Because distinct cosets partition $\\mathbb{Z}_2^3$, every single-bit error falls into its own unique coset with a unique minimum-weight coset leader $e$, guaranteeing exact recovery $r - e \\in C$.',
  },
  {
    id: 'molecular-crystallography',
    title: 'Molecular Symmetry & Crystal Axes',
    domain: 'Chemistry, Materials & Robotics',
    algebraTopic: 'Dihedral Groups $D_n$ & Normalizer $N_G(H)$',
    summary:
      'Polygonal molecules and symmetric robot grippers form $D_n$. The normalizer $N_G(H)$ governs how many distinct conjugate mirror or rotation axes exist across the crystal lattice.',
    targetLabPage: 'normalizer',
    whereUsed: [
      'X-ray crystallography & crystal point-group classification',
      'Molecular orbital & infrared spectroscopy selection rules (e.g. $D_6$ for benzene)',
      'Symmetric multi-finger robotic assembly grippers',
    ],
    algebraMapping: [
      { mathSymbol: 'G = D_n', realWorldMeaning: 'All $2n$ physical rotations & reflections of the molecule' },
      { mathSymbol: 'H \\le D_n', realWorldMeaning: 'Local symmetry axis or bond subgroup being studied' },
      { mathSymbol: '[G : N_G(H)]', realWorldMeaning: 'Exact count of distinct conjugate bond orientations' },
    ],
    keyInsight:
      'A local symmetry $H$ is global across the whole crystal ($H \\trianglelefteq D_n$) iff $N_{D_n}(H) = D_n$; otherwise it splits into $[D_n : N_{D_n}(H)]$ physically equivalent conjugate axes.',
  },
  {
    id: 'shift-scheduling',
    title: 'Modular Shift & Key-Cycle Scheduling',
    domain: 'Operations Research & Cryptography',
    algebraTopic: "Lagrange's Theorem in Cyclic Groups $\\mathbb{Z}_n$",
    summary:
      'Repeating a $k$-hour rotation across an $n$-hour cycle generates a subgroup $\\langle k \\rangle$ of size $n / \\gcd(n, k)$ and partitions workers into $\\gcd(n, k)$ non-overlapping coset teams.',
    targetLabPage: 'lagrange',
    whereUsed: [
      '24/7 hospital, air-traffic, and factory crew shift rotations',
      'Cryptographic Diffie-Hellman & stream-cipher key cycles',
      'Interleaved cache-bank & round-robin disk scheduling',
    ],
    algebraMapping: [
      { mathSymbol: 'G = \\mathbb{Z}_n', realWorldMeaning: 'All $n$ periodic time slots or clock positions' },
      { mathSymbol: 'H = \\langle k \\rangle', realWorldMeaning: 'Slots reached by one team stepping $+k \\pmod n$' },
      { mathSymbol: '[\\mathbb{Z}_n : \\langle k \\rangle] = \\gcd(n,k)', realWorldMeaning: 'Minimum disjoint teams needed for 100% coverage' },
    ],
    keyInsight:
      'Lagrange’s Equation $|\\mathbb{Z}_n| = |\\langle k \\rangle| \\cdot [\\mathbb{Z}_n : \\langle k \\rangle]$ guarantees all teams have equal workload and cover every slot with zero overlap.',
  },
  {
    id: 'quantum-commutation',
    title: 'Quantum Gate & Robot Move Commutation',
    domain: 'Quantum Computing & Motion Planning',
    algebraTopic: 'Centralizer $C_G(S)$ & Centre $Z(G)$',
    summary:
      'Non-abelian operations rarely commute. Computing $C_G(S)$ identifies every gate or joint move that safely commutes with target operations $S$ without scrambling the outcome.',
    targetLabPage: 'centralizer',
    whereUsed: [
      'Quantum circuit optimization & parallel gate scheduling (Pauli / $Q_8$ gates)',
      'Rigid-body 3D orientation & quaternion robotics ($SO(3)$ / $Q_8$)',
      'Database transaction concurrency & lock-free command reordering',
    ],
    algebraMapping: [
      { mathSymbol: 'G', realWorldMeaning: 'Full set of hardware gates or mechanical moves' },
      { mathSymbol: 'C_G(x)', realWorldMeaning: 'Operations safe to swap or run in parallel with $x$' },
      { mathSymbol: 'Z(G)', realWorldMeaning: 'Globally safe moves commuting with every operation' },
    ],
    keyInsight:
      'Only moves inside $C_G(x)$ can be reordered around $x$ without changing the physical state; moves outside $C_G(x)$ cause explicit order-dependent conflicts ($gx \\neq xg$).',
  },
  {
    id: 'network-quotient',
    title: 'Server Cluster Quotient Routing',
    domain: 'Distributed Systems & Switch Fabrics',
    algebraTopic: 'Normal Subgroups & Quotient Groups $G / H$',
    summary:
      'Collapsing redundant servers $H$ into a single coarse-grained super-router $G / H$ preserves deterministic packet routing if and only if $H$ is normal in $G$.',
    targetLabPage: 'quotient',
    whereUsed: [
      'Hierarchical BGP Autonomous System route aggregation',
      'Fault-tolerant distributed state-machine replication & sharding',
      'Hierarchical permutation switch fabrics ($S_4 / V_4 \\cong S_3$)',
    ],
    algebraMapping: [
      { mathSymbol: 'G', realWorldMeaning: 'Fine-grained network permutation states' },
      { mathSymbol: 'H \\le G', realWorldMeaning: 'Redundant local cluster collapsed into one virtual node' },
      { mathSymbol: 'G / H', realWorldMeaning: 'Coarse super-router (well-defined iff $H \\trianglelefteq G$)' },
    ],
    keyInsight:
      'If $H$ is non-normal, two equivalent states inside the same cluster $aH$ route to different target clusters—proving why normality is the exact mathematical condition for clean abstraction.',
  },
  {
    id: 'signal-ftfgag',
    title: 'Multi-Channel Clock & Memory Synchronization',
    domain: 'Digital Audio & Embedded Hardware',
    algebraTopic: 'Finite Abelian Classification (FTFGAG)',
    summary:
      'Combining two periodic hardware clocks of lengths $n_1$ and $n_2$ forms $\\mathbb{Z}_{n_1} \\times \\mathbb{Z}_{n_2}$. Elementary divisors reveal when channels merge into a single cyclic master clock.',
    targetLabPage: 'classification',
    whereUsed: [
      'FPGA dual-clock phase-locked loop (PLL) & sample-rate synchronization',
      'Polyphonic rhythm & digital audio buffer period calculation',
      'CRT modular arithmetic accelerators in embedded DSP chips',
    ],
    algebraMapping: [
      { mathSymbol: '\\mathbb{Z}_{n_1} \\times \\mathbb{Z}_{n_2}', realWorldMeaning: 'Combined $(n_1 \\cdot n_2)$-state dual-channel hardware bus' },
      { mathSymbol: '\\mathrm{lcm}(n_1, n_2)', realWorldMeaning: 'Longest cycle reached by a single shared clock pulse $(1,1)$' },
      { mathSymbol: '\\gcd(n_1, n_2) = 1', realWorldMeaning: 'Chinese Remainder condition for 100% single-clock reachability' },
    ],
    keyInsight:
      'By FTFGAG and CRT, $\\mathbb{Z}_{n_1} \\times \\mathbb{Z}_{n_2} \\cong \\mathbb{Z}_{n_1 n_2}$ iff $\\gcd(n_1, n_2) = 1$; otherwise the state grid fractures into $\\gcd(n_1, n_2)$ isolated tracks.',
  },
];

// 1. Error-Correcting Codes over Z_2^3
export interface CosetLookupRow {
  cosetLabel: string;
  leader: string;
  syndrome: [number, number];
  members: string[];
  isMatched: boolean;
}

export interface ErrorCodeSimulation {
  group: FiniteGroup;
  codebookIndices: number[];
  codebookLabels: string[];
  transmittedLabel: string;
  errorMaskLabel: string;
  receivedLabel: string;
  syndrome: [number, number];
  cosetLabels: string[];
  cosetLeaderLabel: string;
  recoveredLabel: string;
  singleBitCorrected: boolean;
  cosetIndex: number;
  allCosets: CosetLookupRow[];
}

function tupleToLabel(bits: [number, number, number]): string {
  return `(${bits[0]},${bits[1]},${bits[2]})`;
}

function parseTupleBits(label: string): [number, number, number] {
  const nums = label.replace(/[()]/g, '').split(',').map(Number);
  return [(nums[0] ?? 0) & 1, (nums[1] ?? 0) & 1, (nums[2] ?? 0) & 1];
}

function hammingWeight(label: string): number {
  let w = 0;
  for (const ch of label) {
    if (ch === '1') w++;
  }
  return w;
}

export function simulateErrorCorrectingCode(
  messageBit: 0 | 1,
  flippedBitIndex: 0 | 1 | 2 | 3
): ErrorCodeSimulation {
  const group = buildDirectProductCyclic([2, 2, 2]);
  const c0 = group.elements.indexOf('(0,0,0)');
  const c1 = group.elements.indexOf('(1,1,1)');
  const codebookIndices = [c0, c1];
  const transmittedBits: [number, number, number] = messageBit === 1 ? [1, 1, 1] : [0, 0, 0];
  const errorBits: [number, number, number] = [
    flippedBitIndex === 1 ? 1 : 0,
    flippedBitIndex === 2 ? 1 : 0,
    flippedBitIndex === 3 ? 1 : 0,
  ];
  const receivedBits: [number, number, number] = [
    (transmittedBits[0] ^ errorBits[0]) as 0 | 1,
    (transmittedBits[1] ^ errorBits[1]) as 0 | 1,
    (transmittedBits[2] ^ errorBits[2]) as 0 | 1,
  ];

  const receivedLabel = tupleToLabel(receivedBits);
  const receivedIdx = group.elements.indexOf(receivedLabel);
  const cosets = analyzeCosets(group, codebookIndices);
  const matchedCoset = cosets.leftCosets[receivedIdx];

  const s1 = (receivedBits[0] ^ receivedBits[1]) as 0 | 1;
  const s2 = (receivedBits[0] ^ receivedBits[2]) as 0 | 1;

  const sortedByWeight = [...matchedCoset.elementLabels].sort(
    (a, b) => hammingWeight(a) - hammingWeight(b)
  );
  const cosetLeaderLabel = sortedByWeight[0];
  const leaderIdx = group.elements.indexOf(cosetLeaderLabel);
  const recoveredIdx = group.table[receivedIdx][group.inverses[leaderIdx]];

  const allCosets: CosetLookupRow[] = cosets.distinctLeftCosets.map((c) => {
    const sorted = [...c.elementLabels].sort((a, b) => hammingWeight(a) - hammingWeight(b));
    const leader = sorted[0];
    const bits = parseTupleBits(leader);
    return {
      cosetLabel: `${leader} + C`,
      leader,
      syndrome: [bits[0] ^ bits[1], bits[0] ^ bits[2]],
      members: c.elementLabels,
      isMatched: c.elementLabels.includes(receivedLabel),
    };
  });

  return {
    group,
    codebookIndices,
    codebookLabels: codebookIndices.map((i) => group.elements[i]),
    transmittedLabel: tupleToLabel(transmittedBits),
    errorMaskLabel: tupleToLabel(errorBits),
    receivedLabel,
    syndrome: [s1, s2],
    cosetLabels: matchedCoset.elementLabels,
    cosetLeaderLabel,
    recoveredLabel: group.elements[recoveredIdx],
    singleBitCorrected: group.elements[recoveredIdx] === tupleToLabel(transmittedBits),
    cosetIndex: cosets.index,
    allCosets,
  };
}

// 2. Molecular Symmetry & Crystallography (D_n)
export interface MolecularSymmetrySimulation {
  group: FiniteGroup;
  polygonSides: number;
  axisMode: 'reflection-s' | 'rotation-r2' | 'full-rotations';
  rotationAngleDeg: number;
  subgroupIndices: number[];
  subgroupLabels: string[];
  isNormal: boolean;
  normalizerLabels: string[];
  normalizerOrder: number;
  distinctConjugateCount: number;
  conjugateAxesLabels: string[][];
  moleculeName: string;
}

export function simulateMolecularSymmetry(
  polygonSides: number,
  axisMode: 'reflection-s' | 'rotation-r2' | 'full-rotations'
): MolecularSymmetrySimulation {
  const n = Math.max(3, Math.min(8, Math.round(polygonSides)));
  const group = buildDihedralGroup(n);
  let genLabel = 's';
  if (axisMode === 'rotation-r2') {
    genLabel = n >= 3 ? (n === 2 ? 'r' : 'r²') : 'r';
    if (group.elements.indexOf(genLabel) === -1) genLabel = 'r';
  } else if (axisMode === 'full-rotations') {
    genLabel = 'r';
  }

  const genIdx = group.elements.indexOf(genLabel);
  const subgroupIndices = generateSubgroupFromElements(group, [genIdx >= 0 ? genIdx : 0]);
  const normality = analyzeNormality(group, subgroupIndices);
  const normalizer = calculateNormalizer(group, subgroupIndices);

  const moleculeNames: Record<number, string> = {
    3: 'Trigonal Planar (BF₃ / NH₃)',
    4: 'Square Planar Complex (XeF₄)',
    5: 'Pentagonal Ring (Cyclopentadienyl)',
    6: 'Hexagonal Aromatic Ring (Benzene C₆H₆)',
    7: 'Heptagonal Rotor (7-fold)',
    8: 'Octagonal Crystal Cage (8-fold)',
  };

  return {
    group,
    polygonSides: n,
    axisMode,
    rotationAngleDeg: Math.round((360 / n) * 10) / 10,
    subgroupIndices,
    subgroupLabels: subgroupIndices.map((i) => group.elements[i]),
    isNormal: normality.isNormal,
    normalizerLabels: normalizer.normalizerLabels,
    normalizerOrder: normalizer.normalizerOrder,
    distinctConjugateCount: normalizer.conjugateOrbitPartition.length,
    conjugateAxesLabels: normalizer.conjugateOrbitPartition.map((o) => o.conjugateLabels),
    moleculeName: moleculeNames[n] || `${n}-gon Symmetric Structure`,
  };
}

// 3. Modular Shift & Key-Cycle Scheduling (Z_n)
export interface ShiftSchedulingSimulation {
  group: FiniteGroup;
  cycleHours: number;
  stepSize: number;
  subgroupIndices: number[];
  subgroupLabels: string[];
  cycleLength: number;
  teamCount: number;
  distinctCosets: string[][];
  slotTeamMap: number[];
  lagrangeVerified: boolean;
  coversAllSlots: boolean;
}

export function simulateShiftScheduling(
  cycleHours: number,
  stepSize: number
): ShiftSchedulingSimulation {
  const n = Math.max(4, Math.min(24, Math.round(cycleHours)));
  const k = ((Math.round(stepSize) % n) + n) % n;
  const group = buildCyclicGroup(n);
  const genIdx = group.elements.indexOf(String(k));
  const subgroupIndices = generateSubgroupFromElements(group, [genIdx >= 0 ? genIdx : 0]);
  const cosets = analyzeCosets(group, subgroupIndices);
  const lagrange = verifyLagrangeTheorem(group, subgroupIndices);

  const distinctCosets = cosets.distinctLeftCosets.map((c) => c.elementLabels);
  const slotTeamMap: number[] = Array(n).fill(0);
  distinctCosets.forEach((coset, teamIdx) => {
    coset.forEach((lbl) => {
      const slot = Number(lbl);
      if (Number.isInteger(slot) && slot >= 0 && slot < n) {
        slotTeamMap[slot] = teamIdx;
      }
    });
  });

  return {
    group,
    cycleHours: n,
    stepSize: k,
    subgroupIndices,
    subgroupLabels: subgroupIndices.map((i) => group.elements[i]),
    cycleLength: subgroupIndices.length,
    teamCount: cosets.index,
    distinctCosets,
    slotTeamMap,
    lagrangeVerified: lagrange.equationVerified,
    coversAllSlots: subgroupIndices.length === n,
  };
}

// 4. Quantum Gate & Robot Move Commutation (Centralizer & Centre)
export interface CommutationOperationRow {
  gLabel: string;
  commutes: boolean;
  gxLabel: string;
  xgLabel: string;
}

export interface CommutationSimulation {
  group: FiniteGroup;
  targetIndices: number[];
  targetLabels: string[];
  centralizerLabels: string[];
  centralizerOrder: number;
  centreLabels: string[];
  centreOrder: number;
  nonCommutingExamples: Array<{ gLabel: string; witness: string }>;
  allOperations: CommutationOperationRow[];
}

export function simulateQuantumCommutation(
  systemKey: 'D_4' | 'S_3' | 'Q_8',
  targetElementLabel: string
): CommutationSimulation {
  const group =
    systemKey === 'S_3'
      ? buildSymmetricGroup(3)
      : systemKey === 'Q_8'
        ? buildQuaternionGroup()
        : buildDihedralGroup(4);
  const idx = group.elements.indexOf(targetElementLabel);
  const targetIdx = idx >= 0 ? idx : Math.min(1, group.order - 1);
  const targetIndices = [targetIdx];
  const cent = calculateCentralizer(group, targetIndices);
  const centre = calculateCentre(group);

  const nonCommutingExamples = cent.commutingPairs
    .filter((p) => !p.commutesWithAll)
    .slice(0, 4)
    .map((p) => ({
      gLabel: p.gLabel,
      witness: p.failingWitness || '',
    }));

  const allOperations: CommutationOperationRow[] = group.elements.map((gLabel, gIdx) => {
    const gxIdx = group.table[gIdx][targetIdx];
    const xgIdx = group.table[targetIdx][gIdx];
    return {
      gLabel,
      commutes: gxIdx === xgIdx,
      gxLabel: group.elements[gxIdx],
      xgLabel: group.elements[xgIdx],
    };
  });

  return {
    group,
    targetIndices,
    targetLabels: targetIndices.map((i) => group.elements[i]),
    centralizerLabels: cent.centralizerLabels,
    centralizerOrder: cent.centralizerOrder,
    centreLabels: centre.centreLabels,
    centreOrder: centre.centreOrder,
    nonCommutingExamples,
    allOperations,
  };
}

// 5. Server Cluster Quotient Routing (Normal Subgroups & Quotient Groups)
export interface NetworkQuotientSimulation {
  group: FiniteGroup;
  subgroupIndices: number[];
  subgroupLabels: string[];
  canRouteDeterministic: boolean;
  quotientOrder: number | null;
  quotientCosetLabels: string[];
  cosetPartitions: Array<{ cosetLabel: string; members: string[] }>;
  conflictWitness?: {
    g1: string;
    g2: string;
    h1: string;
    h2: string;
    directProductCoset: string[];
    shiftedProductCoset: string[];
  };
  reason: string;
}

export function simulateNetworkQuotient(
  topology: 'S4-switch' | 'D4-ring' | 'S3-mesh' | 'A4-cluster',
  clusterChoice: string
): NetworkQuotientSimulation {
  let group: FiniteGroup;
  let subgroupIndices: number[];

  if (topology === 'S4-switch') {
    group = buildSymmetricGroup(4);
    if (clusterChoice === 'V4') {
      subgroupIndices = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) =>
        group.elements.indexOf(l)
      );
    } else {
      subgroupIndices = generateSubgroupFromElements(group, [group.elements.indexOf('(1 2)')]);
    }
  } else if (topology === 'D4-ring') {
    group = buildDihedralGroup(4);
    const gen = clusterChoice === 's' ? 's' : clusterChoice === 'r' ? 'r' : 'r²';
    subgroupIndices = generateSubgroupFromElements(group, [group.elements.indexOf(gen)]);
  } else if (topology === 'A4-cluster') {
    group = buildAlternatingGroup(4);
    if (clusterChoice === 'V4') {
      subgroupIndices = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) =>
        group.elements.indexOf(l)
      );
    } else {
      subgroupIndices = generateSubgroupFromElements(group, [group.elements.indexOf('(1 2 3)')]);
    }
  } else {
    group = buildSymmetricGroup(3);
    const gen = clusterChoice === 'rot' ? '(1 2 3)' : '(1 2)';
    subgroupIndices = generateSubgroupFromElements(group, [group.elements.indexOf(gen)]);
  }

  const q = buildQuotientGroup(group, subgroupIndices);
  const cosets = analyzeCosets(group, subgroupIndices);
  const cosetPartitions = cosets.distinctLeftCosets.map((c) => ({
    cosetLabel: `${c.representativeLabel}H`,
    members: c.elementLabels,
  }));

  return {
    group,
    subgroupIndices,
    subgroupLabels: subgroupIndices.map((i) => group.elements[i]),
    canRouteDeterministic: q.canConstruct,
    quotientOrder: q.quotientGroup?.order ?? null,
    quotientCosetLabels: (q.quotientElements ?? []).map((c) => c.cosetLabel),
    cosetPartitions,
    conflictWitness: q.wellDefinedCounterexample,
    reason: q.canConstruct
      ? `Cluster $H$ is normal in ${group.name}: super-router routing $G/H$ is well-defined with ${q.quotientGroup!.order} deterministic meta-nodes.`
      : q.reasonIfInvalid || 'Non-normal cluster breaks deterministic quotient routing.',
  };
}

// 6. Multi-Channel Clock & Memory Synchronization (FTFGAG)
export interface SignalFtfgagSimulation {
  group: FiniteGroup;
  periodA: number;
  periodB: number;
  totalStates: number;
  isSingleMasterClock: boolean;
  maxSimultaneousOrder: number;
  canonicalLatex: string;
  elementaryLatex: string;
  invariantFactors: number[];
  gcdValue: number;
  orbitCells: Array<{ a: number; b: number; step: number }>;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

export function simulateSignalSynchronization(
  periodA: number,
  periodB: number
): SignalFtfgagSimulation {
  const a = Math.max(2, Math.min(8, Math.round(periodA)));
  const b = Math.max(2, Math.min(8, Math.round(periodB)));
  const clampedB = a * b > 32 ? Math.max(2, Math.floor(32 / a)) : b;
  const group = buildDirectProductCyclic([a, clampedB]);
  const analysis = classifyAbelianGroup(group);
  const maxOrder = analysis.elementOrderDistribution.reduce(
    (mx, row) => Math.max(mx, row.order),
    1
  );

  const orbitCells: Array<{ a: number; b: number; step: number }> = [];
  for (let t = 0; t < maxOrder; t++) {
    orbitCells.push({ a: t % a, b: t % clampedB, step: t });
  }

  return {
    group,
    periodA: a,
    periodB: clampedB,
    totalStates: group.order,
    isSingleMasterClock: analysis.isCyclic,
    maxSimultaneousOrder: maxOrder,
    canonicalLatex: analysis.canonicalLatex,
    elementaryLatex: analysis.elementaryLatex,
    invariantFactors: analysis.invariantFactors,
    gcdValue: gcd(a, clampedB),
    orbitCells,
  };
}
