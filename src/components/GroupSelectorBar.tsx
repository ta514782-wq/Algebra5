import { AlertTriangle, Check, Link2, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
  buildAlternatingGroup,
  buildCustomGroup,
  buildCyclicGroup,
  buildDihedralGroup,
  buildDirectProductCyclic,
  buildKleinFourGroup,
  buildQuaternionGroup,
  buildSymmetricGroup,
  generateSubgroupFromElements,
  getPresetSubgroups,
  PRESET_GROUPS,
} from '../core/groupEngine.ts';
import { parseSubsetExpression } from '../core/expressionParser.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import { validateSubgroup } from '../core/groupValidation.ts';
import { MathFormula, MathText } from './MathFormula.tsx';

interface GroupSelectorBarProps {
  group: FiniteGroup;
  selectedSubset: number[];
  onGroupChange: (g: FiniteGroup, initialSubset: number[]) => void;
  onSubsetChange: (indices: number[]) => void;
  subsetLabel?: string;
  showSubsetControls?: boolean;
  operatedElements?: { a?: number; b?: number; result?: number; phase?: 'operands' | 'result' } | null;
}

export function GroupSelectorBar({
  group,
  selectedSubset,
  onGroupChange,
  onSubsetChange,
  subsetLabel = 'Subgroup / Subset H',
  showSubsetControls = true,
  operatedElements,
}: GroupSelectorBarProps) {
  const [builderMode, setBuilderMode] = useState<'preset' | 'parametric' | 'custom'>('preset');
  const [familyType, setFamilyType] = useState<'cyclic' | 'dihedral' | 'symmetric' | 'alternating' | 'direct'>('dihedral');
  const [paramN, setParamN] = useState<number>(4);
  const [paramM, setParamM] = useState<number>(2);
  const [paramK, setParamK] = useState<number>(6);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Custom table inputs
  const [customName, setCustomName] = useState('C_3');
  const [customElemsText, setCustomElemsText] = useState('e, a, b');
  const [customTableText, setCustomTableText] = useState('e, a, b\na, b, e\nb, e, a');

  // Typed subgroup/generator expression
  const [exprInput, setExprInput] = useState('');
  const [exprError, setExprError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const presetSubgroups = getPresetSubgroups(group);
  const subValidation = validateSubgroup(group, selectedSubset);

  const selectPresetGroup = (key: string) => {
    setBuildError(null);
    const found = PRESET_GROUPS.find((p) => p.key === key);
    if (!found) return;
    const g = found.build();
    const presets = getPresetSubgroups(g);
    const defaultSub = presets[1]?.elements ?? [g.identityIndex];
    onGroupChange(g, defaultSub);
  };

  const buildParametricGroup = () => {
    setBuildError(null);
    try {
      let g: FiniteGroup;
      if (familyType === 'cyclic') g = buildCyclicGroup(paramN);
      else if (familyType === 'dihedral') g = buildDihedralGroup(paramN);
      else if (familyType === 'symmetric') g = buildSymmetricGroup(paramN);
      else if (familyType === 'alternating') g = buildAlternatingGroup(paramN);
      else g = buildDirectProductCyclic([paramM, paramK]);
      const presets = getPresetSubgroups(g);
      onGroupChange(g, presets[1]?.elements ?? [g.identityIndex]);
    } catch (err: unknown) {
      setBuildError(err instanceof Error ? err.message : 'Invalid group parameter.');
    }
  };

  const handleBuildCustom = () => {
    setBuildError(null);
    const elems = customElemsText.split(',').map((s) => s.trim()).filter(Boolean);
    const rows = customTableText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean));
    const res = buildCustomGroup(customName, elems, rows);
    if (res.error || !res.group) {
      setBuildError(res.error || 'Invalid custom multiplication table.');
      return;
    }
    onGroupChange(res.group, [res.group.identityIndex]);
  };

  const toggleElement = (idx: number) => {
    if (selectedSubset.includes(idx)) {
      onSubsetChange(selectedSubset.filter((i) => i !== idx));
    } else {
      onSubsetChange([...selectedSubset, idx].sort((a, b) => a - b));
    }
  };

  const closeUnderGroupOp = () => {
    const generated = generateSubgroupFromElements(group, selectedSubset);
    onSubsetChange(generated);
  };

  const handleApplyExpression = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSubsetExpression(group, exprInput);
    if (parsed.error) {
      setExprError(parsed.error);
      return;
    }
    setExprError(null);
    onSubsetChange(parsed.indices);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Active Algebraic Structure: <MathText text={group.name} />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <MathFormula latex={`|G| = ${group.order}`} /> · {group.isAbelian ? 'Abelian' : 'Non-abelian'} · Operation: {group.operationName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Copy shareable URL for current group and subgroup"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Link Copied' : 'Copy Lab Link'}
          </button>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['preset', 'parametric', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setBuilderMode(mode);
                  setBuildError(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  builderMode === mode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {mode === 'preset' ? 'Preset Groups' : mode === 'parametric' ? 'Construct Family' : 'Custom Table'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {builderMode === 'preset' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_GROUPS.map((pg) => {
            const active = group.id === pg.key;
            return (
              <button
                key={pg.key}
                type="button"
                onClick={() => selectPresetGroup(pg.key)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="truncate">
                  <MathText text={pg.label.split(' ')[0]} />
                </div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate">
                  <MathText text={pg.label.replace(/^[^\s]+\s*/, '')} />
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              const g = buildKleinFourGroup();
              onGroupChange(g, [0, 1]);
            }}
            className="hidden"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => {
              const g = buildQuaternionGroup();
              onGroupChange(g, [0, 1]);
            }}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      )}

      {builderMode === 'parametric' && (
        <div className="flex flex-wrap items-end gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Group Family
            </label>
            <select
              value={familyType}
              onChange={(e) => {
                const v = e.target.value as typeof familyType;
                setFamilyType(v);
                if (v === 'symmetric') setParamN(3);
                else if (v === 'alternating') setParamN(4);
                else if (v === 'dihedral') setParamN(4);
                else if (v === 'cyclic') setParamN(8);
              }}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="cyclic">Cyclic Group ℤₙ (1 ≤ n ≤ 36)</option>
              <option value="direct">Direct Product ℤₘ × ℤₖ (m·k ≤ 48)</option>
              <option value="dihedral">Dihedral Group Dₙ (2 ≤ n ≤ 16)</option>
              <option value="symmetric">Symmetric Group Sₙ (1 ≤ n ≤ 5)</option>
              <option value="alternating">Alternating Group Aₙ (3 ≤ n ≤ 5)</option>
            </select>
          </div>

          {familyType !== 'direct' ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Parameter n
              </label>
              <input
                type="number"
                min={familyType === 'alternating' ? 3 : familyType === 'dihedral' ? 2 : 1}
                max={familyType === 'symmetric' || familyType === 'alternating' ? 5 : familyType === 'dihedral' ? 16 : 36}
                value={paramN}
                onChange={(e) => setParamN(Number(e.target.value))}
                className="h-9 w-24 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Modulus m
                </label>
                <input
                  type="number"
                  min={2}
                  max={24}
                  value={paramM}
                  onChange={(e) => setParamM(Number(e.target.value))}
                  className="h-9 w-20 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Modulus k
                </label>
                <input
                  type="number"
                  min={2}
                  max={24}
                  value={paramK}
                  onChange={(e) => setParamK(Number(e.target.value))}
                  className="h-9 w-20 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={buildParametricGroup}
            className="h-9 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Construct Group
          </button>
        </div>
      )}

      {builderMode === 'custom' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Elements (comma-separated, max 16)
              </label>
              <input
                type="text"
                value={customElemsText}
                onChange={(e) => setCustomElemsText(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Cayley Multiplication Table (one row per line, comma or space separated)
            </label>
            <textarea
              rows={4}
              value={customTableText}
              onChange={(e) => setCustomTableText(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={handleBuildCustom}
            className="h-9 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            Validate Axioms & Load Table
          </button>
        </div>
      )}

      {buildError && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{buildError}</span>
        </div>
      )}

      {group.warning && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{group.warning}</span>
        </div>
      )}

      {showSubsetControls && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              <MathText text={subsetLabel} />:{' '}
              <MathFormula
                latex={`\\{${selectedSubset.map((i) => group.latexElements[i]).join(', ')}\\}`}
              />{' '}
              <span className="text-slate-500 dark:text-slate-400">
                (<MathFormula latex={`|H| = ${selectedSubset.length}`} /> ·{' '}
                {subValidation.isSubgroup ? 'Valid Subgroup' : 'Not a Subgroup'})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Choose preset subgroup"
                onChange={(e) => {
                  const found = presetSubgroups.find((p) => p.id === e.target.value);
                  if (found) onSubsetChange(found.elements);
                }}
                value=""
                className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="" disabled>
                  Preset Subgroups…
                </option>
                {presetSubgroups.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={closeUnderGroupOp}
                className="h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate ⟨Selection⟩
              </button>
              <button
                type="button"
                onClick={() => onSubsetChange([group.identityIndex])}
                className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {group.elements.map((el, idx) => {
              const active = selectedSubset.includes(idx);
              const isResult = operatedElements?.result === idx && operatedElements.phase !== 'operands';
              const isOperand = operatedElements?.a === idx || operatedElements?.b === idx;
              return (
                <motion.button
                  key={`${el}-${idx}`}
                  type="button"
                  onClick={() => toggleElement(idx)}
                  whileTap={{ scale: 0.94 }}
                  animate={{ scale: isResult ? 1.07 : isOperand ? 1.04 : 1 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                    active
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  } ${
                    isResult
                      ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900'
                      : isOperand
                        ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900'
                        : ''
                  }`}
                >
                  <MathFormula latex={group.latexElements[idx]} />
                </motion.button>
              );
            })}
          </div>

          <form onSubmit={handleApplyExpression} className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="text"
              value={exprInput}
              onChange={(e) => {
                setExprInput(e.target.value);
                if (exprError) setExprError(null);
              }}
              placeholder="Type generator or set: e.g. ⟨r²⟩, ⟨(1 2 3), (1 2)(3 4)⟩, or {0, 4, 8}"
              aria-label="Type subgroup or element expression"
              className="flex-1 min-w-[240px] h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="h-8 px-3 rounded-md bg-slate-800 dark:bg-slate-200 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap shrink-0"
            >
              Parse Expression
            </button>
          </form>

          {exprError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              <MathText text={exprError} />
            </p>
          )}

          {!subValidation.isSubgroup && (
            <p className="text-xs text-red-600 dark:text-red-400">
              <MathText text={subValidation.reasons.join(' ')} /> Click “Generate ⟨Selection⟩” to take the smallest subgroup containing these elements.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
