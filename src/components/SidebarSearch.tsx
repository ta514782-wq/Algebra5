import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathText } from './MathFormula.tsx';
import { LearningTopic } from '../data/topics.ts';
import {
  buildSidebarSearchIndex,
  searchSidebarIndex,
  SidebarSearchItem,
} from '../utils/sidebarSearch.ts';

interface SidebarSearchProps {
  query: string;
  onQueryChange: (next: string) => void;
  customTopics?: LearningTopic[];
  onSelectResult: (item: SidebarSearchItem) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const CATEGORY_TEXT_CLASS: Record<SidebarSearchItem['category'], string> = {
  Lab: 'text-blue-600 dark:text-blue-400',
  Concept: 'text-emerald-600 dark:text-emerald-400',
  Proof: 'text-violet-600 dark:text-violet-400',
  Formula: 'text-amber-600 dark:text-amber-400',
  Glossary: 'text-cyan-600 dark:text-cyan-400',
  Exercise: 'text-indigo-600 dark:text-indigo-400',
  'Real-World': 'text-teal-600 dark:text-teal-400',
};

export function SidebarSearch({
  query,
  onQueryChange,
  customTopics,
  onSelectResult,
  inputRef,
}: SidebarSearchProps) {
  const fallbackRef = useRef<HTMLInputElement | null>(null);
  const resolvedRef = inputRef ?? fallbackRef;
  const [activeIdx, setActiveIdx] = useState(0);

  const index = useMemo(
    () => buildSidebarSearchIndex(customTopics),
    [customTopics]
  );

  const results = useMemo(
    () => searchSidebarIndex(index, query, 24),
    [index, query]
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (query) {
        e.preventDefault();
        onQueryChange('');
      } else {
        resolvedRef.current?.blur();
      }
      return;
    }
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIdx] ?? results[0];
      if (target) {
        onSelectResult(target);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        <input
          ref={resolvedRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search concepts, labs, and references"
          placeholder="Search concepts, labs..."
          className="w-full h-8 pl-8 pr-12 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange('');
              resolvedRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1.5 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 pointer-events-none"
          >
            /
          </span>
        )}
      </div>

      {query.trim().length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            <span>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
            <span>Enter to open</span>
          </div>

          {results.length === 0 ? (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400">
              No matching labs, concepts, formulas, or glossary terms found.
            </div>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-0.5">
              {results.map((item, idx) => {
                const selected = idx === activeIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => onSelectResult(item)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      selected
                        ? 'border-blue-500/80 bg-blue-50/70 dark:bg-blue-950/50'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_TEXT_CLASS[item.category]}`}>
                        {item.category}
                      </span>
                      <ArrowRight className={`w-3 h-3 shrink-0 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 opacity-60'}`} />
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                      <MathText text={item.title} />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <MathText text={item.subtitle} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
