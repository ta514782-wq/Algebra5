import { FiniteGroup, GroupFamily, NamedSubgroup } from './groupTypes.ts';
import { verifyRawCayleyTable } from './groupValidation.ts';
import { toSubscript, toSuperscript } from '../utils/mathUnicode.ts';

function computeInversesAndOrders(table: number[][], identityIndex: number) {
  const n = table.length;
  const inverses = new Array<number>(n).fill(0);
  const orders = new Array<number>(n).fill(1);
  let isAbelian = true;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (table[i][j] === identityIndex) {
        inverses[i] = j;
      }
      if (j > i && table[i][j] !== table[j][i]) {
        isAbelian = false;
      }
    }
    let cur = i;
    let ord = 1;
    while (cur !== identityIndex && ord <= n) {
      cur = table[cur][i];
      ord++;
    }
    orders[i] = ord;
  }
  return { inverses, orders, isAbelian };
}

export function buildGroupFromTable(params: {
  id: string;
  name: string;
  latexName: string;
  family: GroupFamily;
  operationSymbol: string;
  operationName: string;
  elements: string[];
  latexElements?: string[];
  table: number[][];
  identityIndex?: number;
  warning?: string;
}): FiniteGroup {
  const { elements, table } = params;
  const identityIndex = params.identityIndex ?? 0;
  const { inverses, orders, isAbelian } = computeInversesAndOrders(table, identityIndex);
  return {
    id: params.id,
    name: params.name,
    latexName: params.latexName,
    family: params.family,
    operationSymbol: params.operationSymbol,
    operationName: params.operationName,
    order: elements.length,
    elements,
    latexElements: params.latexElements ?? elements,
    table,
    identityIndex,
    inverses,
    orders,
    isAbelian,
    warning: params.warning,
  };
}

export function buildCyclicGroup(n: number): FiniteGroup {
  if (!Number.isInteger(n) || n < 1 || n > 36) {
    throw new Error('Cyclic group order n must be an integer between 1 and 36.');
  }
  const elements = Array.from({ length: n }, (_, i) => `${i}`);
  const table = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i + j) % n)
  );
  return buildGroupFromTable({
    id: `Z_${n}`,
    name: `ℤ${toSubscript(n)}`,
    latexName: `\\mathbb{Z}_{${n}}`,
    family: 'cyclic',
    operationSymbol: '+',
    operationName: `Addition mod ${n}`,
    elements,
    table,
    identityIndex: 0,
    warning: n > 20 ? `Large group (|G| = ${n}): Cayley tables are compactly truncated if needed.` : undefined,
  });
}

export function buildDirectProductCyclic(moduli: number[]): FiniteGroup {
  if (moduli.length < 2 || moduli.some((m) => !Number.isInteger(m) || m < 2)) {
    throw new Error('Provide at least two integer moduli >= 2 for direct product.');
  }
  const totalOrder = moduli.reduce((acc, m) => acc * m, 1);
  if (totalOrder > 48) {
    throw new Error(`Direct product order ${totalOrder} exceeds computational UI limit of 48.`);
  }

  const tuples: number[][] = [[]];
  for (const mod of moduli) {
    const next: number[][] = [];
    for (const prefix of tuples) {
      for (let v = 0; v < mod; v++) {
        next.push([...prefix, v]);
      }
    }
    tuples.splice(0, tuples.length, ...next);
  }

  const indexMap = new Map<string, number>();
  const elements = tuples.map((t, idx) => {
    const key = t.join(',');
    indexMap.set(key, idx);
    return `(${key})`;
  });

  const n = tuples.length;
  const table = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const sum = tuples[i].map((v, k) => (v + tuples[j][k]) % moduli[k]);
      return indexMap.get(sum.join(','))!;
    })
  );

  const label = moduli.map((m) => `ℤ${toSubscript(m)}`).join(' × ');
  const latex = moduli.map((m) => `\\mathbb{Z}_{${m}}`).join(' \\times ');

  return buildGroupFromTable({
    id: moduli.map((m) => `Z${m}`).join('x'),
    name: label,
    latexName: latex,
    family: 'direct_product',
    operationSymbol: '+',
    operationName: 'Componentwise modular addition',
    elements,
    table,
    identityIndex: 0,
    warning: totalOrder > 24 ? `Group order ${totalOrder}: subgroup lattice search is resource-bounded.` : undefined,
  });
}

