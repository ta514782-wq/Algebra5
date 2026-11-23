import { jsPDF } from 'jspdf';
import { Artifact2Exercise } from '../data/artifact2Exercises.ts';
import { LearningTopic } from '../data/topics.ts';
import { SolverOutput } from '../core/solverEngine.ts';
import { VerificationCheckItem } from '../core/verificationCertificate.ts';
import { normalizePlainMath } from './mathUnicode.ts';

function createWrappedDoc(title: string, subtitle?: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const maxWidth = 510;
  let y = 52;

  const ensureSpace = (needed = 40) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 50;
    }
  };

  const addWrapped = (text: string, fontSize = 10, bold = false, gap = 12) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    const cleaned = normalizePlainMath(text);
    const lines = doc.splitTextToSize(cleaned, maxWidth) as string[];
    ensureSpace(lines.length * (fontSize + 3) + gap);
    doc.text(lines, margin, y);
    y += lines.length * (fontSize + 3) + gap;
  };

  addWrapped(title, 16, true, 6);
  if (subtitle) addWrapped(subtitle, 10, false, 16);

  return { doc, addWrapped, addGap: (g: number) => { y += g; } };
}

export function downloadTopicPdf(topic: LearningTopic) {
  const { doc, addWrapped, addGap } = createWrappedDoc(
    `AlgebraLab — Topic ${topic.number}: ${topic.title}`,
    topic.subtitle
  );

  addWrapped('Learning Objectives', 12, true, 6);
  topic.objectives.forEach((o) => addWrapped(`• ${o}`, 10, false, 4));
  addGap(8);

  addWrapped('Introduction', 12, true, 6);
  addWrapped(topic.introduction, 10, false, 12);

  addWrapped('Formal Definitions', 12, true, 6);
  topic.definitions.forEach((d) => {
    addWrapped(`${d.term}: ${d.latex}`, 10, true, 3);
    addWrapped(d.explanation, 10, false, 8);
  });

  addWrapped('Key Theorems & Proofs', 12, true, 6);
  topic.theorems.forEach((t) => {
    addWrapped(`${t.name}: ${t.statement}`, 10, true, 4);
    t.proof.forEach((p, idx) => addWrapped(`  (${idx + 1}) ${p}`, 9, false, 3));
    addGap(6);
  });

  addWrapped('Solved Examples', 12, true, 6);
  topic.solvedExamples.forEach((ex) => {
    addWrapped(`${ex.title}`, 10, true, 3);
    addWrapped(`Problem: ${ex.problem}`, 10, false, 3);
    ex.steps.forEach((s) => addWrapped(`  - ${s}`, 9, false, 2));
    addWrapped(`Answer: ${ex.answer}`, 10, true, 8);
  });

  addWrapped('Common Examination Mistakes', 12, true, 6);
  topic.commonMistakes.forEach((m) => addWrapped(`• ${m}`, 10, false, 4));
  addGap(6);

  addWrapped('Revision Summary', 12, true, 6);
  topic.revisionNotes.forEach((r) => addWrapped(`• ${r}`, 10, false, 4));

  doc.save(`AlgebraLab_Topic_${topic.number}_${topic.id}.pdf`);
}

export function downloadExerciseProofPdf(
  exercise: Artifact2Exercise,
  live: ReturnType<Artifact2Exercise['runLiveVerification']>
) {
  const { doc, addWrapped, addGap } = createWrappedDoc(
    `AlgebraLab — Artifact 2 Problem ${exercise.number}`,
    exercise.title
  );

  addWrapped('Problem Statement', 12, true, 4);
  addWrapped(exercise.statement, 10, false, 10);

  addWrapped('Inputs & Mathematical Background', 12, true, 4);
  addWrapped(exercise.groupInputLabel, 10, false, 4);
  addWrapped(exercise.subgroupInputLabel, 10, false, 4);
  addWrapped(exercise.background, 10, false, 10);

  addWrapped('Computational Procedure', 12, true, 4);
  exercise.procedure.forEach((p) => addWrapped(p, 10, false, 4));
  addGap(6);

  addWrapped('Step-by-Step Solution', 12, true, 4);
  exercise.steps.forEach((s, i) => addWrapped(`${i + 1}. ${s}`, 10, false, 5));
  addGap(6);

  addWrapped('Live Engine Verification Output', 12, true, 4);
  addWrapped(`Verification Status: ${live.verified ? 'ENGINE VERIFIED' : 'FAILED'}`, 10, true, 4);
  live.liveMetrics.forEach((m) => addWrapped(`• ${m.label}: ${m.value}`, 10, false, 3));
  live.detailLines.forEach((d) => addWrapped(d, 9, false, 4));
  addGap(6);

  addWrapped('Final Conclusion', 12, true, 4);
  addWrapped(exercise.finalResult, 10, true, 4);
  addWrapped(exercise.explanation, 10, false, 6);

  doc.save(`AlgebraLab_Artifact2_Problem_${exercise.number}.pdf`);
}

