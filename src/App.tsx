import {
  Activity,
  ArrowRightLeft,
  BookMarked,
  BookOpen,
  Calculator,
  CheckSquare,
  Compass,
  FileSpreadsheet,
  FlaskConical,
  GitBranch,
  GitCompareArrows,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Info,
  Layers,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Orbit,
  Presentation,
  Scale,
  Shield,
  Sparkles,
  Sun,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BreadcrumbBar } from './components/BreadcrumbBar.tsx';
import { PRESENTER_SCENES, PresenterStoryBar } from './components/PresenterStoryBar.tsx';
import { SidebarSearch } from './components/SidebarSearch.tsx';
import { buildDihedralGroup, generateSubgroupFromElements, resolveGroupById } from './core/groupEngine.ts';
import { FiniteGroup } from './core/groupTypes.ts';
import { PROOF_THEOREM_CATALOG, ProofTheoremId } from './core/proofAssistantEngine.ts';
import { PracticeQuestion } from './data/questionBank.ts';
import { LEARNING_TOPICS, LearningTopic } from './data/topics.ts';
import { buildBreadcrumbTrail } from './utils/breadcrumbs.ts';
import { SidebarSearchItem } from './utils/sidebarSearch.ts';
import { Artifact2Page } from './pages/Artifact2Page.tsx';
import { ComputationalLabPage } from './pages/ComputationalLabPages.tsx';
import { DashboardPage, StudentProgressState } from './pages/DashboardPage.tsx';
import { LearnMathPage } from './pages/LearnMathPage.tsx';
import { PracticeMcqsPage, MockExamPage } from './pages/PracticeAndExamPages.tsx';
import { REAL_WORLD_SCENARIOS, RealWorldScenarioId } from './core/realWorldEngine.ts';
import { RealWorldPage } from './pages/RealWorldPage.tsx';
import {
  AboutPage,
  FormulaLibraryPage,
  GlossaryPage,
  MistakeNotebookPage,
} from './pages/ReferenceAndNotebookPages.tsx';
import { StudentProgressPage, TeacherAdminPage } from './pages/StudentAndTeacherPages.tsx';
import { AiTutorPage, ProofAssistantPage, StepByStepSolverPage } from './pages/TutorAndSolverPages.tsx';

interface UserInfo {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: 'student' | 'teacher';
}

interface CustomNote {
  id: number;
  topic_id: string;
  title: string;
  content: string;
  created_at: string;
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'artifact2', label: 'Artifact 2 Exercises', icon: Compass },
      { id: 'real-world', label: 'Real-World Problems', icon: Globe },
      { id: 'learn', label: 'Learn Mathematics', icon: BookOpen },
    ],
  },
  {
    label: 'Computational Lab',
    items: [
      { id: 'group-explorer', label: 'Group Explorer', icon: Layers },
      { id: 'subgroups', label: 'Subgroup Finder', icon: GitBranch },
      { id: 'cosets', label: 'Coset Visualizer', icon: FlaskConical },
      { id: 'lagrange', label: 'Lagrange Verifier', icon: Scale },
      { id: 'normality', label: 'Normality Tester', icon: CheckSquare },
      { id: 'normalizer', label: 'Normalizer Calculator', icon: Shield },
      { id: 'centralizer', label: 'Centralizer Calculator', icon: GitBranch },
      { id: 'centre', label: 'Centre Calculator', icon: Activity },
      { id: 'quotient', label: 'Quotient Group Builder', icon: Calculator },
      { id: 'homomorphism', label: 'First Isomorphism', icon: ArrowRightLeft },
      { id: 'sylow', label: 'Sylow & Cayley Lab', icon: Zap },
      { id: 'classification', label: 'Quotient Classification', icon: GraduationCap },
      { id: 'conjugacy', label: 'Conjugacy Classes', icon: Orbit },
      { id: 'compare', label: 'Group Comparison', icon: GitCompareArrows },
    ],
  },
  {
    label: 'Practice & AI',
    items: [
      { id: 'practice', label: 'Practice MCQs', icon: ListChecks },
      { id: 'exams', label: 'Mock Examinations', icon: FileSpreadsheet },
      { id: 'solver', label: 'Step-by-Step Solver', icon: Sparkles },
      { id: 'proof-assistant', label: 'Proof Assistant', icon: Presentation },
      { id: 'tutor', label: 'AI Algebra Tutor', icon: HelpCircle },
      { id: 'mistakes', label: 'Mistake Notebook', icon: BookMarked },
    ],
  },
  {
    label: 'Reference & Admin',
    items: [
      { id: 'formulas', label: 'Formula Library', icon: Calculator },
      { id: 'glossary', label: 'Glossary', icon: BookOpen },
      { id: 'progress', label: 'Student Progress', icon: UserCheck },
      { id: 'teacher', label: 'Teacher/Admin Panel', icon: Shield },
      { id: 'about', label: 'About Project', icon: Info },
    ],
  },
];

