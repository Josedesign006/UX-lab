import {
  CardSortConfig,
  CardSortResult,
  CognitiveWalkthroughConfig,
  CognitiveWalkthroughResult,
  CWDimension,
  CWQuestionDef,
  CWStep,
  CWTask,
  CWVerdict,
  StudyResponse,
  TreeNode,
  TreeTestConfig,
  TreeTaskResult,
} from "./types";

// ============ Card sort analysis ============

/**
 * Pairwise similarity: % of participants who placed the two cards
 * in the same group. Returned as matrix[i][j] in 0..100 following
 * the order of `cardIds`.
 */
export function similarityMatrix(
  cardIds: string[],
  results: CardSortResult[]
): number[][] {
  const n = cardIds.length;
  const together = Array.from({ length: n }, () => new Array(n).fill(0));
  const both = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const r of results) {
    const groupOf = new Map<string, number>();
    r.groups.forEach((g, gi) => g.cardIds.forEach((c) => groupOf.set(c, gi)));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const gi = groupOf.get(cardIds[i]);
        const gj = groupOf.get(cardIds[j]);
        if (gi === undefined || gj === undefined) continue;
        both[i][j]++;
        if (gi === gj) together[i][j]++;
      }
    }
  }

  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    m[i][i] = 100;
    for (let j = i + 1; j < n; j++) {
      const v = both[i][j] ? Math.round((100 * together[i][j]) / both[i][j]) : 0;
      m[i][j] = v;
      m[j][i] = v;
    }
  }
  return m;
}

export interface DendroNode {
  /** leaf: card index; internal: null */
  cardIndex: number | null;
  /** similarity (0..100) at which the children merged */
  height: number;
  children: DendroNode[];
  /** all leaf indices under this node */
  leaves: number[];
}

/**
 * Average-linkage agglomerative clustering over the similarity matrix.
 * Heights are similarity percentages (100 = always together).
 */
export function buildDendrogram(matrix: number[][]): DendroNode | null {
  const n = matrix.length;
  if (n === 0) return null;

  let clusters: DendroNode[] = Array.from({ length: n }, (_, i) => ({
    cardIndex: i,
    height: 100,
    children: [],
    leaves: [i],
  }));

  // average similarity between two clusters
  const sim = (a: DendroNode, b: DendroNode) => {
    let total = 0;
    let count = 0;
    for (const i of a.leaves)
      for (const j of b.leaves) {
        total += matrix[i][j];
        count++;
      }
    return count ? total / count : 0;
  };

  while (clusters.length > 1) {
    let bi = 0,
      bj = 1,
      best = -1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const s = sim(clusters[i], clusters[j]);
        if (s > best) {
          best = s;
          bi = i;
          bj = j;
        }
      }
    }
    const merged: DendroNode = {
      cardIndex: null,
      height: best,
      children: [clusters[bi], clusters[bj]],
      leaves: [...clusters[bi].leaves, ...clusters[bj].leaves],
    };
    clusters = clusters.filter((_, k) => k !== bi && k !== bj);
    clusters.push(merged);
  }
  return clusters[0];
}

/**
 * Actual Agreement Method (AAM) dendrogram, as popularized by Optimal
 * Workshop: a cluster's height is the % of participants whose sort contains a
 * single group covering EVERY card in the cluster. Conservative — shows only
 * agreement that literally happened.
 */
export function buildDendrogramAAM(
  cardIds: string[],
  results: CardSortResult[]
): DendroNode | null {
  const n = cardIds.length;
  if (n === 0) return null;
  const idx = new Map(cardIds.map((c, i) => [c, i]));
  const partGroups: Set<number>[][] = results.map((r) =>
    r.groups.map(
      (g) =>
        new Set(
          g.cardIds
            .map((c) => idx.get(c))
            .filter((x): x is number => x !== undefined)
        )
    )
  );

  const agreement = (leaves: number[]) => {
    if (!results.length) return 0;
    let count = 0;
    for (const groups of partGroups) {
      if (groups.some((g) => leaves.every((l) => g.has(l)))) count++;
    }
    return (100 * count) / results.length;
  };

  let clusters: DendroNode[] = cardIds.map((_, i) => ({
    cardIndex: i,
    height: 100,
    children: [],
    leaves: [i],
  }));

  while (clusters.length > 1) {
    let bi = 0,
      bj = 1,
      best = -1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const s = agreement([...clusters[i].leaves, ...clusters[j].leaves]);
        if (s > best) {
          best = s;
          bi = i;
          bj = j;
        }
      }
    }
    const merged: DendroNode = {
      cardIndex: null,
      height: best,
      children: [clusters[bi], clusters[bj]],
      leaves: [...clusters[bi].leaves, ...clusters[bj].leaves],
    };
    clusters = clusters.filter((_, k) => k !== bi && k !== bj);
    clusters.push(merged);
  }
  return clusters[0];
}