// Permutation utilities (0-indexed arrays of length deg)
function permCompose(p: number[], q: number[]): number[] {
  // (p ∘ q)(x) = p[q[x]]
  return q.map((qx) => p[qx]);
}

function permToCycleNotation(p: number[]): string {
  const n = p.length;
  const visited = new Array<boolean>(n).fill(false);
  const cycles: string[] = [];
  for (let i = 0; i < n; i++) {
    if (!visited[i] && p[i] !== i) {
      const cycle: number[] = [];
      let cur = i;
      while (!visited[cur]) {
        visited[cur] = true;
        cycle.push(cur + 1);
        cur = p[cur];
      }
      if (cycle.length > 1) {
        cycles.push(`(${cycle.join(' ')})`);
      }
    } else {
      visited[i] = true;
    }
  }
  return cycles.length === 0 ? 'e' : cycles.join('');
}

function permParity(p: number[]): number {
  const n = p.length;
  const visited = new Array<boolean>(n).fill(false);
  let transpositions = 0;
  for (let i = 0; i < n; i++) {
    if (!visited[i]) {
      let len = 0;
      let cur = i;
      while (!visited[cur]) {
        visited[cur] = true;
        cur = p[cur];
        len++;
      }
      transpositions += len - 1;
    }
  }
  return transpositions % 2;
}

function generateAllPerms(n: number): number[][] {
  const result: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const cur: number[] = [];
  function backtrack() {
    if (cur.length === n) {
      result.push([...cur]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (!used[i]) {
        used[i] = true;
        cur.push(i);
        backtrack();
        cur.pop();
        used[i] = false;
      }
    }
  }
  backtrack();
  return result;
}

export function buildSymmetricGroup(n: number): FiniteGroup {
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error('Symmetric group Sₙ supports 1 ≤ n ≤ 5 (|S₅| = 120).');
  }
  const perms = generateAllPerms(n);
  // Sort so identity is index 0, then by cycle notation length & lexicographic
  perms.sort((a, b) => {
    const la = permToCycleNotation(a);
    const lb = permToCycleNotation(b);
    if (la === 'e') return -1;
    if (lb === 'e') return 1;
    if (la.length !== lb.length) return la.length - lb.length;
    return la.localeCompare(lb);
  });

  const keyMap = new Map<string, number>();
  const elements = perms.map((p, idx) => {
    keyMap.set(p.join(','), idx);
    return permToCycleNotation(p);
  });

  const order = perms.length;
  const table = Array.from({ length: order }, (_, i) =>
    Array.from({ length: order }, (_, j) => {
      const comp = permCompose(perms[i], perms[j]);
      return keyMap.get(comp.join(','))!;
    })
  );

  return buildGroupFromTable({
    id: `S_${n}`,
    name: `S${toSubscript(n)}`,
    latexName: `S_{${n}}`,
    family: 'symmetric',
    operationSymbol: '∘',
    operationName: 'Permutation composition (right-to-left)',
    elements,
    table,
    identityIndex: 0,
    warning:
      n >= 5
        ? `|S₅| = 120: exhaustive subgroup enumeration is resource-bounded; individual element/coset/normality checks remain exact.`
        : n === 4
          ? `|S₄| = 24: full Cayley table has 576 cells; computations are exact.`
          : undefined,
  });
}

export function buildAlternatingGroup(n: number): FiniteGroup {
  if (!Number.isInteger(n) || n < 3 || n > 5) {
    throw new Error('Alternating group Aₙ supports 3 ≤ n ≤ 5.');
  }
  const perms = generateAllPerms(n).filter((p) => permParity(p) === 0);
  perms.sort((a, b) => {
    const la = permToCycleNotation(a);
    const lb = permToCycleNotation(b);
    if (la === 'e') return -1;
    if (lb === 'e') return 1;
    if (la.length !== lb.length) return la.length - lb.length;
    return la.localeCompare(lb);
  });

  const keyMap = new Map<string, number>();
  const elements = perms.map((p, idx) => {
    keyMap.set(p.join(','), idx);
    return permToCycleNotation(p);
  });

  const order = perms.length;
  const table = Array.from({ length: order }, (_, i) =>
    Array.from({ length: order }, (_, j) => {
      const comp = permCompose(perms[i], perms[j]);
      return keyMap.get(comp.join(','))!;
    })
  );

  return buildGroupFromTable({
    id: `A_${n}`,
    name: `A${toSubscript(n)}`,
    latexName: `A_{${n}}`,
    family: 'alternating',
    operationSymbol: '∘',
    operationName: 'Even permutation composition (right-to-left)',
    elements,
    table,
    identityIndex: 0,
    warning:
      n >= 5
        ? `|A₅| = 60: exhaustive subgroup search is resource-bounded; coset and conjugacy calculations are exact.`
        : undefined,
  });
}

