import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Cpu,
  FlaskConical,
  Globe,
  Layers,
  Lightbulb,
  Radio,
  RotateCw,
  Server,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MathFormula, MathText } from '../components/MathFormula.tsx';
import { FiniteGroup } from '../core/groupTypes.ts';
import {
  REAL_WORLD_SCENARIOS,
  RealWorldScenarioId,
  simulateErrorCorrectingCode,
  simulateMolecularSymmetry,
  simulateNetworkQuotient,
  simulateQuantumCommutation,
  simulateShiftScheduling,
  simulateSignalSynchronization,
} from '../core/realWorldEngine.ts';

interface RealWorldPageProps {
  initialScenarioId?: RealWorldScenarioId;
  onLoadIntoLab: (group: FiniteGroup, subset: number[], targetPage: string) => void;
}

const TEAM_COLORS = [
  { fill: '#2563eb', text: '#ffffff', border: 'border-blue-600', dot: 'bg-blue-600' },
  { fill: '#059669', text: '#ffffff', border: 'border-emerald-600', dot: 'bg-emerald-600' },
  { fill: '#d97706', text: '#ffffff', border: 'border-amber-600', dot: 'bg-amber-600' },
  { fill: '#7c3aed', text: '#ffffff', border: 'border-violet-600', dot: 'bg-violet-600' },
  { fill: '#dc2626', text: '#ffffff', border: 'border-red-600', dot: 'bg-red-600' },
  { fill: '#0891b2', text: '#ffffff', border: 'border-cyan-600', dot: 'bg-cyan-600' },
  { fill: '#be185d', text: '#ffffff', border: 'border-pink-600', dot: 'bg-pink-600' },
  { fill: '#4f46e5', text: '#ffffff', border: 'border-indigo-600', dot: 'bg-indigo-600' },
];

