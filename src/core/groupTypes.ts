export type GroupFamily =
  | 'cyclic'
  | 'direct_product'
  | 'symmetric'
  | 'alternating'
  | 'dihedral'
  | 'klein'
  | 'quaternion'
  | 'quotient'
  | 'custom';

export interface FiniteGroup {
  id: string;
  name: string;
  latexName: string;
  family: GroupFamily;
  operationSymbol: string;
  operationName: string;
  order: number;
  elements: string[];
  latexElements: string[];
  /** op[i][j] = index of (elements[i] * elements[j]) */
  table: number[][];
  identityIndex: number;
  inverses: number[];
  orders: number[];
  isAbelian: boolean;
  warning?: string;
}

export interface GroupAxiomFailure {
  axiom: 'closure' | 'associativity' | 'identity' | 'inverses';
  message: string;
  witness?: string;
}

export interface GroupAxiomReport {
  isValidGroup: boolean;
  closure: boolean;
  associativity: boolean;
  identity: boolean;
  inverses: boolean;
  isAbelian: boolean;
  identityElement: string | null;
  failures: GroupAxiomFailure[];
  checkedTriples: number;
}

export interface SubgroupValidationReport {
  isSubgroup: boolean;
  isNonEmpty: boolean;
  hasIdentity: boolean;
  isClosed: boolean;
  hasInverses: boolean;
  order: number;
  reasons: string[];
  closureWitness?: { a: string; b: string; product: string };
  inverseWitness?: { a: string; inverse: string };
}

export interface NamedSubgroup {
  id: string;
  name: string;
  latexName: string;
  elements: number[];
  isNormal?: boolean;
}

export interface CosetEntry {
  representativeIndex: number;
  representativeLabel: string;
  cosetLabel: string;
  latexLabel: string;
  elementIndices: number[];
  elementLabels: string[];
}

export interface CosetAnalysis {
  valid: boolean;
  validation: SubgroupValidationReport;
  leftCosets: CosetEntry[];
  rightCosets: CosetEntry[];
  distinctLeftCosets: CosetEntry[];
  distinctRightCosets: CosetEntry[];
  index: number;
  allLeftEqualRight: boolean;
  mismatchWitnesses: Array<{
    element: string;
    leftCoset: string[];
    rightCoset: string[];
  }>;
  partitionVerified: boolean;
}

export interface LagrangeAnalysis {
  groupOrder: number;
  subgroupOrder: number;
  index: number | null;
  divides: boolean;
  equationVerified: boolean;
  validation: SubgroupValidationReport;
  stepByStep: string[];
  converseSearch?: {
    targetDivisor: number;
    foundSubgroups: number[][];
    exhaustive: boolean;
    note: string;
  };
}

export interface ConjugationEntry {
  gIndex: number;
  gLabel: string;
  conjugateIndices: number[];
  conjugateLabels: string[];
  equalsH: boolean;
}

export interface NormalityAnalysis {
  isSubgroup: boolean;
  validation: SubgroupValidationReport;
  isNormal: boolean;
  conjugationConditionHolds: boolean;
  cosetEqualityHolds: boolean;
  conjugations: ConjugationEntry[];
  failingElements: Array<{
    gLabel: string;
    gHgInv: string[];
    gH: string[];
    Hg: string[];
  }>;
  explanation: string;
}

export interface ConjugateSubgroupOrbit {
  conjugateIndices: number[];
  conjugateLabels: string[];
  conjugateLatex: string;
  producingGIndices: number[];
  producingGLabels: string[];
  producingGLatex: string[];
  isOriginalH: boolean;
}

export interface NormalizerAnalysis {
  isSubgroup: boolean;
  validation: SubgroupValidationReport;
  normalizerIndices: number[];
  normalizerLabels: string[];
  normalizerOrder: number;
  hContainedInNormalizer: boolean;
  normalizerIsSubgroup: boolean;
  equalsG: boolean;
  elementChecks: Array<{
    gLabel: string;
    inNormalizer: boolean;
    conjugateSet: string[];
  }>;
  conjugateOrbitPartition: ConjugateSubgroupOrbit[];
  explanation: string;
}

export interface CentralizerAnalysis {
  subsetIndices: number[];
  subsetLabels: string[];
  centralizerIndices: number[];
  centralizerLabels: string[];
  centralizerOrder: number;
  centralizerIsSubgroup: boolean;
  commutingPairs: Array<{ gLabel: string; commutesWithAll: boolean; failingWitness?: string }>;
  explanation: string;
}

export interface CentreAnalysis {
  centreIndices: number[];
  centreLabels: string[];
  centreOrder: number;
  isAbelianGroup: boolean;
  isNormalSubgroup: boolean;
  elementBreakdown: Array<{ label: string; isCentral: boolean; nonCommutingWith?: string }>;
  explanation: string;
}

export interface QuotientElement {
  index: number;
  representativeIndex: number;
  representativeLabel: string;
  cosetLabel: string;
  latexLabel: string;
  members: number[];
  memberLabels: string[];
  order: number;
}

export interface QuotientGroupAnalysis {
  canConstruct: boolean;
  normality: NormalityAnalysis;
  reasonIfInvalid?: string;
  wellDefinedCounterexample?: {
    g1: string;
    g2: string;
    h1: string;
    h2: string;
    directProductCoset: string[];
    shiftedProductCoset: string[];
  };
  quotientGroup?: FiniteGroup;
  quotientElements?: QuotientElement[];
  identityCosetIndex?: number;
  inverseCosetIndices?: number[];
  orderChecks?: Array<{
    cosetLabel: string;
    repLabel: string;
    order: number;
    powerSequence: string[];
  }>;
  indexMatchesOrder: boolean;
}

export interface AbelianClassificationAnalysis {
  isAbelian: boolean;
  groupOrder: number;
  isCyclic: boolean;
  elementOrderDistribution: Array<{ order: number; count: number; elements: string[] }>;
  primePowerFactorization: Array<{ prime: number; power: number; sylowOrder: number; elementaryDivisors: number[] }>;
  elementaryDivisors: number[];
  invariantFactors: number[];
  decompositionOrderCheck: number;
  canonicalLatex: string;
  elementaryLatex: string;
  explanation: string;
}

export interface ConjugacyClassEntry {
  representativeIndex: number;
  representativeLabel: string;
  elements: number[];
  elementLabels: string[];
  size: number;
  centralizerOrder: number;
  isCentral: boolean;
}

export interface ConjugacyAnalysis {
  groupOrder: number;
  classes: ConjugacyClassEntry[];
  centralElements: string[];
  nonCentralClassSizes: number[];
  classEquationString: string;
  classEquationLatex: string;
  partitionVerified: boolean;
  sumOfSizes: number;
}