export function buildDihedralGroup(n: number): FiniteGroup {
  if (!Number.isInteger(n) || n < 2 || n > 16) {
    throw new Error('Dihedral group Dₙ supports 2 ≤ n ≤ 16 (order 2n).');
  }
  // Elements: r^0..r^(n-1), then s, sr, sr^2 ... wait: standard convention r^k or r^k s
  // Using r^k (k=0..n-1) then r^k s (k=0..n-1) with s r = r^{-1} s => (r^a s^b)(r^c s^d)
  // If b=0: r^(a+c) s^d. If b=1: r^a s r^c s^d = r^(a-c) s^(1+d).
  const elements: string[] = [];
  const latexElements: string[] = [];
  for (let b = 0; b <= 1; b++) {
    for (let a = 0; a < n; a++) {
      if (b === 0) {
        if (a === 0) {
          elements.push('e');
          latexElements.push('e');
        } else if (a === 1) {
          elements.push('r');
          latexElements.push('r');
        } else {
          elements.push(`r${toSuperscript(a)}`);
          latexElements.push(`r^{${a}}`);
        }
      } else {
        if (a === 0) {
          elements.push('s');
          latexElements.push('s');
        } else if (a === 1) {
          elements.push('rs');
          latexElements.push('rs');
        } else {
          elements.push(`r${toSuperscript(a)}s`);
          latexElements.push(`r^{${a}}s`);
        }
      }
    }
  }

  const order = 2 * n;
  const table = Array.from({ length: order }, (_, i) => {
    const a = i % n;
    const b = Math.floor(i / n);
    return Array.from({ length: order }, (_, j) => {
      const c = j % n;
      const d = Math.floor(j / n);
      const newA = b === 0 ? (a + c) % n : (((a - c) % n) + n) % n;
      const newB = (b + d) % 2;
      return newB * n + newA;
    });
  });

  return buildGroupFromTable({
    id: `D_${n}`,
    name: `D${toSubscript(n)}`,
    latexName: `D_{${n}}`,
    family: 'dihedral',
    operationSymbol: '·',
    operationName: `Symmetry composition (order ${2 * n})`,
    elements,
    latexElements,
    table,
    identityIndex: 0,
    warning: n > 10 ? `Large dihedral group |D${toSubscript(n)}| = ${2 * n}.` : undefined,
  });
}

export function buildKleinFourGroup(): FiniteGroup {
  const elements = ['e', 'a', 'b', 'c'];
  const table = [
    [0, 1, 2, 3],
    [1, 0, 3, 2],
    [2, 3, 0, 1],
    [3, 2, 1, 0],
  ];
  return buildGroupFromTable({
    id: 'V_4',
    name: 'V₄ (Klein Four)',
    latexName: 'V_4',
    family: 'klein',
    operationSymbol: '·',
    operationName: 'Klein four-group operation',
    elements,
    table,
    identityIndex: 0,
  });
}