export function downloadSolverProofPdf(solution: SolverOutput) {
  const { doc, addWrapped, addGap } = createWrappedDoc(
    'AlgebraLab — Worked Computational Proof',
    solution.problemTitle
  );

  addWrapped('Given Information', 12, true, 4);
  solution.givenInfo.forEach((g) => addWrapped(`• ${g}`, 10, false, 3));
  addGap(4);

  addWrapped('Required Result & Theorem', 12, true, 4);
  addWrapped(solution.requiredResult, 10, false, 4);
  addWrapped(`Theorem: ${solution.relevantTheorem}`, 10, true, 10);

  addWrapped('Verified Calculation Steps', 12, true, 4);
  solution.steps.forEach((s) => addWrapped(s, 10, false, 4));
  addGap(6);

  addWrapped('Final Answer & Engine Verification', 12, true, 4);
  addWrapped(solution.finalAnswer, 10, true, 4);
  addWrapped(solution.verificationSummary, 10, false, 6);

  doc.save('AlgebraLab_Worked_Proof.pdf');
}

export function downloadVerificationReportPdf(checks: VerificationCheckItem[]) {
  const passedCount = checks.filter((c) => c.passed).length;
  const { doc, addWrapped, addGap } = createWrappedDoc(
    'AlgebraLab — Mathematical Verification & Testing Report',
    `Generated: ${new Date().toLocaleString()} · Passed ${passedCount} / ${checks.length} Suites`
  );

  checks.forEach((c, idx) => {
    addWrapped(`${idx + 1}. [${c.passed ? 'PASS' : 'FAIL'}] ${c.title}`, 11, true, 3);
    addWrapped(c.details, 9.5, false, 8);
  });

  addGap(8);
  addWrapped(
    'All group, coset, Lagrange, normality, normalizer, centralizer, centre, quotient, isomorphism, and lattice invariants are computed deterministically by the finite group engine.',
    9.5,
    false,
    6
  );

  doc.save('AlgebraLab_Verification_Report.pdf');
}

export function downloadPerformancePdf(params: {
  username: string;
  completedTopics: number;
  totalTopics: number;
  practiceCount: number;
  accuracyPercent: number;
  exams: Array<{ created_at: string; question_count: number; score: number; percentage: number }>;
  practice: Array<{ created_at: string; topic_id: string; score: number; total: number }>;
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 52;
  const margin = 44;

  const line = (text: string, size = 11, bold = false, gap = 16) => {
    if (y > 770) {
      doc.addPage();
      y = 50;
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(normalizePlainMath(text), margin, y);
    y += gap;
  };

  line('AlgebraLab — Student Performance Report', 16, true, 22);
  line(`Student: ${params.username}`, 11, false, 16);
  line(`Generated: ${new Date().toLocaleDateString()}`, 10, false, 20);

  line('Summary Metrics', 13, true, 16);
  line(`Topics Completed: ${params.completedTopics} / ${params.totalTopics}`, 11, false, 15);
  line(`Practice Sessions Completed: ${params.practiceCount}`, 11, false, 15);
  line(`Overall Practice Accuracy: ${params.accuracyPercent.toFixed(1)}%`, 11, false, 22);

  line('Recent Mock Examinations', 13, true, 16);
  if (params.exams.length === 0) {
    line('No mock examinations recorded yet.', 10, false, 16);
  } else {
    params.exams.slice(0, 12).forEach((e) => {
      line(
        `${e.created_at.slice(0, 10)} — ${e.question_count} Questions — Score: ${e.score}/${e.question_count} (${e.percentage.toFixed(1)}%)`,
        10,
        false,
        14
      );
    });
  }
  y += 10;

  line('Recent Practice Sessions', 13, true, 16);
  if (params.practice.length === 0) {
    line('No practice sessions recorded yet.', 10, false, 16);
  } else {
    params.practice.slice(0, 18).forEach((p) => {
      line(
        `${p.created_at.slice(0, 10)} — Topic: ${p.topic_id} — Score: ${p.score}/${p.total}`,
        10,
        false,
        14
      );
    });
  }

  doc.save(`AlgebraLab_Performance_${params.username}.pdf`);
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replaceAll('"', '""')}"`;
    }
    return str;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