const VALID_PAGES = new Set(NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)));

function readInitialUrlState(): { page: string; group: FiniteGroup; subset: number[] } {
  const defaultGroup = buildDihedralGroup(4);
  const r2 = defaultGroup.elements.indexOf('r²');
  const defaultSub = generateSubgroupFromElements(defaultGroup, [r2]);

  if (typeof window === 'undefined') {
    return { page: 'dashboard', group: defaultGroup, subset: defaultSub };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const page = pageParam && VALID_PAGES.has(pageParam) ? pageParam : 'dashboard';
    const groupParam = params.get('group');
    const resolvedGroup = groupParam ? resolveGroupById(groupParam) ?? defaultGroup : defaultGroup;
    const subParam = params.get('sub');
    let subset: number[];
    if (subParam) {
      const parsed = subParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n < resolvedGroup.order);
      subset = parsed.length > 0 ? Array.from(new Set(parsed)).sort((a, b) => a - b) : [resolvedGroup.identityIndex];
    } else if (resolvedGroup.id === defaultGroup.id) {
      subset = defaultSub;
    } else {
      subset = [resolvedGroup.identityIndex];
    }
    return { page, group: resolvedGroup, subset };
  } catch {
    return { page: 'dashboard', group: defaultGroup, subset: defaultSub };
  }
}

