import { Check, ChevronDown, ChevronRight, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BreadcrumbSegment } from '../utils/breadcrumbs.ts';

interface BreadcrumbBarProps {
  segments: BreadcrumbSegment[];
  activePage: string;
  onNavigate: (page: string) => void;
  onResetSubContext?: () => void;
}

export function BreadcrumbBar({
  segments,
  activePage,
  onNavigate,
  onResetSubContext,
}: BreadcrumbBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const barRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setOpenMenuId(null);
  }, [activePage]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuId]);

  return (
    <nav
      ref={barRef}
      aria-label="Breadcrumb"
      className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#090F1D]/90 px-4 sm:px-6 lg:px-8 py-2.5"
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {segments.map((segment, index) => {
          const isHome = segment.id === 'home';
          const hasSiblings = Boolean(segment.siblingItems && segment.siblingItems.length > 0);
          const menuOpen = openMenuId === segment.id;

          return (
            <li key={segment.id} className="relative flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0"
                />
              )}

              {segment.isCurrent ? (
                <span
                  aria-current="page"
                  className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[240px] sm:max-w-[380px]"
                  title={segment.label}
                >
                  {segment.label}
                </span>
              ) : hasSiblings ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setOpenMenuId((prev) => (prev === segment.id ? null : segment.id))}
                    className="inline-flex items-center gap-1 py-0.5 px-1 -mx-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                  >
                    <span>{segment.label}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-3 h-3 opacity-70 transition-transform duration-150 ${
                        menuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {menuOpen && segment.siblingItems && (
                    <div
                      role="menu"
                      aria-label={`${segment.label} pages`}
                      className="absolute left-0 top-full mt-1.5 z-40 w-56 max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700/90 bg-white dark:bg-[#0D1526] shadow-lg py-1"
                    >
                      {segment.siblingItems.map((sibling) => {
                        const isSiblingActive = sibling.id === activePage;
                        return (
                          <button
                            key={sibling.id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              onNavigate(sibling.id);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                              isSiblingActive
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <span className="truncate">{sibling.label}</span>
                            {isSiblingActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (segment.targetPage === activePage && onResetSubContext) {
                      onResetSubContext();
                    } else if (segment.targetPage) {
                      onNavigate(segment.targetPage);
                    }
                  }}
                  className="inline-flex items-center gap-1 py-0.5 px-1 -mx-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                >
                  {isHome && <Home aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
                  <span>{segment.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
