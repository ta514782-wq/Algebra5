import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormattedTutorText } from '../components/FormattedTutorText.tsx';
import { GroupSelectorBar } from '../components/GroupSelectorBar.tsx';
import { MathFormula, MathText } from '../components/MathFormula.tsx';
import { calculateCentre } from '../core/centreEngine.ts';
import { analyzeCosets } from '../core/cosetEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import { validateSubgroup } from '../core/groupValidation.ts';
import { analyzeNormality } from '../core/normalityEngine.ts';
import { calculateNormalizer } from '../core/normalizerEngine.ts';
import { solveGroupProblem, SolverProblemType } from '../core/solverEngine.ts';
import { buildVerifiedEngineTutorReply } from '../core/tutorEngineFallback.ts';
import { LEARNING_TOPICS } from '../data/topics.ts';
import { solverSolutionToLatex } from '../utils/latexExport.ts';
import { downloadSolverProofPdf } from '../utils/pdfExport.ts';

interface AiTutorPageProps {
  group: FiniteGroup;
  selectedSubset: number[];
  geminiConfigured: boolean;
  onOpenSolver?: () => void;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sourceLabel?: string;
  liveNotice?: string;
  retryQuestion?: string;
}

function buildEngineContextSummary(group: FiniteGroup, selectedSubset: number[]): string {
  const subsetLabels = selectedSubset.map((i) => group.elements[i]);
  const subCheck = validateSubgroup(group, selectedSubset);
  const centre = calculateCentre(group);
  const lines = [
    `Active Group G = ${group.name} (order |G| = ${group.order}, ${group.isAbelian ? 'abelian' : 'non-abelian'})`,
    `Centre Z(G) = {${centre.centreLabels.join(', ')}} (order ${centre.centreOrder})`,
    `Selected Subset H = {${subsetLabels.join(', ')}} (size ${selectedSubset.length})`,
    `Subgroup Check: ${subCheck.isSubgroup ? 'Valid subgroup of G' : `NOT a subgroup (${subCheck.reasons.join('; ')})`}`,
  ];

  if (subCheck.isSubgroup) {
    const cosets = analyzeCosets(group, selectedSubset);
    const normality = analyzeNormality(group, selectedSubset);
    const normalizer = calculateNormalizer(group, selectedSubset);
    lines.push(`Index [G : H] = ${cosets.index}`);
    lines.push(
      `Normality: ${normality.isNormal ? 'Normal (H ◁ G, quotient G/H exists)' : `Not normal in G (${normality.failingElements.length} conjugation counterexamples)`}`
    );
    lines.push(`Normalizer N_G(H) = {${normalizer.normalizerLabels.join(', ')}} (order ${normalizer.normalizerOrder})`);
  }

  return lines.join('\n');
}