export default function App() {
  const initialUrlState = useMemo(() => readInitialUrlState(), []);
  const [activePage, setActivePage] = useState<string>(initialUrlState.page);
  const [learnTopicId, setLearnTopicId] = useState<string | undefined>(undefined);
  const [practiceTopicId, setPracticeTopicId] = useState<string | undefined>(undefined);
  const [realWorldScenarioId, setRealWorldScenarioId] = useState<RealWorldScenarioId | undefined>(undefined);
  const [formulaQuerySeed, setFormulaQuerySeed] = useState<string | undefined>(undefined);
  const [formulaTabSeed, setFormulaTabSeed] = useState<'formulas' | 'cheatsheet' | undefined>(undefined);
  const [glossaryQuerySeed, setGlossaryQuerySeed] = useState<string | undefined>(undefined);
  const [proofTheoremSeed, setProofTheoremSeed] = useState<ProofTheoremId | undefined>(undefined);
  const [searchSeedNonce, setSearchSeedNonce] = useState(0);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const sidebarSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('algebralab.theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    } catch {
      // ignore storage errors
    }
    return true;
  });
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [presenterSceneIdx, setPresenterSceneIdx] = useState(0);

  // Active group state (initialized from URL params or D_4 and <r^2> for Artifact 2 readiness)
  const [activeGroup, setActiveGroup] = useState<FiniteGroup>(initialUrlState.group);
  const [selectedSubset, setSelectedSubset] = useState<number[]>(initialUrlState.subset);

  // Auth & persistent state (Bearer token stored strictly in React memory)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [teacherClaimed, setTeacherClaimed] = useState(false);
  const [envAdminConfigured, setEnvAdminConfigured] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [progress, setProgress] = useState<StudentProgressState | null>(null);

  const [customNotes, setCustomNotes] = useState<CustomNote[]>([]);
  const [customTopics, setCustomTopics] = useState<LearningTopic[]>([]);
  const [customApprovedQuestions, setCustomApprovedQuestions] = useState<PracticeQuestion[]>([]);

  // Student Sign In / Register modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      window.localStorage.setItem('algebralab.theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.protocol === 'file:') return;
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('page', activePage);
      params.set('group', activeGroup.id);
      params.set('sub', selectedSubset.join(','));
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', nextUrl);
    } catch {
      // ignore history errors in sandboxed frames
    }
  }, [activePage, activeGroup.id, selectedSubset]);

  const fetchServerStatus = useCallback(async (tok?: string | null) => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') return;
    try {
      const headers: Record<string, string> = {};
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const resp = await fetch('/api/auth/status', { headers });
      if (resp.ok) {
        const data = await resp.json();
        setTeacherClaimed(Boolean(data.teacherClaimed));
        setEnvAdminConfigured(Boolean(data.envAdminConfigured));
        setGeminiConfigured(Boolean(data.geminiConfigured));
        if (data.user) setUser(data.user);
      }
    } catch {
      // ignore initial status fetch errors
    }
  }, []);

  const fetchCustomContent = useCallback(async () => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') return;
    try {
      const resp = await fetch('/api/content/custom');
      if (resp.ok) {
        const data = await resp.json();
        setCustomNotes(data.notes ?? []);
        const mappedModules: LearningTopic[] = (data.modules ?? []).map(
          (
            m: {
              id: string;
              title: string;
              subtitle: string;
              estimated_minutes: number;
              introduction: string;
              objectives_json: string;
              common_mistakes_json: string;
              revision_notes_json: string;
            },
            idx: number
          ) => {
            const parseArr = (raw: string): string[] => {
              try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed.map(String) : [];
              } catch {
                return [];
              }
            };
            return {
              id: m.id,
              number: LEARNING_TOPICS.length + idx + 1,
              title: m.title,
              subtitle: m.subtitle || 'Instructor-authored custom module',
              estimatedMinutes: m.estimated_minutes || 30,
              objectives: parseArr(m.objectives_json),
              prerequisites: ['Core Algebra II Foundations'],
              introduction: m.introduction,
              definitions: [],
              theorems: [],
              formulas: [],
              solvedExamples: [],
              visualExplanation: 'Use the Interactive Example Playground or add supplemental notes, theorems, and examples via the Teacher Panel.',
              commonMistakes: parseArr(m.common_mistakes_json),
              revisionNotes: parseArr(m.revision_notes_json),
            };
          }
        );
        setCustomTopics(mappedModules);
        const mapped: PracticeQuestion[] = (data.questions ?? []).map(
          (q: {
            id: string;
            topic_id: string;
            difficulty: 'easy' | 'medium' | 'advanced';
            question: string;
            options_json: string;
            correct_index: number;
            explanation: string;
            formula: string;
          }) => {
            const opts = JSON.parse(q.options_json) as [string, string, string, string];
            return {
              id: q.id,
              topicId: q.topic_id,
              topicTitle: q.topic_id,
              difficulty: q.difficulty,
              question: q.question,
              options: opts,
              correctIndex: q.correct_index,
              correctExplanation: q.explanation,
              distractorExplanations: [
                q.correct_index === 0 ? q.explanation : 'Not the verified answer.',
                q.correct_index === 1 ? q.explanation : 'Not the verified answer.',
                q.correct_index === 2 ? q.explanation : 'Not the verified answer.',
                q.correct_index === 3 ? q.explanation : 'Not the verified answer.',
              ],
              formula: q.formula || '',
              stepByStep: [q.explanation],
              verificationStatus: 'approved',
              source: 'teacher-authored',
            };
          }
        );
        setCustomApprovedQuestions(mapped);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchProgress = useCallback(async (tok: string) => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') return;
    try {
      const resp = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (resp.ok) {
        setProgress(await resp.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchServerStatus(null);
    fetchCustomContent();
  }, [fetchServerStatus, fetchCustomContent]);

  useEffect(() => {
    if (token) fetchProgress(token);
    else setProgress(null);
  }, [token, fetchProgress]);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileMenuOpen(true);
        setTimeout(() => sidebarSearchInputRef.current?.focus(), 0);
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        setMobileMenuOpen(true);
        setTimeout(() => sidebarSearchInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  const handleNavigate = (page: string, topicId?: string) => {
    if (page === 'learn' && topicId) setLearnTopicId(topicId);
    if (page === 'practice') setPracticeTopicId(topicId);
    if (page === 'real-world' && topicId) setRealWorldScenarioId(topicId as RealWorldScenarioId);
    if (page === 'formulas' && !topicId) {
      setFormulaQuerySeed('');
      setFormulaTabSeed('formulas');
    }
    if (page === 'glossary' && !topicId) {
      setGlossaryQuerySeed('');
    }
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const handleSidebarSearchSelect = (item: SidebarSearchItem) => {
    if (item.targetPage === 'learn' && item.topicId) {
      setLearnTopicId(item.topicId);
    } else if (item.targetPage === 'real-world' && item.topicId) {
      setRealWorldScenarioId(item.topicId as RealWorldScenarioId);
    } else if (item.targetPage === 'formulas') {
      setFormulaQuerySeed(item.referenceQuery ?? '');
      setFormulaTabSeed(item.formulaTab ?? 'formulas');
    } else if (item.targetPage === 'glossary') {
      setGlossaryQuerySeed(item.referenceQuery ?? '');
    } else if (item.targetPage === 'proof-assistant' && item.theoremId) {
      setProofTheoremSeed(item.theoremId);
    }
    setSearchSeedNonce((n) => n + 1);
    setActivePage(item.targetPage);
    setMobileMenuOpen(false);
    setSidebarSearchQuery('');
  };

  const launchPresenterScene = (idx: number) => {
    const safeIdx = Math.max(0, Math.min(idx, PRESENTER_SCENES.length - 1));
    const scene = PRESENTER_SCENES[safeIdx];
    const { group, subset } = scene.buildState();
    setPresenterOpen(true);
    setPresenterSceneIdx(safeIdx);
    setActiveGroup(group);
    setSelectedSubset(subset);
    setActivePage(scene.targetPage);
    setMobileMenuOpen(false);
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body =
      authMode === 'login'
        ? { username: authUsername, password: authPassword }
        : { username: authUsername, displayName: authDisplayName, email: authEmail, password: authPassword };
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      setToken(data.token);
      setUser(data.user);
      setAuthModalOpen(false);
      setAuthPassword('');
      fetchServerStatus(data.token);
    } catch {
      setAuthError('Network error during authentication.');
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    setProgress(null);
  };

  const completedTopicIds = useMemo(
    () => new Set((progress?.topics ?? []).filter((t) => t.completed === 1).map((t) => t.topic_id)),
    [progress]
  );

  const bookmarkedTopicIds = useMemo(
    () =>
      new Set(
        (progress?.bookmarks ?? []).filter((b) => b.item_type === 'topic').map((b) => b.item_id)
      ),
    [progress]
  );

  const bookmarkedQuestionIds = useMemo(
    () =>
      new Set(
        (progress?.bookmarks ?? []).filter((b) => b.item_type === 'question').map((b) => b.item_id)
      ),
    [progress]
  );

  const activeSubLabel = useMemo(() => {
    if (activePage === 'learn') {
      const allTopics = [...LEARNING_TOPICS, ...customTopics];
      const targetId = learnTopicId ?? LEARNING_TOPICS[0]?.id;
      const found = allTopics.find((t) => t.id === targetId);
      return found ? `${found.number}. ${found.title}` : undefined;
    }
    if (activePage === 'real-world') {
      const targetId = realWorldScenarioId ?? REAL_WORLD_SCENARIOS[0]?.id;
      const found = REAL_WORLD_SCENARIOS.find((s) => s.id === targetId);
      return found?.title;
    }
    if (activePage === 'proof-assistant') {
      const targetId = proofTheoremSeed ?? PROOF_THEOREM_CATALOG[0]?.id;
      const found = PROOF_THEOREM_CATALOG.find((th) => th.id === targetId);
      return found?.title;
    }
    if (activePage === 'formulas' && formulaTabSeed === 'cheatsheet') {
      return 'Visual Cheat Sheet';
    }
    return undefined;
  }, [activePage, customTopics, learnTopicId, realWorldScenarioId, proofTheoremSeed, formulaTabSeed]);

  const breadcrumbSegments = useMemo(
    () =>
      buildBreadcrumbTrail({
        activePage,
        navGroups: NAV_GROUPS,
        subLabel: activeSubLabel,
      }),
    [activePage, activeSubLabel]
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Clean 3-Zone Top Header Bar */}
      <header className="sticky top-0 z-30 h-14 px-3 sm:px-6 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/90 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-blue-600 dark:text-blue-400 shrink-0">
              <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="currentColor" strokeWidth="1.75" />
              <path d="M12 2.5V21.5M2.5 12H21.5" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.45" />
              <circle cx="7.25" cy="7.25" r="2" fill="currentColor" />
              <circle cx="16.75" cy="16.75" r="2" fill="currentColor" />
            </svg>
            <span>AlgebraLab</span>
          </button>
        </div>

        {/* Zone 2: Quick Section Context Links (max 5 concise links) */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button type="button" onClick={() => handleNavigate('learn')} className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0">
            Learn
          </button>
          <button type="button" onClick={() => handleNavigate('cosets')} className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0">
            Coset Lab
          </button>
          <button type="button" onClick={() => handleNavigate('quotient')} className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0">
            Quotients
          </button>
          <button type="button" onClick={() => handleNavigate('practice')} className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0">
            Practice
          </button>
          <button type="button" onClick={() => handleNavigate('proof-assistant')} className="hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap shrink-0">
            Proofs
          </button>
        </nav>

        {/* Zone 3: Theme Toggle & Account Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle color theme"
            title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 max-w-[140px] sm:max-w-none"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.display_name} · Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? 'fixed inset-y-14 left-0 z-20 block' : 'hidden'
          } lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0B1120] overflow-y-auto p-4 space-y-5`}
        >
          <SidebarSearch
            query={sidebarSearchQuery}
            onQueryChange={setSidebarSearchQuery}
            customTopics={customTopics}
            onSelectResult={handleSidebarSearchSelect}
            inputRef={sidebarSearchInputRef}
          />

          {!sidebarSearchQuery.trim() &&
            NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
        </aside>

        {/* Right Column: Breadcrumb Trail below Top Header + Main Content Viewport */}
        <div className="flex-1 min-w-0 flex flex-col">
          <BreadcrumbBar
            segments={breadcrumbSegments}
            activePage={activePage}
            onNavigate={(page) => handleNavigate(page)}
            onResetSubContext={() => {
              if (activePage === 'formulas') {
                setFormulaTabSeed('formulas');
                setFormulaQuerySeed('');
                setSearchSeedNonce((n) => n + 1);
              }
            }}
          />

          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full">
            {presenterOpen && (
              <PresenterStoryBar
                sceneIdx={presenterSceneIdx}
                onSelectScene={launchPresenterScene}
                onClose={() => setPresenterOpen(false)}
              />
            )}

          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onStartPresenter={() => launchPresenterScene(0)}
              progress={progress}
              userDisplayName={user?.display_name ?? null}
              customTopics={customTopics}
            />
          )}

          {activePage === 'artifact2' && (
            <Artifact2Page
              onLoadIntoLab={(g, sub, target) => {
                setActiveGroup(g);
                setSelectedSubset(sub);
                handleNavigate(target);
              }}
            />
          )}

          {activePage === 'real-world' && (
            <RealWorldPage
              initialScenarioId={realWorldScenarioId}
              onScenarioChange={setRealWorldScenarioId}
              onLoadIntoLab={(g, sub, target) => {
                setActiveGroup(g);
                setSelectedSubset(sub);
                handleNavigate(target);
              }}
            />
          )}

          {activePage === 'learn' && (
            <LearnMathPage
              initialTopicId={learnTopicId}
              onTopicChange={setLearnTopicId}
              completedTopicIds={completedTopicIds}
              bookmarkedTopicIds={bookmarkedTopicIds}
              customNotes={customNotes}
              customTopics={customTopics}
              isAuthenticated={Boolean(token)}
              onToggleComplete={async (topicId, completed) => {
                if (!token) return;
                await fetch('/api/progress/topic', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ topicId, completed }),
                });
                fetchProgress(token);
              }}
              onToggleBookmark={async (itemId, label) => {
                if (!token) return;
                await fetch('/api/bookmarks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ itemType: 'topic', itemId, label }),
                });
                fetchProgress(token);
              }}
              onPracticeTopic={(tid) => handleNavigate('practice', tid)}
            />
          )}

          {(activePage === 'group-explorer' ||
            activePage === 'subgroups' ||
            activePage === 'cosets' ||
            activePage === 'lagrange' ||
            activePage === 'normality' ||
            activePage === 'normalizer' ||
            activePage === 'centralizer' ||
            activePage === 'centre' ||
            activePage === 'quotient' ||
            activePage === 'homomorphism' ||
            activePage === 'sylow' ||
            activePage === 'classification' ||
            activePage === 'conjugacy' ||
            activePage === 'compare') && (
            <ComputationalLabPage
              mode={activePage}
              group={activeGroup}
              selectedSubset={selectedSubset}
              onGroupChange={(g, sub) => {
                setActiveGroup(g);
                setSelectedSubset(sub);
              }}
              onSubsetChange={setSelectedSubset}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'practice' && (
            <PracticeMcqsPage
              initialTopicId={practiceTopicId}
              customApprovedQuestions={customApprovedQuestions}
              bookmarkedQuestionIds={bookmarkedQuestionIds}
              isAuthenticated={Boolean(token)}
              onToggleBookmark={async (itemId, label) => {
                if (!token) return;
                await fetch('/api/bookmarks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ itemType: 'question', itemId, label }),
                });
                fetchProgress(token);
              }}
              onSavePracticeSession={async (payload) => {
                if (!token) return;
                await fetch('/api/progress/practice', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify(payload),
                });
                fetchProgress(token);
              }}
            />
          )}

          {activePage === 'exams' && (
            <MockExamPage
              customApprovedQuestions={customApprovedQuestions}
              isAuthenticated={Boolean(token)}
              onSaveExamResult={async (payload) => {
                if (!token) return;
                await fetch('/api/progress/exam', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify(payload),
                });
                fetchProgress(token);
              }}
            />
          )}

          {activePage === 'tutor' && (
            <AiTutorPage
              group={activeGroup}
              selectedSubset={selectedSubset}
              geminiConfigured={geminiConfigured}
              onOpenSolver={() => handleNavigate('solver')}
            />
          )}

          {activePage === 'solver' && (
            <StepByStepSolverPage
              group={activeGroup}
              selectedSubset={selectedSubset}
              onGroupChange={(g, sub) => {
                setActiveGroup(g);
                setSelectedSubset(sub);
              }}
              onSubsetChange={setSelectedSubset}
            />
          )}

          {activePage === 'proof-assistant' && (
            <ProofAssistantPage
              group={activeGroup}
              selectedSubset={selectedSubset}
              initialTheoremId={proofTheoremSeed}
              theoremNonce={searchSeedNonce}
              onTheoremChange={setProofTheoremSeed}
              onGroupChange={(g, sub) => {
                setActiveGroup(g);
                setSelectedSubset(sub);
              }}
              onSubsetChange={setSelectedSubset}
            />
          )}

          {activePage === 'mistakes' && (
            <MistakeNotebookPage
              progress={progress}
              isAuthenticated={Boolean(token)}
              onToggleMastered={async (questionId, mastered) => {
                if (!token) return;
                await fetch(`/api/mistakes/${encodeURIComponent(questionId)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ mastered }),
                });
                fetchProgress(token);
              }}
            />
          )}

          {activePage === 'formulas' && (
            <FormulaLibraryPage
              initialQuery={formulaQuerySeed}
              initialTab={formulaTabSeed}
              searchNonce={searchSeedNonce}
              onTabChange={setFormulaTabSeed}
            />
          )}
          {activePage === 'glossary' && (
            <GlossaryPage
              initialQuery={glossaryQuerySeed}
              searchNonce={searchSeedNonce}
            />
          )}
          {activePage === 'progress' && (
            <StudentProgressPage
              progress={progress}
              username={user?.display_name ?? null}
              isAuthenticated={Boolean(token)}
            />
          )}
          {activePage === 'teacher' && (
            <TeacherAdminPage
              token={token}
              userRole={user?.role ?? null}
              teacherClaimed={teacherClaimed}
              envAdminConfigured={envAdminConfigured}
              onAuthSuccess={(tok, usr) => {
                setToken(tok);
                setUser(usr);
                setTeacherClaimed(true);
              }}
              onRefreshContent={fetchCustomContent}
            />
          )}
          {activePage === 'about' && (
            <AboutPage
              onLaunchDemo={(g, sub, target) => {
                setActiveGroup(g);
                setSelectedSubset(sub);
                handleNavigate(target);
              }}
            />
          )}
          </main>
        </div>
      </div>

      {/* Student Login / Registration Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {authMode === 'login' ? 'Student Sign In' : 'Create Student Account'}
              </h2>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium ${
                  authMode === 'login' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium ${
                  authMode === 'register' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleStudentAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">University Email (optional)</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">Password (min 6 chars)</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              {authError && <p className="text-xs text-red-600">{authError}</p>}
              <button
                type="submit"
                className="w-full h-9 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium"
              >
                {authMode === 'login' ? 'Sign In' : 'Register & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </MotionConfig>
  );
}
