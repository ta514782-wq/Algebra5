import { FiniteGroup, QuotientGroupAnalysis } from '../core/groupTypes.ts';
import { SolverOutput } from '../core/solverEngine.ts';

function opSymbolLatex(op: string): string {
  if (op === '∘') return '\\circ';
  if (op === '+') return '+';
  if (op === '*') return '*';
  return '\\cdot';
}

export function cayleyTableToLatex(group: FiniteGroup, maxSize = 24): string {
  const n = Math.min(group.order, maxSize);
  const op = opSymbolLatex(group.operationSymbol);
  const colSpec = `c|${'c'.repeat(n)}`;
  const header = `${op} & ${group.latexElements.slice(0, n).join(' & ')} \\\\`;
  const rows = group.table.slice(0, n).map((row, i) => {
    const cells = row.slice(0, n).map((val) => group.latexElements[val]);
    return `${group.latexElements[i]} & ${cells.join(' & ')} \\\\`;
  });

  const lines = [
    `% Cayley Table for ${group.name} (|G| = ${group.order})`,
    `\\begin{array}{${colSpec}}`,
    header,
    `\\hline`,
    ...rows,
    `\\end{array}`,
  ];
  return lines.join('\n');
}

export function quotientToLatex(group: FiniteGroup, quotient: QuotientGroupAnalysis): string {
  if (!quotient.canConstruct || !quotient.quotientGroup) {
    return `% Quotient group cannot be constructed for ${group.name}: H is not normal.`;
  }
  const qG = quotient.quotientGroup;
  const cosetLines = (quotient.quotientElements ?? []).map(
    (el) => `  ${el.latexLabel} &= \\{${el.members.map((m) => group.latexElements[m]).join(', ')}\\}`
  );

  return [
    `% Quotient Group ${qG.name}`,
    `\\begin{aligned}`,
    ...cosetLines.map((line, i) => (i < cosetLines.length - 1 ? `${line} \\\\` : line)),
    `\\end{aligned}`,
    ``,
    cayleyTableToLatex(qG),
  ].join('\n');
}

export function solverSolutionToLatex(solution: SolverOutput): string {
  const lines = [
    `% ${solution.problemTitle}`,
    `\\textbf{Theorem:} ${solution.relevantTheorem}`,
    ``,
    `\\begin{equation*}`,
    `  ${solution.formulaLatex}`,
    `\\end{equation*}`,
    ``,
    `\\textbf{Given:}`,
    `\\begin{itemize}`,
    ...solution.givenInfo.map((g) => `  \\item ${g}`),
    `\\end{itemize}`,
    ``,
    `\\textbf{Verified Steps:}`,
    `\\begin{enumerate}`,
    ...solution.steps.map((s) => `  \\item ${s.replace(/^\d+\.\s*/, '')}`),
    `\\end{enumerate}`,
    ``,
    `\\textbf{Conclusion:} ${solution.finalAnswer}`,
    ``,
    `% Verification: ${solution.verificationSummary}`,
  ];
  return lines.join('\n');
}