/**
 * Classical MDS (principal coordinates) projection of the similarity matrix
 * into 2D — cards that were often grouped together appear close.
 * Returns coordinates normalized to 0..1.
 */
export function mdsProjection(matrix: number[][]): { x: number; y: number }[] {
  const n = matrix.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: 0.5, y: 0.5 }];

  const D2 = matrix.map((row) =>
    row.map((v) => {
      const d = (100 - v) / 100;
      return d * d;
    })
  );
  const rowMean = D2.map((r) => r.reduce((a, b) => a + b, 0) / n);
  const totalMean = rowMean.reduce((a, b) => a + b, 0) / n;
  const B = Array.from({ length: n }, (_, i) =>
    Array.from(
      { length: n },
      (_, j) => -0.5 * (D2[i][j] - rowMean[i] - rowMean[j] + totalMean)
    )
  );

  const powerIter = (mat: number[][]) => {
    let v = Array.from({ length: n }, (_, i) => Math.cos(i * 1.7) + 0.31);
    for (let it = 0; it < 300; it++) {
      const w = mat.map((row) => row.reduce((a, b, j) => a + b * v[j], 0));
      const norm = Math.sqrt(w.reduce((a, b) => a + b * b, 0)) || 1;
      v = w.map((x) => x / norm);
    }
    const Bv = mat.map((row) => row.reduce((a, b, j) => a + b * v[j], 0));
    const val = v.reduce((a, b, i) => a + b * Bv[i], 0);
    return { vec: v, val };
  };

  const e1 = powerIter(B);
  const B2 = B.map((row, i) =>
    row.map((x, j) => x - e1.val * e1.vec[i] * e1.vec[j])
  );
  const e2 = powerIter(B2);

  const xs = e1.vec.map((v) => v * Math.sqrt(Math.max(e1.val, 0)));
  const ys = e2.vec.map((v) => v * Math.sqrt(Math.max(e2.val, 0)));
  const norm = (arr: number[]) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const span = max - min || 1;
    return arr.map((v) => (v - min) / span);
  };
  const nx = norm(xs);
  const ny = norm(ys);
  return nx.map((x, i) => ({ x, y: ny[i] }));
}

export interface CardStat {
  cardId: string;
  /** distinct (normalized) category labels this card was placed under */
  categoriesUsed: number;
  /** times the card was sorted at all */
  timesSorted: number;
  top: { label: string; count: number }[];
}