export function buildQuaternionGroup(): FiniteGroup {
  const elements = ['1', '-1', 'i', '-i', 'j', '-j', 'k', '-k'];
  // indices: 0:1, 1:-1, 2:i, 3:-i, 4:j, 5:-j, 6:k, 7:-k
  const table = [
    [0, 1, 2, 3, 4, 5, 6, 7], // 1
    [1, 0, 3, 2, 5, 4, 7, 6], // -1
    [2, 3, 1, 0, 6, 7, 5, 4], // i: i^2=-1, ij=k, ik=-j
    [3, 2, 0, 1, 7, 6, 4, 5], // -i
    [4, 5, 7, 6, 1, 0, 2, 3], // j: ji=-k, j^2=-1, jk=i
    [5, 4, 6, 7, 0, 1, 3, 2], // -j
    [6, 7, 4, 5, 3, 2, 1, 0], // k: ki=j, kj=-i, k^2=-1
    [7, 6, 5, 4, 2, 3, 0, 1], // -k
  ];
  return buildGroupFromTable({
    id: 'Q_8',
    name: 'Q₈ (Quaternions)',
    latexName: 'Q_8',
    family: 'quaternion',
    operationSymbol: '·',
    operationName: 'Quaternion multiplication',
    elements,
    table,
    identityIndex: 0,
  });
}

export function buildCustomGroup(
  name: string,
  elements: string[],
  rawTable: string[][]
): { group?: FiniteGroup; error?: string } {
  const cleaned = elements.map((e) => e.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { error: 'Provide at least one group element.' };
  }
  if (new Set(cleaned).size !== cleaned.length) {
    return { error: 'Group elements must be distinct.' };
  }
  if (cleaned.length > 16) {
    return { error: 'Custom multiplication tables are limited to order 16.' };
  }

  const elemIndex = new Map<string, number>();
  cleaned.forEach((e, idx) => elemIndex.set(e, idx));

  const n = cleaned.length;
  if (rawTable.length !== n) {
    return { error: `Expected ${n} rows in the multiplication table, received ${rawTable.length}.` };
  }

  const numericTable: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (!rawTable[i] || rawTable[i].length !== n) {
      return { error: `Row ${i + 1} must have ${n} entries.` };
    }
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const sym = rawTable[i][j].trim();
      const idx = elemIndex.get(sym);
      if (idx === undefined) {
        return {
          error: `Closure/input error at (${cleaned[i]}, ${cleaned[j]}): "${sym}" is not in the element set {${cleaned.join(', ')}}.`,
        };
      }
      row.push(idx);
    }
    numericTable.push(row);
  }

  const report = verifyRawCayleyTable(cleaned, numericTable);
  if (!report.isValidGroup) {
    return {
      error: report.failures.map((f) => f.message + (f.witness ? ` [${f.witness}]` : '')).join(' '),
    };
  }

  let identityIndex = 0;
  for (let e = 0; e < n; e++) {
    if (cleaned[e] === report.identityElement) {
      identityIndex = e;
      break;
    }
  }

  const cleanName = name.trim() || `Custom_${n}`;
  return {
    group: buildGroupFromTable({
      id: `custom_${cleanName}`,
      name: cleanName,
      latexName: `\\text{${cleanName}}`,
      family: 'custom',
      operationSymbol: '*',
      operationName: 'Custom binary operation',
      elements: cleaned,
      table: numericTable,
      identityIndex,
    }),
  };
}

