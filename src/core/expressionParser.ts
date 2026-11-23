import { generateSubgroupFromElements } from './groupEngine.ts';
import { FiniteGroup } from './groupTypes.ts';
import { toSuperscript } from '../utils/mathUnicode.ts';

export interface ParsedSubsetResult {
  indices: number[];
  isGenerator: boolean;
  parsedLabels: string[];
  error?: string;
}

function normalizeCandidateToken(raw: string): string {
  let t = raw.trim();
  // Convert caret exponents like r^2, r^3s, g^-1 -> r², r³s, g⁻¹
  t = t.replace(/\^(-?\d+)/g, (_, exp: string) => toSuperscript(exp));
  // Normalize cycle spaces like (1,2) -> (1 2) in symmetric/alternating groups
  if (/^\(\d+(?:,\d+)+\)(?:\(\d+(?:,\d+)+\))*$/.test(t)) {
    t = t.replace(/,/g, ' ');
  }
  return t;
}

function splitTopLevelTokens(inner: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '(') depth++;
    else if (ch === ')' && depth > 0) depth--;

    if (ch === ',' && depth === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());

  // If user typed space-separated tokens without commas (e.g. "e r r^2")
  if (tokens.length === 1 && /\s+/.test(tokens[0]) && !tokens[0].includes('(')) {
    return tokens[0].split(/\s+/).filter(Boolean);
  }
  return tokens;
}

export function parseSubsetExpression(group: FiniteGroup, rawInput: string): ParsedSubsetResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      indices: [],
      isGenerator: false,
      parsedLabels: [],
      error: 'Enter elements or generators, e.g. ⟨r²⟩, {e, r²}, or (1 2)(3 4).',
    };
  }

  let isGenerator = false;
  let body = trimmed;

  if (
    (trimmed.startsWith('⟨') && trimmed.endsWith('⟩')) ||
    (trimmed.startsWith('<') && trimmed.endsWith('>'))
  ) {
    isGenerator = true;
    body = trimmed.slice(1, -1).trim();
  } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    body = trimmed.slice(1, -1).trim();
  }

  const rawTokens = splitTopLevelTokens(body);
  if (rawTokens.length === 0) {
    return {
      indices: [],
      isGenerator,
      parsedLabels: [],
      error: 'No elements detected in the expression.',
    };
  }

  const lookup = new Map<string, number>();
  group.elements.forEach((el, idx) => {
    lookup.set(el, idx);
    lookup.set(el.replace(/\s+/g, ''), idx);
  });

  const matchedIndices: number[] = [];
  const unknownTokens: string[] = [];

  for (const tok of rawTokens) {
    const normalized = normalizeCandidateToken(tok);
    const direct =
      lookup.get(normalized) ??
      lookup.get(normalized.replace(/\s+/g, '')) ??
      lookup.get(tok.trim());
    if (direct !== undefined) {
      if (!matchedIndices.includes(direct)) matchedIndices.push(direct);
    } else {
      unknownTokens.push(tok);
    }
  }

  if (unknownTokens.length > 0) {
    return {
      indices: [],
      isGenerator,
      parsedLabels: [],
      error: `Element(s) not found in ${group.name}: ${unknownTokens.join(', ')}. Available samples: ${group.elements.slice(0, 6).join(', ')}.`,
    };
  }

  const finalIndices = isGenerator
    ? generateSubgroupFromElements(group, matchedIndices)
    : [...matchedIndices].sort((a, b) => a - b);

  return {
    indices: finalIndices,
    isGenerator,
    parsedLabels: finalIndices.map((i) => group.elements[i]),
  };
}
