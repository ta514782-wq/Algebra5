import katex from 'katex';
import { Fragment, useMemo } from 'react';
import { toSubscript } from '../utils/mathUnicode.ts';

const katexHtmlCache = new Map<string, string>();

export function renderKatexCached(latex: string, display: boolean): string {
  const key = `${display ? 'D' : 'I'}:${latex}`;
  const cached = katexHtmlCache.get(key);
  if (cached !== undefined) return cached;

  let html = latex;
  try {
    html = katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
    });
  } catch {
    html = latex;
  }

  if (katexHtmlCache.size > 4000) {
    katexHtmlCache.clear();
  }
  katexHtmlCache.set(key, html);
  return html;
}

interface MathFormulaProps {
  latex: string;
  display?: boolean;
  className?: string;
}

export function MathFormula({ latex, display = false, className = '' }: MathFormulaProps) {
  const html = useMemo(() => renderKatexCached(latex, display), [latex, display]);

  if (display) {
    return (
      <div
        className={`overflow-x-auto py-1 text-slate-900 dark:text-slate-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-baseline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const UNICODE_SUB_REV: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  ₐ: 'a',
  ₑ: 'e',
  ᵢ: 'i',
  ⱼ: 'j',
  ₖ: 'k',
  ₘ: 'm',
  ₙ: 'n',
  ₒ: 'o',
  ₚ: 'p',
  ᵣ: 'r',
  ₛ: 's',
  ₜ: 't',
  ₓ: 'x',
};

const UNICODE_SUP_REV: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
  '⁺': '+',
  ⁿ: 'n',
  ⁱ: 'i',
};

export function convertUnicodeMathToLatex(raw: string): string {
  let s = raw.trim();

  // Escape set braces { ... } that are NOT preceded by _ / ^ / LaTeX command
  let escaped = '';
  const latexBraceDepthStack: boolean[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      const prev = i > 0 ? s[i - 1] : '';
      const before = s.slice(Math.max(0, i - 14), i);
      const isLatexArg =
        prev === '_' ||
        prev === '^' ||
        /\\[a-zA-Z]+$/.test(before) ||
        /\\frac(?:\{[^}]*\})?$/.test(before);
      if (isLatexArg) {
        latexBraceDepthStack.push(false);
        escaped += '{';
      } else {
        latexBraceDepthStack.push(true);
        escaped += '\\{';
      }
    } else if (ch === '}') {
      const wasSet = latexBraceDepthStack.pop();
      escaped += wasSet ? '\\}' : '}';
    } else {
      escaped += ch;
    }
  }
  s = escaped;

  // Preserve cycle spacing inside permutation cycles like (1 2 3) -> (1\,2\,3)
  s = s.replace(/\((\d+(?:\s+\d+)+)\)/g, (_m, inner: string) => {
    return `(${inner.trim().replace(/\s+/g, '\\,')})`;
  });

  // Replace Unicode subscript and superscript runs
  s = s.replace(/[₀-₉ₐₑᵢⱼₖₘₙₒₚᵣₛₜₓ]+/g, (m) => {
    const mapped = m
      .split('')
      .map((c) => UNICODE_SUB_REV[c] ?? c)
      .join('');
    return `_{${mapped}}`;
  });

  s = s.replace(/[⁰-⁹⁻⁺ⁿⁱ]+/g, (m) => {
    const mapped = m
      .split('')
      .map((c) => UNICODE_SUP_REV[c] ?? c)
      .join('');
    return `^{${mapped}}`;
  });

  // Normalize ASCII group subscripts & superscripts
  s = s.replace(/\^(\-?[A-Za-z0-9]+)/g, '^{$1}');
  s = s.replace(/ℤ_(\{(?:[^{}]|\{[^{}]*\})*\}|[A-Za-z0-9]+)/g, (_m, g: string) =>
    g.startsWith('{') ? `\\mathbb{Z}_${g}` : `\\mathbb{Z}_{${g}}`
  );
  s = s.replace(/ℤ/g, '\\mathbb{Z}');
  s = s.replace(/\bZ_(\{(?:[^{}]|\{[^{}]*\})*\}|[A-Za-z0-9]+)/g, (_m, g: string) =>
    g.startsWith('{') ? `\\mathbb{Z}_${g}` : `\\mathbb{Z}_{${g}}`
  );
  s = s.replace(/\b([A-Za-z])_([A-Za-z0-9]+)\b/g, '$1_{$2}');

  // Clean double braces like _{{12}} -> _{12}
  s = s.replace(/_\{\{([^{}]+)\}\}/g, '_{$1}');
  s = s.replace(/\^\{\{([^{}]+)\}\}/g, '^{$1}');

  // Math symbols & operators
  s = s
    .replace(/⟨/g, '\\langle ')
    .replace(/⟩/g, '\\rangle ')
    .replace(/◁/g, '\\trianglelefteq ')
    .replace(/⋪/g, '\\ntrianglelefteq ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\ne ')
    .replace(/≅/g, '\\cong ')
    .replace(/∈/g, '\\in ')
    .replace(/∉/g, '\\notin ')
    .replace(/⊆/g, '\\subseteq ')
    .replace(/⊊/g, '\\subsetneq ')
    .replace(/⊂/g, '\\subset ')
    .replace(/∣/g, '\\mid ')
    .replace(/×/g, '\\times ')
    .replace(/⊕/g, '\\oplus ')
    .replace(/∘/g, '\\circ ')
    .replace(/·/g, '\\cdot ')
    .replace(/⇒/g, '\\implies ')
    .replace(/⇔/g, '\\iff ')
    .replace(/→/g, '\\to ')
    .replace(/↦/g, '\\mapsto ')
    .replace(/∀/g, '\\forall ')
    .replace(/∅/g, '\\emptyset ')
    .replace(/∑/g, '\\sum ')
    .replace(/∏/g, '\\prod ')
    .replace(/⋂/g, '\\bigcap ')
    .replace(/∩/g, '\\cap ')
    .replace(/∪/g, '\\cup ')
    .replace(/⋯/g, '\\cdots ')
    .replace(/…/g, '\\dots ')
    .replace(/′/g, "'")
    .replace(/−/g, '-');

  // Named algebra functions (avoid double-escaping existing \mathrm)
  s = s.replace(/(?<!\\)\b(Cl|Stab|ord|Aut|Inn|im)\b/g, '\\mathrm{$1}');
  s = s.replace(/(?<!\\)\b(lcm)\b/g, '\\operatorname{lcm}');
  s = s.replace(/(?<!\\)\b(gcd|ker)\b/g, '\\$1');
  s = s.replace(/(?<!\\)\bmod\b/g, '\\bmod ');

  return s;
}

// Primary inline math atom matcher
const MATH_ATOM_SOURCE = [
  // Angle-bracket generators <...>
  '⟨[^⟩\\n]+⟩',
  // Set literals {...}
  '\\{[^}\\n]+\\}',
  // Subgroup index [G : H] or [D₄ : ⟨r²⟩]
  '\\[[^\\]\\n]+:[^\\]\\n]+\\]',
  // Order bars |G|, |G/H|, |N_G(H)|
  '\\|[^|\\n]+\\|',
  // Normalizer / Centralizer / Centre / Named functions with parentheses
  '\\b[NC]_\\{?[A-Za-z0-9₀-₉]+\\}?\\([^()\\n]*(?:\\([^()\\n]*\\)[^()\\n]*)*\\)',
  '\\bZ\\([^()\\n]*(?:\\([^()\\n]*\\)[^()\\n]*)*\\)',
  '\\b(?:Cl|Stab|Aut|Inn|ker|im|lcm|gcd|ord)(?:_\\{?[^(\\s]+\\}?)?\\([^()\\n]*(?:\\([^()\\n]*\\)[^()\\n]*)*\\)',
  // Permutation cycles (1 2), (1 2)(3 4), or coordinate tuples (1, 2)
  '(?:\\(\\d+(?:[\\s,]+\\d+)+\\))+',
  // Group symbols with subscript (Z_6, ℤ₆, D₄, S₃, A₄, V₄, Q₈, D_n, ℤₙ, ℤ_{p^{e_{p,j}}})
  '(?:ℤ|\\b[ZDSAVQ])(?:_\\{(?:[^{}]|\\{[^{}]*\\})*\\}|_[A-Za-z0-9ᵢⱼₖₘₙₚ]+|[₀-₉ₙₖₘₚᵢⱼ]+)',
  // Bases with Unicode or ASCII scripts (r², r²s, g⁻¹, xᵢ, 3ℤ₆, p₁^{a₁}, d_{m-1}, ⊕_p, A_p)
  '[A-Za-z0-9⊕)\\]}⟩]+(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿⁱ]+|[₀-₉ₙₖₘₚᵢⱼ]+|\\^\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\^[A-Za-z0-9\\-]+|_\\{(?:[^{}]|\\{[^{}]*\\})*\\}|_[A-Za-z0-9ᵢⱼₖₘₙₚ]+)+[A-Za-z0-9₀-₉⁰-⁹⁻′]*',
  // Quotient notation G/H, D₄/H, G/ker(φ)
  '(?:\\([^()\\n]+\\)|\\b[A-Z][₀-₉]*)\\/(?:⟨[^⟩\\n]+⟩|\\b[A-Z][₀-₉]*\\b)',
  // Common multi-letter coset/commutation tokens (gH, Hg, rH, sH, rsH, sr, rs, gh, hg, ab, ba, gs, sg, zg, gz)
  '\\b(?:[ghabxyrs][HKN]|[HKN][ghabxy]|rsH|gh|hg|ab|ba|gs|sg|zg|gz|sr|rs)\\b',
  // Standalone math symbols & blackboard Z
  '[∈∉⊆⊂⊊≤≥≠≅◁⋪∣×⊕∘·⇒⇔→↦∀∅∑∏⋂∩∪⋯≡ℤ]',
].join('|');

const MATH_ATOM_RE = new RegExp(MATH_ATOM_SOURCE, 'g');

const CONNECTOR_BETWEEN_MATH_RE =
  /^\s*(?:[=≠≤≥<>+−*×⊕∘·∈∉⊆⊂⊊◁⋪≅∣⇒⇔→↦≡:/]|(?:\s+(?:[GHKNSVQghxynmpdkrse]|e|\d+)\s+))\s*$/;

const STANDALONE_VAR_IN_PROSE_RE =
  /(?<![A-Za-z0-9\-'])(?:(subgroup|group|subset|element|elements|coset|centre|center|normalizer|centralizer|kernel|quotient|divisor|prime|order|index|integer|integers|modulo|mod|in|of|to|by|for|inside|let|when|if|where|than|with|from|since|every|each|all|some|any|no|exists|divides)\s+(?:([GHKNSVZQghxynmpdkrse])(?![A-Za-z0-9\-'])|(a)(?=\s*(?:,|and\b|or\b)))|([GHKN])(?![A-Za-z0-9\-']))/g;

interface Segment {
  kind: 'text' | 'math';
  value: string;
  display?: boolean;
}

function splitProseSegment(chunk: string): Segment[] {
  if (!chunk) return [];

  // Pass 1: find strong math atoms
  const matches: Array<{ start: number; end: number }> = [];
  MATH_ATOM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MATH_ATOM_RE.exec(chunk)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
  }

  // Merge adjacent math atoms joined by math connectors (e.g., "H = ⟨r²⟩ = {e, r²}" or "6 = 1 + 2 + 3")
  const merged: Array<{ start: number; end: number }> = [];
  for (const cur of matches) {
    if (merged.length === 0) {
      merged.push({ ...cur });
      continue;
    }
    const prev = merged[merged.length - 1];
    const gap = chunk.slice(prev.end, cur.start);
    if (
      gap.length <= 24 &&
      (/^\s*$/.test(gap) ||
        CONNECTOR_BETWEEN_MATH_RE.test(gap) ||
        /^\s*(?:[,+−=≠≤≥<>×∘·∈∉⊆⊂⊊◁⋪≅∣⇒⇔→↦≡:/()]|\s+[GHKNSVQghxynmpdkrse0-9]+\s*)+$/.test(gap))
    ) {
      prev.end = cur.end;
    } else {
      merged.push({ ...cur });
    }
  }

  // Expand slightly if equation starts/ends with simple lhs/rhs like "a = ..." or "... = 6" or "(...) = H"
  for (const span of merged) {
    const before = chunk.slice(0, span.start);
    const lhsMatch = before.match(/(?:^|[\s(,;])([A-Za-z0-9]+(?:\([^)]*\))?\s*(?:[=≠≤≥<>+−*×∘·∈∉⊆⊂⊊◁⋪≅∣⇒⇔→↦≡]|:\s*))$/)
      ?? before.match(/(?:^|[\s(,;])((?:\d+|[ghxynabrs])(?:\s*[=≠≤≥+−×·]\s*))$/);
    if (lhsMatch && lhsMatch[1]) {
      const shift = lhsMatch[1].length;
      if (span.start - shift >= 0) {
        // Ensure we didn't grab an English word before "="
        const grabbed = chunk.slice(span.start - shift, span.start).trim();
        if (grabbed.length <= 12 && !/^(is|are|was|the|and|for|but|not|with|from|into|that|this)$/i.test(grabbed.replace(/[=:+−]/g, '').trim())) {
          span.start -= shift;
        }
      }
    }

    const after = chunk.slice(span.end);
    const rhsMatch = after.match(/^(\s*(?:[=≠≤≥<>+−*×∘·∈∉⊆⊂⊊◁⋪≅∣⇒⇔→↦≡])\s*(?:\([^)]+\)|[A-Za-z0-9₀-₉⁰-⁹⁻]+))/);
    if (rhsMatch && rhsMatch[1]) {
      span.end += rhsMatch[1].length;
    }
  }

  // Re-merge any spans that now touch or overlap
  const coalesced: Array<{ start: number; end: number }> = [];
  for (const span of merged) {
    if (coalesced.length === 0) {
      coalesced.push(span);
      continue;
    }
    const prev = coalesced[coalesced.length - 1];
    const gap = chunk.slice(prev.end, span.start);
    if (span.start <= prev.end || /^\s*[=≠≤≥+−×·∈∉⊆⊂⊊◁⋪≅∣⇒⇔→↦≡]\s*$/.test(gap)) {
      prev.end = Math.max(prev.end, span.end);
    } else {
      coalesced.push(span);
    }
  }

  const out: Segment[] = [];
  let cursor = 0;

  const pushProseWithSingleVars = (prose: string) => {
    if (!prose) return;
    STANDALONE_VAR_IN_PROSE_RE.lastIndex = 0;
    let pCursor = 0;
    let vm: RegExpExecArray | null;
    while ((vm = STANDALONE_VAR_IN_PROSE_RE.exec(prose)) !== null) {
      if (vm[1] && vm[2]) {
        // Group 1 = context word, Group 2 = variable
        const varStart = vm.index + vm[0].length - vm[2].length;
        if (varStart > pCursor) {
          out.push({ kind: 'text', value: prose.slice(pCursor, varStart) });
        }
        out.push({ kind: 'math', value: vm[2] });
        pCursor = varStart + vm[2].length;
      } else if (vm[3]) {
        if (vm.index > pCursor) {
          out.push({ kind: 'text', value: prose.slice(pCursor, vm.index) });
        }
        out.push({ kind: 'math', value: vm[3] });
        pCursor = vm.index + vm[3].length;
      }
    }
    if (pCursor < prose.length) {
      out.push({ kind: 'text', value: prose.slice(pCursor) });
    }
  };

  for (const span of coalesced) {
    if (span.start > cursor) {
      pushProseWithSingleVars(chunk.slice(cursor, span.start));
    }
    out.push({ kind: 'math', value: convertUnicodeMathToLatex(chunk.slice(span.start, span.end)) });
    cursor = span.end;
  }
  if (cursor < chunk.length) {
    pushProseWithSingleVars(chunk.slice(cursor));
  }

  return out;
}

export function splitNotebookSegments(text: string): Segment[] {
  if (!text) return [];
  // Normalize raw LaTeX backslashes if someone wrote e.g. "\mathbb{Z}_n" without $ delimiters
  // Or handle explicit $$...$$ and $...$ first
  const segments: Segment[] = [];
  const dollarRe = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = dollarRe.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push(...splitProseSegment(text.slice(lastIdx, match.index)));
    }
    if (match[1]) {
      segments.push({ kind: 'math', value: match[1].trim(), display: true });
    } else if (match[2]) {
      segments.push({ kind: 'math', value: match[2].trim(), display: false });
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    segments.push(...splitProseSegment(text.slice(lastIdx)));
  }

  return segments;
}

export function MathText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const segments = useMemo(() => splitNotebookSegments(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, idx) =>
        seg.kind === 'text' ? (
          <Fragment key={idx}>{seg.value}</Fragment>
        ) : (
          <MathFormula key={idx} latex={seg.value} display={seg.display} />
        )
      )}
    </span>
  );
}

export function formatGroupShortUnicode(raw: string): string {
  return raw
    .replace(/\bZ_(\d+)/g, (_, d) => `ℤ${toSubscript(d)}`)
    .replace(/\b([DSAVQ])_(\d+)/g, (_, g, d) => `${g}${toSubscript(d)}`);
}
