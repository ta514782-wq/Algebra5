import { AlertTriangle, CheckCircle2, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PRESET_GROUPS } from '../core/groupEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import {
  analyzeHomomorphism,
  buildPresetHomomorphisms,
} from '../core/homomorphismEngine.ts';
import { MathFormula, MathText } from './MathFormula.tsx';
import { IsomorphismWitnessPanel } from './QuotientStructureVisuals.tsx';

export function FirstIsomorphismPanel({ activeLabGroup }: { activeLabGroup: FiniteGroup }) {
  const presets = useMemo(() => buildPresetHomomorphisms(), []);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0].id);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');

  const activePreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId) ?? presets[0],
    [presets, selectedPresetId]
  );

  const [sourceGroup, setSourceGroup] = useState<FiniteGroup>(activePreset.sourceGroup);
  const [targetGroup, setTargetGroup] = useState<FiniteGroup>(activePreset.targetGroup);
  const [mapArray, setMapArray] = useState<number[]>(activePreset.mapArray);

  useEffect(() => {
    if (mode === 'preset') {
      setSourceGroup(activePreset.sourceGroup);
      setTargetGroup(activePreset.targetGroup);
      setMapArray(activePreset.mapArray);
    }
  }, [activePreset, mode]);

  const analysis = useMemo(
    () => analyzeHomomorphism(sourceGroup, targetGroup, mapArray),
    [sourceGroup, targetGroup, mapArray]
  );

  const handleLoadActiveLabAsSource = () => {
    setMode('custom');
    setSourceGroup(activeLabGroup);
    setMapArray(new Array(activeLabGroup.order).fill(targetGroup.identityIndex));
  };

  const handleSourceKeyChange = (key: string) => {
    const pg = PRESET_GROUPS.find((p) => p.key === key);
    if (!pg) return;
    const g = pg.build();
    setMode('custom');
    setSourceGroup(g);
    setMapArray(new Array(g.order).fill(targetGroup.identityIndex));
  };

  const handleTargetKeyChange = (key: string) => {
    const pg = PRESET_GROUPS.find((p) => p.key === key);
    if (!pg) return;
    const g = pg.build();
    setMode('custom');
    setTargetGroup(g);
    setMapArray(new Array(sourceGroup.order).fill(g.identityIndex));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              First Isomorphism Theorem Workbench
            </p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Homomorphisms, Kernels & <MathFormula latex="G / \ker(\varphi) \cong \mathrm{Im}(\varphi)" />
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Test <MathFormula latex="\varphi(a \star b) = \varphi(a) \star' \varphi(b)" /> across all{' '}
              <span className="tabular-nums font-medium">{analysis.totalPairs}</span> pairs, inspect{' '}
              <MathFormula latex="\ker(\varphi) \trianglelefteq G" />, or edit element mappings live to break or repair a homomorphism.
            </p>
          </div>

          <div
            className={`px-3.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
              analysis.isHomomorphism
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {analysis.isHomomorphism ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>
              {analysis.isHomomorphism
                ? `Verified (${analysis.verifiedPairs}/${analysis.totalPairs} pairs)`
                : `Failed (${analysis.verifiedPairs}/${analysis.totalPairs} pairs)`}
            </span>
          </div>
        </div>

        {/* Curated Homomorphism Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presets.map((p) => {
            const isActive = mode === 'preset' && selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setMode('preset');
                  setSelectedPresetId(p.id);
                }}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                  <span><MathText text={p.title} /></span>
                  {p.intendedFailure && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  <MathText text={p.subtitle} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Source & Target Group Controls */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Domain Group <MathText text="G" />
              </label>
              <select
                value={PRESET_GROUPS.some((p) => p.key === sourceGroup.id) ? sourceGroup.id : ''}
                onChange={(e) => handleSourceKeyChange(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="" disabled>
                  {sourceGroup.name} (active)
                </option>
                {PRESET_GROUPS.map((pg) => (
                  <option key={pg.key} value={pg.key}>
                    {pg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Codomain Group <MathText text="G'" />
              </label>
              <select
                value={PRESET_GROUPS.some((p) => p.key === targetGroup.id) ? targetGroup.id : ''}
                onChange={(e) => handleTargetKeyChange(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="" disabled>
                  {targetGroup.name}
                </option>
                {PRESET_GROUPS.map((pg) => (
                  <option key={pg.key} value={pg.key}>
                    {pg.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleLoadActiveLabAsSource}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Use Active Lab Group (<MathText text={activeLabGroup.name} />)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode('custom');
              setMapArray(new Array(sourceGroup.order).fill(targetGroup.identityIndex));
            }}
            className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Set Trivial Map (<MathText text="g ↦ e'" />)
          </button>
        </div>
      </div>

      {/* Interactive Map Editor φ(g) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Interactive Element Assignment <MathFormula latex={`\\varphi: ${sourceGroup.latexName} \\to ${targetGroup.latexName}`} />
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Change any <MathText text="φ(g)" /> dropdown to test homomorphism preservation live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {sourceGroup.elements.slice(0, 24).map((_, sIdx) => {
            const mappedIdx = mapArray[sIdx] ?? targetGroup.identityIndex;
            const inKernel = mappedIdx === targetGroup.identityIndex;
            const isWitness =
              analysis.counterexample?.aIndex === sIdx || analysis.counterexample?.bIndex === sIdx;

            return (
              <div
                key={`${sourceGroup.id}-map-${sIdx}`}
                className={`p-2 rounded-lg border text-xs space-y-1.5 ${
                  isWitness
                    ? 'border-red-400 bg-red-50/70 dark:bg-red-950/30'
                    : inKernel
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-semibold text-slate-900 dark:text-slate-100">
                  <MathFormula latex={sourceGroup.latexElements[sIdx]} />
                  <span className="text-[10px] font-normal text-slate-500">
                    {inKernel ? '∈ ker' : `ord ${sourceGroup.orders[sIdx]}`}
                  </span>
                </div>
                <select
                  aria-label={`Image of ${sourceGroup.elements[sIdx]}`}
                  value={mappedIdx}
                  onChange={(e) => {
                    const next = [...mapArray];
                    next[sIdx] = Number(e.target.value);
                    setMode('custom');
                    setMapArray(next);
                  }}
                  className="w-full h-7 px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                >
                  {targetGroup.elements.map((tEl, tIdx) => (
                    <option key={tIdx} value={tIdx}>
                      ↦ {tEl}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counterexample Witness or Full First Isomorphism Results */}
      {!analysis.isHomomorphism && analysis.counterexample ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-base">
            <XCircle className="w-5 h-5" />
            Homomorphism Law Violated — Counterexample Found
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <MathText text={analysis.summary} />
          </p>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm space-y-2">
            <div>
              <MathFormula
                latex={`\\varphi(${analysis.counterexample.aLatex} \\star ${analysis.counterexample.bLatex}) = \\varphi(${sourceGroup.latexElements[sourceGroup.table[analysis.counterexample.aIndex][analysis.counterexample.bIndex]]}) = ${analysis.counterexample.lhsLatex}`}
              />
            </div>
            <div>
              <MathFormula
                latex={`\\varphi(${analysis.counterexample.aLatex}) \\star' \\varphi(${analysis.counterexample.bLatex}) = ${targetGroup.latexElements[mapArray[analysis.counterexample.aIndex]]} \\star' ${targetGroup.latexElements[mapArray[analysis.counterexample.bIndex]]} = ${analysis.counterexample.rhsLatex}`}
              />
            </div>
            <div className="font-semibold text-red-700 dark:text-red-300">
              <MathFormula latex={`${analysis.counterexample.lhsLatex} \\neq ${analysis.counterexample.rhsLatex}`} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kernel & Image Details */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Kernel, Image & Structural Properties
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500"><MathText text="|ker(φ)|" /></div>
                  <div className="text-lg font-bold font-mono tabular-nums mt-0.5">{analysis.kernelIndices.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500"><MathText text="|Im(φ)|" /></div>
                  <div className="text-lg font-bold font-mono tabular-nums mt-0.5">{analysis.imageIndices.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Injective?</div>
                  <div className="text-sm font-semibold mt-1">{analysis.isInjective ? 'Yes (ker = {e})' : 'No'}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Surjective?</div>
                  <div className="text-sm font-semibold mt-1">{analysis.isSurjective ? 'Yes (Im = G′)' : 'No'}</div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    Kernel <MathFormula latex={`\\ker(\\varphi) \\trianglelefteq ${sourceGroup.latexName}`} />{' '}
                    ({analysis.kernelNormal ? 'Normality Verified' : 'Check'})
                  </div>
                  <MathFormula latex={`\\ker(\\varphi) = ${analysis.kernelLatex}`} />
                </div>

                <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                    Image <MathFormula latex={`\\mathrm{Im}(\\varphi) \\le ${targetGroup.latexName}`} />
                  </div>
                  <MathFormula latex={`\\mathrm{Im}(\\varphi) = ${analysis.imageLatex}`} />
                </div>
              </div>
            </div>

            {/* Commutative Triangle Diagram */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Commutative Diagram
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Canonical factorization <MathFormula latex="\varphi = \bar{\varphi} \circ \pi" />
              </p>
              <svg viewBox="0 0 280 210" className="w-full max-w-[280px] mx-auto block">
                <defs>
                  <marker id="fit-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" />
                  </marker>
                </defs>

                {/* G (top left) -> Im(phi) (top right) */}
                <line x1="78" y1="42" x2="194" y2="42" stroke="#2563EB" strokeWidth="1.75" markerEnd="url(#fit-arrow)" className="text-blue-600" />
                <text x="136" y="33" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2563EB">
                  φ (hom.)
                </text>

                {/* G (top left) ->> G/ker(phi) (bottom left) */}
                <line x1="50" y1="62" x2="50" y2="150" stroke="#64748B" strokeWidth="1.75" markerEnd="url(#fit-arrow)" className="text-slate-500" />
                <text x="88" y="112" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#64748B">
                  π (surj.)
                </text>

                {/* G/ker(phi) (bottom left) -> Im(phi) (top right) */}
                <line x1="92" y1="158" x2="205" y2="60" stroke="#059669" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#fit-arrow)" className="text-emerald-600" />
                <text x="168" y="128" textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">
                  φ̄ : ≅
                </text>

                {/* Nodes */}
                <rect x="16" y="24" width="60" height="34" rx="8" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
                <text x="46" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1E3A8A">
                  {sourceGroup.name}
                </text>

                <rect x="198" y="24" width="70" height="34" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
                <text x="233" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#065F46">
                  Im(φ)
                </text>

                <rect x="12" y="156" width="84" height="36" rx="8" fill="#F8FAFC" stroke="#475569" strokeWidth="1.5" />
                <text x="54" y="178" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1E293B">
                  G / ker(φ)
                </text>
              </svg>
            </div>
          </div>

          {/* Explicit Coset-to-Image Correspondence Table */}
          {analysis.firstIsoCosets.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Induced Bijection <MathFormula latex="\bar{\varphi}: G / \ker(\varphi) \xrightarrow{\;\sim\;} \mathrm{Im}(\varphi)" /> (<MathText text="g·ker(φ) ↦ φ(g)" />)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2 px-2 text-left">Quotient Coset <MathText text="g·ker(φ)" /></th>
                      <th className="py-2 px-2 text-left">Coset Fiber Elements in <MathText text="G" /></th>
                      <th className="py-2 px-2 text-left">Mapped Image <MathText text="φ(g) ∈ Im(φ)" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.firstIsoCosets.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2 px-2 font-semibold text-blue-700 dark:text-blue-400">
                          <MathFormula latex={row.cosetLatex} />
                        </td>
                        <td className="py-2 px-2 text-slate-700 dark:text-slate-300">
                          <MathText text={`{${row.memberLabels.join(', ')}}`} />
                        </td>
                        <td className="py-2 px-2 font-semibold text-emerald-700 dark:text-emerald-400">
                          <MathFormula latex={row.imageLatex} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <IsomorphismWitnessPanel proof={analysis.firstIsoProof} />
        </div>
      )}
    </div>
  );
}