export function generateSubgroupFromElements(
  group: FiniteGroup,
  seedIndices: number[]
): number[] {
  const closure = new Set<number>([group.identityIndex]);
  for (const idx of seedIndices) {
    if (idx >= 0 && idx < group.order) {
      closure.add(idx);
      closure.add(group.inverses[idx]);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    const current = Array.from(closure);
    for (const a of current) {
      for (const b of current) {
        const prod = group.table[a][b];
        if (!closure.has(prod)) {
          closure.add(prod);
          closure.add(group.inverses[prod]);
          changed = true;
        }
      }
    }
  }
  return Array.from(closure).sort((a, b) => a - b);
}

export function findSubgroupsOfOrder(
  group: FiniteGroup,
  targetOrder: number
): { subgroups: number[][]; exhaustive: boolean; note: string } {
  const n = group.order;
  if (targetOrder <= 0 || n % targetOrder !== 0) {
    return {
      subgroups: [],
      exhaustive: true,
      note: `${targetOrder} does not divide |G| = ${n}, so by Lagrange's theorem no subgroup of order ${targetOrder} can exist.`,
    };
  }
  if (targetOrder === 1) {
    return {
      subgroups: [[group.identityIndex]],
      exhaustive: true,
      note: 'The trivial subgroup {e} is always the unique subgroup of order 1.',
    };
  }
  if (targetOrder === n) {
    return {
      subgroups: [Array.from({ length: n }, (_, i) => i)],
      exhaustive: true,
      note: 'The improper subgroup G is the unique subgroup of order |G|.',
    };
  }

  const seenKeys = new Set<string>();
  const found: number[][] = [];

  const record = (sub: number[]) => {
    if (sub.length === targetOrder) {
      const key = sub.join(',');
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        found.push(sub);
      }
    }
  };

  // Exhaustive search for groups up to order 24 via progressive subgroup lattice closure
  if (n <= 24) {
    const allSubgroups = enumerateAllSubgroups(group).subgroups;
    for (const sub of allSubgroups) {
      record(sub);
    }
    return {
      subgroups: found,
      exhaustive: true,
      note: `Exhaustive verified search over the complete subgroup lattice of ${group.name} (|G| = ${n}).`,
    };
  }

  // Resource-bounded search for larger groups (>24): cyclic subgroups + 2-generator closures
  for (let i = 0; i < n; i++) {
    record(generateSubgroupFromElements(group, [i]));
  }
  for (let i = 0; i < n && found.length < 25; i++) {
    for (let j = i + 1; j < n && found.length < 25; j++) {
      record(generateSubgroupFromElements(group, [i, j]));
    }
  }
  return {
    subgroups: found,
    exhaustive: false,
    note: `Resource-limited search (cyclic + 2-generator closures) performed because |G| = ${n} > 24. Absence of results here does not prove non-existence.`,
  };
}

export function enumerateAllSubgroups(group: FiniteGroup): {
  subgroups: number[][];
  exhaustive: boolean;
} {
  const n = group.order;
  const map = new Map<string, number[]>();
  const triv = [group.identityIndex];
  map.set(triv.join(','), triv);

  // Start with all cyclic subgroups
  const cyclic: number[][] = [];
  for (let i = 0; i < n; i++) {
    const c = generateSubgroupFromElements(group, [i]);
    const k = c.join(',');
    if (!map.has(k)) {
      map.set(k, c);
      cyclic.push(c);
    }
  }

  if (n > 24) {
    // Resource-bounded: pair closures of cyclic subgroups
    for (let i = 0; i < cyclic.length && map.size < 80; i++) {
      for (let j = i + 1; j < cyclic.length && map.size < 80; j++) {
        const joined = generateSubgroupFromElements(group, [...cyclic[i], ...cyclic[j]]);
        const k = joined.join(',');
        if (!map.has(k)) map.set(k, joined);
      }
    }
    return {
      subgroups: Array.from(map.values()).sort((a, b) => a.length - b.length),
      exhaustive: false,
    };
  }

  // Exact BFS over subgroup lattice (every subgroup is generated by joining existing subgroups with cyclic subgroups)
  const queue: number[][] = Array.from(map.values());
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const c of cyclic) {
      // Quick check if c subset of cur
      if (c.every((el) => cur.includes(el))) continue;
      const joined = generateSubgroupFromElements(group, [...cur, ...c]);
      const key = joined.join(',');
      if (!map.has(key)) {
        map.set(key, joined);
        queue.push(joined);
      }
    }
  }

  return {
    subgroups: Array.from(map.values()).sort((a, b) => a.length - b.length),
    exhaustive: true,
  };
}