/** Per-card placement summary across all participants. */
export function cardStats(
  cardIds: string[],
  results: CardSortResult[]
): CardStat[] {
  return cardIds.map((cardId) => {
    const labelCounts = new Map<string, { label: string; count: number }>();
    let timesSorted = 0;
    for (const r of results) {
      for (const g of r.groups) {
        if (!g.cardIds.includes(cardId)) continue;
        timesSorted++;
        const key = normLabel(g.name || "(unnamed)");
        const e = labelCounts.get(key) ?? { label: g.name || "(unnamed)", count: 0 };
        e.count++;
        labelCounts.set(key, e);
      }
    }
    const top = [...labelCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return { cardId, categoriesUsed: labelCounts.size, timesSorted, top };
  });
}

/** Order of leaves produced by the dendrogram — used to sort the matrix. */
export function dendroLeafOrder(root: DendroNode | null): number[] {
  if (!root) return [];
  const out: number[] = [];
  const walk = (n: DendroNode) => {
    if (n.cardIndex !== null) out.push(n.cardIndex);
    n.children.forEach(walk);
  };
  walk(root);
  return out;
}

/** Normalize a participant-created group label for merging. */
function normLabel(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface CategorySummary {
  label: string;
  /** times this label (normalized) was used */
  uses: number;
  /** cardId -> times placed under this label */
  cardCounts: Map<string, number>;
}

/** Group label summary across participants (for open / hybrid sorts). */
export function categorySummaries(results: CardSortResult[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();
  for (const r of results) {
    for (const g of r.groups) {
      if (!g.cardIds.length) continue;
      const key = normLabel(g.name || "(unnamed)");
      let entry = map.get(key);
      if (!entry) {
        entry = { label: g.name || "(unnamed)", uses: 0, cardCounts: new Map() };
        map.set(key, entry);
      }
      entry.uses++;
      for (const c of g.cardIds) {
        entry.cardCounts.set(c, (entry.cardCounts.get(c) ?? 0) + 1);
      }
    }
  }
  return [...map.values()].sort((a, b) => b.uses - a.uses);
}

/** For closed sorts: matrix of card -> category placement counts. */
export function placementMatrix(
  config: CardSortConfig,
  results: CardSortResult[]
): Map<string, Map<string, number>> {
  const m = new Map<string, Map<string, number>>();
  for (const card of config.cards) m.set(card.id, new Map());
  for (const r of results) {
    for (const g of r.groups) {
      if (!g.categoryId) continue;
      for (const c of g.cardIds) {
        const row = m.get(c);
        if (row) row.set(g.categoryId, (row.get(g.categoryId) ?? 0) + 1);
      }
    }
  }
  return m;
}

// ============ Tree test analysis ============

export function flattenTree(
  nodes: TreeNode[],
  depth = 0,
  parentPath: string[] = []
): { node: TreeNode; depth: number; path: string[]; isLeaf: boolean }[] {
  const out: { node: TreeNode; depth: number; path: string[]; isLeaf: boolean }[] =
    [];
  for (const n of nodes) {
    const path = [...parentPath, n.id];
    out.push({ node: n, depth, path, isLeaf: n.children.length === 0 });
    out.push(...flattenTree(n.children, depth + 1, path));
  }
  return out;
}

export function nodeLabelMap(nodes: TreeNode[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of flattenTree(nodes)) m.set(f.node.id, f.node.label);
  return m;
}

/** Full breadcrumb label for a node id. */
export function nodePathLabel(tree: TreeNode[], nodeId: string): string {
  const flat = flattenTree(tree);
  const f = flat.find((x) => x.node.id === nodeId);
  if (!f) return "(removed)";
  const labels = nodeLabelMap(tree);
  return f.path.map((id) => labels.get(id) ?? "?").join(" › ");
}

export interface TreeTaskStats {
  taskId: string;
  n: number;
  successRate: number; // 0..100
  directnessRate: number; // 0..100 (no backtracking)
  directSuccessRate: number;
  medianTimeMs: number;
  /** answer nodeId -> count */
  destinations: Map<string, number>;
  /** first clicked top-level nodeId -> count */
  firstClicks: Map<string, number>;
  skipped: number;
}

export function treeTaskStats(
  config: TreeTestConfig,
  taskResults: TreeTaskResult[]
): Map<string, TreeTaskStats> {
  const out = new Map<string, TreeTaskStats>();
  for (const task of config.tasks) {
    const rs = taskResults.filter((t) => t.taskId === task.id);
    const answered = rs.filter((t) => t.outcome !== "skipped");
    const success = answered.filter(
      (t) => t.outcome === "direct-success" || t.outcome === "indirect-success"
    );
    const direct = answered.filter(
      (t) => t.outcome === "direct-success" || t.outcome === "direct-fail"
    );
    const directSuccess = answered.filter((t) => t.outcome === "direct-success");
    const times = answered.map((t) => t.timeMs).sort((a, b) => a - b);
    const destinations = new Map<string, number>();
    const firstClicks = new Map<string, number>();
    for (const t of answered) {
      if (t.answerNodeId)
        destinations.set(t.answerNodeId, (destinations.get(t.answerNodeId) ?? 0) + 1);
      if (t.firstClickNodeId)
        firstClicks.set(
          t.firstClickNodeId,
          (firstClicks.get(t.firstClickNodeId) ?? 0) + 1
        );
    }
    out.set(task.id, {
      taskId: task.id,
      n: rs.length,
      successRate: answered.length
        ? Math.round((100 * success.length) / answered.length)
        : 0,
      directnessRate: answered.length
        ? Math.round((100 * direct.length) / answered.length)
        : 0,
      directSuccessRate: answered.length
        ? Math.round((100 * directSuccess.length) / answered.length)
        : 0,
      medianTimeMs: times.length ? times[Math.floor(times.length / 2)] : 0,
      destinations,
      firstClicks,
      skipped: rs.length - answered.length,
    });
  }
  return out;
}

/** # of participants whose path visited each node (for pietree). */
export function pathVisitCounts(taskResults: TreeTaskResult[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of taskResults) {
    const seen = new Set(t.path);
    seen.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
  }
  return m;
}

// ============ Cognitive walkthrough analysis ============

/**
 * Research-grounded reference for the four cognitive-walkthrough dimensions
 * (Wharton et al., 1994). `redesign` names the design lever that typically
 * fixes a failure on that dimension — this is what turns a "no" into advice.
 */
export const CW_DIMENSION_META: Record<
  CWDimension,
  { label: string; short: string; blurb: string; redesign: string; color: string }
> = {
  goal: {
    label: "Goal formation",
    short: "Right goal",
    blurb:
      "Will the user even try the correct action? Failures mean the interface doesn't prompt the right sub-goal — users don't know this step is what they should do next.",
    redesign:
      "Set expectations & guidance — onboarding, clearer information scent, prompts, or removing steps the user wouldn't think to take.",
    color: "#6366f1",
  },
  visibility: {
    label: "Control visibility",
    short: "Noticed",
    blurb:
      "Will the user notice the correct control exists? Failures mean the action is hidden, buried, or visually lost (low discoverability).",
    redesign:
      "Increase salience — surface the control, improve contrast/placement, reduce clutter, or avoid hover-only / off-screen affordances.",
    color: "#0ea5e9",
  },
  match: {
    label: "Action–goal match",
    short: "Recognised",
    blurb:
      "Once seen, will the user recognise this control as the right one? Failures mean labels, icons, or wording don't match the user's mental model.",
    redesign:
      "Fix labels & affordances — use the user's words, clearer icons, descriptive link text, and avoid jargon or ambiguous calls-to-action.",
    color: "#f59e0b",
  },
  feedback: {
    label: "Feedback",
    short: "Progress shown",
    blurb:
      "After acting, will the user see they made progress? Failures mean missing, delayed, or unclear system feedback after the action.",
    redesign:
      "Confirm progress — visible state changes, success messages, loading indicators, and clear next-step cues after each action.",
    color: "#10b981",
  },
};

export interface CWVerdictCounts {
  yes: number;
  no: number;
  unsure: number;
}

export function cwTally(verdicts: CWVerdict[]): CWVerdictCounts {
  const c: CWVerdictCounts = { yes: 0, no: 0, unsure: 0 };
  for (const v of verdicts) c[v]++;
  return c;
}

/** Pass score 0..100: yes = 1, unsure = 0.5, no = 0. */
export function cwScore(c: CWVerdictCounts): number {
  const total = c.yes + c.no + c.unsure;
  if (!total) return 0;
  return Math.round((100 * (c.yes + 0.5 * c.unsure)) / total);
}

/** A "no" is a hard breakdown; "unsure" is a soft one. */
function isProblem(v: CWVerdict): boolean {
  return v === "no" || v === "unsure";
}

export interface CWStepAgg {
  task: CWTask;
  step: CWStep;
  /** 1-based index of the step within its task */
  stepIndex: number;
  evaluators: number;
  byQuestion: { def: CWQuestionDef; counts: CWVerdictCounts; passRate: number }[];
  /** overall pass rate across every question asked at this step (0..100) */
  passRate: number;
  /** evaluators who flagged at least one problem (no/unsure) here */
  problemFlags: number;
  problemRate: number; // 0..100
  /** how strongly evaluators agree on the verdict (0..100) — reliability cue */
  agreement: number;
  avgSeverity: number | null;
  maxSeverity: number | null;
  failureStories: string[];
  /** the dimension that fails most at this step, if any */
  weakestDimension: CWDimension | null;
}

/** Per-step aggregation, flattened across tasks in author order. */
export function cwStepStats(
  config: CognitiveWalkthroughConfig,
  results: CognitiveWalkthroughResult[]
): CWStepAgg[] {
  const qById = new Map(config.questions.map((q) => [q.id, q]));
  const out: CWStepAgg[] = [];

  for (const task of config.tasks) {
    task.steps.forEach((step, si) => {
      // collect this step's results across evaluators
      const stepResults = results
        .flatMap((r) => r.tasks)
        .filter((t) => t.taskId === task.id)
        .flatMap((t) => t.steps)
        .filter((s) => s.stepId === step.id);

      const evaluators = stepResults.length;
      const byQuestion = config.questions.map((def) => {
        const verdicts = stepResults
          .map((s) => s.answers.find((a) => a.questionId === def.id)?.verdict)
          .filter((v): v is CWVerdict => !!v);
        const counts = cwTally(verdicts);
        return { def, counts, passRate: cwScore(counts) };
      });

      const allVerdicts = stepResults.flatMap((s) =>
        s.answers.filter((a) => qById.has(a.questionId)).map((a) => a.verdict)
      );
      const overall = cwTally(allVerdicts);

      const problemFlags = stepResults.filter((s) =>
        s.answers.some((a) => isProblem(a.verdict))
      ).length;

      // agreement: share of evaluators on the majority side (problem vs clean)
      const clean = evaluators - problemFlags;
      const agreement = evaluators
        ? Math.round((100 * Math.max(problemFlags, clean)) / evaluators)
        : 0;

      const sevs = stepResults
        .map((s) => s.severity)
        .filter((s): s is number => s !== null && s > 0);

      // weakest dimension = lowest pass rate among asked questions (if < 100)
      let weakestDimension: CWDimension | null = null;
      let worst = 101;
      for (const q of byQuestion) {
        if (q.counts.yes + q.counts.no + q.counts.unsure === 0) continue;
        if (q.passRate < worst) {
          worst = q.passRate;
          weakestDimension = q.def.dimension;
        }
      }
      if (worst >= 100) weakestDimension = null;

      out.push({
        task,
        step,
        stepIndex: si + 1,
        evaluators,
        byQuestion,
        passRate: cwScore(overall),
        problemFlags,
        problemRate: evaluators
          ? Math.round((100 * problemFlags) / evaluators)
          : 0,
        agreement,
        avgSeverity: sevs.length ? mean(sevs) : null,
        maxSeverity: sevs.length ? Math.max(...sevs) : null,
        failureStories: stepResults
          .map((s) => s.failureStory.trim())
          .filter(Boolean),
        weakestDimension,
      });
    });
  }
  return out;
}

export interface CWDimensionStat {
  dimension: CWDimension;
  counts: CWVerdictCounts;
  passRate: number;
  judgments: number;
}

/** Aggregate pass rate per cognitive dimension across all steps & evaluators. */
export function cwDimensionStats(
  config: CognitiveWalkthroughConfig,
  results: CognitiveWalkthroughResult[]
): CWDimensionStat[] {
  const dims: CWDimension[] = ["goal", "visibility", "match", "feedback"];
  const qDim = new Map(config.questions.map((q) => [q.id, q.dimension]));
  const buckets = new Map<CWDimension, CWVerdict[]>(dims.map((d) => [d, []]));

  for (const r of results)
    for (const t of r.tasks)
      for (const s of t.steps)
        for (const a of s.answers) {
          const d = qDim.get(a.questionId);
          if (d) buckets.get(d)!.push(a.verdict);
        }

  return dims
    .map((dimension) => {
      const counts = cwTally(buckets.get(dimension)!);
      return {
        dimension,
        counts,
        passRate: cwScore(counts),
        judgments: counts.yes + counts.no + counts.unsure,
      };
    })
    .filter((d) => d.judgments > 0 || config.questions.some((q) => q.dimension === d.dimension));
}

export interface CWTaskStat {
  task: CWTask;
  passRate: number;
  totalSteps: number;
  problemSteps: number; // steps where ≥1 evaluator flagged a problem
  evaluators: number;
}

export function cwTaskStats(
  config: CognitiveWalkthroughConfig,
  results: CognitiveWalkthroughResult[]
): CWTaskStat[] {
  const stepStats = cwStepStats(config, results);
  return config.tasks.map((task) => {
    const steps = stepStats.filter((s) => s.task.id === task.id);
    const scored = steps.filter((s) => s.evaluators > 0);
    return {
      task,
      passRate: scored.length ? Math.round(mean(scored.map((s) => s.passRate))) : 0,
      totalSteps: task.steps.length,
      problemSteps: steps.filter((s) => s.problemFlags > 0).length,
      evaluators: Math.max(0, ...steps.map((s) => s.evaluators)),
    };
  });
}

/** Overall learnability: mean pass rate across every judgment collected. */
export function cwOverallScore(
  config: CognitiveWalkthroughConfig,
  results: CognitiveWalkthroughResult[]
): number {
  const all: CWVerdict[] = [];
  for (const r of results)
    for (const t of r.tasks)
      for (const s of t.steps) for (const a of s.answers) all.push(a.verdict);
  return cwScore(cwTally(all));
}

// ============ Generic stats ============

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export function completionStats(responses: StudyResponse[]) {
  return {
    n: responses.length,
    medianDuration: median(responses.map((r) => r.durationMs)),
  };
}
