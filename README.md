# AlgebraLab — Finite Group Theory & Quotient Structure Platform

**Course:** BS Mathematics · Algebra II (Artifact 2)  
**Domain:** Cosets, Lagrange's Theorem, Normal Subgroups, Normalizers, Centralizers, Centre, Conjugacy Classes, Quotient Groups, Explicit Isomorphism Proofs, and Finite Abelian Group Classification.

---

## 1. Overview & Artifact 2 Focus

AlgebraLab combines a **deterministic finite-group computation engine** with an interactive D3/KaTeX mathematical laboratory, guided Artifact 2 problem sets, a 700-question verified MCQ bank, and student/instructor analytics.

Every mathematical result displayed in the computational lab, Artifact 2 exercises, solver, and verification certificate is computed directly from group multiplication tables—never hardcoded or approximated by an LLM.

### Professor's Artifact 2 — Five Flagship Exercises
1. **$D_4 / \langle r^2 \rangle \cong \mathbb{Z}_2 \times \mathbb{Z}_2$**: Verifies $\langle r^2 \rangle = Z(D_4) \trianglelefteq D_4$, builds the 4-element quotient Cayley table, and classifies invariant factors `[2, 2]`.
2. **$S_4 / V_4 \cong S_3$**: Constructs the 6-element non-abelian quotient, enforces the Finite Abelian Classification guard, and computes an explicit verified bijection $\varphi: S_4/V_4 \xrightarrow{\sim} S_3$ across all $36/36$ Cayley pairs.
3. **Proper Normalizer $N_G(H) \neq G$**: Demonstrates $H = \langle s \rangle < N_{D_4}(H) = \{e, r^2, s, r^2s\} \subsetneq D_4$ and $N_{S_3}(\langle (1\;2) \rangle) = \langle (1\;2) \rangle$.
4. **Converse of Lagrange's Theorem Failure in $A_4$**: Exhaustive verified subgroup lattice enumeration proves $A_4$ ($|A_4| = 12$) has $0$ subgroups of order $6$, alongside the theoretical parity/3-cycle proof.
5. **$({\mathbb{Z}_2 \times \mathbb{Z}_6}) / \langle (1,2) \rangle \cong \mathbb{Z}_2$**: Computes $\mathrm{ord}(1,2) = \operatorname{lcm}(2,3) = 6$ and classifies the order-2 quotient group.

---

## 2. Architecture & Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite 8
- **Mathematical Typography:** KaTeX (`MathFormula` / `MathText`) + canonical Unicode/LaTeX conversion
- **Interactive Diagrams:**
  - **D3.js:** Subgroup Lattice Hasse Diagram (`SubgroupLatticeD3`) & Natural Epimorphism Fiber Collapse (`QuotientEpimorphismD3`)
  - **SVG Visuals:** Coset Partition Diagram, Coset-Blocked Cayley Table (`CosetBlockedCayleyTable`), Conjugacy Class & Class Equation Visuals, Student Accuracy Progression Chart (`StudentPerformanceCharts`)
- **PDF & CSV Exports:** `jsPDF` (`downloadTopicPdf`, `downloadExerciseProofPdf`, `downloadSolverProofPdf`, `downloadVerificationReportPdf`, `downloadPerformancePdf`, `downloadCsv`)
- **Backend & Persistence:** Express (`server.ts`) + Node.js native SQLite (`node:sqlite` -> `algebralab.db`), `scrypt` password hashing, timing-safe token auth
- **AI Guidance (Optional):** Server-side `@google/genai` integration (`/api/tutor`) strictly separated from deterministic engine proofs, with offline verified study-note fallback

---

## 3. Feature & Module Guide

