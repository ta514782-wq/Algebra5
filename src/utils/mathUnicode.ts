const SUB_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  a: 'ₐ',
  e: 'ₑ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  x: 'ₓ',
};

const SUP_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  '+': '⁺',
  n: 'ⁿ',
  i: 'ⁱ',
};

export function toSubscript(input: string | number): string {
  return String(input)
    .split('')
    .map((ch) => SUB_MAP[ch] ?? ch)
    .join('');
}

export function toSuperscript(input: string | number): string {
  return String(input)
    .split('')
    .map((ch) => SUP_MAP[ch] ?? ch)
    .join('');
}

export function normalizePlainMath(text: string): string {
  return text
    .replace(/\bZ_(\d+)/g, (_, d) => `ℤ${toSubscript(d)}`)
    .replace(/\bZ_([a-z])/g, (_, c) => `ℤ${toSubscript(c)}`)
    .replace(/\b([DSAVQ])_(\d+)/g, (_, g, d) => `${g}${toSubscript(d)}`)
    .replace(/\b([DSAVQ])_([a-z])/g, (_, g, c) => `${g}${toSubscript(c)}`)
    .replace(/\^\{(-?\d+)\}/g, (_, e) => toSuperscript(e))
    .replace(/\^(-?\d+)/g, (_, e) => toSuperscript(e));
}