export function getPresetSubgroups(group: FiniteGroup): NamedSubgroup[] {
  const subs: NamedSubgroup[] = [
    {
      id: 'trivial',
      name: `{${group.elements[group.identityIndex]}} (Trivial)`,
      latexName: `\\{${group.latexElements[group.identityIndex]}\\}`,
      elements: [group.identityIndex],
    },
  ];

  // Add curated subgroups for well-known Artifact 2 groups
  if (group.id === 'D_4') {
    const idx = (lbl: string) => group.elements.indexOf(lbl);
    subs.push(
      {
        id: 'center_r2',
        name: '⟨r²⟩ = {e, r²} (Centre, Normal)',
        latexName: '\\langle r^2 \\rangle = \\{e, r^2\\}',
        elements: [idx('e'), idx('r²')],
      },
      {
        id: 'rotations',
        name: '⟨r⟩ = {e, r, r², r³} (Rotations, Normal)',
        latexName: '\\langle r \\rangle',
        elements: [idx('e'), idx('r'), idx('r²'), idx('r³')],
      },
      {
        id: 'reflection_s',
        name: '⟨s⟩ = {e, s} (Non-normal!)',
        latexName: '\\langle s \\rangle = \\{e, s\\}',
        elements: [idx('e'), idx('s')],
      },
      {
        id: 'v4_in_d4',
        name: '{e, r², s, r²s} (Normal, order 4)',
        latexName: '\\{e, r^2, s, r^2s\\}',
        elements: [idx('e'), idx('r²'), idx('s'), idx('r²s')].sort((a, b) => a - b),
      }
    );
  } else if (group.id === 'S_3') {
    const idx = (lbl: string) => group.elements.indexOf(lbl);
    subs.push(
      {
        id: 'a3_in_s3',
        name: 'A₃ = {e, (1 2 3), (1 3 2)} (Normal)',
        latexName: 'A_3',
        elements: [idx('e'), idx('(1 2 3)'), idx('(1 3 2)')].sort((a, b) => a - b),
      },
      {
        id: 'transposition_12',
        name: '⟨(1 2)⟩ = {e, (1 2)} (Non-normal)',
        latexName: '\\langle (1\\;2) \\rangle',
        elements: [idx('e'), idx('(1 2)')].sort((a, b) => a - b),
      }
    );
  } else if (group.id === 'S_4') {
    const idx = (lbl: string) => group.elements.indexOf(lbl);
    const v4 = [idx('e'), idx('(1 2)(3 4)'), idx('(1 3)(2 4)'), idx('(1 4)(2 3)')].sort(
      (a, b) => a - b
    );
    subs.push(
      {
        id: 'v4_in_s4',
        name: 'V₄ = {e, (1 2)(3 4), (1 3)(2 4), (1 4)(2 3)} (Normal)',
        latexName: 'V_4',
        elements: v4,
      },
      {
        id: 'a4_in_s4',
        name: 'A₄ (Alternating subgroup, order 12, Normal)',
        latexName: 'A_4',
        elements: generateSubgroupFromElements(group, [
          idx('(1 2 3)'),
          idx('(1 2)(3 4)'),
        ]),
      }
    );
    subs.push({
      id: 's3_in_s4',
      name: 'Stab(4) ≅ S₃ (Non-normal, order 6)',
      latexName: '\\mathrm{Stab}(4) \\cong S_3',
      elements: generateSubgroupFromElements(group, [idx('(1 2)'), idx('(1 2 3)')]),
    });
  } else if (group.id === 'A_4') {
    const idx = (lbl: string) => group.elements.indexOf(lbl);
    subs.push(
      {
        id: 'v4_in_a4',
        name: 'V₄ = {e, (1 2)(3 4), (1 3)(2 4), (1 4)(2 3)} (Normal)',
        latexName: 'V_4',
        elements: [idx('e'), idx('(1 2)(3 4)'), idx('(1 3)(2 4)'), idx('(1 4)(2 3)')].sort(
          (a, b) => a - b
        ),
      },
      {
        id: 'c3_in_a4',
        name: '⟨(1 2 3)⟩ (Order 3, Non-normal)',
        latexName: '\\langle (1\\;2\\;3) \\rangle',
        elements: generateSubgroupFromElements(group, [idx('(1 2 3)')]),
      }
    );
  } else if (group.id === 'Z2xZ6') {
    const idx = (lbl: string) => group.elements.indexOf(lbl);
    const gen12 = generateSubgroupFromElements(group, [idx('(1,2)')]);
    subs.push({
      id: 'gen_1_2',
      name: `⟨(1,2)⟩ (Order ${gen12.length})`,
      latexName: '\\langle (1,2) \\rangle',
      elements: gen12,
    });
  } else {
    // Add non-trivial cyclic subgroups (up to 4 distinct)
    const seen = new Set<string>([subs[0].elements.join(',')]);
    for (let i = 1; i < group.order && subs.length < 5; i++) {
      const gen = generateSubgroupFromElements(group, [i]);
      const key = gen.join(',');
      if (!seen.has(key) && gen.length < group.order) {
        seen.add(key);
        subs.push({
          id: `cyc_${i}`,
          name: `⟨${group.elements[i]}⟩ (Order ${gen.length})`,
          latexName: `\\langle ${group.latexElements[i]} \\rangle`,
          elements: gen,
        });
      }
    }
  }

  subs.push({
    id: 'whole',
    name: `${group.name} (Whole Group)`,
    latexName: group.latexName,
    elements: Array.from({ length: group.order }, (_, i) => i),
  });

  return subs;
}

