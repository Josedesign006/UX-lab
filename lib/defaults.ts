import { uid } from "./db";
import { Study, StudyConfig, StudyType } from "./types";

export function defaultConfig(type: StudyType): StudyConfig {
  switch (type) {
    case "card-sort":
      return {
        kind: "card-sort",
        sortType: "open",
        cards: [
          { id: uid("c"), label: "Card 1" },
          { id: uid("c"), label: "Card 2" },
          { id: uid("c"), label: "Card 3" },
        ],
        categories: [],
        shuffleCards: true,
        requireAllCards: true,
      };
    case "tree-test":
      return {
        kind: "tree-test",
        tree: [
          {
            id: uid("n"),
            label: "Home",
            children: [
              { id: uid("n"), label: "Products", children: [] },
              { id: uid("n"), label: "About", children: [] },
            ],
          },
        ],
        tasks: [],
        shuffleTasks: false,
      };
    case "first-click":
      return { kind: "first-click", tasks: [] };
    case "survey":
      return { kind: "survey", questions: [] };
    case "prototype":
      return { kind: "prototype", screens: [], tasks: [] };
    case "usability":
      return {
        kind: "usability",
        tasks: [],
        askDifficulty: true,
        askComment: true,
      };
  }
}

export function newStudy(type: StudyType, name: string): Study {
  const now = new Date().toISOString();
  return {
    id: uid("s"),
    type,
    name,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    welcomeMessage:
      "Welcome, and thank you for taking part in this study! It only takes a few minutes — there are no right or wrong answers.",
    instructions: "",
    thankYouMessage: "All done — thank you for your time! You can now close this window.",
    preQuestions: [],
    postQuestions: [],
    config: defaultConfig(type),
  };
}
