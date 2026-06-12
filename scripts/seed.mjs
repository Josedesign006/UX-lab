// Seeds data/db.json with demo studies + responses so analysis views have data.
// Run: node scripts/seed.mjs
import crypto from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// demo account: demo@uxlab.studio / demo1234 (scrypt-hashed, like the app does)
const DEMO_EMAIL = "demo@uxlab.studio";
const DEMO_PASSWORD = "demo1234";
const salt = crypto.randomBytes(16);
const demoUser = {
  id: "u-demo",
  email: DEMO_EMAIL,
  passwordHash:
    salt.toString("hex") +
    ":" +
    crypto.scryptSync(DEMO_PASSWORD, salt, 64).toString("hex"),
  createdAt: new Date().toISOString(),
};

const now = Date.now();
const iso = (msAgo) => new Date(now - msAgo).toISOString();
let n = 0;
const uid = (p) => p + (++n).toString(36).padStart(4, "0");

// ---------- Card sort study ----------
const cards = [
  "Apples", "Bananas", "Carrots", "Potatoes",
  "Milk", "Cheese", "Yogurt",
  "Bread", "Croissants",
  "Chicken", "Beef", "Salmon",
].map((label) => ({ id: uid("c"), label }));
const cardId = Object.fromEntries(cards.map((c) => [c.label, c.id]));

const cardSort = {
  id: "demo-cardsort",
  type: "card-sort",
  name: "Grocery store categories (demo)",
  status: "live",
  createdAt: iso(86400e3 * 6),
  updatedAt: iso(3600e3),
  welcomeMessage:
    "Welcome! We're exploring how shoppers expect groceries to be organized. Drag each card into groups that make sense to you, and name your groups.",
  instructions: "",
  thankYouMessage: "All done — thank you for your time!",
  preQuestions: [
    {
      id: "preq1",
      type: "single-choice",
      text: "How often do you shop for groceries online?",
      required: true,
      options: ["Weekly", "Monthly", "Rarely", "Never"],
    },
  ],
  postQuestions: [
    {
      id: "postq1",
      type: "likert",
      text: "This sorting activity was easy to complete.",
      required: false,
      options: [],
      scaleSize: 5,
      minLabel: "Strongly disagree",
      maxLabel: "Strongly agree",
    },
  ],
  config: {
    kind: "card-sort",
    sortType: "open",
    cards,
    categories: [],
    shuffleCards: true,
    requireAllCards: true,
  },
};

// typical participant groupings, with variation
const sortPatterns = [
  { Fruit: ["Apples", "Bananas"], Vegetables: ["Carrots", "Potatoes"], Dairy: ["Milk", "Cheese", "Yogurt"], Bakery: ["Bread", "Croissants"], "Meat & Fish": ["Chicken", "Beef", "Salmon"] },
  { "Fruit & Veg": ["Apples", "Bananas", "Carrots", "Potatoes"], Dairy: ["Milk", "Cheese", "Yogurt"], Bakery: ["Bread", "Croissants"], Meat: ["Chicken", "Beef"], Fish: ["Salmon"] },
  { Produce: ["Apples", "Bananas", "Carrots", "Potatoes"], "Dairy & Eggs": ["Milk", "Cheese", "Yogurt"], Bakery: ["Bread", "Croissants"], Protein: ["Chicken", "Beef", "Salmon"] },
  { fruit: ["Apples", "Bananas"], veggies: ["Carrots", "Potatoes"], dairy: ["Milk", "Yogurt", "Cheese"], bread: ["Bread", "Croissants"], meat: ["Chicken", "Beef", "Salmon"] },
  { "Fresh produce": ["Apples", "Bananas", "Carrots", "Potatoes"], Dairy: ["Milk", "Cheese", "Yogurt"], "Bakery items": ["Croissants", "Bread"], "Meat counter": ["Beef", "Chicken"], Seafood: ["Salmon"] },
  { Fruit: ["Apples", "Bananas"], Vegetables: ["Potatoes", "Carrots"], Dairy: ["Milk", "Cheese", "Yogurt"], Breakfast: ["Bread", "Croissants", "Yogurt"], Dinner: ["Chicken", "Beef", "Salmon"] },
  { Produce: ["Apples", "Bananas", "Carrots"], Pantry: ["Potatoes", "Bread"], Dairy: ["Milk", "Cheese", "Yogurt"], Bakery: ["Croissants"], "Meat & seafood": ["Chicken", "Beef", "Salmon"] },
  { Fruits: ["Apples", "Bananas"], Vegetables: ["Carrots", "Potatoes"], "Milk products": ["Milk", "Cheese", "Yogurt"], Bakery: ["Bread", "Croissants"], "Meat & fish": ["Chicken", "Beef", "Salmon"] },
];