export const PRESET_GROUPS: Array<{
  key: string;
  label: string;
  description: string;
  build: () => FiniteGroup;
}> = [
  { key: 'D_4', label: 'D₄ (Dihedral, order 8)', description: 'Symmetries of a square — non-abelian', build: () => buildDihedralGroup(4) },
  { key: 'S_3', label: 'S₃ (Symmetric, order 6)', description: 'Smallest non-abelian group', build: () => buildSymmetricGroup(3) },
  { key: 'S_4', label: 'S₄ (Symmetric, order 24)', description: 'Permutations of 4 elements; contains V₄ ◁ S₄', build: () => buildSymmetricGroup(4) },
  { key: 'A_4', label: 'A₄ (Alternating, order 12)', description: 'Even permutations; counterexample to Lagrange converse', build: () => buildAlternatingGroup(4) },
  { key: 'Z_6', label: 'ℤ₆ (Cyclic, order 6)', description: 'Integers modulo 6 under addition', build: () => buildCyclicGroup(6) },
  { key: 'Z_12', label: 'ℤ₁₂ (Cyclic, order 12)', description: 'Integers modulo 12 under addition', build: () => buildCyclicGroup(12) },
  { key: 'Z2xZ6', label: 'ℤ₂ × ℤ₆ (Direct product, order 12)', description: 'Abelian non-cyclic group of order 12', build: () => buildDirectProductCyclic([2, 6]) },
  { key: 'Z4xZ4', label: 'ℤ₄ × ℤ₄ (Direct product, order 16)', description: 'Non-cyclic abelian group of order 16', build: () => buildDirectProductCyclic([4, 4]) },
  { key: 'V_4', label: 'V₄ (Klein Four, order 4)', description: 'Smallest non-cyclic group', build: buildKleinFourGroup },
  { key: 'Q_8', label: 'Q₈ (Quaternions, order 8)', description: 'Non-abelian group where every subgroup is normal', build: buildQuaternionGroup },
  { key: 'D_3', label: 'D₃ (Dihedral, order 6)', description: 'Symmetries of an equilateral triangle (≅ S₃)', build: () => buildDihedralGroup(3) },
  { key: 'D_5', label: 'D₅ (Dihedral, order 10)', description: 'Symmetries of a regular pentagon', build: () => buildDihedralGroup(5) },
];

export function resolveGroupById(id: string): FiniteGroup | null {
  const clean = id.trim();
  if (!clean) return null;
  if (clean === 'V_4') return buildKleinFourGroup();
  if (clean === 'Q_8') return buildQuaternionGroup();

  const cycMatch = /^Z_(\d+)$/i.exec(clean);
  if (cycMatch) {
    const n = Number(cycMatch[1]);
    if (n >= 1 && n <= 36) return buildCyclicGroup(n);
  }

  const dihMatch = /^D_(\d+)$/i.exec(clean);
  if (dihMatch) {
    const n = Number(dihMatch[1]);
    if (n >= 2 && n <= 16) return buildDihedralGroup(n);
  }

  const symMatch = /^S_(\d+)$/i.exec(clean);
  if (symMatch) {
    const n = Number(symMatch[1]);
    if (n >= 1 && n <= 5) return buildSymmetricGroup(n);
  }

  const altMatch = /^A_(\d+)$/i.exec(clean);
  if (altMatch) {
    const n = Number(altMatch[1]);
    if (n >= 3 && n <= 5) return buildAlternatingGroup(n);
  }

  if (/^(Z\d+x)+Z\d+$/i.test(clean)) {
    const moduli = clean
      .split(/x/i)
      .map((part) => Number(part.replace(/^Z/i, '')));
    const prod = moduli.reduce((a, b) => a * b, 1);
    if (moduli.length >= 2 && moduli.every((m) => Number.isInteger(m) && m >= 2) && prod <= 48) {
      return buildDirectProductCyclic(moduli);
    }
  }

  return null;
}
