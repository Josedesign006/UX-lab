// ---------- Core ----------

export type StudyType =
  | "card-sort"
  | "tree-test"
  | "first-click"
  | "survey"
  | "prototype"
  | "usability";

export type StudyStatus = "draft" | "live" | "closed";

export interface Study {
  id: string;
  type: StudyType;
  name: string;
  status: StudyStatus;
  /** owning user — studies are private to their owner */
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  welcomeMessage: string;
  instructions: string;
  thankYouMessage: string;
  /** Screener / demographic questions shown before the activity */
  preQuestions: Question[];
  /** Questions shown after the activity */
  postQuestions: Question[];
  config: StudyConfig;
}

export type StudyConfig =
  | CardSortConfig
  | TreeTestConfig
  | FirstClickConfig
  | SurveyConfig
  | PrototypeConfig
  | UsabilityConfig;

// ---------- Questions (shared by surveys / pre / post) ----------

export type QuestionType =
  | "short-text"
  | "long-text"
  | "single-choice"
  | "multi-choice"
  | "likert"
  | "rating"
  | "ranking"
  | "number";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options: string[]; // for choice / ranking
  scaleSize?: number; // likert (5/7) or rating (5/10)
  minLabel?: string;
  maxLabel?: string;
}

export interface Answer {
  questionId: string;
  /** text, number-as-string, selected option(s), or ranked order */
  value: string | string[] | number;
}

// ---------- Card sorting ----------

export type CardSortKind = "open" | "closed" | "hybrid";

export interface SortCard {
  id: string;
  label: string;
  description?: string;
}

export interface SortCategory {
  id: string;
  label: string;
}

export interface CardSortConfig {
  kind: "card-sort";
  sortType: CardSortKind;
  cards: SortCard[];
  categories: SortCategory[]; // used by closed & hybrid
  shuffleCards: boolean;
  requireAllCards: boolean;
}

export interface CardSortGroup {
  /** category id for closed/hybrid pre-made groups, otherwise null */
  categoryId: string | null;
  name: string;
  cardIds: string[];
}

export interface CardSortResult {
  groups: CardSortGroup[];
  unsortedCardIds: string[];
}

// ---------- Tree testing ----------

export interface TreeNode {
  id: string;
  label: string;
  /** if true, participants can select this node as their answer */
  children: TreeNode[];
}

export interface TreeTask {
  id: string;
  text: string;
  correctNodeIds: string[];
}

export interface TreeTestConfig {
  kind: "tree-test";
  tree: TreeNode[];
  tasks: TreeTask[];
  shuffleTasks: boolean;
}

export type TreeTaskOutcome =
  | "direct-success"
  | "indirect-success"
  | "direct-fail"
  | "indirect-fail"
  | "skipped";

export interface TreeTaskResult {
  taskId: string;
  /** node ids visited in order (including backtracking) */
  path: string[];
  /** final node chosen, null if skipped */
  answerNodeId: string | null;
  outcome: TreeTaskOutcome;
  timeMs: number;
  firstClickNodeId: string | null;
}

export interface TreeTestResult {
  tasks: TreeTaskResult[];
}

// ---------- First click ----------

export interface FirstClickTask {
  id: string;
  instruction: string;
  /** data-URL image */
  image: string;
}

export interface FirstClickConfig {
  kind: "first-click";
  tasks: FirstClickTask[];
}

export interface FirstClickTaskResult {
  taskId: string;
  /** normalized 0..1 relative to image */
  x: number;
  y: number;
  timeMs: number;
}

export interface FirstClickResult {
  tasks: FirstClickTaskResult[];
}

// ---------- Survey ----------

export interface SurveyConfig {
  kind: "survey";
  questions: Question[];
}

export interface SurveyResult {
  answers: Answer[];
}

// ---------- Prototype testing ----------

export interface Hotspot {
  id: string;
  /** normalized 0..1 */
  x: number;
  y: number;
  w: number;
  h: number;
  targetScreenId: string;
}

export interface PrototypeScreen {
  id: string;
  name: string;
  image: string; // data-URL
  hotspots: Hotspot[];
}

export interface PrototypeTask {
  id: string;
  text: string;
  startScreenId: string;
  goalScreenIds: string[];
}

export interface PrototypeConfig {
  kind: "prototype";
  screens: PrototypeScreen[];
  tasks: PrototypeTask[];
}

export interface PrototypeClick {
  screenId: string;
  x: number;
  y: number;
  hitHotspot: boolean;
  timeMs: number; // since task start
}

export interface PrototypeTaskResult {
  taskId: string;
  clicks: PrototypeClick[];
  screenPath: string[];
  outcome: "success" | "gave-up";
  timeMs: number;
}

export interface PrototypeResult {
  tasks: PrototypeTaskResult[];
}

// ---------- Usability testing (unmoderated, task based) ----------

export interface UsabilityTask {
  id: string;
  text: string;
  /** optional site / prototype URL the participant opens */
  url?: string;
}

export interface UsabilityConfig {
  kind: "usability";
  tasks: UsabilityTask[];
  askDifficulty: boolean; // single ease question (SEQ) per task
  askComment: boolean;
}

export interface UsabilityTaskResult {
  taskId: string;
  completion: "success" | "partial" | "fail" | "skipped";
  /** 1 (very difficult) .. 7 (very easy) */
  difficulty: number | null;
  comment: string;
  timeMs: number;
}

export interface UsabilityResult {
  tasks: UsabilityTaskResult[];
}

// ---------- Responses ----------

export type ResultData =
  | CardSortResult
  | TreeTestResult
  | FirstClickResult
  | SurveyResult
  | PrototypeResult
  | UsabilityResult;

export interface StudyResponse {
  id: string;
  studyId: string;
  participant: string; // anonymous id like P1, P2...
  startedAt: string;
  completedAt: string;
  durationMs: number;
  preAnswers: Answer[];
  postAnswers: Answer[];
  data: ResultData;
}

export const STUDY_TYPE_META: Record<
  StudyType,
  { label: string; tagline: string; emoji: string }
> = {
  "card-sort": {
    label: "Card Sorting",
    tagline: "Learn how people group and label your content",
    emoji: "🗂️",
  },
  "tree-test": {
    label: "Tree Testing",
    tagline: "Validate findability in your site structure",
    emoji: "🌳",
  },
  "first-click": {
    label: "First-Click Testing",
    tagline: "See where people click first on a design",
    emoji: "🎯",
  },
  survey: {
    label: "Survey",
    tagline: "Ask questions, collect quantitative & qualitative answers",
    emoji: "📋",
  },
  prototype: {
    label: "Prototype Testing",
    tagline: "Test task flows on clickable screens",
    emoji: "📱",
  },
  usability: {
    label: "Usability Testing",
    tagline: "Task-based testing of a live site or app",
    emoji: "🧪",
  },
};
