import { Fragment } from 'react';
import { MathFormula, MathText } from './MathFormula.tsx';

function normalizeLatexDelimiters(raw: string): string {
  return raw
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => `\n$$${inner.trim()}$$\n`)
    .replace(/\\\(([^\n]*?)\\\)/g, (_m, inner: string) => `$${inner.trim()}$`);
}

function renderInlineFormatted(text: string) {
  // Split inline **bold**, `code`, and *italic* while keeping $...$ intact for MathText
  const tokenRe = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  const parts: Array<{ kind: 'plain' | 'bold' | 'code' | 'italic'; value: string }> = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ kind: 'plain', value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push({ kind: 'bold', value: token.slice(2, -2) });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push({ kind: 'code', value: token.slice(1, -1) });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push({ kind: 'italic', value: token.slice(1, -1) });
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push({ kind: 'plain', value: text.slice(last) });
  }

  return (
    <>
      {parts.map((part, idx) => {
        if (part.kind === 'bold') {
          return (
            <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">
              <MathText text={part.value} />
            </strong>
          );
        }
        if (part.kind === 'code') {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/70 font-mono text-[12px] text-slate-900 dark:text-slate-100"
            >
              {part.value}
            </code>
          );
        }
        if (part.kind === 'italic') {
          return (
            <em key={idx} className="italic">
              <MathText text={part.value} />
            </em>
          );
        }
        return (
          <Fragment key={idx}>
            <MathText text={part.value} />
          </Fragment>
        );
      })}
    </>
  );
}

export function FormattedTutorText({ text }: { text: string }) {
  const normalized = normalizeLatexDelimiters(text);
  // Split display math blocks $$...$$ out first
  const segments = normalized.split(/(\$\$[\s\S]+?\$\$)/g);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {segments.map((segment, segIdx) => {
        const trimmed = segment.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const latex = trimmed.slice(2, -2).trim();
          return (
            <div
              key={segIdx}
              className="px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto"
            >
              <MathFormula latex={latex} display />
            </div>
          );
        }

        // Render Markdown blocks line-by-line (headings, bullet lists, numbered lists, paragraphs)
        const lines = trimmed.split('\n');
        const blocks: Array<
          | { type: 'heading'; text: string }
          | { type: 'ul'; items: string[] }
          | { type: 'ol'; items: string[] }
          | { type: 'p'; text: string }
        > = [];

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
          if (headingMatch) {
            blocks.push({ type: 'heading', text: headingMatch[1] });
            continue;
          }

          const ulMatch = line.match(/^[-*•]\s+(.+)$/);
          if (ulMatch) {
            const last = blocks[blocks.length - 1];
            if (last && last.type === 'ul') {
              last.items.push(ulMatch[1]);
            } else {
              blocks.push({ type: 'ul', items: [ulMatch[1]] });
            }
            continue;
          }

          const olMatch = line.match(/^\d+[.)]\s+(.+)$/);
          if (olMatch) {
            const last = blocks[blocks.length - 1];
            if (last && last.type === 'ol') {
              last.items.push(olMatch[1]);
            } else {
              blocks.push({ type: 'ol', items: [olMatch[1]] });
            }
            continue;
          }

          const last = blocks[blocks.length - 1];
          if (last && last.type === 'p') {
            last.text += ` ${line}`;
          } else {
            blocks.push({ type: 'p', text: line });
          }
        }

        return (
          <div key={segIdx} className="space-y-2">
            {blocks.map((block, bIdx) => {
              if (block.type === 'heading') {
                return (
                  <h4
                    key={bIdx}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-1"
                  >
                    {renderInlineFormatted(block.text)}
                  </h4>
                );
              }
              if (block.type === 'ul') {
                return (
                  <ul key={bIdx} className="list-disc pl-5 space-y-1">
                    {block.items.map((item, i) => (
                      <li key={i}>{renderInlineFormatted(item)}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === 'ol') {
                return (
                  <ol key={bIdx} className="list-decimal pl-5 space-y-1">
                    {block.items.map((item, i) => (
                      <li key={i}>{renderInlineFormatted(item)}</li>
                    ))}
                  </ol>
                );
              }
              return <p key={bIdx}>{renderInlineFormatted(block.text)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
