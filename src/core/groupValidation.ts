import {
  FiniteGroup,
  GroupAxiomFailure,
  GroupAxiomReport,
  SubgroupValidationReport,
} from './groupTypes.ts';

export function verifyRawCayleyTable(
  elements: string[],
  table: number[][]
): GroupAxiomReport {
  const n = elements.length;
  const failures: GroupAxiomFailure[] = [];

  if (n === 0 || table.length !== n) {
    return {
      isValidGroup: false,
      closure: false,
      associativity: false,
      identity: false,
      inverses: false,
      isAbelian: false,
      identityElement: null,
      failures: [{ axiom: 'closure', message: 'Group must be non-empty with an n×n multiplication table.' }],
      checkedTriples: 0,
    };
  }

  let closure = true;
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(table[i]) || table[i].length !== n) {
      closure = false;
      failures.push({
        axiom: 'closure',
        message: `Row ${i + 1} does not have ${n} entries.`,
      });
      break;
    }
    for (let j = 0; j < n; j++) {
      const val = table[i][j];
      if (!Number.isInteger(val) || val < 0 || val >= n) {
        closure = false;
        failures.push({
          axiom: 'closure',
          message: `Entry at (${elements[i]}, ${elements[j]}) is outside the set G.`,
          witness: `(${elements[i]}, ${elements[j]}) -> ${String(val)}`,
        });
      }
    }
  }

  if (!closure) {
    return {
      isValidGroup: false,
      closure: false,
      associativity: false,
      identity: false,
      inverses: false,
      isAbelian: false,
      identityElement: null,
      failures,
      checkedTriples: 0,
    };
  }

  // Identity check: find e such that e*x = x and x*e = x for all x
  let identityIndex = -1;
  for (let e = 0; e < n; e++) {
    let ok = true;
    for (let x = 0; x < n; x++) {
      if (table[e][x] !== x || table[x][e] !== x) {
        ok = false;
        break;
      }
    }
    if (ok) {
      identityIndex = e;
      break;
    }
  }

  const identity = identityIndex !== -1;
  if (!identity) {
    failures.push({
      axiom: 'identity',
      message: 'No two-sided identity element e satisfies e·x = x·e = x for all x ∈ G.',
    });
  }

  // Inverses check
  let inverses = identity;
  if (identity) {
    for (let a = 0; a < n; a++) {
      let foundInv = false;
      for (let b = 0; b < n; b++) {
        if (table[a][b] === identityIndex && table[b][a] === identityIndex) {
          foundInv = true;
          break;
        }
      }
      if (!foundInv) {
        inverses = false;
        failures.push({
          axiom: 'inverses',
          message: `Element ${elements[a]} has no two-sided inverse in G.`,
          witness: elements[a],
        });
        break;
      }
    }
  }

  // Associativity check: (a*b)*c == a*(b*c)
  let associativity = true;
  let checkedTriples = 0;
  outer: for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      const ab = table[a][b];
      for (let c = 0; c < n; c++) {
        checkedTriples++;
        const bc = table[b][c];
        if (table[ab][c] !== table[a][bc]) {
          associativity = false;
          failures.push({
            axiom: 'associativity',
            message: `Associativity fails for (${elements[a]} · ${elements[b]}) · ${elements[c]} ≠ ${elements[a]} · (${elements[b]} · ${elements[c]}).`,
            witness: `(${elements[a]}·${elements[b]})·${elements[c]} = ${elements[table[ab][c]]}, while ${elements[a]}·(${elements[b]}·${elements[c]}) = ${elements[table[a][bc]]}`,
          });
          break outer;
        }
      }
    }
  }

  let isAbelian = true;
  for (let i = 0; i < n && isAbelian; i++) {
    for (let j = i + 1; j < n; j++) {
      if (table[i][j] !== table[j][i]) {
        isAbelian = false;
        break;
      }
    }
  }

  return {
    isValidGroup: closure && associativity && identity && inverses,
    closure,
    associativity,
    identity,
    inverses,
    isAbelian,
    identityElement: identity ? elements[identityIndex] : null,
    failures,
    checkedTriples,
  };
}

export function verifyGroupAxioms(group: FiniteGroup): GroupAxiomReport {
  return verifyRawCayleyTable(group.elements, group.table);
}

export function validateSubgroup(
  group: FiniteGroup,
  subsetIndices: number[]
): SubgroupValidationReport {
  const unique = Array.from(new Set(subsetIndices))
    .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < group.order)
    .sort((a, b) => a - b);

  const reasons: string[] = [];
  const isNonEmpty = unique.length > 0;
  if (!isNonEmpty) {
    reasons.push('Subset H is empty; a subgroup must be non-empty and contain the identity.');
    return {
      isSubgroup: false,
      isNonEmpty: false,
      hasIdentity: false,
      isClosed: false,
      hasInverses: false,
      order: 0,
      reasons,
    };
  }

  const inH = new Set(unique);
  const hasIdentity = inH.has(group.identityIndex);
  if (!hasIdentity) {
    reasons.push(
      `Missing identity element ${group.elements[group.identityIndex]}. Every subgroup must contain e.`
    );
  }

  let isClosed = true;
  let closureWitness: { a: string; b: string; product: string } | undefined;
  for (const a of unique) {
    for (const b of unique) {
      const prod = group.table[a][b];
      if (!inH.has(prod)) {
        isClosed = false;
        closureWitness = {
          a: group.elements[a],
          b: group.elements[b],
          product: group.elements[prod],
        };
        reasons.push(
          `Closure fails: ${group.elements[a]} ${group.operationSymbol} ${group.elements[b]} = ${group.elements[prod]} ∉ H.`
        );
        break;
      }
    }
    if (!isClosed) break;
  }

  let hasInverses = true;
  let inverseWitness: { a: string; inverse: string } | undefined;
  for (const a of unique) {
    const inv = group.inverses[a];
    if (!inH.has(inv)) {
      hasInverses = false;
      inverseWitness = {
        a: group.elements[a],
        inverse: group.elements[inv],
      };
      reasons.push(
        `Inverse property fails: (${group.elements[a]})⁻¹ = ${group.elements[inv]} ∉ H.`
      );
      break;
    }
  }

  const isSubgroup = isNonEmpty && hasIdentity && isClosed && hasInverses;
  if (isSubgroup) {
    reasons.push(
      `Verified: H is non-empty, contains ${group.elements[group.identityIndex]}, is closed under ${group.operationName.toLowerCase()}, and contains all inverses.`
    );
  }

  return {
    isSubgroup,
    isNonEmpty,
    hasIdentity,
    isClosed,
    hasInverses,
    order: unique.length,
    reasons,
    closureWitness,
    inverseWitness,
  };
}