| Module | Description | Key Mathematical Capabilities |
| :--- | :--- | :--- |
| **Dashboard, Presenter Mode & Verification** | Quick lab entry, **4-Scene Classroom Presenter Tour**, Live Verification Certificate | Guides live classroom demos ($D_4 \to \langle s \rangle \to S_4/V_4 \to A_4$) and exports a Verification Report PDF |
| **Artifact 2 Exercises & Challenges** | 5 guided computational problems + 6 engine-graded **Hands-On Construct & Prove Challenges** | Live metrics, explicit $S_4/V_4 \cong S_3$ isomorphism table, interactive element-chip grader, "Inspect in Lab", and Proof PDF export |
| **Learn Mathematics** | 7 structured curriculum chapters with $\ge 5$ solved examples each | Formal definitions, step-by-step proofs, common exam pitfalls, and Topic PDF export |
| **Group Explorer & Geometry Lab** | Cayley tables (**Copy LaTeX**), animated regular $n$-gon ($D_n$) & permutation flow ($S_n, A_n$) visualizers, typed parser, **D3 Subgroup Lattice**, and shareable URL sync | Hasse covering reduction, click-to-load subgroups, live operation & orbit animations, custom table axiom verifier |
| **Coset Visualizer** | Partition diagram and **Coset-Blocked Cayley Table** | Compares left ($gH$) vs. right ($Hg$) cosets and contrasts pure vs. fractured coset blocks |
| **Lagrange Verifier** | Index $[G:H] = |G|/|H|$ verification and divisor-order subgroup search | Distinguishes exhaustive verified searches ($|G| \le 24$) from resource-bounded searches |
| **Normality Tester** | Side-by-side normality criteria and **Interactive Element Witness Inspector** | Inspects $gH$, $Hg$, $gHg^{-1}$, and elementwise $g \cdot h \cdot g^{-1}$ for every $g \in G$ |
| **Normalizer / Centralizer / Centre** | Exact computation of $N_G(H)$, $C_G(S)$, $Z(G)$, and **Conjugate Subgroups Orbit-Stabilizer Partition** | Maps each distinct conjugate $gHg^{-1}$ to its producing coset of $N_G(H)$, verifying $|\mathrm{Conj}_G(H)| = [G : N_G(H)]$ |
| **Quotient Group Builder** | Constructs $G/H$ with strict $H \trianglelefteq G$ safety guard and **Copy Full Quotient LaTeX** | Features **D3 Fiber Collapse** ($\pi: G \twoheadrightarrow G/H$), **Explicit Isomorphism Proof**, and fractured-block explanation when blocked |
| **First Isomorphism Workbench** | Presets + custom elementwise map editor testing $\varphi: G \to G'$ across all $|G|^2$ pairs | Computes $\ker(\varphi) \trianglelefteq G$, $\mathrm{Im}(\varphi) \le G'$, commutative triangle diagram, and verifies $G/\ker(\varphi) \cong \mathrm{Im}(\varphi)$ |
| **Sylow & Cayley Lab** | Prime-power **Sylow $p$-Subgroup Analyzer** & **Cayley's Regular Embedding** ($G \hookrightarrow S_{|G|}$) | Verifies $n_p \equiv 1 \pmod p$, $n_p \mid m$, Sylow conjugacy witnesses, $n_p = 1 \iff P \trianglelefteq G$, and cycle form of $\lambda_g$ |
| **Quotient Classification** | Invariant factors, elementary divisors, and canonical isomorphism proofs | Enforces non-abelian theorem guard (never runs FTFGAG on non-abelian groups like $S_3$ or $D_4$) |
| **Conjugacy Classes** | Partitions $G$ by $gxg^{-1}$ and verifies $|G| = |Z(G)| + \sum [G : C_G(x_i)]$ | Interactive Class Equation blocks and elementwise conjugacy inspection |
| **Step-by-Step Solver** | Multi-topic worked proof generator for any group and subgroup | Engine verification badge, **Copy LaTeX Proof**, and **Export Proof PDF** |
| **Practice Vault & 60s Lightning Sprint** | Adaptive multi-tier problem vault + **60-Second Classroom Lightning Challenge** & Timed Mock Exams | Streak-multiplied speed sprint, auto-logged **Mistake Notebook**, targeted revision tests |
| **Student Progress & Teacher Admin** | Accuracy trend charts, CSV/PDF reports, class roster, custom notes & CSV/JSON question review queue | Persistent SQLite storage with scrypt-hashed student & instructor authentication |

---

## 4. Database Schema (`algebralab.db`)

Initialized automatically by `src/server/db.ts` using `node:sqlite`:
- `users`: Student and instructor accounts (`username`, `display_name`, `email`, `password_hash`, `role`)
- `sessions`: Expiring Bearer session tokens (7-day TTL)
- `topic_progress`: Per-user completion state across the 7 curriculum chapters
- `practice_sessions`: Topic, difficulty, score, total, and time spent
- `exam_results`: Question count, percentage, topic breakdown JSON
- `bookmarks`: Saved topics and practice questions
- `mistake_notebook`: Missed questions, previous/correct answers, attempt counts, and mastery flag
- `learning_activity`: Recent chronological study log
- `custom_notes` & `custom_questions`: Instructor-published supplemental notes and reviewed MCQ items

---

## 5. Computational Scope & Mathematical Safeguards

- **Group Families:** Cyclic ($\mathbb{Z}_n$, $n \le 36$), Dihedral ($D_n$, $n \le 16$), Symmetric ($S_n$, $n \le 5$), Alternating ($A_n$, $n \le 5$), Quaternions ($Q_8$), Direct Products ($\mathbb{Z}_{m} \times \mathbb{Z}_{n}$, order $\le 48$), and user-defined custom Cayley tables (validated for closure, associativity, identity, and inverses).
- **Subgroup Lattice & Exhaustive Search:** Complete Hasse subgroup lattice enumeration and exhaustive converse-of-Lagrange searches run up to order $24$ (covering $D_4, S_3, A_4, S_4, Q_8, \mathbb{Z}_2 \times \mathbb{Z}_6$). Larger groups explicitly report bounded search scopes.
- **Explicit Isomorphism Proofs:** Full Cayley-preserving bijection search runs up to order $24$ and verifies all $|G|^2$ multiplication pairs.
- **Quotient & Classification Safety:** $G/H$ refuses construction whenever any $gH \neq Hg$, and FTFGAG classification is disabled for non-abelian groups.

---

## 6. Local Setup & Commands

```bash
# Install dependencies
npm install

# Run the automated mathematical & MCQ test suite
npm test

# Type-check with TypeScript
npm run lint

# Build production frontend bundle
npm run build

# Start development / full-stack Express + Vite server on port 3000
npm run dev
```

---

## 7. Environment Variables

Configure these optional variables in `.env` or your hosting environment:

- `GEMINI_API_KEY`: Enables live AI explanations in the server-side `/api/tutor` endpoint (falls back gracefully to built-in verified notes when unset).
- `ADMIN_PASSCODE`: Sets a server-side instructor passcode for the Teacher/Admin panel; if unset, AlgebraLab prompts for first-run instructor account registration stored with `scrypt` hashing in SQLite.
- `PORT`: HTTP server port (defaults to `3000`).
