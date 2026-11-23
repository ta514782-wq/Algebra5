import { ArrowLeft, ArrowRight, Presentation, X } from 'lucide-react';
import {
  buildAlternatingGroup,
  buildDihedralGroup,
  buildSymmetricGroup,
  generateSubgroupFromElements,
} from '../core/groupEngine.ts';
import { FiniteGroup } from '../core/groupTypes.ts';
import { MathText } from './MathFormula.tsx';

export interface PresenterScene {
  id: string;
  title: string;
  talkingPoint: string;
  targetPage: string;
  buildState: () => { group: FiniteGroup; subset: number[] };
}

export const PRESENTER_SCENES: PresenterScene[] = [
  {
    id: 'scene-d4-geometry',
    title: '1. Geometry of Non-Abelian Symmetries (D₄)',
    talkingPoint:
      'Click "Compare s·r vs r·s" in the Polygon Visualizer to show why square rotations and reflections fail to commute, then trace cyclic orbits live.',
    targetPage: 'group-explorer',
    buildState: () => {
      const d4 = buildDihedralGroup(4);
      const r2 = d4.elements.indexOf('r²');
      return { group: d4, subset: generateSubgroupFromElements(d4, [r2]) };
    },
  },
  {
    id: 'scene-fractured-cosets',
    title: '2. Why Non-Normal Quotients Fracture (⟨s⟩ ⋪ D₄)',
    talkingPoint:
      'Toggle "Coset-Blocked Cayley Table": mixed color cells visually prove that coset multiplication (g₁h₁)(g₂h₂)H depends on representative choice.',
    targetPage: 'cosets',
    buildState: () => {
      const d4 = buildDihedralGroup(4);
      const s = d4.elements.indexOf('s');
      return { group: d4, subset: generateSubgroupFromElements(d4, [s]) };
    },
  },
  {
    id: 'scene-first-iso',
    title: '3. First Isomorphism Theorem (S₄ / V₄ ≅ S₃)',
    talkingPoint:
      'All 576 multiplication pairs verify φ(ab) = φ(a)φ(b) for the partition action S₄ → S₃, collapsing kernel V₄ cleanly onto S₃ via the commutative diagram.',
    targetPage: 'homomorphism',
    buildState: () => {
      const s4 = buildSymmetricGroup(4);
      const v4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => s4.elements.indexOf(l));
      return { group: s4, subset: v4 };
    },
  },
  {
    id: 'scene-sylow-a4',
    title: '4. Sylow Counting & Lagrange Converse Failure (A₄)',
    talkingPoint:
      'In A₄ (order 12), n₃ = 4 non-normal Sylow 3-subgroups and a unique normal V₄ explain why no order-6 subgroup can exist.',
    targetPage: 'sylow',
    buildState: () => {
      const a4 = buildAlternatingGroup(4);
      const v4 = ['e', '(1 2)(3 4)', '(1 3)(2 4)', '(1 4)(2 3)'].map((l) => a4.elements.indexOf(l));
      return { group: a4, subset: v4 };
    },
  },
];

export function PresenterStoryBar({
  sceneIdx,
  onSelectScene,
  onClose,
}: {
  sceneIdx: number;
  onSelectScene: (nextIdx: number) => void;
  onClose: () => void;
}) {
  const scene = PRESENTER_SCENES[sceneIdx] ?? PRESENTER_SCENES[0];

  return (
    <div className="mb-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 p-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
          <Presentation className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <span>Classroom Presenter Walkthrough · Scene {sceneIdx + 1} / {PRESENTER_SCENES.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESENTER_SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectScene(i)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                i === sceneIdx
                  ? 'bg-blue-700 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={sceneIdx <= 0}
            onClick={() => onSelectScene(sceneIdx - 1)}
            className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 text-xs inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            Prev
          </button>
          <button
            type="button"
            disabled={sceneIdx >= PRESENTER_SCENES.length - 1}
            onClick={() => onSelectScene(sceneIdx + 1)}
            className="px-2.5 py-1 rounded-md bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Next Scene
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit presenter walkthrough"
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          <MathText text={scene.title} />
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
          <MathText text={scene.talkingPoint} />
        </p>
      </div>
    </div>
  );
}
