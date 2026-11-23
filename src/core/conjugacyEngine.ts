import { calculateCentralizer } from './centralizerEngine.ts';
import { ConjugacyAnalysis, ConjugacyClassEntry, FiniteGroup } from './groupTypes.ts';

export function analyzeConjugacyClasses(group: FiniteGroup): ConjugacyAnalysis {
  const visited = new Set<number>();
  const classes: ConjugacyClassEntry[] = [];

  for (let x = 0; x < group.order; x++) {
    if (visited.has(x)) continue;

    const orbit = new Set<number>();
    for (let g = 0; g < group.order; g++) {
      const gInv = group.inverses[g];
      const conj = group.table[group.table[g][x]][gInv];
      orbit.add(conj);
    }

    const elements = Array.from(orbit).sort((a, b) => a - b);
    elements.forEach((el) => visited.add(el));

    const cent = calculateCentralizer(group, [x]);
    classes.push({
      representativeIndex: x,
      representativeLabel: group.elements[x],
      elements,
      elementLabels: elements.map((i) => group.elements[i]),
      size: elements.length,
      centralizerOrder: cent.centralizerOrder,
      isCentral: elements.length === 1,
    });
  }

  const centralElements = classes
    .filter((c) => c.isCentral)
    .map((c) => c.representativeLabel);
  const nonCentralClassSizes = classes
    .filter((c) => !c.isCentral)
    .map((c) => c.size)
    .sort((a, b) => a - b);

  const zOrder = centralElements.length;
  const sumOfSizes = classes.reduce((acc, c) => acc + c.size, 0);
  const partitionVerified = sumOfSizes === group.order;

  const classEquationString =
    nonCentralClassSizes.length > 0
      ? `${group.order} = ${zOrder} + ${nonCentralClassSizes.join(' + ')}`
      : `${group.order} = ${zOrder} (all elements are central)`;

  const classEquationLatex =
    nonCentralClassSizes.length > 0
      ? `|G| = |Z(G)| + \\sum [G : C_G(x_i)] \\implies ${group.order} = ${zOrder} + ${nonCentralClassSizes.join(' + ')}`
      : `|G| = |Z(G)| = ${zOrder}`;

  return {
    groupOrder: group.order,
    classes,
    centralElements,
    nonCentralClassSizes,
    classEquationString,
    classEquationLatex,
    partitionVerified,
    sumOfSizes,
  };
}