const cardSortResponses = sortPatterns.map((pattern, i) => {
  const used = new Set();
  const groups = Object.entries(pattern).map(([name, labels]) => ({
    categoryId: null,
    name,
    cardIds: labels.filter((l) => !used.has(l) && used.add(l)).map((l) => cardId[l]),
  }));
  const unsorted = cards.filter((c) => !used.has(c.label)).map((c) => c.id);
  return {
    id: uid("r"),
    studyId: "demo-cardsort",
    participant: "P" + (i + 1),
    startedAt: iso(86400e3 * (5 - i * 0.5)),
    completedAt: iso(86400e3 * (5 - i * 0.5) - 300e3),
    durationMs: 180e3 + Math.round(i * 37e3 % 200e3),
    preAnswers: [
      { questionId: "preq1", value: ["Weekly", "Monthly", "Rarely", "Weekly"][i % 4] },
    ],
    postAnswers: [{ questionId: "postq1", value: (i % 2) + 4 }],
    data: { groups, unsortedCardIds: unsorted },
  };
});

// ---------- Tree test study ----------
const t = {};
const node = (key, label, children = []) => {
  const nd = { id: uid("n"), label, children };
  t[key] = nd;
  return nd;
};
const tree = [
  node("shop", "Shop", [
    node("electronics", "Electronics", [
      node("laptops", "Laptops", []),
      node("phones", "Phones", []),
    ]),
    node("clothing", "Clothing", [
      node("mens", "Men's", []),
      node("womens", "Women's", []),
    ]),
  ]),
  node("support", "Support", [
    node("contact", "Contact us", []),
    node("returns", "Returns & refunds", []),
    node("faq", "FAQ", []),
  ]),
  node("account", "My account", [
    node("orders", "Order history", []),
    node("settings", "Settings", []),
  ]),
];

const treeTasks = [
  { id: "tt1", text: "You bought a jacket that doesn't fit. Find where to return it.", correctNodeIds: [t.returns.id] },
  { id: "tt2", text: "Find where you would track an order you placed last week.", correctNodeIds: [t.orders.id] },
];

const treeTest = {
  id: "demo-treetest",
  type: "tree-test",
  name: "E-commerce navigation (demo)",
  status: "live",
  createdAt: iso(86400e3 * 4),
  updatedAt: iso(7200e3),
  welcomeMessage:
    "Thanks for helping us test our site structure! You'll get a few short find-it tasks.",
  instructions: "",
  thankYouMessage: "That's it — thank you!",
  preQuestions: [],
  postQuestions: [],
  config: { kind: "tree-test", tree, tasks: treeTasks, shuffleTasks: false },
};

const tt = (taskId, path, answerKey, outcome, timeMs) => ({
  taskId,
  path: path.map((k) => t[k].id),
  answerNodeId: answerKey ? t[answerKey].id : null,
  outcome,
  timeMs,
  firstClickNodeId: path.length ? t[path[0]].id : null,
});