export function RealWorldPage({ initialScenarioId, onLoadIntoLab }: RealWorldPageProps) {
  const [activeId, setActiveId] = useState<RealWorldScenarioId>(
    initialScenarioId ?? 'error-correcting-codes'
  );

  useEffect(() => {
    if (initialScenarioId) {
      setActiveId(initialScenarioId);
    }
  }, [initialScenarioId]);

  // 1. Error-correcting code variables
  const [messageBit, setMessageBit] = useState<0 | 1>(1);
  const [flippedBit, setFlippedBit] = useState<0 | 1 | 2 | 3>(2);

  // 2. Molecular symmetry variables
  const [polygonSides, setPolygonSides] = useState<number>(4);
  const [axisMode, setAxisMode] = useState<'reflection-s' | 'rotation-r2' | 'full-rotations'>('reflection-s');

  // 3. Modular shift scheduling variables
  const [cycleHours, setCycleHours] = useState<number>(12);
  const [stepSize, setStepSize] = useState<number>(4);

  // 4. Quantum / robot commutation variables
  const [commSystem, setCommSystem] = useState<'D_4' | 'S_3' | 'Q_8'>('D_4');
  const [commElement, setCommElement] = useState<string>('r');

  // 5. Network quotient routing variables
  const [netTopology, setNetTopology] = useState<'S4-switch' | 'D4-ring' | 'S3-mesh' | 'A4-cluster'>('S4-switch');
  const [netCluster, setNetCluster] = useState<string>('V4');

  // 6. Signal / FTFGAG variables
  const [periodA, setPeriodA] = useState<number>(2);
  const [periodB, setPeriodB] = useState<number>(6);

  const errorSim = useMemo(
    () => simulateErrorCorrectingCode(messageBit, flippedBit),
    [messageBit, flippedBit]
  );
  const molSim = useMemo(
    () => simulateMolecularSymmetry(polygonSides, axisMode),
    [polygonSides, axisMode]
  );
  const shiftSim = useMemo(
    () => simulateShiftScheduling(cycleHours, stepSize),
    [cycleHours, stepSize]
  );
  const commSim = useMemo(
    () => simulateQuantumCommutation(commSystem, commElement),
    [commSystem, commElement]
  );
  const netSim = useMemo(
    () => simulateNetworkQuotient(netTopology, netCluster),
    [netTopology, netCluster]
  );
  const sigSim = useMemo(
    () => simulateSignalSynchronization(periodA, periodB),
    [periodA, periodB]
  );

  const activeMeta = REAL_WORLD_SCENARIOS.find((s) => s.id === activeId)!;

  const handleOpenInLab = () => {
    switch (activeId) {
      case 'error-correcting-codes':
        onLoadIntoLab(errorSim.group, errorSim.codebookIndices, 'cosets');
        break;
      case 'molecular-crystallography':
        onLoadIntoLab(molSim.group, molSim.subgroupIndices, 'normalizer');
        break;
      case 'shift-scheduling':
        onLoadIntoLab(shiftSim.group, shiftSim.subgroupIndices, 'lagrange');
        break;
      case 'quantum-commutation':
        onLoadIntoLab(commSim.group, commSim.targetIndices, 'centralizer');
        break;
      case 'network-quotient':
        onLoadIntoLab(netSim.group, netSim.subgroupIndices, 'quotient');
        break;
      case 'signal-ftfgag':
        onLoadIntoLab(sigSim.group, [sigSim.group.identityIndex], 'classification');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-400">
              <Globe className="w-4 h-4 shrink-0" />
              <span>Real-World Applications · Interactive Variable Simulators</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              How Finite Group Theory Powers Engineering & Science
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Select a domain below and change the live variables to observe how cosets, Lagrange’s theorem, normalizers, centralizers, and quotient groups behave in real-world systems.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenInLab}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors self-start lg:self-center"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Open Current Model in Lab
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Clean 6-Domain Selector Strip (No Nested Cards-in-Cards) */}
      <section aria-label="Real-world domain selector" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REAL_WORLD_SCENARIOS.map((sc, idx) => {
          const active = sc.id === activeId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setActiveId(sc.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/35'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-blue-700 dark:text-blue-400 truncate">
                  0{idx + 1}. <MathText text={sc.algebraTopic} />
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {sc.title}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {sc.domain}
              </div>
            </button>
          );
        })}
      </section>

      {/* Active Scenario Interactive Stage */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1 max-w-3xl">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {activeMeta.domain} · <MathText text={activeMeta.algebraTopic} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {activeMeta.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <MathText text={activeMeta.summary} />
            </p>
          </div>
        </div>

        {/* 1. ERROR-CORRECTING CODES */}
        {activeId === 'error-correcting-codes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Deck */}
            <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Radio className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                Live Channel Variables
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  1. Transmitted Message Bit (<MathText text="m \in \mathbb{Z}_2" />)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([0, 1] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setMessageBit(b)}
                      className={`h-10 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                        messageBit === b
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      Bit {b} → {b === 0 ? '(0,0,0)' : '(1,1,1)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  2. Cosmic-Ray Bit Flip Error Vector (<MathText text="e \in \mathbb{Z}_2^3" />)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { idx: 0 as const, label: 'No Noise (0,0,0)' },
                    { idx: 1 as const, label: 'Flip Bit 1 (1,0,0)' },
                    { idx: 2 as const, label: 'Flip Bit 2 (0,1,0)' },
                    { idx: 3 as const, label: 'Flip Bit 3 (0,0,1)' },
                  ].map((opt) => (
                    <button
                      key={opt.idx}
                      type="button"
                      onClick={() => setFlippedBit(opt.idx)}
                      className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-mono transition-colors ${
                        flippedBit === opt.idx
                          ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable Mapping */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Algebra-to-Reality Mapping
                </div>
                <dl className="space-y-1.5 text-xs">
                  {activeMeta.algebraMapping.map((m) => (
                    <div key={m.mathSymbol} className="flex items-baseline justify-between gap-3">
                      <dt className="text-blue-700 dark:text-blue-400 shrink-0">
                        <MathFormula latex={m.mathSymbol} />
                      </dt>
                      <dd className="text-slate-600 dark:text-slate-400 text-right">
                        <MathText text={m.realWorldMeaning} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Visual Simulation Stage */}
            <div className="lg:col-span-7 space-y-5">
              {/* Interactive Bit-Transmission Signal Pipeline */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Live Telemetry Transmission & Coset Recovery Pipeline
                  </span>
                  <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                    {errorSim.singleBitCorrected ? '100% Bit Recovered' : 'Decoding'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500">1. Sent Codeword</div>
                    <div className="mt-1 text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {errorSim.transmittedLabel}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800">
                    <div className="text-[11px] text-slate-500">2. Channel + Noise</div>
                    <div className="mt-1 text-sm font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {errorSim.receivedLabel}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800">
                    <div className="text-[11px] text-slate-500">3. Coset Leader</div>
                    <div className="mt-1 text-sm font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                      {errorSim.cosetLeaderLabel}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800">
                    <div className="text-[11px] text-slate-500">4. Recovered</div>
                    <div className="mt-1 text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {errorSim.recoveredLabel}
                    </div>
                  </div>
                </div>

                {/* Live Equation Trace */}
                <div className="text-xs text-slate-700 dark:text-slate-300 pt-1 flex flex-wrap items-center gap-2">
                  <span>Recovery step:</span>
                  <MathFormula
                    latex={`r - e = ${errorSim.receivedLabel} - ${errorSim.cosetLeaderLabel} = ${errorSim.recoveredLabel} \\in C`}
                  />
                  <span className="text-slate-400">·</span>
                  <span>
                    Syndrome <MathFormula latex={`(s_1, s_2) = (${errorSim.syndrome[0]}, ${errorSim.syndrome[1]})`} />
                  </span>
                </div>
              </div>

              {/* Complete 4-Coset Syndrome Lookup Table */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Complete Coset Syndrome Table (<MathFormula latex="[\mathbb{Z}_2^3 : C] = 4" /> disjoint cosets)
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <th className="py-2 px-3 font-semibold">Syndrome</th>
                        <th className="py-2 px-3 font-semibold">Coset Leader</th>
                        <th className="py-2 px-3 font-semibold">Coset <MathFormula latex="r + C" /></th>
                        <th className="py-2 px-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {errorSim.allCosets.map((row) => (
                        <tr
                          key={row.leader}
                          className={
                            row.isMatched
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold text-slate-900 dark:text-slate-100'
                              : 'text-slate-600 dark:text-slate-400'
                          }
                        >
                          <td className="py-2 px-3 font-mono tabular-nums">
                            ({row.syndrome[0]}, {row.syndrome[1]})
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums">{row.leader}</td>
                          <td className="py-2 px-3 font-mono tabular-nums">{`{${row.members.join(', ')}}`}</td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {row.isMatched ? (
                              <span className="text-blue-700 dark:text-blue-400">Active Coset</span>
                            ) : (
                              <span className="text-slate-400">Standby</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MOLECULAR SYMMETRY & CRYSTALLOGRAPHY */}
        {activeId === 'molecular-crystallography' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Deck */}
            <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <RotateCw className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                Crystal & Molecule Parameters
              </div>

              {/* Quick Chemistry Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { n: 3, label: 'Trigonal BF₃ (D₃)' },
                  { n: 4, label: 'Square XeF₄ (D₄)' },
                  { n: 6, label: 'Benzene C₆H₆ (D₆)' },
                ].map((preset) => (
                  <button
                    key={preset.n}
                    type="button"
                    onClick={() => setPolygonSides(preset.n)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      polygonSides === preset.n
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <label htmlFor="mol-sides">Polygon Vertices / Molecular Fold (<MathFormula latex="n" />)</label>
                  <span className="font-mono tabular-nums font-bold">
                    <MathFormula latex={`n = ${polygonSides},\\; |D_{${polygonSides}}| = ${polygonSides * 2}`} />
                  </span>
                </div>
                <input
                  id="mol-sides"
                  type="range"
                  min={3}
                  max={8}
                  value={polygonSides}
                  onChange={(e) => setPolygonSides(Number(e.target.value))}
                  className="w-full accent-blue-700"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Local Bond / Symmetry Subgroup <MathFormula latex="H \le D_n" />
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'reflection-s' as const, label: 'Single Mirror Axis $\\langle s \\rangle$ (Order 2)' },
                    { id: 'rotation-r2' as const, label: 'Double-Step Rotation $\\langle r^2 \\rangle$' },
                    { id: 'full-rotations' as const, label: 'All Planar Rotations $\\langle r \\rangle$ (Index 2)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAxisMode(opt.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                        axisMode === opt.id
                          ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <MathText text={opt.label} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Algebra-to-Reality Mapping
                </div>
                <dl className="space-y-1.5 text-xs">
                  {activeMeta.algebraMapping.map((m) => (
                    <div key={m.mathSymbol} className="flex items-baseline justify-between gap-3">
                      <dt className="text-blue-700 dark:text-blue-400 shrink-0">
                        <MathFormula latex={m.mathSymbol} />
                      </dt>
                      <dd className="text-slate-600 dark:text-slate-400 text-right">
                        <MathText text={m.realWorldMeaning} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Interactive Polygon Symmetry Visualizer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                {/* Dynamic SVG Regular n-gon Molecule */}
                <svg
                  viewBox="0 0 220 220"
                  className="w-48 h-48 mx-auto shrink-0"
                  role="img"
                  aria-label={`${polygonSides}-gon molecular symmetry diagram`}
                >
                  {/* Outer symmetry ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r="82"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-300 dark:text-slate-700"
                    strokeDasharray="4 4"
                    strokeWidth="1.25"
                  />

                  {/* Highlighted mirror axis if reflection mode */}
                  {axisMode === 'reflection-s' && (
                    <>
                      <line
                        x1="110"
                        y1="14"
                        x2="110"
                        y2="206"
                        stroke="#2563eb"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />
                      {polygonSides % 2 === 0 && (
                        <line
                          x1="14"
                          y1="110"
                          x2="206"
                          y2="110"
                          stroke="#d97706"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.7"
                        />
                      )}
                    </>
                  )}

                  {/* Rotation direction arrow if rotation mode */}
                  {axisMode !== 'reflection-s' && (
                    <path
                      d="M 110 42 A 68 68 0 0 1 174 88"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Polygon edges */}
                  <polygon
                    points={Array.from({ length: polygonSides }, (_, i) => {
                      const angle = -Math.PI / 2 + (2 * Math.PI * i) / polygonSides;
                      const x = 110 + 76 * Math.cos(angle);
                      const y = 110 + 76 * Math.sin(angle);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(' ')}
                    fill="rgba(37, 99, 235, 0.08)"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />

                  {/* Bonded Atoms / Vertices */}
                  {Array.from({ length: polygonSides }, (_, i) => {
                    const angle = -Math.PI / 2 + (2 * Math.PI * i) / polygonSides;
                    const x = 110 + 76 * Math.cos(angle);
                    const y = 110 + 76 * Math.sin(angle);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="11" fill="#1d4ed8" />
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="#ffffff"
                        >
                          {i + 1}
                        </text>
                      </g>
                    );
                  })}
                  <text
                    x="110"
                    y="114"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="currentColor"
                    className="text-slate-700 dark:text-slate-200"
                  >
                    {molSim.rotationAngleDeg}° step
                  </text>
                </svg>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Chemical / Physical Model</div>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {molSim.moleculeName}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500">
                        Normalizer <MathFormula latex="|N_G(H)|" />
                      </div>
                      <div className="mt-0.5 text-base font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                        {molSim.normalizerOrder} / {molSim.group.order}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500">
                        Conjugate Axes <MathFormula latex="[G : N_G(H)]" />
                      </div>
                      <div className="mt-0.5 text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {molSim.distinctConjugateCount}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {molSim.isNormal
                      ? 'Global invariant (Normal subgroup): this symmetry axis stays fixed under every rotation and flip of the molecule.'
                      : `Directional axis (Non-normal): rotating the crystal produces ${molSim.distinctConjugateCount} distinct equivalent bond orientations.`}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Subgroup:</span>
                  <span className="font-mono">{`H = {${molSim.subgroupLabels.join(', ')}}`}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-semibold">Normalizer:</span>
                  <span className="font-mono">{`N_G(H) = {${molSim.normalizerLabels.join(', ')}}`}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {molSim.conjugateAxesLabels.map((conj, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200"
                    >
                      Orbit {idx + 1}: {`{${conj.join(', ')}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MODULAR SHIFT & KEY-CYCLE SCHEDULING */}
        {activeId === 'shift-scheduling' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Deck */}
            <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Layers className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                Cycle & Shift Variables
              </div>

              {/* Quick Classroom Experiments */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { n: 12, k: 5, label: 'n=12, k=5 (Full)' },
                  { n: 12, k: 4, label: 'n=12, k=4 (4 Teams)' },
                  { n: 12, k: 6, label: 'n=12, k=6 (6 Teams)' },
                  { n: 8, k: 3, label: 'n=8, k=3 (Full)' },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setCycleHours(ex.n);
                      setStepSize(ex.k);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      cycleHours === ex.n && stepSize === ex.k
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <label htmlFor="shift-hours">Total Cycle Length (<MathFormula latex="n" /> slots)</label>
                  <span className="font-mono tabular-nums font-bold">n = {cycleHours}</span>
                </div>
                <input
                  id="shift-hours"
                  type="range"
                  min={4}
                  max={24}
                  value={cycleHours}
                  onChange={(e) => {
                    const nextN = Number(e.target.value);
                    setCycleHours(nextN);
                    if (stepSize >= nextN) setStepSize(Math.max(1, nextN - 1));
                  }}
                  className="w-full accent-blue-700"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <label htmlFor="shift-step">Rotation / Key Step Size (<MathFormula latex="k" />)</label>
                  <span className="font-mono tabular-nums font-bold">k = {stepSize}</span>
                </div>
                <input
                  id="shift-step"
                  type="range"
                  min={0}
                  max={Math.max(1, cycleHours - 1)}
                  value={Math.min(stepSize, cycleHours - 1)}
                  onChange={(e) => setStepSize(Number(e.target.value))}
                  className="w-full accent-blue-700"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Algebra-to-Reality Mapping
                </div>
                <dl className="space-y-1.5 text-xs">
                  {activeMeta.algebraMapping.map((m) => (
                    <div key={m.mathSymbol} className="flex items-baseline justify-between gap-3">
                      <dt className="text-blue-700 dark:text-blue-400 shrink-0">
                        <MathFormula latex={m.mathSymbol} />
                      </dt>
                      <dd className="text-slate-600 dark:text-slate-400 text-right">
                        <MathText text={m.realWorldMeaning} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Interactive Clock Wheel & Coset Partition */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-4 items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                {/* Modular Clock SVG */}
                <svg
                  viewBox="0 0 240 240"
                  className="w-52 h-52 mx-auto shrink-0"
                  role="img"
                  aria-label={`Modular clock wheel for Z_${cycleHours} stepping by ${shiftSim.stepSize}`}
                >
                  <circle
                    cx="120"
                    cy="120"
                    r="86"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="1.5"
                  />
                  {/* Step chords for Team 1 (<k>) */}
                  {shiftSim.stepSize > 0 &&
                    Array.from({ length: shiftSim.cycleLength }, (_, i) => {
                      const fromSlot = (i * shiftSim.stepSize) % cycleHours;
                      const toSlot = ((i + 1) * shiftSim.stepSize) % cycleHours;
                      const a1 = -Math.PI / 2 + (2 * Math.PI * fromSlot) / cycleHours;
                      const a2 = -Math.PI / 2 + (2 * Math.PI * toSlot) / cycleHours;
                      const x1 = 120 + 86 * Math.cos(a1);
                      const y1 = 120 + 86 * Math.sin(a1);
                      const x2 = 120 + 86 * Math.cos(a2);
                      const y2 = 120 + 86 * Math.sin(a2);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeOpacity="0.6"
                        />
                      );
                    })}

                  {/* Clock Nodes colored by Team Coset */}
                  {Array.from({ length: cycleHours }, (_, slot) => {
                    const angle = -Math.PI / 2 + (2 * Math.PI * slot) / cycleHours;
                    const x = 120 + 86 * Math.cos(angle);
                    const y = 120 + 86 * Math.sin(angle);
                    const teamIdx = shiftSim.slotTeamMap[slot] ?? 0;
                    const color = TEAM_COLORS[teamIdx % TEAM_COLORS.length];
                    return (
                      <g key={slot}>
                        <circle cx={x} cy={y} r={cycleHours > 16 ? 9 : 11} fill={color.fill} />
                        <text
                          x={x}
                          y={y + 3.5}
                          textAnchor="middle"
                          fontSize={cycleHours > 16 ? '8' : '9.5'}
                          fontWeight="700"
                          fill={color.text}
                        >
                          {slot}
                        </text>
                      </g>
                    );
                  })}

                  <text
                    x="120"
                    y="116"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="currentColor"
                    className="text-slate-700 dark:text-slate-200"
                  >
                    Step +{shiftSim.stepSize}
                  </text>
                  <text
                    x="120"
                    y="131"
                    textAnchor="middle"
                    fontSize="10"
                    fill="currentColor"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    mod {cycleHours}
                  </text>
                </svg>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">
                        Orbit <MathFormula latex="|\langle k \rangle|" />
                      </div>
                      <div className="mt-0.5 text-sm font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                        {shiftSim.cycleLength} slots
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">
                        Teams <MathFormula latex="[\mathbb{Z}_n : H]" />
                      </div>
                      <div className="mt-0.5 text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {shiftSim.teamCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500">Lagrange</div>
                      <div className="mt-0.5 text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {shiftSim.cycleLength}×{shiftSim.teamCount}={shiftSim.group.order}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {shiftSim.coversAllSlots ? (
                      <MathText
                        text={`Full coverage: since $\\gcd(${cycleHours}, ${shiftSim.stepSize}) = 1$, Team 1 alone visits all ${cycleHours} slots along the blue cycle.`}
                      />
                    ) : (
                      <MathText
                        text={`Partitioned schedule: $\\gcd(${cycleHours}, ${shiftSim.stepSize}) = ${shiftSim.teamCount}$ separate color-coded coset teams are needed to cover every slot.`}
                      />
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shiftSim.distinctCosets.slice(0, 8).map((coset, idx) => {
                  const color = TEAM_COLORS[idx % TEAM_COLORS.length];
                  return (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2"
                    >
                      <span className={`w-2.5 h-2.5 rounded-xs shrink-0 ${color.dot}`} />
                      <span className="truncate">
                        Team {idx + 1} ({idx} + ⟨{shiftSim.stepSize}⟩): {`{${coset.join(', ')}}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. QUANTUM GATE & ROBOT MOVE COMMUTATION */}
        {activeId === 'quantum-commutation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Deck */}
            <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Cpu className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                System & Target Operation
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Physical Control Group <MathFormula latex="G" />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['D_4', 'D₄ Gripper'],
                      ['S_3', 'S₃ Switch'],
                      ['Q_8', 'Q₈ Spin Gates'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setCommSystem(key);
                        setCommElement(key === 'S_3' ? '(1 2)' : key === 'Q_8' ? 'i' : 'r');
                      }}
                      className={`min-h-[40px] px-2 rounded-lg border text-xs font-medium transition-colors ${
                        commSystem === key
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <MathText text={label} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Operation <MathFormula latex={`x \\in ${commSim.group.latexName}`} />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {commSim.group.elements.map((el) => (
                    <button
                      key={el}
                      type="button"
                      onClick={() => setCommElement(el)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                        commSim.targetLabels[0] === el
                          ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {el}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Algebra-to-Reality Mapping
                </div>
                <dl className="space-y-1.5 text-xs">
                  {activeMeta.algebraMapping.map((m) => (
                    <div key={m.mathSymbol} className="flex items-baseline justify-between gap-3">
                      <dt className="text-blue-700 dark:text-blue-400 shrink-0">
                        <MathFormula latex={m.mathSymbol} />
                      </dt>
                      <dd className="text-slate-600 dark:text-slate-400 text-right">
                        <MathText text={m.realWorldMeaning} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Live Order-Sensitivity Comparator */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">
                    Safe Centralizer <MathFormula latex={`|C_G(${commSim.targetLabels[0]})|`} />
                  </div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {commSim.centralizerOrder} / {commSim.group.order} operations
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">
                    Global Safe Centre <MathFormula latex="Z(G)" />
                  </div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                    {commSim.centreOrder} ({`{${commSim.centreLabels.join(', ')}}`})
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <th className="py-2 px-3 font-semibold">Move <MathFormula latex="g" /></th>
                      <th className="py-2 px-3 font-semibold"><MathFormula latex={`g \\cdot ${commSim.targetLabels[0]}`} /></th>
                      <th className="py-2 px-3 font-semibold"><MathFormula latex={`${commSim.targetLabels[0]} \\cdot g`} /></th>
                      <th className="py-2 px-3 font-semibold text-right">Concurrency Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {commSim.allOperations.map((row) => (
                      <tr
                        key={row.gLabel}
                        className={
                          row.commutes
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/15'
                            : 'bg-amber-50/40 dark:bg-amber-950/15'
                        }
                      >
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {row.gLabel}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{row.gxLabel}</td>
                        <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{row.xgLabel}</td>
                        <td className="py-2 px-3 text-right whitespace-nowrap font-medium">
                          {row.commutes ? (
                            <span className="text-emerald-700 dark:text-emerald-400">Safe (Commutes)</span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">Order Conflict</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SERVER CLUSTER QUOTIENT ROUTING */}
        {activeId === 'network-quotient' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Deck */}
            <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Server className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                Switch Topology & Collapsed Cluster
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  1. Network Switch Topology <MathFormula latex="G" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['S4-switch', '$S_4$ 4-Node Switch', 'V4'],
                      ['D4-ring', '$D_4$ 4-Node Ring', 'r²'],
                      ['A4-cluster', '$A_4$ Even Mesh', 'V4'],
                      ['S3-mesh', '$S_3$ 3-Node Mesh', 'rot'],
                    ] as const
                  ).map(([top, label, defCluster]) => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => {
                        setNetTopology(top);
                        setNetCluster(defCluster);
                      }}
                      className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-medium transition-colors ${
                        netTopology === top
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <MathText text={label} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  2. Subgroup Cluster <MathFormula latex="H" /> to Collapse
                </label>
                <div className="space-y-2">
                  {(netTopology === 'S4-switch'
                    ? [
                        { id: 'V4', label: 'Klein $V_4$ (Normal — Quotient $S_4/V_4 \\cong S_3$)' },
                        { id: 'swap', label: 'Single Swap $\\langle (1\\;2) \\rangle$ (Non-Normal)' },
                      ]
                    : netTopology === 'D4-ring'
                      ? [
                          { id: 'r²', label: 'Half-Turn $\\langle r^2 \\rangle$ (Normal — Order 4 Quotient)' },
                          { id: 'r', label: 'Ring Rotations $\\langle r \\rangle$ (Normal — Order 2 Quotient)' },
                          { id: 's', label: 'Single Reflection $\\langle s \\rangle$ (Non-Normal)' },
                        ]
                      : netTopology === 'A4-cluster'
                        ? [
                            { id: 'V4', label: 'Klein $V_4$ (Normal — Order 3 Quotient)' },
                            { id: '3cyc', label: '3-Cycle $\\langle (1\\;2\\;3) \\rangle$ (Non-Normal)' },
                          ]
                        : [
                            { id: 'rot', label: 'Cycle Subgroup $\\langle (1\\;2\\;3) \\rangle$ (Normal)' },
                            { id: 'swap', label: 'Single Swap $\\langle (1\\;2) \\rangle$ (Non-Normal)' },
                          ]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNetCluster(opt.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                        netCluster === opt.id
                          ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <MathText text={opt.label} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Algebra-to-Reality Mapping
                </div>
                <dl className="space-y-1.5 text-xs">
                  {activeMeta.algebraMapping.map((m) => (
                    <div key={m.mathSymbol} className="flex items-baseline justify-between gap-3">
                      <dt className="text-blue-700 dark:text-blue-400 shrink-0">
                        <MathFormula latex={m.mathSymbol} />
                      </dt>
                      <dd className="text-slate-600 dark:text-slate-400 text-right">
                        <MathText text={m.realWorldMeaning} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Quotient Collapse Visualizer */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className={`p-4 rounded-lg border space-y-2.5 text-xs sm:text-sm ${
                  netSim.canRouteDeterministic
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30'
                    : 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {netSim.canRouteDeterministic ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-emerald-900 dark:text-emerald-200">
                        Deterministic Super-Router Verified (<MathFormula latex={`|G/H| = ${netSim.quotientOrder}`} />)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span className="text-red-900 dark:text-red-200">
                        Routing Collision! Cluster <MathFormula latex="H" /> is Non-Normal in{' '}
                        <MathFormula latex={netSim.group.latexName} />
                      </span>
                    </>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  <MathText text={netSim.reason} />
                </p>
                {!netSim.canRouteDeterministic && netSim.conflictWitness && (
                  <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-red-200 dark:border-red-900 text-xs space-y-1 text-red-900 dark:text-red-200">
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      Explicit Packet Collision Witness:
                    </div>
                    <p className="font-mono leading-relaxed">
                      Representative pair ({netSim.conflictWitness.g1}, {netSim.conflictWitness.g2}) maps to{' '}
                      {`{${netSim.conflictWitness.directProductCoset.join(', ')}}`}, while shifted pair (
                      {netSim.conflictWitness.g1}·{netSim.conflictWitness.h1}, {netSim.conflictWitness.g2}·
                      {netSim.conflictWitness.h2}) maps to{' '}
                      {`{${netSim.conflictWitness.shiftedProductCoset.join(', ')}}`}!
                    </p>
                  </div>
                )}
              </div>

              {/* Meta-Node Coset Blocks */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Cluster Coset Partition ({netSim.cosetPartitions.length} coset blocks of size{' '}
                  {netSim.subgroupIndices.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {netSim.cosetPartitions.slice(0, 8).map((part) => (
                    <div
                      key={part.cosetLabel}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-mono"
                    >
                      <div className="font-semibold text-blue-700 dark:text-blue-400">{part.cosetLabel}</div>
                      <div className="text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {`{${part.members.join(', ')}}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. MULTI-CHANNEL CLOCK & MEMORY SYNCHRONIZATION (FTFGAG) */}
        {activeId === 'signal-ftfgag' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Deck */}
            <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Cpu className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                Hardware Clock Periods
              </div>

              {/* Quick Clock Experiments */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { a: 3, b: 4, label: 'ℤ₃ × ℤ₄ (Coprime)' },
                  { a: 2, b: 6, label: 'ℤ₂ × ℤ₆ (gcd=2)' },
                  { a: 4, b: 6, label: 'ℤ₄ × ℤ₆ (gcd=2)' },
                  { a: 3, b: 5, label: 'ℤ₃ × ℤ₅ (Coprime)' },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setPeriodA(ex.a);
                      setPeriodB(ex.b);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      periodA === ex.a && sigSim.periodB === ex.b
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <MathText text={ex.label} />
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <label htmlFor="sig-a">Channel A Period (<MathFormula latex="n_1" />)</label>
                  <span className="font-mono tabular-nums font-bold">
                    <MathFormula latex={`\\mathbb{Z}_{${periodA}}`} />
                  </span>
                </div>
                <input
                  id="sig-a"
                  type="range"
                  min={2}
                  max={6}
                  value={periodA}
                  onChange={(e) => setPeriodA(Number(e.target.value))}
                  className="w-full accent-blue-700"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <label htmlFor="sig-b">Channel B Period (<MathFormula latex="n_2" />)</label>
                  <span className="font-mono tabular-nums font-bold">
                    <MathFormula latex={`\\mathbb{Z}_{${sigSim.periodB}}`} />
                  </span>
                </div>
                <input
                  id="sig-b"
                  type="range"
                  min={2}
                  max={Math.min(8, Math.floor(32 / periodA))}
                  value={sigSim.periodB}
                  onChange={(e) => setPeriodB(Number(e.target.value))}
                  className="w-full accent-blue-700"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Algebra-to-Reality Mapping
                </div>
                <dl className="space-y-1.5 text-xs">
                  {activeMeta.algebraMapping.map((m) => (
                    <div key={m.mathSymbol} className="flex items-baseline justify-between gap-3">
                      <dt className="text-blue-700 dark:text-blue-400 shrink-0">
                        <MathFormula latex={m.mathSymbol} />
                      </dt>
                      <dd className="text-slate-600 dark:text-slate-400 text-right">
                        <MathText text={m.realWorldMeaning} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Phase-Space State Matrix Visualizer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Total State Space</div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {sigSim.totalStates} states
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Reachable Orbit</div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                    {sigSim.maxSimultaneousOrder} / {sigSim.totalStates}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500"><MathFormula latex="\gcd(n_1, n_2)" /></div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {sigSim.gcdValue}
                  </div>
                </div>
              </div>

              {/* Phase-Space Grid showing states visited by (1,1) */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    <MathFormula latex={`\\mathbb{Z}_{${sigSim.periodA}} \\times \\mathbb{Z}_{${sigSim.periodB}}`} />{' '}
                    Phase-Space Orbit of <MathFormula latex="(1, 1)" />
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Blue = reached at tick t · Blank = unreachable gap
                  </span>
                </div>

                <div
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${sigSim.periodB}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: sigSim.periodA }, (_, rowA) =>
                    Array.from({ length: sigSim.periodB }, (_, colB) => {
                      const hit = sigSim.orbitCells.find((c) => c.a === rowA && c.b === colB);
                      return (
                        <div
                          key={`${rowA}-${colB}`}
                          className={`h-11 rounded-md border flex flex-col items-center justify-center text-[11px] font-mono tabular-nums ${
                            hit
                              ? 'bg-blue-700 border-blue-700 text-white font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          <span>({rowA},{colB})</span>
                          <span className="text-[9px] opacity-85">
                            {hit ? `t=${hit.step}` : 'unreached'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                  <div className="font-semibold">
                    {sigSim.isSingleMasterClock ? (
                      <MathText
                        text={`Single Cyclic Master Clock! Since $\\gcd(${sigSim.periodA}, ${sigSim.periodB}) = 1$, $\\mathbb{Z}_{${sigSim.periodA}} \\times \\mathbb{Z}_{${sigSim.periodB}} \\cong \\mathbb{Z}_{${sigSim.totalStates}}$.`}
                      />
                    ) : (
                      <MathText
                        text={`Decomposed Multi-Clock Bus: $\\gcd(${sigSim.periodA}, ${sigSim.periodB}) = ${sigSim.gcdValue} > 1$, splitting the bus into ${sigSim.gcdValue} isolated tracks of length ${sigSim.maxSimultaneousOrder}.`}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-slate-500 mr-1.5">Invariant Factors:</span>
                      <MathFormula latex={sigSim.canonicalLatex} className="font-semibold text-slate-900 dark:text-slate-100" />
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1.5">Elementary Divisors:</span>
                      <MathFormula latex={sigSim.elementaryLatex} className="font-semibold text-blue-700 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Educational Context: Where Used + Key Takeaway */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            Where This Is Used in Industry & Science
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {activeMeta.whereUsed.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                <span>
                  <MathText text={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Key Algebraic Takeaway
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <MathText text={activeMeta.keyInsight} />
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Want to inspect the full Cayley table & subgroup proof?
            </span>
            <button
              type="button"
              onClick={handleOpenInLab}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Open in Lab
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
