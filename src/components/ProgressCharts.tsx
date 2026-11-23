import { useMemo } from 'react';
import { StudentProgressState } from '../pages/DashboardPage.tsx';

export function StudentPerformanceCharts({ progress }: { progress: StudentProgressState }) {
  const sessionTrend = useMemo(() => {
    const combined = [
      ...progress.practice.map((p) => ({
        date: p.created_at,
        label: `Practice (${p.topic_id})`,
        pct: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0,
        kind: 'practice' as const,
      })),
      ...progress.exams.map((e) => ({
        date: e.created_at,
        label: `Mock Exam (${e.question_count} Qs)`,
        pct: Math.round(e.percentage),
        kind: 'exam' as const,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    return combined.slice(-16);
  }, [progress]);

  if (sessionTrend.length === 0) {
    return null;
  }

  const width = 640;
  const height = 190;
  const padL = 38;
  const padR = 18;
  const padT = 18;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const points = sessionTrend.map((pt, i) => {
    const x = sessionTrend.length === 1 ? padL + innerW / 2 : padL + (i / (sessionTrend.length - 1)) * innerW;
    const y = padT + ((100 - pt.pct) / 100) * innerH;
    return { ...pt, x, y, idx: i + 1 };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Accuracy Progression Over Time
        </h2>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            Practice Session
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Mock Exam
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[440px] max-h-56" role="img" aria-label="Student accuracy trend chart">
          {[0, 25, 50, 75, 100].map((tick) => {
            const ty = padT + ((100 - tick) / 100) * innerH;
            return (
              <g key={tick}>
                <line x1={padL} x2={width - padR} y1={ty} y2={ty} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="3 3" />
                <text x={padL - 8} y={ty + 3} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
                  {tick}%
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polyline}
            />
          )}

          {points.map((p) => (
            <g key={`${p.date}-${p.idx}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={5}
                className={p.kind === 'exam' ? 'fill-emerald-600' : 'fill-blue-600'}
                stroke="#ffffff"
                strokeWidth={1.5}
              >
                <title>{`${p.label}: ${p.pct}% (${p.date.slice(0, 10)})`}</title>
              </circle>
              <text x={p.x} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
                #{p.idx}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