const treeResponses = [
  [tt("tt1", ["support", "returns"], "returns", "direct-success", 9200), tt("tt2", ["account", "orders"], "orders", "direct-success", 7400)],
  [tt("tt1", ["shop", "clothing", "support", "returns"], "returns", "indirect-success", 21800), tt("tt2", ["account", "orders"], "orders", "direct-success", 6900)],
  [tt("tt1", ["support", "contact"], "contact", "direct-fail", 11400), tt("tt2", ["shop", "account", "orders"], "orders", "indirect-success", 15200)],
  [tt("tt1", ["support", "returns"], "returns", "direct-success", 8100), tt("tt2", ["account", "settings"], "settings", "direct-fail", 12600)],
  [tt("tt1", ["support", "faq", "support", "returns"], "returns", "indirect-success", 19400), tt("tt2", ["account", "orders"], "orders", "direct-success", 5800)],
  [tt("tt1", ["support", "returns"], "returns", "direct-success", 7700), tt("tt2", [], null, "skipped", 4100)],
].map((tasks, i) => ({
  id: uid("r"),
  studyId: "demo-treetest",
  participant: "P" + (i + 1),
  startedAt: iso(86400e3 * (3 - i * 0.4)),
  completedAt: iso(86400e3 * (3 - i * 0.4) - 120e3),
  durationMs: tasks.reduce((a, x) => a + x.timeMs, 0) + 30e3,
  preAnswers: [],
  postAnswers: [],
  data: { tasks },
}));

