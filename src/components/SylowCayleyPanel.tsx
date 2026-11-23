import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FiniteGroup } from '../core/groupTypes.ts';
import { analyzeCayleyTheorem, analyzeSylowTheorems } from '../core/sylowAndCayleyEngine.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

export function SylowCayleyPanel({
  group,
  onSelectSubgroup,
}: {
  group: FiniteGroup;
  onSelectSubgroup: (indices: number[]) => void;
}) {
  const [tab, setTab] = useState<'sylow' | 'cayley'>('sylow');
  const [selectedG, setSelectedG] = useState<number>(group.order > 1 ? 1 : 0);

  const sylow = useMemo(() => analyzeSylowTheorems(group), [group]);
  const cayley = useMemo(() => analyzeCayleyTheorem(group), [group]);

  const safeG = selectedG < group.order ? selectedG : 0;
  const activeEmb = cayley.embeddings[safeG];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Structural Decomposition & Permutation Embedding
            </p>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Sylow Theorems & Cayley&apos;s Theorem for <MathFormula latex={group.latexName} />
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Factorize <MathFormula latex={`|${group.latexName}| = ${group.order} = ${sylow.factorizationLatex}`} />, verify all Sylow <MathText text="p" />-subgroups, or inspect the explicit regular embedding <MathFormula latex={`${group.latexName} \\hookrightarrow S_{${group.order}}`} />.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setTab('sylow')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                tab === 'sylow'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sylow <MathText text="p" />-Subgroups
            </button>
            <button
              type="button"
              onClick={() => setTab('cayley')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                tab === 'cayley'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cayley&apos;s Theorem (<MathFormula latex={`\\hookrightarrow S_{${group.order}}`} />)
            </button>
          </div>
        </div>
      </div>

      {tab === 'sylow' ? (
        <div className="space-y-5">
          {!sylow.exhaustive && (
            <div className="flex items-start gap-2 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <MathText text={`|${group.name}| = ${group.order} > 24: subgroup enumeration uses bounded closure search; Sylow counts may reflect partial subgroup discovery for large groups.`} />
              </span>
            </div>
          )}

          {sylow.reports.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-400">
              Trivial group of order 1 has no prime divisors.
            </div>
          ) : (
            sylow.reports.map((rep) => (
              <div
                key={rep.prime}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Prime <MathFormula latex={`p = ${rep.prime}`} /> · Sylow <MathText text={`${rep.prime}-Subgroups`} /> (Order <MathFormula latex={`${rep.prime}^{${rep.power}} = ${rep.sylowOrder}`} />)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Writing <MathFormula latex={`|G| = ${rep.sylowOrder} \\cdot ${rep.cofactorM}`} /> · Candidate <MathFormula latex={`n_${rep.prime} \\mid ${rep.cofactorM}`} /> with <MathFormula latex={`n_${rep.prime} \\equiv 1 \\pmod{${rep.prime}}`} />: <span className="font-mono">{`{${rep.validNpCandidates.join(', ')}}`}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums">
                      <MathFormula latex={`n_{${rep.prime}} = ${rep.npCount}`} />
                    </span>
                    <span
                      className={`px-3 py-1.5 rounded-lg border inline-flex items-center gap-1 ${
                        rep.isUniqueNormal
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {rep.isUniqueNormal ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unique <MathText text="⇒" /> Normal (<MathFormula latex={`P \\trianglelefteq G`} />)</span>
                        </>
                      ) : (
                        <span>Not Unique (<MathFormula latex={`n_${rep.prime} > 1 \\Rightarrow P \\not\\trianglelefteq G`} />)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Sylow Theorem Checkpoints */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <MathFormula latex={`n_${rep.prime} \\equiv 1 \\pmod{${rep.prime}}`} />:{' '}
                    <span className={rep.congruenceModPOk ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {rep.congruenceModPOk ? `Verified (${rep.npCount} mod ${rep.prime} = 1)` : 'Check'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <MathFormula latex={`n_${rep.prime} \\mid ${rep.cofactorM}`} />:{' '}
                    <span className={rep.dividesCofactorOk ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {rep.dividesCofactorOk ? `Verified (${rep.npCount} ∣ ${rep.cofactorM})` : 'Check'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    Sylow II (All Conjugate):{' '}
                    <span className={rep.allConjugateVerified ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {rep.allConjugateVerified ? 'Single G-Orbit Verified' : 'Partial'}
                    </span>
                  </div>
                </div>

                {/* List of Sylow p-Subgroups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rep.subgroups.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          <MathFormula latex={`P_{${sIdx + 1}} = ${sub.latexSet}`} />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sIdx === 0 ? (
                            <span>Reference Sylow {rep.prime}-subgroup · {sub.isNormal ? 'Normal' : 'Non-normal'}</span>
                          ) : sub.conjugateWitnessLatex ? (
                            <span>
                              Conjugate of <MathFormula latex="P_1" /> via <MathFormula latex={`g = ${sub.conjugateWitnessLatex}`} /> (<MathFormula latex="gP_1g^{-1} = P_i" />)
                            </span>
                          ) : (
                            <span>Sylow {rep.prime}-subgroup</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectSubgroup(sub.indices)}
                        className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
                      >
                        Set as Active <MathText text="H" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Left-Regular Permutation Representation <MathFormula latex={`\\lambda: ${group.latexName} \\hookrightarrow S_{${group.order}}`} />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every group element <MathText text="g" /> acts on <MathText text="G" /> by left multiplication <MathFormula latex="\lambda_g(x) = g \star x" /> (literally row <MathText text="g" /> of the Cayley table).
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Injective Homomorphism ({cayley.verifiedHomomorphismPairs}/{cayley.totalPairs} pairs)
              </span>
            </div>
          </div>

          {/* Element Picker */}
          <div className="flex flex-wrap gap-1.5">
            {cayley.embeddings.slice(0, 24).map((emb) => {
              const active = emb.gIndex === safeG;
              return (
                <button
                  key={emb.gIndex}
                  type="button"
                  onClick={() => setSelectedG(emb.gIndex)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                    active
                      ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  <MathFormula latex={emb.gLatex} />
                </button>
              );
            })}
          </div>

          {activeEmb && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm space-y-1">
                <div className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Disjoint Cycle Decomposition in <MathFormula latex={`S_{${group.order}}`} /> (Order {activeEmb.order})
                </div>
                <MathFormula latex={`\\lambda_{${activeEmb.gLatex}} = ${activeEmb.cycleLatex}`} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2 px-2 text-left">Input <MathText text="x ∈ G" /></th>
                      <th className="py-2 px-2 text-left">Left Translation Formula</th>
                      <th className="py-2 px-2 text-left">Permuted Image <MathFormula latex={`\\lambda_{${activeEmb.gLatex}}(x)`} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEmb.leftMap.slice(0, 24).map((imgIdx, xIdx) => (
                      <tr key={xIdx} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-1.5 px-2 font-medium"><MathFormula latex={group.latexElements[xIdx]} /></td>
                        <td className="py-1.5 px-2 text-slate-600 dark:text-slate-400">
                          <MathFormula latex={`${activeEmb.gLatex} \\star ${group.latexElements[xIdx]}`} />
                        </td>
                        <td className="py-1.5 px-2 font-semibold text-blue-700 dark:text-blue-400">
                          <MathFormula latex={group.latexElements[imgIdx]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