export function AiTutorPage({ group, selectedSubset, geminiConfigured, onOpenSolver }: AiTutorPageProps) {
  const [topic, setTopic] = useState(LEARNING_TOPICS[0].title);
  const [mode, setMode] = useState<'simple' | 'proof' | 'example' | 'standard'>('standard');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const engineContext = useMemo(
    () => buildEngineContextSummary(group, selectedSubset),
    [group, selectedSubset]
  );

  const initialGreeting = useMemo<ChatMsg>(
    () => ({
      id: 'welcome',
      role: 'assistant',
      text: `Ask any question about cosets, Lagrange's theorem, normal subgroups, normalizers, centralizers, quotient groups, homomorphisms, Sylow subgroups, or abelian classification. Your current active lab group is ${group.name} (order ${group.order}) with selection {${selectedSubset.map((i) => group.elements[i]).join(', ')}}. Explanations are grounded on the verified engine state.`,
    }),
    [group, selectedSubset]
  );

  const [messages, setMessages] = useState<ChatMsg[]>([initialGreeting]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, loading]);

  const askTutor = async (customPrompt?: string, isRetry = false) => {
    const q = (customPrompt ?? input).trim();
    if (!q || loading) return;

    const nonErrorMessages = messages.filter((m) => m.id !== 'welcome' && !m.liveNotice);
    const historySource =
      isRetry && nonErrorMessages.length > 0 && nonErrorMessages[nonErrorMessages.length - 1].role === 'user'
        ? nonErrorMessages.slice(0, -1)
        : nonErrorMessages;
    const historyForRequest = historySource.map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => {
      const base = isRetry
        ? prev.filter((m) => !(m.liveNotice && m.retryQuestion === q))
        : [...prev, { id: `u-${Date.now()}`, role: 'user' as const, text: q }];
      return base;
    });

    if (!customPrompt) setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 22000);

    try {
      const resp = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          topic,
          mode,
          question: q,
          contextSummary: engineContext,
          history: historyForRequest,
        }),
      });
      const rawBody = await resp.text();
      let data: { answer?: string; error?: string; model?: string; liveAvailable?: boolean } = {};
      try {
        data = JSON.parse(rawBody) as {
          answer?: string;
          error?: string;
          model?: string;
          liveAvailable?: boolean;
        };
      } catch {
        data = {
          error: resp.ok
            ? 'Received an unexpected non-JSON response from the server.'
            : `Tutor endpoint returned HTTP ${resp.status}.`,
        };
      }

      if (!resp.ok || data.liveAvailable === false || !data.answer) {
        const notice =
          data.error ||
          `Live Gemini AI returned HTTP ${resp.status}. Showing a verified computation from the AlgebraLab Group Engine instead.`;
        const engineReply = buildVerifiedEngineTutorReply(q, topic, mode, group, selectedSubset);
        setMessages((prev) => [
          ...prev,
          {
            id: `eng-${Date.now()}`,
            role: 'assistant',
            text: engineReply,
            sourceLabel: 'Verified Deterministic Algebra Engine',
            liveNotice: notice,
            retryQuestion: q,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.answer!,
            sourceLabel: `Live Gemini AI (${data.model || 'gemini-4-hydrogen'}) · Engine-Grounded`,
          },
        ]);
      }
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const notice = isAbort
        ? 'Live Gemini AI timed out waiting for upstream response. Showing verified computation from the AlgebraLab Group Engine instead.'
        : 'Could not reach the Live Gemini AI endpoint over the network. Showing verified computation from the AlgebraLab Group Engine instead.';
      const engineReply = buildVerifiedEngineTutorReply(q, topic, mode, group, selectedSubset);
      setMessages((prev) => [
        ...prev,
        {
          id: `eng-${Date.now()}`,
          role: 'assistant',
          text: engineReply,
          sourceLabel: 'Verified Deterministic Algebra Engine',
          liveNotice: notice,
          retryQuestion: q,
        },
      ]);
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleClearChat = () => {
    setMessages([initialGreeting]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              AI Algebra Tutor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {geminiConfigured
                ? `Engine-grounded on ${group.name} (order ${group.order}) · Live Gemini AI with deterministic engine proof fallback`
                : `Deterministic Group Engine Tutor active on ${group.name} (configure GEMINI_API_KEY in Secrets for live Gemini AI)`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Topic focus"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
            >
              {LEARNING_TOPICS.map((t) => (
                <option key={t.id} value={t.title}>
                  {t.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Explanation mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="standard">Balanced Explanation</option>
              <option value="simple">Simple Intuition</option>
              <option value="proof">Rigorous Proof</option>
              <option value="example">Worked Example</option>
            </select>
            <button
              type="button"
              onClick={handleClearChat}
              disabled={loading || messages.length <= 1}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 text-xs font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'Why is gH = Hg equivalent to gHg⁻¹ = H?',
            'Explain why A₄ has no subgroup of order 6',
            'Contrast normalizer N_G(H) vs centralizer C_G(H)',
            'Why is D₄/⟨r²⟩ isomorphic to V₄?',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={loading}
              onClick={() => askTutor(preset)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 disabled:opacity-50 text-xs text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <MathText text={preset} />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-lg ${
                m.role === 'user'
                  ? 'bg-blue-700 text-white ml-6 sm:ml-10 text-sm'
                  : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mr-2 sm:mr-8 space-y-3'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    {m.liveNotice ? (
                      <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                    {m.sourceLabel || 'Tutor Guidance (Engine-Grounded)'}
                  </span>
                  {m.id !== 'welcome' && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(m.id, m.text)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {m.liveNotice && (
                <div className="px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/80 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{m.liveNotice}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {m.retryQuestion && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => askTutor(m.retryQuestion, true)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry Live AI
                      </button>
                    )}
                    {onOpenSolver && (
                      <button
                        type="button"
                        onClick={onOpenSolver}
                        className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-700 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 text-[11px] font-medium whitespace-nowrap"
                      >
                        Step-by-Step Solver
                      </button>
                    )}
                  </div>
                </div>
              )}

              {m.role === 'user' ? (
                <MathText text={m.text} />
              ) : (
                <FormattedTutorText text={m.text} />
              )}
            </div>
          ))}

          {loading && (
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 mr-2 sm:mr-8">
              Querying Gemini AI & verifying group-theory context…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askTutor();
          }}
          className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or follow-up about cosets, normality, quotient groups, or proofs…"
            className="flex-1 min-w-0 h-10 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Ask Tutor
          </button>
        </form>
      </div>
    </div>
  );
}

export function StepByStepSolverPage({
  group,
  selectedSubset,
  onGroupChange,
  onSubsetChange,
}: {
  group: FiniteGroup;
  selectedSubset: number[];
  onGroupChange: (g: FiniteGroup, initialSubset: number[]) => void;
  onSubsetChange: (indices: number[]) => void;
}) {
  const [problemType, setProblemType] = useState<SolverProblemType>('quotient');
  const [copiedLatex, setCopiedLatex] = useState(false);
  const solution = solveGroupProblem(problemType, group, selectedSubset);

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(solverSolutionToLatex(solution));
      setCopiedLatex(true);
      window.setTimeout(() => setCopiedLatex(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Step-by-Step Mathematical Solver
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Select a problem type and group/subgroup below. Every intermediate calculation and verification is executed directly by the deterministic group-theory engine.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(
            [
              ['cosets', 'Cosets & Index'],
              ['lagrange', "Lagrange's Theorem"],
              ['normality', 'Normality Test'],
              ['normalizer', 'Normalizer N_G(H)'],
              ['centralizer', 'Centralizer C_G(S)'],
              ['centre', 'Centre Z(G)'],
              ['quotient', 'Quotient Group G/H'],
              ['classification', 'Abelian Classification'],
              ['conjugacy', 'Conjugacy & Class Eq.'],
            ] as Array<[SolverProblemType, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setProblemType(id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 ${
                problemType === id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <MathText text={label} />
            </button>
          ))}
        </div>
      </div>

      <GroupSelectorBar
        group={group}
        selectedSubset={selectedSubset}
        onGroupChange={onGroupChange}
        onSubsetChange={onSubsetChange}
        showSubsetControls={problemType !== 'centre' && problemType !== 'conjugacy'}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            <MathText text={solution.problemTitle} />
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              {solution.verifiedByEngine ? 'Verified by Group Engine' : 'Engine Flagged'}
            </div>
            <button
              type="button"
              onClick={handleCopyLatex}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLatex ? 'Copied LaTeX Proof' : 'Copy LaTeX Proof'}
            </button>
            <button
              type="button"
              onClick={() => downloadSolverProofPdf(solution)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Export Proof PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-600 dark:text-slate-400">Given Information</div>
            {solution.givenInfo.map((g, i) => (
              <div key={i} className="text-slate-900 dark:text-slate-100">
                <MathText text={g} />
              </div>
            ))}
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-600 dark:text-slate-400">Required Result & Theorem</div>
            <div className="text-slate-800 dark:text-slate-200">
              <MathText text={solution.requiredResult} />
            </div>
            <div className="text-blue-700 dark:text-blue-400 font-medium">{solution.relevantTheorem}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <MathFormula latex={solution.formulaLatex} display />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Verified Calculation Steps
          </div>
          {solution.steps.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200">
              <MathText text={s} />
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1">
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-300">Final Answer</div>
          <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
            <MathText text={solution.finalAnswer} />
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <MathText text={solution.verificationSummary} />
          </div>
        </div>
      </div>
    </div>
  );
}