// ---------- First-click study ----------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700">
<rect width="1200" height="700" fill="#f8fafc"/>
<rect width="1200" height="64" fill="#1e293b"/>
<text x="40" y="40" font-family="Helvetica" font-size="22" fill="white" font-weight="bold">acme.store</text>
<text x="760" y="40" font-family="Helvetica" font-size="15" fill="#cbd5e1">Products</text>
<text x="860" y="40" font-family="Helvetica" font-size="15" fill="#cbd5e1">Pricing</text>
<text x="950" y="40" font-family="Helvetica" font-size="15" fill="#cbd5e1">Support</text>
<rect x="1040" y="14" width="120" height="36" rx="8" fill="#6366f1"/>
<text x="1062" y="38" font-family="Helvetica" font-size="15" fill="white">Sign in</text>
<text x="80" y="180" font-family="Helvetica" font-size="40" fill="#0f172a" font-weight="bold">Everything your team needs</text>
<text x="80" y="220" font-family="Helvetica" font-size="18" fill="#475569">One platform for projects, docs and chat.</text>
<rect x="80" y="260" width="160" height="48" rx="10" fill="#16a34a"/>
<text x="113" y="291" font-family="Helvetica" font-size="17" fill="white">Try free</text>
<rect x="80" y="380" width="320" height="220" rx="14" fill="white" stroke="#e2e8f0"/>
<rect x="440" y="380" width="320" height="220" rx="14" fill="white" stroke="#e2e8f0"/>
<rect x="800" y="380" width="320" height="220" rx="14" fill="white" stroke="#e2e8f0"/>
<text x="100" y="420" font-family="Helvetica" font-size="18" fill="#0f172a" font-weight="bold">Projects</text>
<text x="460" y="420" font-family="Helvetica" font-size="18" fill="#0f172a" font-weight="bold">Docs</text>
<text x="820" y="420" font-family="Helvetica" font-size="18" fill="#0f172a" font-weight="bold">Chat</text>
</svg>`;
const dataUrl = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

const firstClick = {
  id: "demo-firstclick",
  type: "first-click",
  name: "Landing page first-click (demo)",
  status: "live",
  createdAt: iso(86400e3 * 2),
  updatedAt: iso(1800e3),
  welcomeMessage: "You'll see a design and a task — click where you'd click first.",
  instructions: "",
  thankYouMessage: "Thanks for taking part!",
  preQuestions: [],
  postQuestions: [],
  config: {
    kind: "first-click",
    tasks: [
      { id: "fc1", instruction: "Where would you click to get help from support?", image: dataUrl },
      { id: "fc2", instruction: "Where would you click to start a free trial?", image: dataUrl },
    ],
  },
};

const jitter = (v, r) => v + (Math.random() - 0.5) * r;
const fcResponses = Array.from({ length: 9 }, (_, i) => ({
  id: uid("r"),
  studyId: "demo-firstclick",
  participant: "P" + (i + 1),
  startedAt: iso(86400e3 - i * 3600e3),
  completedAt: iso(86400e3 - i * 3600e3 - 60e3),
  durationMs: 45e3 + i * 5e3,
  preAnswers: [],
  postAnswers: [],
  data: {
    tasks: [
      // most click "Support" in nav, a couple click Chat card
      i < 7
        ? { taskId: "fc1", x: jitter(0.81, 0.03), y: jitter(0.05, 0.02), timeMs: 2400 + i * 600 }
        : { taskId: "fc1", x: jitter(0.7, 0.05), y: jitter(0.6, 0.04), timeMs: 5200 + i * 400 },
      // most click "Try free", some click Sign in
      i < 6
        ? { taskId: "fc2", x: jitter(0.13, 0.03), y: jitter(0.405, 0.02), timeMs: 1900 + i * 500 }
        : { taskId: "fc2", x: jitter(0.916, 0.02), y: jitter(0.046, 0.015), timeMs: 4300 + i * 300 },
    ],
  },
}));

// ---------- Survey study ----------
const survey = {
  id: "demo-survey",
  type: "survey",
  name: "Onboarding satisfaction survey (demo)",
  status: "live",
  createdAt: iso(86400e3 * 3),
  updatedAt: iso(900e3),
  welcomeMessage: "A quick 2-minute survey about your onboarding experience.",
  instructions: "",
  thankYouMessage: "Thanks — your feedback shapes what we build next!",
  preQuestions: [],
  postQuestions: [],
  config: {
    kind: "survey",
    questions: [
      { id: "sq1", type: "rating", text: "How satisfied are you with the onboarding experience?", required: true, options: [], scaleSize: 5, minLabel: "Very unsatisfied", maxLabel: "Very satisfied" },
      { id: "sq2", type: "single-choice", text: "Which part was most confusing?", required: false, options: ["Creating an account", "Setting up a project", "Inviting teammates", "Nothing was confusing"] },
      { id: "sq3", type: "long-text", text: "What's one thing we could improve?", required: false, options: [] },
    ],
  },
};

const surveyAnswers = [
  [4, "Inviting teammates", "Make the invite flow clearer — I couldn't find it."],
  [5, "Nothing was confusing", "Loved it. Maybe add keyboard shortcuts docs."],
  [3, "Setting up a project", "Too many steps before I saw any value."],
  [4, "Setting up a project", "Templates would help a lot."],
  [2, "Creating an account", "SSO kept failing on the first try."],
  [5, "Nothing was confusing", ""],
  [4, "Inviting teammates", "Bulk invite via CSV please."],
];
const surveyResponses = surveyAnswers.map(([rating, choice, text], i) => ({
  id: uid("r"),
  studyId: "demo-survey",
  participant: "P" + (i + 1),
  startedAt: iso(43200e3 - i * 1800e3),
  completedAt: iso(43200e3 - i * 1800e3 - 90e3),
  durationMs: 95e3 + i * 11e3,
  preAnswers: [],
  postAnswers: [],
  data: {
    answers: [
      { questionId: "sq1", value: rating },
      { questionId: "sq2", value: choice },
      ...(text ? [{ questionId: "sq3", value: text }] : []),
    ],
  },
}));

// ---------- write ----------
const studies = [cardSort, treeTest, firstClick, survey].map((s) => ({
  ...s,
  ownerId: demoUser.id,
}));
const db = {
  users: [demoUser],
  sessions: [],
  studies,
  responses: [...cardSortResponses, ...treeResponses, ...fcResponses, ...surveyResponses],
};
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 1));
console.log(
  `Seeded ${db.studies.length} studies, ${db.responses.length} responses → ${DB_FILE}`
);
console.log(`Demo account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
